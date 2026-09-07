-- LOCAL DRAFT: apply after daily_report_member_permissions.sql.
-- Create-only contract. Edit/review/delete and Storage are separate unfinished work.
begin;
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
commit;
