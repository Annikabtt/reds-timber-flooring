# Daily Report permissions and atomic persistence status

## Scope

- Every Active app member can read non-deleted Daily Reports and photos.
- Create, update, delete, upload-photo, review-photo and delete-photo actions use
  database permissions with role grants and individual overrides.
- Runtime authorization does not use JWT role names. Individual denials retain
  precedence through the existing `has_permission()` contract.
- Payroll authorization remains separate. Approved payroll time logs lock Daily
  Report content edits.

## Implemented locally

- `daily_report_member_permissions.sql` installs the six Daily Report permission
  catalog entries, compatibility role grants, Active-member read policies and
  permission-specific write policies for reports, activities, workers and photo
  metadata.
- `create_daily_report_bundle_atomic.sql` creates the report, activities, workers
  and time logs in one transaction while preserving time-log RLS.
- `update_daily_report_bundle_atomic.sql` accepts a complete desired child state.
  Existing child IDs are retained, new rows are inserted and omitted workers and
  activities are removed in the same transaction. Omitted work-time logs are
  soft-deleted with `deleted_at` and `updated_by`, preserving their audit history.
  It rejects stale versions, protected fields, approved reports/activities and
  approved payroll time logs.
- `daily_report_photo_storage_private.sql` converts supported legacy public URLs
  to object paths, makes `daily-report-photos` private and installs Active-member
  read plus permission-driven write policies.
- `../migrations/20260907160000_daily_report_atomic_security.sql` promotes the
  reviewed permission, atomic-RPC and private-Storage drafts into one ordered
  migration. It passed against local Supabase and was applied to production on
  2026-09-08 after the legacy Storage policies were explicitly reviewed.
- Daily Report list, detail, mobile entry and photo approval screens now expose
  loading, error, inactive-member and permission-aware read-only states. Every
  write rechecks current permissions before the first mutation.
- Main, mobile and Dashboard report saves use the atomic RPCs. Worker check-in,
  check-out, correction, addition and removal submit a complete atomic worker/time
  state. Dashboard time inputs convert database timestamps for display and convert
  clock values back to `timestamptz` before save; OT remains `time without time zone`.
  Payload normalization sends clock fields as `timestamptz`, OT fields as
  `time without time zone`, and empty UUID/date/time values as `null`.
  Editing preserves the version loaded with the form and asks the user to reopen
  the report when a stale version is rejected.
- Mobile and desktop photo uploads store private object paths. Metadata failures
  remove the uploaded object and surface cleanup failure if cleanup also fails.
  Photo upload failures remain visible and do not produce a false success state.
- Detail, Photo Approval and Variation Records resolve private signed URLs,
  including supported legacy public URL values.
- Supabase types were regenerated from the production schema after the migration
  completed. `src/lib/dailyReportApi.ts` now uses the generated RPC signatures
  directly.
- `20260908093000_daily_report_approved_lock.sql` adds a database guard that
  blocks any update to an Approved report and any photo write under it. Dashboard
  action controls mirror the same read-only rule.

## Local validation on 2026-09-07

- TypeScript: passed (`npx tsc --noEmit`).
- Production build: passed with the repository's production Vite settings sent
  through the Node API. The normal CLI config loader is blocked by the desktop
  sandbox while traversing worktree parent directories. Existing Browserslist,
  mixed jsPDF import and large chunk warnings remain.
- Unit tests: 13 passed across 3 files after the final payload and audit-history
  changes. The same config-loader sandbox restriction required
  running Vitest through its Node API with the repository test settings.
- Targeted ESLint for the Daily Report implementation passed.
- Full-project ESLint still fails on the existing baseline: 164 errors and 32
  warnings in unrelated modules and pre-existing sections of Variation Records.
- Local SQL: the permissions, create and update drafts applied successfully.
  Permission regression passed 16 assertions and atomic create/edit regression
  passed 27 assertions, including activity primary-key retention and the omitted
  work-time-log audit-history case.
  Test fixtures roll back. The Private Storage draft was reapplied and its six
  assertions passed against local Supabase.

## Remaining before promotion

1. Run browser tests for read-only members, individual allow/deny, suspended
   accounts, desktop/mobile create and edit, stale-editor conflicts, approved
   payroll locks, photo upload/review/delete, Variation photo display and direct
   photo URL access after logout.
2. Review report approval/rejection workflow semantics separately. These actions
   remain single-row RLS-protected updates and are outside the content-bundle RPC.
3. Do not deploy the frontend independently of the database and Storage changes.

The reviewed migration was applied to Supabase production on 2026-09-08. The
frontend and migrations were committed, pushed and deployed through Vercel
Preview before each production update.
