from dotenv import load_dotenv
from pathlib import Path

ROOT_DIR = Path(__file__).parent
load_dotenv(ROOT_DIR / '.env')

import os
import json
import uuid
import logging
import bcrypt
import jwt
from datetime import datetime, timezone, timedelta
from typing import List, Optional, Annotated

from fastapi import FastAPI, APIRouter, HTTPException, Depends, Request, UploadFile, File, Form
from fastapi.security import HTTPBearer
from starlette.middleware.cors import CORSMiddleware
from motor.motor_asyncio import AsyncIOMotorClient
from pydantic import BaseModel, Field, EmailStr, BeforeValidator, ConfigDict
from bson import ObjectId

from emergentintegrations.llm.chat import LlmChat, UserMessage
from emergentintegrations.llm.openai import OpenAISpeechToText

# ------------------------------------------------------------------ config
mongo_url = os.environ['MONGO_URL']
client = AsyncIOMotorClient(mongo_url)
db = client[os.environ['DB_NAME']]

EMERGENT_LLM_KEY = os.environ['EMERGENT_LLM_KEY']
JWT_SECRET = os.environ['JWT_SECRET']
JWT_ALGORITHM = "HS256"

logging.basicConfig(level=logging.INFO, format='%(asctime)s - %(name)s - %(levelname)s - %(message)s')
logger = logging.getLogger("bec")

app = FastAPI(title="BEC Progress Assistant")
api_router = APIRouter(prefix="/api")
security = HTTPBearer(auto_error=False)


# ------------------------------------------------------------------ models
PyObjectId = Annotated[str, BeforeValidator(str)]


def hash_password(password: str) -> str:
    return bcrypt.hashpw(password.encode("utf-8"), bcrypt.gensalt()).decode("utf-8")


def verify_password(plain: str, hashed: str) -> bool:
    return bcrypt.checkpw(plain.encode("utf-8"), hashed.encode("utf-8"))


def create_token(user_id: str, email: str) -> str:
    payload = {
        "sub": user_id,
        "email": email,
        "exp": datetime.now(timezone.utc) + timedelta(days=7),
        "type": "access",
    }
    return jwt.encode(payload, JWT_SECRET, algorithm=JWT_ALGORITHM)


class RegisterInput(BaseModel):
    name: str
    email: EmailStr
    password: str


class LoginInput(BaseModel):
    email: EmailStr
    password: str


class WritingInput(BaseModel):
    text: str
    prompt: Optional[str] = None


async def get_current_user(request: Request) -> dict:
    token = None
    auth_header = request.headers.get("Authorization", "")
    if auth_header.startswith("Bearer "):
        token = auth_header[7:]
    if not token:
        token = request.cookies.get("access_token")
    if not token:
        raise HTTPException(status_code=401, detail="Not authenticated")
    try:
        payload = jwt.decode(token, JWT_SECRET, algorithms=[JWT_ALGORITHM])
        try:
            oid = ObjectId(payload["sub"])
        except Exception:
            raise HTTPException(status_code=401, detail="Invalid token")
        user = await db.users.find_one({"_id": oid})
        if not user:
            raise HTTPException(status_code=401, detail="User not found")
        user["id"] = str(user["_id"])
        user.pop("_id", None)
        user.pop("password_hash", None)
        return user
    except jwt.ExpiredSignatureError:
        raise HTTPException(status_code=401, detail="Token expired")
    except jwt.InvalidTokenError:
        raise HTTPException(status_code=401, detail="Invalid token")


# ------------------------------------------------------------------ LLM analysis
SPEAKING_SYSTEM = """You are an expert Business English Certificate (BEC) speaking examiner and pronunciation coach (CEFR aligned).
You will receive a transcript of a learner speaking English. Analyse it thoroughly and reply with STRICT JSON only (no markdown, no code fences).

The JSON schema MUST be exactly:
{
  "cefr_level": "A1|A2|B1|B2|C1|C2 estimate",
  "overall_score": <int 0-100>,
  "scores": {"grammar": <int 0-100>, "vocabulary": <int 0-100>, "pronunciation": <int 0-100>, "fluency": <int 0-100>},
  "summary": "<2-3 sentence encouraging overview in English>",
  "grammar_issues": [{"original": "<phrase said>", "correction": "<corrected phrase>", "explanation": "<why, plain English>"}],
  "word_choice": [{"original": "<word/phrase used>", "suggestion": "<better business-English word/phrase>", "reason": "<why it is more appropriate>"}],
  "pronunciation": [{"word": "<word likely mispronounced or tricky>", "ipa": "<full IPA phonetic transcription with slashes e.g. /prəˌnʌn.siˈeɪ.ʃən/>", "tip": "<clear articulation tip>"}],
  "strategic_advice": ["<actionable strategic step to improve>", "..."]
}
Always include at least 3 pronunciation entries with correct IPA symbols. Provide 2-5 strategic_advice items. If no issues in a category, return an empty array. Never wrap output in markdown."""

WRITING_SYSTEM = """You are an expert Business English Certificate (BEC) writing examiner (CEFR aligned).
You will receive a piece of writing from a learner. Analyse it thoroughly and reply with STRICT JSON only (no markdown, no code fences).

The JSON schema MUST be exactly:
{
  "cefr_level": "A1|A2|B1|B2|C1|C2 estimate",
  "overall_score": <int 0-100>,
  "scores": {"grammar": <int 0-100>, "vocabulary": <int 0-100>, "coherence": <int 0-100>, "task_achievement": <int 0-100>},
  "summary": "<2-3 sentence encouraging overview in English>",
  "grammar_issues": [{"original": "<phrase from text>", "correction": "<corrected phrase>", "explanation": "<why, plain English>"}],
  "word_choice": [{"original": "<word/phrase used>", "suggestion": "<better business-English word/phrase>", "reason": "<why it is more appropriate>"}],
  "improved_version": "<a polished, business-appropriate rewrite of the whole text>",
  "strategic_advice": ["<actionable strategic step to improve>", "..."]
}
Provide 2-5 strategic_advice items. If no issues in a category, return an empty array. Never wrap output in markdown."""


def _strip_json(text: str) -> dict:
    text = text.strip()
    if text.startswith("```"):
        text = text.split("```", 2)[1] if "```" in text else text
        if text.startswith("json"):
            text = text[4:]
        text = text.strip("`").strip()
    start = text.find("{")
    end = text.rfind("}")
    if start != -1 and end != -1:
        text = text[start:end + 1]
    return json.loads(text)


async def run_llm(system_message: str, user_text: str) -> dict:
    chat = LlmChat(
        api_key=EMERGENT_LLM_KEY,
        session_id=f"bec-{uuid.uuid4()}",
        system_message=system_message,
    ).with_model("openai", "gpt-5.4")
    response = await chat.send_message(UserMessage(text=user_text))
    return _strip_json(response)


# ------------------------------------------------------------------ auth routes
@api_router.post("/auth/register")
async def register(data: RegisterInput):
    email = data.email.lower()
    if await db.users.find_one({"email": email}):
        raise HTTPException(status_code=400, detail="Email already registered")
    doc = {
        "name": data.name,
        "email": email,
        "password_hash": hash_password(data.password),
        "role": "user",
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    result = await db.users.insert_one(doc)
    uid = str(result.inserted_id)
    token = create_token(uid, email)
    return {"token": token, "user": {"id": uid, "name": data.name, "email": email, "role": "user"}}


@api_router.post("/auth/login")
async def login(data: LoginInput):
    email = data.email.lower()
    user = await db.users.find_one({"email": email})
    if not user or not verify_password(data.password, user["password_hash"]):
        raise HTTPException(status_code=401, detail="Invalid email or password")
    uid = str(user["_id"])
    token = create_token(uid, email)
    return {"token": token, "user": {"id": uid, "name": user["name"], "email": email, "role": user.get("role", "user")}}


@api_router.get("/auth/me")
async def me(user: dict = Depends(get_current_user)):
    return user


# ------------------------------------------------------------------ analysis routes
async def _save_session(user_id: str, mode: str, content: str, analysis: dict, extra: dict = None):
    doc = {
        "user_id": user_id,
        "mode": mode,
        "content": content,
        "analysis": analysis,
        "overall_score": analysis.get("overall_score", 0),
        "cefr_level": analysis.get("cefr_level", ""),
        "created_at": datetime.now(timezone.utc).isoformat(),
    }
    if extra:
        doc.update(extra)
    result = await db.sessions.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc.pop("_id", None)
    return doc


@api_router.post("/speaking/analyze")
async def analyze_speaking(user: dict = Depends(get_current_user), audio: UploadFile = File(...)):
    content = await audio.read()
    if len(content) == 0:
        raise HTTPException(status_code=400, detail="Empty audio file")

    tmp_path = f"/tmp/{uuid.uuid4()}_{audio.filename or 'rec.webm'}"
    with open(tmp_path, "wb") as f:
        f.write(content)
    try:
        stt = OpenAISpeechToText(api_key=EMERGENT_LLM_KEY)
        with open(tmp_path, "rb") as af:
            resp = await stt.transcribe(file=af, model="whisper-1", response_format="json", language="en")
        transcript = (resp.text or "").strip()
    except Exception as e:
        logger.error(f"Transcription failed: {e}")
        raise HTTPException(status_code=500, detail=f"Transcription failed: {e}")
    finally:
        try:
            os.remove(tmp_path)
        except OSError:
            pass

    if not transcript:
        raise HTTPException(status_code=400, detail="No speech detected. Please record again and speak clearly.")

    try:
        analysis = await run_llm(SPEAKING_SYSTEM, f"Transcript of the learner speaking:\n\n{transcript}")
    except Exception as e:
        logger.error(f"LLM analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")

    session = await _save_session(user["id"], "speaking", transcript, analysis, {"transcript": transcript})
    return session


@api_router.post("/writing/analyze")
async def analyze_writing(data: WritingInput, user: dict = Depends(get_current_user)):
    text = data.text.strip()
    if len(text) < 10:
        raise HTTPException(status_code=400, detail="Please write at least a few sentences to analyse.")
    prompt_ctx = f"Writing task/prompt: {data.prompt}\n\n" if data.prompt else ""
    try:
        analysis = await run_llm(WRITING_SYSTEM, f"{prompt_ctx}Learner's writing:\n\n{text}")
    except Exception as e:
        logger.error(f"LLM analysis failed: {e}")
        raise HTTPException(status_code=500, detail=f"Analysis failed: {e}")
    session = await _save_session(user["id"], "writing", text, analysis, {"prompt": data.prompt})
    return session


@api_router.get("/sessions")
async def list_sessions(user: dict = Depends(get_current_user), mode: Optional[str] = None):
    query = {"user_id": user["id"]}
    if mode:
        query["mode"] = mode
    cursor = db.sessions.find(query).sort("created_at", -1)
    out = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        doc.pop("_id", None)
        out.append(doc)
    return out


@api_router.get("/sessions/{session_id}")
async def get_session(session_id: str, user: dict = Depends(get_current_user)):
    doc = await db.sessions.find_one({"_id": ObjectId(session_id), "user_id": user["id"]})
    if not doc:
        raise HTTPException(status_code=404, detail="Session not found")
    doc["id"] = str(doc["_id"])
    doc.pop("_id", None)
    return doc


@api_router.delete("/sessions/{session_id}")
async def delete_session(session_id: str, user: dict = Depends(get_current_user)):
    result = await db.sessions.delete_one({"_id": ObjectId(session_id), "user_id": user["id"]})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Session not found")
    return {"ok": True}


@api_router.get("/progress")
async def progress(user: dict = Depends(get_current_user)):
    cursor = db.sessions.find({"user_id": user["id"]}).sort("created_at", 1)
    sessions = []
    async for doc in cursor:
        sessions.append(doc)

    total = len(sessions)
    speaking = [s for s in sessions if s["mode"] == "speaking"]
    writing = [s for s in sessions if s["mode"] == "writing"]

    def avg_scores(items):
        keys = {}
        for s in items:
            for k, v in s.get("analysis", {}).get("scores", {}).items():
                keys.setdefault(k, []).append(v)
        return {k: round(sum(v) / len(v)) for k, v in keys.items()} if keys else {}

    timeline = [
        {
            "date": s["created_at"][:10],
            "mode": s["mode"],
            "score": s.get("overall_score", 0),
        }
        for s in sessions
    ]

    # aggregate top weaknesses
    weakness_counter = {}
    for s in sessions:
        a = s.get("analysis", {})
        for g in a.get("grammar_issues", []):
            key = g.get("explanation", "").strip()
            if key:
                weakness_counter[key] = weakness_counter.get(key, 0) + 1
    top_weaknesses = sorted(weakness_counter.items(), key=lambda x: -x[1])[:5]

    latest_advice = sessions[-1].get("analysis", {}).get("strategic_advice", []) if sessions else []

    return {
        "total_sessions": total,
        "speaking_count": len(speaking),
        "writing_count": len(writing),
        "avg_overall": round(sum(s.get("overall_score", 0) for s in sessions) / total) if total else 0,
        "latest_cefr": sessions[-1].get("cefr_level", "") if sessions else "",
        "speaking_scores": avg_scores(speaking),
        "writing_scores": avg_scores(writing),
        "timeline": timeline,
        "top_weaknesses": [{"issue": k, "count": v} for k, v in top_weaknesses],
        "latest_advice": latest_advice,
    }


# ------------------------------------------------------------------ startup
@api_router.get("/")
async def root():
    return {"message": "BEC Progress Assistant API"}


@app.on_event("startup")
async def startup():
    await db.users.create_index("email", unique=True)
    await db.sessions.create_index("user_id")
    for email_env, pw_env, name, role in [
        (os.environ.get("ADMIN_EMAIL"), os.environ.get("ADMIN_PASSWORD"), "Admin", "admin"),
        (os.environ.get("DEMO_EMAIL"), os.environ.get("DEMO_PASSWORD"), "Demo User", "user"),
    ]:
        if not email_env:
            continue
        email_env = email_env.lower()
        existing = await db.users.find_one({"email": email_env})
        if not existing:
            await db.users.insert_one({
                "name": name, "email": email_env, "password_hash": hash_password(pw_env),
                "role": role, "created_at": datetime.now(timezone.utc).isoformat(),
            })
        elif not verify_password(pw_env, existing["password_hash"]):
            await db.users.update_one({"email": email_env}, {"$set": {"password_hash": hash_password(pw_env)}})
    logger.info("Startup seeding complete")


app.include_router(api_router)

app.add_middleware(
    CORSMiddleware,
    allow_credentials=True,
    allow_origins=os.environ.get('CORS_ORIGINS', '*').split(','),
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.on_event("shutdown")
async def shutdown_db_client():
    client.close()
