-- Local-only fixture for manual Quotations permission testing.
-- Create these users through the local Auth Admin API before running this file:
--   quotation-cost@reds.local
--   quotation-redacted@reds.local
--   quotation-no-discount@reds.local
-- Use password 123456 for all three accounts.

begin;

do $$
begin
    if (
        select count(*)
        from auth.users
        where email in (
            'quotation-cost@reds.local',
            'quotation-redacted@reds.local',
            'quotation-no-discount@reds.local'
        )
    ) <> 3 then
        raise exception 'Create all three local quotation test users through the Auth Admin API first.';
    end if;
end;
$$;

insert into public.app_users (
    auth_user_id,
    email,
    display_name,
    account_status,
    approved_at
)
select
    u.id,
    u.email,
    u.raw_user_meta_data ->> 'display_name',
    'Active',
    now()
from auth.users u
where u.email in (
    'quotation-cost@reds.local',
    'quotation-redacted@reds.local',
    'quotation-no-discount@reds.local'
);

insert into public.app_permissions (
    permission_code,
    permission_name,
    module_code,
    action_code,
    description,
    sort_order
)
select
    permission_code,
    permission_code,
    split_part(permission_code, '.', 1),
    split_part(permission_code, '.', 2),
    'Local Quotations permission test fixture',
    sort_order
from (
    values
        ('quotations.view', 1),
        ('quotations.view_internal', 2),
        ('quotations.view_cost', 3),
        ('quotations.view_margin', 4),
        ('quotations.update_draft', 5),
        ('quotations.apply_discount', 6),
        ('projects.view', 7),
        ('project_sites.view', 8)
) fixture(permission_code, sort_order)
on conflict (permission_code) do nothing;

insert into public.app_user_permission_overrides (
    auth_user_id,
    permission_id,
    is_allowed,
    reason,
    is_active
)
select
    auth_user.id,
    permission.permission_id,
    true,
    'Local Quotations permission test fixture',
    true
from (
    values
        ('quotation-cost@reds.local', 'quotations.view'),
        ('quotation-cost@reds.local', 'quotations.view_internal'),
        ('quotation-cost@reds.local', 'quotations.view_cost'),
        ('quotation-cost@reds.local', 'quotations.view_margin'),
        ('quotation-cost@reds.local', 'quotations.update_draft'),
        ('quotation-cost@reds.local', 'quotations.apply_discount'),
        ('quotation-cost@reds.local', 'projects.view'),
        ('quotation-cost@reds.local', 'project_sites.view'),
        ('quotation-redacted@reds.local', 'quotations.view'),
        ('quotation-redacted@reds.local', 'quotations.view_internal'),
        ('quotation-redacted@reds.local', 'quotations.update_draft'),
        ('quotation-redacted@reds.local', 'quotations.apply_discount'),
        ('quotation-redacted@reds.local', 'projects.view'),
        ('quotation-redacted@reds.local', 'project_sites.view'),
        ('quotation-no-discount@reds.local', 'quotations.view'),
        ('quotation-no-discount@reds.local', 'quotations.view_internal'),
        ('quotation-no-discount@reds.local', 'quotations.view_cost'),
        ('quotation-no-discount@reds.local', 'quotations.view_margin'),
        ('quotation-no-discount@reds.local', 'quotations.update_draft'),
        ('quotation-no-discount@reds.local', 'projects.view'),
        ('quotation-no-discount@reds.local', 'project_sites.view')
) fixture(email, permission_code)
join auth.users auth_user
  on auth_user.email = fixture.email
join public.app_permissions permission
  on permission.permission_code = fixture.permission_code;

-- The fixture's approved discount is inserted under the cost-viewer identity so
-- the same production permission guard used by the application remains active.
select set_config(
    'request.jwt.claim.sub',
    (
        select id::text
        from auth.users
        where email = 'quotation-cost@reds.local'
    ),
    true
);

insert into public.units_of_measure (
    uom_code,
    uom_name,
    uom_symbol,
    uom_category,
    decimal_places,
    sort_order
)
values ('sqm', 'Square Metre', 'm²', 'Area', 2, 1);

insert into public.price_books (
    price_book_id,
    price_book_code,
    price_book_name,
    effective_from,
    is_default
)
values (
    '92000000-0000-0000-0000-000000000001',
    'LOCAL-QA',
    'Local Quotations QA',
    current_date,
    true
);

insert into public.customers (
    customer_id,
    customer_code,
    customer_name,
    customer_type,
    price_book_id
)
values (
    '92000000-0000-0000-0000-000000000002',
    'LOCAL-QA-CUSTOMER',
    'Local Quotations QA Customer',
    'Residential',
    '92000000-0000-0000-0000-000000000001'
);

insert into public.projects (
    project_id,
    project_no,
    customer_id,
    project_name,
    project_type,
    project_status,
    price_book_id
)
values (
    '92000000-0000-0000-0000-000000000003',
    'LOCAL-QA-PROJECT',
    '92000000-0000-0000-0000-000000000002',
    'Local Quotations QA Project',
    'Residential',
    'Draft',
    '92000000-0000-0000-0000-000000000001'
);

insert into public.project_sites (
    site_id,
    project_id,
    site_code,
    site_name,
    site_status
)
values (
    '92000000-0000-0000-0000-000000000004',
    '92000000-0000-0000-0000-000000000003',
    'LOCAL-QA-SITE',
    'Local Quotations QA Site',
    'Quotation'
);

insert into public.quotations (
    quotation_id,
    quotation_no,
    customer_id,
    project_site_id,
    price_book_id,
    quotation_segment,
    quotation_status,
    issue_date,
    valid_until,
    subtotal_amount,
    discount_amount,
    tax_amount,
    total_amount,
    internal_notes
)
values (
    '92000000-0000-0000-0000-000000000005',
    'LOCAL-QA-QUOTE',
    '92000000-0000-0000-0000-000000000002',
    '92000000-0000-0000-0000-000000000004',
    '92000000-0000-0000-0000-000000000001',
    'Retail',
    'Draft',
    current_date,
    current_date + 30,
    200,
    20,
    18,
    198,
    'Local permission test'
);

insert into public.quotation_lines (
    quotation_line_id,
    quotation_id,
    line_uid,
    line_no,
    description,
    unit_of_measure,
    sales_uom_code,
    base_uom_code,
    conversion_factor,
    quantity,
    base_quantity,
    unit_price,
    discount_percent,
    discount_amount,
    discount_reason,
    tax_rate,
    tax_amount,
    line_total,
    cost_price,
    margin_amount,
    margin_percent,
    billing_method,
    price_source
)
values (
    '92000000-0000-0000-0000-000000000006',
    '92000000-0000-0000-0000-000000000005',
    '92000000-0000-0000-0000-000000000007',
    1,
    'Local permission test line',
    'sqm',
    'sqm',
    'sqm',
    1,
    2,
    2,
    100,
    10,
    20,
    'Existing approved test discount',
    10,
    18,
    198,
    40,
    100,
    55.56,
    'Quantity',
    'Manual'
);

commit;
