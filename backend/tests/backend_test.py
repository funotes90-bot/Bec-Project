"""Backend tests for BEC Progress Assistant."""
import os
import uuid
import pytest
import requests

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', 'https://efl-real-time-coach.preview.emergentagent.com').rstrip('/')
API = f"{BASE_URL}/api"

DEMO_EMAIL = "demo@bec.app"
DEMO_PASSWORD = "demo123"


# -------------------- fixtures --------------------
@pytest.fixture(scope="session")
def demo_token():
    r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}, timeout=30)
    assert r.status_code == 200, f"demo login failed: {r.status_code} {r.text}"
    return r.json()["token"]


@pytest.fixture(scope="session")
def demo_headers(demo_token):
    return {"Authorization": f"Bearer {demo_token}"}


# -------------------- auth --------------------
class TestAuth:
    def test_root(self):
        r = requests.get(f"{API}/", timeout=15)
        assert r.status_code == 200
        assert "message" in r.json()

    def test_register_new_user(self):
        email = f"TEST_{uuid.uuid4().hex[:8]}@bec.app"
        r = requests.post(f"{API}/auth/register", json={
            "name": "Test User", "email": email, "password": "pass1234"
        }, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "token" in data and isinstance(data["token"], str) and len(data["token"]) > 10
        assert data["user"]["email"] == email.lower()
        assert data["user"]["role"] == "user"
        assert "id" in data["user"]

    def test_register_duplicate_rejected(self):
        r = requests.post(f"{API}/auth/register", json={
            "name": "Dup", "email": DEMO_EMAIL, "password": "whatever"
        }, timeout=30)
        assert r.status_code == 400

    def test_login_demo(self):
        r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": DEMO_PASSWORD}, timeout=30)
        assert r.status_code == 200
        assert r.json()["user"]["email"] == DEMO_EMAIL

    def test_login_invalid(self):
        r = requests.post(f"{API}/auth/login", json={"email": DEMO_EMAIL, "password": "wrong"}, timeout=30)
        assert r.status_code == 401

    def test_me_with_token(self, demo_headers):
        r = requests.get(f"{API}/auth/me", headers=demo_headers, timeout=15)
        assert r.status_code == 200
        assert r.json()["email"] == DEMO_EMAIL
        assert "password_hash" not in r.json()

    def test_me_without_token(self):
        r = requests.get(f"{API}/auth/me", timeout=15)
        assert r.status_code == 401


# -------------------- protection --------------------
class TestProtection:
    @pytest.mark.parametrize("path,method", [
        ("/sessions", "GET"),
        ("/progress", "GET"),
        ("/writing/analyze", "POST"),
    ])
    def test_requires_auth(self, path, method):
        r = requests.request(method, f"{API}{path}", json={"text": "hello world hello"}, timeout=15)
        assert r.status_code == 401


# -------------------- writing + sessions + progress --------------------
class TestWritingFlow:
    session_id = None

    def test_writing_short_text_rejected(self, demo_headers):
        r = requests.post(f"{API}/writing/analyze", headers=demo_headers, json={"text": "hi"}, timeout=30)
        assert r.status_code == 400

    def test_writing_analyze(self, demo_headers):
        text = ("Dear Sir, I writing to you regarding the meeting yesterday. "
                "We was discuss about the new project and I think we need more resource. "
                "Please to inform me when you are available for a call. Best regard.")
        r = requests.post(f"{API}/writing/analyze", headers=demo_headers, json={"text": text}, timeout=180)
        assert r.status_code == 200, r.text
        data = r.json()
        assert "id" in data
        assert data["mode"] == "writing"
        a = data["analysis"]
        for key in ["cefr_level", "overall_score", "scores", "summary",
                    "grammar_issues", "word_choice", "improved_version", "strategic_advice"]:
            assert key in a, f"missing key {key} in analysis"
        for sk in ["grammar", "vocabulary", "coherence", "task_achievement"]:
            assert sk in a["scores"], f"missing score {sk}"
        assert isinstance(a["overall_score"], int)
        TestWritingFlow.session_id = data["id"]

    def test_sessions_list(self, demo_headers):
        r = requests.get(f"{API}/sessions", headers=demo_headers, timeout=30)
        assert r.status_code == 200
        sessions = r.json()
        assert isinstance(sessions, list)
        assert any(s["id"] == TestWritingFlow.session_id for s in sessions)

    def test_sessions_filter_writing(self, demo_headers):
        r = requests.get(f"{API}/sessions?mode=writing", headers=demo_headers, timeout=30)
        assert r.status_code == 200
        assert all(s["mode"] == "writing" for s in r.json())

    def test_session_get_by_id(self, demo_headers):
        assert TestWritingFlow.session_id, "no session created earlier"
        r = requests.get(f"{API}/sessions/{TestWritingFlow.session_id}", headers=demo_headers, timeout=30)
        assert r.status_code == 200
        assert r.json()["id"] == TestWritingFlow.session_id

    def test_progress(self, demo_headers):
        r = requests.get(f"{API}/progress", headers=demo_headers, timeout=30)
        assert r.status_code == 200
        p = r.json()
        for k in ["total_sessions", "avg_overall", "latest_cefr", "speaking_scores",
                  "writing_scores", "timeline", "top_weaknesses", "latest_advice"]:
            assert k in p, f"missing {k}"
        assert p["total_sessions"] >= 1
        assert isinstance(p["timeline"], list)

    def test_session_delete(self, demo_headers):
        assert TestWritingFlow.session_id
        r = requests.delete(f"{API}/sessions/{TestWritingFlow.session_id}", headers=demo_headers, timeout=30)
        assert r.status_code == 200
        # verify gone
        r2 = requests.get(f"{API}/sessions/{TestWritingFlow.session_id}", headers=demo_headers, timeout=15)
        assert r2.status_code == 404
