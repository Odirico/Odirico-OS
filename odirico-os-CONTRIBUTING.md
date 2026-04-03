# Contributing to Odirico OS

Thanks for working on Odirico OS. This document covers how to work in this repo cleanly.

---

## Branch Structure

| Branch | Purpose |
|---|---|
| `main` | Production-ready code only |
| `develop` | Active integration branch |
| `feature/*` | New features |
| `fix/*` | Bug fixes |
| `refactor/*` | Refactors and cleanup |

**Never push directly to `main`.** Open a PR from your feature or fix branch.

### Branch naming examples

```
feature/ticket-comments
feature/settings-persistence
fix/role-refresh
fix/auth-redirect
refactor/dashboard-layout
refactor/supabase-client
```

---

## Workflow

```bash
# 1. Start from develop
git checkout develop
git pull origin develop

# 2. Create your branch
git checkout -b feature/your-feature-name

# 3. Make your changes, commit often
git add .
git commit -m "feat: add ticket comment thread"

# 4. Push and open a PR into develop
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
- If you add a new env variable, add it to `.env.example` with an empty value

---

## Before Opening a PR

- [ ] Code runs locally without errors
- [ ] No console logs left in
- [ ] No `.env.local` values hardcoded anywhere
- [ ] New env vars added to `.env.example`
- [ ] Branch is up to date with `develop`
