-- Keep Daily Report approval and review transitions in the database so that
-- concurrent browser sessions cannot bypass validation or overwrite each other.

create or replace function public.transition_daily_report_atomic(
    p_report_id uuid,
    p_expected_updated_at timestamptz,
    p_action text,
    p_rejection_reason text default null
) returns timestamptz
language plpgsql
security invoker
set search_path = public, pg_temp
as $function$
declare
    report public.daily_reports;
    area public.project_areas;
    approved_before numeric;
    worker_quantity numeric;
    photo_count integer;
    reviewed_photo_count integer;
    result_timestamp timestamptz;
    rejection_note text;
begin
    if not public.has_permission('daily_reports.update') then
        raise exception 'Daily Report edit permission is required.' using errcode = '42501';
    end if;
    if p_expected_updated_at is null then
        raise exception 'Reload the report before changing its status.';
    end if;
    if p_action not in ('ready_for_inspection', 'approve', 'reject') then
        raise exception 'Unsupported Daily Report workflow action.';
    end if;

    select * into report
    from public.daily_reports
    where report_id = p_report_id and not is_deleted
    for update;
    if not found then
        raise exception 'Report not found or not accessible.';
    end if;
    if report.updated_at is distinct from p_expected_updated_at then
        raise exception 'The report changed. Reload before saving.' using errcode = '40001';
    end if;
    if report.approval_status = 'Approved' then
        raise exception 'Approved Daily Reports cannot be changed.' using errcode = '42501';
    end if;

    if p_action = 'ready_for_inspection' then
        if report.approval_status <> 'Submitted' then
            raise exception 'Only submitted Daily Reports can be marked ready for inspection.';
        end if;
        update public.daily_reports
        set approval_status = 'Ready for Inspection', updated_by = auth.uid()
        where report_id = p_report_id
        returning updated_at into result_timestamp;
        return result_timestamp;
    end if;

    if report.approval_status <> 'Ready for Inspection' then
        raise exception 'Only Daily Reports ready for inspection can be reviewed.';
    end if;

    if p_action = 'reject' then
        rejection_note := nullif(btrim(coalesce(p_rejection_reason, '')), '');
        if rejection_note is null then
            raise exception 'A rejection reason is required.';
        end if;
        update public.daily_reports
        set approval_status = 'Rejected',
            notes = concat_ws(E'\n\n', nullif(btrim(notes), ''), 'Rejected reason: ' || rejection_note),
            updated_by = auth.uid()
        where report_id = p_report_id
        returning updated_at into result_timestamp;
        return result_timestamp;
    end if;

    if not exists (
        select 1 from public.daily_report_workers
        where report_id = p_report_id
    ) then
        raise exception 'Please add labour records before approving this Daily Report.';
    end if;
    if exists (
        select 1 from public.daily_report_workers
        where report_id = p_report_id and activity_type_id is null
    ) then
        raise exception 'Some labour records are missing an activity.';
    end if;
    select coalesce(sum(completed_quantity), 0) into worker_quantity
    from public.daily_report_workers
    where report_id = p_report_id;
    if abs(coalesce(report.completed_quantity, 0) - worker_quantity) > 0.01 then
        raise exception 'Report quantity does not match worker completed quantity.';
    end if;

    select count(*), count(*) filter (where approval_status = 'Approved')
    into photo_count, reviewed_photo_count
    from public.daily_report_photos
    where report_id = p_report_id and not is_deleted;
    if photo_count = 0 then
        raise exception 'Please upload and approve at least one photo before approving this Daily Report.';
    end if;
    if photo_count <> reviewed_photo_count then
        raise exception 'All Daily Report photos must be approved before approval.';
    end if;

    if report.area_id is not null then
        select * into area
        from public.project_areas
        where area_id = report.area_id and not is_deleted
        for update;
        if found and area.estimated_quantity is not null then
            select coalesce(sum(completed_quantity), 0) into approved_before
            from public.daily_reports
            where area_id = report.area_id
              and report_id <> p_report_id
              and not is_deleted
              and approval_status = 'Approved';
            if approved_before + coalesce(report.completed_quantity, 0) > area.estimated_quantity then
                raise exception 'This approval would exceed the estimated area quantity.';
            end if;
        end if;
    end if;

    update public.daily_reports
    set approval_status = 'Approved', updated_by = auth.uid()
    where report_id = p_report_id
    returning updated_at into result_timestamp;
    return result_timestamp;
end
$function$;

create or replace function public.create_daily_report_photo_atomic(
    p_report_id uuid,
    p_photo_url text,
    p_caption text default null,
    p_taken_at timestamptz default null,
    p_sort_order integer default 0
) returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $function$
declare
    report public.daily_reports;
    photo_id uuid;
begin
    if not public.has_permission('daily_reports.upload_photos') then
        raise exception 'Daily Report photo upload permission is required.' using errcode = '42501';
    end if;
    if nullif(btrim(p_photo_url), '') is null then
        raise exception 'A photo storage path is required.';
    end if;
    select * into report from public.daily_reports
    where report_id = p_report_id and not is_deleted for key share;
    if not found then raise exception 'Daily Report not found or not accessible.'; end if;
    if report.approval_status = 'Approved' then
        raise exception 'Photos of approved Daily Reports cannot be changed.' using errcode = '42501';
    end if;
    insert into public.daily_report_photos (
        report_id, photo_url, caption, taken_at, sort_order, approval_status,
        approved_by, approved_at, rejected_reason, is_deleted
    ) values (
        p_report_id, btrim(p_photo_url), nullif(btrim(p_caption), ''),
        coalesce(p_taken_at, clock_timestamp()), coalesce(p_sort_order, 0), 'Pending',
        null, null, null, false
    ) returning daily_report_photos.photo_id into photo_id;
    return photo_id;
end
$function$;

create or replace function public.review_daily_report_photo_atomic(
    p_photo_id uuid,
    p_action text
) returns uuid
language plpgsql
security invoker
set search_path = public, pg_temp
as $function$
declare
    photo public.daily_report_photos;
    report public.daily_reports;
begin
    if not public.has_permission('daily_reports.update_photos') then
        raise exception 'Daily Report photo review permission is required.' using errcode = '42501';
    end if;
    if p_action not in ('approve', 'reject') then
        raise exception 'Unsupported Daily Report photo workflow action.';
    end if;
    select * into photo from public.daily_report_photos
    where photo_id = p_photo_id and not is_deleted for update;
    if not found then raise exception 'Photo not found or already deleted.'; end if;
    select * into report from public.daily_reports
    where report_id = photo.report_id and not is_deleted for update;
    if not found then raise exception 'Daily Report not found or not accessible.'; end if;
    if report.approval_status = 'Approved' then
        raise exception 'Photos of approved Daily Reports cannot be changed.' using errcode = '42501';
    end if;
    update public.daily_report_photos
    set approval_status = case when p_action = 'approve' then 'Approved' else 'Rejected' end,
        approved_by = auth.uid(),
        approved_at = clock_timestamp(),
        rejected_reason = case when p_action = 'reject' then 'Rejected from daily report review.' else null end
    where photo_id = p_photo_id;
    return photo.report_id;
end
$function$;

create or replace function public.delete_daily_report_photo_atomic(
    p_photo_id uuid
) returns text
language plpgsql
security invoker
set search_path = public, pg_temp
as $function$
declare
    photo public.daily_report_photos;
    report public.daily_reports;
begin
    if not public.has_permission('daily_reports.delete_photos') then
        raise exception 'Daily Report photo delete permission is required.' using errcode = '42501';
    end if;
    select * into photo from public.daily_report_photos
    where photo_id = p_photo_id and not is_deleted for update;
    if not found then raise exception 'Photo not found or already deleted.'; end if;
    select * into report from public.daily_reports
    where report_id = photo.report_id and not is_deleted for update;
    if not found then raise exception 'Daily Report not found or not accessible.'; end if;
    if report.approval_status = 'Approved' then
        raise exception 'Photos of approved Daily Reports cannot be changed.' using errcode = '42501';
    end if;
    update public.daily_report_photos
    set is_deleted = true,
        deleted_at = clock_timestamp(),
        approval_status = 'Pending',
        approved_by = null,
        approved_at = null,
        rejected_reason = null
    where photo_id = p_photo_id;
    return photo.photo_url;
end
$function$;

create or replace function public.delete_daily_report_atomic(
    p_report_id uuid,
    p_expected_updated_at timestamptz
) returns timestamptz
language plpgsql
security invoker
set search_path = public, pg_temp
as $function$
declare
    report public.daily_reports;
    result_timestamp timestamptz;
begin
    if not public.has_permission('daily_reports.delete') then
        raise exception 'Daily Report delete permission is required.' using errcode = '42501';
    end if;
    if p_expected_updated_at is null then
        raise exception 'Reload the report before deleting it.';
    end if;
    select * into report from public.daily_reports
    where report_id = p_report_id and not is_deleted for update;
    if not found then raise exception 'Report not found or already deleted.'; end if;
    if report.updated_at is distinct from p_expected_updated_at then
        raise exception 'The report changed. Reload before deleting it.' using errcode = '40001';
    end if;
    if report.approval_status = 'Approved' then
        raise exception 'Approved Daily Reports cannot be changed.' using errcode = '42501';
    end if;
    update public.daily_reports
    set is_deleted = true, deleted_at = clock_timestamp(), updated_by = auth.uid()
    where report_id = p_report_id
    returning updated_at into result_timestamp;
    return result_timestamp;
end
$function$;

revoke all on function public.transition_daily_report_atomic(uuid, timestamptz, text, text) from public, anon;
revoke all on function public.create_daily_report_photo_atomic(uuid, text, text, timestamptz, integer) from public, anon;
revoke all on function public.review_daily_report_photo_atomic(uuid, text) from public, anon;
revoke all on function public.delete_daily_report_photo_atomic(uuid) from public, anon;
revoke all on function public.delete_daily_report_atomic(uuid, timestamptz) from public, anon;
grant execute on function public.transition_daily_report_atomic(uuid, timestamptz, text, text) to authenticated;
grant execute on function public.create_daily_report_photo_atomic(uuid, text, text, timestamptz, integer) to authenticated;
grant execute on function public.review_daily_report_photo_atomic(uuid, text) to authenticated;
grant execute on function public.delete_daily_report_photo_atomic(uuid) to authenticated;
grant execute on function public.delete_daily_report_atomic(uuid, timestamptz) to authenticated;
