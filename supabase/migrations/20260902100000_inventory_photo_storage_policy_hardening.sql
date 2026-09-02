begin;

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
    permission_code,
    permission_name,
    'stock_issues',
    action_code,
    description,
    true,
    true,
    sort_order
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
) permissions(permission_code, permission_name, action_code, description, sort_order)
where not exists (
    select 1
    from public.app_permissions existing
    where existing.permission_code = permissions.permission_code
);

update public.app_permissions existing
set
    permission_name = permissions.permission_name,
    module_code = 'stock_issues',
    action_code = permissions.action_code,
    description = permissions.description,
    is_system_permission = true,
    is_active = true,
    sort_order = permissions.sort_order
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
) permissions(permission_code, permission_name, action_code, description, sort_order)
where existing.permission_code = permissions.permission_code;

insert into public.app_role_permissions (
    role_id,
    permission_id,
    is_allowed
)
select
    role.role_id,
    permission.permission_id,
    true
from public.app_roles role
join public.app_permissions permission
  on permission.permission_code in (
      'stock_issues.upload_photos',
      'stock_issues.delete_photos'
  )
 and permission.is_active = true
where lower(role.role_code) = 'admin'
  and role.is_active = true
  and not exists (
      select 1
      from public.app_role_permissions existing
      where existing.role_id = role.role_id
        and existing.permission_id = permission.permission_id
  );

update public.app_role_permissions existing
set
    is_allowed = true,
    updated_at = now()
from public.app_roles role
join public.app_permissions permission
  on permission.permission_code in (
      'stock_issues.upload_photos',
      'stock_issues.delete_photos'
  )
 and permission.is_active = true
where existing.role_id = role.role_id
  and existing.permission_id = permission.permission_id
  and lower(role.role_code) = 'admin'
  and role.is_active = true;

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

drop policy if exists inventory_transaction_photo_objects_select
    on storage.objects;
drop policy if exists inventory_transaction_photo_objects_insert
    on storage.objects;
drop policy if exists inventory_transaction_photo_objects_update
    on storage.objects;
drop policy if exists inventory_transaction_photo_objects_delete
    on storage.objects;
drop policy if exists inventory_transaction_photos_storage_select
    on storage.objects;
drop policy if exists inventory_transaction_photos_storage_insert
    on storage.objects;
drop policy if exists inventory_transaction_photos_storage_update
    on storage.objects;
drop policy if exists inventory_transaction_photos_storage_delete
    on storage.objects;

create policy inventory_transaction_photos_storage_select
on storage.objects
for select
to authenticated
using (
    bucket_id = 'inventory-transaction-photos'
    and exists (
        select 1
        from public.inventory_transaction_photos photo
        where photo.storage_bucket = objects.bucket_id
          and photo.storage_path = objects.name
          and photo.is_deleted = false
          and public.can_view_inventory_transaction_photo(
              photo.source_type,
              photo.source_id
          )
    )
);

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

create policy inventory_transaction_photos_storage_update
on storage.objects
for update
to authenticated
using (
    bucket_id = 'inventory-transaction-photos'
    and exists (
        select 1
        from public.inventory_transaction_photos photo
        where photo.storage_bucket = objects.bucket_id
          and photo.storage_path = objects.name
          and public.can_delete_inventory_transaction_photo(
              photo.source_type,
              photo.source_id
          )
    )
)
with check (
    bucket_id = 'inventory-transaction-photos'
    and nullif(btrim(name), '') is not null
    and exists (
        select 1
        from public.inventory_transaction_photos photo
        where photo.storage_bucket = objects.bucket_id
          and photo.storage_path = objects.name
          and public.can_delete_inventory_transaction_photo(
              photo.source_type,
              photo.source_id
          )
    )
);

create policy inventory_transaction_photos_storage_delete
on storage.objects
for delete
to authenticated
using (
    bucket_id = 'inventory-transaction-photos'
    and exists (
        select 1
        from public.inventory_transaction_photos photo
        where photo.storage_bucket = objects.bucket_id
          and photo.storage_path = objects.name
          and public.can_delete_inventory_transaction_photo(
              photo.source_type,
              photo.source_id
          )
    )
);

do $migration$
declare
    v_permission_count integer;
    v_bucket_count integer;
    v_policy_count integer;
begin
    select count(*)
    into v_permission_count
    from public.app_permissions
    where permission_code in (
        'stock_issues.upload_photos',
        'stock_issues.delete_photos'
    )
      and is_active = true;

    if v_permission_count <> 2 then
        raise exception 'Inventory photo permissions were not installed.';
    end if;

    select count(*)
    into v_bucket_count
    from storage.buckets
    where id = 'inventory-transaction-photos'
      and public = false
      and file_size_limit = 10485760;

    if v_bucket_count <> 1 then
        raise exception 'Inventory photo bucket was not normalized.';
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
        raise exception 'Inventory photo Storage policies were not installed.';
    end if;
end;
$migration$;

commit;
