# QuizSphere

**Smarter Exams. Faster Results. Better Learning.**

QuizSphere is a MERN online quiz and examination management system: teachers author timed quizzes,
students take server-timed attempts with automatic answer saving, and every submission is graded on
the server against an answer key the browser never sees. Analytics, results and reports are computed
from MongoDB, not from anything the client sends.

> **Status: Phase 1 complete — foundation + authentication.**
> Quizzes, the exam runner, grading, results and the invigilator centre are the next phases. Nothing
> in this repository is a mock: every screen you can reach is backed by a real endpoint, and the
> roadmap below lists what is genuinely still missing.

---

## Table of contents

- [What works today](#what-works-today)
- [Phase roadmap](#phase-roadmap)
- [Quick start](#quick-start)
- [Environment variables](#environment-variables)
- [Project structure](#project-structure)
- [REST API](#rest-api)
- [Security model](#security-model)
- [Testing](#testing)
- [Verification evidence](#verification-evidence)
- [Engineering decisions and known limitations](#engineering-decisions-and-known-limitations)
- [Troubleshooting](#troubleshooting)

---

## What works today

| Area | Delivered in Phase 1 |
| --- | --- |
| Backend foundation | Express 5 app factory, Zod-validated environment, MongoDB connection layer, structured logger, centralized error handler, request ids |
| Health | `GET /api/health` reports the API version, environment, uptime and the **real** database state (503 + `degraded` when MongoDB is unreachable) |
| Authentication | Register (students only), login, logout, session read, profile update, password change — JWT in an **httpOnly** cookie, never in localStorage |
| Auth hardening | bcrypt cost 12, password policy, account lockout after repeated failures, generic login errors, rate limiting, CSRF double-submit + origin checks, NoSQL-injection sanitizing, restricted CORS, Helmet |
| Audit trail | Append-only `AuditLog` records for register, login success/failure/lockout, logout, profile and password changes |
| Background jobs | `node-cron` job every minute that releases expired account lockouts (plus lazy release on the next sign-in attempt) |
| Seed data | `npm run seed` creates one clearly-labelled demo account per role (`seedData: true`), idempotently |
| Frontend foundation | React 19 + Vite, React Router, Tailwind v4 design tokens, glassmorphism design system, responsive shell with collapsible sidebar, toasts, modals, accessible form primitives |
| Public pages | Landing page (hero, product preview, features, five-step workflow, roles, security & integrity, tech stack, FAQ, CTA), Features, About, Help & FAQ, Contact, 404 |
| Account area | Dashboard (live platform status + account summary + role capabilities), My account (profile, password, session facts), sign-out with confirmation |

---

## Phase roadmap

| Phase | Contents | State |
| --- | --- | --- |
| 1 | Foundation, security middleware, authentication, seed, tests, design system, public site, account area | **Done** |
| 2 | User management (admin CRUD for users/roles/suspension), invigilator assignments, audit log viewer | Next |
| 3 | Quiz & question authoring: quiz settings, question editor, publish validation, versioning once attempts exist | Planned |
| 4 | Student dashboard, exam runner (server deadlines, autosave, reconnection, question palette), light mode | Planned |
| 5 | Grading engine, result review, dashboards with real statistics, CSV exports | Planned |
| 6 | Invigilator centre (live sessions, assistance requests, incidents), notifications | Planned |

---

## Quick start

### Prerequisites

- **Node.js 20+** (developed and verified on Node 26)
- **MongoDB** — any one of:
  - a local `mongod`, or
  - a MongoDB Atlas cluster (`mongodb+srv://…`), or
  - the bundled development helper below, if you have neither

### 1. Install

```bash
npm install          # installs both workspaces (server + client)
```

### 2. Configure

```bash
cp .env.example server/.env      # then edit JWT_SECRET and MONGO_URI
cp client/.env.example client/.env
```

Generate a real secret:

```bash
node -e "console.log(require('crypto').randomBytes(48).toString('hex'))"
```

The API loads the first existing file among: `$ENV_FILE`, `<cwd>/.env`, `server/.env`, `<repo>/.env`.

### 3. Get a database running

No `mongod` and no Atlas cluster? Run a throwaway in-memory MongoDB on port 27099:

```bash
npm run mongo:memory --workspace server
# → mongodb://127.0.0.1:27099/quizsphere   (data is discarded when the process exits)
```

Set that URI as `MONGO_URI`, then (in another terminal):

```bash
npm run seed         # creates the four demo accounts (development only)
```

### 4. Run

```bash
npm run dev          # API on :5000 and client on :5173 together
# or separately
npm run dev:server
npm run dev:client
```

Open <http://localhost:5173>. The Vite dev server proxies `/api` to the API, so the browser sees a
single origin and cookies work without any CORS configuration.

### 5. Verify

```bash
npm test             # server test suite (starts its own in-memory MongoDB)
npm run lint         # eslint for both workspaces
npm run build        # production build of the client
curl http://localhost:5000/api/health
```

### Demo accounts (development only)

Created by `npm run seed`, flagged `seedData: true`, password **`DemoPass123`**:

| Role | Email |
| --- | --- |
| Administrator | `admin@quizsphere.test` |
| Teacher | `teacher@quizsphere.test` |
| Student | `student@quizsphere.test` |
| Invigilator | `invigilator@quizsphere.test` |

The seed script refuses to run against `NODE_ENV=production` unless you pass `--force`, and the login
page only displays these credentials in a development build.

---

## Environment variables

### Server (`server/.env` or root `.env`)

| Variable | Default | Notes |
| --- | --- | --- |
| `NODE_ENV` | `development` | `production` enables strict checks and JSON logs |
| `PORT` | `5000` | Values outside 1–65535 (including an empty or `0` value from the host) are ignored with a warning |
| `MONGO_URI` | `mongodb://127.0.0.1:27017/quizsphere` | Must start with `mongodb://` or `mongodb+srv://` |
| `CLIENT_URL` | `http://localhost:5173` | Comma-separated CORS allowlist; must be `https://` in production |
| `TRUST_PROXY` | `0` | Set to `1` behind a reverse proxy |
| `LOG_LEVEL` | `info` | `debug`, `info`, `warn`, `error`, `silent` |
| `JWT_SECRET` | dev fallback | **Required in production**, ≥ 32 chars |
| `JWT_EXPIRES_IN` | `1d` | `900`, `30m`, `12h`, `7d` |
| `JWT_COOKIE_NAME` | `qs_token` | httpOnly session cookie |
| `COOKIE_SAME_SITE` | `lax` | Use `none` (with `COOKIE_SECURE=1`) only for cross-site deployments |
| `COOKIE_SECURE` | `0` | Must be `1` in production |
| `CSRF_COOKIE_NAME` / `CSRF_HEADER_NAME` | `qs_csrf` / `x-csrf-token` | Double-submit pair |
| `ACCOUNT_LOCK_MAX_ATTEMPTS` / `ACCOUNT_LOCK_MINUTES` | `5` / `15` | Lockout policy |
| `RATE_LIMIT_*` | see `.env.example` | Window, global, auth and write limits |
| `MONGO_MAX_POOL_SIZE` / `MONGO_SERVER_SELECTION_TIMEOUT_MS` | `10` / `5000` | Connection tuning |
| `EMAIL_*` | unset | **Optional.** Email is only ever used when all five values are present |

In production the server **refuses to start** if `JWT_SECRET` is still the development fallback, if
`COOKIE_SECURE` is off, or if `CLIENT_URL` is not HTTPS.

### Client (`client/.env`)

| Variable | Default | Notes |
| --- | --- | --- |
| `VITE_API_BASE_URL` | `/api` | Relative so the dev proxy / production reverse proxy handles routing |
| `VITE_APP_NAME` | `QuizSphere` | Shown in the navbar, footer and page titles |
| `VITE_CONTACT_EMAIL` | `support@quizsphere.example` | **Placeholder — replace before publishing** |

Only `VITE_*` values reach the browser. Never put a secret in `client/.env`.

---

## Project structure

```
.
├── .env.example                     # server env template
├── package.json                     # npm workspaces + combined scripts
├── server/
│   ├── .env.example
│   ├── eslint.config.js
│   ├── jest.config.js
│   ├── scripts/memory-mongo.js      # dev-only throwaway MongoDB
│   ├── src/
│   │   ├── app.js                   # middleware chain + routers
│   │   ├── server.js                # bootstrap, graceful shutdown, scheduler
│   │   ├── config/                  # env (Zod), db, constants
│   │   ├── controllers/             # auth, health
│   │   ├── middleware/              # auth, csrf, cors, validate, rateLimit, sanitize, errorHandler
│   │   ├── models/                  # User, AuditLog
│   │   ├── services/                # authService, tokenService, auditService
│   │   ├── routes/                  # index, auth, health
│   │   ├── validators/              # Zod schemas
│   │   ├── jobs/scheduler.js        # node-cron jobs
│   │   ├── seed/seed.js             # demo accounts
│   │   └── utils/                   # ApiError, asyncHandler, authCookies, logger, validation, duration
│   └── tests/
│       ├── globalSetup.js           # starts mongodb-memory-server
│       ├── helpers/                 # supertest client, db helpers
│       ├── integration/             # health, security, auth, jobs
│       └── unit/                    # sanitize, tokenService, middleware
└── client/
    ├── .env.example
    ├── eslint.config.js
    ├── vite.config.js               # React + Tailwind v4 plugins, /api proxy
    └── src/
        ├── api/                     # httpClient (CSRF + 401), authApi, healthApi
        ├── components/              # ui primitives, layout, home sections, routing guards
        ├── context/                 # AuthContext, ThemeContext, ToastContext
        ├── hooks/                   # useApiHealth, useMediaQuery, useSafeReturnUrl, useDocumentTitle
        ├── layouts/                 # PublicLayout, AppLayout
        ├── pages/                   # Home, Features, About, Help, Contact, Login, Register, Dashboard, Account, NotFound
        ├── utils/                   # appConfig, navigation, permissions, format, validation, cn
        └── styles/index.css         # Tailwind v4 tokens + base layer
```

---

## REST API

All responses use `{ "success": true, "data": … }` or `{ "success": false, "message": …, "errors": [{ "field", "message" }] }`.
Timestamps are ISO-8601 **UTC**; the client renders them in the viewer's locale.

| Method | Endpoint | Auth | Purpose |
| --- | --- | --- | --- |
| `GET` | `/` | — | Service banner |
| `GET` | `/api` | — | Service descriptor and endpoint index |
| `GET` | `/api/health` | — | Liveness + real database state (200 / 503) |
| `GET` | `/api/auth/csrf` | — | Issues the double-submit CSRF cookie and returns the token |
| `POST` | `/api/auth/register` | — | Creates a **student** account and starts a session (201) |
| `POST` | `/api/auth/login` | — | Signs in (200), generic 401 on bad credentials, 429 when locked |
| `POST` | `/api/auth/logout` | session | Clears the auth cookie |
| `GET` | `/api/auth/me` | session | Current profile + role label |
| `PATCH` | `/api/auth/profile` | session | Updates the display name |
| `PATCH` | `/api/auth/password` | session | Changes the password and invalidates older tokens |

Status codes used: `200`, `201`, `400` (malformed JSON / bad id), `401`, `403` (role, CSRF, origin),
`404`, `409` (duplicate email), `413` (oversized body), `422` (validation), `429` (rate limit /
lockout), `500`, `503` (database unreachable).

### Session behaviour

- The JWT is issued at login/registration/password change and stored in the `qs_token` **httpOnly**
  cookie. The API accepts a `Authorization: Bearer <token>` header for non-browser clients.
- Every unsafe request must carry `x-csrf-token` matching the readable `qs_csrf` cookie.
- Changing a password bumps `passwordChangedAt`; tokens issued earlier stop working immediately
  (`pwdv` claim), and the current session receives a fresh cookie so it is not logged out.
- A `401` anywhere clears client session state; protected pages redirect to
  `/login?returnUrl=…` and the user returns to the page they were on.

---

## Security model

| Control | Implementation |
| --- | --- |
| Password storage | bcrypt, cost **12**, `select: false` on the hash — it never leaves the database layer |
| Password policy | ≥ 8 characters with at least one letter and one number; > 72 bytes rejected instead of silently truncated |
| Token storage | httpOnly + SameSite cookie; **never** localStorage or sessionStorage |
| CSRF | Origin check **and** double-submit token, compared with `timingSafeEqual` on SHA-256 digests |
| Authorization | Role and ownership are re-read from the database on every request; a role change applies on the next request |
| Role injection | Public registration is a strict Zod object — `role`, `status` or any unknown key is a 422, and the role is hardcoded server-side |
| NoSQL injection | Recursive sanitizer strips `$`-prefixed and dotted keys from body, params and query (see [limitations](#engineering-decisions-and-known-limitations)) |
| Brute force | Rate limiting on auth routes + per-account lockout with a 429 and a recoverable message |
| Enumeration | Identical generic error for unknown email and wrong password, plus a dummy bcrypt comparison to equalise timing |
| Data exposure | `passwordHash`, lockout counters and stack traces never appear in responses; production logs are JSON without secrets |
| Transport/headers | Helmet (with `nosniff`, HSTS in production, no `x-powered-by`), restricted CORS allowlist, 32 kB body limit |
| Audit | Append-only log (no update/delete helpers, `updatedAt` disabled) |

### What this platform honestly does *not* do

- Browser-based proctoring is weak: this system cannot verify who is at the keyboard, detect a second
  device, or prove that tab-switching means cheating. Optional focus/fullscreen signals are
  informational only.
- **No webcam, microphone or biometric capture**, by design.
- Server-authoritative timing defeats clock tampering, not a determined human.
- Email notifications are only attempted when an email provider is configured; the UI never claims a
  message was delivered otherwise.

---

## Testing

```bash
npm test                                  # whole server suite
npm run test --workspace server -- auth   # single file/pattern
VERBOSE_TESTS=1 npm test                  # include request logs
```

The suite starts its own throwaway MongoDB (`mongodb-memory-server`) via `tests/globalSetup.js`; it
never touches a real database. If that binary cannot start, database-dependent suites are reported as
**skipped**, never as passing.

| Suite | Covers |
| --- | --- |
| `integration/health.test.js` | Health envelope, degraded reporting, hardening headers, 404 envelope |
| `integration/security.test.js` | CSRF (missing / mismatched / foreign origin), CORS allow/deny, NoSQL sanitizing end to end, rate limiting (429), malformed JSON |
| `integration/auth.test.js` | Register (student-only, duplicate, weak password, hash + cost verification), login (generic errors, lockout, cron unlock, suspended account), session (401/200, invalid token, logout), profile and password change with token invalidation |
| `integration/jobs.test.js` | Scheduler registration, expired lock release, active lock preserved |
| `unit/middleware.test.js` | Zod validation (strict objects, field errors), password policy, `requireRole`, error mapping (409/422/400/500/401) |
| `unit/tokenService.test.js` | Sign/verify round trip, tampered and foreign-secret tokens, expiry, documented clock-skew tolerance |
| `unit/sanitize.test.js` | Operator stripping, dotted keys, nested structures, legitimate `Date`/scalar passthrough |

**Current result:** 7 suites, **71 tests passing**, 0 failing.

---

## Verification evidence

Verified on Node v26.8.1 / npm 11.19.0 (Windows) against an in-memory MongoDB:

- `npm test` → `Test Suites: 7 passed, 7 total` / `Tests: 71 passed, 71 total`.
- `npm run lint` → clean for both workspaces (0 errors, 0 warnings).
- `npm run build --workspace client` → builds; initial JS is ~104 kB gzip because pages and the chart
  library are code-split (Recharts loads only with the landing-page preview).
- `GET /api/health` → `200 {"status":"ok", "database":{"status":"connected","connected":true}}`.
- Login without a CSRF header → `403`; with a foreign `Origin` → `403`; wrong password → `401`
  `"Invalid email or password"`; correct credentials → `200` + httpOnly cookie; `/api/auth/me` after
  logout → `401`; register with `"role":"admin"` → `422 Unrecognized key: "role"`.
- Browser (real Chromium against the dev server): registration → dashboard with live platform status
  and account data; profile rename persisted via a CSRF-protected `PATCH`; sign-out confirmation
  redirects to `/login?returnUrl=/account` and signing back in returns to `/account`; hard-reloading a
  protected page restores the session from the cookie. No console errors.
- Audit log inspected directly in MongoDB: `auth.register`, `auth.login_succeeded`,
  `auth.login_failed`, `auth.logout`, with actor, role, IP, metadata and no `updatedAt` field.

---

## Engineering decisions and known limitations

**`express-mongo-sanitize` was rejected (it breaks on Express 5).** The package assigns to
`req.query`, which Express 5 exposes as a prototype getter. Verified with Express 5.3.0 and the
package's own middleware:

```
{"err":"Cannot set property query of #<IncomingMessage> which has only a getter"}   → HTTP 500
```

Replaced with an equivalent, unit-tested sanitizer in `server/src/middleware/sanitize.js` that walks
body, params and query (replacing the query object safely) and passes non-plain objects such as
`Date` through untouched.

**MongoDB driver 7.6+ needs an explicit OS adapter.** Mongoose 9.11.1 resolves driver 7.7.0, which
regressed by loading its default OS adapter through dynamic `import('os')`
([NODE-7832](https://jira.mongodb.org/browse/NODE-7832)). In any runtime with `require` but no
dynamic-import callback (Jest's node environment, several VM/serverless sandboxes) the handshake then
omits required client metadata and the server replies
`Missing required sub-document 'driver' in the client metadata document`, failing **every**
connection. `server/src/config/db.js` therefore passes the driver's documented workaround,
`runtimeAdapters: { os }`.

**Host-provided `PORT` values are sanitised.** Some sandboxes export `PORT=0` (or an empty value);
taking it literally would make the API bind an ephemeral port and break the documented proxy target,
so unusable values are ignored with a warning and the default is used.

**Contradictory sign-out destinations were removed.** The sign-out button originally also navigated
home while the route guard redirected to `/login?returnUrl=…`. The guard now owns that navigation, so
there is exactly one destination and the return URL is preserved.

**Not implemented yet (deliberately, and not stubbed):**

- Account deletion — exam records are audit-relevant, so accounts are suspended instead.
- Self-service email change — needs verification, so it is issued by an admin (Phase 2).
- Light mode — the palette, `ThemeContext` and OS-preference handling are in place, but only the dark
  theme is shipped, as specified for Phase 4.
- `Table` (searchable/sortable/paginated), CSV export and the notification centre — these arrive with
  the data-heavy phases that need them; no placeholder UI ships in the meantime.
- Email sending — configuration and the "never claim delivery" rule exist; no provider is wired up.

---

## Troubleshooting

| Symptom | Cause and fix |
| --- | --- |
| `GET /api/health` returns 503 `degraded` | The API is up but MongoDB is unreachable. Start `mongod` / your Atlas cluster, or use `npm run mongo:memory --workspace server` |
| Sign-in returns 403 "Invalid or missing CSRF token" | The `qs_csrf` cookie is missing or stale — reload the page (the client fetches a token automatically) |
| Requests fail with CORS errors | `CLIENT_URL` must exactly match the browser origin (scheme, host **and** port). `localhost` and `127.0.0.1` are different origins for cookies |
| `[env] ignoring unusable PORT=…` | Expected when the host exports `PORT=0`; set `PORT` explicitly to silence it |
| Database-dependent tests report **skipped** | `mongodb-memory-server` could not download/start a `mongod` binary (offline first run). Point `MONGO_URI` at a real server, or re-run with network access |
| Server exits immediately with `[env] Invalid environment configuration` | A required value is malformed — the message lists the exact variable |

---

## License

MIT. Built as a hackathon-ready reference implementation of a MERN examination platform.
