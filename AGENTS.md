# AGENTS.md — REDS Timber Flooring Engineering Rules

## Project stack

- React
- TypeScript
- Vite
- Tailwind CSS
- Supabase Postgres, Auth, Storage and RLS
- React Query
- shadcn/ui
- Sonner
- Lucide icons

## Source of truth

Use this order:

1. Database schema
2. PostgreSQL function definitions
3. Generated Supabase types
4. Passing backend tests
5. Current repository source
6. Project documentation
7. Chat history

Never override schema facts with memory or assumptions.

## Before editing

1. Read the complete current target files.
2. Read generated Supabase types.
3. Confirm table columns.
4. Confirm relationships.
5. Confirm RPC signatures.
6. Confirm permission codes.
7. Confirm routes and navigation.
8. Inspect existing working UI patterns.
9. Report findings before making a major structural change.
10. Do not guess.

## Database and backend rules

- Use existing atomic RPCs for write operations.
- Do not write directly to protected workflow tables when an RPC exists.
- Never modify generated Supabase types manually.
- Never invent RPC names, parameters, statuses or permission codes.
- Preserve accepted quotation and revision snapshots.
- Preserve append-only adjustment history.
- Respect RLS and backend authorization.
- Convert empty form values safely before sending UUID/date parameters.
- Do not send empty strings where the backend expects UUID, date or nullable values.

## Permission rules

- Use database-driven permission checks.
- Do not rely only on JWT role names for UI authorization.
- Hide cost, margin and internal fields when permission is absent.
- Backend remains the final authority.

## UI rules

- Follow REDS UI standard.
- Support desktop tables and mobile cards.
- Dialogs must have a maximum height and internal scrolling.
- Use sticky action footers where appropriate.
- Support loading, error, empty and disabled states.
- Prevent duplicate submissions.
- Display actionable error messages.
- Do not show raw UUIDs when a human-readable name is available.
- Avoid hard-coded master data.
- Do not include production mock data.

## UOM rules

- Resolve Sales UOM, Base UOM and conversion from actual product data.
- Use `product_uom_conversions`.
- Do not assume conversion factor is 1 unless Sales UOM equals Base UOM.
- Validate conversion before save.
- Store required conversion snapshots where the schema requires them.

## React rules

- Avoid state updates during render.
- Avoid unstable dependency arrays.
- Prevent infinite render loops.
- Use React Query invalidation after mutations.
- Do not hide query errors as empty states.
- Avoid stale closures in mutation handlers.
- Use stable client IDs with an HTTP-safe fallback.

## Code quality

- Prefer explicit types.
- Avoid broad `any`.
- Keep changes focused.
- Do not refactor unrelated modules.
- Add comments only where they explain non-obvious business logic.
- Remove temporary console debugging before completion.

## Required validation

After editing, run:

```powershell
npx tsc --noEmit
npm run build
```

Also run when available:

```powershell
npm run lint
npm test
```

Then review:

```powershell
git diff --stat
git diff
```

## Self-review checklist

Check for:

- invented schema fields
- wrong RPC arguments
- direct table writes
- missing query invalidation
- empty string sent to UUID/date
- UOM conversion mistakes
- permission assumptions
- render loops
- stale closures
- unscrollable dialogs
- mobile overflow
- duplicate submit
- source snapshot mutation
- hidden backend errors
- unrelated file changes

## Reporting

At the end, report:

1. Files inspected
2. Files changed
3. Root cause
4. Commands run
5. TypeScript result
6. Build result
7. Test result
8. Remaining risks
9. Manual browser tests still required

Do not claim production readiness unless the relevant checks were actually run.

## Git

- Do not commit or push unless explicitly requested.
- Work in a feature branch.
- Do not overwrite unrelated user changes.
