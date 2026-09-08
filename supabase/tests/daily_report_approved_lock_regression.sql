-- Run against local Supabase only. The fixture rolls back.
begin;

create function pg_temp.check_true(value boolean, label text) returns void
language plpgsql as $$
begin
    if value is distinct from true then raise exception 'FAIL: %', label; end if;
    raise notice 'PASS: %', label;
end $$;

insert into auth.users (id, email, aud, role, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
values ('cdde0000-0000-4000-8000-000000000101', 'daily-approved-lock@example.invalid', 'authenticated', 'authenticated', now(), '{}', '{}');
insert into public.app_users (auth_user_id, email, account_status, approved_at)
values ('cdde0000-0000-4000-8000-000000000101', 'daily-approved-lock@example.invalid', 'Active', now());

insert into public.app_user_permission_overrides (auth_user_id, permission_id, is_allowed, is_active)
select 'cdde0000-0000-4000-8000-000000000101', permission_id, true, true
from public.app_permissions
where permission_code in ('daily_reports.update', 'daily_reports.delete', 'daily_reports.upload_photos', 'daily_reports.update_photos', 'daily_reports.delete_photos');

create temp table report_fixture as select project_id, site_id from public.project_sites where not is_deleted limit 1;
insert into public.daily_reports (report_id, project_id, site_id, report_date, approval_status)
select 'cdde0000-0000-4000-8000-000000000110', project_id, site_id, current_date, 'Approved' from report_fixture;
insert into public.daily_report_photos (photo_id, report_id, photo_url)
values ('cdde0000-0000-4000-8000-000000000120', 'cdde0000-0000-4000-8000-000000000110', 'approved-lock/photo.jpg');

select set_config('request.jwt.claims', '{"sub":"cdde0000-0000-4000-8000-000000000101","role":"authenticated"}', true);
set local role authenticated;

do $$
begin
    begin
        update public.daily_reports set notes = 'must not change' where report_id = 'cdde0000-0000-4000-8000-000000000110';
        raise exception 'FAIL: approved report changed';
    exception when insufficient_privilege then raise notice 'PASS: approved report is immutable'; end;
    begin
        insert into public.daily_report_photos (photo_id, report_id, photo_url)
        values ('cdde0000-0000-4000-8000-000000000121', 'cdde0000-0000-4000-8000-000000000110', 'approved-lock/new.jpg');
        raise exception 'FAIL: approved report accepted a photo';
    exception when insufficient_privilege then raise notice 'PASS: approved report blocks photo insert'; end;
    begin
        update public.daily_report_photos set caption = 'must not change' where photo_id = 'cdde0000-0000-4000-8000-000000000120';
        raise exception 'FAIL: approved report photo changed';
    exception when insufficient_privilege then raise notice 'PASS: approved report blocks photo update'; end;
    begin
        update public.daily_report_photos set is_deleted = true where photo_id = 'cdde0000-0000-4000-8000-000000000120';
        raise exception 'FAIL: approved report photo deleted';
    exception when insufficient_privilege then raise notice 'PASS: approved report blocks photo delete'; end;
end $$;

reset role;
rollback;