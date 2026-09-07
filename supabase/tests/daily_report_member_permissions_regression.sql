-- Run ONLY against the local draft database. All fixtures are rolled back.
begin;
create function pg_temp.check_true(value boolean, label text) returns void
language plpgsql as $$
begin
    if value is distinct from true then raise exception 'FAIL: %', label; end if;
    raise notice 'PASS: %', label;
end $$;

select pg_temp.check_true(not exists(select 1 from auth.users where id = 'cdde0000-0000-4000-8000-000000000001'), 'fixture user does not exist');
insert into auth.users (id, email, aud, role, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
values ('cdde0000-0000-4000-8000-000000000001', 'daily-permission-test@example.invalid', 'authenticated', 'authenticated', now(), '{}', '{}');
insert into public.app_users (auth_user_id, email, account_status, approved_at)
values ('cdde0000-0000-4000-8000-000000000001', 'daily-permission-test@example.invalid', 'Active', now())
on conflict (auth_user_id) do update set account_status = 'Active', approved_at = now();

create temp table report_fixture as select project_id, site_id from public.project_sites where not is_deleted limit 1;
grant select on report_fixture to authenticated, anon;
select pg_temp.check_true((select count(*) = 1 from report_fixture), 'local project/site fixture available');
insert into public.daily_reports (report_id, project_id, site_id, report_date, approval_status)
select 'cdde0000-0000-4000-8000-000000000010', project_id, site_id, current_date, 'Draft' from report_fixture;
insert into public.daily_report_photos (photo_id, report_id, photo_url)
values ('cdde0000-0000-4000-8000-000000000020', 'cdde0000-0000-4000-8000-000000000010', 'permission-test/photo.jpg');

select set_config('request.jwt.claims', '{"sub":"cdde0000-0000-4000-8000-000000000001","role":"authenticated"}', true);
set local role authenticated;
select pg_temp.check_true((select count(*) = 1 from public.daily_reports where report_id = 'cdde0000-0000-4000-8000-000000000010'), 'active member reads unassigned report');
select pg_temp.check_true((select count(*) = 1 from public.daily_report_photos where photo_id = 'cdde0000-0000-4000-8000-000000000020'), 'active member reads report photo');
do $$
begin
    begin
        insert into public.daily_reports(project_id, site_id, report_date, approval_status)
        select project_id, site_id, current_date, 'Draft' from report_fixture;
        raise exception 'FAIL: read-only member created report';
    exception when insufficient_privilege then raise notice 'PASS: read-only member cannot create'; end;
end $$;
reset role;

insert into public.app_user_permission_overrides (auth_user_id, permission_id, is_allowed, is_active)
select 'cdde0000-0000-4000-8000-000000000001', permission_id, true, true
from public.app_permissions where permission_code = 'daily_reports.create';
set local role authenticated;
insert into public.daily_reports(report_id, project_id, site_id, report_date, approval_status)
select 'cdde0000-0000-4000-8000-000000000011', project_id, site_id, current_date, 'Draft' from report_fixture;
select pg_temp.check_true((select created_by = auth.uid() from public.daily_reports where report_id = 'cdde0000-0000-4000-8000-000000000011'), 'individual create grant and server-stamped creator');
reset role;

insert into public.app_roles (role_id, role_code, role_name)
values ('cdde0000-0000-4000-8000-000000000030', 'daily_permission_test', 'Daily permission regression');
insert into public.app_user_roles (auth_user_id, role_id, is_active)
values ('cdde0000-0000-4000-8000-000000000001', 'cdde0000-0000-4000-8000-000000000030', true);
insert into public.app_role_permissions (role_id, permission_id, is_allowed)
select 'cdde0000-0000-4000-8000-000000000030', permission_id, true
from public.app_permissions where permission_code = 'daily_reports.update';
insert into public.app_user_permission_overrides (auth_user_id, permission_id, is_allowed, is_active)
select 'cdde0000-0000-4000-8000-000000000001', permission_id, false, true
from public.app_permissions where permission_code = 'daily_reports.update';
set local role authenticated;
select pg_temp.check_true(not public.has_permission('daily_reports.update'), 'individual deny overrides role allow');
reset role;

insert into public.app_user_permission_overrides (auth_user_id, permission_id, is_allowed, is_active)
select 'cdde0000-0000-4000-8000-000000000001', permission_id, true, true
from public.app_permissions where permission_code in ('daily_reports.delete', 'daily_reports.delete_photos');
set local role authenticated;
do $$
begin
    begin
        update public.daily_reports set notes = 'unauthorized edit' where report_id = 'cdde0000-0000-4000-8000-000000000010';
        raise exception 'FAIL: delete-only member edited report';
    exception when insufficient_privilege then raise notice 'PASS: delete-only member cannot edit report'; end;
    begin
        update public.daily_report_photos set caption = 'unauthorized edit' where photo_id = 'cdde0000-0000-4000-8000-000000000020';
        raise exception 'FAIL: delete-only member edited photo';
    exception when insufficient_privilege then raise notice 'PASS: delete-only member cannot edit photo'; end;
end $$;
update public.daily_report_photos set is_deleted = true where photo_id = 'cdde0000-0000-4000-8000-000000000020';
update public.daily_reports set is_deleted = true where report_id = 'cdde0000-0000-4000-8000-000000000010';
reset role;
select pg_temp.check_true((select is_deleted from public.daily_reports where report_id = 'cdde0000-0000-4000-8000-000000000010'), 'delete grant permits report soft-delete');
select pg_temp.check_true((select is_deleted from public.daily_report_photos where photo_id = 'cdde0000-0000-4000-8000-000000000020'), 'delete photo grant permits soft-delete');

insert into public.app_user_permission_overrides (auth_user_id, permission_id, is_allowed, is_active)
select 'cdde0000-0000-4000-8000-000000000001', permission_id, true, true
from public.app_permissions where permission_code = 'daily_reports.upload_photos';
set local role authenticated;
insert into public.daily_report_photos(photo_id, report_id, photo_url)
values ('cdde0000-0000-4000-8000-000000000021', 'cdde0000-0000-4000-8000-000000000011', 'permission-test/upload.jpg');
select pg_temp.check_true((select count(*) = 1 from public.daily_report_photos where photo_id = 'cdde0000-0000-4000-8000-000000000021'), 'photo upload metadata permitted without editing rights');
reset role;

update public.app_users set account_status = 'Suspended', suspended_at = now() where auth_user_id = 'cdde0000-0000-4000-8000-000000000001';
set local role authenticated;
select pg_temp.check_true((select count(*) = 0 from public.daily_reports), 'suspended member cannot read reports');
select pg_temp.check_true(not public.has_permission('daily_reports.create'), 'suspension overrides individual grant');
reset role;
select pg_temp.check_true(not has_table_privilege('anon', 'public.daily_reports', 'SELECT'), 'anonymous report access revoked');
select pg_temp.check_true(not has_table_privilege('anon', 'public.daily_report_workers', 'SELECT'), 'anonymous worker-detail access revoked');
rollback;
