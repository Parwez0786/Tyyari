# Architecture — Phase 1

Frontends never call services directly. The browser talks only to Spring Cloud Gateway.

```
web :3000  ─┐
admin :3001─┼─► api-gateway :8080
            │        │
            │        ├─► auth-service    :8081  (auth_db, Redis)
            │        ├─► user-service    :8082  (user_db)
            │        ├─► content-service :8083  (content_db, Redis)
            │        └─► admin-service   :8084  (facade → content + auth)
            │
            └── MongoDB / Redis / Kafka (KRaft)
```

## Security

Gateway validates JWT (signature, expiry, issuer), then forwards `X-User-Id` and `X-User-Role`. Admin routes require `ADMIN`. Redis rate limits: anonymous 100/min, authenticated 300/min, admin 1000/min. Every request gets `X-Correlation-ID`.

## Events

Synchronous path for login. Kafka for `USER_REGISTERED`, `USER_DELETE_REQUESTED`, and content mutations so later services (progress, notifications, AI) can subscribe without coupling.

Topics: `user-events`, `user-events.DLT`, `content-events`, `audit-events`.

Account delete is async: admin queues `USER_DELETE_REQUESTED` after locking the login (`DELETING` + session ban). Auth and user-service consume independently, retry with exponential backoff, then dead-letter.

## Content model

One `questions` collection. `type` is `DSA | HLD | LLD | CS | FRONTEND | OA`. Optional `subType` (e.g. DBMS). Solutions are never returned on the public detail API.
