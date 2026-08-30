-- ============================================================================
-- REDS Timber Flooring
-- Work Order Commercial Allocation + Worker Quantity/Reassignment Catch-up
-- Generated from the Hosted Supabase authoritative structure/functions
-- captured on 2026-08-17.
--
-- Purpose:
--   Bring Local Supabase to parity with the already-tested Hosted backend.
--   This migration does NOT change the locked business rules.
-- ============================================================================

begin;

-- ============================================================================
-- 01. WORK ORDER COMMERCIAL MODE
-- ============================================================================

alter table public.work_orders
    add column if not exists commercial_mode text;

update public.work_orders
set commercial_mode = 'OperationalManual'
where commercial_mode is null;

alter table public.work_orders
    alter column commercial_mode set default 'OperationalManual',
    alter column commercial_mode set not null;

alter table public.work_orders
    drop constraint if exists work_orders_commercial_mode_check;

alter table public.work_orders
    add constraint work_orders_commercial_mode_check
    check (commercial_mode = any (array['CommercialSource'::text, 'OperationalManual'::text]));

create index if not exists idx_work_orders_commercial_mode
    on public.work_orders (commercial_mode, status)
    where is_deleted = false;


-- ============================================================================
-- 02. WORK ASSIGNMENT QUANTITY / BASE-UOM FOUNDATION
-- ============================================================================

alter table public.work_assignments
    add column if not exists assigned_quantity numeric,
    add column if not exists assigned_uom_code text,
    add column if not exists assigned_base_quantity numeric,
    add column if not exists assignment_status text,
    add column if not exists ended_reason text,
    add column if not exists reassigned_from_work_assignment_id uuid,
    add column if not exists assigned_base_uom_code text;

update public.work_assignments
set assignment_status = 'Active'
where assignment_status is null;

alter table public.work_assignments
    alter column assignment_status set default 'Active',
    alter column assignment_status set not null;

alter table public.work_assignments
    drop constraint if exists work_assignments_assigned_quantity_check;

alter table public.work_assignments
    add constraint work_assignments_assigned_quantity_check
    check (
        (
            assigned_quantity is null
            and assigned_uom_code is null
            and assigned_base_quantity is null
            and assigned_base_uom_code is null
        )
        or
        (
            assigned_quantity is not null
            and assigned_quantity > 0::numeric
            and assigned_uom_code is not null
            and assigned_base_quantity is not null
            and assigned_base_quantity > 0::numeric
            and assigned_base_uom_code is not null
        )
    );

alter table public.work_assignments
    drop constraint if exists work_assignments_assignment_status_check;

alter table public.work_assignments
    add constraint work_assignments_assignment_status_check
    check (
        assignment_status = any (
            array[
                'Active'::text,
                'Completed'::text,
                'Reassigned'::text,
                'Ended'::text,
                'Cancelled'::text
            ]
        )
    );

do $$
begin
    if not exists (
        select 1
        from pg_constraint
        where conrelid = 'public.work_assignments'::regclass
          and conname = 'work_assignments_assigned_uom_code_fkey'
    ) then
        alter table public.work_assignments
            add constraint work_assignments_assigned_uom_code_fkey
            foreign key (assigned_uom_code)
            references public.units_of_measure(uom_code)
            on update cascade
            on delete restrict;
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conrelid = 'public.work_assignments'::regclass
          and conname = 'work_assignments_assigned_base_uom_code_fkey'
    ) then
        alter table public.work_assignments
            add constraint work_assignments_assigned_base_uom_code_fkey
            foreign key (assigned_base_uom_code)
            references public.units_of_measure(uom_code)
            on update cascade
            on delete restrict;
    end if;

    if not exists (
        select 1
        from pg_constraint
        where conrelid = 'public.work_assignments'::regclass
          and conname = 'work_assignments_reassigned_from_fkey'
    ) then
        alter table public.work_assignments
            add constraint work_assignments_reassigned_from_fkey
            foreign key (reassigned_from_work_assignment_id)
            references public.work_assignments(work_assignment_id)
            on delete restrict;
    end if;
end
$$;

create index if not exists idx_work_assignments_assignment_status
    on public.work_assignments (work_order_id, assignment_status)
    where is_deleted = false;

create index if not exists idx_work_assignments_reassigned_from
    on public.work_assignments (reassigned_from_work_assignment_id)
    where reassigned_from_work_assignment_id is not null
      and is_deleted = false;


-- ============================================================================
-- 03. COMMERCIAL ALLOCATION TABLE
-- ============================================================================

create table if not exists public.work_order_commercial_allocations (
    work_order_commercial_allocation_id uuid not null default gen_random_uuid(),
    work_order_id uuid not null,
    source_type text not null,
    quotation_id uuid,
    source_quotation_line_id uuid,
    accepted_revision_id uuid,
    source_revision_line_id uuid,
    variation_id uuid,
    source_variation_line_id uuid,
    source_line_uid uuid,
    product_id uuid,
    project_area_id uuid,
    source_uom_code text,
    source_quantity numeric not null,
    source_base_uom_code text,
    source_conversion_factor numeric,
    source_base_quantity numeric not null,
    allocated_quantity numeric not null,
    allocated_base_quantity numeric not null,
    allocation_status text not null default 'Active',
    released_quantity numeric not null default 0,
    released_base_quantity numeric not null default 0,
    notes text,
    is_active boolean not null default true,
    is_deleted boolean not null default false,
    deleted_at timestamptz,
    created_at timestamptz not null default now(),
    updated_at timestamptz not null default now(),
    created_by uuid,
    updated_by uuid
);

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.work_order_commercial_allocations'::regclass
          and conname = 'work_order_commercial_allocations_pkey'
    ) then
        alter table public.work_order_commercial_allocations
            add constraint work_order_commercial_allocations_pkey
            primary key (work_order_commercial_allocation_id);
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.work_order_commercial_allocations'::regclass
          and conname = 'work_order_commercial_allocations_work_order_id_fkey'
    ) then
        alter table public.work_order_commercial_allocations
            add constraint work_order_commercial_allocations_work_order_id_fkey
            foreign key (work_order_id)
            references public.work_orders(work_order_id)
            on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.work_order_commercial_allocations'::regclass
          and conname = 'work_order_commercial_allocations_quotation_id_fkey'
    ) then
        alter table public.work_order_commercial_allocations
            add constraint work_order_commercial_allocations_quotation_id_fkey
            foreign key (quotation_id)
            references public.quotations(quotation_id)
            on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.work_order_commercial_allocations'::regclass
          and conname = 'work_order_commercial_allocations_source_quotation_line_id_fkey'
    ) then
        alter table public.work_order_commercial_allocations
            add constraint work_order_commercial_allocations_source_quotation_line_id_fkey
            foreign key (source_quotation_line_id)
            references public.quotation_lines(quotation_line_id)
            on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.work_order_commercial_allocations'::regclass
          and conname = 'work_order_commercial_allocations_accepted_revision_id_fkey'
    ) then
        alter table public.work_order_commercial_allocations
            add constraint work_order_commercial_allocations_accepted_revision_id_fkey
            foreign key (accepted_revision_id)
            references public.quotation_revisions(revision_id)
            on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.work_order_commercial_allocations'::regclass
          and conname = 'work_order_commercial_allocations_source_revision_line_id_fkey'
    ) then
        alter table public.work_order_commercial_allocations
            add constraint work_order_commercial_allocations_source_revision_line_id_fkey
            foreign key (source_revision_line_id)
            references public.quotation_revision_lines(revision_line_id)
            on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.work_order_commercial_allocations'::regclass
          and conname = 'work_order_commercial_allocations_variation_id_fkey'
    ) then
        alter table public.work_order_commercial_allocations
            add constraint work_order_commercial_allocations_variation_id_fkey
            foreign key (variation_id)
            references public.variations(variation_id)
            on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.work_order_commercial_allocations'::regclass
          and conname = 'work_order_commercial_allocations_source_variation_line_id_fkey'
    ) then
        alter table public.work_order_commercial_allocations
            add constraint work_order_commercial_allocations_source_variation_line_id_fkey
            foreign key (source_variation_line_id)
            references public.variation_lines(variation_line_id)
            on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.work_order_commercial_allocations'::regclass
          and conname = 'work_order_commercial_allocations_product_id_fkey'
    ) then
        alter table public.work_order_commercial_allocations
            add constraint work_order_commercial_allocations_product_id_fkey
            foreign key (product_id)
            references public.products(product_id)
            on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.work_order_commercial_allocations'::regclass
          and conname = 'work_order_commercial_allocations_project_area_id_fkey'
    ) then
        alter table public.work_order_commercial_allocations
            add constraint work_order_commercial_allocations_project_area_id_fkey
            foreign key (project_area_id)
            references public.project_areas(area_id)
            on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.work_order_commercial_allocations'::regclass
          and conname = 'work_order_commercial_allocations_source_uom_code_fkey'
    ) then
        alter table public.work_order_commercial_allocations
            add constraint work_order_commercial_allocations_source_uom_code_fkey
            foreign key (source_uom_code)
            references public.units_of_measure(uom_code)
            on update cascade
            on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.work_order_commercial_allocations'::regclass
          and conname = 'work_order_commercial_allocations_source_base_uom_code_fkey'
    ) then
        alter table public.work_order_commercial_allocations
            add constraint work_order_commercial_allocations_source_base_uom_code_fkey
            foreign key (source_base_uom_code)
            references public.units_of_measure(uom_code)
            on update cascade
            on delete restrict;
    end if;
end
$$;

alter table public.work_order_commercial_allocations
    drop constraint if exists work_order_commercial_allocations_source_type_check,
    drop constraint if exists work_order_commercial_allocations_source_reference_check,
    drop constraint if exists work_order_commercial_allocations_quantity_check,
    drop constraint if exists work_order_commercial_allocations_status_check;

alter table public.work_order_commercial_allocations
    add constraint work_order_commercial_allocations_source_type_check
    check (
        source_type = any (
            array[
                'AcceptedQuotation'::text,
                'AcceptedRevision'::text,
                'AcceptedVariation'::text
            ]
        )
    ),
    add constraint work_order_commercial_allocations_source_reference_check
    check (
        (
            source_type = 'AcceptedQuotation'::text
            and quotation_id is not null
            and source_quotation_line_id is not null
            and accepted_revision_id is null
            and source_revision_line_id is null
            and variation_id is null
            and source_variation_line_id is null
        )
        or
        (
            source_type = 'AcceptedRevision'::text
            and accepted_revision_id is not null
            and source_revision_line_id is not null
            and quotation_id is null
            and source_quotation_line_id is null
            and variation_id is null
            and source_variation_line_id is null
        )
        or
        (
            source_type = 'AcceptedVariation'::text
            and variation_id is not null
            and source_variation_line_id is not null
            and quotation_id is null
            and source_quotation_line_id is null
            and accepted_revision_id is null
            and source_revision_line_id is null
        )
    ),
    add constraint work_order_commercial_allocations_quantity_check
    check (
        source_quantity > 0::numeric
        and source_base_quantity > 0::numeric
        and allocated_quantity > 0::numeric
        and allocated_base_quantity > 0::numeric
        and (
            source_conversion_factor is null
            or source_conversion_factor > 0::numeric
        )
        and released_quantity >= 0::numeric
        and released_base_quantity >= 0::numeric
        and released_quantity <= allocated_quantity
        and released_base_quantity <= allocated_base_quantity
    ),
    add constraint work_order_commercial_allocations_status_check
    check (
        allocation_status = any (
            array[
                'Active'::text,
                'Completed'::text,
                'Partially Released'::text,
                'Released'::text,
                'Cancelled'::text
            ]
        )
    );

create index if not exists idx_work_order_commercial_allocations_work_order
    on public.work_order_commercial_allocations (work_order_id)
    where is_deleted = false;

create index if not exists idx_work_order_commercial_allocations_quotation_line
    on public.work_order_commercial_allocations (source_quotation_line_id)
    where source_quotation_line_id is not null
      and is_deleted = false;

create index if not exists idx_work_order_commercial_allocations_revision_line
    on public.work_order_commercial_allocations (source_revision_line_id)
    where source_revision_line_id is not null
      and is_deleted = false;

create index if not exists idx_work_order_commercial_allocations_variation_line
    on public.work_order_commercial_allocations (source_variation_line_id)
    where source_variation_line_id is not null
      and is_deleted = false;

create unique index if not exists ux_work_order_commercial_allocation_quotation_line
    on public.work_order_commercial_allocations (
        work_order_id,
        source_quotation_line_id
    )
    where source_type = 'AcceptedQuotation'::text
      and source_quotation_line_id is not null
      and is_active = true
      and is_deleted = false;

create unique index if not exists ux_work_order_commercial_allocation_revision_line
    on public.work_order_commercial_allocations (
        work_order_id,
        source_revision_line_id
    )
    where source_type = 'AcceptedRevision'::text
      and source_revision_line_id is not null
      and is_active = true
      and is_deleted = false;

create unique index if not exists ux_work_order_commercial_allocation_variation_line
    on public.work_order_commercial_allocations (
        work_order_id,
        source_variation_line_id
    )
    where source_type = 'AcceptedVariation'::text
      and source_variation_line_id is not null
      and is_active = true
      and is_deleted = false;

drop trigger if exists trg_work_order_commercial_allocations_updated_at
    on public.work_order_commercial_allocations;

create trigger trg_work_order_commercial_allocations_updated_at
before update on public.work_order_commercial_allocations
for each row
execute function public.set_updated_at();


-- ============================================================================
-- 04. COMMERCIAL ALLOCATION RELEASE HISTORY
-- ============================================================================

create table if not exists public.work_order_commercial_allocation_release_history (
    work_order_commercial_allocation_release_history_id uuid not null default gen_random_uuid(),
    work_order_commercial_allocation_id uuid not null,
    work_order_id uuid not null,
    source_type text not null,
    source_quotation_line_id uuid,
    source_revision_line_id uuid,
    source_variation_line_id uuid,
    source_uom_code text,
    source_base_uom_code text,
    released_now_quantity numeric not null,
    released_now_base_quantity numeric not null,
    previous_released_quantity numeric not null,
    previous_released_base_quantity numeric not null,
    new_released_quantity numeric not null,
    new_released_base_quantity numeric not null,
    reason text not null,
    notes text,
    created_at timestamptz not null default now(),
    created_by uuid default auth.uid()
);

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.work_order_commercial_allocation_release_history'::regclass
          and conname = 'work_order_commercial_allocation_release_history_pkey'
    ) then
        alter table public.work_order_commercial_allocation_release_history
            add constraint work_order_commercial_allocation_release_history_pkey
            primary key (work_order_commercial_allocation_release_history_id);
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.work_order_commercial_allocation_release_history'::regclass
          and conname = 'work_order_commercial_allocat_work_order_commercial_alloca_fkey'
    ) then
        alter table public.work_order_commercial_allocation_release_history
            add constraint work_order_commercial_allocat_work_order_commercial_alloca_fkey
            foreign key (work_order_commercial_allocation_id)
            references public.work_order_commercial_allocations(work_order_commercial_allocation_id)
            on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.work_order_commercial_allocation_release_history'::regclass
          and conname = 'work_order_commercial_allocation_release_his_work_order_id_fkey'
    ) then
        alter table public.work_order_commercial_allocation_release_history
            add constraint work_order_commercial_allocation_release_his_work_order_id_fkey
            foreign key (work_order_id)
            references public.work_orders(work_order_id)
            on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.work_order_commercial_allocation_release_history'::regclass
          and conname = 'work_order_commercial_allocation__source_quotation_line_id_fkey'
    ) then
        alter table public.work_order_commercial_allocation_release_history
            add constraint work_order_commercial_allocation__source_quotation_line_id_fkey
            foreign key (source_quotation_line_id)
            references public.quotation_lines(quotation_line_id)
            on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.work_order_commercial_allocation_release_history'::regclass
          and conname = 'work_order_commercial_allocation_r_source_revision_line_id_fkey'
    ) then
        alter table public.work_order_commercial_allocation_release_history
            add constraint work_order_commercial_allocation_r_source_revision_line_id_fkey
            foreign key (source_revision_line_id)
            references public.quotation_revision_lines(revision_line_id)
            on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.work_order_commercial_allocation_release_history'::regclass
          and conname = 'work_order_commercial_allocation__source_variation_line_id_fkey'
    ) then
        alter table public.work_order_commercial_allocation_release_history
            add constraint work_order_commercial_allocation__source_variation_line_id_fkey
            foreign key (source_variation_line_id)
            references public.variation_lines(variation_line_id)
            on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.work_order_commercial_allocation_release_history'::regclass
          and conname = 'work_order_commercial_allocation_release_h_source_uom_code_fkey'
    ) then
        alter table public.work_order_commercial_allocation_release_history
            add constraint work_order_commercial_allocation_release_h_source_uom_code_fkey
            foreign key (source_uom_code)
            references public.units_of_measure(uom_code)
            on update cascade
            on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.work_order_commercial_allocation_release_history'::regclass
          and conname = 'work_order_commercial_allocation_rele_source_base_uom_code_fkey'
    ) then
        alter table public.work_order_commercial_allocation_release_history
            add constraint work_order_commercial_allocation_rele_source_base_uom_code_fkey
            foreign key (source_base_uom_code)
            references public.units_of_measure(uom_code)
            on update cascade
            on delete restrict;
    end if;
end
$$;

alter table public.work_order_commercial_allocation_release_history
    drop constraint if exists work_order_commercial_allocation_release_history_quantity_check,
    drop constraint if exists work_order_commercial_allocation_release_history_reason_check,
    drop constraint if exists work_order_commercial_allocation_release_history_source_type_ch;

alter table public.work_order_commercial_allocation_release_history
    add constraint work_order_commercial_allocation_release_history_quantity_check
    check (
        released_now_quantity > 0::numeric
        and released_now_base_quantity > 0::numeric
        and previous_released_quantity >= 0::numeric
        and previous_released_base_quantity >= 0::numeric
        and new_released_quantity >= previous_released_quantity
        and new_released_base_quantity >= previous_released_base_quantity
        and new_released_quantity = previous_released_quantity + released_now_quantity
        and new_released_base_quantity = previous_released_base_quantity + released_now_base_quantity
    ),
    add constraint work_order_commercial_allocation_release_history_reason_check
    check (length(trim(both from reason)) > 0),
    add constraint work_order_commercial_allocation_release_history_source_type_ch
    check (
        source_type = any (
            array[
                'AcceptedQuotation'::text,
                'AcceptedRevision'::text,
                'AcceptedVariation'::text
            ]
        )
    );

create index if not exists idx_wo_commercial_release_history_allocation
    on public.work_order_commercial_allocation_release_history (
        work_order_commercial_allocation_id,
        created_at
    );

create index if not exists idx_wo_commercial_release_history_work_order
    on public.work_order_commercial_allocation_release_history (
        work_order_id,
        created_at
    );


-- ============================================================================
-- 05. WORK ASSIGNMENT REASSIGNMENT HISTORY
-- ============================================================================

create table if not exists public.work_assignment_reassignment_history (
    work_assignment_reassignment_id uuid not null default gen_random_uuid(),
    work_order_id uuid not null,
    from_work_assignment_id uuid not null,
    to_work_assignment_id uuid not null,
    reassigned_quantity numeric,
    reassigned_uom_code text,
    reassigned_base_quantity numeric,
    reason text not null,
    notes text,
    created_at timestamptz not null default now(),
    created_by uuid
);

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.work_assignment_reassignment_history'::regclass
          and conname = 'work_assignment_reassignment_history_pkey'
    ) then
        alter table public.work_assignment_reassignment_history
            add constraint work_assignment_reassignment_history_pkey
            primary key (work_assignment_reassignment_id);
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.work_assignment_reassignment_history'::regclass
          and conname = 'work_assignment_reassignment_history_work_order_id_fkey'
    ) then
        alter table public.work_assignment_reassignment_history
            add constraint work_assignment_reassignment_history_work_order_id_fkey
            foreign key (work_order_id)
            references public.work_orders(work_order_id)
            on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.work_assignment_reassignment_history'::regclass
          and conname = 'work_assignment_reassignment_histo_from_work_assignment_id_fkey'
    ) then
        alter table public.work_assignment_reassignment_history
            add constraint work_assignment_reassignment_histo_from_work_assignment_id_fkey
            foreign key (from_work_assignment_id)
            references public.work_assignments(work_assignment_id)
            on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.work_assignment_reassignment_history'::regclass
          and conname = 'work_assignment_reassignment_history_to_work_assignment_id_fkey'
    ) then
        alter table public.work_assignment_reassignment_history
            add constraint work_assignment_reassignment_history_to_work_assignment_id_fkey
            foreign key (to_work_assignment_id)
            references public.work_assignments(work_assignment_id)
            on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.work_assignment_reassignment_history'::regclass
          and conname = 'work_assignment_reassignment_history_reassigned_uom_code_fkey'
    ) then
        alter table public.work_assignment_reassignment_history
            add constraint work_assignment_reassignment_history_reassigned_uom_code_fkey
            foreign key (reassigned_uom_code)
            references public.units_of_measure(uom_code)
            on update cascade
            on delete restrict;
    end if;
end
$$;

alter table public.work_assignment_reassignment_history
    drop constraint if exists work_assignment_reassignment_different_assignment_check,
    drop constraint if exists work_assignment_reassignment_quantity_check,
    drop constraint if exists work_assignment_reassignment_reason_not_blank;

alter table public.work_assignment_reassignment_history
    add constraint work_assignment_reassignment_different_assignment_check
    check (from_work_assignment_id <> to_work_assignment_id),
    add constraint work_assignment_reassignment_quantity_check
    check (
        (
            reassigned_quantity is null
            and reassigned_base_quantity is null
        )
        or
        (
            reassigned_quantity is not null
            and reassigned_quantity > 0::numeric
            and reassigned_uom_code is not null
            and reassigned_base_quantity is not null
            and reassigned_base_quantity > 0::numeric
        )
    ),
    add constraint work_assignment_reassignment_reason_not_blank
    check (btrim(reason) <> ''::text);

create index if not exists idx_work_assignment_reassignment_from
    on public.work_assignment_reassignment_history (from_work_assignment_id);

create index if not exists idx_work_assignment_reassignment_to
    on public.work_assignment_reassignment_history (to_work_assignment_id);

create index if not exists idx_work_assignment_reassignment_work_order
    on public.work_assignment_reassignment_history (work_order_id, created_at);


-- ============================================================================
-- 05A. WORK ORDER UPDATE GUARDS
-- ============================================================================

create or replace function public.validate_work_order_protected_update()
returns trigger
language plpgsql
security invoker
set search_path = public, pg_temp
as $function$
begin
    if new.status is distinct from old.status
       and new.status = 'Cancelled'
       and auth.role() = 'authenticated'
       and not public.has_permission('work_orders.cancel'::text) then
        raise exception 'Permission denied: work_orders.cancel';
    end if;

    if (
        new.project_id is distinct from old.project_id
        or new.site_id is distinct from old.site_id
        or new.area_id is distinct from old.area_id
    ) and exists (
        select 1
        from public.work_order_commercial_allocations allocation
        where allocation.work_order_id = old.work_order_id
    ) then
        raise exception
            'Project, site and area cannot be changed after commercial scope has been allocated.';
    end if;

    return new;
end;
$function$;

drop trigger if exists trg_validate_work_order_protected_update
    on public.work_orders;

create trigger trg_validate_work_order_protected_update
before update of status, project_id, site_id, area_id
on public.work_orders
for each row
execute function public.validate_work_order_protected_update();


-- ============================================================================
-- 06. RLS
-- ============================================================================

alter table public.work_orders enable row level security;
alter table public.work_assignments enable row level security;
alter table public.work_order_commercial_allocations enable row level security;
alter table public.work_order_commercial_allocation_release_history enable row level security;
alter table public.work_assignment_reassignment_history enable row level security;

drop policy if exists work_orders_read
    on public.work_orders;

create policy work_orders_read
on public.work_orders
for select
to authenticated
using (
    is_deleted = false
    and (
        public.has_permission('work_orders.view'::text)
        or public.is_project_role()
    )
);

drop policy if exists work_orders_update_by_permission
    on public.work_orders;

create policy work_orders_update_by_permission
on public.work_orders
for update
to authenticated
using (
    is_deleted = false
    and public.has_permission('work_orders.update'::text)
)
with check (
    public.has_permission('work_orders.update'::text)
);

drop policy if exists work_assignments_read
    on public.work_assignments;

create policy work_assignments_read
on public.work_assignments
for select
to authenticated
using (
    is_deleted = false
    and (
        public.has_permission('work_orders.view'::text)
        or public.is_project_role()
    )
);

drop policy if exists work_order_commercial_allocations_read
    on public.work_order_commercial_allocations;

create policy work_order_commercial_allocations_read
on public.work_order_commercial_allocations
for select
to authenticated
using (
    is_deleted = false
    and public.has_permission('work_orders.view_commercial_source'::text)
);

drop policy if exists work_order_commercial_allocation_release_history_select
    on public.work_order_commercial_allocation_release_history;

create policy work_order_commercial_allocation_release_history_select
on public.work_order_commercial_allocation_release_history
for select
to authenticated
using (
    public.has_permission('work_orders.view_commercial_source'::text)
);

drop policy if exists work_assignment_reassignment_history_read
    on public.work_assignment_reassignment_history;

create policy work_assignment_reassignment_history_read
on public.work_assignment_reassignment_history
for select
to authenticated
using (
    public.has_permission('work_orders.view'::text)
    or public.is_project_role()
);


-- ============================================================================
-- 07. PERMISSIONS
-- ============================================================================

-- Update existing rows first.
update public.app_permissions
set
    permission_name = v.permission_name,
    module_code = 'work_orders',
    description = v.description
from (
    values
        (
            'work_orders.allocate_commercial_scope',
            'Allocate Work Order Commercial Scope',
            'Allocate eligible Accepted commercial source-line quantity to a Commercial Work Order using Base Quantity as the allocation authority.'
        ),
        (
            'work_orders.assign_worker',
            'Assign Work Order Workers',
            'Assign workers and assigned quantities to a Work Order without changing its Commercial Source allocation.'
        ),
        (
            'work_orders.cancel',
            'Cancel Work Orders',
            'Cancel an eligible Work Order according to the Work Order workflow while retaining its commercial source, assignment and audit history.'
        ),
        (
            'work_orders.create',
            'Create Work Orders',
            'Create Work Orders for eligible project, site and area records, including Commercial Source or Operational / Manual mode.'
        ),
        (
            'work_orders.reassign_worker',
            'Reassign Work Order Workers',
            'Reassign eligible remaining Work Order quantity from one worker assignment to another while preserving reassignment audit history.'
        ),
        (
            'work_orders.release_commercial_scope',
            'Release Work Order Commercial Scope',
            'Release eligible Work Order commercial allocation quantity back to its original Accepted commercial source while preserving allocation audit history.'
        ),
        (
            'work_orders.update',
            'Update Work Orders',
            'Update editable Work Order header and operational information while permitted by the Work Order workflow.'
        ),
        (
            'work_orders.view',
            'View Work Orders',
            'View Work Order lists, details, project/site/area context, operational status and worker assignments.'
        ),
        (
            'work_orders.view_commercial_source',
            'View Work Order Commercial Sources',
            'View eligible Accepted Quotation, Accepted Quotation Revision and Accepted Variation source lines and their available commercial quantities for a Work Order.'
        )
) as v(permission_code, permission_name, description)
where public.app_permissions.permission_code = v.permission_code;

-- ============================================================
-- WORK ORDER PERMISSIONS
-- app_permissions.action_code is NOT NULL
-- ============================================================

insert into public.app_permissions (
    permission_code,
    permission_name,
    module_code,
    action_code,
    description
)
select
    v.permission_code,
    v.permission_name,
    'work_orders',
    v.action_code,
    v.description
from (
    values
        (
            'work_orders.allocate_commercial_scope',
            'Allocate Work Order Commercial Scope',
            'allocate_commercial_scope',
            'Allocate eligible Accepted commercial source-line quantity to a Commercial Work Order using Base Quantity as the allocation authority.'
        ),
        (
            'work_orders.assign_worker',
            'Assign Work Order Workers',
            'assign_worker',
            'Assign workers and assigned quantities to a Work Order without changing its Commercial Source allocation.'
        ),
        (
            'work_orders.cancel',
            'Cancel Work Orders',
            'cancel',
            'Cancel an eligible Work Order according to the Work Order workflow while retaining its commercial source, assignment and audit history.'
        ),
        (
            'work_orders.create',
            'Create Work Orders',
            'create',
            'Create Work Orders for eligible project, site and area records, including Commercial Source or Operational / Manual mode.'
        ),
        (
            'work_orders.reassign_worker',
            'Reassign Work Order Workers',
            'reassign_worker',
            'Reassign eligible remaining Work Order quantity from one worker assignment to another while preserving reassignment audit history.'
        ),
        (
            'work_orders.release_commercial_scope',
            'Release Work Order Commercial Scope',
            'release_commercial_scope',
            'Release eligible Work Order commercial allocation quantity back to its original Accepted commercial source while preserving allocation audit history.'
        ),
        (
            'work_orders.update',
            'Update Work Orders',
            'update',
            'Update editable Work Order header and operational information while permitted by the Work Order workflow.'
        ),
        (
            'work_orders.view',
            'View Work Orders',
            'view',
            'View Work Order lists, details, project/site/area context, operational status and worker assignments.'
        ),
        (
            'work_orders.view_commercial_source',
            'View Work Order Commercial Sources',
            'view_commercial_source',
            'View eligible Accepted Quotation, Accepted Quotation Revision and Accepted Variation source lines and their available commercial quantities for a Work Order.'
        )
) as v(
    permission_code,
    permission_name,
    action_code,
    description
)
where not exists (
    select 1
    from public.app_permissions p
    where p.permission_code = v.permission_code
);

-- Hosted Admin baseline = TRUE for all nine Work Order permissions.
update public.app_role_permissions arp
set is_allowed = true
from public.app_roles ar,
     public.app_permissions ap
where ar.role_code = 'admin'
  and ap.permission_code in (
      'work_orders.allocate_commercial_scope',
      'work_orders.assign_worker',
      'work_orders.cancel',
      'work_orders.create',
      'work_orders.reassign_worker',
      'work_orders.release_commercial_scope',
      'work_orders.update',
      'work_orders.view',
      'work_orders.view_commercial_source'
  )
  and arp.role_id = ar.role_id
  and arp.permission_id = ap.permission_id;

insert into public.app_role_permissions (
    role_id,
    permission_id,
    is_allowed
)
select
    ar.role_id,
    ap.permission_id,
    true
from public.app_roles ar
cross join public.app_permissions ap
where ar.role_code = 'admin'
  and ap.permission_code in (
      'work_orders.allocate_commercial_scope',
      'work_orders.assign_worker',
      'work_orders.cancel',
      'work_orders.create',
      'work_orders.reassign_worker',
      'work_orders.release_commercial_scope',
      'work_orders.update',
      'work_orders.view',
      'work_orders.view_commercial_source'
  )
  and not exists (
      select 1
      from public.app_role_permissions arp
      where arp.role_id = ar.role_id
        and arp.permission_id = ap.permission_id
  );


-- ============================================================================
-- 08. HOSTED-AUTHORITATIVE FUNCTION DEFINITIONS
-- ============================================================================

CREATE OR REPLACE FUNCTION public.preview_work_order_commercial_sources(p_project_id uuid, p_site_id uuid, p_area_id uuid DEFAULT NULL::uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
declare
    v_user_id uuid := auth.uid();

    v_project public.projects%rowtype;
    v_site public.project_sites%rowtype;

    v_lines jsonb := '[]'::jsonb;
begin
    -- ========================================================
    -- 1. Authentication / Permission
    -- ========================================================

    if v_user_id is null then
        raise exception 'Authentication is required.';
    end if;

    if not public.has_permission('work_orders.view_commercial_source') then
        raise exception
            'Permission denied: work_orders.view_commercial_source is required.';
    end if;


    -- ========================================================
    -- 2. Project
    -- ========================================================

    select p.*
    into v_project
    from public.projects p
    where p.project_id = p_project_id
      and p.is_deleted = false;

    if not found then
        raise exception
            'Project % was not found.',
            p_project_id;
    end if;


    -- ========================================================
    -- 3. Site
    -- ========================================================

    select ps.*
    into v_site
    from public.project_sites ps
    where ps.site_id = p_site_id
      and ps.project_id = p_project_id
      and ps.is_deleted = false;

    if not found then
        raise exception
            'Site % does not belong to Project % or was not found.',
            p_site_id,
            p_project_id;
    end if;


    -- ========================================================
    -- 4. COMMERCIAL SOURCE LINES
    -- ========================================================

    with source_lines as (

        -- ====================================================
        -- A. ACCEPTED BASE QUOTATION
        --
        -- Use base quotation only when quotation was accepted
        -- from the base version, not through a revision.
        -- ====================================================

        select
            'AcceptedQuotation'::text
                as source_type,

            q.quotation_id
                as source_header_id,

            q.quotation_no
                as source_document_no,

            null::integer
                as source_revision_no,

            ql.quotation_line_id
                as source_line_id,

            ql.line_uid
                as source_line_uid,

            ql.line_no
                as source_line_no,

            ql.product_id,
            ql.project_area_id,

            ql.description,

            ql.quantity
                as source_quantity,

            ql.sales_uom_code
                as source_uom_code,

            ql.base_uom_code
                as source_base_uom_code,

            ql.conversion_factor
                as source_conversion_factor,

            ql.base_quantity
                as source_base_quantity,

            ql.allow_fractional_quantity,

            ql.is_optional,

            ql.billing_method

        from public.quotations q

        join public.project_sites ps
          on ps.site_id = q.project_site_id
         and ps.is_deleted = false

        join public.quotation_lines ql
          on ql.quotation_id = q.quotation_id
         and ql.is_deleted = false

        where q.quotation_status = 'Accepted'
          and q.accepted_revision_id is null
          and q.is_deleted = false
          and q.is_active = true

          and ps.project_id = p_project_id
          and ps.site_id = p_site_id

          and ql.is_optional = false

          and (
              p_area_id is null
              or ql.project_area_id = p_area_id
          )


        union all


        -- ====================================================
        -- B. ACCEPTED QUOTATION REVISION
        -- ====================================================

        select
            'AcceptedRevision'::text
                as source_type,

            qr.revision_id
                as source_header_id,

            q.quotation_no
                as source_document_no,

            qr.revision_no
                as source_revision_no,

            qrl.revision_line_id
                as source_line_id,

            qrl.line_uid
                as source_line_uid,

            qrl.line_no
                as source_line_no,

            qrl.product_id,
            qrl.project_area_id,

            qrl.description,

            qrl.quantity
                as source_quantity,

            qrl.sales_uom_code
                as source_uom_code,

            qrl.base_uom_code
                as source_base_uom_code,

            qrl.conversion_factor
                as source_conversion_factor,

            qrl.base_quantity
                as source_base_quantity,

            qrl.allow_fractional_quantity,

            qrl.is_optional,

            qrl.billing_method

        from public.quotations q

        join public.quotation_revisions qr
          on qr.revision_id = q.accepted_revision_id
         and qr.quotation_id = q.quotation_id
         and qr.is_deleted = false
         and qr.is_active = true

        join public.project_sites ps
          on ps.site_id = qr.project_site_id
         and ps.is_deleted = false

        join public.quotation_revision_lines qrl
          on qrl.revision_id = qr.revision_id
         and qrl.is_deleted = false

        where q.quotation_status = 'Accepted'
          and q.accepted_revision_id is not null
          and q.is_deleted = false
          and q.is_active = true

          and qr.revision_status = 'Accepted'

          and ps.project_id = p_project_id
          and ps.site_id = p_site_id

          and qrl.is_optional = false

          and (
              p_area_id is null
              or qrl.project_area_id = p_area_id
          )


        union all


        -- ====================================================
        -- C. ACCEPTED VARIATION
        -- ====================================================

        select
            'AcceptedVariation'::text
                as source_type,

            v.variation_id
                as source_header_id,

            v.variation_no
                as source_document_no,

            null::integer
                as source_revision_no,

            vl.variation_line_id
                as source_line_id,

            null::uuid
                as source_line_uid,

            vl.line_no
                as source_line_no,

            vl.product_id,
            vl.project_area_id,

            vl.description,

            vl.quantity
                as source_quantity,

            vl.sales_uom_code
                as source_uom_code,

            vl.base_uom_code
                as source_base_uom_code,

            vl.conversion_factor
                as source_conversion_factor,

            vl.base_quantity
                as source_base_quantity,

            vl.allow_fractional_quantity,

            vl.is_optional,

            null::text
                as billing_method

        from public.variations v

        join public.variation_lines vl
          on vl.variation_id = v.variation_id
         and vl.is_deleted = false
         and vl.is_active = true

        where v.variation_status = 'Accepted'
          and v.project_id = p_project_id
          and v.project_site_id = p_site_id
          and v.is_deleted = false
          and v.is_active = true

          and vl.is_optional = false

          and (
              p_area_id is null
              or vl.project_area_id = p_area_id
          )
    ),

    calculated as (
        select
            sl.*,

            p.product_code,
            p.product_name,
            p.product_type,

            coalesce(a.allocated_quantity, 0)
                as allocated_quantity,

            coalesce(a.allocated_base_quantity, 0)
                as allocated_base_quantity,

            greatest(
                coalesce(sl.source_quantity, 0)
                - coalesce(a.allocated_quantity, 0),
                0
            )
                as available_quantity,

            greatest(
                coalesce(sl.source_base_quantity, 0)
                - coalesce(a.allocated_base_quantity, 0),
                0
            )
                as available_base_quantity

        from source_lines sl

        left join public.products p
          on p.product_id = sl.product_id
         and p.is_deleted = false

        left join lateral (
            select
                coalesce(
                    sum(
                        greatest(
                            woa.allocated_quantity
                            - woa.released_quantity,
                            0
                        )
                    ),
                    0
                )
                    as allocated_quantity,

                coalesce(
                    sum(
                        greatest(
                            woa.allocated_base_quantity
                            - woa.released_base_quantity,
                            0
                        )
                    ),
                    0
                )
                    as allocated_base_quantity

            from public.work_order_commercial_allocations woa

            where woa.is_deleted = false
              and woa.is_active = true

              and (
                  (
                      sl.source_type = 'AcceptedQuotation'
                      and woa.source_type = 'AcceptedQuotation'
                      and woa.source_quotation_line_id =
                          sl.source_line_id
                  )
                  or
                  (
                      sl.source_type = 'AcceptedRevision'
                      and woa.source_type = 'AcceptedRevision'
                      and woa.source_revision_line_id =
                          sl.source_line_id
                  )
                  or
                  (
                      sl.source_type = 'AcceptedVariation'
                      and woa.source_type = 'AcceptedVariation'
                      and woa.source_variation_line_id =
                          sl.source_line_id
                  )
              )
        ) a on true
    )

    select coalesce(
        jsonb_agg(
            jsonb_build_object(
                'source_type',
                    c.source_type,

                'source_header_id',
                    c.source_header_id,

                'source_document_no',
                    c.source_document_no,

                'source_revision_no',
                    c.source_revision_no,

                'source_line_id',
                    c.source_line_id,

                'source_line_uid',
                    c.source_line_uid,

                'source_line_no',
                    c.source_line_no,

                'product_id',
                    c.product_id,

                'product_code',
                    c.product_code,

                'product_name',
                    c.product_name,

                'product_type',
                    c.product_type,

                'project_area_id',
                    c.project_area_id,

                'description',
                    c.description,

                'billing_method',
                    c.billing_method,

                'source_quantity',
                    c.source_quantity,

                'source_uom_code',
                    c.source_uom_code,

                'source_base_quantity',
                    c.source_base_quantity,

                'source_base_uom_code',
                    c.source_base_uom_code,

                'source_conversion_factor',
                    c.source_conversion_factor,

                'allow_fractional_quantity',
                    c.allow_fractional_quantity,

                'allocated_quantity',
                    c.allocated_quantity,

                'allocated_base_quantity',
                    c.allocated_base_quantity,

                'available_quantity',
                    c.available_quantity,

                'available_base_quantity',
                    c.available_base_quantity,

                'is_fully_allocated',
                    c.available_base_quantity <= 0
            )

            order by
                c.source_document_no,
                c.source_revision_no nulls first,
                c.source_line_no
        ),
        '[]'::jsonb
    )
    into v_lines
    from calculated c;


    -- ========================================================
    -- 5. RESULT
    -- ========================================================

    return jsonb_build_object(
        'project_id',
            p_project_id,

        'site_id',
            p_site_id,

        'area_id',
            p_area_id,

        'source_count',
            jsonb_array_length(v_lines),

        'lines',
            v_lines
    );
end;
$function$;


CREATE OR REPLACE FUNCTION public.allocate_work_order_commercial_scope(p_work_order_id uuid, p_source_type text, p_source_line_id uuid, p_allocated_quantity numeric, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$

declare
    v_user_id uuid := auth.uid();

    v_work_order public.work_orders%rowtype;

    v_customer_id uuid;

    -- --------------------------------------------------------
    -- Accepted source snapshot
    -- --------------------------------------------------------

    v_source_quantity numeric;
    v_source_uom_code text;

    v_source_base_quantity numeric;
    v_source_base_uom_code text;

    v_source_conversion_factor numeric;
    v_allow_fractional_quantity boolean;

    v_product_id uuid;
    v_project_area_id uuid;
    v_source_line_uid uuid;

    -- --------------------------------------------------------
    -- Source reference columns
    -- --------------------------------------------------------

    v_quotation_id uuid;
    v_source_quotation_line_id uuid;

    v_accepted_revision_id uuid;
    v_source_revision_line_id uuid;

    v_variation_id uuid;
    v_source_variation_line_id uuid;

    -- --------------------------------------------------------
    -- Allocation calculation
    -- --------------------------------------------------------

    v_net_allocated_quantity numeric := 0;
    v_net_allocated_base_quantity numeric := 0;

    v_available_quantity numeric := 0;
    v_available_base_quantity numeric := 0;

    v_requested_base_quantity numeric := 0;

    v_existing_same_work_order integer := 0;

    v_allocation_id uuid;

begin

    -- ========================================================
    -- 01. AUTHENTICATION
    -- ========================================================

    if v_user_id is null then
        raise exception
            'Authentication is required.';
    end if;


    -- ========================================================
    -- 02. PERMISSION
    -- ========================================================

    if not public.has_permission(
        'work_orders.allocate_commercial_scope'
    ) then
        raise exception
            'Permission denied: work_orders.allocate_commercial_scope is required.';
    end if;


    -- ========================================================
    -- 03. INPUT VALIDATION
    -- ========================================================

    if p_work_order_id is null then
        raise exception
            'Work Order is required.';
    end if;


    if p_source_line_id is null then
        raise exception
            'Commercial Source Line is required.';
    end if;


    if p_source_type is null
       or p_source_type not in (
            'AcceptedQuotation',
            'AcceptedRevision',
            'AcceptedVariation'
       )
    then
        raise exception
            'Invalid Commercial Source Type: %.',
            coalesce(p_source_type, '<NULL>');
    end if;


    if p_allocated_quantity is null
       or p_allocated_quantity <= 0
    then
        raise exception
            'Allocated Quantity must be greater than zero.';
    end if;


    -- ========================================================
    -- 04. LOCK WORK ORDER
    -- ========================================================

    select wo.*
    into v_work_order
    from public.work_orders wo
    where wo.work_order_id = p_work_order_id
      and wo.is_deleted = false
    for update;


    if not found then
        raise exception
            'Work Order % was not found.',
            p_work_order_id;
    end if;


    -- ========================================================
    -- 05. WORK ORDER MUST BE COMMERCIAL
    -- ========================================================

    if v_work_order.commercial_mode <> 'CommercialSource' then
        raise exception
            'Work Order % is not a Commercial Source Work Order.',
            v_work_order.work_order_no;
    end if;


    if v_work_order.status = 'Cancelled' then
        raise exception
            'Commercial allocation cannot be added to cancelled Work Order %.',
            v_work_order.work_order_no;
    end if;


    -- Commercial allocation is Area-specific.
    if v_work_order.area_id is null then
        raise exception
            'Commercial Source Work Order % requires an Area.',
            v_work_order.work_order_no;
    end if;


    -- ========================================================
    -- 06. VALIDATE PROJECT / SITE / AREA HIERARCHY
    -- ========================================================

    select p.customer_id
    into v_customer_id
    from public.projects p
    where p.project_id = v_work_order.project_id
      and p.is_deleted = false;


    if not found then
        raise exception
            'Project % was not found.',
            v_work_order.project_id;
    end if;


    if not exists (
        select 1
        from public.project_sites ps
        where ps.site_id = v_work_order.site_id
          and ps.project_id = v_work_order.project_id
          and ps.is_deleted = false
    ) then
        raise exception
            'Work Order Site does not belong to its Project.';
    end if;


    if not exists (
        select 1
        from public.project_areas pa
        where pa.area_id = v_work_order.area_id
          and pa.project_id = v_work_order.project_id
          and pa.site_id = v_work_order.site_id
          and pa.is_deleted = false
    ) then
        raise exception
            'Work Order Area does not belong to its Project and Site.';
    end if;


    -- ========================================================
    -- 07A. ACCEPTED QUOTATION
    --
    -- IMPORTANT:
    -- Lock physical quotation line.
    --
    -- Base quotation is valid only when the accepted quotation
    -- did NOT come from a revision.
    -- ========================================================

    if p_source_type = 'AcceptedQuotation' then

        select
            q.quotation_id,

            ql.quotation_line_id,
            ql.line_uid,

            ql.product_id,
            ql.project_area_id,

            ql.quantity,
            ql.sales_uom_code,

            ql.base_quantity,
            ql.base_uom_code,

            ql.conversion_factor,
            ql.allow_fractional_quantity

        into
            v_quotation_id,

            v_source_quotation_line_id,
            v_source_line_uid,

            v_product_id,
            v_project_area_id,

            v_source_quantity,
            v_source_uom_code,

            v_source_base_quantity,
            v_source_base_uom_code,

            v_source_conversion_factor,
            v_allow_fractional_quantity

        from public.quotation_lines ql

        join public.quotations q
          on q.quotation_id = ql.quotation_id

        where ql.quotation_line_id = p_source_line_id

          and ql.is_deleted = false
          and ql.is_optional = false

          and q.quotation_status = 'Accepted'
          and q.accepted_revision_id is null
          and q.is_active = true
          and q.is_deleted = false

          and q.customer_id = v_customer_id

          and q.project_site_id =
              v_work_order.site_id

        for update of ql;


        if not found then
            raise exception
                'Accepted Quotation source line % is invalid, unavailable, or does not match the Work Order Customer/Site.',
                p_source_line_id;
        end if;


    -- ========================================================
    -- 07B. ACCEPTED REVISION
    -- ========================================================

    elsif p_source_type = 'AcceptedRevision' then

        select
            qr.revision_id,

            qrl.revision_line_id,
            qrl.line_uid,

            qrl.product_id,
            qrl.project_area_id,

            qrl.quantity,
            qrl.sales_uom_code,

            qrl.base_quantity,
            qrl.base_uom_code,

            qrl.conversion_factor,
            qrl.allow_fractional_quantity

        into
            v_accepted_revision_id,

            v_source_revision_line_id,
            v_source_line_uid,

            v_product_id,
            v_project_area_id,

            v_source_quantity,
            v_source_uom_code,

            v_source_base_quantity,
            v_source_base_uom_code,

            v_source_conversion_factor,
            v_allow_fractional_quantity

        from public.quotation_revision_lines qrl

        join public.quotation_revisions qr
          on qr.revision_id = qrl.revision_id

        join public.quotations q
          on q.quotation_id = qr.quotation_id

        where qrl.revision_line_id = p_source_line_id

          and qrl.is_deleted = false
          and qrl.is_optional = false

          and qr.revision_status = 'Accepted'
          and qr.is_active = true
          and qr.is_deleted = false

          and q.quotation_status = 'Accepted'
          and q.accepted_revision_id =
              qr.revision_id
          and q.is_active = true
          and q.is_deleted = false

          and qr.customer_id =
              v_customer_id

          and qr.project_site_id =
              v_work_order.site_id

        for update of qrl;


        if not found then
            raise exception
                'Accepted Revision source line % is invalid, unavailable, or does not match the Work Order Customer/Site.',
                p_source_line_id;
        end if;


    -- ========================================================
    -- 07C. ACCEPTED VARIATION
    -- ========================================================

    elsif p_source_type = 'AcceptedVariation' then

        select
            v.variation_id,

            vl.variation_line_id,

            vl.product_id,
            vl.project_area_id,

            vl.quantity,
            vl.sales_uom_code,

            vl.base_quantity,
            vl.base_uom_code,

            vl.conversion_factor,
            vl.allow_fractional_quantity

        into
            v_variation_id,

            v_source_variation_line_id,

            v_product_id,
            v_project_area_id,

            v_source_quantity,
            v_source_uom_code,

            v_source_base_quantity,
            v_source_base_uom_code,

            v_source_conversion_factor,
            v_allow_fractional_quantity

        from public.variation_lines vl

        join public.variations v
          on v.variation_id = vl.variation_id

        where vl.variation_line_id = p_source_line_id

          and vl.is_active = true
          and vl.is_deleted = false
          and vl.is_optional = false

          and v.variation_status = 'Accepted'
          and v.is_active = true
          and v.is_deleted = false

          and v.customer_id =
              v_customer_id

          and v.project_id =
              v_work_order.project_id

          and v.project_site_id =
              v_work_order.site_id

        for update of vl;


        if not found then
            raise exception
                'Accepted Variation source line % is invalid, unavailable, or does not match the Work Order Customer/Project/Site.',
                p_source_line_id;
        end if;

    end if;


    -- ========================================================
    -- 08. AREA MUST MATCH EXACTLY
    -- ========================================================

    if v_project_area_id is null then
        raise exception
            'Commercial Source Line % does not have a Project Area.',
            p_source_line_id;
    end if;


    if v_project_area_id <>
       v_work_order.area_id then
        raise exception
            'Commercial Source Area does not match Work Order Area.';
    end if;


    -- Also validate that source area itself belongs to the
    -- selected Work Order Project/Site.

    if not exists (
        select 1
        from public.project_areas pa
        where pa.area_id = v_project_area_id
          and pa.project_id =
              v_work_order.project_id
          and pa.site_id =
              v_work_order.site_id
          and pa.is_deleted = false
    ) then
        raise exception
            'Commercial Source Area does not belong to the Work Order Project/Site.';
    end if;


    -- ========================================================
    -- 09. SOURCE SNAPSHOT VALIDATION
    -- ========================================================

    if v_source_quantity is null
       or v_source_quantity <= 0
    then
        raise exception
            'Commercial Source Quantity must be greater than zero.';
    end if;


    if v_source_base_quantity is null
       or v_source_base_quantity <= 0
    then
        raise exception
            'Commercial Source Base Quantity must be greater than zero.';
    end if;


    if v_source_uom_code is null then
        raise exception
            'Commercial Source UOM is missing.';
    end if;


    if v_source_base_uom_code is null then
        raise exception
            'Commercial Source Base UOM is missing.';
    end if;


    -- ========================================================
    -- 10. FRACTIONAL QUANTITY
    -- ========================================================

    if coalesce(
           v_allow_fractional_quantity,
           false
       ) = false
       and p_allocated_quantity <>
           trunc(p_allocated_quantity)
    then
        raise exception
            'Commercial Source UOM % does not allow fractional quantities.',
            v_source_uom_code;
    end if;


    -- ========================================================
    -- 11. REQUESTED BASE QUANTITY
    --
    -- Use immutable Accepted Snapshot ratio.
    --
    -- Example:
    -- Source 100 sqm = 100 base sqm
    -- Allocate 25 sqm
    -- Requested Base = 25 sqm
    --
    -- Example:
    -- Source 5 roll = 100 base sqm
    -- Allocate 2 roll
    -- Requested Base = 40 sqm
    -- ========================================================

    v_requested_base_quantity :=
        p_allocated_quantity
        * v_source_base_quantity
        / v_source_quantity;


    if v_requested_base_quantity <= 0 then
        raise exception
            'Calculated Allocated Base Quantity must be greater than zero.';
    end if;


    -- ========================================================
    -- 12. SAME WORK ORDER / SAME SOURCE DUPLICATE
    --
    -- Existing unique indexes already enforce this at DB level.
    -- This check provides a clearer application error.
    -- ========================================================

    select count(*)
    into v_existing_same_work_order

    from public.work_order_commercial_allocations a

    where a.work_order_id =
            p_work_order_id

      and a.source_type =
            p_source_type

      and a.is_active = true
      and a.is_deleted = false

      and (
            (
                p_source_type =
                    'AcceptedQuotation'

                and a.source_quotation_line_id =
                    p_source_line_id
            )
            or
            (
                p_source_type =
                    'AcceptedRevision'

                and a.source_revision_line_id =
                    p_source_line_id
            )
            or
            (
                p_source_type =
                    'AcceptedVariation'

                and a.source_variation_line_id =
                    p_source_line_id
            )
      );


    if v_existing_same_work_order > 0 then
        raise exception
            'This Commercial Source Line is already allocated to Work Order %.',
            v_work_order.work_order_no;
    end if;


    -- ========================================================
    -- 13. RECALCULATE CURRENT GLOBAL ALLOCATION
    --
    -- IMPORTANT:
    -- Source physical row is already locked FOR UPDATE.
    --
    -- Every caller of this RPC for the same source line must
    -- wait for the current transaction before calculating
    -- availability.
    -- ========================================================

    select
        coalesce(
            sum(
                greatest(
                    a.allocated_quantity
                    - a.released_quantity,
                    0
                )
            ),
            0
        ),

        coalesce(
            sum(
                greatest(
                    a.allocated_base_quantity
                    - a.released_base_quantity,
                    0
                )
            ),
            0
        )

    into
        v_net_allocated_quantity,
        v_net_allocated_base_quantity

    from public.work_order_commercial_allocations a

    where a.source_type =
            p_source_type

      and a.is_active = true
      and a.is_deleted = false

      and (
            (
                p_source_type =
                    'AcceptedQuotation'

                and a.source_quotation_line_id =
                    p_source_line_id
            )
            or
            (
                p_source_type =
                    'AcceptedRevision'

                and a.source_revision_line_id =
                    p_source_line_id
            )
            or
            (
                p_source_type =
                    'AcceptedVariation'

                and a.source_variation_line_id =
                    p_source_line_id
            )
      );


    -- ========================================================
    -- 14. AVAILABLE QUANTITIES
    -- ========================================================

    v_available_quantity :=
        v_source_quantity
        - v_net_allocated_quantity;


    v_available_base_quantity :=
        v_source_base_quantity
        - v_net_allocated_base_quantity;


    -- Do not hide corrupted historical state.
    -- A negative result means allocations already exceed source.

    if v_available_base_quantity < 0 then
        raise exception
            'Commercial Source is already over-allocated in Base Quantity. Source Base: %, Net Allocated Base: %.',
            v_source_base_quantity,
            v_net_allocated_base_quantity;
    end if;


    -- ========================================================
    -- 15. COMMERCIAL QUANTITY LIMIT
    -- ========================================================

    if p_allocated_quantity >
       v_available_quantity then

        raise exception
            'Allocated Quantity exceeds available Commercial Source Quantity. Requested: % %, Available: % %.',
            p_allocated_quantity,
            v_source_uom_code,
            v_available_quantity,
            v_source_uom_code;
    end if;


    -- ========================================================
    -- 16. BASE QUANTITY AUTHORITY
    -- ========================================================

    if v_requested_base_quantity >
       v_available_base_quantity then

        raise exception
            'Allocated Base Quantity exceeds available Commercial Source Base Quantity. Requested Base: % %, Available Base: % %.',
            v_requested_base_quantity,
            v_source_base_uom_code,
            v_available_base_quantity,
            v_source_base_uom_code;
    end if;


    -- ========================================================
    -- 17. INSERT IMMUTABLE COMMERCIAL SNAPSHOT
    -- ========================================================

    insert into public.work_order_commercial_allocations (
        work_order_id,

        source_type,

        quotation_id,
        source_quotation_line_id,

        accepted_revision_id,
        source_revision_line_id,

        variation_id,
        source_variation_line_id,

        source_line_uid,

        product_id,
        project_area_id,

        source_uom_code,
        source_quantity,

        source_base_uom_code,
        source_conversion_factor,
        source_base_quantity,

        allocated_quantity,
        allocated_base_quantity,

        allocation_status,

        released_quantity,
        released_base_quantity,

        notes,

        is_active,
        is_deleted,

        created_by,
        updated_by
    )
    values (
        p_work_order_id,

        p_source_type,

        v_quotation_id,
        v_source_quotation_line_id,

        v_accepted_revision_id,
        v_source_revision_line_id,

        v_variation_id,
        v_source_variation_line_id,

        v_source_line_uid,

        v_product_id,
        v_project_area_id,

        v_source_uom_code,
        v_source_quantity,

        v_source_base_uom_code,
        v_source_conversion_factor,
        v_source_base_quantity,

        p_allocated_quantity,
        v_requested_base_quantity,

        'Active',

        0,
        0,

        nullif(trim(p_notes), ''),

        true,
        false,

        v_user_id,
        v_user_id
    )

    returning
        work_order_commercial_allocation_id
    into
        v_allocation_id;


    -- ========================================================
    -- 18. RESULT
    -- ========================================================

    return jsonb_build_object(

        'work_order_commercial_allocation_id',
            v_allocation_id,

        'work_order_id',
            p_work_order_id,

        'work_order_no',
            v_work_order.work_order_no,

        'source_type',
            p_source_type,

        'source_line_id',
            p_source_line_id,

        'source_line_uid',
            v_source_line_uid,

        'product_id',
            v_product_id,

        'project_area_id',
            v_project_area_id,

        'source_quantity',
            v_source_quantity,

        'source_uom_code',
            v_source_uom_code,

        'source_base_quantity',
            v_source_base_quantity,

        'source_base_uom_code',
            v_source_base_uom_code,

        'allocated_quantity',
            p_allocated_quantity,

        'allocated_base_quantity',
            v_requested_base_quantity,

        'remaining_quantity',
            v_available_quantity
            - p_allocated_quantity,

        'remaining_base_quantity',
            v_available_base_quantity
            - v_requested_base_quantity,

        'allocation_status',
            'Active'
    );

end;

$function$;


CREATE OR REPLACE FUNCTION public.release_work_order_commercial_scope(p_work_order_commercial_allocation_id uuid, p_release_quantity numeric, p_reason text, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$

declare

    -- ========================================================
    -- AUTH
    -- ========================================================

    v_user_id uuid := auth.uid();


    -- ========================================================
    -- ROW SNAPSHOTS
    -- ========================================================

    v_allocation
        public.work_order_commercial_allocations%rowtype;

    v_work_order
        public.work_orders%rowtype;


    -- ========================================================
    -- RELEASE HISTORY
    -- ========================================================

    v_release_history_id uuid;


    -- ========================================================
    -- QUANTITIES
    -- ========================================================

    v_release_base_quantity numeric;

    v_previous_released_quantity numeric;
    v_previous_released_base_quantity numeric;

    v_remaining_quantity_before numeric;
    v_remaining_base_quantity_before numeric;

    v_new_released_quantity numeric;
    v_new_released_base_quantity numeric;

    v_remaining_quantity_after numeric;
    v_remaining_base_quantity_after numeric;


    -- ========================================================
    -- FINAL STATE
    -- ========================================================

    v_new_status text;
    v_new_is_active boolean;

begin

    -- ========================================================
    -- 01. AUTHENTICATION
    -- ========================================================

    if v_user_id is null then
        raise exception
            'Authentication is required.';
    end if;


    -- ========================================================
    -- 02. PERMISSION
    -- ========================================================

    if not public.has_permission(
        'work_orders.release_commercial_scope'
    ) then

        raise exception
            'Permission denied: work_orders.release_commercial_scope is required.';

    end if;


    -- ========================================================
    -- 03. REQUIRED INPUTS
    -- ========================================================

    if p_work_order_commercial_allocation_id is null then

        raise exception
            'Commercial Allocation is required.';

    end if;


    if p_release_quantity is null
       or p_release_quantity <= 0
    then

        raise exception
            'Release Quantity must be greater than zero.';

    end if;


    if nullif(trim(p_reason), '') is null then

        raise exception
            'Release Reason is required.';

    end if;


    -- ========================================================
    -- 04. INITIAL ALLOCATION LOOKUP
    --
    -- Read identity first.
    --
    -- We need:
    --   Work Order
    --   Source Type
    --   Physical Source Line
    --
    -- before following the deterministic locking order.
    -- ========================================================

    select
        a.*

    into
        v_allocation

    from public.work_order_commercial_allocations a

    where
        a.work_order_commercial_allocation_id =
            p_work_order_commercial_allocation_id

        and a.is_deleted = false;


    if not found then

        raise exception
            'Commercial Allocation % was not found.',
            p_work_order_commercial_allocation_id;

    end if;


    -- ========================================================
    -- 05. LOCK WORK ORDER
    --
    -- Lock order:
    --
    -- Work Order
    --    ↓
    -- Commercial Source Line
    --    ↓
    -- Allocation
    --
    -- This remains compatible with allocation-side locking.
    -- ========================================================

    select
        wo.*

    into
        v_work_order

    from public.work_orders wo

    where
        wo.work_order_id =
            v_allocation.work_order_id

        and wo.is_deleted = false

    for update;


    if not found then

        raise exception
            'Work Order for Commercial Allocation % was not found.',
            p_work_order_commercial_allocation_id;

    end if;


    -- ========================================================
    -- 06. WORK ORDER MODE
    -- ========================================================

    if v_work_order.commercial_mode <>
       'CommercialSource'
    then

        raise exception
            'Work Order % is not a Commercial Source Work Order.',
            v_work_order.work_order_no;

    end if;


    -- ========================================================
    -- 07. LOCK PHYSICAL COMMERCIAL SOURCE LINE
    --
    -- Do NOT use source_line_uid as universal authority.
    --
    -- AcceptedQuotation
    --   -> quotation_line_id
    --
    -- AcceptedRevision
    --   -> revision_line_id
    --
    -- AcceptedVariation
    --   -> variation_line_id
    --
    -- Variation has no universal line_uid.
    -- ========================================================

    if v_allocation.source_type =
       'AcceptedQuotation'
    then

        if v_allocation.source_quotation_line_id is null then

            raise exception
                'Commercial Allocation has no Quotation source line.';

        end if;


        perform 1

        from public.quotation_lines ql

        where
            ql.quotation_line_id =
                v_allocation.source_quotation_line_id

        for update;


        if not found then

            raise exception
                'Quotation source line % was not found.',
                v_allocation.source_quotation_line_id;

        end if;


    elsif v_allocation.source_type =
          'AcceptedRevision'
    then

        if v_allocation.source_revision_line_id is null then

            raise exception
                'Commercial Allocation has no Revision source line.';

        end if;


        perform 1

        from public.quotation_revision_lines qrl

        where
            qrl.revision_line_id =
                v_allocation.source_revision_line_id

        for update;


        if not found then

            raise exception
                'Revision source line % was not found.',
                v_allocation.source_revision_line_id;

        end if;


    elsif v_allocation.source_type =
          'AcceptedVariation'
    then

        if v_allocation.source_variation_line_id is null then

            raise exception
                'Commercial Allocation has no Variation source line.';

        end if;


        perform 1

        from public.variation_lines vl

        where
            vl.variation_line_id =
                v_allocation.source_variation_line_id

        for update;


        if not found then

            raise exception
                'Variation source line % was not found.',
                v_allocation.source_variation_line_id;

        end if;


    else

        raise exception
            'Unsupported Commercial Source Type: %.',
            v_allocation.source_type;

    end if;


    -- ========================================================
    -- 08. LOCK + RE-READ ALLOCATION
    --
    -- Critical:
    -- another Release transaction could have changed
    -- released_quantity after our first identity lookup.
    --
    -- Therefore re-read under FOR UPDATE.
    -- ========================================================

    select
        a.*

    into
        v_allocation

    from public.work_order_commercial_allocations a

    where
        a.work_order_commercial_allocation_id =
            p_work_order_commercial_allocation_id

        and a.is_deleted = false

    for update;


    if not found then

        raise exception
            'Commercial Allocation % is no longer available.',
            p_work_order_commercial_allocation_id;

    end if;


    -- ========================================================
    -- 09. VALIDATE SOURCE IDENTITY DID NOT CHANGE
    --
    -- Source references are expected to be immutable.
    -- The following validation also protects against malformed
    -- historical data.
    -- ========================================================

    if v_allocation.source_type =
       'AcceptedQuotation'
       and v_allocation.source_quotation_line_id is null
    then

        raise exception
            'Commercial Allocation has an invalid AcceptedQuotation source reference.';


    elsif v_allocation.source_type =
          'AcceptedRevision'
          and v_allocation.source_revision_line_id is null
    then

        raise exception
            'Commercial Allocation has an invalid AcceptedRevision source reference.';


    elsif v_allocation.source_type =
          'AcceptedVariation'
          and v_allocation.source_variation_line_id is null
    then

        raise exception
            'Commercial Allocation has an invalid AcceptedVariation source reference.';

    end if;


    -- ========================================================
    -- 10. CURRENT RELEASE TOTALS
    -- ========================================================

    v_previous_released_quantity :=
        v_allocation.released_quantity;


    v_previous_released_base_quantity :=
        v_allocation.released_base_quantity;


    v_remaining_quantity_before :=
        v_allocation.allocated_quantity
        - v_previous_released_quantity;


    v_remaining_base_quantity_before :=
        v_allocation.allocated_base_quantity
        - v_previous_released_base_quantity;


    -- ========================================================
    -- 11. ALREADY FULLY RELEASED
    -- ========================================================

    if v_remaining_quantity_before <= 0
       or v_remaining_base_quantity_before <= 0
    then

        raise exception
            'Commercial Allocation % has already been fully released.',
            p_work_order_commercial_allocation_id;

    end if;


    -- ========================================================
    -- 12. RELEASE QUANTITY LIMIT
    -- ========================================================

    if p_release_quantity >
       v_remaining_quantity_before
    then

        raise exception
            'Release Quantity exceeds remaining allocated quantity. Requested: % %, Remaining: % %.',
            p_release_quantity,
            v_allocation.source_uom_code,
            v_remaining_quantity_before,
            v_allocation.source_uom_code;

    end if;


    -- ========================================================
    -- 13. BASE QUANTITY CALCULATION
    --
    -- Base Quantity remains authority.
    --
    -- Do NOT use current Product Master conversion.
    --
    -- Use immutable Allocation snapshot ratio:
    --
    -- release base
    -- =
    -- release quantity
    -- × allocated base quantity
    -- ÷ allocated quantity
    --
    -- Example:
    --
    -- Allocation:
    --   2 roll = 40 sqm
    --
    -- Release:
    --   1 roll
    --
    -- Result:
    --   20 sqm base
    -- ========================================================

    v_release_base_quantity :=
        p_release_quantity
        * v_allocation.allocated_base_quantity
        / v_allocation.allocated_quantity;


    if v_release_base_quantity <= 0 then

        raise exception
            'Calculated Release Base Quantity must be greater than zero.';

    end if;


    -- ========================================================
    -- 14. BASE QUANTITY LIMIT
    -- ========================================================

    if v_release_base_quantity >
       v_remaining_base_quantity_before
    then

        raise exception
            'Release Base Quantity exceeds remaining allocated Base Quantity. Requested Base: % %, Remaining Base: % %.',
            v_release_base_quantity,
            v_allocation.source_base_uom_code,
            v_remaining_base_quantity_before,
            v_allocation.source_base_uom_code;

    end if;


    -- ========================================================
    -- 15. NEW RELEASE TOTALS
    -- ========================================================

    v_new_released_quantity :=
        v_previous_released_quantity
        + p_release_quantity;


    v_new_released_base_quantity :=
        v_previous_released_base_quantity
        + v_release_base_quantity;


    v_remaining_quantity_after :=
        v_allocation.allocated_quantity
        - v_new_released_quantity;


    v_remaining_base_quantity_after :=
        v_allocation.allocated_base_quantity
        - v_new_released_base_quantity;


    -- ========================================================
    -- 16. NUMERIC SAFETY
    --
    -- Protect against unexpected negative residuals.
    -- ========================================================

    if v_remaining_quantity_after < 0 then

        raise exception
            'Release calculation produced a negative remaining quantity.';

    end if;


    if v_remaining_base_quantity_after < 0 then

        raise exception
            'Release calculation produced a negative remaining Base Quantity.';

    end if;


    -- ========================================================
    -- 17. ALLOCATION STATUS
    --
    -- Full release:
    --   Released
    --   is_active = false
    --
    -- Partial:
    --   Partially Released
    --   is_active = true
    --
    -- Historical allocation row is never deleted.
    -- ========================================================

    if v_remaining_quantity_after = 0
       and v_remaining_base_quantity_after = 0
    then

        v_new_status :=
            'Released';

        v_new_is_active :=
            false;

    else

        v_new_status :=
            'Partially Released';

        v_new_is_active :=
            true;

    end if;


    -- ========================================================
    -- 18. UPDATE ALLOCATION SUMMARY
    --
    -- Allocation keeps cumulative release totals.
    --
    -- Detailed reason/audit belongs in the append-only
    -- release history table.
    -- ========================================================

    update public.work_order_commercial_allocations

    set
        released_quantity =
            v_new_released_quantity,

        released_base_quantity =
            v_new_released_base_quantity,

        allocation_status =
            v_new_status,

        is_active =
            v_new_is_active,

        updated_by =
            v_user_id,

        updated_at =
            now()

    where
        work_order_commercial_allocation_id =
            p_work_order_commercial_allocation_id;


    -- ========================================================
    -- 19. APPEND STRUCTURED RELEASE HISTORY
    --
    -- One release operation = one immutable history row.
    -- ========================================================

    insert into
    public.work_order_commercial_allocation_release_history (

        work_order_commercial_allocation_id,
        work_order_id,

        source_type,

        source_quotation_line_id,
        source_revision_line_id,
        source_variation_line_id,

        source_uom_code,
        source_base_uom_code,

        released_now_quantity,
        released_now_base_quantity,

        previous_released_quantity,
        previous_released_base_quantity,

        new_released_quantity,
        new_released_base_quantity,

        reason,
        notes,

        created_by
    )

    values (

        v_allocation.work_order_commercial_allocation_id,
        v_allocation.work_order_id,

        v_allocation.source_type,

        v_allocation.source_quotation_line_id,
        v_allocation.source_revision_line_id,
        v_allocation.source_variation_line_id,

        v_allocation.source_uom_code,
        v_allocation.source_base_uom_code,

        p_release_quantity,
        v_release_base_quantity,

        v_previous_released_quantity,
        v_previous_released_base_quantity,

        v_new_released_quantity,
        v_new_released_base_quantity,

        trim(p_reason),
        nullif(trim(p_notes), ''),

        v_user_id
    )

    returning
        work_order_commercial_allocation_release_history_id

    into
        v_release_history_id;


    -- ========================================================
    -- 20. RETURN RESULT
    -- ========================================================

    return jsonb_build_object(

        'work_order_commercial_allocation_release_history_id',
            v_release_history_id,

        'work_order_commercial_allocation_id',
            v_allocation.work_order_commercial_allocation_id,

        'work_order_id',
            v_work_order.work_order_id,

        'work_order_no',
            v_work_order.work_order_no,

        'source_type',
            v_allocation.source_type,

        'source_uom_code',
            v_allocation.source_uom_code,

        'source_base_uom_code',
            v_allocation.source_base_uom_code,

        'allocated_quantity',
            v_allocation.allocated_quantity,

        'allocated_base_quantity',
            v_allocation.allocated_base_quantity,

        'previous_released_quantity',
            v_previous_released_quantity,

        'previous_released_base_quantity',
            v_previous_released_base_quantity,

        'released_now_quantity',
            p_release_quantity,

        'released_now_base_quantity',
            v_release_base_quantity,

        'released_quantity',
            v_new_released_quantity,

        'released_base_quantity',
            v_new_released_base_quantity,

        'remaining_allocated_quantity',
            v_remaining_quantity_after,

        'remaining_allocated_base_quantity',
            v_remaining_base_quantity_after,

        'release_reason',
            trim(p_reason),

        'release_notes',
            nullif(trim(p_notes), ''),

        'allocation_status',
            v_new_status,

        'is_active',
            v_new_is_active

    );

end;

$function$;


CREATE OR REPLACE FUNCTION public.get_work_assignment_quantity_status(p_work_assignment_id uuid)
 RETURNS jsonb
 LANGUAGE plpgsql
 STABLE SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$

declare
    v_user_id uuid := auth.uid();

    v_assignment public.work_assignments%rowtype;

    v_reassigned_out_quantity numeric := 0;
    v_reassigned_out_base_quantity numeric := 0;

    v_quantityless_reassignment_count integer := 0;

    v_reported_quantity numeric := 0;
    v_pending_review_quantity numeric := 0;
    v_approved_quantity numeric := 0;

    v_assignment_base_factor numeric;

    v_reported_base_quantity numeric := 0;
    v_pending_review_base_quantity numeric := 0;
    v_approved_base_quantity numeric := 0;

    v_effective_assigned_quantity numeric;
    v_effective_assigned_base_quantity numeric;

    v_raw_available_quantity numeric;
    v_raw_available_base_quantity numeric;

    v_available_quantity numeric;
    v_available_base_quantity numeric;

    v_other_reported_quantity numeric := 0;

    v_quantity_integrity_ok boolean := true;

begin

    -- ========================================================
    -- 01. AUTHENTICATION
    -- ========================================================

    if v_user_id is null then
        raise exception
            'Authentication is required.';
    end if;


    -- ========================================================
    -- 02. PERMISSION
    -- ========================================================

    if not public.has_permission('work_orders.view')
       and not public.is_project_role()
    then
        raise exception
            'Permission denied: Work Order view permission is required.';
    end if;


    -- ========================================================
    -- 03. INPUT
    -- ========================================================

    if p_work_assignment_id is null then
        raise exception
            'Work Assignment is required.';
    end if;


    -- ========================================================
    -- 04. ASSIGNMENT
    -- ========================================================

    select wa.*
    into v_assignment
    from public.work_assignments wa
    where wa.work_assignment_id = p_work_assignment_id
      and wa.is_deleted = false;


    if not found then
        raise exception
            'Work Assignment % was not found.',
            p_work_assignment_id;
    end if;


    -- ========================================================
    -- 05. LEGACY / NON-QUANTITY ASSIGNMENT
    -- ========================================================

    if v_assignment.assigned_quantity is null
       or v_assignment.assigned_uom_code is null
       or v_assignment.assigned_base_quantity is null
       or v_assignment.assigned_base_uom_code is null
    then

        return jsonb_build_object(

            'work_assignment_id',
                v_assignment.work_assignment_id,

            'work_order_id',
                v_assignment.work_order_id,

            'employee_id',
                v_assignment.employee_id,

            'assignment_status',
                v_assignment.assignment_status,

            'quantity_tracking_configured',
                false,

            'assigned_quantity',
                null,

            'assigned_uom_code',
                null,

            'assigned_base_quantity',
                null,

            'assigned_base_uom_code',
                null,

            'reassigned_out_quantity',
                null,

            'reassigned_out_base_quantity',
                null,

            'effective_assigned_quantity',
                null,

            'effective_assigned_base_quantity',
                null,

            'reported_quantity',
                null,

            'reported_base_quantity',
                null,

            'pending_review_quantity',
                null,

            'pending_review_base_quantity',
                null,

            'approved_quantity',
                null,

            'approved_base_quantity',
                null,

            'available_to_reassign_quantity',
                null,

            'available_to_reassign_base_quantity',
                null,

            'quantity_integrity_ok',
                true,

            'message',
                'This Work Assignment was created without quantity tracking.'
        );

    end if;


    -- ========================================================
    -- 06. BASE FACTOR
    -- ========================================================

    if v_assignment.assigned_quantity <= 0
       or v_assignment.assigned_base_quantity <= 0
    then
        raise exception
            'Work Assignment % has invalid Assigned Quantity.',
            p_work_assignment_id;
    end if;


    v_assignment_base_factor :=
        v_assignment.assigned_base_quantity
        / v_assignment.assigned_quantity;


    -- ========================================================
    -- 07. REASSIGNMENT OUT
    -- ========================================================

    select
        coalesce(sum(h.reassigned_quantity), 0),

        coalesce(sum(h.reassigned_base_quantity), 0),

        count(*) filter (
            where h.reassigned_quantity is null
               or h.reassigned_base_quantity is null
        )

    into
        v_reassigned_out_quantity,
        v_reassigned_out_base_quantity,
        v_quantityless_reassignment_count

    from public.work_assignment_reassignment_history h

    where h.from_work_assignment_id =
          p_work_assignment_id;


    if v_quantityless_reassignment_count > 0 then
        raise exception
            'Work Assignment % has % historical reassignment record(s) without quantity.',
            p_work_assignment_id,
            v_quantityless_reassignment_count;
    end if;


    -- ========================================================
    -- 08. EFFECTIVE ASSIGNMENT
    -- ========================================================

    v_effective_assigned_quantity :=
        v_assignment.assigned_quantity
        - v_reassigned_out_quantity;


    v_effective_assigned_base_quantity :=
        v_assignment.assigned_base_quantity
        - v_reassigned_out_base_quantity;


    if v_effective_assigned_quantity < 0
       or v_effective_assigned_base_quantity < 0
    then
        raise exception
            'Work Assignment % is over-reassigned.',
            p_work_assignment_id;
    end if;


    -- ========================================================
    -- 09. WORKER PROGRESS
    -- ========================================================

    select
        coalesce(
            sum(
                greatest(
                    coalesce(drw.completed_quantity, 0),
                    0
                )
            ),
            0
        ),

        coalesce(
            sum(
                greatest(
                    coalesce(drw.completed_quantity, 0),
                    0
                )
            )
            filter (
                where dr.approval_status in (
                    'Submitted',
                    'Ready for Inspection'
                )
            ),
            0
        ),

        coalesce(
            sum(
                greatest(
                    coalesce(drw.completed_quantity, 0),
                    0
                )
            )
            filter (
                where dr.approval_status = 'Approved'
            ),
            0
        )

    into
        v_reported_quantity,
        v_pending_review_quantity,
        v_approved_quantity

    from public.daily_report_workers drw

    join public.daily_reports dr
      on dr.report_id = drw.report_id

    where drw.work_assignment_id =
              p_work_assignment_id

      and dr.is_deleted = false

      and (
            v_assignment.work_order_id is null
            or dr.work_order_id =
               v_assignment.work_order_id
      );


    -- ========================================================
    -- 10. OTHER REPORTED
    -- ========================================================

    v_other_reported_quantity :=
        greatest(
            v_reported_quantity
            - v_pending_review_quantity
            - v_approved_quantity,
            0
        );


    -- ========================================================
    -- 11. BASE QUANTITIES
    -- ========================================================

    v_reported_base_quantity :=
        v_reported_quantity
        * v_assignment_base_factor;


    v_pending_review_base_quantity :=
        v_pending_review_quantity
        * v_assignment_base_factor;


    v_approved_base_quantity :=
        v_approved_quantity
        * v_assignment_base_factor;


    -- ========================================================
    -- 12. AVAILABLE TO REASSIGN
    -- ========================================================

    v_raw_available_quantity :=
        v_effective_assigned_quantity
        - v_approved_quantity
        - v_pending_review_quantity;


    v_raw_available_base_quantity :=
        v_effective_assigned_base_quantity
        - v_approved_base_quantity
        - v_pending_review_base_quantity;


    if v_raw_available_quantity < 0
       or v_raw_available_base_quantity < 0
    then
        v_quantity_integrity_ok := false;
    end if;


    v_available_quantity :=
        greatest(v_raw_available_quantity, 0);


    v_available_base_quantity :=
        greatest(v_raw_available_base_quantity, 0);


    -- ========================================================
    -- 13. RESULT
    -- ========================================================

    return jsonb_build_object(

        'work_assignment_id',
            v_assignment.work_assignment_id,

        'work_order_id',
            v_assignment.work_order_id,

        'employee_id',
            v_assignment.employee_id,

        'project_id',
            v_assignment.project_id,

        'site_id',
            v_assignment.site_id,

        'area_id',
            v_assignment.area_id,

        'assignment_status',
            v_assignment.assignment_status,

        'reassigned_from_work_assignment_id',
            v_assignment.reassigned_from_work_assignment_id,

        'quantity_tracking_configured',
            true,

        'assigned_quantity',
            v_assignment.assigned_quantity,

        'assigned_uom_code',
            v_assignment.assigned_uom_code,

        'assigned_base_quantity',
            v_assignment.assigned_base_quantity,

        'assigned_base_uom_code',
            v_assignment.assigned_base_uom_code,

        'assignment_base_factor',
            v_assignment_base_factor,

        'reassigned_out_quantity',
            v_reassigned_out_quantity,

        'reassigned_out_base_quantity',
            v_reassigned_out_base_quantity,

        'effective_assigned_quantity',
            v_effective_assigned_quantity,

        'effective_assigned_base_quantity',
            v_effective_assigned_base_quantity,

        'reported_quantity',
            v_reported_quantity,

        'reported_base_quantity',
            v_reported_base_quantity,

        'pending_review_quantity',
            v_pending_review_quantity,

        'pending_review_base_quantity',
            v_pending_review_base_quantity,

        'approved_quantity',
            v_approved_quantity,

        'approved_base_quantity',
            v_approved_base_quantity,

        'other_reported_quantity',
            v_other_reported_quantity,

        'available_to_reassign_quantity',
            v_available_quantity,

        'available_to_reassign_base_quantity',
            v_available_base_quantity,

        'raw_available_to_reassign_quantity',
            v_raw_available_quantity,

        'raw_available_to_reassign_base_quantity',
            v_raw_available_base_quantity,

        'quantity_integrity_ok',
            v_quantity_integrity_ok

    );

end;

$function$;


CREATE OR REPLACE FUNCTION public.assign_work_order_worker(p_work_order_id uuid, p_employee_id uuid, p_assigned_quantity numeric, p_assigned_uom_code text, p_activity_type_id uuid DEFAULT NULL::uuid, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$

declare

    -- ========================================================
    -- AUTH
    -- ========================================================

    v_user_id uuid := auth.uid();


    -- ========================================================
    -- WORK ORDER
    -- ========================================================

    v_work_order public.work_orders%rowtype;


    -- ========================================================
    -- ASSIGNMENT
    -- ========================================================

    v_work_assignment_id uuid;

    v_assigned_base_quantity numeric;
    v_assigned_base_uom_code text;


    -- ========================================================
    -- COMMERCIAL CAPACITY
    -- ========================================================

    v_commercial_base_uom_code text;

    v_commercial_base_uom_count integer := 0;

    v_commercial_allocated_base_quantity numeric := 0;

    v_current_worker_base_quantity numeric := 0;

    v_available_worker_base_quantity numeric := 0;


    -- ========================================================
    -- DUPLICATE
    -- ========================================================

    v_existing_active_assignment_count integer := 0;

begin

    -- ========================================================
    -- 01. AUTHENTICATION
    -- ========================================================

    if v_user_id is null then

        raise exception
            'Authentication is required.';

    end if;


    -- ========================================================
    -- 02. PERMISSION
    -- ========================================================

    if not public.has_permission(
        'work_orders.assign_worker'
    ) then

        raise exception
            'Permission denied: work_orders.assign_worker is required.';

    end if;


    -- ========================================================
    -- 03. INPUT VALIDATION
    -- ========================================================

    if p_work_order_id is null then

        raise exception
            'Work Order is required.';

    end if;


    if p_employee_id is null then

        raise exception
            'Employee is required.';

    end if;


    if p_assigned_quantity is null
       or p_assigned_quantity <= 0
    then

        raise exception
            'Assigned Quantity must be greater than zero.';

    end if;


    if nullif(trim(p_assigned_uom_code), '') is null then

        raise exception
            'Assigned UOM is required.';

    end if;


    -- ========================================================
    -- 04. LOCK WORK ORDER
    -- ========================================================

    select
        wo.*

    into
        v_work_order

    from public.work_orders wo

    where
        wo.work_order_id =
            p_work_order_id

        and wo.is_deleted = false

    for update;


    if not found then

        raise exception
            'Work Order % was not found.',
            p_work_order_id;

    end if;


    -- ========================================================
    -- 05. WORK ORDER STATUS
    -- ========================================================

    if v_work_order.status in (
        'Completed',
        'Cancelled'
    ) then

        raise exception
            'Worker cannot be assigned to Work Order % because its status is %.',
            v_work_order.work_order_no,
            v_work_order.status;

    end if;


    -- ========================================================
    -- 06. WORK ORDER HIERARCHY
    -- ========================================================

    if not exists (
        select 1
        from public.projects p
        where p.project_id =
              v_work_order.project_id
          and p.is_deleted = false
    ) then

        raise exception
            'Work Order Project was not found.';

    end if;


    if not exists (
        select 1
        from public.project_sites ps
        where ps.site_id =
              v_work_order.site_id
          and ps.project_id =
              v_work_order.project_id
          and ps.is_deleted = false
    ) then

        raise exception
            'Work Order Site does not belong to its Project.';

    end if;


    if v_work_order.area_id is not null
       and not exists (
            select 1
            from public.project_areas pa
            where pa.area_id =
                  v_work_order.area_id
              and pa.project_id =
                  v_work_order.project_id
              and pa.site_id =
                  v_work_order.site_id
              and pa.is_deleted = false
       )
    then

        raise exception
            'Work Order Area does not belong to its Project/Site.';

    end if;


    -- ========================================================
    -- 07. EMPLOYEE
    --
    -- Do not guess employment/status columns.
    -- FK authority + existence is sufficient here.
    -- ========================================================

    if not exists (
        select 1
        from public.employees e
        where e.employee_id =
              p_employee_id
    ) then

        raise exception
            'Employee % was not found.',
            p_employee_id;

    end if;


    -- ========================================================
    -- 08. UOM
    -- ========================================================

    if not exists (
        select 1
        from public.units_of_measure u
        where u.uom_code =
              trim(p_assigned_uom_code)
    ) then

        raise exception
            'Assigned UOM % was not found.',
            trim(p_assigned_uom_code);

    end if;


    -- ========================================================
    -- 09. ACTIVITY TYPE
    -- ========================================================

    if p_activity_type_id is not null
       and not exists (
            select 1
            from public.work_activity_types wat
            where wat.activity_type_id =
                  p_activity_type_id
       )
    then

        raise exception
            'Work Activity Type % was not found.',
            p_activity_type_id;

    end if;


    -- ========================================================
    -- 10. DUPLICATE ACTIVE WORKER ASSIGNMENT
    --
    -- Preserve the important behaviour of legacy
    -- create_work_assignment():
    --
    -- same employee
    -- + same Work Order
    -- + still active
    -- = reject
    -- ========================================================

    select count(*)
    into v_existing_active_assignment_count

    from public.work_assignments wa

    where
        wa.employee_id =
            p_employee_id

        and wa.work_order_id =
            p_work_order_id

        and wa.is_deleted = false

        and wa.assignment_status =
            'Active'

        and wa.ended_at is null;


    if v_existing_active_assignment_count > 0 then

        raise exception
            'This worker is already actively assigned to this Work Order.';

    end if;


    -- ========================================================
    -- 11A. COMMERCIAL SOURCE WORK ORDER
    -- ========================================================

    if v_work_order.commercial_mode =
       'CommercialSource'
    then

        -- ----------------------------------------------------
        -- Active Commercial Allocation is required.
        -- ----------------------------------------------------

        if not exists (
            select 1
            from public.work_order_commercial_allocations a
            where a.work_order_id =
                  p_work_order_id
              and a.is_active = true
              and a.is_deleted = false
              and (
                    a.allocated_base_quantity
                    - a.released_base_quantity
                  ) > 0
        )
        then

            raise exception
                'Commercial Source Work Order % has no available Commercial Allocation.',
                v_work_order.work_order_no;

        end if;


        -- ----------------------------------------------------
        -- Count distinct Commercial Base UOMs.
        --
        -- Worker Assignment has one quantity dimension.
        -- We cannot combine sqm + kg + each into one number.
        -- ----------------------------------------------------

        select
            count(
                distinct a.source_base_uom_code
            )

        into
            v_commercial_base_uom_count

        from public.work_order_commercial_allocations a

        where
            a.work_order_id =
                p_work_order_id

            and a.is_active = true
            and a.is_deleted = false

            and (
                a.allocated_base_quantity
                - a.released_base_quantity
            ) > 0;


        if v_commercial_base_uom_count <> 1 then

            raise exception
                'Commercial Work Order % has multiple active Base UOM dimensions. Worker Quantity Assignment requires exactly one Base UOM.',
                v_work_order.work_order_no;

        end if;


        -- ----------------------------------------------------
        -- Commercial Base UOM
        -- ----------------------------------------------------

        select
            min(a.source_base_uom_code)

        into
            v_commercial_base_uom_code

        from public.work_order_commercial_allocations a

        where
            a.work_order_id =
                p_work_order_id

            and a.is_active = true
            and a.is_deleted = false

            and (
                a.allocated_base_quantity
                - a.released_base_quantity
            ) > 0;


        -- ----------------------------------------------------
        -- Assignment is intentionally in Commercial Base UOM.
        -- ----------------------------------------------------

        if trim(p_assigned_uom_code) <>
           v_commercial_base_uom_code
        then

            raise exception
                'Commercial Work Order Worker Assignment must use Commercial Base UOM %. Requested UOM: %.',
                v_commercial_base_uom_code,
                trim(p_assigned_uom_code);

        end if;


        v_assigned_base_uom_code :=
            v_commercial_base_uom_code;


        v_assigned_base_quantity :=
            p_assigned_quantity;


        -- ----------------------------------------------------
        -- Net Commercial Allocation
        -- ----------------------------------------------------

        select
            coalesce(
                sum(
                    greatest(
                        a.allocated_base_quantity
                        - a.released_base_quantity,
                        0
                    )
                ),
                0
            )

        into
            v_commercial_allocated_base_quantity

        from public.work_order_commercial_allocations a

        where
            a.work_order_id =
                p_work_order_id

            and a.is_active = true
            and a.is_deleted = false

            and a.source_base_uom_code =
                v_commercial_base_uom_code;


        -- ----------------------------------------------------
        -- Current Effective Worker Assignment
        --
        -- Original Assignment
        -- minus Reassigned Out
        --
        -- We deliberately do NOT simply sum Active children,
        -- because reassignment creates a new child Assignment
        -- while preserving the parent's original snapshot.
        -- ----------------------------------------------------

        select
            coalesce(
                sum(
                    greatest(
                        wa.assigned_base_quantity
                        -
                        coalesce(
                            (
                                select
                                    sum(
                                        h.reassigned_base_quantity
                                    )

                                from
                                    public.work_assignment_reassignment_history h

                                where
                                    h.from_work_assignment_id =
                                        wa.work_assignment_id
                            ),
                            0
                        ),
                        0
                    )
                ),
                0
            )

        into
            v_current_worker_base_quantity

        from public.work_assignments wa

        where
            wa.work_order_id =
                p_work_order_id

            and wa.is_deleted = false

            and wa.assigned_base_quantity
                is not null

            and wa.assigned_base_uom_code =
                v_commercial_base_uom_code;


        v_available_worker_base_quantity :=
            v_commercial_allocated_base_quantity
            - v_current_worker_base_quantity;


        -- ----------------------------------------------------
        -- Corrupt existing state protection
        -- ----------------------------------------------------

        if v_available_worker_base_quantity < 0 then

            raise exception
                'Work Order % Worker Assignments already exceed Commercial Allocation. Commercial Base: %, Worker Base: %.',
                v_work_order.work_order_no,
                v_commercial_allocated_base_quantity,
                v_current_worker_base_quantity;

        end if;


        -- ----------------------------------------------------
        -- Capacity limit
        -- ----------------------------------------------------

        if v_assigned_base_quantity >
           v_available_worker_base_quantity
        then

            raise exception
                'Assigned Quantity exceeds remaining Commercial Work Order capacity. Requested: % %, Available: % %.',
                v_assigned_base_quantity,
                v_assigned_base_uom_code,
                v_available_worker_base_quantity,
                v_assigned_base_uom_code;

        end if;


    -- ========================================================
    -- 11B. OPERATIONAL / MANUAL WORK ORDER
    -- ========================================================

    elsif v_work_order.commercial_mode =
          'OperationalManual'
    then

        -- No Commercial/Product conversion authority exists.
        --
        -- Therefore selected operational UOM is itself
        -- the Base UOM.

        v_assigned_base_uom_code :=
            trim(p_assigned_uom_code);


        v_assigned_base_quantity :=
            p_assigned_quantity;


        v_commercial_allocated_base_quantity :=
            null;


        v_current_worker_base_quantity :=
            null;


        v_available_worker_base_quantity :=
            null;


    else

        raise exception
            'Unsupported Work Order Commercial Mode: %.',
            v_work_order.commercial_mode;

    end if;


    -- ========================================================
    -- 12. INSERT QUANTITY-TRACKED ASSIGNMENT
    --
    -- This is an INITIAL assignment.
    --
    -- reassigned_from_work_assignment_id remains NULL.
    -- Reassignment RPC will create child Assignments later.
    -- ========================================================

    insert into public.work_assignments (

        employee_id,

        project_id,
        site_id,
        area_id,

        work_order_id,

        assigned_date,
        assigned_at,

        activity_type_id,

        assigned_quantity,
        assigned_uom_code,

        assigned_base_quantity,
        assigned_base_uom_code,

        assignment_status,

        reassigned_from_work_assignment_id,

        notes,

        is_deleted,

        created_by,
        updated_by
    )

    values (

        p_employee_id,

        v_work_order.project_id,
        v_work_order.site_id,
        v_work_order.area_id,

        v_work_order.work_order_id,

        current_date,
        now(),

        p_activity_type_id,

        p_assigned_quantity,
        trim(p_assigned_uom_code),

        v_assigned_base_quantity,
        v_assigned_base_uom_code,

        'Active',

        null,

        nullif(trim(p_notes), ''),

        false,

        v_user_id,
        v_user_id
    )

    returning
        work_assignment_id

    into
        v_work_assignment_id;


    -- ========================================================
    -- 13. RESULT
    -- ========================================================

    return jsonb_build_object(

        'work_assignment_id',
            v_work_assignment_id,

        'work_order_id',
            v_work_order.work_order_id,

        'work_order_no',
            v_work_order.work_order_no,

        'employee_id',
            p_employee_id,

        'commercial_mode',
            v_work_order.commercial_mode,

        'assigned_quantity',
            p_assigned_quantity,

        'assigned_uom_code',
            trim(p_assigned_uom_code),

        'assigned_base_quantity',
            v_assigned_base_quantity,

        'assigned_base_uom_code',
            v_assigned_base_uom_code,

        'assignment_status',
            'Active',

        'commercial_allocated_base_quantity',
            v_commercial_allocated_base_quantity,

        'worker_base_quantity_before',
            v_current_worker_base_quantity,

        'worker_base_quantity_after',
            case
                when
                    v_current_worker_base_quantity
                    is null
                then
                    null

                else
                    v_current_worker_base_quantity
                    + v_assigned_base_quantity
            end,

        'commercial_capacity_remaining',
            case
                when
                    v_available_worker_base_quantity
                    is null
                then
                    null

                else
                    v_available_worker_base_quantity
                    - v_assigned_base_quantity
            end,

        'quantity_status',
            public.get_work_assignment_quantity_status(
                v_work_assignment_id
            )

    );

end;

$function$;


CREATE OR REPLACE FUNCTION public.reassign_work_order_worker(p_from_work_assignment_id uuid, p_to_employee_id uuid, p_reassigned_quantity numeric, p_reason text, p_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$

declare

    -- ========================================================
    -- AUTH
    -- ========================================================

    v_user_id uuid := auth.uid();


    -- ========================================================
    -- SOURCE
    -- ========================================================

    v_source public.work_assignments%rowtype;

    v_source_work_order_id uuid;


    -- ========================================================
    -- WORK ORDER
    -- ========================================================

    v_work_order public.work_orders%rowtype;


    -- ========================================================
    -- QUANTITY STATUS
    -- ========================================================

    v_before_status jsonb;
    v_after_status jsonb;
    v_target_status jsonb;

    v_available_quantity numeric;
    v_available_base_quantity numeric;

    v_pending_review_quantity numeric;

    v_after_available_quantity numeric;
    v_after_pending_review_quantity numeric;


    -- ========================================================
    -- QUANTITY CONVERSION
    -- ========================================================

    v_base_factor numeric;

    v_reassigned_base_quantity numeric;


    -- ========================================================
    -- TARGET
    -- ========================================================

    v_to_work_assignment_id uuid;


    -- ========================================================
    -- HISTORY
    -- ========================================================

    v_reassignment_id uuid;


    -- ========================================================
    -- SOURCE STATUS
    -- ========================================================

    v_source_final_status text;

begin

    -- ========================================================
    -- 01. AUTHENTICATION
    -- ========================================================

    if v_user_id is null then

        raise exception
            'Authentication is required.';

    end if;


    -- ========================================================
    -- 02. PERMISSION
    -- ========================================================

    if not public.has_permission(
        'work_orders.reassign_worker'
    ) then

        raise exception
            'Permission denied: work_orders.reassign_worker is required.';

    end if;


    -- ========================================================
    -- 03. INPUT
    -- ========================================================

    if p_from_work_assignment_id is null then

        raise exception
            'Source Work Assignment is required.';

    end if;


    if p_to_employee_id is null then

        raise exception
            'Destination Employee is required.';

    end if;


    if p_reassigned_quantity is null
       or p_reassigned_quantity <= 0
    then

        raise exception
            'Reassigned Quantity must be greater than zero.';

    end if;


    if nullif(trim(p_reason), '') is null then

        raise exception
            'Reassignment Reason is required.';

    end if;


    -- ========================================================
    -- 04. RESOLVE SOURCE WORK ORDER
    --
    -- Read first only to establish lock order:
    --
    -- Work Order
    --   -> Source Assignment
    --
    -- Same order used by operational Work Order writes.
    -- ========================================================

    select
        wa.work_order_id

    into
        v_source_work_order_id

    from public.work_assignments wa

    where
        wa.work_assignment_id =
            p_from_work_assignment_id

        and wa.is_deleted = false;


    if not found then

        raise exception
            'Source Work Assignment % was not found.',
            p_from_work_assignment_id;

    end if;


    if v_source_work_order_id is null then

        raise exception
            'Source Work Assignment % is not linked to a Work Order.',
            p_from_work_assignment_id;

    end if;


    -- ========================================================
    -- 05. LOCK WORK ORDER
    -- ========================================================

    select
        wo.*

    into
        v_work_order

    from public.work_orders wo

    where
        wo.work_order_id =
            v_source_work_order_id

        and wo.is_deleted = false

    for update;


    if not found then

        raise exception
            'Work Order for Source Assignment was not found.';

    end if;


    -- ========================================================
    -- 06. LOCK SOURCE ASSIGNMENT
    -- ========================================================

    select
        wa.*

    into
        v_source

    from public.work_assignments wa

    where
        wa.work_assignment_id =
            p_from_work_assignment_id

        and wa.work_order_id =
            v_work_order.work_order_id

        and wa.is_deleted = false

    for update;


    if not found then

        raise exception
            'Source Work Assignment changed or is no longer available.';

    end if;


    -- ========================================================
    -- 07. WORK ORDER STATUS
    -- ========================================================

    if v_work_order.status in (
        'Completed',
        'Cancelled'
    ) then

        raise exception
            'Worker cannot be reassigned on Work Order % because its status is %.',
            v_work_order.work_order_no,
            v_work_order.status;

    end if;


    -- ========================================================
    -- 08. SOURCE ASSIGNMENT STATUS
    -- ========================================================

    if v_source.assignment_status <> 'Active' then

        raise exception
            'Source Work Assignment must be Active. Current status: %.',
            v_source.assignment_status;

    end if;


    -- ========================================================
    -- 09. QUANTITY TRACKING
    -- ========================================================

    if v_source.assigned_quantity is null
       or v_source.assigned_uom_code is null
       or v_source.assigned_base_quantity is null
       or v_source.assigned_base_uom_code is null
    then

        raise exception
            'Source Work Assignment does not use Quantity Tracking.';

    end if;


    if v_source.assigned_quantity <= 0
       or v_source.assigned_base_quantity <= 0
    then

        raise exception
            'Source Work Assignment has invalid Quantity data.';

    end if;


    -- ========================================================
    -- 10. TARGET EMPLOYEE
    -- ========================================================

    if not exists (
        select 1
        from public.employees e
        where e.employee_id =
              p_to_employee_id
    ) then

        raise exception
            'Destination Employee % was not found.',
            p_to_employee_id;

    end if;


    if p_to_employee_id =
       v_source.employee_id
    then

        raise exception
            'Source Worker and Destination Worker must be different.';

    end if;


    -- ========================================================
    -- 11. DESTINATION DUPLICATE PROTECTION
    --
    -- One open Assignment per Worker per Work Order.
    --
    -- Use ended_at as well as current Assignment structure
    -- so legacy create_work_assignment() remains compatible.
    -- ========================================================

    if exists (
        select 1

        from public.work_assignments wa

        where
            wa.employee_id =
                p_to_employee_id

            and wa.work_order_id =
                v_work_order.work_order_id

            and wa.is_deleted = false

            and wa.ended_at is null
    )
    then

        raise exception
            'Destination Worker already has an open Assignment on this Work Order.';

    end if;


    -- ========================================================
    -- 12. CALCULATION AUTHORITY — BEFORE
    -- ========================================================

    v_before_status :=
        public.get_work_assignment_quantity_status(
            p_from_work_assignment_id
        );


    if coalesce(
        (v_before_status ->> 'quantity_tracking_configured')::boolean,
        false
    ) = false
    then

        raise exception
            'Source Work Assignment does not have Quantity Tracking configured.';

    end if;


    if coalesce(
        (v_before_status ->> 'quantity_integrity_ok')::boolean,
        false
    ) = false
    then

        raise exception
            'Source Work Assignment has invalid Quantity integrity and cannot be reassigned.';

    end if;


    v_available_quantity :=
        (v_before_status
            ->> 'available_to_reassign_quantity')::numeric;


    v_available_base_quantity :=
        (v_before_status
            ->> 'available_to_reassign_base_quantity')::numeric;


    v_pending_review_quantity :=
        (v_before_status
            ->> 'pending_review_quantity')::numeric;


    -- ========================================================
    -- 13. AVAILABLE QUANTITY
    -- ========================================================

    if v_available_quantity <= 0 then

        raise exception
            'Source Work Assignment has no Quantity available to reassign.';

    end if;


    if p_reassigned_quantity >
       v_available_quantity
    then

        raise exception
            'Reassigned Quantity exceeds Available to Reassign. Requested: % %, Available: % %.',
            p_reassigned_quantity,
            v_source.assigned_uom_code,
            v_available_quantity,
            v_source.assigned_uom_code;

    end if;


    -- ========================================================
    -- 14. IMMUTABLE SOURCE BASE FACTOR
    --
    -- Do NOT use current Product/UOM master.
    --
    -- Assignment snapshot is authority.
    -- ========================================================

    v_base_factor :=
        v_source.assigned_base_quantity
        / v_source.assigned_quantity;


    v_reassigned_base_quantity :=
        p_reassigned_quantity
        * v_base_factor;


    -- Secondary Base-Quantity protection.
    if v_reassigned_base_quantity >
       v_available_base_quantity
    then

        raise exception
            'Reassigned Base Quantity exceeds Available Base Quantity. Requested: % %, Available: % %.',
            v_reassigned_base_quantity,
            v_source.assigned_base_uom_code,
            v_available_base_quantity,
            v_source.assigned_base_uom_code;

    end if;


    -- ========================================================
    -- 15. CREATE TARGET ASSIGNMENT
    --
    -- Target inherits:
    --
    -- Project
    -- Site
    -- Area
    -- Work Order
    -- Activity Type
    -- Assigned UOM
    -- Base UOM
    -- Base conversion snapshot
    --
    -- It does NOT create additional Commercial Allocation.
    -- ========================================================

    insert into public.work_assignments (

        employee_id,

        project_id,
        site_id,
        area_id,

        work_order_id,

        assigned_date,
        assigned_at,

        activity_type_id,

        assigned_quantity,
        assigned_uom_code,

        assigned_base_quantity,
        assigned_base_uom_code,

        assignment_status,

        reassigned_from_work_assignment_id,

        notes,

        is_deleted,

        created_by,
        updated_by
    )

    values (

        p_to_employee_id,

        v_source.project_id,
        v_source.site_id,
        v_source.area_id,

        v_source.work_order_id,

        current_date,
        now(),

        v_source.activity_type_id,

        p_reassigned_quantity,
        v_source.assigned_uom_code,

        v_reassigned_base_quantity,
        v_source.assigned_base_uom_code,

        'Active',

        v_source.work_assignment_id,

        nullif(trim(p_notes), ''),

        false,

        v_user_id,
        v_user_id
    )

    returning
        work_assignment_id

    into
        v_to_work_assignment_id;


    -- ========================================================
    -- 16. APPEND REASSIGNMENT HISTORY
    --
    -- This history row is what reduces Source Effective
    -- Assignment.
    --
    -- Source assigned_quantity itself remains unchanged.
    -- ========================================================

    insert into
        public.work_assignment_reassignment_history (

            work_order_id,

            from_work_assignment_id,
            to_work_assignment_id,

            reassigned_quantity,
            reassigned_uom_code,
            reassigned_base_quantity,

            reason,
            notes,

            created_by
        )

    values (

        v_source.work_order_id,

        v_source.work_assignment_id,
        v_to_work_assignment_id,

        p_reassigned_quantity,
        v_source.assigned_uom_code,
        v_reassigned_base_quantity,

        trim(p_reason),
        nullif(trim(p_notes), ''),

        v_user_id
    )

    returning
        work_assignment_reassignment_id

    into
        v_reassignment_id;


    -- ========================================================
    -- 17. SOURCE STATUS — AFTER TRANSFER
    -- ========================================================

    v_after_status :=
        public.get_work_assignment_quantity_status(
            v_source.work_assignment_id
        );


    v_after_available_quantity :=
        (v_after_status
            ->> 'available_to_reassign_quantity')::numeric;


    v_after_pending_review_quantity :=
        (v_after_status
            ->> 'pending_review_quantity')::numeric;


    -- --------------------------------------------------------
    -- Reassigned:
    --
    -- No transferable quantity remains
    -- AND
    -- no Pending Review exists.
    --
    -- Approved historical progress may remain attached to the
    -- Source Assignment and is intentionally preserved.
    --
    -- If Pending Review remains, keep Active because rejected
    -- progress may become assignable again.
    -- --------------------------------------------------------

    if v_after_available_quantity = 0
       and v_after_pending_review_quantity = 0
    then

        update public.work_assignments

        set
            assignment_status = 'Reassigned',

            unassigned_date = current_date,

            ended_date = current_date,

            ended_at = now(),

            ended_reason =
                'Remaining assignable quantity reassigned',

            updated_at = now(),

            updated_by = v_user_id

        where
            work_assignment_id =
                v_source.work_assignment_id;


        v_source_final_status :=
            'Reassigned';

    else

        v_source_final_status :=
            'Active';

    end if;


    -- ========================================================
    -- 18. REFRESH SOURCE STATUS RESULT
    -- ========================================================

    v_after_status :=
        public.get_work_assignment_quantity_status(
            v_source.work_assignment_id
        );


    -- ========================================================
    -- 19. TARGET STATUS
    -- ========================================================

    v_target_status :=
        public.get_work_assignment_quantity_status(
            v_to_work_assignment_id
        );


    -- ========================================================
    -- 20. RESULT
    -- ========================================================

    return jsonb_build_object(

        'work_assignment_reassignment_id',
            v_reassignment_id,

        'work_order_id',
            v_source.work_order_id,

        'work_order_no',
            v_work_order.work_order_no,


        -- ----------------------------------------------------
        -- Source
        -- ----------------------------------------------------

        'from_work_assignment_id',
            v_source.work_assignment_id,

        'from_employee_id',
            v_source.employee_id,

        'source_assignment_status',
            v_source_final_status,


        -- ----------------------------------------------------
        -- Destination
        -- ----------------------------------------------------

        'to_work_assignment_id',
            v_to_work_assignment_id,

        'to_employee_id',
            p_to_employee_id,


        -- ----------------------------------------------------
        -- Quantity
        -- ----------------------------------------------------

        'reassigned_quantity',
            p_reassigned_quantity,

        'reassigned_uom_code',
            v_source.assigned_uom_code,

        'reassigned_base_quantity',
            v_reassigned_base_quantity,

        'reassigned_base_uom_code',
            v_source.assigned_base_uom_code,


        -- ----------------------------------------------------
        -- Audit
        -- ----------------------------------------------------

        'reason',
            trim(p_reason),

        'notes',
            nullif(trim(p_notes), ''),


        -- ----------------------------------------------------
        -- Calculation authority
        -- ----------------------------------------------------

        'source_quantity_status_before',
            v_before_status,

        'source_quantity_status_after',
            v_after_status,

        'target_quantity_status',
            v_target_status

    );

end;

$function$;


-- ============================================================================
-- 09. FUNCTION EXECUTION PRIVILEGES
-- ============================================================================

revoke all on function public.preview_work_order_commercial_sources(uuid, uuid, uuid) from public;
revoke all on function public.allocate_work_order_commercial_scope(uuid, text, uuid, numeric, text) from public;
revoke all on function public.release_work_order_commercial_scope(uuid, numeric, text, text) from public;
revoke all on function public.get_work_assignment_quantity_status(uuid) from public;
revoke all on function public.assign_work_order_worker(uuid, uuid, numeric, text, uuid, text) from public;
revoke all on function public.reassign_work_order_worker(uuid, uuid, numeric, text, text) from public;
revoke all on function public.validate_work_order_protected_update() from public;

-- CREATE OR REPLACE FUNCTION preserves role-specific ACLs from hosted objects.
-- Revoke anon explicitly so authentication is enforced before function entry.
revoke all on function public.preview_work_order_commercial_sources(uuid, uuid, uuid) from anon;
revoke all on function public.allocate_work_order_commercial_scope(uuid, text, uuid, numeric, text) from anon;
revoke all on function public.release_work_order_commercial_scope(uuid, numeric, text, text) from anon;
revoke all on function public.get_work_assignment_quantity_status(uuid) from anon;
revoke all on function public.assign_work_order_worker(uuid, uuid, numeric, text, uuid, text) from anon;
revoke all on function public.reassign_work_order_worker(uuid, uuid, numeric, text, text) from anon;
revoke all on function public.validate_work_order_protected_update() from anon;

grant execute on function public.preview_work_order_commercial_sources(uuid, uuid, uuid) to authenticated;
grant execute on function public.allocate_work_order_commercial_scope(uuid, text, uuid, numeric, text) to authenticated;
grant execute on function public.release_work_order_commercial_scope(uuid, numeric, text, text) to authenticated;
grant execute on function public.get_work_assignment_quantity_status(uuid) to authenticated;
grant execute on function public.assign_work_order_worker(uuid, uuid, numeric, text, uuid, text) to authenticated;
grant execute on function public.reassign_work_order_worker(uuid, uuid, numeric, text, text) to authenticated;


-- ============================================================================
-- 10. LOCAL-PARITY ASSERTIONS
-- ============================================================================

do $$
begin
    if not exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'work_orders'
          and column_name = 'commercial_mode'
    ) then
        raise exception 'Catch-up failed: work_orders.commercial_mode missing.';
    end if;

    if not exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'work_assignments'
          and column_name = 'assigned_base_uom_code'
    ) then
        raise exception 'Catch-up failed: work_assignments.assigned_base_uom_code missing.';
    end if;

    if to_regclass('public.work_order_commercial_allocations') is null then
        raise exception 'Catch-up failed: work_order_commercial_allocations missing.';
    end if;

    if to_regclass('public.work_order_commercial_allocation_release_history') is null then
        raise exception 'Catch-up failed: commercial release history missing.';
    end if;

    if to_regclass('public.work_assignment_reassignment_history') is null then
        raise exception 'Catch-up failed: reassignment history missing.';
    end if;

    if not exists (
        select 1
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname = 'assign_work_order_worker'
    ) then
        raise exception 'Catch-up failed: assign_work_order_worker() missing.';
    end if;

    if not exists (
        select 1
        from pg_proc p
        join pg_namespace n on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.proname = 'reassign_work_order_worker'
    ) then
        raise exception 'Catch-up failed: reassign_work_order_worker() missing.';
    end if;
end
$$;

commit;
