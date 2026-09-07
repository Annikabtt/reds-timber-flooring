-- LOCAL DRAFT: apply with the Daily Report permission drafts only.
-- Converts the existing bucket to private and stores object paths in metadata.
begin;

do $guard$
begin
    if exists (
        select 1
        from public.daily_report_photos
        where photo_url ~* '^https?://'
          and photo_url !~* '/storage/v1/object/public/daily-report-photos/'
    ) then
        raise exception 'Unexpected external Daily Report photo URLs exist. Review them before privatizing the bucket.';
    end if;
    if exists (
        select 1 from pg_policies
        where schemaname='storage' and tablename='objects'
          and (coalesce(qual,'') ilike '%daily-report-photos%'
               or coalesce(with_check,'') ilike '%daily-report-photos%')
          and policyname not in (
              'daily_report_photos_storage_select',
              'daily_report_photos_storage_insert',
              'daily_report_photos_storage_update',
              'daily_report_photos_storage_delete'
          )
    ) then
        raise exception 'Unreviewed Daily Report Storage policies exist. Stop and review them before deployment.';
    end if;
end
$guard$;

update public.daily_report_photos
set photo_url = regexp_replace(
    photo_url,
    '^https?://[^/]+/storage/v1/object/public/daily-report-photos/',
    '',
    'i'
)
where photo_url ~* '^https?://[^/]+/storage/v1/object/public/daily-report-photos/';

insert into storage.buckets (
    id, name, public, file_size_limit, allowed_mime_types
)
values (
    'daily-report-photos',
    'daily-report-photos',
    false,
    10485760,
    array['image/jpeg', 'image/png', 'image/webp', 'image/heic', 'image/heif']
)
on conflict (id) do update
set name = excluded.name,
    public = false,
    file_size_limit = excluded.file_size_limit,
    allowed_mime_types = excluded.allowed_mime_types;

drop policy if exists daily_report_photos_storage_select on storage.objects;
create policy daily_report_photos_storage_select
on storage.objects for select to authenticated
using (
    bucket_id = 'daily-report-photos'
    and public.has_active_app_access()
);

drop policy if exists daily_report_photos_storage_insert on storage.objects;
create policy daily_report_photos_storage_insert
on storage.objects for insert to authenticated
with check (
    bucket_id = 'daily-report-photos'
    and nullif(btrim(name), '') is not null
    and public.has_permission('daily_reports.upload_photos')
);

drop policy if exists daily_report_photos_storage_update on storage.objects;
create policy daily_report_photos_storage_update
on storage.objects for update to authenticated
using (
    bucket_id = 'daily-report-photos'
    and (
        public.has_permission('daily_reports.update_photos')
        or public.has_permission('daily_reports.delete_photos')
    )
)
with check (
    bucket_id = 'daily-report-photos'
    and nullif(btrim(name), '') is not null
    and (
        public.has_permission('daily_reports.update_photos')
        or public.has_permission('daily_reports.delete_photos')
    )
);

drop policy if exists daily_report_photos_storage_delete on storage.objects;
create policy daily_report_photos_storage_delete
on storage.objects for delete to authenticated
using (
    bucket_id = 'daily-report-photos'
    and public.has_permission('daily_reports.delete_photos')
);

do $assertions$
begin
    if not exists (
        select 1 from storage.buckets
        where id = 'daily-report-photos' and public = false
    ) then
        raise exception 'Daily Report photo bucket was not made private.';
    end if;
    if (
        select count(*) from pg_policies
        where schemaname = 'storage'
          and tablename = 'objects'
          and policyname in (
              'daily_report_photos_storage_select',
              'daily_report_photos_storage_insert',
              'daily_report_photos_storage_update',
              'daily_report_photos_storage_delete'
          )
    ) <> 4 then
        raise exception 'Daily Report Storage policies were not installed completely.';
    end if;
end
$assertions$;

commit;
