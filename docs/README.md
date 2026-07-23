Read AGENTS.md and docs/REDS_CODEX_WORKFLOW_PLAN.md first.

Use the files explicitly named in the task prompt as the primary scope.

Inspect additional files only when they are directly required to:
- trace imports or dependencies
- confirm generated Supabase types
- confirm RPC signatures
- confirm routes, permissions or shared components
- understand an error that cannot be resolved from the named files

Do not scan or modify unrelated files.
Do not guess schema, RPC arguments, statuses or permissions.
Run TypeScript checking and production build after changes.
Review the diff.
Do not commit or push unless explicitly requested.