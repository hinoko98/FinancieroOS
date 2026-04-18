# Control Financiero

FinancieroOS permite controlar fondos asignados, servicios asociados, pagos ejecutados y trazabilidad operativa por entidad, con permisos multiusuario y auditoría.

## Estructura

- `backend`: API Express + Prisma + PostgreSQL
- `frontend`: App web Next.js + TypeScript + Tailwind
- `docker-compose.yml`: PostgreSQL local

## Inicio rapido

1. Levanta PostgreSQL:

```bash
docker compose up -d
```

2. Configura backend:

```bash
cd backend
copy .env.example .env
npx prisma generate
npx prisma db push
npm run dev
```

Si quieres usar scripts del proyecto:

```bash
cd backend
npm run prisma:generate
npm run prisma:push
npm run start:dev
```

3. Configura frontend:

```bash
cd frontend
npm run dev
```
