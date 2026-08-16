# BEC Progress Assistant — PRD

## Original Problem Statement
Build an app where the user records voice or video (or writes) and gets near real-time feedback and progress monitoring of weaknesses in grammar, word choice, and pronunciation (complete with phonetic/IPA symbols), plus strategic guidance to improve their Business English — supporting both speaking and writing checks in one app.

## Architecture
- **Frontend**: React 19, Tailwind, shadcn/ui, recharts, framer motion. JWT stored in localStorage (Authorization: Bearer). Routes: /, /auth, /dashboard, /speaking, /writing, /history, /session/:id.
- **Backend**: FastAPI (all routes /api). MongoDB (motor). JWT email/password auth (bcrypt).
- **AI**: GPT-5.4 (emergentintegrations LlmChat) for structured analysis JSON; OpenAI Whisper (whisper-1) for speech-to-text.

## User Personas
- English learner preparing for Business English Certificate / improving professional English.

## Core Requirements (static)
- Record voice/video, transcribe, analyse speaking.
- Write text, analyse writing.
- Feedback: grammar, word choice, pronunciation + IPA, CEFR level, scores, strategic advice.
- Progress dashboard + history persistence per user.

## Implemented (2026-06)
- JWT auth (register/login/me) with seeded admin@bec.app & demo@bec.app.
- Speaking analysis: audio/video MediaRecorder -> Whisper transcript -> GPT-5.4 structured analysis (grammar, word choice, pronunciation w/ IPA, fluency, strategic advice).
- Writing analysis: text -> GPT-5.4 structured analysis incl. polished rewrite.
- Sessions CRUD + progress aggregation (avg score, CEFR, timeline, radar skill breakdown, recurring weaknesses, latest advice).
- Full UI: landing, auth, dashboard (charts), speaking recorder, writing editor, history, session detail.
- Tested: 17/17 backend, all non-mic frontend flows pass.

## Backlog
- P1: Exercise/verify live speaking recording end-to-end with real audio.
- P2: Mongo-side aggregation for progress at scale; explicit CORS origins if cookies adopted.
- P2: Downloadable reports; goal setting; daily streaks.

## Notes
- Speaking endpoint implemented per Whisper playbook but not yet verified with real recorded audio (browser mic).
