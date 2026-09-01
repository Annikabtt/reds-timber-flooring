begin;

do $migration$
begin
    if to_regprocedure(
        'public.get_quotation_detail_impl(uuid)'
    ) is null then
        alter function public.get_quotation_detail(uuid)
            rename to get_quotation_detail_impl;
    end if;
end;
$migration$;

create or replace function public.get_quotation_detail(
    p_quotation_id uuid
)
returns jsonb
language plpgsql
security definer
set search_path to 'public', 'auth', 'pg_temp'
as $function$
declare
    v_result jsonb;
    v_lines jsonb;
begin
    v_result := public.get_quotation_detail_impl(p_quotation_id);

    select coalesce(
        jsonb_agg(
            source_line.value
            || jsonb_build_object(
                'line_uid', ql.line_uid,
                'billing_method', ql.billing_method,
                'price_book_id', ql.price_book_id,
                'price_book_line_id', ql.price_book_line_id,
                'price_source', ql.price_source,
                'original_unit_price', ql.original_unit_price,
                'minimum_price_snapshot', ql.minimum_price_snapshot,
                'manual_price_reason', ql.manual_price_reason,
                'discount_reason', ql.discount_reason
            )
            order by (source_line.value ->> 'line_no')::integer
        ),
        '[]'::jsonb
    )
    into v_lines
    from jsonb_array_elements(
        coalesce(v_result -> 'base_lines', '[]'::jsonb)
    ) source_line(value)
    join public.quotation_lines ql
      on ql.quotation_line_id =
         (source_line.value ->> 'quotation_line_id')::uuid
     and ql.quotation_id = p_quotation_id
     and ql.is_deleted = false;

    return jsonb_set(
        v_result,
        '{base_lines}',
        v_lines,
        true
    );
end;
$function$;

revoke all on function public.get_quotation_detail_impl(uuid)
from public, anon, authenticated;

grant execute on function public.get_quotation_detail(uuid)
to authenticated, service_role;

commit;
