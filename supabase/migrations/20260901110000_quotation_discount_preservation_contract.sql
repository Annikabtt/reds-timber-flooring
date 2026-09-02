begin;

do $migration$
declare
    v_definition text;
    v_patched text;
begin
    v_definition := pg_get_functiondef(
        'public.update_draft_quotation_progress_atomic_impl(uuid,jsonb,jsonb,jsonb,jsonb)'::regprocedure
    );

    v_patched := regexp_replace(
        v_definition,
        $pattern$if not public\.has_permission\(\s*'quotations\.apply_discount'\s*\) then\s*raise exception\s*'Permission quotations\.apply_discount is required to apply a Quotation discount\.';\s*end if;$pattern$,
        $replacement$if not public.has_permission(
                    'quotations.apply_discount'
                ) and not coalesce(
                    (v_line ->> '_preserve_discount')::boolean,
                    false
                ) then
                    raise exception
                        'Permission quotations.apply_discount is required to apply a Quotation discount.';
                end if;$replacement$,
        'n'
    );

    if v_patched = v_definition then
        raise exception 'Could not install the trusted quotation discount preservation guard.';
    end if;

    execute v_patched;

    v_definition := pg_get_functiondef(
        'public.guard_quotation_product_discount()'::regprocedure
    );

    v_patched := regexp_replace(
        v_definition,
        $pattern$/\*[[:space:]]*-+[[:space:]]*New / changed positive Discount[[:space:]]*-+[[:space:]]*\*/$pattern$,
        $replacement$    /* ------------------------------------------------------------------------
    Draft replacement RPCs soft-delete the current line before inserting its
    replacement. Permit an unchanged approved discount to survive that insert.
    Only the most recently replaced line at the same position is authoritative;
    a changed percentage still requires apply_discount.
    ------------------------------------------------------------------------ */

    if tg_op = 'INSERT'
       and exists (
            select 1
            from public.quotation_lines previous
            where previous.quotation_id = new.quotation_id
              and previous.line_no = new.line_no
              and previous.is_deleted = true
              and previous.quotation_line_id <> new.quotation_line_id
              and previous.discount_percent is not distinct from new.discount_percent
              and previous.quotation_line_id = (
                    select latest.quotation_line_id
                    from public.quotation_lines latest
                    where latest.quotation_id = new.quotation_id
                      and latest.line_no = new.line_no
                      and latest.is_deleted = true
                      and latest.quotation_line_id <> new.quotation_line_id
                    order by
                        latest.deleted_at desc nulls last,
                        latest.updated_at desc,
                        latest.quotation_line_id desc
                    limit 1
              )
       ) then

        select nullif(btrim(coalesce(previous.discount_reason, '')), '')
        into new.discount_reason
        from public.quotation_lines previous
        where previous.quotation_id = new.quotation_id
          and previous.line_no = new.line_no
          and previous.is_deleted = true
          and previous.quotation_line_id <> new.quotation_line_id
        order by
            previous.deleted_at desc nulls last,
            previous.updated_at desc,
            previous.quotation_line_id desc
        limit 1;

        return new;

    end if;


    /* ------------------------------------------------------------------------
    New / changed positive Discount
    ------------------------------------------------------------------------ */$replacement$
    );

    if v_patched = v_definition then
        raise exception 'Could not install the quotation replacement discount trigger guard.';
    end if;

    execute v_patched;
end;
$migration$;

commit;
