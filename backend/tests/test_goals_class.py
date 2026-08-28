"""Tests for iteration-5 features: weekly goals (PUT /api/goals),
weekly block in GET /api/progress, and teacher-only GET /api/admin/students."""
import os

import pytest
import requests
from dotenv import dotenv_values

frontend_env = dotenv_values("/app/frontend/.env")
base_url = os.environ.get("REACT_APP_BACKEND_URL") or frontend_env.get("REACT_APP_BACKEND_URL")
if not base_url:
    raise RuntimeError("REACT_APP_BACKEND_URL missing")
API = base_url.rstrip("/") + "/api"

DEMO = {"email": "demo@bec.app", "password": "demo123"}
ADMIN = {"email": "admin@bec.app", "password": "admin123"}


def login(creds):
    r = requests.post(f"{API}/auth/login", json=creds, timeout=30)
    if r.status_code != 200:
        pytest.fail(f"login failed for {creds['email']}: {r.status_code} {r.text[:300]}")
    body = r.json()
    return body["token"], body["user"]


@pytest.fixture(scope="module")
def demo_auth():
    token, user = login(DEMO)
    return {"Authorization": f"Bearer {token}"}, user


@pytest.fixture(scope="module")
def admin_auth():
    token, user = login(ADMIN)
    return {"Authorization": f"Bearer {token}"}, user


# ---------------------------------------------------------------- PUT /api/goals
class TestGoals:
    def test_goals_requires_auth(self):
        r = requests.put(f"{API}/goals", json={"speaking": 4, "writing": 2}, timeout=30)
        assert r.status_code in (401, 403), r.text

    def test_update_goals_and_persist(self, demo_auth):
        headers, _ = demo_auth
        r = requests.put(f"{API}/goals", json={"speaking": 7, "writing": 4}, headers=headers, timeout=30)
        assert r.status_code == 200, r.text
        data = r.json()
        assert data["speaking"] == 7 and data["writing"] == 4

        p = requests.get(f"{API}/progress", headers=headers, timeout=30)
        assert p.status_code == 200
        weekly = p.json()["weekly"]
        assert weekly["speaking_goal"] == 7
        assert weekly["writing_goal"] == 4

    def test_goals_validation_out_of_range(self, demo_auth):
        headers, _ = demo_auth
        for payload in ({"speaking": 51, "writing": 3}, {"speaking": -1, "writing": 3},
                        {"speaking": 5, "writing": 51}, {"speaking": "a", "writing": 3}):
            r = requests.put(f"{API}/goals", json=payload, headers=headers, timeout=30)
            assert r.status_code == 422, f"{payload} -> {r.status_code}"

    def test_goals_boundaries(self, demo_auth):
        headers, _ = demo_auth
        for payload in ({"speaking": 0, "writing": 0}, {"speaking": 50, "writing": 50}):
            r = requests.put(f"{API}/goals", json=payload, headers=headers, timeout=30)
            assert r.status_code == 200, r.text
        # restore defaults
        requests.put(f"{API}/goals", json={"speaking": 5, "writing": 3}, headers=headers, timeout=30)


# ---------------------------------------------------------------- GET /api/progress weekly
class TestProgressWeekly:
    def test_weekly_shape(self, demo_auth):
        headers, _ = demo_auth
        r = requests.get(f"{API}/progress", headers=headers, timeout=30)
        assert r.status_code == 200, r.text
        weekly = r.json()["weekly"]
        for key in ("week_start", "speaking_done", "writing_done", "speaking_goal", "writing_goal"):
            assert key in weekly, f"missing {key}"
        assert len(weekly["week_start"]) == 10
        assert isinstance(weekly["speaking_done"], int)
        assert isinstance(weekly["writing_done"], int)

    def test_defaults_for_new_user(self):
        """Fresh account never set goals -> defaults 5/3."""
        import uuid
        email = f"TEST_goals_{uuid.uuid4().hex[:8]}@example.com"
        r = requests.post(f"{API}/auth/register",
                          json={"name": "TEST Goals", "email": email, "password": "pass1234"}, timeout=30)
        assert r.status_code == 200, r.text
        headers = {"Authorization": f"Bearer {r.json()['token']}"}
        p = requests.get(f"{API}/progress", headers=headers, timeout=30)
        assert p.status_code == 200
        weekly = p.json()["weekly"]
        assert weekly["speaking_goal"] == 5
        assert weekly["writing_goal"] == 3
        assert weekly["speaking_done"] == 0 and weekly["writing_done"] == 0

    def test_progress_requires_auth(self):
        r = requests.get(f"{API}/progress", timeout=30)
        assert r.status_code in (401, 403)


# ---------------------------------------------------------------- GET /api/admin/students
class TestAdminStudents:
    def test_no_token(self):
        r = requests.get(f"{API}/admin/students", timeout=60)
        assert r.status_code in (401, 403)

    def test_forbidden_for_regular_user(self, demo_auth):
        headers, _ = demo_auth
        r = requests.get(f"{API}/admin/students", headers=headers, timeout=60)
        assert r.status_code == 403, r.text

    def test_admin_role(self, admin_auth):
        _, user = admin_auth
        assert user.get("role") == "admin", user

    def test_admin_students_list(self, admin_auth):
        headers, _ = admin_auth
        r = requests.get(f"{API}/admin/students", headers=headers, timeout=180)
        assert r.status_code == 200, r.text[:300]
        data = r.json()
        assert isinstance(data, list) and len(data) > 0
        s = data[0]
        for key in ("id", "name", "email", "total_sessions", "speaking_count",
                    "writing_count", "avg_overall", "latest_cefr", "last_active"):
            assert key in s, f"missing {key}"
        assert "_id" not in s
        assert isinstance(s["total_sessions"], int)
        emails = [x["email"] for x in data]
        assert "demo@bec.app" in emails
        assert "admin@bec.app" not in emails, "admin should not be listed as student"
