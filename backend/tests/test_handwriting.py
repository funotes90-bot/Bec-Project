"""Tests for NEW endpoint POST /api/writing/analyze-image (handwriting photo -> GPT-5.4 vision)."""
import io
import os

import pytest
import requests
from PIL import Image, ImageDraw

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://speak-write-master-2.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@bec.app"
DEMO_PASSWORD = "demo123"

TEXT_LINES = [
    "Dear Mr Smith,",
    "I am writting to you about the meeting of next week.",
    "We must to discuss the new budget and the sales report.",
    "Please tell me if tuesday morning is good for you.",
    "Best regards, Anna",
]


def make_image_bytes(fmt="PNG"):
    img = Image.new("RGB", (900, 420), "white")
    d = ImageDraw.Draw(img)
    y = 30
    for line in TEXT_LINES:
        d.text((30, y), line, fill=(10, 10, 60))
        y += 70
    buf = io.BytesIO()
    img.save(buf, format=fmt)
    return buf.getvalue()


@pytest.fixture(scope="module")
def demo_headers():
    r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"demo login failed: {r.status_code} {r.text}"
    return {"Authorization": f"Bearer {r.json()['token']}"}


@pytest.fixture(scope="module")
def created_ids():
    return []


@pytest.fixture(scope="module", autouse=True)
def cleanup(demo_headers, created_ids):
    yield
    for sid in created_ids:
        requests.delete(f"{API}/sessions/{sid}", headers=demo_headers, timeout=30)


class TestAnalyzeImage:
    def test_requires_auth(self):
        files = {"image": ("hw.png", make_image_bytes(), "image/png")}
        r = requests.post(f"{API}/writing/analyze-image", files=files, timeout=60)
        assert r.status_code == 401, r.text

    def test_empty_image_400(self, demo_headers):
        files = {"image": ("empty.png", b"", "image/png")}
        r = requests.post(f"{API}/writing/analyze-image", files=files, headers=demo_headers, timeout=120)
        assert r.status_code == 400, r.text
        assert "Empty" in r.json().get("detail", "")

    def test_analyze_image_success_and_persistence(self, demo_headers, created_ids):
        files = {"image": ("hw.png", make_image_bytes(), "image/png")}
        data = {"prompt": "TEST_ Write an email to a colleague about next week's meeting."}
        r = requests.post(f"{API}/writing/analyze-image", files=files, data=data,
                          headers=demo_headers, timeout=300)
        assert r.status_code == 200, r.text
        session = r.json()
        assert "_id" not in session
        sid = session["id"]
        created_ids.append(sid)

        assert session["mode"] == "writing"
        assert session["handwriting"] is True
        assert session["prompt"] == data["prompt"]
        assert isinstance(session["content"], str) and len(session["content"]) > 0

        a = session["analysis"]
        for key in ["transcribed_text", "scores", "grammar_issues", "word_choice",
                    "improved_version", "strategic_advice", "handwriting_feedback",
                    "cefr_level", "overall_score", "summary"]:
            assert key in a, f"missing analysis key: {key}"
        for sk in ["grammar", "vocabulary", "coherence", "task_achievement"]:
            assert isinstance(a["scores"][sk], int), f"score {sk} not int: {a['scores'].get(sk)}"
            assert 0 <= a["scores"][sk] <= 100
        assert isinstance(a["grammar_issues"], list)
        assert isinstance(a["word_choice"], list)
        assert isinstance(a["strategic_advice"], list) and len(a["strategic_advice"]) >= 2
        transcribed = a["transcribed_text"].lower()
        assert len(transcribed) > 20, f"transcription too short: {transcribed!r}"
        assert "meeting" in transcribed, f"expected transcription to include text: {transcribed!r}"
        assert session["overall_score"] == a["overall_score"]
        assert session["cefr_level"] == a["cefr_level"]
        assert session["saved"] is False

        # verify persisted
        g = requests.get(f"{API}/sessions/{sid}", headers=demo_headers, timeout=30)
        assert g.status_code == 200
        got = g.json()
        assert got["handwriting"] is True
        assert got["analysis"]["transcribed_text"] == a["transcribed_text"]

        # appears in writing list
        lst = requests.get(f"{API}/sessions", params={"mode": "writing"}, headers=demo_headers, timeout=30)
        assert lst.status_code == 200
        assert sid in [s["id"] for s in lst.json()]

    def test_jpeg_image_supported(self, demo_headers, created_ids):
        files = {"image": ("hw.jpg", make_image_bytes("JPEG"), "image/jpeg")}
        r = requests.post(f"{API}/writing/analyze-image", files=files, headers=demo_headers, timeout=300)
        assert r.status_code == 200, r.text
        session = r.json()
        created_ids.append(session["id"])
        assert session["analysis"]["transcribed_text"].strip() != ""
        assert session["handwriting"] is True

    def test_missing_image_field_422(self, demo_headers):
        r = requests.post(f"{API}/writing/analyze-image", data={"prompt": "x"}, headers=demo_headers, timeout=60)
        assert r.status_code == 422, r.text
