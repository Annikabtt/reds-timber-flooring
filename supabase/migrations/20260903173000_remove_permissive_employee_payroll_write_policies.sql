-- REDS Timber Flooring
-- Remove legacy write policies that bypass the existing payroll-role guards.

begin;

do $guard$
begin
    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'employees'
          and policyname = 'employees_write'
    ) then
        raise exception
            'Expected protected policy public.employees.employees_write was not found.';
    end if;

    if not exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename = 'payroll_periods'
          and policyname = 'payroll_periods_policy'
    ) then
        raise exception
            'Expected protected policy public.payroll_periods.payroll_periods_policy was not found.';
    end if;
end
$guard$;

drop policy if exists "Allow authenticated insert employees"
    on public.employees;

drop policy if exists "Allow authenticated update employees"
    on public.employees;

drop policy if exists "Allow authenticated insert payroll periods"
    on public.payroll_periods;

drop policy if exists "Allow authenticated update payroll periods"
    on public.payroll_periods;

do $assertion$
begin
    if exists (
        select 1
        from pg_policies
        where schemaname = 'public'
          and tablename in ('employees', 'payroll_periods')
          and cmd in ('INSERT', 'UPDATE', 'DELETE', 'ALL')
          and (
              coalesce(qual, '') = 'true'
              or coalesce(with_check, '') = 'true'
          )
    ) then
        raise exception
            'Permissive employee/payroll write policy remains after hardening.';
    end if;
end
$assertion$;

commit;
