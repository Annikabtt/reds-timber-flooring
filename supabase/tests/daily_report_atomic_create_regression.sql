-- Local-only. Requires permission, create and update Daily Report drafts.
-- Fixtures roll back. Tests both create and existing-row edit contracts.
begin;
create function pg_temp.verify(value boolean, label text) returns void language plpgsql as $$
begin
    if value is distinct from true then raise exception 'FAIL: %', label; end if;
    raise notice 'PASS: %', label;
end $$;
insert into auth.users (id,email,aud,role,raw_app_meta_data,raw_user_meta_data)
values ('cdde0000-0000-4000-8000-000000000050','atomic-report-test@example.invalid','authenticated','authenticated','{}','{}');
insert into public.app_users (auth_user_id,email,account_status,approved_at)
values ('cdde0000-0000-4000-8000-000000000050','atomic-report-test@example.invalid','Active',now())
on conflict (auth_user_id) do update set account_status='Active',approved_at=now();
insert into public.app_permissions(permission_code,permission_name,module_code,action_code)
values ('project_sites.view','View Project Sites','project_sites','view')
on conflict (permission_code) do nothing;
insert into public.app_user_permission_overrides(auth_user_id,permission_id,is_allowed,is_active)
select 'cdde0000-0000-4000-8000-000000000050',permission_id,true,true from public.app_permissions where permission_code in ('daily_reports.create','project_sites.view');
insert into public.employees (employee_id,employee_code,first_name,last_name,employment_type)
values ('cdde0000-0000-4000-8000-000000000051','ATOMIC-REGRESSION-ONLY','Atomic','Fixture','Casual');
insert into public.work_activity_types (activity_type_id,activity_code,activity_name,is_active,is_deleted)
values ('cdde0000-0000-4000-8000-000000000052','ATOMIC-REGRESSION-ONLY','Atomic fixture',true,false);
create temp table atomic_fixture as
select jsonb_build_object('project_id',s.project_id,'site_id',s.site_id,'report_date',current_date,'approval_status','Draft','notes','atomic-regression') as report,
       jsonb_build_array(jsonb_build_object('activity_type_id',a.activity_type_id)) as activities,
       jsonb_build_array(jsonb_build_object('employee_id',e.employee_id,'regular_hours',1)) as workers,
       jsonb_build_array(jsonb_build_object('employee_id',e.employee_id,'regular_hours',1,'approved',true)) as logs
from public.project_sites s cross join public.employees e cross join public.work_activity_types a
where not s.is_deleted and e.employee_id='cdde0000-0000-4000-8000-000000000051'
  and a.activity_type_id='cdde0000-0000-4000-8000-000000000052' limit 1;
grant select on atomic_fixture to authenticated;
select pg_temp.verify((select count(*)=1 from atomic_fixture),'local business fixtures exist');
select set_config('request.jwt.claims','{"sub":"cdde0000-0000-4000-8000-000000000050","role":"authenticated","app_role":"viewer"}',true);
set local role authenticated;
do $$
declare f record;
begin
    select * into f from atomic_fixture;
    begin
        perform public.create_daily_report_bundle_atomic(f.report,f.activities,f.workers,f.logs);
        raise exception 'FAIL: report permission bypassed time-log RLS';
    exception when insufficient_privilege then raise notice 'PASS: final time-log insert respects RLS'; end;
end $$;
reset role;
select pg_temp.verify(not exists(select 1 from public.daily_reports where notes='atomic-regression'),'late RLS failure rolled back report');
select pg_temp.verify(not exists(select 1 from public.daily_report_workers w join public.daily_reports r using(report_id) where r.notes='atomic-regression'),'late RLS failure rolled back workers');

select set_config('request.jwt.claims','{"sub":"cdde0000-0000-4000-8000-000000000050","role":"authenticated","app_role":"project_manager"}',true);
set local role authenticated;
do $$
declare f record; result_id uuid;
begin
    select * into f from atomic_fixture;
    result_id := public.create_daily_report_bundle_atomic(f.report,f.activities,f.workers,f.logs);
    perform pg_temp.verify((select count(*)=1 from public.daily_reports where report_id=result_id),'authorized create saves report');
    perform pg_temp.verify((select count(*)=1 from public.daily_report_workers where report_id=result_id),'authorized create saves workers');
    perform pg_temp.verify((select count(*)=1 from public.work_time_logs where report_id=result_id and daily_report_id=result_id and not approved),'server controls time-log report links and approval');
    begin
        perform public.create_daily_report_bundle_atomic(f.report || '{"notes":"atomic-invalid-worker"}', '[]',
            jsonb_build_array(jsonb_build_object('employee_id','cdde0000-0000-4000-8000-000000000099')), '[]');
        raise exception 'FAIL: nonexistent employee accepted';
    exception when foreign_key_violation then raise notice 'PASS: invalid worker rejected'; end;
    begin
        perform public.create_daily_report_bundle_atomic(f.report || '{"notes":"atomic-invalid-log"}', '[]',f.workers,
            jsonb_build_array(jsonb_build_object('employee_id',f.logs->0->>'employee_id','regular_hours',-1)));
        raise exception 'FAIL: negative time accepted';
    exception when raise_exception then
        if sqlerrm <> 'Time-log hours, breaks and quantities cannot be negative.' then raise; end if;
        raise notice 'PASS: late validation rejected negative hours';
    end;
end $$;
reset role;
select pg_temp.verify(not exists(select 1 from public.daily_reports where notes in ('atomic-invalid-worker','atomic-invalid-log')),'validation/FK errors rolled back report creation');
select pg_temp.verify(not has_function_privilege('anon','public.create_daily_report_bundle_atomic(jsonb,jsonb,jsonb,jsonb)','EXECUTE'),'anonymous RPC execution denied');
select pg_temp.verify((select not prosecdef from pg_proc where oid='public.create_daily_report_bundle_atomic(jsonb,jsonb,jsonb,jsonb)'::regprocedure),'RPC does not elevate database privileges');

insert into public.app_user_permission_overrides(auth_user_id,permission_id,is_allowed,is_active)
select 'cdde0000-0000-4000-8000-000000000050',permission_id,true,true from public.app_permissions where permission_code='daily_reports.update';
set local role authenticated;
do $$
declare rid uuid; aid uuid; wid uuid; tid uuid; new_wid uuid; new_tid uuid; version timestamptz; next_version timestamptz;
begin
    select report_id,updated_at into rid,version from public.daily_reports where notes='atomic-regression';
    select daily_report_activity_id into aid from public.daily_report_activities where report_id=rid;
    select daily_report_worker_id into wid from public.daily_report_workers where report_id=rid;
    select work_time_log_id into tid from public.work_time_logs where report_id=rid;
    next_version := public.update_daily_report_bundle_atomic(rid,version,'{"notes":"atomic-edited"}',
        jsonb_build_array(jsonb_build_object('id',aid,'changes','{}'::jsonb)),
        jsonb_build_array(jsonb_build_object('id',wid,'changes',jsonb_build_object('regular_hours',2))),
        jsonb_build_array(jsonb_build_object('id',tid,'changes',jsonb_build_object('regular_hours',2))));
    perform pg_temp.verify(next_version>version,'edit version increases');
    perform pg_temp.verify(exists(select 1 from public.daily_report_activities where daily_report_activity_id=aid),'activity ID preserved on edit');
    perform pg_temp.verify((select regular_hours=2 from public.daily_report_workers where daily_report_worker_id=wid),'worker ID preserved on edit');
    perform pg_temp.verify((select regular_hours=2 from public.work_time_logs where work_time_log_id=tid),'time-log ID preserved on edit');
    next_version := public.update_daily_report_bundle_atomic(rid,next_version,'{}',
        jsonb_build_array(jsonb_build_object('id',aid,'changes','{}'::jsonb)),
        jsonb_build_array(
            jsonb_build_object('id',wid,'changes','{}'::jsonb),
            jsonb_build_object('changes',jsonb_build_object(
                'employee_id','cdde0000-0000-4000-8000-000000000051','regular_hours',4
            ))
        ),
        jsonb_build_array(
            jsonb_build_object('id',tid,'changes','{}'::jsonb),
            jsonb_build_object('changes',jsonb_build_object(
                'employee_id','cdde0000-0000-4000-8000-000000000051','regular_hours',4
            ))
        ));
    select daily_report_worker_id into new_wid from public.daily_report_workers
    where report_id=rid and daily_report_worker_id<>wid;
    select work_time_log_id into new_tid from public.work_time_logs
    where report_id=rid and work_time_log_id<>tid;
    perform pg_temp.verify(new_wid is not null and new_tid is not null,'desired-state edit adds child rows');
    next_version := public.update_daily_report_bundle_atomic(rid,next_version,'{}',
        jsonb_build_array(jsonb_build_object('id',aid,'changes','{}'::jsonb)),
        jsonb_build_array(jsonb_build_object('id',new_wid,'changes','{}'::jsonb)),
        jsonb_build_array(jsonb_build_object('id',new_tid,'changes','{}'::jsonb)));
    perform pg_temp.verify(not exists(select 1 from public.daily_report_workers where daily_report_worker_id=wid),'desired-state edit removes omitted worker');
    perform pg_temp.verify((select is_deleted and deleted_at is not null from public.work_time_logs where work_time_log_id=tid),'desired-state edit soft-deletes omitted time log with audit history');
    wid := new_wid;
    tid := new_tid;
    begin
        perform public.update_daily_report_bundle_atomic(rid,version,'{"notes":"stale"}','[]','[]','[]');
        raise exception 'FAIL: stale version accepted';
    exception when serialization_failure then raise notice 'PASS: stale editor rejected'; end;
    begin
        perform public.update_daily_report_bundle_atomic(rid,next_version,'{"notes":"must-rollback"}','[]',
            jsonb_build_array(jsonb_build_object('id',wid,'changes',jsonb_build_object('regular_hours',3))),
            jsonb_build_array(jsonb_build_object('id',tid,'changes',jsonb_build_object('regular_hours',-1))));
        raise exception 'FAIL: invalid last update accepted';
    exception when raise_exception then
        if sqlerrm <> 'Hours and quantities cannot be negative.' then raise; end if;
        raise notice 'PASS: final update failure rejected';
    end;
    perform pg_temp.verify((select notes='atomic-edited' and updated_at=next_version from public.daily_reports where report_id=rid),'failed edit rolls back header and version');
    perform pg_temp.verify((select regular_hours=4 from public.daily_report_workers where daily_report_worker_id=wid),'failed edit rolls back worker update');
    begin
        perform public.update_daily_report_bundle_atomic(rid,next_version,'{}','[]','[]',
            jsonb_build_array(jsonb_build_object('id','cdde0000-0000-4000-8000-000000000098','changes',jsonb_build_object('notes','bad'))));
        raise exception 'FAIL: foreign row accepted';
    exception when raise_exception then
        if sqlerrm <> 'Edit row not found in this report or access denied.' then raise; end if;
        raise notice 'PASS: non-report row rejected';
    end;
    begin
        perform public.update_daily_report_bundle_atomic(rid,next_version,'{}','[]','[]',
            jsonb_build_array(jsonb_build_object('id',tid,'changes',jsonb_build_object('approved',true))));
        raise exception 'FAIL: approval spoof accepted';
    exception when raise_exception then
        if sqlerrm <> 'Unsupported or protected field in work_time_logs edit.' then raise; end if;
        raise notice 'PASS: protected approval field rejected';
    end;
end $$;
reset role;
update public.work_time_logs set approved=true where report_id=(select report_id from public.daily_reports where notes='atomic-edited');
set local role authenticated;
do $$
declare rid uuid; version timestamptz;
begin
    select report_id,updated_at into rid,version from public.daily_reports where notes='atomic-edited';
    begin
        perform public.update_daily_report_bundle_atomic(rid,version,'{"notes":"blocked"}','[]','[]','[]');
        raise exception 'FAIL: approved payroll report edited';
    exception when raise_exception then
        if sqlerrm <> 'Approved payroll time logs lock this report.' then raise; end if;
        raise notice 'PASS: approved payroll locks report';
    end;
end $$;
reset role;
select pg_temp.verify(not has_function_privilege('anon','public.update_daily_report_bundle_atomic(uuid,timestamptz,jsonb,jsonb,jsonb,jsonb)','EXECUTE'),'anonymous edit RPC denied');
rollback;
