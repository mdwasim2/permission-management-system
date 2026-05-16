# Dynamic RBAC Platform — Full-Stack Specification v2.0

A multi-role web application where **permissions drive access dynamically**. No hard-coded role pages. Any user can be granted access to any feature (within a grant ceiling), and permissions are fully configurable via UI at runtime.

## 📋 System Overview

### The Core Concept

Every page requires one permission atom. If you have it, access granted. If not, redirected to 403. Your role label is irrelevant — **permissions are atomic and granular**.

### What Problem Does It Solve?

- ✅ No hard-coded role access in code
- ✅ Any role can access any page (if granted)
- ✅ Permissions managed via UI, not code
- ✅ Full audit trail of all admin/manager actions
- ✅ Managers control exactly what their team can see
- ✅ Grant ceiling enforced (can't grant what you don't hold)

### Who Uses It?

- **Admin**: Complete control. Manage all users, roles, permissions.
- **Manager**: Create/manage team (agents + customers). Grant features to agents.
- **Agent**: Access modules their manager enabled.
- **Customer**: Self-service portal.

---

## 🏗️ Tech Stack

| Layer     | Technology                           | Why                                                                                 |
| --------- | ------------------------------------ | ----------------------------------------------------------------------------------- |
| Frontend  | Next.js 16 (App Router) + TypeScript | Server-side permission checks via middleware before render                          |
| Backend   | NestJS + Prisma                      | Guard system for permission enforcement; flexible ORM                               |
| Database  | PostgreSQL                           | Recommended. Core entities: users, roles, permissions, user_permissions, audit_logs |
| Auth      | JWT + HttpOnly Refresh Cookie        | 15 min access token, 7 days refresh token, no localStorage                          |
| UI Design | Figma-first workflow                 | All UI matches provided Figma file; responsive across all devices                   |

---

## 📊 Current Implementation Status

### ✅ Completed

#### Backend

- [x] NestJS project scaffold with middleware & guards
- [x] Prisma ORM setup with full schema (users, roles, permissions, audit logs)
- [x] JWT auth service (login, register, refresh, logout, session blacklist)
- [x] User CRUD with grant ceiling enforcement
- [x] Audit logging service (append-only, permission-gated)
- [x] Permission catalog seeding (30+ permission atoms)
- [x] Brute-force rate limiting on auth endpoints
- [x] Refresh token rotation security
- [x] Middleware permission validation

#### Frontend

- [x] Next.js 16 scaffold with App Router
- [x] Proxy-based permission routing (middleware)
- [x] Login page (Figma-compliant, responsive)
- [x] Register page (Figma-compliant, responsive)
- [x] Auth form with password visibility toggle
- [x] Custom checkbox component (Figma design)
- [x] Forbidden (403) page
- [x] Dashboard shell with responsive sidebar
- [x] Mobile drawer navigation (slide-in sidebar)
- [x] Placeholder pages: Users, Leads, Tasks, Reports, Audit Log, Settings, Customer Portal
- [x] Dynamic navigation from permission set
- [x] Responsive design across mobile, tablet, desktop

### ⏳ In Progress / Remaining

#### High Priority

- [ ] Dynamic nav sidebar — build from resolved user permissions
- [ ] Permission management UI — visual editor to toggle permission atoms per user
- [ ] User management page — full CRUD UI for admins/managers
- [ ] Audit log viewer — filterable, searchable audit trail
- [ ] Customer portal page — self-service features

#### Medium Priority

- [ ] Dashboard analytics — role-based widget visibility
- [ ] Leads module page — full CRUD operations
- [ ] Tasks module page — task assignment, status tracking
- [ ] Reports module page — data visualization (charts, tables)
- [ ] Settings page — user profile, password change, preferences

#### Quality & Deployment

- [ ] E2E tests (Cypress or Playwright)
- [ ] Backend unit tests (Jest)
- [ ] Frontend unit tests (Jest + React Testing Library)
- [ ] Docker setup (docker-compose.yml)
- [ ] Deployment guide (Vercel for frontend, Railway/Render for backend)
- [ ] Live demo link

---

## 🚀 Local Setup & Run

### Prerequisites

- Node.js 18+
- PostgreSQL 14+
- npm or yarn

### Installation

```bash
# Clone repo
git clone <repo-url>
cd permission-management-system

# Setup backend
cd backend
cp .env.example .env
# Edit .env: set DATABASE_URL (Postgres connection), JWT_SECRET, REFRESH_SECRET
npm install
npm run prisma:generate
npm run prisma:migrate -- --name init
npm run start:dev

# In another terminal, setup frontend
cd ../frontend
cp .env.local.example .env.local
# Edit .env.local: set NEXT_PUBLIC_API_URL (usually http://localhost:3001/api)
npm install
npm run dev
```

### Environment Variables

**Backend** (`backend/.env`):

```env
DATABASE_URL=postgresql://user:password@localhost:5432/rbac_db
DIRECT_URL=postgresql://user:password@localhost:5432/rbac_db
JWT_SECRET=your-jwt-secret-here
REFRESH_SECRET=your-refresh-secret-here
NODE_ENV=development
```

**Frontend** (`frontend/.env.local`):

```env
NEXT_PUBLIC_API_URL=http://localhost:3001/api
```

### Access the App

- **Frontend**: https://permission-management-system-eta.vercel.app/
- **Login**: wasimmahamodraza@gmail.com / 123456
- **Backend API**: https://permission-management-system-b46o.onrender.com/api

---

## 📁 Project Structure

```
permission-management-system/
├── backend/
│   ├── src/
│   │   ├── auth/           # JWT, login, register, refresh
│   │   ├── users/          # User CRUD + grant ceiling
│   │   ├── permissions/    # Permission atoms catalog
│   │   ├── audit/          # Audit logging service
│   │   ├── prisma/         # Prisma service + seeding
│   │   └── app.module.ts   # Root module
│   ├── prisma/
│   │   ├── schema.prisma   # Database schema
│   │   └── migrations/     # DB migrations
│   └── package.json
│
├── frontend/
│   ├── src/
│   │   ├── app/            # Next.js pages (login, register, dashboard, etc.)
│   │   ├── components/
│   │   │   ├── auth/       # Auth form, home shell
│   │   │   └── common/     # Checkbox, buttons, etc.
│   │   ├── lib/
│   │   │   └── route-config.ts  # Permission atoms list
│   │   └── proxy.ts        # Middleware permission routing
│   └── package.json
│
└── README.md
```

---

## 🔑 Key Concepts

### Permission Atoms

Granular, indivisible permissions. Examples:

- `dashboard.view`
- `users.view`, `users.create`, `users.edit`, `users.delete`
- `leads.view`, `leads.manage`
- `reports.view`, `reports.export`
- `audit.view`

Each user is assigned a set of atoms. Sidebar nav items are only shown if the user holds the required atom.

### Grant Ceiling

A manager can only grant permissions they themselves hold. If an Admin restricts a Manager to `users.view` + `leads.view`, the Manager can only grant those atoms to their agents.

### Audit Trail

Every admin/manager action (create user, suspend user, grant permission, etc.) is logged with:

- WHO (user ID)
- WHAT (action type)
- WHEN (timestamp)
- WHICH resource (user ID, permission ID, etc.)
- Read-only; permission-gated (only `audit.view` users can see)

---

## 📝 API Contract (Backend)

### Auth Endpoints

- `POST /api/auth/register` — Register new user (customer role)
- `POST /api/auth/login` — Login, get access token + refresh cookie
- `POST /api/auth/refresh` — Use refresh cookie to get new access token
- `POST /api/auth/logout` — Blacklist refresh token
- `GET /api/auth/me` — Get current user + resolved permissions

### User Endpoints (Admin/Manager Only)

- `GET /api/users` — List users (scoped by role)
- `POST /api/users` — Create user
- `GET /api/users/:id` — Get user details
- `PATCH /api/users/:id` — Update user (name, status)
- `POST /api/users/:id/permissions` — Set user permissions (enforces grant ceiling)
- `POST /api/users/:id/suspend` — Suspend user
- `POST /api/users/:id/ban` — Ban user

### Permission Endpoints

- `GET /api/permissions/catalog` — List all permission atoms

### Audit Endpoints

- `GET /api/audit` — Fetch audit logs (permission-gated)

---

## 🔐 Security

- ✅ JWT access tokens stored in memory (not localStorage)
- ✅ Refresh tokens in httpOnly cookies (not accessible to JavaScript)
- ✅ Permission middleware validates every route server-side
- ✅ Backend guards enforce permission checks on API endpoints
- ✅ Grant ceiling prevents privilege escalation
- ✅ Rate limiting on auth endpoints (brute-force protection)
- ✅ Refresh token rotation on each use
- ✅ Access token blacklist for early logout
- ✅ Audit trail immutable (append-only)

---

## 📱 Responsive Design

All pages are fully responsive:

- **Mobile** (< 640px): Single-column layout, slide-in sidebar
- **Tablet** (640px – 1024px): Two-column, optimized spacing
- **Desktop** (> 1024px): Full multi-column layout with sticky sidebar

Auth pages include desktop visual panels (inspiring graphics).

---

## 🎨 Figma Design

All UI matches the provided Figma file. Key components:

- Login form (420px card, soft shadow)
- Register form (variant with different panel)
- Checkbox (orange checkmark)
- Buttons (gradient, hover states)
- Typography (Inter 15px subtitles, Onest headings)
- Color palette (orange primary #ff6b3d, grays, whites)

---

## 📋 Deployment Checklist

- [ ] Environment variables configured on hosting platform
- [ ] Database migrations run on production DB
- [ ] Frontend deployed to Vercel / Netlify / AWS Amplify
- [ ] Backend deployed to Railway / Render / AWS / Digital Ocean
- [ ] CORS configured (frontend domain whitelisted on backend)
- [ ] SSL/HTTPS enabled
- [ ] Rate limiting configured for production traffic
- [ ] Monitoring & logging set up (Sentry, DataDog, etc.)
- [ ] Backup strategy for database
- [ ] Demo credentials rotated before public access

---

## 📞 Support & Contributing

**To run tests:**

```bash
cd backend && npm run test        # Unit tests
cd frontend && npm run test       # Unit tests
# E2E tests coming soon
```

**To deploy locally with Docker:**

```bash
# Coming soon: docker-compose.yml
```

**Live Demo:**

- Frontend: https://permission-management-system-eta.vercel.app/
- Backend API: https://permission-management-system-b46o.onrender.com/api

---

## 👨‍💻 Developer

- Name: Md Wasim
- GitHub: [github.com/mdwasim2](https://github.com/mdwasim2)
- Website: [mdwasim.online](https://www.mdwasim.online/)

---

## 📄 License

MIT (or your choice)
