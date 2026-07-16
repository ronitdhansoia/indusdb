# Indus Tracker

A minimal, aesthetic day-to-day task tracker for **Indus Appliances**. Admins
assign work to employees, follow progress in real time, and each team member
gets their own task board plus a private checklist.

Built with **Next.js 16 (App Router)**, **MongoDB / Mongoose**, and
**Tailwind CSS**, with role-based authentication (JWT in an httpOnly cookie).

---

## Features

- **Role-based auth** — one login for two experiences: `admin` and `employee`.
- **Admin dashboard** — live stats (team size, active tasks, completion rate,
  overdue), team-progress bars, and recent activity.
- **Employee management** — create team members, set job titles, reset
  passwords, activate/deactivate, and see each person's task breakdown.
- **Task assignment & tracking** — title, description, priority, due date, and a
  `To do → In progress → Done` workflow with completion timestamps.
- **Employee task board** — assigned work grouped by status, updated with one
  click.
- **Personal checklist** — a private to-do list for each employee.

## Tech stack

| Layer     | Choice                                        |
| --------- | --------------------------------------------- |
| Framework | Next.js 16 (App Router, Turbopack)            |
| Database  | MongoDB via Mongoose                          |
| Auth      | `jose` JWT in an httpOnly cookie + `bcryptjs` |
| Styling   | Tailwind CSS v4 (custom warm/clay theme)      |
| Language  | TypeScript                                    |

---

## Getting started

### 1. Prerequisites

- Node.js 20+ (tested on Node 23)
- A MongoDB instance. Either:
  - **Local** (macOS / Homebrew):
    ```bash
    brew tap mongodb/brew
    brew install mongodb-community
    brew services start mongodb-community
    ```
  - **or MongoDB Atlas** — grab a `mongodb+srv://…` connection string.

### 2. Configure environment

Copy the example and adjust values:

```bash
cp .env.example .env.local
```

| Variable              | Description                                       |
| --------------------- | ------------------------------------------------- |
| `MONGODB_URI`         | Local or Atlas connection string                  |
| `JWT_SECRET`          | Long random string used to sign session cookies   |
| `SEED_ADMIN_NAME`     | Name for the first admin (used by `npm run seed`) |
| `SEED_ADMIN_EMAIL`    | Email for the first admin                         |
| `SEED_ADMIN_PASSWORD` | Password for the first admin                      |

### 3. Install & seed

```bash
npm install
npm run seed      # creates the admin + demo employees & sample tasks
```

### 4. Run

```bash
npm run dev       # http://localhost:3001
```

---

## Scripts

| Script          | What it does                                      |
| --------------- | ------------------------------------------------- |
| `npm run dev`   | Start the dev server on **http://localhost:3001** |
| `npm run build` | Production build                                  |
| `npm run start` | Run the production build on port 3001             |
| `npm run seed`  | Seed the admin, demo employees, and sample tasks  |
| `npm run lint`  | Run ESLint                                        |

## Demo accounts (after seeding)

| Role     | Email                       | Password      |
| -------- | --------------------------- | ------------- |
| Admin    | `admin@indusappliances.com` | `admin123`    |
| Employee | `priya@indusappliances.com` | `employee123` |

> Change these credentials before using this anywhere real.

---

## Project structure

```
app/
  api/            # Route handlers (auth, employees, tasks, todos, stats)
  admin/          # Admin dashboard, employees, tasks (protected)
  employee/       # Employee task board + checklist (protected)
  login/          # Sign-in page
lib/              # db connection, auth/session, guards, helpers
models/           # Mongoose schemas: User, Task, Todo
components/       # UI primitives, shell, task cards, icons
proxy.ts          # Route protection (role-based redirects)
scripts/seed.ts   # Database seed
```

## How auth works

1. `POST /api/auth/login` verifies credentials (bcrypt) and sets a signed JWT in
   an httpOnly `indus_session` cookie.
2. `proxy.ts` gates `/admin/*` and `/employee/*`, redirecting by role.
3. API route handlers re-check the session with `requireAuth` / `requireAdmin`,
   so protection never relies on the client.
