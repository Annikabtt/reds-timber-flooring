-- Local-only. Apply the Daily Report atomic migrations first. Fixtures roll back.
begin;

create function pg_temp.verify(value boolean, label text) returns void
language plpgsql as $$
begin
    if value is distinct from true then raise exception 'FAIL: %', label; end if;
    raise notice 'PASS: %', label;
end $$;

insert into auth.users (id, email, aud, role, email_confirmed_at, raw_app_meta_data, raw_user_meta_data)
values ('cdde0000-0000-4000-8000-000000000201', 'daily-workflow@example.invalid', 'authenticated', 'authenticated', now(), '{}', '{}');
insert into public.app_users (auth_user_id, email, account_status, approved_at)
values ('cdde0000-0000-4000-8000-000000000201', 'daily-workflow@example.invalid', 'Active', now());
insert into public.app_user_permission_overrides (auth_user_id, permission_id, is_allowed, is_active)
select 'cdde0000-0000-4000-8000-000000000201', permission_id, true, true
from public.app_permissions
where permission_code in (
    'daily_reports.update', 'daily_reports.delete', 'daily_reports.upload_photos',
    'daily_reports.update_photos', 'daily_reports.delete_photos'
);
insert into public.notification_event_types (
    event_code, event_name, event_description, default_severity,
    telegram_enabled, is_active, phase_no
) values (
    'daily_report_submitted', 'Daily Report submitted', 'Regression fixture', 'Info',
    true, true, 1
)
on conflict (event_code) do update
set telegram_enabled = true, is_active = true;

insert into public.employees (employee_id, employee_code, first_name, last_name, employment_type)
values ('cdde0000-0000-4000-8000-000000000202', 'DAILY-WORKFLOW-ONLY', 'Daily', 'Workflow', 'Casual');
insert into public.work_activity_types (activity_type_id, activity_code, activity_name, is_active, is_deleted)
values ('cdde0000-0000-4000-8000-000000000203', 'DAILY-WORKFLOW-ONLY', 'Daily workflow fixture', true, false);
create temp table workflow_fixture as
select project_id, site_id from public.project_sites where not is_deleted limit 1;
select pg_temp.verify((select count(*) = 1 from workflow_fixture), 'local project/site fixture exists');

insert into public.daily_reports (report_id, project_id, site_id, report_date, completed_quantity, approval_status)
select 'cdde0000-0000-4000-8000-000000000204', project_id, site_id, current_date, 1, 'Submitted'
from workflow_fixture;
insert into public.daily_report_workers (daily_report_worker_id, report_id, employee_id, activity_type_id, completed_quantity)
values ('cdde0000-0000-4000-8000-000000000205', 'cdde0000-0000-4000-8000-000000000204', 'cdde0000-0000-4000-8000-000000000202', 'cdde0000-0000-4000-8000-000000000203', 1);

select set_config('request.jwt.claims', '{"sub":"cdde0000-0000-4000-8000-000000000201","role":"authenticated"}', true);
set local role authenticated;

do $$
declare
    report_version timestamptz;
    ready_version timestamptz;
    workflow_photo_id uuid;
    deleted_path text;
begin
    select updated_at into report_version from public.daily_reports where report_id = 'cdde0000-0000-4000-8000-000000000204';
    workflow_photo_id := public.create_daily_report_photo_atomic(
        'cdde0000-0000-4000-8000-000000000204', 'workflow-fixture/delete-me.jpg', null, now(), 0
    );
    deleted_path := public.delete_daily_report_photo_atomic(workflow_photo_id);
    perform pg_temp.verify(deleted_path = 'workflow-fixture/delete-me.jpg', 'photo delete returns its storage path');
    perform pg_temp.verify((select p.is_deleted from public.daily_report_photos p where p.photo_id = workflow_photo_id), 'photo delete is a soft delete');

    workflow_photo_id := public.create_daily_report_photo_atomic(
        'cdde0000-0000-4000-8000-000000000204', 'workflow-fixture/approved.jpg', 'fixture', now(), 0
    );
    ready_version := public.transition_daily_report_atomic(
        'cdde0000-0000-4000-8000-000000000204', report_version, 'ready_for_inspection'
    );
    perform pg_temp.verify(ready_version > report_version, 'ready transition updates the report version');
    begin
        perform public.transition_daily_report_atomic(
            'cdde0000-0000-4000-8000-000000000204', report_version, 'approve'
        );
        raise exception 'FAIL: stale workflow transition accepted';
    exception when serialization_failure then raise notice 'PASS: stale workflow transition rejected'; end;
    begin
        perform public.transition_daily_report_atomic(
            'cdde0000-0000-4000-8000-000000000204', ready_version, 'approve'
        );
        raise exception 'FAIL: pending photo allowed approval';
    exception when raise_exception then
        if sqlerrm <> 'All Daily Report photos must be approved before approval.' then raise; end if;
        raise notice 'PASS: pending photo blocks approval';
    end;
    perform public.review_daily_report_photo_atomic(workflow_photo_id, 'approve');
    perform public.transition_daily_report_atomic(
        'cdde0000-0000-4000-8000-000000000204', ready_version, 'approve'
    );
    perform pg_temp.verify((select approval_status = 'Approved' from public.daily_reports where report_id = 'cdde0000-0000-4000-8000-000000000204'), 'approved photo and labour allow approval');
    begin
        perform public.review_daily_report_photo_atomic(workflow_photo_id, 'reject');
        raise exception 'FAIL: approved report photo changed';
    exception when insufficient_privilege then raise notice 'PASS: approved report locks photo review'; end;
end $$;

reset role;
select pg_temp.verify(not has_function_privilege('anon', 'public.transition_daily_report_atomic(uuid,timestamptz,text,text)', 'EXECUTE'), 'anonymous report workflow execution denied');
select pg_temp.verify(not has_function_privilege('anon', 'public.review_daily_report_photo_atomic(uuid,text)', 'EXECUTE'), 'anonymous photo workflow execution denied');
rollback;
