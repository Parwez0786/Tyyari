# API — Phase 1

Base URL: `http://localhost:8080`

Authenticated routes: `Authorization: Bearer <accessToken>`.

## Envelope

Success:

```json
{ "success": true, "data": {}, "message": "Success" }
```

Error:

```json
{ "success": false, "error": { "code": "QUESTION_NOT_FOUND", "message": "Question not found" } }
```

## Auth

| Method | Path |
| --- | --- |
| POST | `/api/v1/auth/register` |
| POST | `/api/v1/auth/login` |
| POST | `/api/v1/auth/refresh` |
| POST | `/api/v1/auth/logout` |
| GET | `/api/v1/auth/me` |
| POST | `/api/v1/auth/verify-email` |
| POST | `/api/v1/auth/forgot-password` |
| POST | `/api/v1/auth/reset-password` |
| POST | `/api/v1/auth/google` |
| POST | `/api/v1/auth/github` |
| GET | `/api/v1/auth/public-config` |

## Users

| Method | Path |
| --- | --- |
| GET/PUT | `/api/v1/users/me` |
| GET/PUT | `/api/v1/users/me/preferences` |
| GET/POST/PUT | `/api/v1/users/me/goals` |

## Content

| Method | Path |
| --- | --- |
| GET | `/api/v1/questions?type=&difficulty=&company=&topic=&tag=&search=&page=&limit=&sort=` |
| GET | `/api/v1/questions/:id` |
| GET | `/api/v1/questions/:id/hints` |
| GET | `/api/v1/companies` `/api/v1/topics` `/api/v1/tags` |

## Admin (`ADMIN` role)

Question, company, topic, tag CRUD plus `PATCH /api/v1/admin/questions/:id/publish`. User list: `GET /api/v1/admin/users`.
