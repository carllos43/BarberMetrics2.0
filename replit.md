# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

The active product is **BarberMetrics 2.0** — a premium iPhone-style cash-book and performance app for solo barbers (Brazilian Portuguese UI). It is now a **fully serverless React SPA** that talks **directly to Supabase** (auth + Postgres with Row Level Security). There is no Express backend, no `/api/*` routes, no Drizzle/ORM in the project anymore.

## Architecture

- **Frontend**: React + Vite (iOS dark mode, amber accents) — `artifacts/barbermetrics`
- **Backend**: Supabase
  - **Auth**: Supabase Auth (email/password)
  - **Database**: Supabase Postgres, accessed only from the browser via `@supabase/supabase-js` and the publishable (anon) key
  - **Security**: Row Level Security on every table, all policies keyed off `auth.uid()`
  - **Provisioning**: schema lives in `supabase/schema.sql` and must be applied via the Supabase Dashboard SQL Editor
- **Deploy target**: Vercel-ready (static SPA + Supabase). The artifact's static-build mode also runs on Replit Deployments.

## Artifacts

- `artifacts/barbermetrics` — React + Vite SPA (root path `/`)
- `artifacts/mockup-sandbox` — design canvas (unused for this product)

## Domain model (Supabase tables)

All tables include `user_id uuid references auth.users(id) on delete cascade` and have RLS policies that restrict every operation to `user_id = auth.uid()`.

- `services` — barber's service catalog (name, price, duration_minutes, is_active, created_at)
- `appointments` — every completed service (service_id nullable for "avulso", price, started_at, ended_at, duration_seconds, note)
- `settings` — one row per user (PK = user_id) with barbershop_name, daily_goal, currency, work_start_time/end_time, work_days, theme. A trigger on `auth.users` auto-creates a row on signup.

## Frontend data layer

`artifacts/barbermetrics/src/lib/`:

- `supabase.ts` — Supabase client (uses `VITE_SUPABASE_URL` + `VITE_SUPABASE_PUBLISHABLE_KEY`)
- `auth.tsx` — `<AuthProvider>` + `useAuth()` (session, signIn, signUp, signOut)
- `data/services.ts`, `data/appointments.ts`, `data/settings.ts` — React Query hooks that wrap Supabase queries (`useListServices`, `useCreateService`, `useListAppointments`, `useCreateAppointment`, `useGetSettings`, `useUpdateSettings`, …)
- `data/summary.ts` — `useGetDailySummary`, `useGetRangeSummary`, `useGetInsights` — these used to be backend endpoints; they now fetch raw appointments/settings from Supabase and aggregate client-side
- `data/dates.ts`, `data/mappers.ts`, `data/types.ts` — helpers and type definitions

`App.tsx` wraps `<AppLayout>` in an auth gate: when unauthenticated, the user lands on `pages/Login.tsx` (email/password sign-in or sign-up).

## Required environment variables

Public (frontend, set as env vars in `shared`):

- `VITE_SUPABASE_URL` — Supabase project URL
- `VITE_SUPABASE_PUBLISHABLE_KEY` — Supabase publishable (anon) key

No backend secrets are needed in production.

## Schema migrations

To create / refresh the schema in Supabase, copy the contents of `supabase/schema.sql` into the Supabase Dashboard SQL Editor and run it. The script is idempotent (drops and recreates tables, policies, and the new-user trigger).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **Frontend**: React 19, Vite 7, Tailwind v4, framer-motion, recharts, sonner, zustand, date-fns
- **Data**: `@supabase/supabase-js` + `@tanstack/react-query`

## Key Commands

- `pnpm install` — install workspace dependencies
- `pnpm --filter @workspace/barbermetrics run typecheck` — typecheck the SPA
- `pnpm --filter @workspace/barbermetrics run dev` — run the SPA locally
- `pnpm --filter @workspace/barbermetrics run build` — production build (static)

## Deploying to Vercel

1. Connect this repo to Vercel.
2. Set the build command to `pnpm --filter @workspace/barbermetrics run build`.
3. Set the output directory to `artifacts/barbermetrics/dist/public`.
4. Add the env vars `VITE_SUPABASE_URL` and `VITE_SUPABASE_PUBLISHABLE_KEY`.
5. Deploy.
