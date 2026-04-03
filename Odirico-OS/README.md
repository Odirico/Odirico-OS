# PoleQA Next Scaffold

This is a production-minded `Next.js + Supabase` scaffold for the PoleQA workflow app. It is set up outside OneDrive at `C:\Users\deant\Downloads\poleqa-next`.

## Included

- Next.js App Router with TypeScript
- Supabase SSR client utilities
- Route protection via `proxy.ts`
- Zod validation for API inputs
- Upstash-based rate limiting helper
- Structured logging and alert hooks
- App-level loading and error boundaries
- Initial Postgres schema, RLS policies, and indexes

## Before you run it

1. Copy `.env.example` to `.env.local`
2. Fill in your Supabase, Upstash, and Sentry values
3. Run `npm install`
4. Run the SQL in `supabase/migrations/20260402_initial_schema.sql`
5. Start the app with `npm run dev`

## Suggested rollout order

1. Connect Supabase project and apply the migration
2. Enable email/password auth in Supabase
3. Verify login, protected routes, and password reset flow
4. Connect Upstash for rate limits
5. Connect Sentry DSN and alert rules
6. Deploy to Vercel and test rollback from a preview

## Operational notes

- Password reset links are delegated to Supabase Auth and should use the provider's expiration behavior.
- CORS is locked to `ALLOWED_ORIGINS` for API routes that need cross-origin access.
- Rate limiting is scaffolded for auth and ticket mutation endpoints.
- Rollback should use Vercel deployment rollback plus backward-compatible SQL migrations.
