## Control Financiero Backend

Backend reescrito sobre Express + Prisma + PostgreSQL.

## Project setup

```bash
npm install
```

## Compile and run the project

```bash
# development
npm run dev

# production build
npm run build
npm run start:prod
```

## Run tests

```bash
# unit tests
npm test

# e2e tests
npm run test:e2e

# lint
npm run lint
```

## Base routes

- `GET /api/v1`
- `GET /api/v1/health`
- `POST /api/v1/auth/register`
- `POST /api/v1/auth/login`
- `GET /api/v1/auth/me`
- `PATCH /api/v1/auth/change-password`
- `PATCH /api/v1/auth/profile`
- `GET /api/v1/entities`
- `POST /api/v1/entities`
- `POST /api/v1/entities/:entityId/items`
- `POST /api/v1/entities/items/:itemId/records`
- `GET /api/v1/settings`
- `PATCH /api/v1/settings`
- `GET /api/v1/settings/login-history`
- `GET /api/v1/audit/logs`

## Notes

- OpenAPI UI: `http://localhost:3000/docs`
- The backend creates a default admin if none exists, using `DEFAULT_ADMIN_*`
- Local PostgreSQL can be started from the repo root with `docker compose up -d`
- First-time schema sync: `npm run prisma:generate` then `npm run prisma:push`
