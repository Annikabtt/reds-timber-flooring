-- DRAFT: local testing only. Do not deploy before frontend integration and
-- the public-photo URL migration have been completed.
begin;

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

-- Storage/public URL conversion and frontend permission controls are deliberately
-- NOT activated by this draft. Keep outside migrations until integration passes.
commit;
