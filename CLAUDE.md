# CLAUDE.md — MovieLAB App

This file provides guidance for AI assistants working in this repository.

---

## Project Overview

**MovieLAB** is a full-stack movie management system with an Express.js backend and a
single-page admin dashboard (vanilla HTML/CSS/JS). It is designed for rapid deployment
to Railway or Render.

- **Backend:** Node.js 18 + Express 4 + MongoDB (Mongoose 7)
- **Frontend:** Single HTML file — `public/index.html` (vanilla JS, Chart.js)
- **Auth:** JWT (access token in `Authorization: Bearer <token>` header)
- **Docs language:** Korean (README.md, FAQ.md, deployment guides)

---

## Repository Structure

```
movielab-app/
├── config/
│   └── database.js          # Mongoose connection setup
├── controllers/             # Business logic (one file per feature)
│   ├── authController.js
│   ├── movieController.js
│   ├── userController.js
│   ├── orderController.js
│   ├── curatorController.js
│   ├── dashboardController.js
│   ├── supportController.js
│   └── uploadController.js
├── middleware/
│   ├── auth.js              # JWT authentication & role-based authorization
│   └── errorHandler.js      # Global error handler
├── models/                  # Mongoose schemas
│   ├── User.js
│   ├── Movie.js
│   ├── Order.js
│   ├── Product.js
│   ├── Curator.js
│   └── SupportTicket.js
├── routes/
│   ├── auth.js              # /api/auth/*
│   └── admin.js             # /api/admin/* (requires admin role)
├── public/
│   └── index.html           # SPA admin dashboard (~3900 lines)
├── server.js                # Express app entry point
├── seed.js                  # Database seed script
└── package.json
```

---

## Development Workflow

### Prerequisites

- Node.js 18+
- MongoDB (local or Atlas)

### Running Locally

```bash
# 1. Install dependencies
npm install

# 2. Create .env file (see Environment Variables section)
cp .env.example .env   # or create manually

# 3. Seed the database with sample data
npm run seed

# 4. Start the server
npm start
# Server runs on http://localhost:5000
```

Default admin credentials (created by seed): `admin@movielab.com` / `admin123`

### Available Scripts

| Script | Command | Description |
|--------|---------|-------------|
| `npm start` | `node server.js` | Start production server |
| `npm run seed` | `node seed.js` | Seed DB with sample data (clears existing) |
| `npm run build` | *(no-op)* | No build step required |

> There is no automated test suite. Manual testing is done via the admin dashboard
> and the health check endpoint `GET /api/health`.

---

## Environment Variables

| Variable | Required | Default | Description |
|----------|----------|---------|-------------|
| `MONGODB_URI` | Yes | — | MongoDB connection string |
| `JWT_SECRET` | Yes | — | Secret for signing JWTs |
| `NODE_ENV` | Yes | — | `production` or `development` |
| `PORT` | No | `5000` | HTTP server port |
| `UPLOAD_DIR` | No | `./uploads` | Directory for file uploads |
| `MAX_FILE_SIZE` | No | `5GB` | Maximum upload file size |
| `JWT_EXPIRES_IN` | No | `7d` | JWT access token expiry |

---

## API Structure

All API routes are prefixed with `/api`.

### Public Routes (`/api/auth`)

| Method | Path | Description |
|--------|------|-------------|
| POST | `/auth/register` | Register a new user |
| POST | `/auth/login` | Login; returns JWT |
| POST | `/auth/refresh` | Refresh access token |
| GET | `/auth/me` | Current user info (auth required) |
| POST | `/auth/logout` | Logout (auth required) |

### Admin Routes (`/api/admin/*`)

All admin routes require a valid JWT with `admin` or `super_admin` role.

**Dashboard:** `GET /admin/dashboard/stats|revenue-chart|recent-orders|top-movies`

**Movies:** Full CRUD on `/admin/movies/:id` plus `/admin/movies/:id/featured`,
`/admin/movies/:id/products`, `/admin/movies/autofill`, `/admin/movies/:id/views`

**Users:** Full CRUD on `/admin/users/:id` plus toggle-active, extend-membership,
promote-curator, watch-history, stats

**Curators:** Full CRUD on `/admin/curators/:id` plus featured toggle, collections CRUD

**Orders:** List/view/delete on `/admin/orders/:id`, plus status, payment-status,
cancel, shipping, stats

**Support:** Full CRUD on `/admin/support/:id` plus status, priority, assign,
responses, spoiler-action, stats

**Upload:** Single/multiple/chunked upload on `/admin/upload`, delete, list

### Health Check

`GET /api/health` — Returns `{status: "ok"}`. Used by hosting platforms.

---

## Data Models

### User

Roles: `user` | `membership` | `curator` | `admin` | `super_admin`

Key fields: `name`, `email`, `password` (bcrypt-hashed), `role`, `membership`,
`status`, `lastLoginAt`, `refreshToken`

- Password is auto-hashed via a `pre('save')` hook (salt rounds = 10)
- Instance methods: `comparePassword()`, `hasActiveMembership()`, `isCurator()`

### Movie

Key fields: `titleKr`, `titleEn`, `director`, `year`, `runtime`, `genres[]`,
`rating`, `country`, `synopsis`, `cast[]`, `poster`, `videos` (4k/FHD/trailer),
`subtitles[]`, `has4k`, `views`, `status`, `relatedProducts[]`

Status values: `draft` | `published` | `archived`

Full-text search index on `titleKr`, `titleEn`, `director`.

### Order

Auto-generated `orderNumber` (timestamp + random) via `pre('save')`.

Status: `pending` | `processing` | `shipped` | `delivered` | `cancelled`

Payment methods: `card` | `paypal` | `bank_transfer`

### Product

Categories: `poster` | `book` | `merchandise` | `clothing` | `other`

Has a virtual field `finalPrice` that applies membership discounts.

### Curator

One-to-one with User (`userId` unique). Fields: `bio`, `specialties[]`,
`collectionsCount`, `followersCount`, `isMonthlyFeatured`, `status`.

### SupportTicket

Auto-generated `ticketNumber`. Types: `inquiry` | `bug` | `spoiler_report` |
`account` | `payment` | `other`. Priority: `low` | `medium` | `high` | `urgent`.
Nested `responses[]` array with `userId` refs.

---

## Key Conventions

### Backend

- **Async/Await** — used consistently in all controllers; always wrap in `try/catch`.
- **Response format** — always return JSON with a `success` boolean:
  ```js
  // Success
  res.json({ success: true, data: { ... } });
  // Error
  res.status(400).json({ success: false, message: 'Reason' });
  ```
- **Pagination** — list endpoints support `?page=1&limit=20`; response includes
  `{ data, total, pages, page }`.
- **Field exclusion** — never return `password` or `refreshToken` in responses.
  Use `.select('-password -refreshToken')`.
- **Validation** — rely on Mongoose schema validation as the primary layer.
  Add Express-level checks only at system boundaries (user input, external APIs).
- **Authorization** — use the provided middleware chain in routes:
  ```js
  router.use(authenticate);   // verifies JWT
  router.use(adminOnly);      // checks role
  ```
- **File naming** — `camelCase` for all JS files (e.g., `movieController.js`).
- **Route naming** — plural resource names (`/movies`, `/users`, `/orders`).
- **Controller method naming** — `getMovies`, `createMovie`, `updateOrderStatus`.

### Frontend (`public/index.html`)

- Single-file SPA; all JS and CSS are inline in `index.html`.
- Uses `fetch()` for HTTP; JWT token stored in `localStorage`.
- Chart.js for dashboard charts.
- CSS custom properties (variables) for the design system; do not hard-code colors.
- Event delegation for dynamic/rendered content.

### Database

- All models include `timestamps: true` (`createdAt`, `updatedAt`).
- Use `.populate()` for relationships; use `.select()` to trim fields.
- Aggregation pipelines are used for statistics endpoints — avoid N+1 queries.
- Do not change auto-generated field patterns (`orderNumber`, `ticketNumber`);
  downstream code and the UI depend on their format.

---

## Authentication Flow

1. Client POSTs credentials to `/api/auth/login`.
2. Server returns `{ accessToken, refreshToken, user }`.
3. Client stores `accessToken` in `localStorage` and sends it as
   `Authorization: Bearer <token>` on every subsequent request.
4. `middleware/auth.js` → `authenticate` verifies the token and attaches `req.user`.
5. `adminOnly` middleware checks `req.user.role` for admin-level routes.

---

## Deployment

The app is designed for **Railway** (recommended) or **Render**.

1. Push to GitHub.
2. Create a MongoDB Atlas free-tier cluster; get the connection URI.
3. On Railway: connect the GitHub repo, set the three required env vars
   (`MONGODB_URI`, `JWT_SECRET`, `NODE_ENV=production`), and deploy.
4. Railway auto-detects Node.js and runs `npm start`.
5. The health check endpoint `GET /api/health` is used for platform monitoring.

No build step is needed — the frontend is pre-built static HTML.

---

## AI Writing Automation

The `ai-writing` feature auto-generates Korean synopsis and review text using the Claude API.

### New Files & Changes

| File | Change |
|------|--------|
| `controllers/aiWritingController.js` | New controller — Claude API calls with SSE streaming |
| `routes/admin.js` | Three new routes under `/api/admin/ai-writing/*` |
| `public/index.html` | New nav item, page section, `AiWritingService`, `api.streamPost()` |

### Environment Variable

`ANTHROPIC_API_KEY` is required. Add it alongside the other env vars before deploying.

### New API Routes

| Method | Path | Description |
|--------|------|-------------|
| POST | `/api/admin/ai-writing/synopsis` | Stream synopsis generation |
| POST | `/api/admin/ai-writing/review` | Stream review generation |
| PUT | `/api/admin/ai-writing/save/:movieId` | Save synopsis to movie record |

**Request body (synopsis / review):**
```json
{ "movieId": "<mongo-id>" }
{ "movieId": "<mongo-id>", "reviewStyle": "curator|critical|editorial" }
```
Both endpoints also accept `movieData` (a raw object) instead of `movieId` for unsaved movies.

**Streaming response format (SSE):**
```
data: {"text":"생성된 텍스트 청크"}
data: [DONE]
```

### Model & Prompting

- Model: `claude-opus-4-6` with `thinking: { type: "adaptive" }` (streaming)
- `max_tokens`: 1024 for synopsis, 2048 for reviews
- Prompts are built in `buildSynopsisPrompt()` / `buildReviewPrompt()` inside the controller
- Korean output, targeted at art-house/independent film audiences

### Frontend Streaming

`ApiClient.streamPost(endpoint, data, { onChunk, onDone, onError })` reads the
SSE stream via `fetch` + `ReadableStream`. Text chunks are appended directly to
the output `<textarea>` in real time.

Only synopsis output can be saved directly to the movie's `synopsis` field via the
"영화에 저장" button. Review text is copy-only.

---

## What Does Not Exist (and Should Not Be Added Without Discussion)

- **No automated test suite** — there are no unit, integration, or E2E tests.
- **No TypeScript** — the project is plain JavaScript.
- **No build tooling** — no Webpack, Vite, or transpilation step.
- **No linter/formatter config** — no ESLint or Prettier configs are present.

Do not add these without explicit user instruction, as they would change the
project's deployment assumptions.
