-- LOCAL DRAFT. Child arrays are the desired state. Existing rows keep their IDs,
-- rows without IDs are inserted, and omitted rows are removed in one transaction.
begin;
create or replace function public.update_daily_report_bundle_atomic(
    p_report_id uuid,
    p_expected_updated_at timestamptz,
    p_report_changes jsonb,
    p_activities jsonb,
    p_workers jsonb,
    p_time_logs jsonb
) returns timestamptz
language plpgsql security invoker
set search_path = public, pg_temp
as $function$
declare
    report public.daily_reports;
    table_name text;
    id_column text;
    allowed_keys text[];
    insert_allowed_keys text[];
    rows_json jsonb;
    item jsonb;
    changes jsonb;
    old_data jsonb;
    assignments text;
    row_id uuid;
    seen_ids uuid[];
    affected integer;
    result_timestamp timestamptz;
    activity public.daily_report_activities;
    worker public.daily_report_workers;
    time_log public.work_time_logs;
    original_activity_ids uuid[];
    original_worker_ids uuid[];
    original_time_log_ids uuid[];
begin
    if not public.has_permission('daily_reports.update') then
        raise exception 'Daily Report edit permission is required.' using errcode='42501';
    end if;
    if p_expected_updated_at is null then raise exception 'Reload the report before editing.'; end if;
    if jsonb_typeof(p_report_changes) is distinct from 'object'
       or jsonb_typeof(p_activities) is distinct from 'array'
       or jsonb_typeof(p_workers) is distinct from 'array'
       or jsonb_typeof(p_time_logs) is distinct from 'array' then
        raise exception 'Invalid report edit payload.';
    end if;
    select * into report from public.daily_reports
    where report_id=p_report_id and not is_deleted for update;
    if not found then raise exception 'Report not found or not accessible.'; end if;
    if report.updated_at is distinct from p_expected_updated_at then
        raise exception 'The report changed. Reload before saving.' using errcode='40001';
    end if;
    if report.approval_status='Approved' then raise exception 'Approved reports cannot be edited.'; end if;

    -- Lock both legacy link columns before testing approval, with deterministic
    -- ordering. No approval fields are writable through this endpoint.
    perform 1 from public.work_time_logs
    where (report_id=p_report_id or daily_report_id=p_report_id) and not is_deleted
    order by work_time_log_id for update;
    if exists (select 1 from public.work_time_logs
        where (report_id=p_report_id or daily_report_id=p_report_id) and not is_deleted
          and (approved or time_status='Approved' or approved_at is not null)) then
        raise exception 'Approved payroll time logs lock this report.';
    end if;
    perform 1 from public.daily_report_activities
    where report_id=p_report_id order by daily_report_activity_id for update;
    perform 1 from public.daily_report_workers
    where report_id=p_report_id order by daily_report_worker_id for update;
    select coalesce(array_agg(daily_report_activity_id),array[]::uuid[])
    into original_activity_ids from public.daily_report_activities where report_id=p_report_id;
    select coalesce(array_agg(daily_report_worker_id),array[]::uuid[])
    into original_worker_ids from public.daily_report_workers where report_id=p_report_id;
    select coalesce(array_agg(work_time_log_id),array[]::uuid[])
    into original_time_log_ids from public.work_time_logs
    where (report_id=p_report_id or daily_report_id=p_report_id) and not is_deleted;

    foreach table_name in array array['daily_reports','daily_report_activities','daily_report_workers','work_time_logs'] loop
        case table_name
        when 'daily_reports' then
            id_column := 'report_id';
            allowed_keys := array['report_date','weather_condition','workers_count','progress_percent','completed_quantity','work_completed','issues_found','next_actions','notes','approval_status'];
            insert_allowed_keys := allowed_keys;
            rows_json := jsonb_build_array(jsonb_build_object('id',p_report_id,'changes',p_report_changes));
        when 'daily_report_activities' then
            id_column := 'daily_report_activity_id';
            allowed_keys := array['activity_type_id','notes','reported_quantity','uom_code','sort_order'];
            insert_allowed_keys := allowed_keys;
            rows_json := p_activities;
        when 'daily_report_workers' then
            id_column := 'daily_report_worker_id';
            allowed_keys := array['employee_id','activity_type_id','work_assignment_id','replaces_work_assignment_id','worker_source','regular_hours','overtime_hours','completed_quantity','ot_start','ot_finish','ot_completed_quantity','worker_role','notes','attendance_status'];
            insert_allowed_keys := allowed_keys;
            rows_json := p_workers;
        else
            id_column := 'work_time_log_id';
            allowed_keys := array['employee_id','activity_type_id','work_assignment_id','replaces_work_assignment_id','worker_source','clock_in','clock_out','break_minutes','regular_hours','overtime_hours','ot_start','ot_finish','ot_completed_quantity','notes','attendance_status'];
            insert_allowed_keys := allowed_keys;
            rows_json := p_time_logs;
        end case;
        seen_ids := array[]::uuid[];
        for item in select value from jsonb_array_elements(rows_json) order by value->>'id' loop
            if jsonb_typeof(item) is distinct from 'object' then raise exception 'Invalid edit row.'; end if;
            changes := item->'changes';
            if jsonb_typeof(changes) is distinct from 'object' then
                raise exception 'Each desired row requires a changes object.';
            end if;
            if item ? 'id' and nullif(item->>'id','') is not null then
                row_id := (item->>'id')::uuid;
            else
                row_id := null;
            end if;
            if exists (
                select 1 from jsonb_object_keys(changes) k
                where not k=any(case when row_id is null then insert_allowed_keys else allowed_keys end)
            ) then
                raise exception 'Unsupported or protected field in % edit.',table_name;
            end if;
            if row_id is null then
                if table_name='daily_reports' then
                    raise exception 'The report row requires its existing ID.';
                elsif table_name='daily_report_activities' then
                    activity := jsonb_populate_record(null::public.daily_report_activities,changes);
                    insert into public.daily_report_activities (
                        report_id,activity_type_id,notes,reported_quantity,uom_code,sort_order
                    ) values (
                        p_report_id,activity.activity_type_id,activity.notes,
                        coalesce(activity.reported_quantity,0),activity.uom_code,
                        coalesce(activity.sort_order,0)
                    );
                elsif table_name='daily_report_workers' then
                    worker := jsonb_populate_record(null::public.daily_report_workers,changes);
                    if worker.employee_id is null then raise exception 'New worker employee is required.'; end if;
                    if coalesce(worker.regular_hours,0)<0 or coalesce(worker.overtime_hours,0)<0
                       or coalesce(worker.completed_quantity,0)<0 or coalesce(worker.ot_completed_quantity,0)<0 then
                        raise exception 'Worker hours and quantities cannot be negative.';
                    end if;
                    insert into public.daily_report_workers (
                        report_id,employee_id,activity_type_id,work_assignment_id,
                        replaces_work_assignment_id,worker_source,attendance_status,
                        regular_hours,overtime_hours,completed_quantity,ot_start,ot_finish,
                        ot_completed_quantity,worker_role,notes
                    ) values (
                        p_report_id,worker.employee_id,worker.activity_type_id,worker.work_assignment_id,
                        worker.replaces_work_assignment_id,worker.worker_source,worker.attendance_status,
                        coalesce(worker.regular_hours,0),coalesce(worker.overtime_hours,0),
                        coalesce(worker.completed_quantity,0),worker.ot_start,worker.ot_finish,
                        coalesce(worker.ot_completed_quantity,0),worker.worker_role,worker.notes
                    );
                else
                    time_log := jsonb_populate_record(null::public.work_time_logs,changes);
                    if time_log.employee_id is null then raise exception 'New time-log employee is required.'; end if;
                    if coalesce(time_log.regular_hours,0)<0 or coalesce(time_log.overtime_hours,0)<0
                       or coalesce(time_log.break_minutes,0)<0 or coalesce(time_log.ot_completed_quantity,0)<0 then
                        raise exception 'Time-log hours, breaks and quantities cannot be negative.';
                    end if;
                    insert into public.work_time_logs (
                        report_id,daily_report_id,employee_id,project_id,site_id,area_id,
                        work_order_id,work_date,activity_type_id,work_assignment_id,
                        replaces_work_assignment_id,worker_source,attendance_status,
                        clock_in,clock_out,break_minutes,regular_hours,overtime_hours,
                        ot_start,ot_finish,ot_completed_quantity,notes,approved,time_status,created_by
                    ) values (
                        p_report_id,p_report_id,time_log.employee_id,report.project_id,report.site_id,
                        report.area_id,report.work_order_id,report.report_date,time_log.activity_type_id,
                        time_log.work_assignment_id,time_log.replaces_work_assignment_id,
                        time_log.worker_source,time_log.attendance_status,time_log.clock_in,time_log.clock_out,
                        coalesce(time_log.break_minutes,0),coalesce(time_log.regular_hours,0),
                        coalesce(time_log.overtime_hours,0),time_log.ot_start,time_log.ot_finish,
                        coalesce(time_log.ot_completed_quantity,0),time_log.notes,false,'Needs Review',auth.uid()
                    );
                end if;
                continue;
            end if;
            if row_id=any(seen_ids) then raise exception 'Duplicate edit ID.'; end if;
            seen_ids := array_append(seen_ids,row_id);
            execute format('select to_jsonb(t) from public.%I t where %I=$1 and %s for update',
                table_name,id_column,
                case when table_name='work_time_logs' then '(report_id=$2 or daily_report_id=$2) and not is_deleted'
                     else 'report_id=$2' end)
            into old_data using row_id,p_report_id;
            if old_data is null then raise exception 'Edit row not found in this report or access denied.'; end if;
            if table_name='daily_report_activities' and old_data->>'approval_status'='Approved' then
                raise exception 'Approved activity cannot be edited.';
            end if;
            if exists (select 1 from jsonb_each_text(changes) x
                where case when x.key in ('regular_hours','overtime_hours','break_minutes','completed_quantity','ot_completed_quantity','reported_quantity')
                    then x.value::numeric < 0 else false end) then raise exception 'Hours and quantities cannot be negative.'; end if;
            if changes='{}'::jsonb then continue; end if;
            select string_agg(format('%I=v.%I',k,k),',' order by k)
            into assignments from jsonb_object_keys(changes) k;
            if table_name in ('daily_reports','work_time_logs') then
                assignments := assignments || ',updated_by=auth.uid()';
            end if;
            execute format('update public.%I t set %s from jsonb_populate_record(null::public.%I,$1) v where t.%I=$2',
                table_name,assignments,table_name,id_column)
            using old_data || changes,row_id;
            get diagnostics affected=row_count;
            if affected<>1 then raise exception 'Edit permission denied for %.',table_name using errcode='42501'; end if;
        end loop;
        if table_name='daily_reports' then
            select * into report from public.daily_reports where report_id=p_report_id;
        end if;
    end loop;
    if p_report_changes ? 'approval_status' and (
        p_report_changes->>'approval_status' <> 'Submitted'
        or report.approval_status not in ('Draft','Rejected','Submitted')
    ) then
        raise exception 'This Daily Report status transition is not allowed through content editing.';
    end if;
    if exists (
        select 1 from public.daily_report_activities a
        where a.daily_report_activity_id=any(original_activity_ids) and a.approval_status='Approved'
          and not exists (select 1 from jsonb_array_elements(p_activities) x where x->>'id'=a.daily_report_activity_id::text)
    ) then raise exception 'Approved activity cannot be removed.'; end if;

    delete from public.daily_report_activities a
    where a.daily_report_activity_id=any(original_activity_ids)
      and not exists (select 1 from jsonb_array_elements(p_activities) x where x->>'id'=a.daily_report_activity_id::text);
    delete from public.daily_report_workers w
    where w.daily_report_worker_id=any(original_worker_ids)
      and not exists (select 1 from jsonb_array_elements(p_workers) x where x->>'id'=w.daily_report_worker_id::text);
    -- Time logs are payroll audit records. Omission removes them from the live
    -- desired state but retains their primary key and deletion history.
    update public.work_time_logs t
    set is_deleted=true,
        deleted_at=clock_timestamp(),
        updated_by=auth.uid()
    where t.work_time_log_id=any(original_time_log_ids)
      and not exists (select 1 from jsonb_array_elements(p_time_logs) x where x->>'id'=t.work_time_log_id::text);

    update public.work_time_logs
    set work_date=report.report_date,updated_by=auth.uid()
    where (report_id=p_report_id or daily_report_id=p_report_id)
      and not is_deleted and work_date is distinct from report.report_date;

    if not exists (select 1 from public.daily_report_workers where report_id=p_report_id) then
        raise exception 'At least one worker is required.';
    end if;
    -- Bump parent version even when only child rows changed.
    update public.daily_reports set updated_at=clock_timestamp(),updated_by=auth.uid()
    where report_id=p_report_id returning updated_at into result_timestamp;
    if not found then raise exception 'Report edit denied.' using errcode='42501'; end if;
    return result_timestamp;
end
$function$;
revoke all on function public.update_daily_report_bundle_atomic(uuid,timestamptz,jsonb,jsonb,jsonb,jsonb) from public,anon;
grant execute on function public.update_daily_report_bundle_atomic(uuid,timestamptz,jsonb,jsonb,jsonb,jsonb) to authenticated;

-- Runs after the legacy trg_daily_reports_updated_at trigger. now() is fixed
-- at transaction start; use a strictly increasing timestamp for edit versions.
create or replace function public.stamp_daily_report_edit_version()
returns trigger language plpgsql set search_path=public,pg_temp as $$
begin
    new.updated_at := greatest(clock_timestamp(),old.updated_at + interval '1 microsecond');
    return new;
end $$;
revoke all on function public.stamp_daily_report_edit_version() from public,anon,authenticated;
drop trigger if exists zz_daily_report_edit_version on public.daily_reports;
create trigger zz_daily_report_edit_version before update on public.daily_reports
for each row execute function public.stamp_daily_report_edit_version();
commit;
