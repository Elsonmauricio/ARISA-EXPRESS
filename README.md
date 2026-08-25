# Arisa Express

## Description

Arisa Express is an international logistics platform connecting **Angola** and **Portugal**. It provides shipment tracking, quotation requests, user account management, an admin dashboard, and contact/notification features. The codebase is split into a **React + Vite frontend** (`frontend/`) and an **Express + TypeScript backend** (`backend/`) that uses Firebase (Firestore) as its data store and the Firebase Admin SDK for server-side access.

> Note on verified paths: source files reference a `src/` directory in their header comments (e.g. `backend/src/middleware/...`), but in this repository the actual TypeScript files live directly under `backend/` (e.g. `backend/middleware/...`). The README reflects the real on-disk locations.

## Installation

The project is a monorepo with two independent packages. Install dependencies for each:

```bash
# Backend
cd backend
npm install

# Frontend
cd frontend
npm install
```

### Environment configuration

- `backend/.env` - already present. Contains Firebase, JWT, and server config (see **Environment variables**).
- `frontend/.env` - present. Contains:

```env
# Base URL do backend da API.
# Em producao define como o URL HTTPS do teu backend (ex: https://teu-backend.com).
VITE_API_URL=http://localhost:5001
```

Set `VITE_API_URL` to your backend's URL. If omitted, the frontend logs a warning (`VITE_API_URL is not defined. Please set it in your .env file.`).

## Scripts

### Frontend (`frontend/package.json`)

| Script | Command | Purpose |
| --- | --- | --- |
| `dev` | `vite` | Start the Vite dev server |
| `build` | `tsc -b && vite build` | Type-check and build for production |
| `preview` | `vite preview` | Preview the production build |
| `lint` | `eslint .` | Lint the codebase |
| `format` | `prettier --write .` | Format all files with Prettier |

### Backend (`backend/package.json`)

| Script | Command | Purpose |
| --- | --- | --- |
| `dev` | `nodemon -e ts,json --ignore _IGNORE_arisa_express --ignore node_modules dev.ts` | Start dev server with auto-reload |
| `build` | `tsc` | Compile TypeScript to `dist/` |
| `start` | `node dist/server.js` | Run the compiled server |
| `prisma:generate` | `prisma generate` | Generate Prisma client |
| `prisma:migrate` | `prisma migrate dev` | Run Prisma migrations (dev) |
| `prisma:studio` | `prisma studio` | Open Prisma Studio |
| `fix-encoding` | `ts-node scripts/fixEncoding.ts` | Fix text encoding script |

## Project structure

```
Arisa_Express/
├── backend/                 # Express + TypeScript API
│   ├── api/
│   │   ├── index.ts         # Express app entry re-export (server.ts)
│   │   └── routes/          # Route definitions (auth, users, shipments, ...)
│   ├── config/              # firebase.ts
│   ├── controllers/         # Request handlers per domain
│   ├── middleware/          # auth, validation, errorHandler, rateLimit, auditLog, cache
│   ├── services/            # email, pdf, whatsapp, sms (Twilio/Mock/Generic HTTP)
│   ├── types/               # zod validation schemas, pricing, etc.
│   ├── utils/               # logger, encryption, trackingCode, businessDays, ...
│   ├── scripts/             # fixEncoding.ts
│   ├── dev.ts               # Dev entry used by nodemon
│   ├── server.ts            # Express app, CORS, middleware wiring, route mounting
│   ├── index.ts             # App export
│   └── package.json
├── frontend/                # React + Vite single-page app
│   ├── src/
│   │   ├── lib/api.ts       # API client (authenticatedFetch, logout)
│   │   ├── i18n/            # LanguageContext + translations.ts (pt/en)
│   │   ├── components/      # UI + ProtectedRoute
│   │   └── pages/           # LoginPage, RegisterPage, ProfilePage, ...
│   └── package.json
├── .gitattributes
├── .gitignore
└── README.md
```

## Error handling system

All technical details below are taken directly from the source files.

### Frontend

**`frontend/src/lib/api.ts`**

- `api(path)` - builds a full URL from `VITE_API_URL` (trailing slash stripped). Warns if `VITE_API_URL` is undefined.
- `authenticatedFetch(input, init)` - wraps `fetch`:
  - Attaches `Authorization: Bearer <token>` from `localStorage` when a token exists.
  - Sets `Content-Type: application/json` automatically when a body is present and none is set.
  - On `401` responses it performs a single-flight token refresh:
    - Uses an `isRefreshing` / `refreshPromise` guard so concurrent requests share one refresh.
    - `refreshAccessToken()` POSTs to `/api/auth/refresh` with the refresh token as `Authorization: Bearer <refreshToken>`, stores new `token` (and `refreshToken` if returned) in `localStorage`.
    - On refresh failure it clears `token`, `refreshToken`, and `user` from `localStorage` and redirects to `/login` (`window.location.href = '/login'`).
- `logout()` - removes `token`, `refreshToken`, and `user` from `localStorage`.

> Note: there is **no** `handleError` function in `api.ts` in this codebase; API error handling is done inline at the call sites (components/pages) using the translation keys listed below.

**`frontend/src/components/ProtectedRoute.tsx`**

- Guards authenticated routes. If `token` or `user` are missing (or `user` JSON fails to parse), it calls `logout()` and redirects to `/login`.
- When `requireAdmin` is set, non-`ADMIN`/non-`OPERATOR` users are redirected to `/` (used by the `/admin` route in `App.tsx`).

**Error translation keys (`frontend/src/i18n/translations.ts`)**

The app surfaces errors to users via i18n keys (present in both `pt` and `en`). Verified keys:

- `layout.cssError` - "❌ [STYLE ERROR]: index.css was not loaded or Tailwind is not active."
- `contact.erroEnvio` - "Error sending message"
- `contact.erroInesperado` - "An unexpected error occurred."
- `settings.senhaErro` - "Error changing password"
- `settings.erroConexao` - "Connection error"
- `login.erroConexao` - "Server connection error"
- `register.erroRegistar` - "Error registering"
- `register.erroConexao` - "Server connection error"
- `profile.erroCarregar` - "Error loading profile"
- `profile.erroConexao` - "Connection error"
- `profile.erroAtualizar` - "Error updating"
- `ship.erroCriar` - "Error creating shipment"
- `ship.erroServidor` - "Server connection error."
- `ship.erroServidor2` - "Error connecting to the server."
- `ship.erroStatus` - "Error {status}: Could not load shipments."
- `ship.erroCarregarEncomendas` - "Error loading shipments"
- `ship.erroCarregarRotas` - "Error loading routes"
- `ship.erroConexaoRotas` - "Connection error loading routes"
- `track.erroStatus` - "Error {status}: {statusText}"
- `track.erroServidor` - "Error connecting to the server. Please try again later."
- `admin.erroEncomendas` - "Error loading shipments"
- `admin.erroConexao` - "Connection error"
- `admin.erroStatusRota` - "Error updating route status"
- `admin.erroStatus` - "Error updating status"
- `admin.erroUsers` - "Error loading users"
- `admin.erroRotas` - "Error loading routes"
- `admin.erroGuardar` - "Error saving route"
- `admin.erroAlterarRole` - "Error changing role"
- `admin.erroEliminar` - "Error deleting"
- `admin.erroMsgs` - "Error loading messages"
- `admin.erroEliminarMsg` - "Error deleting message"
- `admin.erroMarcarLida` - "Error marking as read"
- `admin.erroEstado` - "Error updating status"
- `admin.erroAtribuir` - "Error assigning lead"
- `admin.erroAddEtiqueta` - "Error adding tag"
- `admin.erroAddNota` - "Error adding note"
- `admin.erroWhatsapp` - "Error generating WhatsApp link" 
- `admin.erroCriarEncomenda` - "Error creating shipment"

### Backend

**`backend/middleware/errorHandler.ts`** - Express error-handling middleware (`app.use(errorHandler)` in `server.ts`):

- Logs `error.stack` via the logger.
- `ValidationError` -> `400 { error: <error.message> }`.
- `JsonWebTokenError` -> `401 { error: "Token inválido" }`.
- Fallback -> `500 { error: "Erro interno do servidor" }`.

**`backend/middleware/validation.ts`** - `validate(schema)`:

- Runs an async Zod `schema.parseAsync({ body: req.body })`.
- On `ZodError` -> `400 { error: "Validation failed", details: error.errors }`.
- Other errors are forwarded via `next(error)`.

**`backend/middleware/auth.ts`**

- `authenticate` - reads `Authorization: Bearer <token>`, verifies with `JWT_SECRET`, loads the user from Firestore `users` collection; on failure -> `401 { error: "Por favor, autentique-se" }`.
- `authorize(...roles)` - returns `403 { error: "Acesso negado" }` if `req.user.role` is not in the allowed roles.
- `authenticateRefresh` - validates a refresh token stored in the `refreshTokens` collection and its expiry; on failure -> `401 { error: "Refresh token inválido" }`.

**`backend/utils/logger.ts`** - Winston logger:

- Console transport with colorized, timestamped (`YYYY-MM-DD HH:mm:ss`) output and a custom printf format.
- Log level from `process.env.LOG_LEVEL || 'info'`.
- `exitOnError: false`.

## API endpoints

All routes are mounted under `/api/*` in `backend/server.ts`. Verified from the route files:

### Auth - `/api/auth` (`api/routes/auth.ts`)
| Method | Path | Middleware |
| --- | --- | --- |
| POST | `/api/auth/register` | `authLimiter`, `validate(registerSchema)` |
| POST | `/api/auth/login` | `authLimiter`, `validate(loginSchema)` |
| POST | `/api/auth/refresh` | - |
| POST | `/api/auth/logout` | - |
| POST | `/api/auth/forgot-password` | `authLimiter` |
| POST | `/api/auth/reset-password` | - |
| GET | `/api/auth/me` | - |

### Users - `/api/users` (`api/routes/users.ts`)
| Method | Path | Middleware |
| --- | --- | --- |
| GET | `/api/users/profile` | - |
| PATCH | `/api/users/profile` | `validate(updateProfileSchema)` |
| PATCH | `/api/users/change-password` | `validate(changePasswordSchema)` |
| GET | `/api/users/notifications` | - |
| PATCH | `/api/users/notifications/:id/read` | - |

### Shipments - `/api/shipments` (`api/routes/shipments.ts`)
| Method | Path | Middleware |
| --- | --- | --- |
| POST | `/api/shipments` | `validate(createShipmentSchema)` |
| GET | `/api/shipments` | - |
| GET | `/api/shipments/:id` | - |
| PATCH | `/api/shipments/:id` | - |
| DELETE | `/api/shipments/:id` | - |
| POST | `/api/shipments/:id/cancel` | - |

### Quotations - `/api/quotations` (`api/routes/quotations.ts`)
| Method | Path | Middleware |
| --- | --- | --- |
| POST | `/api/quotations` | - |
| GET | `/api/quotations` | - |
| GET | `/api/quotations/:id` | - |
| POST | `/api/quotations/:id/approve` | - |

### Admin - `/api/admin` (`api/routes/admin.ts`)
| Method | Path | Middleware |
| --- | --- | --- |
| GET | `/api/admin/stats` | - |
| GET | `/api/admin/stats/trends` | - |
| GET | `/api/admin/shipments` | - |
| GET | `/api/admin/shipments/search` | - |
| PATCH | `/api/admin/shipments/batch-status` | `validate(batchStatusUpdateSchema)`, `auditLog` |
| GET | `/api/admin/shipments/ready-for-pickup` | - |
| GET | `/api/admin/shipments/:id` | - |
| POST | `/api/admin/shipments` | `validate(adminCreateShipmentSchema)`, `auditLog` |
| PATCH | `/api/admin/shipments/:id/status` | `auditLog` |
| PATCH | `/api/admin/shipments/:id/ctt` | `validate(updateCttSchema)`, `auditLog` |
| PATCH | `/api/admin/shipments/batch-status-by-ids` | `validate(batchByIdsSchema)`, `auditLog` |
| GET | `/api/admin/shipments/:id/whatsapp-link` | - |
| GET | `/api/admin/shipments/:id/whatsapp-payment` | - |
| GET | `/api/admin/shipments/:id/fine` | - |
| GET | `/api/admin/users` | - |
| PATCH | `/api/admin/users/:id/role` | `auditLog` |
| DELETE | `/api/admin/users/:id` | `auditLog` |
| GET | `/api/admin/leads` | - |
| GET | `/api/admin/leads/pipeline` | - |
| PATCH | `/api/admin/leads/:id/read` | `auditLog` |
| PATCH | `/api/admin/leads/:id/stage` | `auditLog` |
| PATCH | `/api/admin/leads/:id/assign` | `auditLog` |
| PATCH | `/api/admin/leads/:id/tags` | `auditLog` |
| POST | `/api/admin/leads/:id/notes` | `auditLog` |
| DELETE | `/api/admin/leads/:id` | `auditLog` |
| GET | `/api/admin/export/shipments` | - |
| GET | `/api/admin/export/users` | - |
| GET | `/api/admin/export/leads` | - |
| GET | `/api/admin/backup/full` | - |
| GET | `/api/admin/notifications/sms/queue` | (inline handler) |

### Tracking - `/api/tracking` (`api/routes/tracking.ts`)
| Method | Path | Middleware |
| --- | --- | --- |
| GET | `/api/tracking/:code` | - |

### Contact - `/api/contact` (`api/routes/contact.ts`)
| Method | Path | Middleware |
| --- | --- | --- |
| POST | `/api/contact/` | `rateLimiter` (local) |

### Routes (shipping routes) - `/api/routes` (`api/routes/routes.ts`)
| Method | Path | Middleware |
| --- | --- | --- |
| GET | `/api/routes/available` | - |
| GET | `/api/routes/` | `authenticate`, `authorize('ADMIN','OPERATOR')` |
| POST | `/api/routes/` | `authenticate`, `authorize('ADMIN','OPERATOR')` |
| DELETE | `/api/routes/:id` | `authenticate`, `authorize('ADMIN','OPERATOR')` |
| PATCH | `/api/routes/:id/status` | `authenticate`, `authorize('ADMIN','OPERATOR')` |
| POST | `/api/routes/init` | `authenticate`, `authorize('ADMIN')` |

### Webhook - `/api/webhook` (`api/routes/webhook.ts`)
| Method | Path | Middleware |
| --- | --- | --- |
| GET | `/api/webhook/webhook` | - |
| POST | `/api/webhook/webhook` | - |

### Notify - `/api` (`api/routes/notify.ts`, mounted at `/api`)
| Method | Path | Middleware |
| --- | --- | --- |
| POST | `/api/notify-whatsapp` | - |

### Health check (`server.ts`)
| Method | Path |
| --- | --- |
| GET | `/api/health` -> `{ status: 'ok', timestamp }` |

## Environment variables

### Backend (`backend/.env`) - verified contents
| Variable | Example / Value | Purpose |
| --- | --- | --- |
| `FIREBASE_SERVICE_ACCOUNT_KEY` | JSON service account (project `arisa-express`) | Firebase Admin credentials |
| `FIREBASE_DATABASE_URL` | `https://arisa-express.firebaseio.com` | Firestore database URL |
| `JWT_SECRET` | (base64 secret) | Signs/verifies JWT access and refresh tokens |
| `PORT` | `5001` | Backend listen port |
| `FRONTEND_URL` | `https://localhost:5173` | Allowed CORS origin (semicolon-separated list supported) |
| `BACKEND_URL` | `https://localhost:5001` | Public backend URL |
| `LOG_LEVEL` | (optional, e.g. `info`) | Winston log level; defaults to `info` |

> Default CORS allowed origins in `server.ts` also include `http://localhost:5173`, `http://localhost:3000`, `https://www.arisa-express.com`, `https://arisa-express.com`, `https://arisaexpress.vercel.app`, and `https://arisa-backend.vercel.app`.

### Frontend (`frontend/.env`)
| Variable | Example / Value | Purpose |
| --- | --- | --- |
| `VITE_API_URL` | `http://localhost:5001` | Backend API base URL used by the `api()` helper |
