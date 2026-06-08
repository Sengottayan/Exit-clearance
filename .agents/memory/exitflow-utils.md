---
name: ExitFlow utils.ts required exports
description: The scaffold ships utils.ts with only `cn`. ExitFlow components need additional exports that must be added manually.
---

## Required exports in artifacts/exitflow/src/lib/utils.ts

The DESIGN subagent generates components importing these helpers but the scaffold's utils.ts only ships `cn`. Always add:

- `formatDate(date, fmt?)` — wraps date-fns `format`, default fmt `"dd MMM yyyy"`
- `formatRelative(date)` — wraps date-fns `formatDistanceToNow` with addSuffix
- `getInitials(name)` — splits on space, takes first char each, max 2 chars
- `getAvatarColor(name)` — hashes name to pick from 8 Tailwind bg-color classes consistently

**Why:** The DESIGN subagent writes components that import these before the file is updated, causing Vite pre-bundle scan failures and runtime "does not provide an export" errors on first boot.

**How to apply:** After any DESIGN subagent run on this project, check that utils.ts has all four exports. If not, add them immediately before restarting the workflow.
