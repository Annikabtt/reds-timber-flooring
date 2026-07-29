-- REDS Timber Flooring
-- Tool Loan Phase B2 — Return Atomic Foundation
-- Local-first migration. Do not apply directly to Production without the normal migration review.

begin;

-- ---------------------------------------------------------------------------
-- 1. Database-driven permissions
-- ---------------------------------------------------------------------------

insert into public.app_permissions (
    permission_id,
    permission_code,
    permission_name,
    module_code,
    action_code,
    description,
    is_system_permission,
    is_active,
    sort_order
)
select
    gen_random_uuid(),
    p.permission_code,
    p.permission_name,
    'tool_loans',
    p.action_code,
    p.description,
    true,
    true,
    p.sort_order
from (
    values
        ('tool_loans.view',         'View Tool Loans',          'view',         'View Tool Loans and their operational history.', 100),
        ('tool_loans.create',       'Create Tool Loans',        'create',       'Create Draft Tool Loans.',                       110),
        ('tool_loans.update_draft', 'Update Draft Tool Loans',  'update_draft', 'Update Draft Tool Loans.',                       120),
        ('tool_loans.submit',       'Submit Tool Loans',        'submit',       'Submit Tool Loans for approval.',                130),
        ('tool_loans.approve',      'Approve Tool Loans',       'approve',      'Approve submitted Tool Loans.',                  140),
        ('tool_loans.prepare',      'Prepare Tool Loans',       'prepare',      'Prepare approved Tool Loans.',                   150),
        ('tool_loans.issue',        'Issue Tool Loans',         'issue',        'Issue prepared Tool Loans from stock.',          160),
        ('tool_loans.return',       'Return Tool Loans',        'return',       'Post Tool Loan returns, damage and loss.',        170),
        ('tool_loans.cancel',       'Cancel Tool Loans',        'cancel',       'Cancel eligible Tool Loans.',                    180)
) as p(permission_code, permission_name, action_code, description, sort_order)
where not exists (
    select 1
    from public.app_permissions existing
    where existing.permission_code = p.permission_code
);

update public.app_permissions ap
set
    permission_name = p.permission_name,
    module_code = 'tool_loans',
    action_code = p.action_code,
    description = p.description,
    is_system_permission = true,
    is_active = true,
    sort_order = p.sort_order
from (
    values
        ('tool_loans.view',         'View Tool Loans',          'view',         'View Tool Loans and their operational history.', 100),
        ('tool_loans.create',       'Create Tool Loans',        'create',       'Create Draft Tool Loans.',                       110),
        ('tool_loans.update_draft', 'Update Draft Tool Loans',  'update_draft', 'Update Draft Tool Loans.',                       120),
        ('tool_loans.submit',       'Submit Tool Loans',        'submit',       'Submit Tool Loans for approval.',                130),
        ('tool_loans.approve',      'Approve Tool Loans',       'approve',      'Approve submitted Tool Loans.',                  140),
        ('tool_loans.prepare',      'Prepare Tool Loans',       'prepare',      'Prepare approved Tool Loans.',                   150),
        ('tool_loans.issue',        'Issue Tool Loans',         'issue',        'Issue prepared Tool Loans from stock.',          160),
        ('tool_loans.return',       'Return Tool Loans',        'return',       'Post Tool Loan returns, damage and loss.',        170),
        ('tool_loans.cancel',       'Cancel Tool Loans',        'cancel',       'Cancel eligible Tool Loans.',                    180)
) as p(permission_code, permission_name, action_code, description, sort_order)
where ap.permission_code = p.permission_code;

insert into public.app_role_permissions (
    role_id,
    permission_id,
    is_allowed
)
select
    r.role_id,
    p.permission_id,
    true
from public.app_roles r
join public.app_permissions p
  on p.permission_code like 'tool_loans.%'
 and p.is_active = true
where r.role_code = 'admin'
  and r.is_active = true
  and not exists (
      select 1
      from public.app_role_permissions rp
      where rp.role_id = r.role_id
        and rp.permission_id = p.permission_id
  );

update public.app_role_permissions rp
set is_allowed = true
from public.app_roles r
join public.app_permissions p
  on p.permission_code like 'tool_loans.%'
 and p.is_active = true
where rp.role_id = r.role_id
  and rp.permission_id = p.permission_id
  and r.role_code = 'admin'
  and r.is_active = true;

-- ---------------------------------------------------------------------------
-- 2. Immutable return postings
-- ---------------------------------------------------------------------------

create table if not exists public.tool_loan_return_postings (
    tool_loan_return_posting_id uuid primary key default gen_random_uuid(),
    tool_loan_return_id uuid not null,
    tool_loan_return_item_id uuid not null,
    tool_loan_id uuid not null,
    tool_loan_item_id uuid not null,
    tool_loan_issue_posting_id uuid not null,
    stock_lot_id uuid not null,
    return_stock_movement_id uuid,
    returned_base_quantity numeric(18,6) not null default 0,
    damaged_base_quantity numeric(18,6) not null default 0,
    lost_base_quantity numeric(18,6) not null default 0,
    base_uom_code text not null,
    posted_at timestamptz not null default now(),
    posted_by uuid,
    notes text,
    created_at timestamptz not null default now(),
    created_by uuid,
    is_active boolean not null default true,
    is_deleted boolean not null default false,
    deleted_at timestamptz,

    constraint tool_loan_return_postings_return_fkey
        foreign key (tool_loan_return_id)
        references public.tool_loan_returns(tool_loan_return_id)
        on delete restrict,

    constraint tool_loan_return_postings_return_item_fkey
        foreign key (tool_loan_return_item_id)
        references public.tool_loan_return_items(tool_loan_return_item_id)
        on delete restrict,

    constraint tool_loan_return_postings_loan_fkey
        foreign key (tool_loan_id)
        references public.tool_loans(tool_loan_id)
        on delete restrict,

    constraint tool_loan_return_postings_loan_item_fkey
        foreign key (tool_loan_item_id)
        references public.tool_loan_items(tool_loan_item_id)
        on delete restrict,

    constraint tool_loan_return_postings_issue_posting_fkey
        foreign key (tool_loan_issue_posting_id)
        references public.tool_loan_issue_postings(tool_loan_issue_posting_id)
        on delete restrict,

    constraint tool_loan_return_postings_lot_fkey
        foreign key (stock_lot_id)
        references public.stock_lots(stock_lot_id)
        on delete restrict,

    constraint tool_loan_return_postings_movement_fkey
        foreign key (return_stock_movement_id)
        references public.stock_movements(stock_movement_id)
        on delete restrict,

    constraint tool_loan_return_postings_uom_fkey
        foreign key (base_uom_code)
        references public.units_of_measure(uom_code)
        on delete restrict,

    constraint tool_loan_return_postings_quantity_non_negative
        check (
            returned_base_quantity >= 0
            and damaged_base_quantity >= 0
            and lost_base_quantity >= 0
        ),

    constraint tool_loan_return_postings_quantity_positive
        check (
            returned_base_quantity
            + damaged_base_quantity
            + lost_base_quantity > 0
        ),

    constraint tool_loan_return_postings_movement_consistency
        check (
            (
                returned_base_quantity > 0
                and return_stock_movement_id is not null
            )
            or
            (
                returned_base_quantity = 0
                and return_stock_movement_id is null
            )
        ),

    constraint tool_loan_return_postings_soft_delete_check
        check (
            is_deleted = false
            and deleted_at is null
        )
);

create index if not exists idx_tool_loan_return_postings_return
    on public.tool_loan_return_postings (tool_loan_return_id);

create index if not exists idx_tool_loan_return_postings_loan_item
    on public.tool_loan_return_postings (tool_loan_id, tool_loan_item_id);

create index if not exists idx_tool_loan_return_postings_issue_posting
    on public.tool_loan_return_postings (tool_loan_issue_posting_id);

create unique index if not exists tool_loan_return_postings_unique_return_issue
    on public.tool_loan_return_postings (
        tool_loan_return_id,
        tool_loan_issue_posting_id
    )
    where is_deleted = false;

create unique index if not exists tool_loan_return_postings_unique_movement
    on public.tool_loan_return_postings (return_stock_movement_id)
    where is_deleted = false
      and return_stock_movement_id is not null;

alter table public.tool_loan_return_postings enable row level security;

drop policy if exists tool_loan_return_postings_read
    on public.tool_loan_return_postings;

create policy tool_loan_return_postings_read
on public.tool_loan_return_postings
for select
to authenticated
using (
    is_deleted = false
    and (
        public.has_permission('tool_loans.view')
        or public.has_permission('tool_loans.return')
    )
);

-- No client INSERT/UPDATE/DELETE policy is created.
-- Writes are performed only through the SECURITY DEFINER atomic RPC.

create or replace function public.prevent_tool_loan_return_posting_mutation()
returns trigger
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
begin
    raise exception
        'Tool Loan return postings are immutable and cannot be updated or deleted.';
end;
$function$;

drop trigger if exists trg_prevent_tool_loan_return_posting_mutation
    on public.tool_loan_return_postings;

create trigger trg_prevent_tool_loan_return_posting_mutation
before update or delete
on public.tool_loan_return_postings
for each row
execute function public.prevent_tool_loan_return_posting_mutation();

-- ---------------------------------------------------------------------------
-- 3. Correct cumulative validation for editable return-item rows
-- ---------------------------------------------------------------------------

create or replace function public.validate_tool_loan_return_item()
returns trigger
language plpgsql
set search_path to 'public', 'pg_temp'
as $function$
declare
    v_return public.tool_loan_returns%rowtype;
    v_item public.tool_loan_items%rowtype;
    v_previous_returned numeric;
    v_previous_damaged numeric;
    v_previous_lost numeric;
begin
    select *
    into v_return
    from public.tool_loan_returns
    where tool_loan_return_id = new.tool_loan_return_id
      and is_deleted = false;

    if not found then
        raise exception 'Parent Tool Loan return was not found.';
    end if;

    select *
    into v_item
    from public.tool_loan_items
    where tool_loan_item_id = new.tool_loan_item_id
      and is_deleted = false;

    if not found then
        raise exception 'Tool Loan item was not found.';
    end if;

    if v_item.tool_loan_id <> v_return.tool_loan_id then
        raise exception
            'Tool Loan return item does not belong to the parent Tool Loan.';
    end if;

    select
        coalesce(sum(ri.returned_quantity), 0),
        coalesce(sum(ri.damaged_quantity), 0),
        coalesce(sum(ri.lost_quantity), 0)
    into
        v_previous_returned,
        v_previous_damaged,
        v_previous_lost
    from public.tool_loan_return_items ri
    join public.tool_loan_returns r
      on r.tool_loan_return_id = ri.tool_loan_return_id
    where ri.tool_loan_item_id = new.tool_loan_item_id
      and ri.is_deleted = false
      and r.is_deleted = false
      and r.return_status not in ('Draft', 'Rejected', 'Cancelled')
      and ri.tool_loan_return_item_id <> new.tool_loan_return_item_id;

    if (
        v_previous_returned
        + v_previous_damaged
        + v_previous_lost
        + new.returned_quantity
        + new.damaged_quantity
        + new.lost_quantity
    ) > v_item.issued_quantity then
        raise exception
            'Tool Loan return quantities exceed the issued quantity.';
    end if;

    return new;
end;
$function$;

-- ---------------------------------------------------------------------------
-- 4. Atomic return posting
-- ---------------------------------------------------------------------------

create or replace function public.return_tool_loan_atomic(
    p_tool_loan_id uuid,
    p_allocations jsonb,
    p_received_by_auth_user_id uuid default null,
    p_received_by_employee_id uuid default null,
    p_received_by_name text default null,
    p_return_notes text default null
)
returns uuid
language plpgsql
security definer
set search_path to 'public', 'pg_temp'
as $function$
declare
    v_loan public.tool_loans%rowtype;
    v_allocation jsonb;
    v_issue_posting public.tool_loan_issue_postings%rowtype;
    v_item public.tool_loan_items%rowtype;
    v_lot public.stock_lots%rowtype;
    v_return_id uuid := gen_random_uuid();
    v_return_item_id uuid;
    v_return_no integer;
    v_returned_base numeric(18,6);
    v_damaged_base numeric(18,6);
    v_lost_base numeric(18,6);
    v_processed_before numeric(18,6);
    v_new_remaining numeric(18,6);
    v_new_lot_status text;
    v_movement_id uuid;
    v_item_group record;
    v_total_processed numeric(18,6);
    v_total_returned numeric(18,6);
    v_total_damaged numeric(18,6);
    v_total_lost numeric(18,6);
    v_new_item_status text;
    v_new_header_status text;
begin
    if not public.has_permission('tool_loans.return') then
        raise exception 'Permission denied: tool_loans.return.';
    end if;

    if p_tool_loan_id is null then
        raise exception 'Tool Loan ID is required.';
    end if;

    if p_allocations is null
       or jsonb_typeof(p_allocations) <> 'array'
       or jsonb_array_length(p_allocations) = 0 then
        raise exception 'At least one Tool Loan return allocation is required.';
    end if;

    if p_received_by_auth_user_id is null
       and p_received_by_employee_id is null
       and nullif(btrim(p_received_by_name), '') is null then
        raise exception
            'A receiving user, employee or receiver name is required.';
    end if;

    select *
    into v_loan
    from public.tool_loans
    where tool_loan_id = p_tool_loan_id
      and is_deleted = false
    for update;

    if not found then
        raise exception 'Tool Loan was not found.';
    end if;

    if v_loan.loan_status not in (
        'Issued',
        'InUse',
        'PartiallyReturned',
        'Overdue'
    ) then
        raise exception
            'Only issued or partially returned Tool Loans can be returned. Current status: %.',
            v_loan.loan_status;
    end if;

    if exists (
        select 1
        from jsonb_array_elements(p_allocations) a(value)
        where nullif(a.value->>'tool_loan_issue_posting_id', '') is null
           or coalesce(nullif(a.value->>'returned_base_quantity', '')::numeric, 0) < 0
           or coalesce(nullif(a.value->>'damaged_base_quantity', '')::numeric, 0) < 0
           or coalesce(nullif(a.value->>'lost_base_quantity', '')::numeric, 0) < 0
           or (
                coalesce(nullif(a.value->>'returned_base_quantity', '')::numeric, 0)
                + coalesce(nullif(a.value->>'damaged_base_quantity', '')::numeric, 0)
                + coalesce(nullif(a.value->>'lost_base_quantity', '')::numeric, 0)
              ) <= 0
    ) then
        raise exception
            'Every return allocation requires tool_loan_issue_posting_id and a positive Returned, Damaged or Lost Base Quantity.';
    end if;

    if exists (
        select 1
        from (
            select
                (a.value->>'tool_loan_issue_posting_id')::uuid as issue_posting_id,
                count(*) as duplicate_count
            from jsonb_array_elements(p_allocations) a(value)
            group by (a.value->>'tool_loan_issue_posting_id')::uuid
            having count(*) > 1
        ) duplicate_allocations
    ) then
        raise exception
            'Each Tool Loan issue posting may appear only once in a return payload.';
    end if;

    if exists (
        select 1
        from jsonb_array_elements(p_allocations) a(value)
        left join public.tool_loan_issue_postings ip
          on ip.tool_loan_issue_posting_id =
             (a.value->>'tool_loan_issue_posting_id')::uuid
         and ip.tool_loan_id = p_tool_loan_id
         and ip.is_deleted = false
         and ip.is_active = true
        where ip.tool_loan_issue_posting_id is null
    ) then
        raise exception
            'A return allocation references an Issue Posting outside this Tool Loan.';
    end if;

    -- Lock all affected issue postings and stock lots before mutation.
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

    -- Validate each posting cumulatively before creating the return header.
    for v_allocation in
        select value
        from jsonb_array_elements(p_allocations)
    loop
        select *
        into v_issue_posting
        from public.tool_loan_issue_postings
        where tool_loan_issue_posting_id =
              (v_allocation->>'tool_loan_issue_posting_id')::uuid
          and tool_loan_id = p_tool_loan_id
          and is_deleted = false
          and is_active = true;

        v_returned_base :=
            round(coalesce(nullif(v_allocation->>'returned_base_quantity', '')::numeric, 0), 6);
        v_damaged_base :=
            round(coalesce(nullif(v_allocation->>'damaged_base_quantity', '')::numeric, 0), 6);
        v_lost_base :=
            round(coalesce(nullif(v_allocation->>'lost_base_quantity', '')::numeric, 0), 6);

        select *
        into v_item
        from public.tool_loan_items
        where tool_loan_item_id = v_issue_posting.tool_loan_item_id
          and tool_loan_id = p_tool_loan_id
          and is_deleted = false;

        if not found then
            raise exception 'Tool Loan item for Issue Posting was not found.';
        end if;

        if not v_item.allow_fractional_quantity then
            if round(
                (v_returned_base + v_damaged_base + v_lost_base)
                / nullif(v_item.conversion_factor_to_base, 0),
                6
            ) <> trunc(round(
                (v_returned_base + v_damaged_base + v_lost_base)
                / nullif(v_item.conversion_factor_to_base, 0),
                6
            )) then
                raise exception
                    'Tool Loan item line % does not allow fractional quantities.',
                    v_item.line_no;
            end if;
        end if;

        if v_damaged_base > 0
           and nullif(btrim(v_allocation->>'damage_notes'), '') is null then
            raise exception
                'Damage notes are required when Damaged Quantity is greater than zero.';
        end if;

        if v_lost_base > 0
           and nullif(btrim(v_allocation->>'missing_notes'), '') is null then
            raise exception
                'Missing notes are required when Lost Quantity is greater than zero.';
        end if;

        select coalesce(
            sum(
                returned_base_quantity
                + damaged_base_quantity
                + lost_base_quantity
            ),
            0
        )
        into v_processed_before
        from public.tool_loan_return_postings
        where tool_loan_issue_posting_id =
              v_issue_posting.tool_loan_issue_posting_id
          and is_deleted = false;

        if v_processed_before
           + v_returned_base
           + v_damaged_base
           + v_lost_base
           > v_issue_posting.issued_base_quantity then
            raise exception
                'Return quantities exceed the remaining issued quantity for Issue Posting %.',
                v_issue_posting.tool_loan_issue_posting_id;
        end if;
    end loop;

    -- Validate aggregate normal returns by stock lot against received capacity.
    if exists (
        select 1
        from (
            select
                ip.stock_lot_id,
                sum(
                    round(
                        coalesce(
                            nullif(a.value->>'returned_base_quantity', '')::numeric,
                            0
                        ),
                        6
                    )
                ) as returned_base_quantity
            from jsonb_array_elements(p_allocations) a(value)
            join public.tool_loan_issue_postings ip
              on ip.tool_loan_issue_posting_id =
                 (a.value->>'tool_loan_issue_posting_id')::uuid
            group by ip.stock_lot_id
        ) requested_return
        join public.stock_lots sl
          on sl.stock_lot_id = requested_return.stock_lot_id
        where sl.remaining_quantity
              + requested_return.returned_base_quantity
              > sl.received_quantity
    ) then
        raise exception
            'A normal return would make Stock Lot Remaining Quantity exceed Received Quantity.';
    end if;

    select coalesce(max(return_no), 0) + 1
    into v_return_no
    from public.tool_loan_returns
    where tool_loan_id = p_tool_loan_id
      and is_deleted = false;

    insert into public.tool_loan_returns (
        tool_loan_return_id,
        tool_loan_id,
        return_no,
        return_status,
        returned_at,
        received_by_auth_user_id,
        received_by_employee_id,
        received_by_name,
        return_notes,
        created_by,
        updated_by
    )
    values (
        v_return_id,
        p_tool_loan_id,
        v_return_no,
        'Accepted',
        now(),
        p_received_by_auth_user_id,
        p_received_by_employee_id,
        nullif(btrim(p_received_by_name), ''),
        nullif(btrim(p_return_notes), ''),
        auth.uid(),
        auth.uid()
    );

    -- One Return Item per Tool Loan item, aggregated across its Issue Postings.
    for v_item_group in
        select
            tli.tool_loan_item_id,
            tli.line_no,
            tli.conversion_factor_to_base,
            sum(
                round(
                    coalesce(
                        nullif(a.value->>'returned_base_quantity', '')::numeric,
                        0
                    ),
                    6
                )
            ) as returned_base,
            sum(
                round(
                    coalesce(
                        nullif(a.value->>'damaged_base_quantity', '')::numeric,
                        0
                    ),
                    6
                )
            ) as damaged_base,
            sum(
                round(
                    coalesce(
                        nullif(a.value->>'lost_base_quantity', '')::numeric,
                        0
                    ),
                    6
                )
            ) as lost_base,
            nullif(
                string_agg(
                    distinct nullif(btrim(a.value->>'condition_notes'), ''),
                    '; '
                ),
                ''
            ) as condition_notes,
            nullif(
                string_agg(
                    distinct nullif(btrim(a.value->>'damage_notes'), ''),
                    '; '
                ),
                ''
            ) as damage_notes,
            nullif(
                string_agg(
                    distinct nullif(btrim(a.value->>'missing_notes'), ''),
                    '; '
                ),
                ''
            ) as missing_notes,
            nullif(
                string_agg(
                    distinct nullif(btrim(a.value->>'notes'), ''),
                    '; '
                ),
                ''
            ) as notes
        from jsonb_array_elements(p_allocations) a(value)
        join public.tool_loan_issue_postings ip
          on ip.tool_loan_issue_posting_id =
             (a.value->>'tool_loan_issue_posting_id')::uuid
        join public.tool_loan_items tli
          on tli.tool_loan_item_id = ip.tool_loan_item_id
        group by
            tli.tool_loan_item_id,
            tli.line_no,
            tli.conversion_factor_to_base
        order by tli.line_no
    loop
        insert into public.tool_loan_return_items (
            tool_loan_return_id,
            tool_loan_item_id,
            line_no,
            returned_quantity,
            returned_base_quantity,
            damaged_quantity,
            lost_quantity,
            condition_status,
            condition_notes,
            damage_notes,
            missing_notes,
            notes,
            created_by,
            updated_by
        )
        values (
            v_return_id,
            v_item_group.tool_loan_item_id,
            v_item_group.line_no,
            round(
                v_item_group.returned_base
                / nullif(v_item_group.conversion_factor_to_base, 0),
                6
            ),
            round(v_item_group.returned_base, 6),
            round(
                v_item_group.damaged_base
                / nullif(v_item_group.conversion_factor_to_base, 0),
                6
            ),
            round(
                v_item_group.lost_base
                / nullif(v_item_group.conversion_factor_to_base, 0),
                6
            ),
            case
                when v_item_group.lost_base > 0 then 'Lost'
                when v_item_group.damaged_base > 0 then 'Damaged'
                else 'Good'
            end,
            v_item_group.condition_notes,
            v_item_group.damage_notes,
            v_item_group.missing_notes,
            v_item_group.notes,
            auth.uid(),
            auth.uid()
        );
    end loop;

    -- Post each allocation against its original issue posting and stock lot.
    for v_allocation in
        select value
        from jsonb_array_elements(p_allocations)
    loop
        select *
        into v_issue_posting
        from public.tool_loan_issue_postings
        where tool_loan_issue_posting_id =
              (v_allocation->>'tool_loan_issue_posting_id')::uuid
          and tool_loan_id = p_tool_loan_id
          and is_deleted = false
          and is_active = true;

        select *
        into v_item
        from public.tool_loan_items
        where tool_loan_item_id = v_issue_posting.tool_loan_item_id
          and is_deleted = false
        for update;

        select *
        into v_lot
        from public.stock_lots
        where stock_lot_id = v_issue_posting.stock_lot_id
          and is_deleted = false
          and is_active = true
        for update;

        if not found then
            raise exception 'The original Stock Lot was not found or is inactive.';
        end if;

        if v_lot.product_id <> v_item.product_id
           or v_lot.base_uom_code <> v_item.base_uom_code
           or v_issue_posting.base_uom_code <> v_item.base_uom_code then
            raise exception
                'Product or Base UOM mismatch between Tool Loan item, Issue Posting and Stock Lot.';
        end if;

        select tool_loan_return_item_id
        into v_return_item_id
        from public.tool_loan_return_items
        where tool_loan_return_id = v_return_id
          and tool_loan_item_id = v_item.tool_loan_item_id
          and is_deleted = false;

        v_returned_base :=
            round(coalesce(nullif(v_allocation->>'returned_base_quantity', '')::numeric, 0), 6);
        v_damaged_base :=
            round(coalesce(nullif(v_allocation->>'damaged_base_quantity', '')::numeric, 0), 6);
        v_lost_base :=
            round(coalesce(nullif(v_allocation->>'lost_base_quantity', '')::numeric, 0), 6);

        v_movement_id := null;

        if v_returned_base > 0 then
            v_new_remaining :=
                round(v_lot.remaining_quantity + v_returned_base, 6);

            if v_new_remaining > v_lot.received_quantity then
                raise exception
                    'Returned quantity exceeds Stock Lot received capacity.';
            end if;

            if v_new_remaining = 0 then
                v_new_lot_status := 'Exhausted';
            elsif v_lot.reserved_quantity = v_new_remaining then
                v_new_lot_status := 'Reserved';
            elsif v_new_remaining < v_lot.received_quantity then
                v_new_lot_status := 'Partially Issued';
            else
                v_new_lot_status := 'Available';
            end if;

            update public.stock_lots
            set
                remaining_quantity = v_new_remaining,
                lot_status = v_new_lot_status,
                updated_at = now(),
                updated_by = auth.uid()
            where stock_lot_id = v_lot.stock_lot_id;

            insert into public.stock_movements (
                stock_lot_id,
                product_id,
                movement_type,
                movement_date,
                quantity,
                base_uom_code,
                from_location_id,
                to_location_id,
                stock_request_item_id,
                supplier_delivery_item_id,
                reference_no,
                reason,
                notes,
                unit_cost,
                total_cost,
                created_by,
                updated_by,
                is_deleted
            )
            values (
                v_lot.stock_lot_id,
                v_lot.product_id,
                'Return',
                current_date,
                v_returned_base,
                v_lot.base_uom_code,
                null,
                v_lot.stock_location_id,
                v_item.stock_request_item_id,
                null,
                v_loan.tool_loan_no,
                'Tool Loan Return',
                coalesce(
                    nullif(btrim(v_allocation->>'notes'), ''),
                    format(
                        'Returned against Tool Loan %s, return %s, line %s.',
                        v_loan.tool_loan_no,
                        v_return_no,
                        v_item.line_no
                    )
                ),
                v_lot.average_unit_cost,
                case
                    when v_lot.average_unit_cost is null then null
                    else round(v_returned_base * v_lot.average_unit_cost, 4)
                end,
                auth.uid(),
                auth.uid(),
                false
            )
            returning stock_movement_id
            into v_movement_id;
        end if;

        insert into public.tool_loan_return_postings (
            tool_loan_return_id,
            tool_loan_return_item_id,
            tool_loan_id,
            tool_loan_item_id,
            tool_loan_issue_posting_id,
            stock_lot_id,
            return_stock_movement_id,
            returned_base_quantity,
            damaged_base_quantity,
            lost_base_quantity,
            base_uom_code,
            posted_at,
            posted_by,
            notes,
            created_by
        )
        values (
            v_return_id,
            v_return_item_id,
            p_tool_loan_id,
            v_item.tool_loan_item_id,
            v_issue_posting.tool_loan_issue_posting_id,
            v_issue_posting.stock_lot_id,
            v_movement_id,
            v_returned_base,
            v_damaged_base,
            v_lost_base,
            v_issue_posting.base_uom_code,
            now(),
            auth.uid(),
            nullif(btrim(v_allocation->>'notes'), ''),
            auth.uid()
        );
    end loop;

    -- Recalculate every active item from immutable postings.
    for v_item in
        select *
        from public.tool_loan_items
        where tool_loan_id = p_tool_loan_id
          and is_deleted = false
        order by line_no
        for update
    loop
        select
            coalesce(sum(returned_base_quantity), 0),
            coalesce(sum(damaged_base_quantity), 0),
            coalesce(sum(lost_base_quantity), 0)
        into
            v_total_returned,
            v_total_damaged,
            v_total_lost
        from public.tool_loan_return_postings
        where tool_loan_item_id = v_item.tool_loan_item_id
          and is_deleted = false;

        v_total_processed :=
            v_total_returned + v_total_damaged + v_total_lost;

        if v_total_processed < v_item.issued_base_quantity then
            v_new_item_status := 'PartiallyReturned';
        elsif v_total_lost > 0 then
            v_new_item_status := 'Lost';
        elsif v_total_damaged > 0 then
            v_new_item_status := 'Damaged';
        else
            v_new_item_status := 'Returned';
        end if;

        update public.tool_loan_items
        set
            returned_base_quantity = round(v_total_returned, 6),
            returned_quantity = round(
                v_total_returned
                / nullif(conversion_factor_to_base, 0),
                6
            ),
            damaged_quantity = round(
                v_total_damaged
                / nullif(conversion_factor_to_base, 0),
                6
            ),
            lost_quantity = round(
                v_total_lost
                / nullif(conversion_factor_to_base, 0),
                6
            ),
            condition_after = case
                when v_total_lost > 0 then 'Lost'
                when v_total_damaged > 0 then 'Damaged'
                when v_total_processed = issued_base_quantity then 'Good'
                else condition_after
            end,
            item_status = v_new_item_status,
            updated_at = now(),
            updated_by = auth.uid()
        where tool_loan_item_id = v_item.tool_loan_item_id;
    end loop;

    select
        case
            when exists (
                select 1
                from public.tool_loan_items
                where tool_loan_id = p_tool_loan_id
                  and is_deleted = false
                  and round(
                      returned_quantity
                      + damaged_quantity
                      + lost_quantity,
                      6
                  ) < round(issued_quantity, 6)
            ) then 'PartiallyReturned'
            when exists (
                select 1
                from public.tool_loan_items
                where tool_loan_id = p_tool_loan_id
                  and is_deleted = false
                  and lost_quantity > 0
            ) then 'Lost'
            when exists (
                select 1
                from public.tool_loan_items
                where tool_loan_id = p_tool_loan_id
                  and is_deleted = false
                  and damaged_quantity > 0
            ) then 'Damaged'
            else 'Returned'
        end
    into v_new_header_status;

    update public.tool_loans
    set
        loan_status = v_new_header_status,
        returned_date = case
            when v_new_header_status in ('Returned', 'Damaged', 'Lost')
                then current_date
            else null
        end,
        updated_at = now(),
        updated_by = auth.uid()
    where tool_loan_id = p_tool_loan_id;

    return v_return_id;
end;
$function$;

revoke all on function public.return_tool_loan_atomic(
    uuid,
    jsonb,
    uuid,
    uuid,
    text,
    text
) from public;

grant execute on function public.return_tool_loan_atomic(
    uuid,
    jsonb,
    uuid,
    uuid,
    text,
    text
) to authenticated;

grant execute on function public.return_tool_loan_atomic(
    uuid,
    jsonb,
    uuid,
    uuid,
    text,
    text
) to service_role;

commit;
