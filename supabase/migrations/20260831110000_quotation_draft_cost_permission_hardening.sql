begin;

do $migration$
begin
    if to_regprocedure(
        'public.update_draft_quotation_progress_atomic_impl(uuid,jsonb,jsonb,jsonb,jsonb)'
    ) is null then
        alter function public.update_draft_quotation_progress_atomic(
            uuid,
            jsonb,
            jsonb,
            jsonb,
            jsonb
        ) rename to update_draft_quotation_progress_atomic_impl;
    end if;
end;
$migration$;

create or replace function public.update_draft_quotation_progress_atomic(
    p_quotation_id uuid,
    p_quotation jsonb,
    p_lines jsonb,
    p_billing_units jsonb default null::jsonb,
    p_billing_allocations jsonb default null::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'auth', 'pg_temp'
as $function$
declare
    v_safe_lines jsonb;
begin
    if auth.uid() is null then
        raise exception 'Authentication is required.';
    end if;

    if public.has_permission('quotations.view_cost')
       or p_lines is null
       or jsonb_typeof(p_lines) <> 'array' then
        v_safe_lines := p_lines;
    else
        select coalesce(
            jsonb_agg(
                case
                    when ql.quotation_line_id is not null then
                        line.value || jsonb_build_object(
                            'cost_price',
                            ql.cost_price
                        )
                    else
                        line.value - 'cost_price'
                end
                order by line.ordinality
            ),
            '[]'::jsonb
        )
        into v_safe_lines
        from jsonb_array_elements(p_lines)
            with ordinality as line(value, ordinality)
        left join public.quotation_lines ql
          on ql.quotation_id = p_quotation_id
         and ql.line_uid = nullif(
                btrim(line.value ->> 'line_uid'),
                ''
             )::uuid
         and ql.is_active = true
         and ql.is_deleted = false;
    end if;

    return public.update_draft_quotation_progress_atomic_impl(
        p_quotation_id,
        p_quotation,
        v_safe_lines,
        p_billing_units,
        p_billing_allocations
    );
end;
$function$;

revoke all on function public.update_draft_quotation_progress_atomic_impl(
    uuid,
    jsonb,
    jsonb,
    jsonb,
    jsonb
) from public, anon, authenticated;

grant execute on function public.update_draft_quotation_progress_atomic(
    uuid,
    jsonb,
    jsonb,
    jsonb,
    jsonb
) to authenticated, service_role;

commit;
