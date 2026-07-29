-- REDS Timber Flooring
-- Stock Issue Phase B1 — Permission Foundation
-- Local-first migration. Review before applying to Production.

begin;

-- ---------------------------------------------------------------------------
-- 1. Seed database-driven Stock Issue permissions
-- ---------------------------------------------------------------------------

insert into public.app_permissions (
    permission_id,
    permission_code,
    permission_name,
    module_code,
    action_code,
    description,
    is_system_permission,
    is_active,
    sort_order
)
select
    gen_random_uuid(),
    p.permission_code,
    p.permission_name,
    'stock_issues',
    p.action_code,
    p.description,
    true,
    true,
    p.sort_order
from (
    values
        ('stock_issues.view',            'View Stock Issues',             'view',            'View Stock Issues, lines, allocations, receipts and audit history.', 100),
        ('stock_issues.create',          'Create Stock Issues',           'create',          'Create Draft Stock Issues from approved Stock Requests.',            110),
        ('stock_issues.update_draft',    'Update Draft Stock Issues',     'update_draft',    'Update Draft Stock Issue headers, lines and lot allocations.',       120),
        ('stock_issues.prepare',         'Prepare Stock Issues',          'prepare',         'Prepare Draft Stock Issues for issuing.',                            130),
        ('stock_issues.issue',           'Issue Stock',                   'issue',           'Issue prepared stock and post stock movements.',                     140),
        ('stock_issues.dispatch',        'Dispatch Stock Issues',         'dispatch',        'Dispatch and mark Stock Issues as delivered.',                       150),
        ('stock_issues.confirm_receipt', 'Confirm Stock Issue Receipts',  'confirm_receipt', 'Create, confirm and cancel Stock Issue receipt sessions.',           160),
        ('stock_issues.cancel',          'Cancel Stock Issues',           'cancel',          'Cancel eligible Stock Issues.',                                      170),
        ('stock_issues.print',           'Print Stock Issues',            'print',           'Print Stock Issue lists and operational documents.',                 180),
        ('stock_issues.export_pdf',      'Export Stock Issues to PDF',    'export_pdf',      'Export Stock Issue lists and documents to PDF.',                     190),
        ('stock_issues.export_csv',      'Export Stock Issues to CSV',    'export_csv',      'Export filtered Stock Issue data to CSV.',                           200),
        ('stock_issues.view_photos',     'View Stock Issue Photos',       'view_photos',     'View receipt and delivery-condition photos.',                        210)
) as p(permission_code, permission_name, action_code, description, sort_order)
where not exists (
    select 1
    from public.app_permissions existing
    where existing.permission_code = p.permission_code
);

update public.app_permissions ap
set
    permission_name = p.permission_name,
    module_code = 'stock_issues',
    action_code = p.action_code,
    description = p.description,
    is_system_permission = true,
    is_active = true,
    sort_order = p.sort_order
from (
    values
        ('stock_issues.view',            'View Stock Issues',             'view',            'View Stock Issues, lines, allocations, receipts and audit history.', 100),
        ('stock_issues.create',          'Create Stock Issues',           'create',          'Create Draft Stock Issues from approved Stock Requests.',            110),
        ('stock_issues.update_draft',    'Update Draft Stock Issues',     'update_draft',    'Update Draft Stock Issue headers, lines and lot allocations.',       120),
        ('stock_issues.prepare',         'Prepare Stock Issues',          'prepare',         'Prepare Draft Stock Issues for issuing.',                            130),
        ('stock_issues.issue',           'Issue Stock',                   'issue',           'Issue prepared stock and post stock movements.',                     140),
        ('stock_issues.dispatch',        'Dispatch Stock Issues',         'dispatch',        'Dispatch and mark Stock Issues as delivered.',                       150),
        ('stock_issues.confirm_receipt', 'Confirm Stock Issue Receipts',  'confirm_receipt', 'Create, confirm and cancel Stock Issue receipt sessions.',           160),
        ('stock_issues.cancel',          'Cancel Stock Issues',           'cancel',          'Cancel eligible Stock Issues.',                                      170),
        ('stock_issues.print',           'Print Stock Issues',            'print',           'Print Stock Issue lists and operational documents.',                 180),
        ('stock_issues.export_pdf',      'Export Stock Issues to PDF',    'export_pdf',      'Export Stock Issue lists and documents to PDF.',                     190),
        ('stock_issues.export_csv',      'Export Stock Issues to CSV',    'export_csv',      'Export filtered Stock Issue data to CSV.',                           200),
        ('stock_issues.view_photos',     'View Stock Issue Photos',       'view_photos',     'View receipt and delivery-condition photos.',                        210)
) as p(permission_code, permission_name, action_code, description, sort_order)
where ap.permission_code = p.permission_code;

-- ---------------------------------------------------------------------------
-- 2. Grant the complete baseline to active Admin roles when present
-- ---------------------------------------------------------------------------

insert into public.app_role_permissions (
    role_id,
    permission_id,
    is_allowed
)
select
    r.role_id,
    p.permission_id,
    true
from public.app_roles r
join public.app_permissions p
  on p.permission_code like 'stock_issues.%'
 and p.is_active = true
where lower(r.role_code) = 'admin'
  and r.is_active = true
  and not exists (
      select 1
      from public.app_role_permissions rp
      where rp.role_id = r.role_id
        and rp.permission_id = p.permission_id
  );

update public.app_role_permissions rp
set
    is_allowed = true,
    updated_at = now()
from public.app_roles r
join public.app_permissions p
  on p.permission_code like 'stock_issues.%'
 and p.is_active = true
where rp.role_id = r.role_id
  and rp.permission_id = p.permission_id
  and lower(r.role_code) = 'admin'
  and r.is_active = true;

-- ---------------------------------------------------------------------------
-- 3. Installation assertions
-- ---------------------------------------------------------------------------

do $$
declare
    v_permission_count integer;
    v_active_admin_count integer;
    v_admin_grant_count integer;
begin
    select count(*)
    into v_permission_count
    from public.app_permissions
    where permission_code like 'stock_issues.%'
      and is_active = true;

    if v_permission_count <> 12 then
        raise exception
            'Stock Issue permission installation failed: expected 12 active permissions, found %.',
            v_permission_count;
    end if;

    select count(*)
    into v_active_admin_count
    from public.app_roles
    where lower(role_code) = 'admin'
      and is_active = true;

    if v_active_admin_count > 0 then
        select count(*)
        into v_admin_grant_count
        from public.app_role_permissions rp
        join public.app_roles r
          on r.role_id = rp.role_id
        join public.app_permissions p
          on p.permission_id = rp.permission_id
        where lower(r.role_code) = 'admin'
          and r.is_active = true
          and p.permission_code like 'stock_issues.%'
          and p.is_active = true
          and rp.is_allowed = true;

        if v_admin_grant_count <> (12 * v_active_admin_count) then
            raise exception
                'Stock Issue Admin permission installation failed: expected % allowed grants, found %.',
                12 * v_active_admin_count,
                v_admin_grant_count;
        end if;
    end if;
end;
$$;

commit;
