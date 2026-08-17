# Database — Phase 1

One MongoDB server, four databases.

## auth_db

- `users` — email (unique), passwordHash, role (`USER`/`ADMIN`/`EDITOR`), status, emailVerified
- `refresh_tokens` — userId, tokenHash, expiresAt, device
- `email_verification_tokens`
- `password_reset_tokens`

## user_db

- `profiles` — userId, name, avatar, bio, experience, currentRole, targetRole, skills
- `preferences` — preferredLanguage, theme, emailNotifications, difficultyPreference
- `goals` — targetCompanies, targetRole, targetDate, dailyGoalMinutes

## content_db

- `questions` — unified model with `type`, `subType`, topics, companies, tags, examples, constraints, hints, isPublished
- `companies`, `topics`, `tags`, `categories`

Indexes: `type+difficulty`, `type+companies`, `type+topics`, `tags`, `isPublished`, `slug`.

## admin_db

- `audit_logs`

## Redis

- `rate_limit:{id}` — gateway
- `question:{id}` — 30 minutes
- `companies:all`, `topics:{category}` — 6 hours
