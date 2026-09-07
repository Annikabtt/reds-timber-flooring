-- Local-only. Apply Daily Report permission and private Storage drafts first.
begin;

create function pg_temp.verify(value boolean, label text)
returns void language plpgsql as $$
begin
    if value is distinct from true then raise exception 'FAIL: %', label; end if;
    raise notice 'PASS: %', label;
end
$$;

select pg_temp.verify(
    (select not public from storage.buckets where id='daily-report-photos'),
    'Daily Report bucket is private'
);
select pg_temp.verify(
    (select count(*)=4 from pg_policies
     where schemaname='storage' and tablename='objects'
       and policyname like 'daily_report_photos_storage_%'),
    'four Daily Report Storage policies are installed'
);
select pg_temp.verify(
    (select qual ilike '%has_active_app_access%'
     from pg_policies
     where schemaname='storage' and tablename='objects'
       and policyname='daily_report_photos_storage_select'),
    'Storage reads require active membership'
);
select pg_temp.verify(
    (select with_check ilike '%daily_reports.upload_photos%'
     from pg_policies
     where schemaname='storage' and tablename='objects'
       and policyname='daily_report_photos_storage_insert'),
    'Storage uploads use the database permission'
);
select pg_temp.verify(
    (select qual ilike '%daily_reports.delete_photos%'
     from pg_policies
     where schemaname='storage' and tablename='objects'
       and policyname='daily_report_photos_storage_delete'),
    'Storage deletion uses the database permission'
);
select pg_temp.verify(
    not exists (
        select 1 from public.daily_report_photos where photo_url ~* '^https?://'
    ),
    'Daily Report metadata stores object paths instead of public URLs'
);

rollback;
