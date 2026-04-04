# Odirico OS

Odirico OS is the software platform inside Odirico. It is built for utility infrastructure and field operations, starting with PoleQA for inspection, ticketing, and documentation workflows.

> **Status:** Private beta — active development

---

## Features

- PoleQA as the first operational module
- Role-based dashboards for different project participants
- Ticketing, inspection, and workflow tracking
- Project and team management
- Customizable workspace settings
- Demo mode for walkthroughs

---

## Tech Stack

| Layer | Technology |
|---|---|
| Frontend | Next.js (App Router) |
| Backend | Supabase (Postgres + Auth + Edge Functions) |
| Hosting | Vercel |
| DNS / CDN | Cloudflare |
| Rate Limiting | Upstash |
| Monitoring | Custom instrumentation |

---

## Local Development

### Prerequisites

- Node.js 18+
- Supabase CLI
- A Supabase project (or local instance)

### Setup

```bash
# 1. Clone the repo
git clone https://github.com/odirico/odirico-os.git
cd odirico-os

# 2. Install dependencies
npm install

# 3. Copy env file and fill in your values
cp .env.example .env.local

# 4. Run the dev server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Environment Variables

Copy `.env.example` to `.env.local` and fill in your values. Never commit `.env.local`.

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_APP_URL=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
ALLOWED_ORIGINS=
```

---

## Repo Structure

```
odirico-os/
├── src/
│   ├── app/                  # Next.js App Router pages + API routes
│   ├── components/
│   │   ├── product/          # Customer-facing UI
│   │   ├── internal/         # Admin and internal tools
│   │   └── shared/           # Reusable components
│   ├── features/
│   │   ├── dashboard/
│   │   ├── tickets/
│   │   ├── settings/
│   │   ├── auth/
│   │   └── teams/
│   ├── lib/
│   │   ├── auth/
│   │   ├── supabase/
│   │   ├── settings/
│   │   ├── config/
│   │   └── utils/
│   ├── types/
│   └── styles/
├── public/
├── supabase/
│   └── migrations/
├── docs/
│   ├── roadmap.md
│   ├── features.md
│   ├── db-schema.md
│   └── deployment.md
├── scripts/
├── .env.example
├── .gitignore
├── next.config.ts
├── tsconfig.json
├── package.json
└── README.md
```

---

## Branching Strategy

This repo uses feature branching.

| Branch | Purpose |
|---|---|
| `main` | Stable branch and production source |
| `feature/*` | New features (e.g. `feature/ticket-comments`) |
| `fix/*` | Bug fixes (e.g. `fix/role-refresh`) |
| `refactor/*` | Refactors (e.g. `refactor/dashboard-layout`) |
| `docs/*` | Documentation-only changes |
| `chore/*` | Tooling, config, or maintenance updates |

Create short-lived branches from `main`, open a PR, and merge back into `main` once the work is ready.

---

## Database

Migrations live in `supabase/migrations/`. Run locally with:

```bash
supabase db reset
```

Schema documentation is in `docs/db-schema.md`.

---

## Deployment

Deployed to Vercel. Pushes to `main` trigger production deploys automatically.

Set the same values from `.env.example` in the Vercel project's environment
settings. Do not rely on a committed `.env.local` for hosted builds.

See `docs/deployment.md` for full deployment steps and environment setup.

---

## Related Repos

| Repo | Description |
|---|---|
| `odirico-site` | Marketing site (odirico.com) |
| `odirico-internal` | Internal ops tools (private) |
| `odirico-brand` | Brand assets and guidelines (private) |
