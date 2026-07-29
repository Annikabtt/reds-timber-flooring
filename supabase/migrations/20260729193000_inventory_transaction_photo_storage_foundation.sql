-- REDS Timber Flooring
-- Inventory Transaction Photo Storage Foundation
-- Adds the shared private bucket, Storage RLS policies,
-- and Stock Issue photo upload/delete permissions.

begin;

-- ---------------------------------------------------------------------------
-- 1. Add missing Stock Issue photo permissions
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
        (
            'stock_issues.upload_photos',
            'Upload Stock Issue Photos',
            'upload_photos',
            'Upload Stock Issue and Stock Issue Receipt evidence photos.',
            220
        ),
        (
            'stock_issues.delete_photos',
            'Delete Stock Issue Photos',
            'delete_photos',
            'Soft-delete photo metadata and remove Stock Issue photo objects when permitted.',
            230
        )
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
        (
            'stock_issues.upload_photos',
            'Upload Stock Issue Photos',
            'upload_photos',
            'Upload Stock Issue and Stock Issue Receipt evidence photos.',
            220
        ),
        (
            'stock_issues.delete_photos',
            'Delete Stock Issue Photos',
            'delete_photos',
            'Soft-delete photo metadata and remove Stock Issue photo objects when permitted.',
            230
        )
) as p(permission_code, permission_name, action_code, description, sort_order)
where ap.permission_code = p.permission_code;

-- Grant to active Admin roles when roles have already been seeded.
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
  on p.permission_code in (
      'stock_issues.upload_photos',
      'stock_issues.delete_photos'
  )
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
  on p.permission_code in (
      'stock_issues.upload_photos',
      'stock_issues.delete_photos'
  )
 and p.is_active = true
where rp.role_id = r.role_id
  and rp.permission_id = p.permission_id
  and lower(r.role_code) = 'admin'
  and r.is_active = true;

-- ---------------------------------------------------------------------------
-- 2. Create or normalize the shared private Storage bucket
-- ---------------------------------------------------------------------------

insert into storage.buckets (
    id,
    name,
    public,
    file_size_limit,
    allowed_mime_types
)
values (
    'inventory-transaction-photos',
    'inventory-transaction-photos',
    false,
    10485760,
    array[
        'image/jpeg',
        'image/png',
        'image/webp'
    ]::text[]
)
on conflict (id) do update
set
    name = excluded.name,
    public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

-- ---------------------------------------------------------------------------
-- 3. Storage object RLS policies
--
-- The bucket is shared by Stock Requests, Stock Issues and Tool Loans.
-- Metadata-level source validation remains enforced by
-- public.inventory_transaction_photos RLS and its helper functions.
-- ---------------------------------------------------------------------------

drop policy if exists inventory_transaction_photos_storage_select
    on storage.objects;

create policy inventory_transaction_photos_storage_select
on storage.objects
for select
to authenticated
using (
    bucket_id = 'inventory-transaction-photos'
    and (
        public.has_permission('stock_requests.view')
        or public.has_permission('stock_requests.view_own')
        or public.has_permission('stock_issues.view')
        or public.has_permission('tool_loans.view')
        or public.has_permission('tool_loans.view_own')
    )
);

drop policy if exists inventory_transaction_photos_storage_insert
    on storage.objects;

create policy inventory_transaction_photos_storage_insert
on storage.objects
for insert
to authenticated
with check (
    bucket_id = 'inventory-transaction-photos'
    and nullif(btrim(name), '') is not null
    and (
        public.has_permission('stock_requests.upload_photos')
        or public.has_permission('stock_issues.upload_photos')
        or public.has_permission('tool_loans.upload_photos')
    )
);

drop policy if exists inventory_transaction_photos_storage_update
    on storage.objects;

create policy inventory_transaction_photos_storage_update
on storage.objects
for update
to authenticated
using (
    bucket_id = 'inventory-transaction-photos'
    and (
        public.has_permission('stock_requests.delete_photos')
        or public.has_permission('stock_issues.delete_photos')
        or public.has_permission('tool_loans.delete_photos')
    )
)
with check (
    bucket_id = 'inventory-transaction-photos'
    and nullif(btrim(name), '') is not null
    and (
        public.has_permission('stock_requests.delete_photos')
        or public.has_permission('stock_issues.delete_photos')
        or public.has_permission('tool_loans.delete_photos')
    )
);

drop policy if exists inventory_transaction_photos_storage_delete
    on storage.objects;

create policy inventory_transaction_photos_storage_delete
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'inventory-transaction-photos'
    and (
        public.has_permission('stock_requests.delete_photos')
        or public.has_permission('stock_issues.delete_photos')
        or public.has_permission('tool_loans.delete_photos')
    )
);

-- ---------------------------------------------------------------------------
-- 4. Installation assertions
-- ---------------------------------------------------------------------------

do $$
declare
    v_stock_issue_permission_count integer;
    v_bucket_count integer;
    v_policy_count integer;
begin
    select count(*)
    into v_stock_issue_permission_count
    from public.app_permissions
    where permission_code like 'stock_issues.%'
      and is_active = true;

    if v_stock_issue_permission_count <> 14 then
        raise exception
            'Stock Issue photo permission installation failed: expected 14 active Stock Issue permissions, found %.',
            v_stock_issue_permission_count;
    end if;

    select count(*)
    into v_bucket_count
    from storage.buckets
    where id = 'inventory-transaction-photos'
      and name = 'inventory-transaction-photos'
      and public = false
      and file_size_limit = 10485760
      and allowed_mime_types @> array[
          'image/jpeg',
          'image/png',
          'image/webp'
      ]::text[];

    if v_bucket_count <> 1 then
        raise exception
            'Inventory transaction photo bucket installation failed.';
    end if;

    select count(*)
    into v_policy_count
    from pg_policies
    where schemaname = 'storage'
      and tablename = 'objects'
      and policyname in (
          'inventory_transaction_photos_storage_select',
          'inventory_transaction_photos_storage_insert',
          'inventory_transaction_photos_storage_update',
          'inventory_transaction_photos_storage_delete'
      );

    if v_policy_count <> 4 then
        raise exception
            'Inventory transaction photo Storage policy installation failed: expected 4 policies, found %.',
            v_policy_count;
    end if;
end;
$$;

commit;
