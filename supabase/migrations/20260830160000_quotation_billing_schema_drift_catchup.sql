-- Catch up Local Supabase with the hosted quotation billing foundation that
-- existing quotation RPCs already depend on.

begin;

alter table public.quotation_revisions
    add column if not exists accepted_at timestamptz,
    add column if not exists accepted_by uuid;

CREATE TABLE IF NOT EXISTS "public"."quotation_billing_units" (
    "quotation_billing_unit_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quotation_id" "uuid" NOT NULL,
    "billing_unit_uid" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "billing_unit_code" "text",
    "billing_unit_name" "text" NOT NULL,
    "project_area_id" "uuid",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "notes" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    CONSTRAINT "quotation_billing_units_delete_state_check" CHECK (((("is_deleted" = false) AND ("deleted_at" IS NULL)) OR (("is_deleted" = true) AND ("is_active" = false) AND ("deleted_at" IS NOT NULL)))),
    CONSTRAINT "quotation_billing_units_name_check" CHECK ((NULLIF("btrim"("billing_unit_name"), ''::"text") IS NOT NULL)),
    CONSTRAINT "quotation_billing_units_sort_check" CHECK (("sort_order" >= 0))
);


ALTER TABLE "public"."quotation_billing_units" OWNER TO "postgres";


COMMENT ON TABLE "public"."quotation_billing_units" IS 'Quotation-level work/billing units such as Room, Apartment, Stage or Zone. These are not Product UOMs.';



CREATE TABLE IF NOT EXISTS "public"."quotation_line_billing_allocations" (
    "quotation_line_billing_allocation_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "quotation_id" "uuid" NOT NULL,
    "line_uid" "uuid" NOT NULL,
    "billing_unit_uid" "uuid" NOT NULL,
    "allocated_quantity" numeric(18,6),
    "allocated_percent" numeric(9,6),
    "allocated_amount" numeric(14,2),
    "notes" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    CONSTRAINT "quotation_line_billing_alloc_amount_check" CHECK ((("allocated_amount" IS NULL) OR ("allocated_amount" >= (0)::numeric))),
    CONSTRAINT "quotation_line_billing_alloc_delete_state_check" CHECK (((("is_deleted" = false) AND ("deleted_at" IS NULL)) OR (("is_deleted" = true) AND ("is_active" = false) AND ("deleted_at" IS NOT NULL)))),
    CONSTRAINT "quotation_line_billing_alloc_percent_check" CHECK ((("allocated_percent" IS NULL) OR (("allocated_percent" > (0)::numeric) AND ("allocated_percent" <= (100)::numeric)))),
    CONSTRAINT "quotation_line_billing_alloc_qty_check" CHECK ((("allocated_quantity" IS NULL) OR ("allocated_quantity" > (0)::numeric))),
    CONSTRAINT "quotation_line_billing_alloc_sort_check" CHECK (("sort_order" >= 0)),
    CONSTRAINT "quotation_line_billing_alloc_value_check" CHECK ((("allocated_quantity" IS NOT NULL) OR ("allocated_percent" IS NOT NULL) OR ("allocated_amount" IS NOT NULL)))
);


ALTER TABLE "public"."quotation_line_billing_allocations" OWNER TO "postgres";


COMMENT ON TABLE "public"."quotation_line_billing_allocations" IS 'Allocation of a stable quotation line to quotation billing/work units.';

CREATE TABLE IF NOT EXISTS "public"."quotation_revision_billing_units" (
    "revision_billing_unit_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "revision_id" "uuid" NOT NULL,
    "billing_unit_uid" "uuid" NOT NULL,
    "billing_unit_code" "text",
    "billing_unit_name" "text" NOT NULL,
    "project_area_id" "uuid",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "notes" "text",
    "is_active" boolean DEFAULT true NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    CONSTRAINT "quotation_revision_billing_units_delete_state_check" CHECK (((("is_deleted" = false) AND ("deleted_at" IS NULL)) OR (("is_deleted" = true) AND ("is_active" = false) AND ("deleted_at" IS NOT NULL)))),
    CONSTRAINT "quotation_revision_billing_units_name_check" CHECK ((NULLIF("btrim"("billing_unit_name"), ''::"text") IS NOT NULL)),
    CONSTRAINT "quotation_revision_billing_units_sort_check" CHECK (("sort_order" >= 0))
);


ALTER TABLE "public"."quotation_revision_billing_units" OWNER TO "postgres";


COMMENT ON TABLE "public"."quotation_revision_billing_units" IS 'Immutable-style revision snapshot of quotation billing/work units.';



CREATE TABLE IF NOT EXISTS "public"."quotation_revision_line_billing_allocations" (
    "revision_line_billing_allocation_id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "revision_id" "uuid" NOT NULL,
    "line_uid" "uuid" NOT NULL,
    "billing_unit_uid" "uuid" NOT NULL,
    "allocated_quantity" numeric(18,6),
    "allocated_percent" numeric(9,6),
    "allocated_amount" numeric(14,2),
    "notes" "text",
    "sort_order" integer DEFAULT 0 NOT NULL,
    "is_active" boolean DEFAULT true NOT NULL,
    "is_deleted" boolean DEFAULT false NOT NULL,
    "deleted_at" timestamp with time zone,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "created_by" "uuid",
    "updated_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "updated_by" "uuid",
    CONSTRAINT "quotation_revision_line_billing_alloc_amount_check" CHECK ((("allocated_amount" IS NULL) OR ("allocated_amount" >= (0)::numeric))),
    CONSTRAINT "quotation_revision_line_billing_alloc_delete_state_check" CHECK (((("is_deleted" = false) AND ("deleted_at" IS NULL)) OR (("is_deleted" = true) AND ("is_active" = false) AND ("deleted_at" IS NOT NULL)))),
    CONSTRAINT "quotation_revision_line_billing_alloc_percent_check" CHECK ((("allocated_percent" IS NULL) OR (("allocated_percent" > (0)::numeric) AND ("allocated_percent" <= (100)::numeric)))),
    CONSTRAINT "quotation_revision_line_billing_alloc_qty_check" CHECK ((("allocated_quantity" IS NULL) OR ("allocated_quantity" > (0)::numeric))),
    CONSTRAINT "quotation_revision_line_billing_alloc_sort_check" CHECK (("sort_order" >= 0)),
    CONSTRAINT "quotation_revision_line_billing_alloc_value_check" CHECK ((("allocated_quantity" IS NOT NULL) OR ("allocated_percent" IS NOT NULL) OR ("allocated_amount" IS NOT NULL)))
);


ALTER TABLE "public"."quotation_revision_line_billing_allocations" OWNER TO "postgres";


COMMENT ON TABLE "public"."quotation_revision_line_billing_allocations" IS 'Revision snapshot of quotation line-to-billing-unit allocations.';

CREATE OR REPLACE FUNCTION "public"."replace_draft_quotation_billing_atomic"("p_quotation_id" "uuid", "p_units" "jsonb" DEFAULT '[]'::"jsonb", "p_allocations" "jsonb" DEFAULT '[]'::"jsonb") RETURNS "jsonb"
    LANGUAGE "plpgsql" SECURITY DEFINER
    SET "search_path" TO 'public', 'auth', 'pg_temp'
    AS $$
declare
    v_user_id uuid := auth.uid();

    v_quotation public.quotations%rowtype;

    v_unit jsonb;
    v_allocation jsonb;

    v_billing_unit_uid uuid;
    v_line_uid uuid;
    v_project_area_id uuid;

    v_name text;
    v_code text;
    v_notes text;

    v_sort_order integer;

    v_allocated_quantity numeric;
    v_allocated_percent numeric;
    v_allocated_amount numeric;

    v_line_quantity numeric;
    v_billing_method text;

    v_unit_count integer := 0;
    v_allocation_count integer := 0;
begin
    if v_user_id is null then
        raise exception
            'Authentication is required.';
    end if;


    if not public.has_permission(
        'quotations.update_draft'
    ) then
        raise exception
            'Permission denied: quotations.update_draft is required.';
    end if;


    if p_quotation_id is null then
        raise exception
            'Quotation ID is required.';
    end if;


    if p_units is null
       or jsonb_typeof(p_units) <> 'array' then
        raise exception
            'Billing units must be a JSON array.';
    end if;


    if p_allocations is null
       or jsonb_typeof(p_allocations) <> 'array' then
        raise exception
            'Billing allocations must be a JSON array.';
    end if;


    select q.*
    into v_quotation
    from public.quotations q
    where q.quotation_id =
          p_quotation_id
      and q.is_active = true
      and q.is_deleted = false
    for update;


    if not found then
        raise exception
            'Quotation was not found, is inactive, or is deleted.';
    end if;


    if v_quotation.quotation_status <> 'Draft' then
        raise exception
            'Billing Breakdown can only be changed on a Draft quotation.';
    end if;


    -- --------------------------------------------------------
    -- Soft delete current allocations first.
    -- --------------------------------------------------------

    update public.quotation_line_billing_allocations
    set
        is_active = false,
        is_deleted = true,
        deleted_at = now(),
        updated_by = v_user_id
    where quotation_id =
          p_quotation_id
      and is_deleted = false;


    update public.quotation_billing_units
    set
        is_active = false,
        is_deleted = true,
        deleted_at = now(),
        updated_by = v_user_id
    where quotation_id =
          p_quotation_id
      and is_deleted = false;


    -- --------------------------------------------------------
    -- Insert Billing Units.
    -- --------------------------------------------------------

    for v_unit in
        select value
        from jsonb_array_elements(p_units)
    loop
        begin
            v_billing_unit_uid :=
                coalesce(
                    nullif(
                        btrim(
                            v_unit ->> 'billing_unit_uid'
                        ),
                        ''
                    )::uuid,
                    gen_random_uuid()
                );

            v_project_area_id :=
                nullif(
                    btrim(
                        v_unit ->> 'project_area_id'
                    ),
                    ''
                )::uuid;

            v_sort_order :=
                coalesce(
                    nullif(
                        btrim(
                            v_unit ->> 'sort_order'
                        ),
                        ''
                    )::integer,
                    v_unit_count + 1
                );
        exception
            when others then
                raise exception
                    'Invalid Billing Unit values.';
        end;


        v_name :=
            nullif(
                btrim(
                    v_unit ->> 'billing_unit_name'
                ),
                ''
            );

        v_code :=
            nullif(
                btrim(
                    v_unit ->> 'billing_unit_code'
                ),
                ''
            );

        v_notes :=
            nullif(
                btrim(
                    v_unit ->> 'notes'
                ),
                ''
            );


        if v_name is null then
            raise exception
                'Billing Unit Name is required.';
        end if;


        if v_project_area_id is not null
           and not exists (
                select 1
                from public.project_areas pa
                where pa.area_id =
                      v_project_area_id
                  and pa.site_id =
                      v_quotation.project_site_id
                  and pa.is_active = true
                  and pa.is_deleted = false
           ) then
            raise exception
                'Billing Unit Project Area does not belong to the Quotation Site.';
        end if;


        insert into public.quotation_billing_units (
            quotation_id,
            billing_unit_uid,
            billing_unit_code,
            billing_unit_name,
            project_area_id,
            sort_order,
            notes,
            created_by,
            updated_by
        )
        values (
            p_quotation_id,
            v_billing_unit_uid,
            v_code,
            v_name,
            v_project_area_id,
            v_sort_order,
            v_notes,
            v_user_id,
            v_user_id
        );


        v_unit_count :=
            v_unit_count + 1;
    end loop;


    -- --------------------------------------------------------
    -- Insert Line Allocations.
    -- --------------------------------------------------------

    for v_allocation in
        select value
        from jsonb_array_elements(p_allocations)
    loop
        begin
            v_line_uid :=
                nullif(
                    btrim(
                        v_allocation ->> 'line_uid'
                    ),
                    ''
                )::uuid;

            v_billing_unit_uid :=
                nullif(
                    btrim(
                        v_allocation
                        ->> 'billing_unit_uid'
                    ),
                    ''
                )::uuid;

            v_allocated_quantity :=
                nullif(
                    btrim(
                        v_allocation
                        ->> 'allocated_quantity'
                    ),
                    ''
                )::numeric;

            v_allocated_percent :=
                nullif(
                    btrim(
                        v_allocation
                        ->> 'allocated_percent'
                    ),
                    ''
                )::numeric;

            v_allocated_amount :=
                nullif(
                    btrim(
                        v_allocation
                        ->> 'allocated_amount'
                    ),
                    ''
                )::numeric;

            v_sort_order :=
                coalesce(
                    nullif(
                        btrim(
                            v_allocation
                            ->> 'sort_order'
                        ),
                        ''
                    )::integer,
                    v_allocation_count + 1
                );
        exception
            when others then
                raise exception
                    'Invalid Billing Allocation values.';
        end;


        if v_line_uid is null
           or v_billing_unit_uid is null then
            raise exception
                'line_uid and billing_unit_uid are required for Billing Allocation.';
        end if;


        select
            ql.quantity,
            ql.billing_method
        into
            v_line_quantity,
            v_billing_method
        from public.quotation_lines ql
        where ql.quotation_id =
              p_quotation_id
          and ql.line_uid =
              v_line_uid
          and ql.is_deleted = false;


        if not found then
            raise exception
                'Billing Allocation references an unknown active Quotation line.';
        end if;


        if v_billing_method <> 'WorkUnit' then
            raise exception
                'Billing Allocations are only valid for WorkUnit billing lines.';
        end if;


        if not exists (
            select 1
            from public.quotation_billing_units qbu
            where qbu.quotation_id =
                  p_quotation_id
              and qbu.billing_unit_uid =
                  v_billing_unit_uid
              and qbu.is_active = true
              and qbu.is_deleted = false
        ) then
            raise exception
                'Billing Allocation references an unknown Billing Unit.';
        end if;


        insert into
        public.quotation_line_billing_allocations (
            quotation_id,
            line_uid,
            billing_unit_uid,
            allocated_quantity,
            allocated_percent,
            allocated_amount,
            notes,
            sort_order,
            created_by,
            updated_by
        )
        values (
            p_quotation_id,
            v_line_uid,
            v_billing_unit_uid,
            v_allocated_quantity,
            v_allocated_percent,
            v_allocated_amount,
            nullif(
                btrim(
                    v_allocation ->> 'notes'
                ),
                ''
            ),
            v_sort_order,
            v_user_id,
            v_user_id
        );


        v_allocation_count :=
            v_allocation_count + 1;
    end loop;


    -- --------------------------------------------------------
    -- Do not allow WorkUnit quantity allocation to exceed
    -- Quotation quantity while still Draft.
    --
    -- Exact equality is enforced before Send in Migration B.
    -- --------------------------------------------------------

    if exists (
        select 1
        from public.quotation_lines ql
        join (
            select
                a.line_uid,
                sum(
                    coalesce(
                        a.allocated_quantity,
                        0
                    )
                ) as allocated_quantity
            from
                public.quotation_line_billing_allocations a
            where a.quotation_id =
                  p_quotation_id
              and a.is_active = true
              and a.is_deleted = false
            group by a.line_uid
        ) x
          on x.line_uid =
             ql.line_uid
        where ql.quotation_id =
              p_quotation_id
          and ql.is_deleted = false
          and ql.billing_method =
              'WorkUnit'
          and x.allocated_quantity >
              ql.quantity + 0.000001
    ) then
        raise exception
            'WorkUnit Billing Allocation exceeds Quotation line quantity.';
    end if;


    return jsonb_build_object(
        'quotation_id',
            p_quotation_id,

        'unit_count',
            v_unit_count,

        'allocation_count',
            v_allocation_count
    );
end;
$$;

-- Primary keys and foreign keys are added conditionally because these objects
-- already exist on the hosted project but are absent from the local history.
do $block$
begin
    if not exists (
        select 1 from pg_constraint
        where conname = 'quotation_billing_units_pkey'
          and conrelid = 'public.quotation_billing_units'::regclass
    ) then
        alter table public.quotation_billing_units
            add constraint quotation_billing_units_pkey
            primary key (quotation_billing_unit_id);
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'quotation_line_billing_allocations_pkey'
          and conrelid = 'public.quotation_line_billing_allocations'::regclass
    ) then
        alter table public.quotation_line_billing_allocations
            add constraint quotation_line_billing_allocations_pkey
            primary key (quotation_line_billing_allocation_id);
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'quotation_revision_billing_units_pkey'
          and conrelid = 'public.quotation_revision_billing_units'::regclass
    ) then
        alter table public.quotation_revision_billing_units
            add constraint quotation_revision_billing_units_pkey
            primary key (revision_billing_unit_id);
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'quotation_revision_line_billing_allocations_pkey'
          and conrelid = 'public.quotation_revision_line_billing_allocations'::regclass
    ) then
        alter table public.quotation_revision_line_billing_allocations
            add constraint quotation_revision_line_billing_allocations_pkey
            primary key (revision_line_billing_allocation_id);
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'quotation_billing_units_project_area_id_fkey'
          and conrelid = 'public.quotation_billing_units'::regclass
    ) then
        alter table public.quotation_billing_units
            add constraint quotation_billing_units_project_area_id_fkey
            foreign key (project_area_id)
            references public.project_areas(area_id)
            on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'quotation_billing_units_quotation_id_fkey'
          and conrelid = 'public.quotation_billing_units'::regclass
    ) then
        alter table public.quotation_billing_units
            add constraint quotation_billing_units_quotation_id_fkey
            foreign key (quotation_id)
            references public.quotations(quotation_id)
            on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'quotation_line_billing_allocations_quotation_id_fkey'
          and conrelid = 'public.quotation_line_billing_allocations'::regclass
    ) then
        alter table public.quotation_line_billing_allocations
            add constraint quotation_line_billing_allocations_quotation_id_fkey
            foreign key (quotation_id)
            references public.quotations(quotation_id)
            on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'quotation_revision_billing_units_project_area_id_fkey'
          and conrelid = 'public.quotation_revision_billing_units'::regclass
    ) then
        alter table public.quotation_revision_billing_units
            add constraint quotation_revision_billing_units_project_area_id_fkey
            foreign key (project_area_id)
            references public.project_areas(area_id)
            on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'quotation_revision_billing_units_revision_id_fkey'
          and conrelid = 'public.quotation_revision_billing_units'::regclass
    ) then
        alter table public.quotation_revision_billing_units
            add constraint quotation_revision_billing_units_revision_id_fkey
            foreign key (revision_id)
            references public.quotation_revisions(revision_id)
            on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conname = 'quotation_revision_line_billing_allocations_revision_id_fkey'
          and conrelid = 'public.quotation_revision_line_billing_allocations'::regclass
    ) then
        alter table public.quotation_revision_line_billing_allocations
            add constraint quotation_revision_line_billing_allocations_revision_id_fkey
            foreign key (revision_id)
            references public.quotation_revisions(revision_id)
            on delete restrict;
    end if;
end;
$block$;

create index if not exists idx_quotation_billing_units_area
    on public.quotation_billing_units (project_area_id)
    where is_deleted = false;
create index if not exists idx_quotation_billing_units_quotation
    on public.quotation_billing_units (quotation_id, sort_order)
    where is_deleted = false;
create index if not exists idx_quotation_line_billing_alloc_line
    on public.quotation_line_billing_allocations (quotation_id, line_uid)
    where is_deleted = false;
create index if not exists idx_quotation_line_billing_alloc_unit
    on public.quotation_line_billing_allocations (quotation_id, billing_unit_uid)
    where is_deleted = false;
create index if not exists idx_quotation_revision_billing_units_revision
    on public.quotation_revision_billing_units (revision_id, sort_order)
    where is_deleted = false;
create index if not exists idx_quotation_revision_line_billing_alloc_line
    on public.quotation_revision_line_billing_allocations (revision_id, line_uid)
    where is_deleted = false;

create unique index if not exists quotation_billing_units_active_code_unique
    on public.quotation_billing_units (quotation_id, lower(btrim(billing_unit_code)))
    where is_deleted = false and nullif(btrim(billing_unit_code), '') is not null;
create unique index if not exists quotation_billing_units_active_uid_unique
    on public.quotation_billing_units (quotation_id, billing_unit_uid)
    where is_deleted = false;
create unique index if not exists quotation_line_billing_alloc_active_unique
    on public.quotation_line_billing_allocations (quotation_id, line_uid, billing_unit_uid)
    where is_deleted = false;
create unique index if not exists quotation_revision_billing_units_active_uid_unique
    on public.quotation_revision_billing_units (revision_id, billing_unit_uid)
    where is_deleted = false;
create unique index if not exists quotation_revision_line_billing_alloc_active_unique
    on public.quotation_revision_line_billing_allocations (revision_id, line_uid, billing_unit_uid)
    where is_deleted = false;

drop trigger if exists trg_quotation_billing_units_updated_at
    on public.quotation_billing_units;
create trigger trg_quotation_billing_units_updated_at
before update on public.quotation_billing_units
for each row execute function public.set_updated_at();

drop trigger if exists trg_quotation_line_billing_allocations_updated_at
    on public.quotation_line_billing_allocations;
create trigger trg_quotation_line_billing_allocations_updated_at
before update on public.quotation_line_billing_allocations
for each row execute function public.set_updated_at();

drop trigger if exists trg_quotation_revision_billing_units_updated_at
    on public.quotation_revision_billing_units;
create trigger trg_quotation_revision_billing_units_updated_at
before update on public.quotation_revision_billing_units
for each row execute function public.set_updated_at();

drop trigger if exists trg_quotation_revision_line_billing_allocations_updated_at
    on public.quotation_revision_line_billing_allocations;
create trigger trg_quotation_revision_line_billing_allocations_updated_at
before update on public.quotation_revision_line_billing_allocations
for each row execute function public.set_updated_at();

alter table public.quotation_billing_units enable row level security;
alter table public.quotation_line_billing_allocations enable row level security;
alter table public.quotation_revision_billing_units enable row level security;
alter table public.quotation_revision_line_billing_allocations enable row level security;

drop policy if exists quotation_billing_units_select
    on public.quotation_billing_units;
create policy quotation_billing_units_select
on public.quotation_billing_units
for select to authenticated
using (public.has_permission('quotations.view') and is_deleted = false);

drop policy if exists quotation_line_billing_allocations_select
    on public.quotation_line_billing_allocations;
create policy quotation_line_billing_allocations_select
on public.quotation_line_billing_allocations
for select to authenticated
using (public.has_permission('quotations.view') and is_deleted = false);

drop policy if exists quotation_revision_billing_units_select
    on public.quotation_revision_billing_units;
create policy quotation_revision_billing_units_select
on public.quotation_revision_billing_units
for select to authenticated
using (public.has_permission('quotations.view') and is_deleted = false);

drop policy if exists quotation_revision_line_billing_allocations_select
    on public.quotation_revision_line_billing_allocations;
create policy quotation_revision_line_billing_allocations_select
on public.quotation_revision_line_billing_allocations
for select to authenticated
using (public.has_permission('quotations.view') and is_deleted = false);

revoke all on table public.quotation_billing_units from anon, authenticated;
revoke all on table public.quotation_line_billing_allocations from anon, authenticated;
revoke all on table public.quotation_revision_billing_units from anon, authenticated;
revoke all on table public.quotation_revision_line_billing_allocations from anon, authenticated;

grant select on table public.quotation_billing_units to authenticated;
grant select on table public.quotation_line_billing_allocations to authenticated;
grant select on table public.quotation_revision_billing_units to authenticated;
grant select on table public.quotation_revision_line_billing_allocations to authenticated;

grant all on table public.quotation_billing_units to service_role;
grant all on table public.quotation_line_billing_allocations to service_role;
grant all on table public.quotation_revision_billing_units to service_role;
grant all on table public.quotation_revision_line_billing_allocations to service_role;

revoke all on function public.replace_draft_quotation_billing_atomic(uuid, jsonb, jsonb)
    from public, anon;
grant execute on function public.replace_draft_quotation_billing_atomic(uuid, jsonb, jsonb)
    to authenticated, service_role;

-- Resolve the date/interval type mismatch reported by plpgsql_check.
create or replace function public.invoice_due_date_from_terms(
    p_customer_id uuid,
    p_invoice_date date
)
returns date
language plpgsql
stable
security definer
set search_path = public, pg_temp
as $function$
declare
    v_type text;
    v_days integer;
begin
    select
        cfs.payment_terms_type,
        cfs.payment_terms_days
    into
        v_type,
        v_days
    from public.customer_financial_settings cfs
    where cfs.customer_id = p_customer_id;

    v_type := coalesce(v_type, 'Days After Bill');
    v_days := coalesce(v_days, 14);

    case v_type
        when 'Days After Bill' then
            return p_invoice_date + v_days;
        when 'Days After Bill Month' then
            return (
                date_trunc('month', p_invoice_date)::date
                + interval '1 month'
                + (v_days * interval '1 day')
            )::date;
        when 'Day of Current Month' then
            return least(
                date_trunc('month', p_invoice_date)::date + (v_days - 1),
                (
                    date_trunc('month', p_invoice_date)::date
                    + interval '1 month - 1 day'
                )::date
            );
        when 'Day of Following Month' then
            return least(
                (
                    date_trunc('month', p_invoice_date)::date
                    + interval '1 month'
                    + ((v_days - 1) * interval '1 day')
                )::date,
                (
                    date_trunc('month', p_invoice_date)::date
                    + interval '2 months - 1 day'
                )::date
            );
        else
            return p_invoice_date + 14;
    end case;
end;
$function$;

commit;

