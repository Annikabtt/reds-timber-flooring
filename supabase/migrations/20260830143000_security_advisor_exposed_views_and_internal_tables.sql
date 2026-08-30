-- Harden public views and internal notification tables reported by the
-- Supabase Security Advisor. Client-facing views execute with the caller's
-- RLS context; backend-only notification tables remain service-role only.

begin;

-- The hosted database contains this view, but it is absent from the current
-- local migration history. Harden it when present without inventing a local
-- replacement for the separately drifted thickness-code schema.
do $block$
begin
    if to_regclass('public.product_thickness_codes_ui') is not null then
        execute 'alter view public.product_thickness_codes_ui set (security_invoker = true)';
        execute 'revoke all on table public.product_thickness_codes_ui from anon, authenticated';
        execute 'grant select on table public.product_thickness_codes_ui to authenticated';
    end if;
end;
$block$;

alter view public.project_area_progress_v
    set (security_invoker = true);

alter view public.v_cash_flow
    set (security_invoker = true);

alter view public.v_outstanding_invoices
    set (security_invoker = true);

alter view public.v_payroll_summary
    set (security_invoker = true);

alter view public.v_project_profitability
    set (security_invoker = true);

alter view public.v_project_progress
    set (security_invoker = true);

-- Views are read models. Anonymous access is not required by the application,
-- and authenticated users must still pass every underlying table's RLS policy.
revoke all on table public.project_area_progress_v from anon, authenticated;
revoke all on table public.v_cash_flow from anon, authenticated;
revoke all on table public.v_outstanding_invoices from anon, authenticated;
revoke all on table public.v_payroll_summary from anon, authenticated;
revoke all on table public.v_project_profitability from anon, authenticated;
revoke all on table public.v_project_progress from anon, authenticated;

grant select on table public.project_area_progress_v to authenticated;
grant select on table public.v_cash_flow to authenticated;
grant select on table public.v_outstanding_invoices to authenticated;
grant select on table public.v_payroll_summary to authenticated;
grant select on table public.v_project_profitability to authenticated;
grant select on table public.v_project_progress to authenticated;

-- These tables are written and read by trusted notification processing only.
-- With no client RLS policies, remove the broad grants inherited from the
-- original schema instead of adding permissive policies to silence the linter.
revoke all on table public.notification_delivery_attempts from anon, authenticated;
revoke all on table public.notification_destinations from anon, authenticated;
revoke all on table public.notification_event_types from anon, authenticated;
revoke all on table public.notification_events from anon, authenticated;
revoke all on table public.notification_routing_rules from anon, authenticated;

commit;
