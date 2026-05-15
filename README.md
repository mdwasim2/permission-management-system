# Dynamic RBAC Platform

Initial workspace scaffold for a full-stack RBAC system with a Next.js frontend and NestJS backend.

## Apps

- `frontend`: Next.js App Router application
- `backend`: NestJS REST API

## Current Status

- Frontend scaffolded and replaced with a project landing page
- Backend scaffolded with API metadata and health endpoints
- Auth and permission modules added as contract-first placeholders

## Local Run

```bash
cd frontend && npm run dev
cd backend && npm run start:dev
```

## Environment Setup

Backend example env lives in `backend/.env.example`.

Frontend example env lives in `frontend/.env.local.example`.

Suggested local setup:

```bash
cp backend/.env.example backend/.env
cp frontend/.env.local.example frontend/.env.local
```

Then replace `DATABASE_URL` with your Neon Postgres connection string and set
`NEXT_PUBLIC_API_URL` to your backend base URL.

For Neon, use the pooled connection string in `DATABASE_URL` and the direct
connection string in `DIRECT_URL` for Prisma migrations.

After filling env values, initialize Prisma with:

```bash
cd backend
npm run prisma:generate
npm run prisma:migrate -- --name init
```

## Next Slices

1. Add JWT access and refresh token flow
2. Add database schema and Prisma setup
3. Enforce permission-based route checks in middleware and backend guards
4. Implement user CRUD, grant ceiling, and audit logs

## Missing Inputs

- Figma link
- Prototype link
- Final brand tokens and copy
