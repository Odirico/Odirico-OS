# Contributing to Odirico OS

Thanks for working on Odirico OS. This document covers how to work in this repo cleanly.

---

## Branching Strategy

This repo uses feature branching.

| Branch | Purpose |
|---|---|
| `main` | Stable branch and production source |
| `feature/*` | New features |
| `fix/*` | Bug fixes |
| `refactor/*` | Refactors and cleanup |
| `docs/*` | Documentation-only work |
| `chore/*` | Tooling, config, and maintenance updates |

**Do not push direct work to `main`.** Create a short-lived branch from `main`, open a PR, and merge back into `main` once the change is reviewed and ready.

### Branch naming examples

```
feature/ticket-comments
feature/settings-persistence
fix/role-refresh
fix/auth-redirect
refactor/dashboard-layout
refactor/supabase-client
docs/branching-guide
chore/update-ci-config
```

---

## Workflow

```bash
# 1. Start from main
git checkout main
git pull origin main

# 2. Create your branch
git checkout -b feature/your-feature-name

# 3. Make your changes, commit often
git add .
git commit -m "feat: add ticket comment thread"

# 4. Push and open a PR into main
git push origin feature/your-feature-name
```

---

## Commit Message Format

Use short, clear prefixes:

| Prefix | When to use |
|---|---|
| `feat:` | New feature |
| `fix:` | Bug fix |
| `refactor:` | Code change with no behavior change |
| `style:` | Formatting, no logic change |
| `docs:` | Documentation only |
| `chore:` | Config, deps, tooling |

Examples:
```
feat: add kanban drag-and-drop
fix: resolve session not persisting on reload
refactor: extract ticket query logic into lib/tickets
docs: update db-schema with teams table
chore: upgrade supabase-js to v2.45
```

---

## Code Structure Rules

- Customer-facing UI goes in `src/components/product/`
- Admin and internal tools go in `src/components/internal/`
- Reusable components go in `src/components/shared/`
- Business logic goes in `src/lib/` not in components
- Types go in `src/types/` — no inline type definitions in component files

---

## Environment

- Copy `.env.example` to `.env.local` and fill in your values
- Never commit `.env.local` or any real secrets
- Add hosted secrets in Vercel project settings instead of relying on a tracked `.env.local`
- If you add a new env variable, add it to `.env.example` with an empty value

---

## Before Opening a PR

- [ ] Code runs locally without errors
- [ ] No console logs left in
- [ ] No `.env.local` values hardcoded anywhere
- [ ] New env vars added to `.env.example`
- [ ] Branch is up to date with `main`
