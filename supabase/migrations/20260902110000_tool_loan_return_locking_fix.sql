begin;

do $migration$
declare
    v_definition text;
    v_start_marker constant text :=
        '    -- Lock all affected issue postings and stock lots before mutation.';
    v_end_marker constant text :=
        '    -- Validate each posting cumulatively before creating the return header.';
    v_start integer;
    v_relative_end integer;
    v_end integer;
    v_patched text;
begin
    v_definition := pg_get_functiondef(
        'public.return_tool_loan_atomic(uuid,jsonb,uuid,uuid,text,text)'::regprocedure
    );

    v_start := strpos(v_definition, v_start_marker);
    if v_start = 0 then
        raise exception 'Tool Loan return lock start marker was not found.';
    end if;

    v_relative_end := strpos(
        substr(v_definition, v_start + length(v_start_marker)),
        v_end_marker
    );
    if v_relative_end = 0 then
        raise exception 'Tool Loan return lock end marker was not found.';
    end if;

    v_end :=
        v_start
        + length(v_start_marker)
        + v_relative_end
        - 1;

    v_patched :=
        substr(v_definition, 1, v_start - 1)
        || $replacement$    -- Lock all affected issue postings and stock lots before mutation.
    perform ip.tool_loan_issue_posting_id
    from public.tool_loan_issue_postings ip
    where ip.tool_loan_issue_posting_id in (
        select
            (a.value->>'tool_loan_issue_posting_id')::uuid
        from jsonb_array_elements(p_allocations) a(value)
    )
    order by ip.tool_loan_issue_posting_id
    for update;

    perform sl.stock_lot_id
    from public.stock_lots sl
    where sl.stock_lot_id in (
        select ip.stock_lot_id
        from public.tool_loan_issue_postings ip
        where ip.tool_loan_issue_posting_id in (
            select
                (a.value->>'tool_loan_issue_posting_id')::uuid
            from jsonb_array_elements(p_allocations) a(value)
        )
    )
    order by sl.stock_lot_id
    for update;

$replacement$
        || substr(v_definition, v_end);

    execute v_patched;

    v_definition := pg_get_functiondef(
        'public.return_tool_loan_atomic(uuid,jsonb,uuid,uuid,text,text)'::regprocedure
    );

    if position(
        'select distinct ip.stock_lot_id'
        in lower(v_definition)
    ) > 0 then
        raise exception 'Unsafe Tool Loan stock-lot lock query remains installed.';
    end if;
end;
$migration$;

commit;
