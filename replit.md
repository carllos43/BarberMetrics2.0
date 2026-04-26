# Workspace

## Overview

pnpm workspace monorepo using TypeScript. Each package manages its own dependencies.

The active product is **BarberMetrics 2.0** — a premium iPhone-style cash-book and performance app for solo barbers (Brazilian Portuguese UI). Frontend is an iOS-styled React SPA with bottom tab navigation, glass chrome, bottom sheets, spring animations, and a tabular-nums money/timer display. Backend is the shared Express API server with Postgres + Drizzle.

## Artifacts

- `artifacts/barbermetrics` — React + Vite frontend (iOS dark mode, amber accents)
- `artifacts/api-server` — Express API serving services, appointments, settings, and summary endpoints
- `artifacts/mockup-sandbox` — design canvas (unused for this product)

## Domain model

- `services` — barber's service catalog (name, price, durationMinutes, isActive)
- `appointments` — every completed haircut/service (serviceId nullable for "avulso", priced, started/ended/duration, optional note)
- `settings` — single-row table (id=1) with barbershopName, dailyGoal (BRL), workStartTime/EndTime, workDays, currency

## API surface (under `/api`)

- `GET/POST /services`, `PATCH/DELETE /services/:id`
- `GET/POST /appointments` (date / startDate / endDate / serviceId filters), `PATCH/DELETE /appointments/:id`
- `GET /summary/daily?date=YYYY-MM-DD`
- `GET /summary/range?startDate=&endDate=`
- `GET /summary/insights?date=YYYY-MM-DD` — predictive insights computed in SQL/JS (no LLM)
- `GET/PATCH /settings`

OpenAPI spec lives in `lib/api-spec/openapi.yaml`. Re-run `pnpm --filter @workspace/api-spec run codegen` after any spec change to refresh the React Query hooks (`@workspace/api-client-react`) and Zod schemas (`@workspace/api-zod`).

## Stack

- **Monorepo tool**: pnpm workspaces
- **Node.js version**: 24
- **Package manager**: pnpm
- **TypeScript version**: 5.9
- **API framework**: Express 5
- **Database**: PostgreSQL + Drizzle ORM
- **Validation**: Zod (`zod/v4`), `drizzle-zod`
- **API codegen**: Orval (from OpenAPI spec)
- **Build**: esbuild (CJS bundle)

## Key Commands

- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- `pnpm --filter @workspace/api-server run dev` — run API server locally

See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details.
