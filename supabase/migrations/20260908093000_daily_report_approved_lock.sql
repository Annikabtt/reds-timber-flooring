-- Make approved Daily Reports and their photo evidence immutable.
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

    if tg_table_name = 'daily_reports' and tg_op = 'UPDATE'
       and old.approval_status = 'Approved' then
        raise exception 'Approved Daily Reports cannot be changed.' using errcode = '42501';
    end if;

    if tg_table_name = 'daily_report_photos' and exists (
        select 1 from public.daily_reports report
        where report.report_id = new.report_id
          and report.approval_status = 'Approved'
    ) then
        raise exception 'Photos of approved Daily Reports cannot be changed.' using errcode = '42501';
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