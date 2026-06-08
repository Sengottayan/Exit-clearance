# ExitFlow

A production-grade internal HR platform for IT companies that manages the complete employee exit lifecycle — from resignation submission through multi-department clearances to issuing the final relieving letter.

## Run & Operate

- `pnpm --filter @workspace/exitflow run dev` — run the ExitFlow frontend (port auto-assigned)
- `pnpm --filter @workspace/api-server run dev` — run the API server (port 8080)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- Frontend: React + Vite + Wouter routing (at `/`)
- Styling: Tailwind CSS v4 + Shadcn/UI
- State: Zustand (frontend-only, no backend calls)
- Forms: React Hook Form + Zod
- Charts: Recharts
- Icons: Lucide React
- Fonts: DM Sans (UI) + DM Mono (data/IDs)
- Toasts: Sonner

## Where things live

- `artifacts/exitflow/src/lib/types.ts` — all TypeScript types (Role, ExitCase, ClearanceTask, etc.)
- `artifacts/exitflow/src/lib/constants.ts` — MOCK_USERS, DEPARTMENTS, CHECKLIST_TEMPLATES, EXIT_REASONS, NAV_CONFIG
- `artifacts/exitflow/src/lib/utils.ts` — cn, formatDate, getInitials, getAvatarColor, daysUntil, hoursUntil
- `artifacts/exitflow/src/store/authStore.ts` — Zustand auth store (persisted to localStorage)
- `artifacts/exitflow/src/store/exitStore.ts` — Zustand exit cases store with seed data
- `artifacts/exitflow/src/hooks/useSLA.ts` — live SLA status calculation from dueAt
- `artifacts/exitflow/src/index.css` — design system CSS variables (DM Sans/DM Mono fonts + full palette)
- `artifacts/exitflow/src/App.tsx` — wouter router + protected routes

## Architecture decisions

- **Frontend-only**: All state in Zustand with mock data — no backend API calls needed for the HR workflow simulation.
- **Role-aware single app**: One URL (`/dashboard`) renders completely different content per role (Employee / Manager / HR / Dept Approver / Admin).
- **Route protection via ProtectedRoute component**: Unauthenticated → /login; wrong role → /dashboard.
- **Task ID format**: `/tasks/:taskId` uses `caseId__deptId` double-underscore format for easy parsing.
- **SLA always live-calculated**: `useSLA(dueAt)` hook uses date-fns differenceInHours against Date.now() — never hardcoded strings.

## Product

**5 roles, one unified app:**
- **Employee**: Submits resignation, tracks their own exit clearance progress and documents
- **Manager**: Approves team resignations, completes their own clearance checklist
- **HR**: Manages all exit cases, initiates new cases via 4-step wizard, generates documents
- **Dept Approver**: Completes department-specific clearance checklists with SLA tracking
- **Admin**: System overview, reports, department config, workflow rules, user management

## Demo Credentials

All passwords: `demo`

| Role | Email |
|---|---|
| Employee | priya@company.com |
| Manager | rahul@company.com |
| HR Team | anita@company.com |
| IT Approver | kiran@company.com |
| Finance Approver | sunita@company.com |
| Admin | admin@company.com |

Or use the demo role cards on the login page for instant one-click login.

## Gotchas

- `lib/utils.ts` must export `formatDate`, `getInitials`, `getAvatarColor` — these are used by many components.
- When adding Google Fonts `@import url(...)` to index.css it MUST be the very first line — before `@import "tailwindcss"`.
- The Zustand auth store is persisted to localStorage (`exitflow-auth`) — clear it to reset login state.
- SLA due dates in seed data are set relative to Jan 2025 — the SLA chips will show "Overdue" states by design (demonstrating the overdue workflow).
