# Tyyari

SDE interview-prep platform backed by 6 microservices. Practice covers HLD Blueprint/Whiteboard, LLD multi-file coding, DSA with testcases, React frontend rounds with desktop/mobile preview, and timed camera-gated online assessments.

**Stack:** Java 21 · Spring Boot 3.4 · Spring Security · Spring Cloud Gateway · MongoDB · Redis · Kafka · Maven · Docker · React (JavaScript) · Vite · Tailwind · Monaco Editor

## What works

| Track | What you get |
| --- | --- |
| **HLD** | Blueprint (node graph) or Whiteboard. Submit canvas, back-of-envelope math, and design explanation. |
| **LLD** | Multi-file Java / Python / C++ editor, Run against the local code runner. |
| **DSA** | Single-file editor, example testcases, Accepted / WA. |
| **Frontend** | `App.js` + `styles.css`, live desktop and mobile preview (no Piston). |
| **OA** | Timed DSA sets, camera required, per-question answers stored separately from practice. |
| **Sheets** | One fixed question set per track (same list for every user). Progress = practice submits. |
| **Dashboard** | Streak, weekly quest, badges, today’s quest, jump back in, company drill, OA lobby. |

**Practice** is the full question library. **Sheets** are curated sets. OA stays under Practice.

CS Fundamentals, Learn/Roadmap, Mock Interview, Premium payments, and HLD “Run AI Analysis” are still Coming soon.

## Layout

```
frontend/web                 Candidate app (React, port 3000)
frontend/admin               Admin console (React, port 3001)
services/api-gateway         JWT, CORS, rate limits, routing (8080)
services/auth-service        Register, login, refresh, email verify, Google/GitHub (8081)
services/user-service        Profile, goals, submissions, progress (8082)
services/content-service     Questions, companies, sheets, assessment sets (8083)
services/admin-service       Admin API, ADMIN role (8084)
services/code-runner         Isolated code execution (2000)
infrastructure/              MongoDB, Redis, Kafka, Mailpit
docs/                        Architecture, API, database notes
```

## Run

```bash
cp .env.example .env
docker compose up --build
```

Do not commit `.env`. Web and admin bind-mount source, so UI changes hot-reload. Java services need `docker compose up --build -d <service>` after backend edits. If APIs return 500 right after a rebuild, restart the gateway: `docker compose restart api-gateway`.

| App | URL |
| --- | --- |
| Candidate web | http://localhost:3000 |
| Admin console | http://localhost:3001 |
| API gateway | http://localhost:8080 |
| Code runner | http://localhost:2000 |
| Mail inbox (Mailpit) | http://localhost:8026 |
| MongoDB | localhost:27017 |
| Redis | localhost:6379 |
| Kafka | localhost:9092 |

| Account | Email | Password |
| --- | --- | --- |
| Demo user | demo@tyyari.dev | Demo@12345 |
| Admin | admin@tyyari.dev | Admin@12345 |

Google sign-in origin: `http://localhost:3000`. GitHub callback: `http://localhost:3000/auth/github`. Put client IDs/secrets and Gmail SMTP in `.env`, then restart `auth-service` and `api-gateway`. Without SMTP, Mailpit still shows outbound mail at `:8026`.

## Auth and data

- JWT access **15 minutes**, hashed refresh **7 days**.
- Register requires email verification. Google/GitHub and the seeded demo/admin accounts are already verified.
- Practice **Submit** upserts the last answer in `user_db.submissions` (DSA/LLD/HLD/Frontend). OA saves per user × assessment × question and does not count as sheet progress.
- Sheet completion is a practice submission for that `questionId`.

## Local services (without full compose)

```bash
docker compose up -d mongo redis kafka kafka-init mailpit

cd services/auth-service && mvn spring-boot:run
# user-service 8082, content-service 8083, admin-service 8084, api-gateway 8080

cd frontend/web && npm install && npm run dev
cd frontend/admin && npm install && npm run dev
```

Gateway routes `/api/v1/auth/**`, `/api/v1/users/**`, `/api/v1/questions/**`, `/api/v1/sheets/**`, `/api/v1/assessment-sets/**`, `/api/v1/admin/**`. The web app proxies `/api/piston` to the code runner.

See `docs/architecture`, `docs/api`, and `docs/database`.
