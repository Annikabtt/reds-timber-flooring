-- ============================================================
-- REDS Timber Flooring
-- Atomic Work Order Creation
--
-- Purpose
--   Create Work Order + Commercial Allocation(s)
--   + Initial Worker Assignment(s) in one PostgreSQL transaction.
--
-- Existing authoritative RPCs reused:
--   public.allocate_work_order_commercial_scope(...)
--   public.assign_work_order_worker(...)
--
-- Any exception raised anywhere in this function causes the
-- entire function call to roll back.
-- ============================================================

begin;

drop function if exists public.create_work_order_atomic(
    jsonb,
    jsonb,
    jsonb
);

create function public.create_work_order_atomic(
    p_work_order jsonb,
    p_commercial_allocations jsonb default '[]'::jsonb,
    p_worker_assignments jsonb default '[]'::jsonb
)
returns jsonb
language plpgsql
security definer
set search_path = public, auth
as $function$
declare
    v_actor_id uuid := auth.uid();

    v_work_order_id uuid;
    v_work_order_no text;

    v_project_id uuid;
    v_site_id uuid;
    v_area_id uuid;
    v_work_order_type_id uuid;
    v_work_order_scope_id uuid;

    v_title text;
    v_description text;
    v_priority text;
    v_planned_start_date date;
    v_planned_end_date date;
    v_notes text;
    v_commercial_mode text;

    v_allocation jsonb;
    v_assignment jsonb;

    v_allocation_count integer := 0;
    v_assignment_count integer := 0;
begin
    -- ========================================================
    -- 1. Authentication / permission
    -- ========================================================

    if v_actor_id is null then
        raise exception 'Authentication required.';
    end if;

    if not public.has_permission('work_orders.create') then
        raise exception 'Permission denied: work_orders.create';
    end if;

    -- ========================================================
    -- 2. Payload validation
    -- ========================================================

    if p_work_order is null
       or jsonb_typeof(p_work_order) <> 'object' then
        raise exception 'p_work_order must be a JSON object.';
    end if;

    if p_commercial_allocations is null then
        p_commercial_allocations := '[]'::jsonb;
    end if;

    if jsonb_typeof(p_commercial_allocations) <> 'array' then
        raise exception 'p_commercial_allocations must be a JSON array.';
    end if;

    if p_worker_assignments is null then
        p_worker_assignments := '[]'::jsonb;
    end if;

    if jsonb_typeof(p_worker_assignments) <> 'array' then
        raise exception 'p_worker_assignments must be a JSON array.';
    end if;

    -- ========================================================
    -- 3. Parse Work Order header
    -- ========================================================

    begin
        v_project_id :=
            nullif(trim(p_work_order->>'project_id'), '')::uuid;

        v_site_id :=
            nullif(trim(p_work_order->>'site_id'), '')::uuid;

        v_area_id :=
            nullif(trim(p_work_order->>'area_id'), '')::uuid;

        v_work_order_type_id :=
            nullif(trim(p_work_order->>'work_order_type_id'), '')::uuid;

        v_work_order_scope_id :=
            nullif(trim(p_work_order->>'work_order_scope_id'), '')::uuid;

        v_planned_start_date :=
            nullif(trim(p_work_order->>'planned_start_date'), '')::date;

        v_planned_end_date :=
            nullif(trim(p_work_order->>'planned_end_date'), '')::date;
    exception
        when invalid_text_representation
          or datetime_field_overflow then
            raise exception 'Invalid Work Order identifier or date value.';
    end;

    v_description :=
        nullif(trim(p_work_order->>'description'), '');

    v_priority :=
        coalesce(
            nullif(trim(p_work_order->>'priority'), ''),
            'Normal'
        );

    v_notes :=
        nullif(trim(p_work_order->>'notes'), '');

    v_commercial_mode :=
        coalesce(
            nullif(trim(p_work_order->>'commercial_mode'), ''),
            'OperationalManual'
        );

    -- ========================================================
    -- 4. Required header validation
    -- ========================================================

    if v_project_id is null then
        raise exception 'Project is required.';
    end if;

    if v_site_id is null then
        raise exception 'Project Site is required.';
    end if;

    if v_work_order_type_id is null then
        raise exception 'Work Order Type is required.';
    end if;

    if v_work_order_scope_id is null then
        raise exception 'Work Scope is required.';
    end if;

    if v_commercial_mode not in (
        'CommercialSource',
        'OperationalManual'
    ) then
        raise exception
            'Invalid commercial_mode: %',
            v_commercial_mode;
    end if;

    if v_planned_start_date is not null
       and v_planned_end_date is not null
       and v_planned_end_date < v_planned_start_date then
        raise exception
            'Planned End Date cannot be before Planned Start Date.';
    end if;

    -- ========================================================
    -- 5. Resolve Work Scope title from authoritative master
    -- ========================================================

    select
        wos.work_order_scope_name
    into
        v_title
    from public.work_order_scopes wos
    where wos.work_order_scope_id = v_work_order_scope_id
      and wos.is_active = true;

    if v_title is null then
        raise exception
            'Selected Work Scope was not found or is inactive.';
    end if;

    -- ========================================================
    -- 6. Commercial mode consistency
    -- ========================================================

    v_allocation_count :=
        jsonb_array_length(p_commercial_allocations);

    v_assignment_count :=
        jsonb_array_length(p_worker_assignments);

    if v_commercial_mode = 'CommercialSource'
       and v_allocation_count = 0 then
        raise exception
            'CommercialSource Work Order requires at least one commercial allocation.';
    end if;

    if v_commercial_mode = 'OperationalManual'
       and v_allocation_count > 0 then
        raise exception
            'OperationalManual Work Order cannot contain commercial allocations.';
    end if;

    if v_allocation_count > 0
       and not public.has_permission(
           'work_orders.allocate_commercial_scope'
       ) then
        raise exception
            'Permission denied: work_orders.allocate_commercial_scope';
    end if;

    if v_assignment_count > 0
       and not public.has_permission(
           'work_orders.assign_worker'
       ) then
        raise exception
            'Permission denied: work_orders.assign_worker';
    end if;

    -- ========================================================
    -- 7. Create Work Order
    --
    -- work_order_no is intentionally not supplied.
    -- Existing database numbering/default/trigger remains
    -- authoritative.
    -- ========================================================

    insert into public.work_orders (
        project_id,
        site_id,
        area_id,
        title,
        description,
        priority,
        status,
        planned_start_date,
        planned_end_date,
        actual_start_date,
        actual_end_date,
        notes,
        is_deleted,
        created_by,
        updated_by,
        work_order_type_id,
        work_order_scope_id,
        commercial_mode
    )
    values (
        v_project_id,
        v_site_id,
        v_area_id,
        v_title,
        v_description,
        v_priority,
        'Open',
        v_planned_start_date,
        v_planned_end_date,
        null,
        null,
        v_notes,
        false,
        v_actor_id,
        v_actor_id,
        v_work_order_type_id,
        v_work_order_scope_id,
        v_commercial_mode
    )
    returning
        work_order_id,
        work_order_no
    into
        v_work_order_id,
        v_work_order_no;

    -- ========================================================
    -- 8. Commercial allocations
    --
    -- Existing allocation RPC remains authoritative for:
    --   source validation
    --   hierarchy validation
    --   Base Quantity
    --   concurrency locking
    --   over-allocation
    --   audit
    -- ========================================================

    for v_allocation in
        select value
        from jsonb_array_elements(p_commercial_allocations)
    loop
        if nullif(
            trim(v_allocation->>'source_type'),
            ''
        ) is null then
            raise exception
                'Commercial allocation source_type is required.';
        end if;

        if nullif(
            trim(v_allocation->>'source_line_id'),
            ''
        ) is null then
            raise exception
                'Commercial allocation source_line_id is required.';
        end if;

        if coalesce(
            nullif(
                trim(v_allocation->>'allocated_quantity'),
                ''
            )::numeric,
            0
        ) <= 0 then
            raise exception
                'Commercial allocated quantity must be greater than zero.';
        end if;

        perform public.allocate_work_order_commercial_scope(
            v_work_order_id,
            trim(v_allocation->>'source_type'),
            nullif(
                trim(v_allocation->>'source_line_id'),
                ''
            )::uuid,
            nullif(
                trim(v_allocation->>'allocated_quantity'),
                ''
            )::numeric,
            nullif(
                trim(v_allocation->>'notes'),
                ''
            )
        );
    end loop;

    -- ========================================================
    -- 9. Initial worker assignments
    --
    -- Existing worker RPC remains authoritative for:
    --   quantity validation
    --   UOM validation
    --   commercial allocation capacity
    --   assignment status
    --   audit
    -- ========================================================

    for v_assignment in
        select value
        from jsonb_array_elements(p_worker_assignments)
    loop
        if nullif(
            trim(v_assignment->>'employee_id'),
            ''
        ) is null then
            raise exception
                'Worker employee_id is required.';
        end if;

        if nullif(
            trim(v_assignment->>'activity_type_id'),
            ''
        ) is null then
            raise exception
                'Worker activity_type_id is required.';
        end if;

        if nullif(
            trim(v_assignment->>'assigned_uom_code'),
            ''
        ) is null then
            raise exception
                'Worker assigned_uom_code is required.';
        end if;

        if coalesce(
            nullif(
                trim(v_assignment->>'assigned_quantity'),
                ''
            )::numeric,
            0
        ) <= 0 then
            raise exception
                'Worker assigned quantity must be greater than zero.';
        end if;

        perform public.assign_work_order_worker(
            v_work_order_id,
            nullif(
                trim(v_assignment->>'employee_id'),
                ''
            )::uuid,
            nullif(
                trim(v_assignment->>'assigned_quantity'),
                ''
            )::numeric,
            trim(v_assignment->>'assigned_uom_code'),
            nullif(
                trim(v_assignment->>'activity_type_id'),
                ''
            )::uuid,
            nullif(
                trim(v_assignment->>'notes'),
                ''
            )
        );
    end loop;

    -- ========================================================
    -- 10. Return
    -- ========================================================

    return jsonb_build_object(
        'work_order_id', v_work_order_id,
        'work_order_no', v_work_order_no,
        'commercial_mode', v_commercial_mode,
        'commercial_allocation_count', v_allocation_count,
        'worker_assignment_count', v_assignment_count
    );
end;
$function$;

comment on function public.create_work_order_atomic(
    jsonb,
    jsonb,
    jsonb
)
is
'Atomically creates a Work Order, commercial allocations and initial worker assignments. Existing allocation and worker assignment RPCs remain authoritative. Any error rolls back the complete operation.';


-- ============================================================
-- EXECUTE permissions
-- ============================================================

revoke all on function public.create_work_order_atomic(
    jsonb,
    jsonb,
    jsonb
)
from public;

revoke all on function public.create_work_order_atomic(
    jsonb,
    jsonb,
    jsonb
)
from anon;

grant execute on function public.create_work_order_atomic(
    jsonb,
    jsonb,
    jsonb
)
to authenticated;


commit;