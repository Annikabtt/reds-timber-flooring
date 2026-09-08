-- Daily Report atomic persistence, member permissions and private photo storage.
-- Promoted from the reviewed local drafts after frontend integration and local regression coverage.

-- Source: supabase/drafts/daily_report_member_permissions.sql

insert into public.app_permissions
    (permission_code, permission_name, module_code, action_code, description)
select 'daily_reports.' || action, label, 'daily_reports', action,
       'Configurable by role and individual override. Reading remains available to all active members.'
from (values
    ('create', 'Create Daily Reports'),
    ('update', 'Edit Daily Reports'),
    ('delete', 'Delete Daily Reports'),
    ('upload_photos', 'Upload Daily Report Photos'),
    ('update_photos', 'Edit and Review Daily Report Photos'),
    ('delete_photos', 'Delete Daily Report Photos')
) p(action, label)
on conflict (permission_code) do nothing;

-- One-time compatibility seed from the legacy is_project_role() baseline.
-- Runtime authorization uses has_permission(), NOT role names or JWT roles.
-- Existing role denials and individual overrides are never overwritten.
insert into public.app_role_permissions (role_id, permission_id, is_allowed)
select r.role_id, p.permission_id, true
from public.app_roles r
cross join public.app_permissions p
where r.is_active and r.role_code in ('admin', 'manager', 'project_manager', 'site_supervisor')
  and p.module_code = 'daily_reports'
  and p.action_code in ('create', 'update', 'delete', 'upload_photos', 'update_photos', 'delete_photos')
on conflict (role_id, permission_id) do nothing;

-- Fail closed if production has policies not covered by this reviewed draft.
do $guard$
begin
    if exists (
        select 1 from pg_policies
        where schemaname = 'public'
          and tablename in ('daily_reports', 'daily_report_photos', 'daily_report_workers', 'daily_report_activities')
          and policyname not in (
              tablename || '_read', tablename || '_write',
              tablename || '_insert', tablename || '_update', tablename || '_delete'
          )
    ) then
        raise exception 'Unreviewed Daily Report policies exist. Stop and review them before deployment.';
    end if;
end
$guard$;

-- Active members may read all reports; assignment is intentionally not checked.
do $policies$
declare
    t text;
    active_check text := 'public.has_active_app_access()';
    parent_check text;
begin
    foreach t in array array['daily_reports', 'daily_report_photos', 'daily_report_workers', 'daily_report_activities'] loop
        execute format('drop policy if exists %I on public.%I', t || '_read', t);
        execute format('drop policy if exists %I on public.%I', t || '_write', t);
        execute format('drop policy if exists %I on public.%I', t || '_insert', t);
        execute format('drop policy if exists %I on public.%I', t || '_update', t);
        execute format('drop policy if exists %I on public.%I', t || '_delete', t);
        execute format('alter table public.%I enable row level security', t);
        execute format('revoke all on public.%I from anon', t);
        if t = 'daily_reports' then
            -- PostgreSQL checks SELECT visibility on UPDATE's resulting row.
            -- Deleters need tombstone visibility for soft-delete/restore.
            execute format('create policy %I on public.%I for select to authenticated using (%s and (not is_deleted or public.has_permission(''daily_reports.delete'')))', t || '_read', t, active_check);
            execute format('create policy %I on public.%I for insert to authenticated with check (public.has_permission(''daily_reports.create'') and not is_deleted and created_by = auth.uid())', t || '_insert', t);
            execute format('create policy %I on public.%I for update to authenticated using (public.has_permission(''daily_reports.update'') or public.has_permission(''daily_reports.delete'')) with check (public.has_permission(''daily_reports.update'') or public.has_permission(''daily_reports.delete''))', t || '_update', t);
            execute format('create policy %I on public.%I for delete to authenticated using (public.has_permission(''daily_reports.delete''))', t || '_delete', t);
        else
            -- Qualify the outer report_id to avoid a tautological correlation.
            parent_check := format('exists (select 1 from public.daily_reports r where r.report_id = %I.report_id and not r.is_deleted)', t);
            execute format('create policy %I on public.%I for select to authenticated using (%s and %s%s)', t || '_read', t, active_check, parent_check, case when t = 'daily_report_photos' then ' and (not is_deleted or public.has_permission(''daily_reports.delete_photos''))' else '' end);
            if t = 'daily_report_photos' then
                execute format('create policy %I on public.%I for insert to authenticated with check (public.has_permission(''daily_reports.upload_photos'') and not is_deleted and %s)', t || '_insert', t, parent_check);
                execute format('create policy %I on public.%I for update to authenticated using ((public.has_permission(''daily_reports.update_photos'') or public.has_permission(''daily_reports.delete_photos'')) and %s) with check ((public.has_permission(''daily_reports.update_photos'') or public.has_permission(''daily_reports.delete_photos'')) and %s)', t || '_update', t, parent_check, parent_check);
                execute format('create policy %I on public.%I for delete to authenticated using (public.has_permission(''daily_reports.delete_photos'') and %s)', t || '_delete', t, parent_check);
            else
                execute format('create policy %I on public.%I for insert to authenticated with check (%s and (public.has_permission(''daily_reports.update'') or (public.has_permission(''daily_reports.create'') and exists (select 1 from public.daily_reports r where r.report_id = %I.report_id and r.created_by = auth.uid()))))', t || '_insert', t, parent_check, t);
                execute format('create policy %I on public.%I for update to authenticated using (public.has_permission(''daily_reports.update'') and %s) with check (public.has_permission(''daily_reports.update'') and %s)', t || '_update', t, parent_check, parent_check);
                execute format('create policy %I on public.%I for delete to authenticated using (public.has_permission(''daily_reports.update'') and %s)', t || '_delete', t, parent_check);
            end if;
        end if;
    end loop;
end
$policies$;

-- RLS cannot distinguish soft-delete from content edits. Check changed columns
-- separately, so delete-only access cannot be used to rewrite a report/photo.
create or replace function public.guard_daily_report_member_write()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
declare
    edit_permission text;
    delete_permission text;
begin
    if current_user not in ('authenticated', 'anon') then
        return new;
    end if;
    if tg_op = 'INSERT' then
        if tg_table_name = 'daily_reports' then
            new.created_by := auth.uid();
        end if;
        return new;
    end if;
    if tg_table_name = 'daily_reports' then
        edit_permission := 'daily_reports.update';
        delete_permission := 'daily_reports.delete';
    else
        edit_permission := 'daily_reports.update_photos';
        delete_permission := 'daily_reports.delete_photos';
    end if;
    if new.is_deleted is distinct from old.is_deleted
       and not public.has_permission(delete_permission) then
        raise exception 'You do not have permission to delete or restore this record.' using errcode = '42501';
    end if;
    if (to_jsonb(new) - array['is_deleted', 'deleted_at', 'updated_at', 'updated_by'])
        is distinct from
       (to_jsonb(old) - array['is_deleted', 'deleted_at', 'updated_at', 'updated_by'])
       and not public.has_permission(edit_permission) then
        raise exception 'You do not have permission to edit this record.' using errcode = '42501';
    end if;
    if tg_table_name = 'daily_reports' then
        if new.created_by is distinct from old.created_by then
            raise exception 'The original creator cannot be changed.' using errcode = '42501';
        end if;
    elsif new.report_id is distinct from old.report_id or new.photo_url is distinct from old.photo_url then
        raise exception 'Photo ownership and storage path cannot be changed.' using errcode = '42501';
    end if;
    return new;
end
$function$;

revoke all on function public.guard_daily_report_member_write() from public, anon, authenticated;
drop trigger if exists guard_daily_report_member_write on public.daily_reports;
create trigger guard_daily_report_member_write before insert or update on public.daily_reports
for each row execute function public.guard_daily_report_member_write();
drop trigger if exists guard_daily_report_photo_member_write on public.daily_report_photos;
create trigger guard_daily_report_photo_member_write before insert or update on public.daily_report_photos
for each row execute function public.guard_daily_report_member_write();

-- Private Storage conversion and its policies follow after the atomic RPCs,
-- so their permission helpers exist before policy creation.

-- Source: supabase/drafts/create_daily_report_bundle_atomic.sql
create or replace function public.create_daily_report_bundle_atomic(
    p_report jsonb,
    p_activities jsonb,
    p_workers jsonb,
    p_time_logs jsonb
) returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $function$
declare
    r public.daily_reports;
    a public.daily_report_activities;
    w public.daily_report_workers;
    t public.work_time_logs;
    item jsonb;
    new_report_id uuid;
begin
    if not public.has_permission('daily_reports.create') then
        raise exception 'Daily Report create permission is required.' using errcode = '42501';
    end if;
    if jsonb_typeof(p_report) is distinct from 'object'
       or jsonb_typeof(p_activities) is distinct from 'array'
       or jsonb_typeof(p_workers) is distinct from 'array'
       or jsonb_typeof(p_time_logs) is distinct from 'array' then
        raise exception 'Report object and activity, worker and time-log arrays are required.';
    end if;
    if jsonb_array_length(p_workers) = 0 then
        raise exception 'At least one worker is required.';
    end if;
    r := jsonb_populate_record(null::public.daily_reports, p_report);
    if coalesce(r.approval_status, 'Submitted') not in ('Draft', 'Submitted') then
        raise exception 'New reports must be Draft or Submitted.';
    end if;
    if not exists (select 1 from public.project_sites s where s.site_id = r.site_id and s.project_id = r.project_id and not s.is_deleted) then
        raise exception 'Site does not belong to the selected project.';
    end if;
    if r.work_order_id is not null and not exists (
        select 1 from public.work_orders wo where wo.work_order_id = r.work_order_id
          and wo.project_id = r.project_id and wo.site_id = r.site_id and not wo.is_deleted
    ) then
        raise exception 'Work order does not belong to this project and site.';
    end if;

    -- Server-generated identity and audit values: caller cannot spoof approval,
    -- deleted status, creator, IDs, or link time logs to a different report.
    insert into public.daily_reports (
        project_id, site_id, area_id, work_order_id, report_date,
        weather_condition, workers_count, progress_percent, completed_quantity,
        work_completed, issues_found, next_actions, notes, approval_status, created_by
    ) values (
        r.project_id, r.site_id, r.area_id, r.work_order_id, r.report_date,
        r.weather_condition, (select count(distinct x->>'employee_id') from jsonb_array_elements(p_workers) x),
        r.progress_percent, r.completed_quantity, r.work_completed, r.issues_found,
        r.next_actions, r.notes, coalesce(r.approval_status, 'Submitted'), auth.uid()
    ) returning report_id into new_report_id;

    for item in select value from jsonb_array_elements(p_activities) loop
        a := jsonb_populate_record(null::public.daily_report_activities, item);
        insert into public.daily_report_activities (report_id, activity_type_id, notes)
        values (new_report_id, a.activity_type_id, a.notes);
    end loop;
    for item in select value from jsonb_array_elements(p_workers) loop
        w := jsonb_populate_record(null::public.daily_report_workers, item);
        if coalesce(w.regular_hours, 0) < 0 or coalesce(w.overtime_hours, 0) < 0
           or coalesce(w.completed_quantity, 0) < 0 or coalesce(w.ot_completed_quantity, 0) < 0 then
            raise exception 'Worker hours and quantities cannot be negative.';
        end if;
        insert into public.daily_report_workers (
            report_id, employee_id, activity_type_id, work_assignment_id,
            replaces_work_assignment_id, worker_source, attendance_status,
            regular_hours, overtime_hours, completed_quantity, ot_start, ot_finish,
            ot_completed_quantity, worker_role, notes
        ) values (
            new_report_id, w.employee_id, w.activity_type_id, w.work_assignment_id,
            w.replaces_work_assignment_id, w.worker_source, w.attendance_status,
            coalesce(w.regular_hours, 0), coalesce(w.overtime_hours, 0), coalesce(w.completed_quantity, 0),
            w.ot_start, w.ot_finish, coalesce(w.ot_completed_quantity, 0), w.worker_role, w.notes
        );
    end loop;
    for item in select value from jsonb_array_elements(p_time_logs) loop
        t := jsonb_populate_record(null::public.work_time_logs, item);
        if not exists (select 1 from jsonb_array_elements(p_workers) x where (x->>'employee_id')::uuid = t.employee_id) then
            raise exception 'Time-log employee is not in the report worker list.';
        end if;
        if coalesce(t.regular_hours, 0) < 0 or coalesce(t.overtime_hours, 0) < 0
           or coalesce(t.break_minutes, 0) < 0 or coalesce(t.ot_completed_quantity, 0) < 0 then
            raise exception 'Time-log hours, breaks and quantities cannot be negative.';
        end if;
        -- SECURITY INVOKER deliberately preserves existing work_time_logs RLS.
        -- If it rejects this final insert, all preceding writes roll back.
        insert into public.work_time_logs (
            report_id, daily_report_id, employee_id, project_id, site_id, area_id,
            work_order_id, work_date, activity_type_id, work_assignment_id,
            replaces_work_assignment_id, worker_source, attendance_status,
            clock_in, clock_out, break_minutes, regular_hours, overtime_hours,
            ot_start, ot_finish, ot_completed_quantity, notes, approved, time_status, created_by
        ) values (
            new_report_id, new_report_id, t.employee_id, r.project_id, r.site_id, r.area_id,
            r.work_order_id, r.report_date, t.activity_type_id, t.work_assignment_id,
            t.replaces_work_assignment_id, t.worker_source, t.attendance_status,
            t.clock_in, t.clock_out, coalesce(t.break_minutes, 0), coalesce(t.regular_hours, 0),
            coalesce(t.overtime_hours, 0), t.ot_start, t.ot_finish, coalesce(t.ot_completed_quantity, 0),
            t.notes, false, 'Needs Review', auth.uid()
        );
    end loop;
    return new_report_id;
end
$function$;
revoke all on function public.create_daily_report_bundle_atomic(jsonb,jsonb,jsonb,jsonb) from public, anon;
grant execute on function public.create_daily_report_bundle_atomic(jsonb,jsonb,jsonb,jsonb) to authenticated;

-- Source: supabase/drafts/update_daily_report_bundle_atomic.sql
-- rows without IDs are inserted, and omitted rows are removed in one transaction.
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

-- Source: supabase/drafts/daily_report_photo_storage_private.sql
-- Converts the existing bucket to private and stores object paths in metadata.

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
              'daily_report_photos_storage_delete',
              -- Production's reviewed legacy policies. The statements below
              -- replace these with the permission-scoped policies above.
              'daily report photos read',
              'daily report photos upload',
              'daily report photos update',
              'daily report photos delete'
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
drop policy if exists "daily report photos read" on storage.objects;
create policy daily_report_photos_storage_select
on storage.objects for select to authenticated
using (
    bucket_id = 'daily-report-photos'
    and public.has_active_app_access()
);

drop policy if exists daily_report_photos_storage_insert on storage.objects;
drop policy if exists "daily report photos upload" on storage.objects;
create policy daily_report_photos_storage_insert
on storage.objects for insert to authenticated
with check (
    bucket_id = 'daily-report-photos'
    and nullif(btrim(name), '') is not null
    and public.has_permission('daily_reports.upload_photos')
);

drop policy if exists daily_report_photos_storage_update on storage.objects;
drop policy if exists "daily report photos update" on storage.objects;
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
drop policy if exists "daily report photos delete" on storage.objects;
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


