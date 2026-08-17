# Tyyari

ScaleMock-style interview preparation platform. Phase 1: authentication, profiles, question content, admin, API gateway, MongoDB, Redis, and Kafka.

**Stack:** Java 21 · Spring Boot 3 · Spring Security · Spring Cloud Gateway · MongoDB · Redis · Kafka · Maven · Docker · React (JavaScript) · Vite · Tailwind

## Layout

```
frontend/web              Candidate app (React)
frontend/admin            Admin console (React)
services/api-gateway      Routing, JWT, rate limits
services/auth-service     Register, login, refresh tokens
services/user-service     Profile, preferences, goals
services/content-service  Questions, companies, topics, tags
services/admin-service    Admin facade (ADMIN role)
infrastructure/           Docker, Kafka, MongoDB, Redis
docs/                     Architecture, API, database
```

## Run

```bash
cp .env.example .env
docker compose up --build
```

| App | URL |
| --- | --- |
| Candidate web | http://localhost:3000 |
| Admin console | http://localhost:3001 |
| API gateway | http://localhost:8080/actuator/health |
| Mail inbox (Mailpit) | http://localhost:8026 |

Google sign-in: authorized JavaScript origin `http://localhost:3000`. GitHub OAuth callback URL: `http://localhost:3000/auth/github`. Put client IDs/secrets and Gmail SMTP in `.env`, then restart `auth-service` and `api-gateway`.

Forgot-password and welcome emails send from Gmail using `MAIL_*` in `.env`.

| Account | Email | Password |
| --- | --- | --- |
| Admin | admin@tyyari.dev | Admin@12345 |
| Demo user | demo@tyyari.dev | Demo@12345 |

## Local services

```bash
docker compose up mongo redis kafka kafka-init

# each Java service
cd services/auth-service && mvn spring-boot:run

cd frontend/web && npm install && npm run dev
cd frontend/admin && npm install && npm run dev
```

Ports: gateway `8080`, auth `8081`, user `8082`, content `8083`, admin `8084`.

## Phase 1 flow

Register → login → onboarding (role, companies, experience) → dashboard → filter questions (DSA / HLD / LLD / CS / Frontend / OA, difficulty, company, topic, tags) → question detail.

Admin: create/edit/publish questions, companies, topics, tags, manage users.

See `docs/architecture`, `docs/api`, and `docs/database`.
