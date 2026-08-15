-- ============================================================================
-- REDS Timber Flooring
-- Local catch-up migration: Product UOM / Pricing / Quotation pricing snapshots
-- Generated from Hosted authoritative definitions inspected on 2026-08-15.
--
-- PURPOSE
--   Bring the Local database schema/RPC surface up to the Hosted Pricing backend
--   so Supabase TypeScript types can be generated from --local.
--
-- SAFETY
--   - Idempotent where practical.
--   - Does not delete business rows.
--   - Existing legacy price_book_lines are backfilled to each Product's current
--     default sales/base UOM because Local had no price_uom_code column.
--   - Hosted historical data is NOT touched by this local migration.
-- ============================================================================

begin;

-- ---------------------------------------------------------------------------
-- 1. FOUNDATION COLUMNS MISSING FROM LOCAL
-- ---------------------------------------------------------------------------

alter table public.product_units
    add column if not exists allow_fractional_quantity boolean not null default false;

alter table public.price_book_lines
    add column if not exists price_uom_code text;

-- Local legacy rows pre-date multi-UOM pricing. Give each existing row a
-- deterministic local UOM so the new NOT NULL/FK can be installed.
update public.price_book_lines pbl
set price_uom_code = coalesce(p.default_sales_uom_code, p.base_uom_code)
from public.products p
where p.product_id = pbl.product_id
  and pbl.price_uom_code is null;

do $$
begin
    if exists (
        select 1 from public.price_book_lines
        where price_uom_code is null
    ) then
        raise exception 'Cannot backfill Local price_book_lines.price_uom_code for every row.';
    end if;
end;
$$;

alter table public.price_book_lines
    alter column price_uom_code set not null;

alter table public.quotation_lines
    add column if not exists line_uid uuid not null default gen_random_uuid(),
    add column if not exists billing_method text not null default 'Quantity',
    add column if not exists price_book_id uuid,
    add column if not exists price_book_line_id uuid,
    add column if not exists price_source text,
    add column if not exists original_unit_price numeric(12,2),
    add column if not exists minimum_price_snapshot numeric(12,2),
    add column if not exists manual_price_reason text,
    add column if not exists discount_reason text;

alter table public.quotation_revision_lines
    add column if not exists line_uid uuid not null default gen_random_uuid(),
    add column if not exists billing_method text not null default 'Quantity',
    add column if not exists price_book_id uuid,
    add column if not exists price_book_line_id uuid,
    add column if not exists price_source text,
    add column if not exists original_unit_price numeric(12,2),
    add column if not exists minimum_price_snapshot numeric(12,2),
    add column if not exists manual_price_reason text,
    add column if not exists discount_reason text;

alter table public.products
    add column if not exists pricing_uom_code text,
    add column if not exists maximum_discount_percent numeric(7,4) not null default 0;

-- ---------------------------------------------------------------------------
-- 2. REMOVE LEGACY SINGLE-UOM PRICE-BOOK UNIQUENESS
-- ---------------------------------------------------------------------------

alter table public.price_book_lines
    drop constraint if exists price_book_lines_unique_product_per_book;

-- ---------------------------------------------------------------------------
-- 3. FOUNDATION CONSTRAINTS
-- ---------------------------------------------------------------------------

do $$
begin
    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.price_book_lines'::regclass
          and conname = 'price_book_lines_price_uom_code_fkey'
    ) then
        alter table public.price_book_lines
            add constraint price_book_lines_price_uom_code_fkey
            foreign key (price_uom_code)
            references public.units_of_measure(uom_code)
            on update restrict on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.products'::regclass
          and conname = 'products_pricing_uom_code_fkey'
    ) then
        alter table public.products
            add constraint products_pricing_uom_code_fkey
            foreign key (pricing_uom_code)
            references public.units_of_measure(uom_code)
            on update cascade on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.products'::regclass
          and conname = 'products_maximum_discount_percent_check'
    ) then
        alter table public.products
            add constraint products_maximum_discount_percent_check
            check (maximum_discount_percent >= 0 and maximum_discount_percent <= 100);
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.quotation_lines'::regclass
          and conname = 'quotation_lines_billing_method_check'
    ) then
        alter table public.quotation_lines
            add constraint quotation_lines_billing_method_check
            check (billing_method = any (array['Quantity'::text,'WorkUnit'::text,'Percentage'::text]));
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.quotation_revision_lines'::regclass
          and conname = 'quotation_revision_lines_billing_method_check'
    ) then
        alter table public.quotation_revision_lines
            add constraint quotation_revision_lines_billing_method_check
            check (billing_method = any (array['Quantity'::text,'WorkUnit'::text,'Percentage'::text]));
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.quotation_lines'::regclass
          and conname = 'quotation_lines_price_source_check'
    ) then
        alter table public.quotation_lines
            add constraint quotation_lines_price_source_check
            check (price_source is null or price_source = any (array['Price Book'::text,'Manual'::text]));
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.quotation_revision_lines'::regclass
          and conname = 'quotation_revision_lines_price_source_check'
    ) then
        alter table public.quotation_revision_lines
            add constraint quotation_revision_lines_price_source_check
            check (price_source is null or price_source = any (array['Price Book'::text,'Manual'::text]));
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.quotation_lines'::regclass
          and conname = 'quotation_lines_price_book_id_fkey'
    ) then
        alter table public.quotation_lines
            add constraint quotation_lines_price_book_id_fkey
            foreign key (price_book_id) references public.price_books(price_book_id) on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.quotation_lines'::regclass
          and conname = 'quotation_lines_price_book_line_id_fkey'
    ) then
        alter table public.quotation_lines
            add constraint quotation_lines_price_book_line_id_fkey
            foreign key (price_book_line_id) references public.price_book_lines(price_book_line_id) on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.quotation_revision_lines'::regclass
          and conname = 'quotation_revision_lines_price_book_id_fkey'
    ) then
        alter table public.quotation_revision_lines
            add constraint quotation_revision_lines_price_book_id_fkey
            foreign key (price_book_id) references public.price_books(price_book_id) on delete restrict;
    end if;

    if not exists (
        select 1 from pg_constraint
        where conrelid = 'public.quotation_revision_lines'::regclass
          and conname = 'quotation_revision_lines_price_book_line_id_fkey'
    ) then
        alter table public.quotation_revision_lines
            add constraint quotation_revision_lines_price_book_line_id_fkey
            foreign key (price_book_line_id) references public.price_book_lines(price_book_line_id) on delete restrict;
    end if;
end;
$$;

-- ---------------------------------------------------------------------------
-- 4. INDEXES
-- ---------------------------------------------------------------------------

create unique index if not exists price_book_lines_unique_active_product_uom
    on public.price_book_lines(price_book_id, product_id, price_uom_code)
    where is_deleted = false;

create index if not exists price_book_lines_lookup_idx
    on public.price_book_lines(price_book_id, product_id, price_uom_code, effective_from, effective_to)
    where is_deleted = false and is_active = true;

create index if not exists idx_quotation_lines_line_uid
    on public.quotation_lines(line_uid);

create unique index if not exists quotation_lines_active_line_uid_unique
    on public.quotation_lines(quotation_id, line_uid)
    where is_deleted = false;

create index if not exists idx_quotation_lines_price_book_id
    on public.quotation_lines(price_book_id)
    where is_deleted = false;

create index if not exists idx_quotation_lines_price_book_line_id
    on public.quotation_lines(price_book_line_id)
    where is_deleted = false;

create index if not exists idx_quotation_revision_lines_line_uid
    on public.quotation_revision_lines(line_uid);

create unique index if not exists quotation_revision_lines_active_line_uid_unique
    on public.quotation_revision_lines(revision_id, line_uid)
    where is_deleted = false;

create index if not exists idx_quotation_revision_lines_price_book_id
    on public.quotation_revision_lines(price_book_id)
    where is_deleted = false;

create index if not exists idx_quotation_revision_lines_price_book_line_id
    on public.quotation_revision_lines(price_book_line_id)
    where is_deleted = false;

-- ---------------------------------------------------------------------------
-- 5. PERMISSIONS
-- ---------------------------------------------------------------------------

insert into public.app_permissions (
    permission_code, permission_name, module_code, action_code,
    description, is_system_permission, is_active, sort_order
)
values
(
    'products.manage_sales_prices',
    'Manage Product Sales Prices',
    'products',
    'manage_sales_prices',
    'Create, update, activate, deactivate and soft-delete Product Price Books and Price Book lines.',
    true, true, 250
),
(
    'quotations.apply_discount',
    'Apply Quotation Discount',
    'quotations',
    'apply_discount',
    'Apply a Product line discount within the Product maximum discount limit. A reason is required when discount is greater than zero.',
    true, true, 116
)
on conflict (permission_code) do update
set permission_name = excluded.permission_name,
    module_code = excluded.module_code,
    action_code = excluded.action_code,
    description = excluded.description,
    is_system_permission = excluded.is_system_permission,
    is_active = excluded.is_active,
    sort_order = excluded.sort_order,
    updated_at = now();

insert into public.app_role_permissions (role_id, permission_id, is_allowed)
select r.role_id, p.permission_id, true
from public.app_roles r
join public.app_permissions p
  on p.permission_code in ('products.manage_sales_prices','quotations.apply_discount')
where r.role_code = 'admin'
  and r.is_active = true
on conflict (role_id, permission_id) do update
set is_allowed = true,
    updated_at = now();

-- ---------------------------------------------------------------------------
-- 6. CURRENT HOSTED FUNCTIONS
-- Exact definitions exported from Hosted on 2026-08-15.
-- ---------------------------------------------------------------------------


-- assert_product_pricing_uom_supported(p_product_id uuid, p_pricing_uom_code text)
CREATE OR REPLACE FUNCTION public.assert_product_pricing_uom_supported(p_product_id uuid, p_pricing_uom_code text)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
declare
    v_pricing_uom_code text;
begin
    if auth.uid() is null then
        raise exception 'Authentication is required.';
    end if;

    if p_product_id is null then
        raise exception 'Product is required.';
    end if;

    v_pricing_uom_code :=
        nullif(btrim(p_pricing_uom_code), '');

    if v_pricing_uom_code is null then
        raise exception 'Product Pricing UOM is required.';
    end if;


    if not exists (
        select 1
        from public.products p
        where p.product_id = p_product_id
          and p.is_active = true
          and p.is_deleted = false
    ) then
        raise exception
            'Selected Product is missing, inactive, or deleted.';
    end if;


    if not exists (
        select 1
        from public.product_units pu
        where pu.product_id = p_product_id
          and pu.uom_code = v_pricing_uom_code
          and pu.is_active = true
          and pu.is_deleted = false
          and pu.conversion_to_base > 0
    ) then
        raise exception
            'Pricing UOM % must be an active Supported UOM with a valid Factor-to-Base for the selected Product.',
            v_pricing_uom_code;
    end if;
end;
$function$;
-- assert_quotation_revision_discount_reason_deferred()
CREATE OR REPLACE FUNCTION public.assert_quotation_revision_discount_reason_deferred()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$

declare
    v_current public.quotation_revision_lines%rowtype;

    v_source record;

    v_has_source boolean := false;

    v_is_exact_inherited boolean := false;

    v_reason text;

begin

    /* ========================================================================
    Load FINAL current row at constraint-check time
    ======================================================================== */

    select qrl.*
    into v_current

    from public.quotation_revision_lines qrl

    where qrl.revision_line_id =
          new.revision_line_id

      and qrl.is_deleted = false;


    /*
    Row may have been soft-deleted/replaced later in this transaction.
    */

    if not found then
        return null;
    end if;


    if coalesce(
        v_current.discount_percent,
        0
    ) = 0 then

        return null;

    end if;


    v_reason :=
        nullif(
            btrim(
                coalesce(
                    v_current.discount_reason,
                    ''
                )
            ),
            ''
        );


    /* ========================================================================
    Check inherited source
    ======================================================================== */

    select *
    into v_source

    from public.get_quotation_revision_inherited_discount_snapshot(
        v_current.revision_id,
        v_current.line_uid,
        v_current.quotation_line_id,
        v_current.line_no
    );


    if found then

        v_has_source := true;


        if coalesce(
               v_current.discount_percent,
               0
           )
           is not distinct from
           coalesce(
               v_source.source_discount_percent,
               0
           )

           and v_reason
               is not distinct from
               v_source.source_discount_reason
        then

            v_is_exact_inherited := true;

        end if;

    end if;


    /* ========================================================================
    Historical inherited discount is valid as-is
    ======================================================================== */

    if v_is_exact_inherited then
        return null;
    end if;


    /* ========================================================================
    Any other positive discount requires reason
    ======================================================================== */

    if v_reason is null then

        raise exception
            'Discount Reason is required when a new or changed Quotation Revision discount is greater than zero.';

    end if;


    return null;

end;
$function$;
-- assert_quotation_revision_send_price_current(p_revision_id uuid)
CREATE OR REPLACE FUNCTION public.assert_quotation_revision_send_price_current(p_revision_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$

declare
    v_changed_count integer;
    v_error_count integer;

begin

    select
        count(*) filter (
            where change_status =
                  'PRICE_CHANGED'
        ),

        count(*) filter (
            where change_status =
                  'PRICING_ERROR'
        )

    into
        v_changed_count,
        v_error_count

    from public.get_quotation_revision_send_price_changes(
        p_revision_id
    );


    if v_error_count > 0 then

        raise exception
            'Quotation Revision contains % Product line(s) whose current selling price cannot be resolved. Review Product Pricing UOM / Price Matrix before sending.',
            v_error_count;

    end if;


    if v_changed_count > 0 then

        raise exception
            'Quotation Revision contains % Product line(s) whose selling price changed after the Draft snapshot. Resolve each changed line before sending.',
            v_changed_count;

    end if;

end;
$function$;
-- assert_quotation_send_price_current(p_quotation_id uuid)
CREATE OR REPLACE FUNCTION public.assert_quotation_send_price_current(p_quotation_id uuid)
 RETURNS void
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$

declare
    v_changed_count integer;
    v_error_count integer;

begin

    select
        count(*) filter (
            where change_status =
                  'PRICE_CHANGED'
        ),

        count(*) filter (
            where change_status =
                  'PRICING_ERROR'
        )

    into
        v_changed_count,
        v_error_count

    from public.get_quotation_send_price_changes(
        p_quotation_id
    );


    if v_error_count > 0 then

        raise exception
            'Quotation contains % Product line(s) whose current selling price cannot be resolved. Review Product Pricing UOM / Price Matrix before sending.',
            v_error_count;

    end if;


    if v_changed_count > 0 then

        raise exception
            'Quotation contains % Product line(s) whose selling price changed after the Draft snapshot. Resolve each changed line before sending.',
            v_changed_count;

    end if;

end;
$function$;
-- convert_product_quantity_between_uoms(p_product_id uuid, p_quantity numeric, p_from_uom_code text, p_to_uom_code text)
CREATE OR REPLACE FUNCTION public.convert_product_quantity_between_uoms(p_product_id uuid, p_quantity numeric, p_from_uom_code text, p_to_uom_code text)
 RETURNS TABLE(base_quantity numeric, converted_quantity numeric, from_uom_code text, from_factor_to_base numeric, to_uom_code text, to_factor_to_base numeric, to_allow_fractional_quantity boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
declare
    v_from_uom text;
    v_to_uom text;

    v_from_factor numeric(18,6);
    v_to_factor numeric(18,6);

    v_to_allow_fractional boolean;

    v_base_quantity numeric;
    v_converted_quantity numeric;
begin
    if auth.uid() is null then
        raise exception 'Authentication is required.';
    end if;


    if p_product_id is null then
        raise exception 'Product is required.';
    end if;


    if p_quantity is null
       or p_quantity < 0 then
        raise exception
            'Quantity must be zero or greater.';
    end if;


    v_from_uom :=
        nullif(btrim(p_from_uom_code), '');

    v_to_uom :=
        nullif(btrim(p_to_uom_code), '');


    if v_from_uom is null
       or v_to_uom is null then
        raise exception
            'From UOM and To UOM are required.';
    end if;


    select pu.conversion_to_base
    into v_from_factor

    from public.product_units pu

    where pu.product_id = p_product_id
      and pu.uom_code = v_from_uom
      and pu.is_active = true
      and pu.is_deleted = false;


    if v_from_factor is null
       or v_from_factor <= 0 then
        raise exception
            'From UOM % is not a valid active Supported UOM.',
            v_from_uom;
    end if;


    select
        pu.conversion_to_base,
        pu.allow_fractional_quantity

    into
        v_to_factor,
        v_to_allow_fractional

    from public.product_units pu

    where pu.product_id = p_product_id
      and pu.uom_code = v_to_uom
      and pu.is_active = true
      and pu.is_deleted = false;


    if v_to_factor is null
       or v_to_factor <= 0 then
        raise exception
            'To UOM % is not a valid active Supported UOM.',
            v_to_uom;
    end if;


    v_base_quantity :=
        round(
            p_quantity * v_from_factor,
            6
        );


    v_converted_quantity :=
        round(
            v_base_quantity / v_to_factor,
            6
        );


    return query
    select
        v_base_quantity,
        v_converted_quantity,

        v_from_uom,
        v_from_factor,

        v_to_uom,
        v_to_factor,

        v_to_allow_fractional;
end;
$function$;
-- create_quotation_progress_atomic(p_quotation jsonb, p_lines jsonb, p_billing_units jsonb, p_billing_allocations jsonb)
CREATE OR REPLACE FUNCTION public.create_quotation_progress_atomic(p_quotation jsonb, p_lines jsonb, p_billing_units jsonb DEFAULT '[]'::jsonb, p_billing_allocations jsonb DEFAULT '[]'::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$

declare

    v_user_id uuid := auth.uid();


    v_customer_id uuid;

    v_customer_price_book_id uuid;

    v_requested_price_book_id uuid;

    v_issue_date date;


    v_line jsonb;

    v_resolved_lines jsonb :=
        '[]'::jsonb;

    v_line_metadata jsonb :=
        '[]'::jsonb;


    v_line_no integer := 0;


    v_product_id uuid;

    v_sales_uom_code text;

    v_quantity numeric;


    v_requested_unit_price numeric;


    v_discount_percent numeric;

    v_discount_reason text;


    v_line_uid uuid;

    v_billing_method text;


    v_uom record;

    v_price record;

    v_discount record;


    v_result jsonb;

    v_quotation_id uuid;

begin

    /* ========================================================================
    Authentication
    ======================================================================== */

    if v_user_id is null then
        raise exception
            'Authentication is required.';
    end if;


    if not public.has_permission(
        'quotations.create'
    ) then
        raise exception
            'Permission denied: quotations.create is required.';
    end if;


    /* ========================================================================
    Input
    ======================================================================== */

    if p_quotation is null
       or jsonb_typeof(p_quotation) <> 'object' then
        raise exception
            'Quotation header must be a JSON object.';
    end if;


    if p_lines is null
       or jsonb_typeof(p_lines) <> 'array'
       or jsonb_array_length(p_lines) = 0 then
        raise exception
            'At least one Quotation line is required.';
    end if;


    if p_billing_units is null
       or jsonb_typeof(p_billing_units) <> 'array' then
        raise exception
            'Billing Units must be a JSON array.';
    end if;


    if p_billing_allocations is null
       or jsonb_typeof(p_billing_allocations) <> 'array' then
        raise exception
            'Billing Allocations must be a JSON array.';
    end if;


    /* ========================================================================
    Customer / Price Book / pricing date
    ======================================================================== */

    begin

        v_customer_id :=
            nullif(
                btrim(
                    p_quotation ->> 'customer_id'
                ),
                ''
            )::uuid;


        v_requested_price_book_id :=
            nullif(
                btrim(
                    p_quotation ->> 'price_book_id'
                ),
                ''
            )::uuid;


        v_issue_date :=
            nullif(
                btrim(
                    p_quotation ->> 'issue_date'
                ),
                ''
            )::date;

    exception
        when others then
            raise exception
                'Invalid Customer, Price Book, or Issue Date.';
    end;


    if v_customer_id is null then
        raise exception
            'Customer is required.';
    end if;


    select c.price_book_id
    into v_customer_price_book_id

    from public.customers c

    where c.customer_id =
          v_customer_id

      and c.is_active = true
      and c.is_deleted = false;


    if not found then
        raise exception
            'Customer does not exist, is inactive, or is deleted.';
    end if;


    if v_customer_price_book_id is null then
        raise exception
            'Customer must have a Price Book before creating a Quotation.';
    end if;


    if v_requested_price_book_id is not null
       and v_requested_price_book_id
           is distinct from
           v_customer_price_book_id then

        raise exception
            'Quotation Price Book must match the Customer Price Book.';
    end if;


    v_issue_date :=
        coalesce(
            v_issue_date,
            current_date
        );


    /* ========================================================================
    Resolve lines
    ======================================================================== */

    for v_line in

        select value
        from jsonb_array_elements(p_lines)

    loop

        v_line_no :=
            v_line_no + 1;


        if jsonb_typeof(v_line) <> 'object' then
            raise exception
                'Quotation line % must be a JSON object.',
                v_line_no;
        end if;


        begin

            v_product_id :=
                nullif(
                    btrim(
                        v_line ->> 'product_id'
                    ),
                    ''
                )::uuid;


            v_requested_unit_price :=
                nullif(
                    btrim(
                        v_line ->> 'unit_price'
                    ),
                    ''
                )::numeric;


            v_quantity :=
                nullif(
                    btrim(
                        v_line ->> 'quantity'
                    ),
                    ''
                )::numeric;


            v_discount_percent :=
                coalesce(
                    nullif(
                        btrim(
                            v_line
                            ->> 'discount_percent'
                        ),
                        ''
                    )::numeric,
                    0
                );


            v_line_uid :=
                coalesce(
                    nullif(
                        btrim(
                            v_line ->> 'line_uid'
                        ),
                        ''
                    )::uuid,
                    gen_random_uuid()
                );

        exception
            when others then
                raise exception
                    'Quotation line % contains an invalid Product, Quantity, Unit Price, Discount, or line_uid.',
                    v_line_no;
        end;


        if v_quantity is null
           or v_quantity <= 0 then
            raise exception
                'Quotation line % Quantity must be greater than zero.',
                v_line_no;
        end if;


        v_sales_uom_code :=
            nullif(
                btrim(
                    v_line
                    ->> 'sales_uom_code'
                ),
                ''
            );


        v_discount_reason :=
            nullif(
                btrim(
                    v_line
                    ->> 'discount_reason'
                ),
                ''
            );


        v_billing_method :=
            coalesce(
                nullif(
                    btrim(
                        v_line
                        ->> 'billing_method'
                    ),
                    ''
                ),
                'Quantity'
            );


        if v_billing_method not in (
            'Quantity',
            'WorkUnit',
            'Percentage'
        ) then
            raise exception
                'Quotation line % has invalid Billing Method: %.',
                v_line_no,
                v_billing_method;
        end if;


        /* ====================================================================
        Manual / non-product line
        ==================================================================== */

        if v_product_id is null then

            if v_requested_unit_price is null then
                raise exception
                    'Manual Quotation line % requires a Unit Price.',
                    v_line_no;
            end if;


            if v_requested_unit_price < 0 then
                raise exception
                    'Quotation line % Unit Price cannot be negative.',
                    v_line_no;
            end if;


            if v_discount_percent < 0
               or v_discount_percent > 100 then
                raise exception
                    'Quotation line % Discount Percent must be between 0 and 100.',
                    v_line_no;
            end if;


            if v_discount_percent > 0 then

                if not public.has_permission(
                    'quotations.apply_discount'
                ) then
                    raise exception
                        'Permission quotations.apply_discount is required to apply a Quotation discount.';
                end if;


                if v_discount_reason is null then
                    raise exception
                        'Discount Reason is required when Quotation discount is greater than zero.';
                end if;

            else
                v_discount_reason := null;
            end if;


            v_resolved_lines :=
                v_resolved_lines
                || jsonb_build_array(

                    v_line

                    || jsonb_build_object(
                        'quantity',
                            v_quantity,

                        'unit_price',
                            v_requested_unit_price,

                        'discount_percent',
                            v_discount_percent
                    )
                );


            v_line_metadata :=
                v_line_metadata
                || jsonb_build_array(

                    jsonb_build_object(
                        'line_no',
                            v_line_no,

                        'line_uid',
                            v_line_uid,

                        'billing_method',
                            v_billing_method,

                        'price_book_id',
                            v_customer_price_book_id,

                        'price_book_line_id',
                            null,

                        'price_source',
                            'Manual',

                        'original_unit_price',
                            v_requested_unit_price,

                        'minimum_price_snapshot',
                            null,

                        'manual_price_reason',
                            nullif(
                                btrim(
                                    v_line
                                    ->> 'manual_price_reason'
                                ),
                                ''
                            ),

                        'discount_reason',
                            v_discount_reason,

                        'pricing_action',
                            'MANUAL_LINE'
                    )
                );


            continue;

        end if;


        /* ====================================================================
        Product line

        Client unit_price is deliberately ignored.
        ==================================================================== */

        if v_sales_uom_code is null then
            raise exception
                'Sales UOM is required for Product line %.',
                v_line_no;
        end if;


        select *
        into v_uom

        from public.get_product_uom_factor_to_base(
            v_product_id,
            v_sales_uom_code
        );


        select *
        into v_price

        from public.resolve_product_transaction_price(
            v_customer_price_book_id,
            v_product_id,
            v_sales_uom_code,
            v_issue_date
        );


        select *
        into v_discount

        from public.validate_quotation_product_discount(
            v_product_id,
            v_discount_percent,
            v_discount_reason
        );


        if not coalesce(
            v_uom.allow_fractional_quantity,
            true
        )
        and v_quantity <> trunc(v_quantity) then

            raise exception
                'Quotation line % UOM % does not allow fractional quantity.',
                v_line_no,
                v_sales_uom_code;
        end if;


        v_resolved_lines :=
            v_resolved_lines
            || jsonb_build_array(

                v_line

                || jsonb_build_object(
                    'quantity',
                        round(
                            v_quantity,
                            6
                        ),

                    'unit_price',
                        round(
                            v_price.transaction_unit_price,
                            2
                        ),

                    'discount_percent',
                        v_discount.discount_percent,

                    'sales_uom_code',
                        v_sales_uom_code,

                    'base_uom_code',
                        v_uom.base_uom_code,

                    'conversion_factor',
                        v_uom.conversion_to_base,

                    'allow_fractional_quantity',
                        v_uom.allow_fractional_quantity
                )
            );


        v_line_metadata :=
            v_line_metadata
            || jsonb_build_array(

                jsonb_build_object(
                    'line_no',
                        v_line_no,

                    'line_uid',
                        v_line_uid,

                    'billing_method',
                        v_billing_method,

                    'price_book_id',
                        v_customer_price_book_id,

                    'price_book_line_id',
                        v_price.price_book_line_id,

                    'price_source',
                        'Price Book',

                    'original_unit_price',
                        round(
                            v_price.transaction_unit_price,
                            2
                        ),

                    'minimum_price_snapshot',
                        case
                            when
                                v_price.transaction_minimum_price
                                is null
                            then null

                            else round(
                                v_price.transaction_minimum_price,
                                2
                            )
                        end,

                    'manual_price_reason',
                        null,

                    'discount_reason',
                        v_discount.discount_reason,

                    'pricing_action',
                        'CURRENT_PRICE_NEW_LINE'
                )
            );

    end loop;


    /* ========================================================================
    Existing core Create
    ======================================================================== */

    v_result :=
        public.create_quotation_atomic(

            p_quotation

            || jsonb_build_object(
                'price_book_id',
                v_customer_price_book_id
            ),

            v_resolved_lines
        );


    v_quotation_id :=
        nullif(
            v_result ->> 'quotation_id',
            ''
        )::uuid;


    if v_quotation_id is null then
        raise exception
            'Quotation create RPC did not return quotation_id.';
    end if;


    /* ========================================================================
    Attach stable identity + pricing provenance + Discount Reason
    ======================================================================== */

    update public.quotation_lines ql

    set
        line_uid =
            (m.value ->> 'line_uid')::uuid,

        billing_method =
            m.value ->> 'billing_method',

        price_book_id =
            nullif(
                m.value ->> 'price_book_id',
                ''
            )::uuid,

        price_book_line_id =
            nullif(
                m.value
                ->> 'price_book_line_id',
                ''
            )::uuid,

        price_source =
            nullif(
                m.value ->> 'price_source',
                ''
            ),

        original_unit_price =
            nullif(
                m.value
                ->> 'original_unit_price',
                ''
            )::numeric,

        minimum_price_snapshot =
            nullif(
                m.value
                ->> 'minimum_price_snapshot',
                ''
            )::numeric,

        manual_price_reason =
            nullif(
                m.value
                ->> 'manual_price_reason',
                ''
            ),

        discount_reason =
            nullif(
                btrim(
                    m.value
                    ->> 'discount_reason'
                ),
                ''
            ),

        updated_by =
            v_user_id

    from jsonb_array_elements(
        v_line_metadata
    ) m(value)

    where ql.quotation_id =
          v_quotation_id

      and ql.line_no =
          (m.value ->> 'line_no')::integer

      and ql.is_deleted = false;


    /* ========================================================================
    Billing Breakdown
    ======================================================================== */

    perform public.replace_draft_quotation_billing_atomic(
        v_quotation_id,
        p_billing_units,
        p_billing_allocations
    );


    return
        v_result

        || jsonb_build_object(
            'price_book_id',
                v_customer_price_book_id,

            'progress_billing_ready',
                true
        );

end;
$function$;
-- create_quotation_revision_atomic(p_quotation_id uuid, p_revision_reason text, p_revision_notes text)
CREATE OR REPLACE FUNCTION public.create_quotation_revision_atomic(p_quotation_id uuid, p_revision_reason text DEFAULT NULL::text, p_revision_notes text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$

declare
    v_user_id uuid := auth.uid();

    v_quotation public.quotations%rowtype;

    v_source_revision
        public.quotation_revisions%rowtype;

    v_source_revision_id uuid;

    v_new_revision_id uuid;
    v_new_revision_no integer;

    v_customer_id uuid;
    v_project_site_id uuid;
    v_price_book_id uuid;

    v_quotation_segment text;
    v_quotation_source text;

    v_issue_date date;
    v_valid_until date;

    v_notes text;
    v_internal_notes text;

    v_subtotal_amount numeric;
    v_discount_amount numeric;
    v_tax_amount numeric;
    v_total_amount numeric;

    v_line_count integer := 0;

begin

    /* ========================================================================
    Authentication / Permission
    ======================================================================== */

    if v_user_id is null then
        raise exception
            'Authentication is required.';
    end if;


    if not public.has_permission(
        'quotations.create_revision'
    ) then
        raise exception
            'Permission denied: quotations.create_revision is required.';
    end if;


    if p_quotation_id is null then
        raise exception
            'Quotation ID is required.';
    end if;


    /* ========================================================================
    Lock Parent Quotation
    ======================================================================== */

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


    if v_quotation.quotation_status not in (
        'Sent',
        'Revised'
    ) then
        raise exception
            'Only Sent or Revised quotations can create a Revision. Current status: %.',
            v_quotation.quotation_status;
    end if;


    if v_quotation.accepted_at is not null
       or v_quotation.accepted_by is not null
       or v_quotation.accepted_revision_id is not null then

        raise exception
            'Accepted Quotation cannot create another Revision. Use a Variation for contract changes.';
    end if;


    if exists (
        select 1

        from public.quotation_revisions qr

        where qr.quotation_id =
              p_quotation_id

          and qr.revision_status =
              'Draft'

          and qr.is_active = true
          and qr.is_deleted = false
    ) then

        raise exception
            'This Quotation already has a Draft Revision.';

    end if;


    /* ========================================================================
    Resolve Source Snapshot
    ======================================================================== */

    if v_quotation.quotation_status =
       'Sent' then

        if v_quotation.current_revision_id
           is not null then

            raise exception
                'Sent Quotation unexpectedly contains a current Revision pointer.';

        end if;


        v_source_revision_id := null;

        v_customer_id :=
            v_quotation.customer_id;

        v_project_site_id :=
            v_quotation.project_site_id;

        v_price_book_id :=
            v_quotation.price_book_id;

        v_quotation_segment :=
            v_quotation.quotation_segment;

        v_quotation_source :=
            v_quotation.quotation_source;

        v_issue_date :=
            v_quotation.issue_date;

        v_valid_until :=
            v_quotation.valid_until;

        v_notes :=
            v_quotation.notes;

        v_internal_notes :=
            v_quotation.internal_notes;

        v_subtotal_amount :=
            v_quotation.subtotal_amount;

        v_discount_amount :=
            v_quotation.discount_amount;

        v_tax_amount :=
            v_quotation.tax_amount;

        v_total_amount :=
            v_quotation.total_amount;


    else

        if v_quotation.current_revision_id
           is null then

            raise exception
                'Revised Quotation does not have a current Revision.';

        end if;


        select qr.*
        into v_source_revision

        from public.quotation_revisions qr

        where qr.revision_id =
              v_quotation.current_revision_id

          and qr.quotation_id =
              p_quotation_id

          and qr.is_active = true
          and qr.is_deleted = false

        for update;


        if not found then
            raise exception
                'Current Revision was not found.';
        end if;


        if v_source_revision.revision_status
           <> 'Sent' then

            raise exception
                'A new Revision may only be created from the current Sent Revision.';

        end if;


        v_source_revision_id :=
            v_source_revision.revision_id;

        v_customer_id :=
            v_source_revision.customer_id;

        v_project_site_id :=
            v_source_revision.project_site_id;

        v_price_book_id :=
            v_source_revision.price_book_id;

        v_quotation_segment :=
            v_source_revision.quotation_segment;

        v_quotation_source :=
            v_source_revision.quotation_source;

        v_issue_date :=
            v_source_revision.issue_date;

        v_valid_until :=
            v_source_revision.valid_until;

        v_notes :=
            v_source_revision.notes;

        v_internal_notes :=
            v_source_revision.internal_notes;

        v_subtotal_amount :=
            v_source_revision.subtotal_amount;

        v_discount_amount :=
            v_source_revision.discount_amount;

        v_tax_amount :=
            v_source_revision.tax_amount;

        v_total_amount :=
            v_source_revision.total_amount;

    end if;


    /* ========================================================================
    Next Revision Number
    ======================================================================== */

    select
        coalesce(
            max(qr.revision_no),
            0
        ) + 1

    into v_new_revision_no

    from public.quotation_revisions qr

    where qr.quotation_id =
          p_quotation_id;


    /* ========================================================================
    Create Revision Header
    ======================================================================== */

    insert into public.quotation_revisions (
        quotation_id,
        revision_no,

        revision_reason,
        revision_notes,

        subtotal_amount,
        discount_amount,
        tax_amount,
        total_amount,

        revision_status,

        issued_at,
        issued_by,

        customer_id,
        project_site_id,
        price_book_id,

        quotation_segment,
        quotation_source,

        issue_date,
        valid_until,

        notes,
        internal_notes,

        created_by,
        updated_by
    )
    values (
        p_quotation_id,
        v_new_revision_no,

        nullif(
            btrim(p_revision_reason),
            ''
        ),

        nullif(
            btrim(p_revision_notes),
            ''
        ),

        v_subtotal_amount,
        v_discount_amount,
        v_tax_amount,
        v_total_amount,

        'Draft',

        null,
        null,

        v_customer_id,
        v_project_site_id,
        v_price_book_id,

        v_quotation_segment,
        v_quotation_source,

        v_issue_date,
        v_valid_until,

        v_notes,
        v_internal_notes,

        v_user_id,
        v_user_id
    )

    returning revision_id
    into v_new_revision_id;


    /* ========================================================================
    Copy Source Lines
    ======================================================================== */

    if v_source_revision_id is null then

        /* --------------------------------------------------------------------
        FIRST REVISION — source Base Quotation
        -------------------------------------------------------------------- */

        insert into public.quotation_revision_lines (
            revision_id,
            quotation_line_id,
            line_no,

            product_id,
            project_area_id,

            description,
            unit_of_measure,

            quantity,
            unit_price,

            discount_percent,
            discount_amount,
            discount_reason,

            tax_rate,
            tax_amount,
            line_total,

            cost_price,
            margin_amount,
            margin_percent,

            notes,

            sales_uom_code,
            base_uom_code,
            conversion_factor,
            base_quantity,
            allow_fractional_quantity,

            is_optional,
            is_deleted,

            line_uid,
            billing_method,

            price_book_id,
            price_book_line_id,
            price_source,

            original_unit_price,
            minimum_price_snapshot,

            manual_price_reason,

            created_by,
            updated_by
        )
        select
            v_new_revision_id,
            ql.quotation_line_id,
            ql.line_no,

            ql.product_id,
            ql.project_area_id,

            ql.description,
            ql.unit_of_measure,

            ql.quantity,
            ql.unit_price,

            ql.discount_percent,
            ql.discount_amount,
            ql.discount_reason,

            ql.tax_rate,
            ql.tax_amount,
            ql.line_total,

            ql.cost_price,
            ql.margin_amount,
            ql.margin_percent,

            ql.notes,

            ql.sales_uom_code,
            ql.base_uom_code,
            ql.conversion_factor,
            ql.base_quantity,
            ql.allow_fractional_quantity,

            ql.is_optional,
            false,

            ql.line_uid,
            ql.billing_method,

            ql.price_book_id,
            ql.price_book_line_id,
            ql.price_source,

            ql.original_unit_price,
            ql.minimum_price_snapshot,

            ql.manual_price_reason,

            v_user_id,
            v_user_id

        from public.quotation_lines ql

        where ql.quotation_id =
              p_quotation_id

          and ql.is_deleted = false

        order by ql.line_no;


    else

        /* --------------------------------------------------------------------
        LATER REVISION — source previous Sent Revision
        -------------------------------------------------------------------- */

        insert into public.quotation_revision_lines (
            revision_id,
            quotation_line_id,
            line_no,

            product_id,
            project_area_id,

            description,
            unit_of_measure,

            quantity,
            unit_price,

            discount_percent,
            discount_amount,
            discount_reason,

            tax_rate,
            tax_amount,
            line_total,

            cost_price,
            margin_amount,
            margin_percent,

            notes,

            sales_uom_code,
            base_uom_code,
            conversion_factor,
            base_quantity,
            allow_fractional_quantity,

            is_optional,
            is_deleted,

            line_uid,
            billing_method,

            price_book_id,
            price_book_line_id,
            price_source,

            original_unit_price,
            minimum_price_snapshot,

            manual_price_reason,

            created_by,
            updated_by
        )
        select
            v_new_revision_id,
            qrl.quotation_line_id,
            qrl.line_no,

            qrl.product_id,
            qrl.project_area_id,

            qrl.description,
            qrl.unit_of_measure,

            qrl.quantity,
            qrl.unit_price,

            qrl.discount_percent,
            qrl.discount_amount,
            qrl.discount_reason,

            qrl.tax_rate,
            qrl.tax_amount,
            qrl.line_total,

            qrl.cost_price,
            qrl.margin_amount,
            qrl.margin_percent,

            qrl.notes,

            qrl.sales_uom_code,
            qrl.base_uom_code,
            qrl.conversion_factor,
            qrl.base_quantity,
            qrl.allow_fractional_quantity,

            qrl.is_optional,
            false,

            qrl.line_uid,
            qrl.billing_method,

            qrl.price_book_id,
            qrl.price_book_line_id,
            qrl.price_source,

            qrl.original_unit_price,
            qrl.minimum_price_snapshot,

            qrl.manual_price_reason,

            v_user_id,
            v_user_id

        from public.quotation_revision_lines qrl

        where qrl.revision_id =
              v_source_revision_id

          and qrl.is_deleted = false

        order by qrl.line_no;

    end if;


    get diagnostics
        v_line_count = row_count;


    if v_line_count = 0 then
        raise exception
            'Source Quotation or Revision does not contain active lines.';
    end if;


    /* ========================================================================
    Parent Pointer

    Keep parent status Sent while Draft Revision is being edited.
    ======================================================================== */

    update public.quotations

    set
        current_revision_id =
            v_new_revision_id,

        revision_no =
            v_new_revision_no,

        updated_by =
            v_user_id

    where quotation_id =
          p_quotation_id;


    /*
    Runs deferred pointer / discount validation now.
    */

    set constraints all immediate;


    return jsonb_build_object(
        'quotation_id',
            p_quotation_id,

        'quotation_no',
            v_quotation.quotation_no,

        'revision_id',
            v_new_revision_id,

        'revision_no',
            v_new_revision_no,

        'revision_status',
            'Draft',

        'source_revision_id',
            v_source_revision_id,

        'line_count',
            v_line_count,

        'subtotal_amount',
            v_subtotal_amount,

        'discount_amount',
            v_discount_amount,

        'tax_amount',
            v_tax_amount,

        'total_amount',
            v_total_amount
    );

end;
$function$;
-- get_product_uom_factor_to_base(p_product_id uuid, p_uom_code text)
CREATE OR REPLACE FUNCTION public.get_product_uom_factor_to_base(p_product_id uuid, p_uom_code text)
 RETURNS TABLE(product_id uuid, uom_code text, base_uom_code text, conversion_to_base numeric, allow_fractional_quantity boolean, is_base_unit boolean)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
declare
    v_uom_code text;
    v_base_uom_code text;
begin
    if auth.uid() is null then
        raise exception 'Authentication is required.';
    end if;

    if p_product_id is null then
        raise exception 'Product is required.';
    end if;

    v_uom_code := nullif(btrim(p_uom_code), '');

    if v_uom_code is null then
        raise exception 'Product UOM is required.';
    end if;


    /* --------------------------------------------------------
    Product must exist and be operational.
    -------------------------------------------------------- */

    select p.base_uom_code
    into v_base_uom_code
    from public.products p
    where p.product_id = p_product_id
      and p.is_active = true
      and p.is_deleted = false;

    if not found then
        raise exception
            'Selected Product is missing, inactive, or deleted.';
    end if;


    /* --------------------------------------------------------
    Authoritative source = product_units ONLY.
    -------------------------------------------------------- */

    return query
    select
        pu.product_id,
        pu.uom_code,
        v_base_uom_code,
        pu.conversion_to_base,
        pu.allow_fractional_quantity,
        pu.is_base_unit

    from public.product_units pu

    where pu.product_id = p_product_id
      and pu.uom_code = v_uom_code
      and pu.is_active = true
      and pu.is_deleted = false

    limit 1;


    if not found then
        raise exception
            'UOM % is not an active Supported UOM for the selected Product.',
            v_uom_code;
    end if;
end;
$function$;
-- get_quotation_revision_inherited_discount_snapshot(p_revision_id uuid, p_line_uid uuid, p_quotation_line_id uuid, p_line_no integer)
CREATE OR REPLACE FUNCTION public.get_quotation_revision_inherited_discount_snapshot(p_revision_id uuid, p_line_uid uuid, p_quotation_line_id uuid, p_line_no integer)
 RETURNS TABLE(source_kind text, source_revision_id uuid, source_line_id uuid, source_discount_percent numeric, source_discount_reason text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$

declare
    v_revision public.quotation_revisions%rowtype;

    v_source_revision_id uuid;

begin

    if auth.uid() is null then
        raise exception
            'Authentication is required.';
    end if;


    if p_revision_id is null then
        raise exception
            'Quotation Revision ID is required.';
    end if;


    /* ========================================================================
    Load current Revision
    ======================================================================== */

    select qr.*
    into v_revision

    from public.quotation_revisions qr

    where qr.revision_id =
          p_revision_id

      and qr.is_active = true
      and qr.is_deleted = false;


    if not found then
        raise exception
            'Quotation Revision was not found, is inactive, or is deleted.';
    end if;


    /* ========================================================================
    Find previous Sent Revision

    If none exists:
        source = Base Quotation
    ======================================================================== */

    select previous_revision.revision_id
    into v_source_revision_id

    from public.quotation_revisions previous_revision

    where previous_revision.quotation_id =
          v_revision.quotation_id

      and previous_revision.revision_id <>
          v_revision.revision_id

      and previous_revision.revision_no <
          v_revision.revision_no

      and previous_revision.revision_status =
          'Sent'

      and previous_revision.is_active = true
      and previous_revision.is_deleted = false

    order by
        previous_revision.revision_no desc

    limit 1;


    /* ========================================================================
    SOURCE = PREVIOUS SENT REVISION
    ======================================================================== */

    if v_source_revision_id is not null then

        /*
        1. line_uid
        */

        if p_line_uid is not null then

            return query

            select
                'Revision'::text,

                v_source_revision_id,

                qrl.revision_line_id,

                qrl.discount_percent,

                nullif(
                    btrim(
                        coalesce(
                            qrl.discount_reason,
                            ''
                        )
                    ),
                    ''
                )

            from public.quotation_revision_lines qrl

            where qrl.revision_id =
                  v_source_revision_id

              and qrl.line_uid =
                  p_line_uid

              and qrl.is_deleted = false

            limit 1;


            if found then
                return;
            end if;

        end if;


        /*
        2. quotation_line_id
        */

        if p_quotation_line_id is not null then

            return query

            select
                'Revision'::text,

                v_source_revision_id,

                qrl.revision_line_id,

                qrl.discount_percent,

                nullif(
                    btrim(
                        coalesce(
                            qrl.discount_reason,
                            ''
                        )
                    ),
                    ''
                )

            from public.quotation_revision_lines qrl

            where qrl.revision_id =
                  v_source_revision_id

              and qrl.quotation_line_id =
                  p_quotation_line_id

              and qrl.is_deleted = false

            limit 1;


            if found then
                return;
            end if;

        end if;


        /*
        3. line_no legacy fallback
        */

        if p_line_no is not null then

            return query

            select
                'Revision'::text,

                v_source_revision_id,

                qrl.revision_line_id,

                qrl.discount_percent,

                nullif(
                    btrim(
                        coalesce(
                            qrl.discount_reason,
                            ''
                        )
                    ),
                    ''
                )

            from public.quotation_revision_lines qrl

            where qrl.revision_id =
                  v_source_revision_id

              and qrl.line_no =
                  p_line_no

              and qrl.is_deleted = false

            limit 1;


            if found then
                return;
            end if;

        end if;


        /*
        No matching inherited source line.
        This is a NEW Revision line.
        */

        return;

    end if;


    /* ========================================================================
    SOURCE = BASE QUOTATION
    ======================================================================== */

    /*
    1. line_uid
    */

    if p_line_uid is not null then

        return query

        select
            'Quotation'::text,

            null::uuid,

            ql.quotation_line_id,

            ql.discount_percent,

            nullif(
                btrim(
                    coalesce(
                        ql.discount_reason,
                        ''
                    )
                ),
                ''
            )

        from public.quotation_lines ql

        where ql.quotation_id =
              v_revision.quotation_id

          and ql.line_uid =
              p_line_uid

          and ql.is_deleted = false

        limit 1;


        if found then
            return;
        end if;

    end if;


    /*
    2. Exact Base quotation_line_id
    */

    if p_quotation_line_id is not null then

        return query

        select
            'Quotation'::text,

            null::uuid,

            ql.quotation_line_id,

            ql.discount_percent,

            nullif(
                btrim(
                    coalesce(
                        ql.discount_reason,
                        ''
                    )
                ),
                ''
            )

        from public.quotation_lines ql

        where ql.quotation_id =
              v_revision.quotation_id

          and ql.quotation_line_id =
              p_quotation_line_id

          and ql.is_deleted = false

        limit 1;


        if found then
            return;
        end if;

    end if;


    /*
    3. line_no legacy fallback
    */

    if p_line_no is not null then

        return query

        select
            'Quotation'::text,

            null::uuid,

            ql.quotation_line_id,

            ql.discount_percent,

            nullif(
                btrim(
                    coalesce(
                        ql.discount_reason,
                        ''
                    )
                ),
                ''
            )

        from public.quotation_lines ql

        where ql.quotation_id =
              v_revision.quotation_id

          and ql.line_no =
              p_line_no

          and ql.is_deleted = false

        limit 1;


        if found then
            return;
        end if;

    end if;


    return;

end;
$function$;
-- get_quotation_revision_send_price_changes(p_revision_id uuid)
CREATE OR REPLACE FUNCTION public.get_quotation_revision_send_price_changes(p_revision_id uuid)
 RETURNS TABLE(revision_line_id uuid, line_uid uuid, line_no integer, product_id uuid, product_code text, sales_uom_code text, snapshot_unit_price numeric, current_unit_price numeric, snapshot_minimum_price numeric, current_minimum_price numeric, snapshot_price_book_line_id uuid, current_price_book_line_id uuid, price_change_amount numeric, price_change_percent numeric, change_status text, detail text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$

declare
    v_revision
        public.quotation_revisions%rowtype;

    v_line
        public.quotation_revision_lines%rowtype;

    v_product_code text;

    v_snapshot_price numeric;

    v_current record;

begin

    if auth.uid() is null then
        raise exception
            'Authentication is required.';
    end if;


    if p_revision_id is null then
        raise exception
            'Quotation Revision ID is required.';
    end if;


    select qr.*
    into v_revision

    from public.quotation_revisions qr

    where qr.revision_id =
          p_revision_id

      and qr.is_active = true
      and qr.is_deleted = false;


    if not found then
        raise exception
            'Quotation Revision was not found, is inactive, or is deleted.';
    end if;


    if v_revision.revision_status <>
       'Draft' then

        raise exception
            'Send price comparison is only available for a Draft Revision.';

    end if;


    for v_line in

        select qrl.*

        from public.quotation_revision_lines qrl

        where qrl.revision_id =
              p_revision_id

          and qrl.product_id is not null

          and qrl.is_deleted = false

        order by
            qrl.line_no

    loop

        select p.product_code
        into v_product_code

        from public.products p

        where p.product_id =
              v_line.product_id;


        v_snapshot_price :=
            round(
                coalesce(
                    v_line.original_unit_price,
                    v_line.unit_price
                ),
                2
            );


        begin

            select *
            into v_current

            from public.resolve_product_transaction_price(
                coalesce(
                    v_line.price_book_id,
                    v_revision.price_book_id
                ),

                v_line.product_id,

                v_line.sales_uom_code,

                current_date
            );


            return query

            select
                v_line.revision_line_id,

                v_line.line_uid,

                v_line.line_no,

                v_line.product_id,

                v_product_code,

                v_line.sales_uom_code,

                v_snapshot_price,

                round(
                    v_current.transaction_unit_price,
                    2
                ),

                v_line.minimum_price_snapshot,

                case
                    when
                        v_current.transaction_minimum_price
                        is null
                    then null

                    else round(
                        v_current.transaction_minimum_price,
                        2
                    )
                end,

                v_line.price_book_line_id,

                v_current.price_book_line_id,

                round(
                    v_current.transaction_unit_price
                    - v_snapshot_price,
                    2
                ),

                case
                    when v_snapshot_price = 0
                    then null

                    else round(
                        (
                            v_current.transaction_unit_price
                            - v_snapshot_price
                        )
                        /
                        v_snapshot_price
                        * 100,
                        4
                    )
                end,

                case

                    when round(
                        v_current.transaction_unit_price,
                        2
                    ) =
                    v_snapshot_price
                    then
                        'CURRENT'

                    else
                        'PRICE_CHANGED'

                end,

                case

                    when round(
                        v_current.transaction_unit_price,
                        2
                    ) =
                    v_snapshot_price
                    then
                        'Draft Revision Product price matches the current Product Price Matrix.'

                    else
                        'Draft Revision Product price snapshot differs from the current Product Price Matrix.'

                end;

        exception
            when others then

                return query

                select
                    v_line.revision_line_id,

                    v_line.line_uid,

                    v_line.line_no,

                    v_line.product_id,

                    v_product_code,

                    v_line.sales_uom_code,

                    v_snapshot_price,

                    null::numeric,

                    v_line.minimum_price_snapshot,

                    null::numeric,

                    v_line.price_book_line_id,

                    null::uuid,

                    null::numeric,

                    null::numeric,

                    'PRICING_ERROR'::text,

                    sqlerrm::text;

        end;

    end loop;

end;
$function$;
-- get_quotation_send_price_changes(p_quotation_id uuid)
CREATE OR REPLACE FUNCTION public.get_quotation_send_price_changes(p_quotation_id uuid)
 RETURNS TABLE(quotation_line_id uuid, line_uid uuid, line_no integer, product_id uuid, product_code text, sales_uom_code text, snapshot_unit_price numeric, current_unit_price numeric, snapshot_minimum_price numeric, current_minimum_price numeric, snapshot_price_book_line_id uuid, current_price_book_line_id uuid, price_change_amount numeric, price_change_percent numeric, change_status text, detail text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$

declare
    v_quotation
        public.quotations%rowtype;

    v_line
        public.quotation_lines%rowtype;

    v_product_code text;

    v_snapshot_price numeric;

    v_current record;

begin

    if auth.uid() is null then
        raise exception
            'Authentication is required.';
    end if;


    if p_quotation_id is null then
        raise exception
            'Quotation ID is required.';
    end if;


    select q.*
    into v_quotation

    from public.quotations q

    where q.quotation_id =
          p_quotation_id

      and q.is_active = true
      and q.is_deleted = false;


    if not found then
        raise exception
            'Quotation was not found, is inactive, or is deleted.';
    end if;


    /*
    This reader is intended for Draft send preparation.
    */

    if v_quotation.quotation_status <>
       'Draft' then

        raise exception
            'Send price comparison is only available for a Draft Quotation.';

    end if;


    for v_line in

        select ql.*

        from public.quotation_lines ql

        where ql.quotation_id =
              p_quotation_id

          and ql.product_id is not null

          and ql.is_deleted = false

        order by
            ql.line_no

    loop

        select p.product_code
        into v_product_code

        from public.products p

        where p.product_id =
              v_line.product_id;


        /*
        original_unit_price is the Product Price snapshot basis.

        Legacy fallback:
            unit_price
        */

        v_snapshot_price :=
            round(
                coalesce(
                    v_line.original_unit_price,
                    v_line.unit_price
                ),
                2
            );


        begin

            select *
            into v_current

            from public.resolve_product_transaction_price(
                coalesce(
                    v_line.price_book_id,
                    v_quotation.price_book_id
                ),

                v_line.product_id,

                v_line.sales_uom_code,

                current_date
            );


            return query

            select
                v_line.quotation_line_id,

                v_line.line_uid,

                v_line.line_no,

                v_line.product_id,

                v_product_code,

                v_line.sales_uom_code,

                v_snapshot_price,

                round(
                    v_current.transaction_unit_price,
                    2
                ),

                v_line.minimum_price_snapshot,

                case
                    when
                        v_current.transaction_minimum_price
                        is null
                    then null

                    else round(
                        v_current.transaction_minimum_price,
                        2
                    )
                end,

                v_line.price_book_line_id,

                v_current.price_book_line_id,

                round(
                    v_current.transaction_unit_price
                    - v_snapshot_price,
                    2
                ),

                case
                    when v_snapshot_price = 0
                    then null

                    else round(
                        (
                            v_current.transaction_unit_price
                            - v_snapshot_price
                        )
                        /
                        v_snapshot_price
                        * 100,
                        4
                    )
                end,

                case

                    when round(
                        v_current.transaction_unit_price,
                        2
                    ) =
                    v_snapshot_price
                    then
                        'CURRENT'

                    else
                        'PRICE_CHANGED'

                end,

                case

                    when round(
                        v_current.transaction_unit_price,
                        2
                    ) =
                    v_snapshot_price
                    then
                        'Draft Product price matches the current Product Price Matrix.'

                    else
                        'Draft Product price snapshot differs from the current Product Price Matrix.'

                end;

        exception
            when others then

                return query

                select
                    v_line.quotation_line_id,

                    v_line.line_uid,

                    v_line.line_no,

                    v_line.product_id,

                    v_product_code,

                    v_line.sales_uom_code,

                    v_snapshot_price,

                    null::numeric,

                    v_line.minimum_price_snapshot,

                    null::numeric,

                    v_line.price_book_line_id,

                    null::uuid,

                    null::numeric,

                    null::numeric,

                    'PRICING_ERROR'::text,

                    sqlerrm::text;

        end;

    end loop;

end;
$function$;
-- guard_quotation_product_discount()
CREATE OR REPLACE FUNCTION public.guard_quotation_product_discount()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$

declare
    v_quotation_status text;

    v_discount numeric;

    v_reason text;

    v_max_discount numeric;

begin

    select q.quotation_status
    into v_quotation_status

    from public.quotations q

    where q.quotation_id =
          new.quotation_id;


    if not found then
        raise exception
            'Parent Quotation was not found.';
    end if;


    /* ------------------------------------------------------------------------
    Historical commercial snapshot immutable
    ------------------------------------------------------------------------ */

    if v_quotation_status <> 'Draft' then

        if tg_op = 'UPDATE'
           and (
                new.discount_percent
                    is distinct from old.discount_percent

                or new.discount_amount
                    is distinct from old.discount_amount

                or new.discount_reason
                    is distinct from old.discount_reason
           )
        then

            raise exception
                'Quotation discount snapshot is immutable after Draft.';

        end if;


        return new;

    end if;


    v_discount :=
        coalesce(
            new.discount_percent,
            0
        );


    v_reason :=
        nullif(
            btrim(
                coalesce(
                    new.discount_reason,
                    ''
                )
            ),
            ''
        );


    if v_discount < 0
       or v_discount > 100 then

        raise exception
            'Discount Percent must be between 0 and 100.';

    end if;


    /* ------------------------------------------------------------------------
    Existing approved discount unchanged.

    discount_amount may change because:
        quantity changed
        list price changed

    No new approval is required.
    ------------------------------------------------------------------------ */

    if tg_op = 'UPDATE'
       and new.discount_percent
           is not distinct from
           old.discount_percent

       and v_reason
           is not distinct from

           nullif(
               btrim(
                   coalesce(
                       old.discount_reason,
                       ''
                   )
               ),
               ''
           )
    then

        new.discount_reason :=
            v_reason;

        return new;

    end if;


    /* ------------------------------------------------------------------------
    Zero Discount
    ------------------------------------------------------------------------ */

    if v_discount = 0 then

        new.discount_percent := 0;
        new.discount_reason := null;

        return new;

    end if;


    /* ------------------------------------------------------------------------
    New / changed positive Discount
    ------------------------------------------------------------------------ */

    if not public.has_permission(
        'quotations.apply_discount'
    ) then

        raise exception
            'Permission quotations.apply_discount is required to apply or change a Quotation discount.';

    end if;


    if v_reason is null then

        raise exception
            'Discount Reason is required when Quotation discount is greater than zero.';

    end if;


    if new.product_id is not null then

        select p.maximum_discount_percent
        into v_max_discount

        from public.products p

        where p.product_id =
              new.product_id

          and p.is_active = true
          and p.is_deleted = false;


        if not found then
            raise exception
                'Selected Product is missing, inactive, or deleted.';
        end if;


        v_max_discount :=
            coalesce(
                v_max_discount,
                0
            );


        if v_discount >
           v_max_discount then

            raise exception
                'Discount Percent % exceeds the Product maximum discount of %%%.',
                v_discount,
                v_max_discount;

        end if;

    end if;


    new.discount_percent :=
        v_discount;

    new.discount_reason :=
        v_reason;


    return new;

end;
$function$;
-- guard_quotation_revision_product_discount()
CREATE OR REPLACE FUNCTION public.guard_quotation_revision_product_discount()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$

declare
    v_revision_status text;

    v_discount numeric;
    v_reason text;

    v_max_discount numeric;

    v_previous_draft record;
    v_source record;

    v_is_exact_draft_carry boolean := false;
    v_is_exact_inherited boolean := false;

begin

    /* ------------------------------------------------------------------------
    Parent Revision
    ------------------------------------------------------------------------ */

    select qr.revision_status
    into v_revision_status

    from public.quotation_revisions qr

    where qr.revision_id =
          new.revision_id;


    if not found then
        raise exception
            'Parent Quotation Revision was not found.';
    end if;


    /* ------------------------------------------------------------------------
    Historical snapshot immutable
    ------------------------------------------------------------------------ */

    if v_revision_status <> 'Draft' then

        if tg_op = 'UPDATE'
           and (
                new.discount_percent
                    is distinct from old.discount_percent

                or new.discount_amount
                    is distinct from old.discount_amount

                or new.discount_reason
                    is distinct from old.discount_reason
           )
        then
            raise exception
                'Quotation Revision discount snapshot is immutable after Draft.';
        end if;


        return new;

    end if;


    /* ------------------------------------------------------------------------
    Normalize
    ------------------------------------------------------------------------ */

    v_discount :=
        coalesce(
            new.discount_percent,
            0
        );


    v_reason :=
        nullif(
            btrim(
                coalesce(
                    new.discount_reason,
                    ''
                )
            ),
            ''
        );


    if v_discount < 0
       or v_discount > 100 then

        raise exception
            'Discount Percent must be between 0 and 100.';

    end if;


    /* ------------------------------------------------------------------------
    UPDATE with unchanged discount terms
    ------------------------------------------------------------------------ */

    if tg_op = 'UPDATE'
       and new.discount_percent
           is not distinct from old.discount_percent

       and nullif(
               btrim(
                   coalesce(
                       new.discount_reason,
                       ''
                   )
               ),
               ''
           )
           is not distinct from
           nullif(
               btrim(
                   coalesce(
                       old.discount_reason,
                       ''
                   )
               ),
               ''
           )
    then

        new.discount_reason :=
            v_reason;

        return new;

    end if;


    /* ------------------------------------------------------------------------
    INSERT replacement:
    exact previous Draft row with same line_uid is allowed.

    This supports ordinary Draft replacement without re-approving an
    already-approved Draft discount.
    ------------------------------------------------------------------------ */

    if tg_op = 'INSERT'
       and new.line_uid is not null then

        select
            qrl.discount_percent,
            nullif(
                btrim(
                    coalesce(
                        qrl.discount_reason,
                        ''
                    )
                ),
                ''
            ) as discount_reason

        into v_previous_draft

        from public.quotation_revision_lines qrl

        where qrl.revision_id =
              new.revision_id

          and qrl.line_uid =
              new.line_uid

          and qrl.is_deleted = true

        order by
            qrl.deleted_at desc nulls last,
            qrl.updated_at desc,
            qrl.created_at desc

        limit 1;


        if found
           and v_discount
               is not distinct from
               coalesce(
                   v_previous_draft.discount_percent,
                   0
               )

           and v_reason
               is not distinct from
               v_previous_draft.discount_reason
        then

            v_is_exact_draft_carry := true;

        end if;

    end if;


    if v_is_exact_draft_carry then

        new.discount_percent :=
            v_discount;

        new.discount_reason :=
            v_reason;

        return new;

    end if;


    /* ------------------------------------------------------------------------
    Exact inherited Sent source
    ------------------------------------------------------------------------ */

    select *
    into v_source

    from public.get_quotation_revision_inherited_discount_snapshot(
        new.revision_id,
        new.line_uid,
        new.quotation_line_id,
        new.line_no
    );


    if found
       and v_discount
           is not distinct from
           coalesce(
               v_source.source_discount_percent,
               0
           )

       and v_reason
           is not distinct from
           v_source.source_discount_reason
    then

        v_is_exact_inherited := true;

    end if;


    if v_is_exact_inherited then

        new.discount_percent :=
            coalesce(
                v_source.source_discount_percent,
                0
            );

        new.discount_reason :=
            v_source.source_discount_reason;

        return new;

    end if;


    /* ------------------------------------------------------------------------
    No Discount
    ------------------------------------------------------------------------ */

    if v_discount = 0 then

        new.discount_percent := 0;
        new.discount_reason := null;

        return new;

    end if;


    /* ------------------------------------------------------------------------
    New / changed positive Discount
    ------------------------------------------------------------------------ */

    if not public.has_permission(
        'quotations.apply_discount'
    ) then

        raise exception
            'Permission quotations.apply_discount is required to apply or change a Quotation Revision discount.';

    end if;


    if v_reason is null then

        raise exception
            'Discount Reason is required when a new or changed Quotation Revision discount is greater than zero.';

    end if;


    /* ------------------------------------------------------------------------
    Product Maximum
    ------------------------------------------------------------------------ */

    if new.product_id is not null then

        select p.maximum_discount_percent
        into v_max_discount

        from public.products p

        where p.product_id =
              new.product_id

          and p.is_active = true
          and p.is_deleted = false;


        if not found then
            raise exception
                'Selected Product is missing, inactive, or deleted.';
        end if;


        v_max_discount :=
            coalesce(
                v_max_discount,
                0
            );


        if v_discount >
           v_max_discount then

            raise exception
                'Discount Percent % exceeds the Product maximum discount of %%%.',
                v_discount,
                v_max_discount;

        end if;

    end if;


    new.discount_percent :=
        v_discount;

    new.discount_reason :=
        v_reason;


    return new;

end;
$function$;
-- guard_quotation_revision_send_current_price()
CREATE OR REPLACE FUNCTION public.guard_quotation_revision_send_current_price()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
begin

    /*
    Only Draft -> Sent transition.
    */

    if old.revision_status =
       'Draft'

       and new.revision_status =
           'Sent'
    then

        perform
            public.assert_quotation_revision_send_price_current(
                new.revision_id
            );

    end if;


    return new;

end;
$function$;
-- guard_quotation_send_current_price()
CREATE OR REPLACE FUNCTION public.guard_quotation_send_current_price()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
begin

    /*
    Only Draft -> Sent transition.
    */

    if old.quotation_status =
       'Draft'

       and new.quotation_status =
           'Sent'
    then

        perform
            public.assert_quotation_send_price_current(
                new.quotation_id
            );

    end if;


    return new;

end;
$function$;
-- resolve_product_transaction_price(p_price_book_id uuid, p_product_id uuid, p_transaction_uom_code text, p_pricing_date date)
CREATE OR REPLACE FUNCTION public.resolve_product_transaction_price(p_price_book_id uuid, p_product_id uuid, p_transaction_uom_code text, p_pricing_date date DEFAULT CURRENT_DATE)
 RETURNS TABLE(price_book_id uuid, price_book_code text, price_book_name text, product_id uuid, pricing_uom_code text, pricing_uom_factor_to_base numeric, transaction_uom_code text, transaction_uom_factor_to_base numeric, transaction_allow_fractional_quantity boolean, price_book_line_id uuid, pricing_uom_unit_price numeric, pricing_uom_minimum_price numeric, transaction_unit_price numeric, transaction_minimum_price numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
declare
    v_transaction_uom_code text;

    v_pricing_uom_code text;

    v_pricing_factor numeric(18,6);
    v_transaction_factor numeric(18,6);
    v_transaction_allow_fractional boolean;

    v_price_book_code text;
    v_price_book_name text;

    v_price_book_line_id uuid;

    v_pricing_unit_price numeric;
    v_pricing_minimum_price numeric;
begin
    /* ----------------------------------------------------------------
    Authentication
    ---------------------------------------------------------------- */

    if auth.uid() is null then
        raise exception 'Authentication is required.';
    end if;


    /* ----------------------------------------------------------------
    Required input
    ---------------------------------------------------------------- */

    if p_price_book_id is null then
        raise exception 'Price Book is required.';
    end if;

    if p_product_id is null then
        raise exception 'Product is required.';
    end if;

    v_transaction_uom_code :=
        nullif(btrim(p_transaction_uom_code), '');

    if v_transaction_uom_code is null then
        raise exception 'Transaction UOM is required.';
    end if;

    if p_pricing_date is null then
        raise exception 'Pricing Date is required.';
    end if;


    /* ----------------------------------------------------------------
    Price Book
    ---------------------------------------------------------------- */

    select
        pb.price_book_code,
        pb.price_book_name

    into
        v_price_book_code,
        v_price_book_name

    from public.price_books pb

    where pb.price_book_id = p_price_book_id
      and pb.is_active = true
      and pb.is_deleted = false

      and (
          pb.effective_from is null
          or pb.effective_from <= p_pricing_date
      )

      and (
          pb.effective_to is null
          or pb.effective_to >= p_pricing_date
      );


    if not found then
        raise exception
            'Selected Price Book is inactive, deleted, unavailable, or not effective on %.',
            p_pricing_date;
    end if;


    /* ----------------------------------------------------------------
    Product Pricing UOM
    ---------------------------------------------------------------- */

    select p.pricing_uom_code
    into v_pricing_uom_code

    from public.products p

    where p.product_id = p_product_id
      and p.is_active = true
      and p.is_deleted = false;


    if not found then
        raise exception
            'Selected Product is missing, inactive, or deleted.';
    end if;


    if v_pricing_uom_code is null then
        raise exception
            'Product Pricing UOM has not been configured.';
    end if;


    /* ----------------------------------------------------------------
    Pricing-UOM Factor-to-Base
    Authoritative source = product_units
    ---------------------------------------------------------------- */

    select pu.conversion_to_base
    into v_pricing_factor

    from public.product_units pu

    where pu.product_id = p_product_id
      and pu.uom_code = v_pricing_uom_code
      and pu.is_active = true
      and pu.is_deleted = false;


    if v_pricing_factor is null
       or v_pricing_factor <= 0 then
        raise exception
            'Product Pricing UOM % does not have a valid active Factor-to-Base.',
            v_pricing_uom_code;
    end if;


    /* ----------------------------------------------------------------
    Transaction-UOM Factor-to-Base
    Authoritative source = product_units
    ---------------------------------------------------------------- */

    select
        pu.conversion_to_base,
        pu.allow_fractional_quantity

    into
        v_transaction_factor,
        v_transaction_allow_fractional

    from public.product_units pu

    where pu.product_id = p_product_id
      and pu.uom_code = v_transaction_uom_code
      and pu.is_active = true
      and pu.is_deleted = false;


    if v_transaction_factor is null
       or v_transaction_factor <= 0 then
        raise exception
            'Transaction UOM % is not an active Supported UOM with a valid Factor-to-Base.',
            v_transaction_uom_code;
    end if;


    /* ----------------------------------------------------------------
    Pricing-UOM Price Book row

    NOTE:
    Exact lookup is now:
        Price Book + Product + Product Pricing UOM

    NOT:
        Price Book + Product + Transaction UOM
    ---------------------------------------------------------------- */

    select
        pbl.price_book_line_id,
        pbl.unit_price,
        pbl.minimum_price

    into
        v_price_book_line_id,
        v_pricing_unit_price,
        v_pricing_minimum_price

    from public.price_book_lines pbl

    where pbl.price_book_id = p_price_book_id
      and pbl.product_id = p_product_id
      and pbl.price_uom_code = v_pricing_uom_code

      and pbl.is_active = true
      and pbl.is_deleted = false

      and (
          pbl.effective_from is null
          or pbl.effective_from <= p_pricing_date
      )

      and (
          pbl.effective_to is null
          or pbl.effective_to >= p_pricing_date
      )

    order by
        pbl.effective_from desc nulls last,
        pbl.updated_at desc

    limit 1;


    if v_price_book_line_id is null then
        raise exception
            'No active Product Price Matrix price exists in Price Book % for Pricing UOM % on %.',
            v_price_book_name,
            v_pricing_uom_code,
            p_pricing_date;
    end if;


    /* ----------------------------------------------------------------
    Derived Transaction Price

    Transaction Unit Price
      = Pricing Unit Price
        × Transaction Factor-to-Base
        ÷ Pricing-UOM Factor-to-Base
    ---------------------------------------------------------------- */

    return query
    select
        p_price_book_id,
        v_price_book_code,
        v_price_book_name,

        p_product_id,

        v_pricing_uom_code,
        v_pricing_factor,

        v_transaction_uom_code,
        v_transaction_factor,
        v_transaction_allow_fractional,

        v_price_book_line_id,

        v_pricing_unit_price,
        v_pricing_minimum_price,

        round(
            v_pricing_unit_price
            * v_transaction_factor
            / v_pricing_factor,
            6
        ),

        case
            when v_pricing_minimum_price is null
                then null
            else
                round(
                    v_pricing_minimum_price
                    * v_transaction_factor
                    / v_pricing_factor,
                    6
                )
        end;
end;
$function$;
-- resolve_quotation_draft_product_line(p_quotation_id uuid, p_existing_line_uid uuid, p_existing_line_no integer, p_product_id uuid, p_sales_uom_code text, p_quantity numeric, p_discount_percent numeric, p_discount_reason text, p_price_book_id uuid, p_pricing_date date)
CREATE OR REPLACE FUNCTION public.resolve_quotation_draft_product_line(p_quotation_id uuid, p_existing_line_uid uuid, p_existing_line_no integer, p_product_id uuid, p_sales_uom_code text, p_quantity numeric, p_discount_percent numeric, p_discount_reason text, p_price_book_id uuid, p_pricing_date date)
 RETURNS TABLE(pricing_action text, quotation_line_id uuid, line_uid uuid, product_id uuid, sales_uom_code text, base_uom_code text, conversion_factor numeric, allow_fractional_quantity boolean, quantity numeric, base_quantity numeric, unit_price numeric, original_unit_price numeric, minimum_price_snapshot numeric, price_book_id uuid, price_book_line_id uuid, price_source text, discount_percent numeric, discount_reason text, maximum_discount_percent numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$

declare

    v_quotation public.quotations%rowtype;

    v_existing public.quotation_lines%rowtype;

    v_has_existing boolean := false;


    v_product_base_uom text;

    v_new_sales_uom text;

    v_new_factor numeric(18,6);

    v_new_allow_fractional boolean;


    v_old_factor numeric(18,6);

    v_old_base_quantity numeric(18,6);


    v_resolved_quantity numeric(18,6);

    v_resolved_base_quantity numeric(18,6);


    v_resolved_unit_price numeric;

    v_resolved_original_unit_price numeric;

    v_resolved_minimum_price numeric;


    v_resolved_price_book_line_id uuid;

    v_resolved_price_source text;


    v_discount record;

    v_current_price record;


    v_pricing_action text;

begin

    /* ========================================================================
    1. AUTHENTICATION
    ======================================================================== */

    if auth.uid() is null then
        raise exception
            'Authentication is required.';
    end if;


    /* ========================================================================
    2. REQUIRED INPUT
    ======================================================================== */

    if p_quotation_id is null then
        raise exception
            'Quotation ID is required.';
    end if;


    if p_product_id is null then
        raise exception
            'Product is required.';
    end if;


    v_new_sales_uom :=
        nullif(
            btrim(p_sales_uom_code),
            ''
        );


    if v_new_sales_uom is null then
        raise exception
            'Sales UOM is required.';
    end if;


    if p_quantity is null
       or p_quantity <= 0 then
        raise exception
            'Quantity must be greater than zero.';
    end if;


    if p_price_book_id is null then
        raise exception
            'Price Book is required.';
    end if;


    if p_pricing_date is null then
        raise exception
            'Pricing Date is required.';
    end if;


    /* ========================================================================
    3. LOCK DRAFT QUOTATION
    ======================================================================== */

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
            'Quotation does not exist, is inactive, or is deleted.';
    end if;


    if v_quotation.quotation_status <> 'Draft' then
        raise exception
            'Draft snapshot resolver may only be used with a Draft Quotation.';
    end if;


    if v_quotation.price_book_id
       is distinct from
       p_price_book_id then

        raise exception
            'Pricing resolver Price Book does not match the Draft Quotation Price Book.';
    end if;


    /* ========================================================================
    4. FIND EXISTING LINE

    line_uid is authoritative when available.

    line_no is fallback only for older Drafts.
    ======================================================================== */

    if p_existing_line_uid is not null then

        select ql.*
        into v_existing

        from public.quotation_lines ql

        where ql.quotation_id =
              p_quotation_id

          and ql.line_uid =
              p_existing_line_uid

          and ql.is_deleted = false

        limit 1

        for update;


        if found then
            v_has_existing := true;
        end if;

    end if;


    if not v_has_existing
       and p_existing_line_no is not null then

        select ql.*
        into v_existing

        from public.quotation_lines ql

        where ql.quotation_id =
              p_quotation_id

          and ql.line_no =
              p_existing_line_no

          and ql.is_deleted = false

        limit 1

        for update;


        if found then
            v_has_existing := true;
        end if;

    end if;


    /* ========================================================================
    5. CURRENT PRODUCT + SUPPORTED TRANSACTION UOM

    New UOM architecture:
        product_units.conversion_to_base
    is authoritative.
    ======================================================================== */

    select p.base_uom_code
    into v_product_base_uom

    from public.products p

    where p.product_id =
          p_product_id

      and p.is_active = true
      and p.is_deleted = false;


    if not found then
        raise exception
            'Selected Product is missing, inactive, or deleted.';
    end if;


    select
        pu.conversion_to_base,
        pu.allow_fractional_quantity

    into
        v_new_factor,
        v_new_allow_fractional

    from public.product_units pu

    where pu.product_id =
          p_product_id

      and pu.uom_code =
          v_new_sales_uom

      and pu.is_active = true
      and pu.is_deleted = false;


    if not found
       or v_new_factor is null
       or v_new_factor <= 0 then

        raise exception
            'Sales UOM % is not an active Supported UOM with a valid Factor-to-Base.',
            v_new_sales_uom;
    end if;


    /* ========================================================================
    6. PRICING DECISION
    ======================================================================== */


    /* ------------------------------------------------------------------------
    CASE A
    NEW LINE
    ------------------------------------------------------------------------ */

    if not v_has_existing then

        select *
        into v_current_price

        from public.resolve_product_transaction_price(
            p_price_book_id,
            p_product_id,
            v_new_sales_uom,
            p_pricing_date
        );


        v_pricing_action :=
            'CURRENT_PRICE_NEW_LINE';


        v_resolved_quantity :=
            round(
                p_quantity,
                6
            );


        v_resolved_base_quantity :=
            round(
                v_resolved_quantity
                * v_new_factor,
                6
            );


        v_resolved_unit_price :=
            round(
                v_current_price.transaction_unit_price,
                2
            );


        v_resolved_original_unit_price :=
            v_resolved_unit_price;


        v_resolved_minimum_price :=
            case
                when
                    v_current_price.transaction_minimum_price
                    is null
                then null

                else round(
                    v_current_price.transaction_minimum_price,
                    2
                )
            end;


        v_resolved_price_book_line_id :=
            v_current_price.price_book_line_id;


        v_resolved_price_source :=
            'Price Book';


    /* ------------------------------------------------------------------------
    CASE B
    PRODUCT CHANGED
    ------------------------------------------------------------------------ */

    elsif v_existing.product_id
          is distinct from
          p_product_id then

        select *
        into v_current_price

        from public.resolve_product_transaction_price(
            p_price_book_id,
            p_product_id,
            v_new_sales_uom,
            p_pricing_date
        );


        v_pricing_action :=
            'CURRENT_PRICE_PRODUCT_CHANGED';


        v_resolved_quantity :=
            round(
                p_quantity,
                6
            );


        v_resolved_base_quantity :=
            round(
                v_resolved_quantity
                * v_new_factor,
                6
            );


        v_resolved_unit_price :=
            round(
                v_current_price.transaction_unit_price,
                2
            );


        v_resolved_original_unit_price :=
            v_resolved_unit_price;


        v_resolved_minimum_price :=
            case
                when
                    v_current_price.transaction_minimum_price
                    is null
                then null

                else round(
                    v_current_price.transaction_minimum_price,
                    2
                )
            end;


        v_resolved_price_book_line_id :=
            v_current_price.price_book_line_id;


        v_resolved_price_source :=
            'Price Book';


    /* ------------------------------------------------------------------------
    CASE C
    SAME PRODUCT + SAME UOM

    Quantity may change.

    IMPORTANT:
    Keep Draft price snapshot.
    Do NOT read current Product Price Matrix.
    ------------------------------------------------------------------------ */

    elsif v_existing.sales_uom_code =
          v_new_sales_uom then

        v_pricing_action :=
            'PRESERVE_EXISTING_SNAPSHOT';


        /*
        Existing Product Base UOM snapshot must remain compatible.
        */

        if v_existing.base_uom_code
           is distinct from
           v_product_base_uom then

            raise exception
                'Product Base UOM changed after this Draft line was created. Manual review is required before updating the line.';
        end if;


        v_resolved_quantity :=
            round(
                p_quantity,
                6
            );


        v_resolved_base_quantity :=
            round(
                v_resolved_quantity
                * v_new_factor,
                6
            );


        v_resolved_unit_price :=
            v_existing.unit_price;


        v_resolved_original_unit_price :=
            coalesce(
                v_existing.original_unit_price,
                v_existing.unit_price
            );


        v_resolved_minimum_price :=
            v_existing.minimum_price_snapshot;


        v_resolved_price_book_line_id :=
            v_existing.price_book_line_id;


        v_resolved_price_source :=
            coalesce(
                v_existing.price_source,
                'Price Book'
            );


    /* ------------------------------------------------------------------------
    CASE D
    SAME PRODUCT + UOM CHANGED

    Locked rule:

        Base Quantity is preserved.

        New Quantity =
            Existing Base Quantity
            / New Factor-to-Base

        New Transaction Unit Price =
            Existing Transaction Unit Price
            × New Factor
            / Old Factor

    No current Product repricing.
    ------------------------------------------------------------------------ */

    else

        v_pricing_action :=
            'CONVERT_EXISTING_SNAPSHOT_UOM';


        if v_existing.base_uom_code
           is distinct from
           v_product_base_uom then

            raise exception
                'Product Base UOM changed after this Draft line was created. UOM conversion requires manual review.';
        end if;


        /*
        Prefer stored conversion snapshot.

        It represents the commercial snapshot at the time the Draft line
        was last established.
        */

        v_old_factor :=
            coalesce(
                v_existing.conversion_factor,
                0
            );


        if v_old_factor <= 0 then
            raise exception
                'Existing Draft line does not contain a valid UOM conversion snapshot.';
        end if;


        v_old_base_quantity :=
            coalesce(
                v_existing.base_quantity,

                round(
                    v_existing.quantity
                    * v_old_factor,
                    6
                )
            );


        if v_old_base_quantity <= 0 then
            raise exception
                'Existing Draft line does not contain a valid Base Quantity snapshot.';
        end if;


        /*
        Physical quantity is preserved on UOM change.
        */

        v_resolved_base_quantity :=
            round(
                v_old_base_quantity,
                6
            );


        v_resolved_quantity :=
            round(
                v_resolved_base_quantity
                / v_new_factor,
                6
            );


        /*
        Preserve commercial price basis.

        Example:
            $500 / sqm
            box factor = 2.2

            -> $1,100 / box
        */

        v_resolved_unit_price :=
            round(
                v_existing.unit_price
                * v_new_factor
                / v_old_factor,
                2
            );


        v_resolved_original_unit_price :=
            round(
                coalesce(
                    v_existing.original_unit_price,
                    v_existing.unit_price
                )
                * v_new_factor
                / v_old_factor,
                2
            );


        v_resolved_minimum_price :=
            case
                when
                    v_existing.minimum_price_snapshot
                    is null
                then null

                else round(
                    v_existing.minimum_price_snapshot
                    * v_new_factor
                    / v_old_factor,
                    2
                )
            end;


        /*
        The original Price Book source row is retained.

        It points to the Pricing-UOM commercial source snapshot.
        */

        v_resolved_price_book_line_id :=
            v_existing.price_book_line_id;


        v_resolved_price_source :=
            coalesce(
                v_existing.price_source,
                'Price Book'
            );

    end if;


    /* ========================================================================
    7. FRACTIONAL QUANTITY VALIDATION
    ======================================================================== */

    if not coalesce(
        v_new_allow_fractional,
        true
    )
    and v_resolved_quantity <>
        trunc(v_resolved_quantity) then

        raise exception
            'UOM % does not allow fractional quantity. Converted quantity is %.',
            v_new_sales_uom,
            v_resolved_quantity;
    end if;


    /* ========================================================================
    8. DISCOUNT

    If caller does not explicitly supply a discount on an existing line,
    preserve existing Draft discount.

    New/Product-changed lines default to zero.
    ======================================================================== */

    select *
    into v_discount

    from public.validate_quotation_product_discount(

        p_product_id,

        case
            when p_discount_percent is not null
                then p_discount_percent

            when v_has_existing
             and v_existing.product_id =
                 p_product_id
                then coalesce(
                    v_existing.discount_percent,
                    0
                )

            else 0
        end,

        case
            when p_discount_percent is not null
                then p_discount_reason

            when v_has_existing
             and v_existing.product_id =
                 p_product_id
                then v_existing.discount_reason

            else null
        end
    );


    /* ========================================================================
    9. RETURN AUTHORITATIVE SNAPSHOT DECISION
    ======================================================================== */

    return query

    select
        v_pricing_action,

        case
            when v_has_existing
                then
                    v_existing.quotation_line_id
            else
                null::uuid
        end,

        case
            when v_has_existing
                then
                    coalesce(
                        v_existing.line_uid,
                        p_existing_line_uid
                    )
            else
                coalesce(
                    p_existing_line_uid,
                    gen_random_uuid()
                )
        end,

        p_product_id,

        v_new_sales_uom,

        v_product_base_uom,

        v_new_factor,

        v_new_allow_fractional,

        v_resolved_quantity,

        v_resolved_base_quantity,

        v_resolved_unit_price,

        v_resolved_original_unit_price,

        v_resolved_minimum_price,

        p_price_book_id,

        v_resolved_price_book_line_id,

        v_resolved_price_source,

        v_discount.discount_percent,

        v_discount.discount_reason,

        v_discount.maximum_discount_percent;

end;
$function$;
-- resolve_quotation_line_price(p_price_book_id uuid, p_product_id uuid, p_sales_uom_code text, p_pricing_date date, p_requested_unit_price numeric, p_manual_price_reason text)
CREATE OR REPLACE FUNCTION public.resolve_quotation_line_price(p_price_book_id uuid, p_product_id uuid, p_sales_uom_code text, p_pricing_date date, p_requested_unit_price numeric DEFAULT NULL::numeric, p_manual_price_reason text DEFAULT NULL::text)
 RETURNS TABLE(resolved_unit_price numeric, original_unit_price numeric, minimum_price_snapshot numeric, price_book_line_id uuid, price_source text, manual_price_reason text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
declare
    v_price record;
begin

    if auth.uid() is null then
        raise exception
            'Authentication is required.';
    end if;


    if p_price_book_id is null then
        raise exception
            'Price Book is required.';
    end if;


    if p_product_id is null then
        raise exception
            'Product is required.';
    end if;


    if nullif(
        btrim(p_sales_uom_code),
        ''
    ) is null then
        raise exception
            'Sales UOM is required.';
    end if;


    if p_pricing_date is null then
        raise exception
            'Pricing Date is required.';
    end if;


    /* ----------------------------------------------------------------
    Authoritative pricing engine
    ---------------------------------------------------------------- */

    select *
    into v_price

    from public.resolve_product_transaction_price(
        p_price_book_id,
        p_product_id,
        btrim(p_sales_uom_code),
        p_pricing_date
    );


    if not found then
        raise exception
            'Product selling price could not be resolved.';
    end if;


    /*
    Product Unit Price Override is intentionally NOT implemented.

    p_requested_unit_price remains in the signature temporarily because
    deployed frontend / wrappers still call the old function shape.

    The server ignores it for Product lines.

    p_manual_price_reason is also not used for Product pricing.
    */


    return query
    select
        round(
            v_price.transaction_unit_price,
            2
        )::numeric,

        round(
            v_price.transaction_unit_price,
            2
        )::numeric,

        case
            when v_price.transaction_minimum_price
                 is null
                then null::numeric
            else
                round(
                    v_price.transaction_minimum_price,
                    2
                )::numeric
        end,

        v_price.price_book_line_id,

        'Price Book'::text,

        null::text;

end;
$function$;
-- resolve_quotation_revision_draft_product_line(p_revision_id uuid, p_existing_line_uid uuid, p_existing_line_no integer, p_product_id uuid, p_sales_uom_code text, p_quantity numeric, p_discount_percent numeric, p_discount_reason text, p_price_book_id uuid, p_pricing_date date)
CREATE OR REPLACE FUNCTION public.resolve_quotation_revision_draft_product_line(p_revision_id uuid, p_existing_line_uid uuid, p_existing_line_no integer, p_product_id uuid, p_sales_uom_code text, p_quantity numeric, p_discount_percent numeric, p_discount_reason text, p_price_book_id uuid, p_pricing_date date)
 RETURNS TABLE(pricing_action text, revision_line_id uuid, quotation_line_id uuid, line_uid uuid, product_id uuid, sales_uom_code text, base_uom_code text, conversion_factor numeric, allow_fractional_quantity boolean, quantity numeric, base_quantity numeric, unit_price numeric, original_unit_price numeric, minimum_price_snapshot numeric, price_book_id uuid, price_book_line_id uuid, price_source text, discount_percent numeric, discount_reason text, maximum_discount_percent numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$

declare

    v_revision public.quotation_revisions%rowtype;

    v_existing public.quotation_revision_lines%rowtype;

    v_has_existing boolean := false;


    v_product_base_uom text;

    v_new_sales_uom text;

    v_new_factor numeric(18,6);

    v_new_allow_fractional boolean;


    v_old_factor numeric(18,6);

    v_old_base_quantity numeric(18,6);


    v_resolved_quantity numeric(18,6);

    v_resolved_base_quantity numeric(18,6);


    v_resolved_unit_price numeric;

    v_resolved_original_unit_price numeric;

    v_resolved_minimum_price numeric;


    v_resolved_price_book_line_id uuid;

    v_resolved_price_source text;


    v_discount record;

    v_current_price record;


    v_pricing_action text;

begin

    /* ========================================================================
    Authentication
    ======================================================================== */

    if auth.uid() is null then
        raise exception
            'Authentication is required.';
    end if;


    /* ========================================================================
    Required input
    ======================================================================== */

    if p_revision_id is null then
        raise exception
            'Quotation Revision ID is required.';
    end if;


    if p_product_id is null then
        raise exception
            'Product is required.';
    end if;


    v_new_sales_uom :=
        nullif(
            btrim(p_sales_uom_code),
            ''
        );


    if v_new_sales_uom is null then
        raise exception
            'Sales UOM is required.';
    end if;


    if p_quantity is null
       or p_quantity <= 0 then
        raise exception
            'Quantity must be greater than zero.';
    end if;


    if p_price_book_id is null then
        raise exception
            'Price Book is required.';
    end if;


    if p_pricing_date is null then
        raise exception
            'Pricing Date is required.';
    end if;


    /* ========================================================================
    Lock Draft Revision
    ======================================================================== */

    select qr.*
    into v_revision

    from public.quotation_revisions qr

    where qr.revision_id =
          p_revision_id

      and qr.is_active = true
      and qr.is_deleted = false

    for update;


    if not found then
        raise exception
            'Quotation Revision does not exist, is inactive, or is deleted.';
    end if;


    if v_revision.revision_status <> 'Draft' then
        raise exception
            'Revision snapshot resolver may only be used with a Draft Revision.';
    end if;


    if v_revision.price_book_id
       is distinct from
       p_price_book_id then

        raise exception
            'Pricing resolver Price Book does not match the Draft Revision Price Book.';
    end if;


    /* ========================================================================
    Locate existing Revision line

    line_uid = authoritative identity.
    line_no = legacy fallback.
    ======================================================================== */

    if p_existing_line_uid is not null then

        select qrl.*
        into v_existing

        from public.quotation_revision_lines qrl

        where qrl.revision_id =
              p_revision_id

          and qrl.line_uid =
              p_existing_line_uid

          and qrl.is_deleted = false

        limit 1

        for update;


        if found then
            v_has_existing := true;
        end if;

    end if;


    if not v_has_existing
       and p_existing_line_no is not null then

        select qrl.*
        into v_existing

        from public.quotation_revision_lines qrl

        where qrl.revision_id =
              p_revision_id

          and qrl.line_no =
              p_existing_line_no

          and qrl.is_deleted = false

        limit 1

        for update;


        if found then
            v_has_existing := true;
        end if;

    end if;


    /* ========================================================================
    Current Product + Supported UOM

    product_units is authoritative.
    ======================================================================== */

    select p.base_uom_code
    into v_product_base_uom

    from public.products p

    where p.product_id =
          p_product_id

      and p.is_active = true
      and p.is_deleted = false;


    if not found then
        raise exception
            'Selected Product is missing, inactive, or deleted.';
    end if;


    select
        pu.conversion_to_base,
        pu.allow_fractional_quantity

    into
        v_new_factor,
        v_new_allow_fractional

    from public.product_units pu

    where pu.product_id =
          p_product_id

      and pu.uom_code =
          v_new_sales_uom

      and pu.is_active = true
      and pu.is_deleted = false;


    if not found
       or v_new_factor is null
       or v_new_factor <= 0 then

        raise exception
            'Sales UOM % is not an active Supported UOM with a valid Factor-to-Base.',
            v_new_sales_uom;
    end if;


    /* ========================================================================
    Pricing decision
    ======================================================================== */


    /* ------------------------------------------------------------------------
    CASE A — NEW REVISION LINE

    Use current Product Price Matrix.
    ------------------------------------------------------------------------ */

    if not v_has_existing then

        select *
        into v_current_price

        from public.resolve_product_transaction_price(
            p_price_book_id,
            p_product_id,
            v_new_sales_uom,
            p_pricing_date
        );


        v_pricing_action :=
            'CURRENT_PRICE_NEW_REVISION_LINE';


        v_resolved_quantity :=
            round(
                p_quantity,
                6
            );


        v_resolved_base_quantity :=
            round(
                v_resolved_quantity
                * v_new_factor,
                6
            );


        v_resolved_unit_price :=
            round(
                v_current_price.transaction_unit_price,
                2
            );


        v_resolved_original_unit_price :=
            v_resolved_unit_price;


        v_resolved_minimum_price :=
            case
                when
                    v_current_price.transaction_minimum_price
                    is null
                then null

                else round(
                    v_current_price.transaction_minimum_price,
                    2
                )
            end;


        v_resolved_price_book_line_id :=
            v_current_price.price_book_line_id;


        v_resolved_price_source :=
            'Price Book';


    /* ------------------------------------------------------------------------
    CASE B — PRODUCT CHANGED

    Current Product Price Matrix.
    ------------------------------------------------------------------------ */

    elsif v_existing.product_id
          is distinct from
          p_product_id then

        select *
        into v_current_price

        from public.resolve_product_transaction_price(
            p_price_book_id,
            p_product_id,
            v_new_sales_uom,
            p_pricing_date
        );


        v_pricing_action :=
            'CURRENT_PRICE_REVISION_PRODUCT_CHANGED';


        v_resolved_quantity :=
            round(
                p_quantity,
                6
            );


        v_resolved_base_quantity :=
            round(
                v_resolved_quantity
                * v_new_factor,
                6
            );


        v_resolved_unit_price :=
            round(
                v_current_price.transaction_unit_price,
                2
            );


        v_resolved_original_unit_price :=
            v_resolved_unit_price;


        v_resolved_minimum_price :=
            case
                when
                    v_current_price.transaction_minimum_price
                    is null
                then null

                else round(
                    v_current_price.transaction_minimum_price,
                    2
                )
            end;


        v_resolved_price_book_line_id :=
            v_current_price.price_book_line_id;


        v_resolved_price_source :=
            'Price Book';


    /* ------------------------------------------------------------------------
    CASE C — SAME PRODUCT + SAME UOM

    Includes quantity-only change.

    Preserve Revision commercial snapshot.
    ------------------------------------------------------------------------ */

    elsif v_existing.sales_uom_code =
          v_new_sales_uom then

        v_pricing_action :=
            'PRESERVE_REVISION_SNAPSHOT';


        if v_existing.base_uom_code
           is distinct from
           v_product_base_uom then

            raise exception
                'Product Base UOM changed after this Revision line was created. Manual review is required.';
        end if;


        v_resolved_quantity :=
            round(
                p_quantity,
                6
            );


        v_resolved_base_quantity :=
            round(
                v_resolved_quantity
                * v_new_factor,
                6
            );


        v_resolved_unit_price :=
            v_existing.unit_price;


        v_resolved_original_unit_price :=
            coalesce(
                v_existing.original_unit_price,
                v_existing.unit_price
            );


        v_resolved_minimum_price :=
            v_existing.minimum_price_snapshot;


        v_resolved_price_book_line_id :=
            v_existing.price_book_line_id;


        v_resolved_price_source :=
            coalesce(
                v_existing.price_source,
                'Price Book'
            );


    /* ------------------------------------------------------------------------
    CASE D — SAME PRODUCT + UOM CHANGED

    Preserve:
        physical Base Quantity
        commercial snapshot

    Do NOT read current price.
    ------------------------------------------------------------------------ */

    else

        v_pricing_action :=
            'CONVERT_REVISION_SNAPSHOT_UOM';


        if v_existing.base_uom_code
           is distinct from
           v_product_base_uom then

            raise exception
                'Product Base UOM changed after this Revision line was created. UOM conversion requires manual review.';
        end if;


        v_old_factor :=
            coalesce(
                v_existing.conversion_factor,
                0
            );


        if v_old_factor <= 0 then
            raise exception
                'Existing Draft Revision line does not contain a valid UOM conversion snapshot.';
        end if;


        v_old_base_quantity :=
            coalesce(
                v_existing.base_quantity,

                round(
                    v_existing.quantity
                    * v_old_factor,
                    6
                )
            );


        if v_old_base_quantity <= 0 then
            raise exception
                'Existing Draft Revision line does not contain a valid Base Quantity snapshot.';
        end if;


        /*
        UOM change preserves physical quantity.
        Caller p_quantity is intentionally not used as the physical quantity
        in this branch.
        */

        v_resolved_base_quantity :=
            round(
                v_old_base_quantity,
                6
            );


        v_resolved_quantity :=
            round(
                v_resolved_base_quantity
                / v_new_factor,
                6
            );


        /*
        Convert old commercial snapshot.

        New Unit Price =
            Old Unit Price
            × New Factor
            ÷ Old Factor
        */

        v_resolved_unit_price :=
            round(
                v_existing.unit_price
                * v_new_factor
                / v_old_factor,
                2
            );


        v_resolved_original_unit_price :=
            round(
                coalesce(
                    v_existing.original_unit_price,
                    v_existing.unit_price
                )
                * v_new_factor
                / v_old_factor,
                2
            );


        v_resolved_minimum_price :=
            case
                when
                    v_existing.minimum_price_snapshot
                    is null
                then null

                else round(
                    v_existing.minimum_price_snapshot
                    * v_new_factor
                    / v_old_factor,
                    2
                )
            end;


        /*
        Keep original source row.
        */

        v_resolved_price_book_line_id :=
            v_existing.price_book_line_id;


        v_resolved_price_source :=
            coalesce(
                v_existing.price_source,
                'Price Book'
            );

    end if;


    /* ========================================================================
    Fractional quantity validation
    ======================================================================== */

    if not coalesce(
        v_new_allow_fractional,
        true
    )
    and v_resolved_quantity <>
        trunc(v_resolved_quantity) then

        raise exception
            'UOM % does not allow fractional quantity. Converted quantity is %.',
            v_new_sales_uom,
            v_resolved_quantity;
    end if;


    /* ========================================================================
    Discount

    Existing same-Product Revision line:
        if caller does NOT provide discount_percent -> preserve snapshot.

    New / Product changed:
        default zero.
    ======================================================================== */

    select *
    into v_discount

    from public.validate_quotation_product_discount(

        p_product_id,

        case

            when p_discount_percent is not null
                then p_discount_percent

            when v_has_existing
             and v_existing.product_id =
                 p_product_id
                then coalesce(
                    v_existing.discount_percent,
                    0
                )

            else
                0

        end,

        case

            when p_discount_percent is not null
                then p_discount_reason

            when v_has_existing
             and v_existing.product_id =
                 p_product_id
                then v_existing.discount_reason

            else
                null

        end
    );


    /* ========================================================================
    Return authoritative decision
    ======================================================================== */

    return query

    select
        v_pricing_action,

        case
            when v_has_existing
                then v_existing.revision_line_id
            else null::uuid
        end,

        case
            when v_has_existing
                then v_existing.quotation_line_id
            else null::uuid
        end,

        case
            when v_has_existing
                then
                    coalesce(
                        v_existing.line_uid,
                        p_existing_line_uid
                    )
            else
                coalesce(
                    p_existing_line_uid,
                    gen_random_uuid()
                )
        end,

        p_product_id,

        v_new_sales_uom,

        v_product_base_uom,

        v_new_factor,

        v_new_allow_fractional,

        v_resolved_quantity,

        v_resolved_base_quantity,

        v_resolved_unit_price,

        v_resolved_original_unit_price,

        v_resolved_minimum_price,

        p_price_book_id,

        v_resolved_price_book_line_id,

        v_resolved_price_source,

        v_discount.discount_percent,

        v_discount.discount_reason,

        v_discount.maximum_discount_percent;

end;
$function$;
-- resolve_quotation_revision_send_price_change_atomic(p_revision_id uuid, p_line_uid uuid, p_resolution text, p_discount_reason text)
CREATE OR REPLACE FUNCTION public.resolve_quotation_revision_send_price_change_atomic(p_revision_id uuid, p_line_uid uuid, p_resolution text, p_discount_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$

declare
    v_user_id uuid := auth.uid();

    v_revision
        public.quotation_revisions%rowtype;

    v_line
        public.quotation_revision_lines%rowtype;

    v_current record;

    v_resolution text;

    v_old_snapshot_price numeric;
    v_old_discount_percent numeric;
    v_old_effective_unit_price numeric;

    v_new_unit_price numeric;
    v_new_discount_percent numeric;
    v_new_discount_reason text;

    v_effective_check numeric;

    v_line_subtotal numeric;
    v_discount_amount numeric;
    v_tax_amount numeric;
    v_line_total numeric;

    v_margin_amount numeric;
    v_margin_percent numeric;

    v_max_discount numeric;

begin

    if v_user_id is null then
        raise exception
            'Authentication is required.';
    end if;


    if not public.has_permission(
        'quotations.update_revision'
    ) then

        raise exception
            'Permission quotations.update_revision is required.';

    end if;


    if p_revision_id is null
       or p_line_uid is null then

        raise exception
            'Revision ID and Line UID are required.';

    end if;


    v_resolution :=
        upper(
            btrim(
                coalesce(
                    p_resolution,
                    ''
                )
            )
        );


    if v_resolution not in (
        'USE_CURRENT_PRICE',
        'HONOR_AGREED_PRICE'
    ) then

        raise exception
            'Resolution must be USE_CURRENT_PRICE or HONOR_AGREED_PRICE.';

    end if;


    /* ------------------------------------------------------------------------
    Lock Draft Revision
    ------------------------------------------------------------------------ */

    select qr.*
    into v_revision

    from public.quotation_revisions qr

    where qr.revision_id =
          p_revision_id

      and qr.revision_status =
          'Draft'

      and qr.is_active = true
      and qr.is_deleted = false

    for update;


    if not found then
        raise exception
            'Active Draft Quotation Revision was not found.';
    end if;


    select qrl.*
    into v_line

    from public.quotation_revision_lines qrl

    where qrl.revision_id =
          p_revision_id

      and qrl.line_uid =
          p_line_uid

      and qrl.is_deleted = false

    for update;


    if not found then
        raise exception
            'Active Quotation Revision line was not found.';
    end if;


    if v_line.product_id is null then
        raise exception
            'Send-time Product Price resolution applies only to Product lines.';
    end if;


    select *
    into v_current

    from public.resolve_product_transaction_price(
        coalesce(
            v_line.price_book_id,
            v_revision.price_book_id
        ),

        v_line.product_id,

        v_line.sales_uom_code,

        current_date
    );


    v_old_snapshot_price :=
        round(
            coalesce(
                v_line.original_unit_price,
                v_line.unit_price
            ),
            2
        );


    if round(
        v_current.transaction_unit_price,
        2
    ) =
    v_old_snapshot_price then

        raise exception
            'Quotation Revision Product line already matches the current Product Price Matrix.';

    end if;


    v_old_discount_percent :=
        coalesce(
            v_line.discount_percent,
            0
        );


    v_old_effective_unit_price :=
        round(
            v_old_snapshot_price
            *
            (
                1
                - v_old_discount_percent / 100
            ),
            2
        );


    v_new_unit_price :=
        round(
            v_current.transaction_unit_price,
            2
        );


    if v_resolution =
       'USE_CURRENT_PRICE' then

        v_new_discount_percent :=
            v_old_discount_percent;


        v_new_discount_reason :=
            case
                when v_new_discount_percent = 0
                then null
                else v_line.discount_reason
            end;


    else

        if not public.has_permission(
            'quotations.apply_discount'
        ) then

            raise exception
                'Permission quotations.apply_discount is required to Honor Agreed Price.';

        end if;


        v_new_discount_reason :=
            nullif(
                btrim(
                    coalesce(
                        p_discount_reason,
                        ''
                    )
                ),
                ''
            );


        if v_new_discount_reason is null then

            raise exception
                'Discount Reason is required to Honor Agreed Price.';

        end if;


        if v_new_unit_price <
           v_old_effective_unit_price then

            raise exception
                'Current Product Price (%) is below the previous agreed effective price (%). Honor Agreed Price would require a negative discount. Use Current Price instead.',
                v_new_unit_price,
                v_old_effective_unit_price;

        end if;


        if v_new_unit_price = 0 then

            if v_old_effective_unit_price <> 0 then
                raise exception
                    'Cannot Honor a positive agreed price when Current Product Price is zero.';
            end if;

            v_new_discount_percent := 0;

        else

            v_new_discount_percent :=
                round(
                    (
                        1
                        -
                        (
                            v_old_effective_unit_price
                            /
                            v_new_unit_price
                        )
                    )
                    * 100,
                    2
                );

        end if;


        if v_new_discount_percent < 0
           or v_new_discount_percent > 100 then

            raise exception
                'Calculated Honor Agreed Discount is invalid: %%%.',
                v_new_discount_percent;

        end if;


        select p.maximum_discount_percent
        into v_max_discount

        from public.products p

        where p.product_id =
              v_line.product_id

          and p.is_active = true
          and p.is_deleted = false;


        if not found then
            raise exception
                'Product is missing, inactive, or deleted.';
        end if;


        v_max_discount :=
            coalesce(
                v_max_discount,
                0
            );


        if v_new_discount_percent >
           v_max_discount then

            raise exception
                'Honor Agreed Price requires % discount, exceeding Product Maximum Discount of %%%.',
                v_new_discount_percent,
                v_max_discount;

        end if;


        v_effective_check :=
            round(
                v_new_unit_price
                *
                (
                    1
                    - v_new_discount_percent / 100
                ),
                2
            );


        if v_effective_check <>
           v_old_effective_unit_price then

            raise exception
                'Honor Agreed Price cannot be represented exactly with the current Discount Percent precision. Target effective price %, calculated effective price %.',
                v_old_effective_unit_price,
                v_effective_check;

        end if;

    end if;


    /* ------------------------------------------------------------------------
    Recalculate line
    ------------------------------------------------------------------------ */

    v_line_subtotal :=
        round(
            v_line.quantity
            * v_new_unit_price,
            2
        );


    v_discount_amount :=
        round(
            v_line_subtotal
            * v_new_discount_percent
            / 100,
            2
        );


    v_tax_amount :=
        round(
            (
                v_line_subtotal
                - v_discount_amount
            )
            * coalesce(
                v_line.tax_rate,
                0
            )
            / 100,
            2
        );


    v_line_total :=
        round(
            v_line_subtotal
            - v_discount_amount
            + v_tax_amount,
            2
        );


    if v_line.cost_price is null then

        v_margin_amount := null;
        v_margin_percent := null;

    else

        v_margin_amount :=
            round(
                (
                    v_new_unit_price
                    - v_line.cost_price
                )
                * v_line.quantity
                - v_discount_amount,
                2
            );


        if (
            v_line_subtotal
            - v_discount_amount
        ) > 0 then

            v_margin_percent :=
                round(
                    v_margin_amount
                    /
                    (
                        v_line_subtotal
                        - v_discount_amount
                    )
                    * 100,
                    2
                );

        else
            v_margin_percent := null;
        end if;

    end if;


    /* ------------------------------------------------------------------------
    Update Revision line
    ------------------------------------------------------------------------ */

    update public.quotation_revision_lines

    set
        unit_price =
            v_new_unit_price,

        original_unit_price =
            v_new_unit_price,

        minimum_price_snapshot =
            case
                when
                    v_current.transaction_minimum_price
                    is null
                then null

                else round(
                    v_current.transaction_minimum_price,
                    2
                )
            end,

        price_book_id =
            v_current.price_book_id,

        price_book_line_id =
            v_current.price_book_line_id,

        price_source =
            'Price Book',

        manual_price_reason =
            null,

        discount_percent =
            v_new_discount_percent,

        discount_amount =
            v_discount_amount,

        discount_reason =
            v_new_discount_reason,

        tax_amount =
            v_tax_amount,

        line_total =
            v_line_total,

        margin_amount =
            v_margin_amount,

        margin_percent =
            v_margin_percent,

        updated_at =
            now(),

        updated_by =
            v_user_id

    where revision_line_id =
          v_line.revision_line_id

      and revision_id =
          p_revision_id

      and is_deleted = false;


    if not found then
        raise exception
            'Draft Revision line could not be updated.';
    end if;


    /* ------------------------------------------------------------------------
    Recalculate Revision Header
    ------------------------------------------------------------------------ */

    update public.quotation_revisions qr

    set
        subtotal_amount =
            totals.subtotal_amount,

        discount_amount =
            totals.discount_amount,

        tax_amount =
            totals.tax_amount,

        total_amount =
            totals.total_amount,

        updated_by =
            v_user_id

    from (

        select
            round(
                coalesce(
                    sum(
                        case
                            when qrl.is_optional = false
                            then
                                qrl.quantity
                                * qrl.unit_price
                            else 0
                        end
                    ),
                    0
                ),
                2
            ) as subtotal_amount,

            round(
                coalesce(
                    sum(
                        case
                            when qrl.is_optional = false
                            then qrl.discount_amount
                            else 0
                        end
                    ),
                    0
                ),
                2
            ) as discount_amount,

            round(
                coalesce(
                    sum(
                        case
                            when qrl.is_optional = false
                            then qrl.tax_amount
                            else 0
                        end
                    ),
                    0
                ),
                2
            ) as tax_amount,

            round(
                coalesce(
                    sum(
                        case
                            when qrl.is_optional = false
                            then qrl.line_total
                            else 0
                        end
                    ),
                    0
                ),
                2
            ) as total_amount

        from public.quotation_revision_lines qrl

        where qrl.revision_id =
              p_revision_id

          and qrl.is_deleted = false

    ) totals

    where qr.revision_id =
          p_revision_id

      and qr.revision_status =
          'Draft';


    return jsonb_build_object(
        'revision_id',
            p_revision_id,

        'revision_line_id',
            v_line.revision_line_id,

        'line_uid',
            v_line.line_uid,

        'resolution',
            v_resolution,

        'previous_snapshot_unit_price',
            v_old_snapshot_price,

        'previous_discount_percent',
            v_old_discount_percent,

        'previous_effective_unit_price',
            v_old_effective_unit_price,

        'current_unit_price',
            v_new_unit_price,

        'resolved_discount_percent',
            v_new_discount_percent,

        'discount_reason',
            v_new_discount_reason,

        'current_price_book_line_id',
            v_current.price_book_line_id,

        'line_total',
            v_line_total
    );

end;
$function$;
-- resolve_quotation_send_price_change_atomic(p_quotation_id uuid, p_line_uid uuid, p_resolution text, p_discount_reason text)
CREATE OR REPLACE FUNCTION public.resolve_quotation_send_price_change_atomic(p_quotation_id uuid, p_line_uid uuid, p_resolution text, p_discount_reason text DEFAULT NULL::text)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$

declare
    v_user_id uuid := auth.uid();

    v_quotation
        public.quotations%rowtype;

    v_line
        public.quotation_lines%rowtype;

    v_current record;

    v_resolution text;

    v_old_snapshot_price numeric;
    v_old_discount_percent numeric;
    v_old_effective_unit_price numeric;

    v_new_unit_price numeric;
    v_new_discount_percent numeric;
    v_new_discount_reason text;

    v_effective_check numeric;

    v_line_subtotal numeric;
    v_discount_amount numeric;
    v_tax_amount numeric;
    v_line_total numeric;

    v_margin_amount numeric;
    v_margin_percent numeric;

    v_max_discount numeric;

begin

    /* ------------------------------------------------------------------------
    Auth / permission
    ------------------------------------------------------------------------ */

    if v_user_id is null then
        raise exception
            'Authentication is required.';
    end if;


    if not public.has_permission(
        'quotations.update_draft'
    ) then

        raise exception
            'Permission quotations.update_draft is required.';

    end if;


    if p_quotation_id is null
       or p_line_uid is null then

        raise exception
            'Quotation ID and Line UID are required.';

    end if;


    v_resolution :=
        upper(
            btrim(
                coalesce(
                    p_resolution,
                    ''
                )
            )
        );


    if v_resolution not in (
        'USE_CURRENT_PRICE',
        'HONOR_AGREED_PRICE'
    ) then

        raise exception
            'Resolution must be USE_CURRENT_PRICE or HONOR_AGREED_PRICE.';

    end if;


    /* ------------------------------------------------------------------------
    Lock Draft
    ------------------------------------------------------------------------ */

    select q.*
    into v_quotation

    from public.quotations q

    where q.quotation_id =
          p_quotation_id

      and q.quotation_status =
          'Draft'

      and q.is_active = true
      and q.is_deleted = false

    for update;


    if not found then
        raise exception
            'Active Draft Quotation was not found.';
    end if;


    select ql.*
    into v_line

    from public.quotation_lines ql

    where ql.quotation_id =
          p_quotation_id

      and ql.line_uid =
          p_line_uid

      and ql.is_deleted = false

    for update;


    if not found then
        raise exception
            'Active Quotation line was not found.';
    end if;


    if v_line.product_id is null then
        raise exception
            'Send-time Product Price resolution applies only to Product lines.';
    end if;


    /* ------------------------------------------------------------------------
    Resolve CURRENT authoritative Product price
    ------------------------------------------------------------------------ */

    select *
    into v_current

    from public.resolve_product_transaction_price(
        coalesce(
            v_line.price_book_id,
            v_quotation.price_book_id
        ),

        v_line.product_id,

        v_line.sales_uom_code,

        current_date
    );


    v_old_snapshot_price :=
        round(
            coalesce(
                v_line.original_unit_price,
                v_line.unit_price
            ),
            2
        );


    if round(
        v_current.transaction_unit_price,
        2
    ) =
    v_old_snapshot_price then

        raise exception
            'Quotation Product line already matches the current Product Price Matrix.';

    end if;


    v_old_discount_percent :=
        coalesce(
            v_line.discount_percent,
            0
        );


    /*
    Old agreed effective unit price.
    */

    v_old_effective_unit_price :=
        round(
            v_old_snapshot_price
            *
            (
                1
                - v_old_discount_percent / 100
            ),
            2
        );


    v_new_unit_price :=
        round(
            v_current.transaction_unit_price,
            2
        );


    /* ========================================================================
    DECISION A — USE CURRENT PRICE
    ======================================================================== */

    if v_resolution =
       'USE_CURRENT_PRICE' then

        /*
        Existing approved discount stays unchanged.
        */

        v_new_discount_percent :=
            v_old_discount_percent;


        v_new_discount_reason :=
            case
                when v_new_discount_percent = 0
                then null

                else v_line.discount_reason
            end;


    /* ========================================================================
    DECISION B — HONOR AGREED EFFECTIVE PRICE
    ======================================================================== */

    else

        if not public.has_permission(
            'quotations.apply_discount'
        ) then

            raise exception
                'Permission quotations.apply_discount is required to Honor Agreed Price.';

        end if;


        v_new_discount_reason :=
            nullif(
                btrim(
                    coalesce(
                        p_discount_reason,
                        ''
                    )
                ),
                ''
            );


        if v_new_discount_reason is null then

            raise exception
                'Discount Reason is required to Honor Agreed Price.';

        end if;


        /*
        Discount cannot raise Current Price.

        If Current Price is below old agreed effective price,
        preserving the higher old price would require a negative discount.
        */

        if v_new_unit_price <
           v_old_effective_unit_price then

            raise exception
                'Current Product Price (%) is below the previous agreed effective price (%). Honor Agreed Price would require a negative discount. Use Current Price instead.',
                v_new_unit_price,
                v_old_effective_unit_price;

        end if;


        if v_new_unit_price = 0 then

            if v_old_effective_unit_price <> 0 then

                raise exception
                    'Cannot Honor a positive agreed price when Current Product Price is zero.';

            end if;


            v_new_discount_percent := 0;

        else

            /*
            quotation_lines.discount_percent currently stores 2 decimals.
            */

            v_new_discount_percent :=
                round(
                    (
                        1
                        -
                        (
                            v_old_effective_unit_price
                            /
                            v_new_unit_price
                        )
                    )
                    * 100,
                    2
                );

        end if;


        if v_new_discount_percent < 0
           or v_new_discount_percent > 100 then

            raise exception
                'Calculated Honor Agreed Discount is invalid: %%%.',
                v_new_discount_percent;

        end if;


        select p.maximum_discount_percent
        into v_max_discount

        from public.products p

        where p.product_id =
              v_line.product_id

          and p.is_active = true
          and p.is_deleted = false;


        if not found then
            raise exception
                'Product is missing, inactive, or deleted.';
        end if;


        v_max_discount :=
            coalesce(
                v_max_discount,
                0
            );


        if v_new_discount_percent >
           v_max_discount then

            raise exception
                'Honor Agreed Price requires % discount, exceeding Product Maximum Discount of %%%.',
                v_new_discount_percent,
                v_max_discount;

        end if;


        /*
        Because current DB discount_percent precision is 2 decimals,
        verify the resulting effective Unit Price still matches the
        old agreed amount to the currency cent.
        */

        v_effective_check :=
            round(
                v_new_unit_price
                *
                (
                    1
                    - v_new_discount_percent / 100
                ),
                2
            );


        if v_effective_check <>
           v_old_effective_unit_price then

            raise exception
                'Honor Agreed Price cannot be represented exactly with the current Discount Percent precision. Target effective price %, calculated effective price %.',
                v_old_effective_unit_price,
                v_effective_check;

        end if;

    end if;


    /* =========================================================================
    Recalculate line
    ========================================================================= */

    v_line_subtotal :=
        round(
            v_line.quantity
            * v_new_unit_price,
            2
        );


    v_discount_amount :=
        round(
            v_line_subtotal
            * v_new_discount_percent
            / 100,
            2
        );


    v_tax_amount :=
        round(
            (
                v_line_subtotal
                - v_discount_amount
            )
            * coalesce(
                v_line.tax_rate,
                0
            )
            / 100,
            2
        );


    v_line_total :=
        round(
            v_line_subtotal
            - v_discount_amount
            + v_tax_amount,
            2
        );


    if v_line.cost_price is null then

        v_margin_amount := null;
        v_margin_percent := null;

    else

        v_margin_amount :=
            round(
                (
                    v_new_unit_price
                    - v_line.cost_price
                )
                * v_line.quantity
                - v_discount_amount,
                2
            );


        if (
            v_line_subtotal
            - v_discount_amount
        ) > 0 then

            v_margin_percent :=
                round(
                    v_margin_amount
                    /
                    (
                        v_line_subtotal
                        - v_discount_amount
                    )
                    * 100,
                    2
                );

        else
            v_margin_percent := null;
        end if;

    end if;


    /* =========================================================================
    Update Draft Product line
    ========================================================================= */

    update public.quotation_lines

    set
        unit_price =
            v_new_unit_price,

        original_unit_price =
            v_new_unit_price,

        minimum_price_snapshot =
            case
                when
                    v_current.transaction_minimum_price
                    is null
                then null

                else round(
                    v_current.transaction_minimum_price,
                    2
                )
            end,

        price_book_id =
            v_current.price_book_id,

        price_book_line_id =
            v_current.price_book_line_id,

        price_source =
            'Price Book',

        manual_price_reason =
            null,

        discount_percent =
            v_new_discount_percent,

        discount_amount =
            v_discount_amount,

        discount_reason =
            v_new_discount_reason,

        tax_amount =
            v_tax_amount,

        line_total =
            v_line_total,

        margin_amount =
            v_margin_amount,

        margin_percent =
            v_margin_percent,

        updated_at =
            now(),

        updated_by =
            v_user_id

    where quotation_line_id =
          v_line.quotation_line_id

      and quotation_id =
          p_quotation_id

      and is_deleted = false;


    if not found then
        raise exception
            'Draft Quotation line could not be updated.';
    end if;


    /* =========================================================================
    Recalculate Quotation Header
    ========================================================================= */

    update public.quotations q

    set
        subtotal_amount =
            totals.subtotal_amount,

        discount_amount =
            totals.discount_amount,

        tax_amount =
            totals.tax_amount,

        total_amount =
            totals.total_amount,

        updated_by =
            v_user_id

    from (

        select
            round(
                coalesce(
                    sum(
                        case
                            when ql.is_optional = false
                            then
                                ql.quantity
                                * ql.unit_price
                            else 0
                        end
                    ),
                    0
                ),
                2
            ) as subtotal_amount,

            round(
                coalesce(
                    sum(
                        case
                            when ql.is_optional = false
                            then ql.discount_amount
                            else 0
                        end
                    ),
                    0
                ),
                2
            ) as discount_amount,

            round(
                coalesce(
                    sum(
                        case
                            when ql.is_optional = false
                            then ql.tax_amount
                            else 0
                        end
                    ),
                    0
                ),
                2
            ) as tax_amount,

            round(
                coalesce(
                    sum(
                        case
                            when ql.is_optional = false
                            then ql.line_total
                            else 0
                        end
                    ),
                    0
                ),
                2
            ) as total_amount

        from public.quotation_lines ql

        where ql.quotation_id =
              p_quotation_id

          and ql.is_deleted = false

    ) totals

    where q.quotation_id =
          p_quotation_id

      and q.quotation_status =
          'Draft';


    return jsonb_build_object(
        'quotation_id',
            p_quotation_id,

        'quotation_line_id',
            v_line.quotation_line_id,

        'line_uid',
            v_line.line_uid,

        'resolution',
            v_resolution,

        'previous_snapshot_unit_price',
            v_old_snapshot_price,

        'previous_discount_percent',
            v_old_discount_percent,

        'previous_effective_unit_price',
            v_old_effective_unit_price,

        'current_unit_price',
            v_new_unit_price,

        'resolved_discount_percent',
            v_new_discount_percent,

        'discount_reason',
            v_new_discount_reason,

        'current_price_book_line_id',
            v_current.price_book_line_id,

        'line_total',
            v_line_total
    );

end;
$function$;
-- set_price_book_product_selling_price_atomic(p_price_book_id uuid, p_product_id uuid, p_price_uom_code text, p_unit_price numeric, p_minimum_price numeric, p_effective_from date)
CREATE OR REPLACE FUNCTION public.set_price_book_product_selling_price_atomic(p_price_book_id uuid, p_product_id uuid, p_price_uom_code text, p_unit_price numeric, p_minimum_price numeric DEFAULT NULL::numeric, p_effective_from date DEFAULT CURRENT_DATE)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
declare
    v_user_id uuid := auth.uid();

    v_price_book_line_id uuid;

    v_price_book_name text;

    v_product_code text;
    v_pricing_uom_code text;

    v_requested_uom_code text;
begin

    /* ----------------------------------------------------------------
    Authentication / permission
    ---------------------------------------------------------------- */

    if v_user_id is null then
        raise exception 'Authentication is required.';
    end if;


    if not public.has_permission(
        'products.manage_sales_prices'
    ) then
        raise exception
            'Permission products.manage_sales_prices is required.';
    end if;


    /* ----------------------------------------------------------------
    Inputs
    ---------------------------------------------------------------- */

    if p_price_book_id is null then
        raise exception 'Price Book is required.';
    end if;


    if p_product_id is null then
        raise exception 'Product is required.';
    end if;


    v_requested_uom_code :=
        nullif(btrim(p_price_uom_code), '');


    if v_requested_uom_code is null then
        raise exception 'Pricing UOM is required.';
    end if;


    if p_unit_price is null then
        raise exception 'Selling Price is required.';
    end if;


    if p_unit_price < 0 then
        raise exception
            'Selling Price cannot be negative.';
    end if;


    if p_minimum_price is not null
       and p_minimum_price < 0 then
        raise exception
            'Minimum Selling Price cannot be negative.';
    end if;


    if p_minimum_price is not null
       and p_minimum_price > p_unit_price then
        raise exception
            'Minimum Selling Price cannot be greater than Selling Price.';
    end if;


    if p_effective_from is null then
        raise exception
            'Effective From date is required.';
    end if;


    /* ----------------------------------------------------------------
    Price Book
    ---------------------------------------------------------------- */

    select pb.price_book_name
    into v_price_book_name

    from public.price_books pb

    where pb.price_book_id = p_price_book_id
      and pb.is_active = true
      and pb.is_deleted = false

      and (
          pb.effective_from is null
          or pb.effective_from <= p_effective_from
      )

      and (
          pb.effective_to is null
          or pb.effective_to >= p_effective_from
      );


    if not found then
        raise exception
            'Selected Price Book is inactive, deleted, unavailable, or not effective on %.',
            p_effective_from;
    end if;


    /* ----------------------------------------------------------------
    Product Pricing Policy
    ---------------------------------------------------------------- */

    select
        p.product_code,
        p.pricing_uom_code

    into
        v_product_code,
        v_pricing_uom_code

    from public.products p

    where p.product_id = p_product_id
      and p.is_active = true
      and p.is_deleted = false;


    if not found then
        raise exception
            'Selected Product is inactive, deleted, or does not exist.';
    end if;


    if v_pricing_uom_code is null then
        raise exception
            'Product % does not have a Pricing UOM configured.',
            v_product_code;
    end if;


    perform public.assert_product_pricing_uom_supported(
        p_product_id,
        v_pricing_uom_code
    );


    if v_requested_uom_code
       is distinct from v_pricing_uom_code then

        raise exception
            'Product % Pricing UOM is %. Selling prices cannot be stored at UOM %.',
            v_product_code,
            v_pricing_uom_code,
            v_requested_uom_code;
    end if;


    /* ----------------------------------------------------------------
    Existing Pricing-UOM row
    ---------------------------------------------------------------- */

    select pbl.price_book_line_id
    into v_price_book_line_id

    from public.price_book_lines pbl

    where pbl.price_book_id = p_price_book_id
      and pbl.product_id = p_product_id
      and pbl.price_uom_code = v_pricing_uom_code
      and pbl.is_deleted = false

    order by
        pbl.is_active desc,
        pbl.updated_at desc

    limit 1

    for update;


    /* ----------------------------------------------------------------
    Update
    ---------------------------------------------------------------- */

    if v_price_book_line_id is not null then

        update public.price_book_lines
        set
            unit_price = p_unit_price,
            minimum_price = p_minimum_price,

            effective_from = p_effective_from,
            effective_to = null,

            is_active = true,
            is_deleted = false,
            deleted_at = null,

            updated_at = now(),
            updated_by = v_user_id

        where price_book_line_id =
              v_price_book_line_id;


        return v_price_book_line_id;

    end if;


    /* ----------------------------------------------------------------
    Insert
    ---------------------------------------------------------------- */

    insert into public.price_book_lines (
        price_book_id,
        product_id,
        price_uom_code,

        unit_price,
        minimum_price,

        effective_from,
        effective_to,

        is_active,
        is_deleted,

        created_at,
        created_by,
        updated_at,
        updated_by
    )
    values (
        p_price_book_id,
        p_product_id,
        v_pricing_uom_code,

        p_unit_price,
        p_minimum_price,

        p_effective_from,
        null,

        true,
        false,

        now(),
        v_user_id,
        now(),
        v_user_id
    )
    returning price_book_line_id
    into v_price_book_line_id;


    return v_price_book_line_id;

end;
$function$;
-- set_product_pricing_policy_atomic(p_product_id uuid, p_pricing_uom_code text, p_maximum_discount_percent numeric)
CREATE OR REPLACE FUNCTION public.set_product_pricing_policy_atomic(p_product_id uuid, p_pricing_uom_code text, p_maximum_discount_percent numeric)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
declare
    v_user_id uuid := auth.uid();

    v_pricing_uom_code text;
    v_product_code text;
    v_product_name text;
    v_factor numeric(18,6);
begin
    if v_user_id is null then
        raise exception 'Authentication is required.';
    end if;


    if not public.has_permission(
        'products.manage_sales_prices'
    ) then
        raise exception
            'Permission products.manage_sales_prices is required.';
    end if;


    if p_product_id is null then
        raise exception 'Product is required.';
    end if;


    v_pricing_uom_code :=
        nullif(btrim(p_pricing_uom_code), '');

    if v_pricing_uom_code is null then
        raise exception 'Product Pricing UOM is required.';
    end if;


    if p_maximum_discount_percent is null then
        raise exception
            'Maximum Discount Percent is required.';
    end if;


    if p_maximum_discount_percent < 0
       or p_maximum_discount_percent > 100 then
        raise exception
            'Maximum Discount Percent must be between 0 and 100.';
    end if;


    select
        p.product_code,
        p.product_name
    into
        v_product_code,
        v_product_name

    from public.products p

    where p.product_id = p_product_id
      and p.is_active = true
      and p.is_deleted = false

    for update;


    if not found then
        raise exception
            'Selected Product is missing, inactive, or deleted.';
    end if;


    perform public.assert_product_pricing_uom_supported(
        p_product_id,
        v_pricing_uom_code
    );


    select pu.conversion_to_base
    into v_factor

    from public.product_units pu

    where pu.product_id = p_product_id
      and pu.uom_code = v_pricing_uom_code
      and pu.is_active = true
      and pu.is_deleted = false;


    update public.products
    set
        pricing_uom_code = v_pricing_uom_code,
        maximum_discount_percent =
            p_maximum_discount_percent,
        updated_at = now(),
        updated_by = v_user_id

    where product_id = p_product_id;


    return jsonb_build_object(
        'product_id',
            p_product_id,

        'product_code',
            v_product_code,

        'product_name',
            v_product_name,

        'pricing_uom_code',
            v_pricing_uom_code,

        'pricing_uom_factor_to_base',
            v_factor,

        'maximum_discount_percent',
            p_maximum_discount_percent
    );
end;
$function$;
-- set_product_selling_price_matrix_atomic(p_product_id uuid, p_price_uom_code text, p_effective_from date, p_prices jsonb)
CREATE OR REPLACE FUNCTION public.set_product_selling_price_matrix_atomic(p_product_id uuid, p_price_uom_code text, p_effective_from date, p_prices jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
declare
    v_user_id uuid := auth.uid();

    v_product_code text;
    v_pricing_uom_code text;
    v_requested_uom_code text;

    v_entry jsonb;

    v_price_book_id uuid;
    v_unit_price numeric;
    v_minimum_price numeric;

    v_price_book_line_id uuid;

    v_result jsonb := '[]'::jsonb;
begin

    if v_user_id is null then
        raise exception 'Authentication is required.';
    end if;


    if not public.has_permission(
        'products.manage_sales_prices'
    ) then
        raise exception
            'Permission products.manage_sales_prices is required.';
    end if;


    if p_product_id is null then
        raise exception 'Product is required.';
    end if;


    v_requested_uom_code :=
        nullif(btrim(p_price_uom_code), '');


    if v_requested_uom_code is null then
        raise exception 'Pricing UOM is required.';
    end if;


    if p_effective_from is null then
        raise exception
            'Effective From date is required.';
    end if;


    if p_prices is null
       or jsonb_typeof(p_prices) <> 'array'
       or jsonb_array_length(p_prices) = 0 then

        raise exception
            'At least one Price Book selling price is required.';
    end if;


    /* ----------------------------------------------------------------
    Product Pricing UOM
    ---------------------------------------------------------------- */

    select
        p.product_code,
        p.pricing_uom_code

    into
        v_product_code,
        v_pricing_uom_code

    from public.products p

    where p.product_id = p_product_id
      and p.is_active = true
      and p.is_deleted = false;


    if not found then
        raise exception
            'Selected Product is inactive, deleted, or does not exist.';
    end if;


    if v_pricing_uom_code is null then
        raise exception
            'Product % does not have a Pricing UOM configured.',
            v_product_code;
    end if;


    perform public.assert_product_pricing_uom_supported(
        p_product_id,
        v_pricing_uom_code
    );


    if v_requested_uom_code
       is distinct from v_pricing_uom_code then

        raise exception
            'Product % Pricing UOM is %. Price Matrix cannot be saved at UOM %.',
            v_product_code,
            v_pricing_uom_code,
            v_requested_uom_code;
    end if;


    /* ----------------------------------------------------------------
    No duplicate Price Book within one payload
    ---------------------------------------------------------------- */

    if exists (
        select 1
        from (
            select
                nullif(value ->> 'price_book_id', '')::uuid
                    as price_book_id,
                count(*) as row_count

            from jsonb_array_elements(p_prices)

            group by
                nullif(value ->> 'price_book_id', '')::uuid

            having count(*) > 1
        ) duplicate_rows
    ) then
        raise exception
            'Each Price Book may be supplied only once.';
    end if;


    /* ----------------------------------------------------------------
    Write every Price Book through authoritative writer
    ---------------------------------------------------------------- */

    for v_entry in
        select value
        from jsonb_array_elements(p_prices)
    loop

        begin
            v_price_book_id :=
                nullif(
                    v_entry ->> 'price_book_id',
                    ''
                )::uuid;

        exception
            when invalid_text_representation then
                raise exception
                    'A Price Book ID is invalid.';
        end;


        if v_price_book_id is null then
            raise exception
                'Price Book is required for every selling price.';
        end if;


        begin
            v_unit_price :=
                nullif(
                    v_entry ->> 'unit_price',
                    ''
                )::numeric;

        exception
            when invalid_text_representation then
                raise exception
                    'Selling Price is invalid for Price Book %.',
                    v_price_book_id;
        end;


        if v_unit_price is null then
            raise exception
                'Selling Price is required for Price Book %.',
                v_price_book_id;
        end if;


        begin
            v_minimum_price :=
                nullif(
                    v_entry ->> 'minimum_price',
                    ''
                )::numeric;

        exception
            when invalid_text_representation then
                raise exception
                    'Minimum Selling Price is invalid for Price Book %.',
                    v_price_book_id;
        end;


        v_price_book_line_id :=
            public.set_price_book_product_selling_price_atomic(
                v_price_book_id,
                p_product_id,
                v_pricing_uom_code,
                v_unit_price,
                v_minimum_price,
                p_effective_from
            );


        v_result :=
            v_result
            || jsonb_build_array(
                jsonb_build_object(
                    'price_book_id',
                        v_price_book_id,

                    'price_book_line_id',
                        v_price_book_line_id,

                    'pricing_uom_code',
                        v_pricing_uom_code,

                    'unit_price',
                        v_unit_price,

                    'minimum_price',
                        v_minimum_price
                )
            );

    end loop;


    return v_result;

end;
$function$;
-- set_standard_product_selling_price_atomic(p_product_id uuid, p_price_uom_code text, p_unit_price numeric, p_minimum_price numeric, p_effective_from date)
CREATE OR REPLACE FUNCTION public.set_standard_product_selling_price_atomic(p_product_id uuid, p_price_uom_code text, p_unit_price numeric, p_minimum_price numeric DEFAULT NULL::numeric, p_effective_from date DEFAULT CURRENT_DATE)
 RETURNS uuid
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
declare
    v_default_price_book_id uuid;
begin
    if auth.uid() is null then
        raise exception 'Authentication is required.';
    end if;


    select
        pb.price_book_id
    into
        v_default_price_book_id
    from public.price_books pb
    where pb.is_default = true
      and pb.is_active = true
      and pb.is_deleted = false
      and (
            pb.effective_from is null
            or pb.effective_from <= p_effective_from
          )
      and (
            pb.effective_to is null
            or pb.effective_to >= p_effective_from
          )
    order by
        pb.updated_at desc
    limit 1;


    if v_default_price_book_id is null then
        raise exception
            'No active Default Price Book is configured on %.',
            p_effective_from;
    end if;


    return public.set_price_book_product_selling_price_atomic(
        v_default_price_book_id,
        p_product_id,
        p_price_uom_code,
        p_unit_price,
        p_minimum_price,
        p_effective_from
    );
end;
$function$;
-- update_draft_quotation_progress_atomic(p_quotation_id uuid, p_quotation jsonb, p_lines jsonb, p_billing_units jsonb, p_billing_allocations jsonb)
CREATE OR REPLACE FUNCTION public.update_draft_quotation_progress_atomic(p_quotation_id uuid, p_quotation jsonb, p_lines jsonb, p_billing_units jsonb DEFAULT NULL::jsonb, p_billing_allocations jsonb DEFAULT NULL::jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$

declare

    v_user_id uuid :=
        auth.uid();


    v_existing public.quotations%rowtype;


    v_customer_price_book_id uuid;

    v_requested_price_book_id uuid;

    v_issue_date date;


    v_line jsonb;

    v_resolved_lines jsonb :=
        '[]'::jsonb;

    v_line_metadata jsonb :=
        '[]'::jsonb;


    v_line_no integer := 0;


    v_product_id uuid;

    v_sales_uom_code text;

    v_quantity numeric;


    v_requested_unit_price numeric;


    v_requested_discount_percent numeric;

    v_discount_reason text;


    v_line_uid uuid;

    v_billing_method text;


    v_existing_line_uid uuid;

    v_existing_billing_method text;


    v_has_existing_billing boolean;


    v_snapshot record;


    v_result jsonb;

begin

    /* ========================================================================
    Authentication / permission
    ======================================================================== */

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


    /* ========================================================================
    Input
    ======================================================================== */

    if p_quotation_id is null then
        raise exception
            'Quotation ID is required.';
    end if;


    if p_quotation is null
       or jsonb_typeof(p_quotation) <> 'object' then
        raise exception
            'Quotation header must be a JSON object.';
    end if;


    if p_lines is null
       or jsonb_typeof(p_lines) <> 'array'
       or jsonb_array_length(p_lines) = 0 then
        raise exception
            'At least one Quotation line is required.';
    end if;


    if (
        p_billing_units is null
        and p_billing_allocations is not null
    )
    or (
        p_billing_units is not null
        and p_billing_allocations is null
    ) then
        raise exception
            'Billing Units and Billing Allocations must be supplied together.';
    end if;


    if p_billing_units is not null
       and jsonb_typeof(p_billing_units) <> 'array' then
        raise exception
            'Billing Units must be a JSON array.';
    end if;


    if p_billing_allocations is not null
       and jsonb_typeof(p_billing_allocations) <> 'array' then
        raise exception
            'Billing Allocations must be a JSON array.';
    end if;


    /* ========================================================================
    Lock Draft
    ======================================================================== */

    select q.*
    into v_existing

    from public.quotations q

    where q.quotation_id =
          p_quotation_id

      and q.is_active = true
      and q.is_deleted = false

    for update;


    if not found then
        raise exception
            'Quotation does not exist, is inactive, or is deleted.';
    end if;


    if v_existing.quotation_status <> 'Draft' then
        raise exception
            'Only a Draft Quotation can be updated.';
    end if;


    /* ========================================================================
    Customer Price Book
    ======================================================================== */

    select c.price_book_id
    into v_customer_price_book_id

    from public.customers c

    where c.customer_id =
          v_existing.customer_id

      and c.is_active = true
      and c.is_deleted = false;


    if v_customer_price_book_id is null then
        raise exception
            'Customer must have a Price Book before updating the Quotation.';
    end if;


    begin

        v_requested_price_book_id :=
            case
                when
                    p_quotation
                    ? 'price_book_id'
                then
                    nullif(
                        btrim(
                            p_quotation
                            ->> 'price_book_id'
                        ),
                        ''
                    )::uuid

                else
                    v_existing.price_book_id
            end;


        v_issue_date :=
            case
                when
                    p_quotation
                    ? 'issue_date'
                then
                    coalesce(
                        nullif(
                            btrim(
                                p_quotation
                                ->> 'issue_date'
                            ),
                            ''
                        )::date,

                        v_existing.issue_date,

                        current_date
                    )

                else
                    coalesce(
                        v_existing.issue_date,
                        current_date
                    )
            end;

    exception
        when others then
            raise exception
                'Invalid Price Book or Issue Date.';
    end;


    if v_requested_price_book_id
       is distinct from
       v_customer_price_book_id then

        raise exception
            'Quotation Price Book must match the Customer Price Book.';
    end if;


    /* ========================================================================
    Existing Billing Breakdown
    ======================================================================== */

    select exists (

        select 1

        from public.quotation_line_billing_allocations a

        where a.quotation_id =
              p_quotation_id

          and a.is_active = true
          and a.is_deleted = false

    )
    into v_has_existing_billing;


    /* ========================================================================
    Resolve replacement lines
    ======================================================================== */

    for v_line in

        select value
        from jsonb_array_elements(p_lines)

    loop

        v_line_no :=
            v_line_no + 1;


        if jsonb_typeof(v_line) <> 'object' then
            raise exception
                'Quotation line % must be a JSON object.',
                v_line_no;
        end if;


        /*
        Legacy fallback identity by current line number.

        line_uid from frontend remains authoritative when supplied.
        */

        select
            ql.line_uid,
            ql.billing_method

        into
            v_existing_line_uid,
            v_existing_billing_method

        from public.quotation_lines ql

        where ql.quotation_id =
              p_quotation_id

          and ql.line_no =
              v_line_no

          and ql.is_deleted = false;


        if v_has_existing_billing
           and nullif(
                btrim(
                    v_line ->> 'line_uid'
                ),
                ''
           ) is null then

            raise exception
                'Quotation already has Billing Breakdown. line_uid is required on every line update.';
        end if;


        begin

            v_product_id :=
                nullif(
                    btrim(
                        v_line ->> 'product_id'
                    ),
                    ''
                )::uuid;


            /*
            Parsed only for manual lines.

            For Product lines this value has NO authority.
            */

            v_requested_unit_price :=
                nullif(
                    btrim(
                        v_line ->> 'unit_price'
                    ),
                    ''
                )::numeric;


            v_quantity :=
                nullif(
                    btrim(
                        v_line ->> 'quantity'
                    ),
                    ''
                )::numeric;


            /*
            NULL is intentional when the client did not explicitly
            supply Discount Percent.

            Snapshot engine then preserves existing Product discount.
            */

            v_requested_discount_percent :=
                case
                    when
                        v_line
                        ? 'discount_percent'
                    then
                        nullif(
                            btrim(
                                v_line
                                ->> 'discount_percent'
                            ),
                            ''
                        )::numeric
                    else
                        null
                end;


            v_line_uid :=
                coalesce(
                    nullif(
                        btrim(
                            v_line ->> 'line_uid'
                        ),
                        ''
                    )::uuid,

                    v_existing_line_uid,

                    gen_random_uuid()
                );

        exception
            when others then
                raise exception
                    'Quotation line % contains an invalid Product, Quantity, Unit Price, Discount, or line_uid.',
                    v_line_no;
        end;


        if v_quantity is null
           or v_quantity <= 0 then
            raise exception
                'Quotation line % Quantity must be greater than zero.',
                v_line_no;
        end if;


        v_sales_uom_code :=
            nullif(
                btrim(
                    v_line
                    ->> 'sales_uom_code'
                ),
                ''
            );


        v_discount_reason :=
            nullif(
                btrim(
                    v_line
                    ->> 'discount_reason'
                ),
                ''
            );


        v_billing_method :=
            coalesce(
                nullif(
                    btrim(
                        v_line
                        ->> 'billing_method'
                    ),
                    ''
                ),

                v_existing_billing_method,

                'Quantity'
            );


        if v_billing_method not in (
            'Quantity',
            'WorkUnit',
            'Percentage'
        ) then
            raise exception
                'Quotation line % has invalid Billing Method: %.',
                v_line_no,
                v_billing_method;
        end if;


        /* ====================================================================
        Manual / non-product line

        Existing behaviour retained.
        ==================================================================== */

        if v_product_id is null then

            if v_requested_unit_price is null then
                raise exception
                    'Manual Quotation line % requires a Unit Price.',
                    v_line_no;
            end if;


            if v_requested_unit_price < 0 then
                raise exception
                    'Quotation line % Unit Price cannot be negative.',
                    v_line_no;
            end if;


            v_requested_discount_percent :=
                coalesce(
                    v_requested_discount_percent,
                    0
                );


            if v_requested_discount_percent < 0
               or v_requested_discount_percent > 100 then

                raise exception
                    'Quotation line % Discount Percent must be between 0 and 100.',
                    v_line_no;
            end if;


            if v_requested_discount_percent > 0 then

                if not public.has_permission(
                    'quotations.apply_discount'
                ) then
                    raise exception
                        'Permission quotations.apply_discount is required to apply a Quotation discount.';
                end if;


                if v_discount_reason is null then
                    raise exception
                        'Discount Reason is required when Quotation discount is greater than zero.';
                end if;

            else
                v_discount_reason := null;
            end if;


            v_resolved_lines :=
                v_resolved_lines
                || jsonb_build_array(

                    v_line

                    || jsonb_build_object(
                        'quantity',
                            v_quantity,

                        'unit_price',
                            v_requested_unit_price,

                        'discount_percent',
                            v_requested_discount_percent
                    )
                );


            v_line_metadata :=
                v_line_metadata
                || jsonb_build_array(

                    jsonb_build_object(
                        'line_no',
                            v_line_no,

                        'line_uid',
                            v_line_uid,

                        'billing_method',
                            v_billing_method,

                        'price_book_id',
                            v_customer_price_book_id,

                        'price_book_line_id',
                            null,

                        'price_source',
                            'Manual',

                        'original_unit_price',
                            v_requested_unit_price,

                        'minimum_price_snapshot',
                            null,

                        'manual_price_reason',
                            nullif(
                                btrim(
                                    v_line
                                    ->> 'manual_price_reason'
                                ),
                                ''
                            ),

                        'discount_reason',
                            v_discount_reason,

                        'pricing_action',
                            'MANUAL_LINE'
                    )
                );


            continue;

        end if;


        /* ====================================================================
        Product line
        ==================================================================== */

        if v_sales_uom_code is null then
            raise exception
                'Sales UOM is required for Product line %.',
                v_line_no;
        end if;


        select *
        into v_snapshot

        from public.resolve_quotation_draft_product_line(

            p_quotation_id,

            /*
            Supplied/stable line_uid.
            If it does not resolve, the engine uses line_no fallback.
            */
            v_line_uid,

            v_line_no,

            v_product_id,

            v_sales_uom_code,

            v_quantity,

            v_requested_discount_percent,

            v_discount_reason,

            v_customer_price_book_id,

            v_issue_date
        );


        if not found then
            raise exception
                'Quotation line % could not resolve its Draft pricing snapshot.',
                v_line_no;
        end if;


        /*
        Client unit_price, conversion_factor, base_uom_code and
        allow_fractional_quantity are overwritten by backend values.
        */

        v_resolved_lines :=
            v_resolved_lines
            || jsonb_build_array(

                v_line

                || jsonb_build_object(
                    'quantity',
                        v_snapshot.quantity,

                    'unit_price',
                        v_snapshot.unit_price,

                    'discount_percent',
                        v_snapshot.discount_percent,

                    'sales_uom_code',
                        v_snapshot.sales_uom_code,

                    'base_uom_code',
                        v_snapshot.base_uom_code,

                    'conversion_factor',
                        v_snapshot.conversion_factor,

                    'allow_fractional_quantity',
                        v_snapshot.allow_fractional_quantity
                )
            );


        v_line_metadata :=
            v_line_metadata
            || jsonb_build_array(

                jsonb_build_object(
                    'line_no',
                        v_line_no,

                    'line_uid',
                        v_snapshot.line_uid,

                    'billing_method',
                        v_billing_method,

                    'price_book_id',
                        v_snapshot.price_book_id,

                    'price_book_line_id',
                        v_snapshot.price_book_line_id,

                    'price_source',
                        v_snapshot.price_source,

                    'original_unit_price',
                        v_snapshot.original_unit_price,

                    'minimum_price_snapshot',
                        v_snapshot.minimum_price_snapshot,

                    'manual_price_reason',
                        null,

                    'discount_reason',
                        v_snapshot.discount_reason,

                    'pricing_action',
                        v_snapshot.pricing_action
                )
            );

    end loop;


    /* ========================================================================
    Existing authoritative core Draft replacement RPC
    ======================================================================== */

    v_result :=
        public.update_draft_quotation_atomic(

            p_quotation_id,

            p_quotation

            || jsonb_build_object(
                'price_book_id',
                v_customer_price_book_id
            ),

            v_resolved_lines
        );


    /* ========================================================================
    Restore stable identities + pricing snapshots
    ======================================================================== */

    update public.quotation_lines ql

    set
        line_uid =
            (m.value ->> 'line_uid')::uuid,

        billing_method =
            m.value ->> 'billing_method',

        price_book_id =
            nullif(
                m.value ->> 'price_book_id',
                ''
            )::uuid,

        price_book_line_id =
            nullif(
                m.value
                ->> 'price_book_line_id',
                ''
            )::uuid,

        price_source =
            nullif(
                m.value ->> 'price_source',
                ''
            ),

        original_unit_price =
            nullif(
                m.value
                ->> 'original_unit_price',
                ''
            )::numeric,

        minimum_price_snapshot =
            nullif(
                m.value
                ->> 'minimum_price_snapshot',
                ''
            )::numeric,

        manual_price_reason =
            nullif(
                m.value
                ->> 'manual_price_reason',
                ''
            ),

        discount_reason =
            nullif(
                btrim(
                    m.value
                    ->> 'discount_reason'
                ),
                ''
            ),

        updated_by =
            v_user_id

    from jsonb_array_elements(
        v_line_metadata
    ) m(value)

    where ql.quotation_id =
          p_quotation_id

      and ql.line_no =
          (m.value ->> 'line_no')::integer

      and ql.is_deleted = false;


    /* ========================================================================
    Billing Breakdown

    Existing Billing Breakdown is preserved unless explicitly supplied.
    ======================================================================== */

    if p_billing_units is not null then

        perform public.replace_draft_quotation_billing_atomic(
            p_quotation_id,
            p_billing_units,
            p_billing_allocations
        );

    end if;


    return
        v_result

        || jsonb_build_object(
            'price_book_id',
                v_customer_price_book_id,

            'progress_billing_ready',
                true
        );

end;
$function$;
-- update_draft_quotation_revision_atomic(p_revision_id uuid, p_revision jsonb, p_lines jsonb)
CREATE OR REPLACE FUNCTION public.update_draft_quotation_revision_atomic(p_revision_id uuid, p_revision jsonb, p_lines jsonb)
 RETURNS jsonb
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$

declare
    v_user_id uuid := auth.uid();

    v_revision
        public.quotation_revisions%rowtype;

    v_parent
        public.quotations%rowtype;


    v_line jsonb;
    v_resolved jsonb :=
        '[]'::jsonb;


    v_line_no integer := 0;
    v_line_count integer := 0;


    v_old_line
        public.quotation_revision_lines%rowtype;

    v_old_found boolean;


    v_line_uid uuid;
    v_quotation_line_id uuid;

    v_product_id uuid;
    v_project_area_id uuid;

    v_description text;

    v_sales_uom_code text;
    v_base_uom_code text;

    v_conversion_factor numeric;
    v_allow_fractional boolean;

    v_quantity numeric;

    v_unit_price numeric;

    v_discount_percent numeric;
    v_discount_reason text;

    v_tax_rate numeric;

    v_cost_price numeric;

    v_is_optional boolean;

    v_billing_method text;

    v_notes text;


    v_snapshot record;


    v_line_subtotal numeric;
    v_discount_amount numeric;
    v_tax_amount numeric;
    v_line_total numeric;

    v_margin_amount numeric;
    v_margin_percent numeric;


    v_subtotal_total numeric := 0;
    v_discount_total numeric := 0;
    v_tax_total numeric := 0;
    v_grand_total numeric := 0;


    v_issue_date date;
    v_valid_until date;

    v_quotation_segment text;
    v_quotation_source text;

    v_header_notes text;
    v_internal_notes text;

    v_revision_reason text;
    v_revision_notes text;


    v_requested_customer_id uuid;
    v_requested_site_id uuid;
    v_requested_price_book_id uuid;


    v_deleted_at timestamptz;

begin

    /* ========================================================================
    1. Authentication / Permission
    ======================================================================== */

    if v_user_id is null then
        raise exception
            'Authentication is required.';
    end if;


    if not public.has_permission(
        'quotations.update_revision'
    ) then
        raise exception
            'Permission denied: quotations.update_revision is required.';
    end if;


    if p_revision_id is null then
        raise exception
            'Quotation Revision ID is required.';
    end if;


    if p_revision is null
       or jsonb_typeof(p_revision)
          <> 'object' then

        raise exception
            'Quotation Revision header must be a JSON object.';
    end if;


    if p_lines is null
       or jsonb_typeof(p_lines)
          <> 'array'
       or jsonb_array_length(p_lines) = 0 then

        raise exception
            'At least one Quotation Revision line is required.';
    end if;


    /* ========================================================================
    2. Lock Revision
    ======================================================================== */

    select qr.*
    into v_revision

    from public.quotation_revisions qr

    where qr.revision_id =
          p_revision_id

      and qr.is_active = true
      and qr.is_deleted = false

    for update;


    if not found then
        raise exception
            'Quotation Revision was not found.';
    end if;


    if v_revision.revision_status <>
       'Draft' then

        raise exception
            'Only a Draft Quotation Revision can be updated.';

    end if;


    /* ========================================================================
    3. Lock Parent
    ======================================================================== */

    select q.*
    into v_parent

    from public.quotations q

    where q.quotation_id =
          v_revision.quotation_id

      and q.is_active = true
      and q.is_deleted = false

    for update;


    if not found then
        raise exception
            'Parent Quotation was not found.';
    end if;


    if v_parent.quotation_status
       not in (
           'Sent',
           'Revised'
       ) then

        raise exception
            'Parent Quotation must be Sent or Revised while editing a Draft Revision.';

    end if;


    if v_parent.current_revision_id
       is distinct from
       p_revision_id then

        raise exception
            'Only the current Draft Revision can be updated.';

    end if;


    if v_parent.accepted_revision_id
       is not null
       or v_parent.accepted_at
          is not null
       or v_parent.accepted_by
          is not null then

        raise exception
            'Accepted Quotation cannot be updated. Use a Variation.';

    end if;


    /* ========================================================================
    4. Immutable Customer / Site / Price Book
    ======================================================================== */

    if p_revision ? 'customer_id' then

        v_requested_customer_id :=
            nullif(
                btrim(
                    p_revision
                    ->> 'customer_id'
                ),
                ''
            )::uuid;


        if v_requested_customer_id
           is distinct from
           v_revision.customer_id then

            raise exception
                'Revision Customer cannot be changed.';

        end if;

    end if;


    if p_revision ? 'project_site_id' then

        v_requested_site_id :=
            nullif(
                btrim(
                    p_revision
                    ->> 'project_site_id'
                ),
                ''
            )::uuid;


        if v_requested_site_id
           is distinct from
           v_revision.project_site_id then

            raise exception
                'Revision Project Site cannot be changed.';

        end if;

    end if;


    if p_revision ? 'price_book_id' then

        v_requested_price_book_id :=
            nullif(
                btrim(
                    p_revision
                    ->> 'price_book_id'
                ),
                ''
            )::uuid;


        if v_requested_price_book_id
           is distinct from
           v_revision.price_book_id then

            raise exception
                'Revision Price Book cannot be changed.';

        end if;

    end if;


    /* ========================================================================
    5. Header values
    ======================================================================== */

    begin

        v_issue_date :=
            case
                when p_revision
                     ? 'issue_date'
                then
                    coalesce(
                        nullif(
                            btrim(
                                p_revision
                                ->> 'issue_date'
                            ),
                            ''
                        )::date,
                        v_revision.issue_date
                    )
                else
                    v_revision.issue_date
            end;


        v_valid_until :=
            case
                when p_revision
                     ? 'valid_until'
                then
                    nullif(
                        btrim(
                            p_revision
                            ->> 'valid_until'
                        ),
                        ''
                    )::date
                else
                    v_revision.valid_until
            end;

    exception
        when others then
            raise exception
                'Invalid Revision date value.';
    end;


    if v_issue_date is not null
       and v_valid_until is not null
       and v_valid_until <
           v_issue_date then

        raise exception
            'Valid Until cannot be earlier than Issue Date.';

    end if;


    v_quotation_segment :=
        case
            when p_revision
                 ? 'quotation_segment'
            then
                coalesce(
                    nullif(
                        btrim(
                            p_revision
                            ->> 'quotation_segment'
                        ),
                        ''
                    ),
                    v_revision.quotation_segment
                )
            else
                v_revision.quotation_segment
        end;


    v_quotation_source :=
        case
            when p_revision
                 ? 'quotation_source'
            then
                coalesce(
                    nullif(
                        btrim(
                            p_revision
                            ->> 'quotation_source'
                        ),
                        ''
                    ),
                    v_revision.quotation_source
                )
            else
                v_revision.quotation_source
        end;


    v_header_notes :=
        case
            when p_revision ? 'notes'
            then nullif(
                btrim(
                    p_revision ->> 'notes'
                ),
                ''
            )
            else v_revision.notes
        end;


    v_internal_notes :=
        case
            when p_revision
                 ? 'internal_notes'
            then nullif(
                btrim(
                    p_revision
                    ->> 'internal_notes'
                ),
                ''
            )
            else
                v_revision.internal_notes
        end;


    v_revision_reason :=
        case
            when p_revision
                 ? 'revision_reason'
            then nullif(
                btrim(
                    p_revision
                    ->> 'revision_reason'
                ),
                ''
            )
            else
                v_revision.revision_reason
        end;


    v_revision_notes :=
        case
            when p_revision
                 ? 'revision_notes'
            then nullif(
                btrim(
                    p_revision
                    ->> 'revision_notes'
                ),
                ''
            )
            else
                v_revision.revision_notes
        end;


    /* ========================================================================
    6. Lock existing lines
    ======================================================================== */

    perform 1

    from public.quotation_revision_lines qrl

    where qrl.revision_id =
          p_revision_id

    for update;


    /* ========================================================================
    7. Resolve every requested line BEFORE deleting existing lines
    ======================================================================== */

    for v_line in

        select value
        from jsonb_array_elements(
            p_lines
        )

    loop

        v_line_no :=
            v_line_no + 1;


        if jsonb_typeof(v_line)
           <> 'object' then

            raise exception
                'Revision line % must be a JSON object.',
                v_line_no;

        end if;


        /* --------------------------------------------------------------------
        Identity
        -------------------------------------------------------------------- */

        begin

            v_line_uid :=
                nullif(
                    btrim(
                        v_line
                        ->> 'line_uid'
                    ),
                    ''
                )::uuid;


            v_product_id :=
                nullif(
                    btrim(
                        v_line
                        ->> 'product_id'
                    ),
                    ''
                )::uuid;


            v_project_area_id :=
                nullif(
                    btrim(
                        v_line
                        ->> 'project_area_id'
                    ),
                    ''
                )::uuid;


            v_quantity :=
                nullif(
                    btrim(
                        v_line
                        ->> 'quantity'
                    ),
                    ''
                )::numeric;

        exception
            when others then
                raise exception
                    'Revision line % contains an invalid ID or Quantity.',
                    v_line_no;
        end;


        /* --------------------------------------------------------------------
        Locate current Draft row.

        line_uid first.
        line_no only as legacy fallback.
        -------------------------------------------------------------------- */

        v_old_found := false;


        if v_line_uid is not null then

            select qrl.*
            into v_old_line

            from public.quotation_revision_lines qrl

            where qrl.revision_id =
                  p_revision_id

              and qrl.line_uid =
                  v_line_uid

              and qrl.is_deleted = false

            limit 1;


            if found then
                v_old_found := true;
            end if;

        end if;


        if not v_old_found then

            select qrl.*
            into v_old_line

            from public.quotation_revision_lines qrl

            where qrl.revision_id =
                  p_revision_id

              and qrl.line_no =
                  v_line_no

              and qrl.is_deleted = false

            limit 1;


            if found then
                v_old_found := true;

                if v_line_uid is null then
                    v_line_uid :=
                        v_old_line.line_uid;
                end if;

            end if;

        end if;


        v_line_uid :=
            coalesce(
                v_line_uid,
                gen_random_uuid()
            );


        /* --------------------------------------------------------------------
        Description / Notes
        -------------------------------------------------------------------- */

        v_description :=
            coalesce(
                nullif(
                    btrim(
                        v_line
                        ->> 'description'
                    ),
                    ''
                ),

                case
                    when v_old_found
                    then
                        v_old_line.description
                    else
                        null
                end
            );


        if v_description is null then
            raise exception
                'Description is required on Revision line %.',
                v_line_no;
        end if;


        v_notes :=
            case
                when v_line ? 'notes'
                then
                    nullif(
                        btrim(
                            v_line ->> 'notes'
                        ),
                        ''
                    )

                when v_old_found
                then
                    v_old_line.notes

                else
                    null
            end;


        /* --------------------------------------------------------------------
        Billing Method
        -------------------------------------------------------------------- */

        v_billing_method :=
            coalesce(
                nullif(
                    btrim(
                        v_line
                        ->> 'billing_method'
                    ),
                    ''
                ),

                case
                    when v_old_found
                    then
                        v_old_line.billing_method
                    else
                        null
                end,

                'Quantity'
            );


        if v_billing_method not in (
            'Quantity',
            'WorkUnit',
            'Percentage'
        ) then

            raise exception
                'Invalid Billing Method on Revision line %.',
                v_line_no;

        end if;


        /* --------------------------------------------------------------------
        Optional
        -------------------------------------------------------------------- */

        begin

            v_is_optional :=
                case
                    when v_line
                         ? 'is_optional'
                    then
                        coalesce(
                            nullif(
                                btrim(
                                    v_line
                                    ->> 'is_optional'
                                ),
                                ''
                            )::boolean,
                            false
                        )

                    when v_old_found
                    then
                        v_old_line.is_optional

                    else
                        false
                end;

        exception
            when others then
                raise exception
                    'Invalid is_optional on Revision line %.',
                    v_line_no;
        end;


        /* --------------------------------------------------------------------
        Tax
        -------------------------------------------------------------------- */

        begin

            v_tax_rate :=
                case
                    when v_line
                         ? 'tax_rate'
                    then
                        coalesce(
                            nullif(
                                btrim(
                                    v_line
                                    ->> 'tax_rate'
                                ),
                                ''
                            )::numeric,
                            0
                        )

                    when v_old_found
                    then
                        v_old_line.tax_rate

                    else
                        0
                end;


            v_cost_price :=
                case
                    when v_line
                         ? 'cost_price'
                    then
                        nullif(
                            btrim(
                                v_line
                                ->> 'cost_price'
                            ),
                            ''
                        )::numeric

                    when v_old_found
                    then
                        v_old_line.cost_price

                    else
                        null
                end;

        exception
            when others then
                raise exception
                    'Invalid Tax Rate or Cost Price on Revision line %.',
                    v_line_no;
        end;


        if v_tax_rate < 0 then
            raise exception
                'Tax Rate cannot be negative on Revision line %.',
                v_line_no;
        end if;


        if v_cost_price is not null
           and v_cost_price < 0 then

            raise exception
                'Cost Price cannot be negative on Revision line %.',
                v_line_no;

        end if;


        /* --------------------------------------------------------------------
        Area validation
        -------------------------------------------------------------------- */

        if v_project_area_id
           is not null
           and not exists (

                select 1

                from public.project_areas pa

                where pa.area_id =
                      v_project_area_id

                  and pa.site_id =
                      v_revision.project_site_id

                  and pa.is_active = true
                  and pa.is_deleted = false

           ) then

            raise exception
                'Project Area on Revision line % does not belong to the Revision Site.',
                v_line_no;

        end if;


        /* ====================================================================
        PRODUCT LINE
        ==================================================================== */

        if v_product_id is not null then

            if v_quantity is null
               or v_quantity <= 0 then

                raise exception
                    'Quantity must be greater than zero on Product Revision line %.',
                    v_line_no;

            end if;


            v_sales_uom_code :=
                nullif(
                    btrim(
                        v_line
                        ->> 'sales_uom_code'
                    ),
                    ''
                );


            if v_sales_uom_code
               is null then

                raise exception
                    'Sales UOM is required on Product Revision line %.',
                    v_line_no;

            end if;


            begin

                v_discount_percent :=
                    case
                        when v_line
                             ? 'discount_percent'
                        then
                            nullif(
                                btrim(
                                    v_line
                                    ->> 'discount_percent'
                                ),
                                ''
                            )::numeric

                        else
                            null
                    end;

            exception
                when others then
                    raise exception
                        'Invalid Discount Percent on Revision line %.',
                        v_line_no;
            end;


            v_discount_reason :=
                nullif(
                    btrim(
                        v_line
                        ->> 'discount_reason'
                    ),
                    ''
                );


            select *
            into v_snapshot

            from public.resolve_quotation_revision_draft_product_line(
                p_revision_id,

                v_line_uid,

                v_line_no,

                v_product_id,

                v_sales_uom_code,

                v_quantity,

                v_discount_percent,

                v_discount_reason,

                v_revision.price_book_id,

                coalesce(
                    v_issue_date,
                    current_date
                )
            );


            if not found then
                raise exception
                    'Could not resolve Product pricing snapshot on Revision line %.',
                    v_line_no;
            end if;


            v_line_uid :=
                v_snapshot.line_uid;


            v_quotation_line_id :=
                v_snapshot.quotation_line_id;


            v_quantity :=
                v_snapshot.quantity;


            v_sales_uom_code :=
                v_snapshot.sales_uom_code;


            v_base_uom_code :=
                v_snapshot.base_uom_code;


            v_conversion_factor :=
                v_snapshot.conversion_factor;


            v_allow_fractional :=
                v_snapshot.allow_fractional_quantity;


            v_unit_price :=
                v_snapshot.unit_price;


            v_discount_percent :=
                v_snapshot.discount_percent;


            v_discount_reason :=
                v_snapshot.discount_reason;


            /* ----------------------------------------------------------------
            Server calculations
            ---------------------------------------------------------------- */

            v_line_subtotal :=
                round(
                    v_quantity
                    * v_unit_price,
                    2
                );


            v_discount_amount :=
                round(
                    v_line_subtotal
                    * v_discount_percent
                    / 100,
                    2
                );


            v_tax_amount :=
                round(
                    (
                        v_line_subtotal
                        - v_discount_amount
                    )
                    * v_tax_rate
                    / 100,
                    2
                );


            v_line_total :=
                round(
                    v_line_subtotal
                    - v_discount_amount
                    + v_tax_amount,
                    2
                );


            if v_cost_price is null then

                v_margin_amount := null;
                v_margin_percent := null;

            else

                v_margin_amount :=
                    round(
                        (
                            v_unit_price
                            - v_cost_price
                        )
                        * v_quantity
                        - v_discount_amount,
                        2
                    );


                if (
                    v_line_subtotal
                    - v_discount_amount
                ) > 0 then

                    v_margin_percent :=
                        round(
                            v_margin_amount
                            /
                            (
                                v_line_subtotal
                                - v_discount_amount
                            )
                            * 100,
                            2
                        );

                else
                    v_margin_percent := null;
                end if;

            end if;


            v_resolved :=
                v_resolved
                || jsonb_build_array(

                    jsonb_build_object(
                        'line_no',
                            v_line_no,

                        'quotation_line_id',
                            v_quotation_line_id,

                        'line_uid',
                            v_line_uid,

                        'product_id',
                            v_product_id,

                        'project_area_id',
                            v_project_area_id,

                        'description',
                            v_description,

                        'unit_of_measure',
                            v_sales_uom_code,

                        'quantity',
                            v_quantity,

                        'unit_price',
                            v_unit_price,

                        'discount_percent',
                            v_discount_percent,

                        'discount_amount',
                            v_discount_amount,

                        'discount_reason',
                            v_discount_reason,

                        'tax_rate',
                            v_tax_rate,

                        'tax_amount',
                            v_tax_amount,

                        'line_total',
                            v_line_total,

                        'cost_price',
                            v_cost_price,

                        'margin_amount',
                            v_margin_amount,

                        'margin_percent',
                            v_margin_percent,

                        'notes',
                            v_notes,

                        'sales_uom_code',
                            v_sales_uom_code,

                        'base_uom_code',
                            v_base_uom_code,

                        'conversion_factor',
                            v_conversion_factor,

                        'base_quantity',
                            v_snapshot.base_quantity,

                        'allow_fractional_quantity',
                            v_allow_fractional,

                        'is_optional',
                            v_is_optional,

                        'billing_method',
                            v_billing_method,

                        'price_book_id',
                            v_snapshot.price_book_id,

                        'price_book_line_id',
                            v_snapshot.price_book_line_id,

                        'price_source',
                            v_snapshot.price_source,

                        'original_unit_price',
                            v_snapshot.original_unit_price,

                        'minimum_price_snapshot',
                            v_snapshot.minimum_price_snapshot,

                        'manual_price_reason',
                            null
                    )
                );


        /* ====================================================================
        MANUAL / NON-PRODUCT LINE
        ==================================================================== */

        else

            if v_quantity is null
               or v_quantity <= 0 then

                raise exception
                    'Quantity must be greater than zero on Manual Revision line %.',
                    v_line_no;

            end if;


            v_quotation_line_id :=
                case
                    when v_old_found
                    then
                        v_old_line.quotation_line_id
                    else
                        null
                end;


            v_sales_uom_code :=
                coalesce(
                    nullif(
                        btrim(
                            v_line
                            ->> 'sales_uom_code'
                        ),
                        ''
                    ),

                    case
                        when v_old_found
                        then
                            v_old_line.sales_uom_code
                        else
                            null
                    end
                );


            v_base_uom_code :=
                coalesce(
                    nullif(
                        btrim(
                            v_line
                            ->> 'base_uom_code'
                        ),
                        ''
                    ),

                    case
                        when v_old_found
                        then
                            v_old_line.base_uom_code
                        else
                            null
                    end
                );


            if v_sales_uom_code is null
               or v_base_uom_code is null then

                raise exception
                    'Sales UOM and Base UOM are required on Manual Revision line %.',
                    v_line_no;

            end if;


            begin

                v_conversion_factor :=
                    coalesce(
                        nullif(
                            btrim(
                                v_line
                                ->> 'conversion_factor'
                            ),
                            ''
                        )::numeric,

                        case
                            when v_old_found
                            then
                                v_old_line.conversion_factor
                            else
                                1
                        end
                    );


                v_allow_fractional :=
                    coalesce(
                        nullif(
                            btrim(
                                v_line
                                ->> 'allow_fractional_quantity'
                            ),
                            ''
                        )::boolean,

                        case
                            when v_old_found
                            then
                                v_old_line.allow_fractional_quantity
                            else
                                true
                        end
                    );


                v_unit_price :=
                    coalesce(
                        nullif(
                            btrim(
                                v_line
                                ->> 'unit_price'
                            ),
                            ''
                        )::numeric,

                        case
                            when v_old_found
                            then
                                v_old_line.unit_price
                            else
                                null
                        end
                    );


                v_discount_percent :=
                    case
                        when v_line
                             ? 'discount_percent'
                        then
                            coalesce(
                                nullif(
                                    btrim(
                                        v_line
                                        ->> 'discount_percent'
                                    ),
                                    ''
                                )::numeric,
                                0
                            )

                        when v_old_found
                        then
                            v_old_line.discount_percent

                        else
                            0
                    end;

            exception
                when others then
                    raise exception
                        'Invalid Manual pricing/UOM value on Revision line %.',
                        v_line_no;
            end;


            if v_conversion_factor <= 0 then
                raise exception
                    'Conversion Factor must be greater than zero on Revision line %.',
                    v_line_no;
            end if;


            if v_unit_price is null
               or v_unit_price < 0 then

                raise exception
                    'Manual Unit Price must be zero or greater on Revision line %.',
                    v_line_no;

            end if;


            if not v_allow_fractional
               and v_quantity <>
                   trunc(v_quantity) then

                raise exception
                    'Revision line % does not allow fractional Quantity.',
                    v_line_no;

            end if;


            v_discount_reason :=
                case
                    when v_line
                         ? 'discount_reason'
                    then
                        nullif(
                            btrim(
                                v_line
                                ->> 'discount_reason'
                            ),
                            ''
                        )

                    when v_old_found
                    then
                        v_old_line.discount_reason

                    else
                        null
                end;


            if v_discount_percent < 0
               or v_discount_percent > 100 then

                raise exception
                    'Discount Percent must be between 0 and 100 on Revision line %.',
                    v_line_no;

            end if;


            /*
            New/changed positive Manual discount.
            Exact carry-forward is handled by DB guard.
            */

            if v_discount_percent > 0
               and (
                    not v_old_found
                    or v_discount_percent
                       is distinct from
                       v_old_line.discount_percent
                    or v_discount_reason
                       is distinct from
                       v_old_line.discount_reason
               )
            then

                if not public.has_permission(
                    'quotations.apply_discount'
                ) then

                    raise exception
                        'Permission quotations.apply_discount is required to apply or change a Revision discount.';

                end if;


                if v_discount_reason is null then

                    raise exception
                        'Discount Reason is required when Revision discount is greater than zero.';

                end if;

            end if;


            if v_discount_percent = 0 then
                v_discount_reason := null;
            end if;


            v_line_subtotal :=
                round(
                    v_quantity
                    * v_unit_price,
                    2
                );


            v_discount_amount :=
                round(
                    v_line_subtotal
                    * v_discount_percent
                    / 100,
                    2
                );


            v_tax_amount :=
                round(
                    (
                        v_line_subtotal
                        - v_discount_amount
                    )
                    * v_tax_rate
                    / 100,
                    2
                );


            v_line_total :=
                round(
                    v_line_subtotal
                    - v_discount_amount
                    + v_tax_amount,
                    2
                );


            if v_cost_price is null then

                v_margin_amount := null;
                v_margin_percent := null;

            else

                v_margin_amount :=
                    round(
                        (
                            v_unit_price
                            - v_cost_price
                        )
                        * v_quantity
                        - v_discount_amount,
                        2
                    );


                if (
                    v_line_subtotal
                    - v_discount_amount
                ) > 0 then

                    v_margin_percent :=
                        round(
                            v_margin_amount
                            /
                            (
                                v_line_subtotal
                                - v_discount_amount
                            )
                            * 100,
                            2
                        );

                else
                    v_margin_percent := null;
                end if;

            end if;


            v_resolved :=
                v_resolved
                || jsonb_build_array(

                    jsonb_build_object(
                        'line_no',
                            v_line_no,

                        'quotation_line_id',
                            v_quotation_line_id,

                        'line_uid',
                            v_line_uid,

                        'product_id',
                            null,

                        'project_area_id',
                            v_project_area_id,

                        'description',
                            v_description,

                        'unit_of_measure',
                            v_sales_uom_code,

                        'quantity',
                            v_quantity,

                        'unit_price',
                            v_unit_price,

                        'discount_percent',
                            v_discount_percent,

                        'discount_amount',
                            v_discount_amount,

                        'discount_reason',
                            v_discount_reason,

                        'tax_rate',
                            v_tax_rate,

                        'tax_amount',
                            v_tax_amount,

                        'line_total',
                            v_line_total,

                        'cost_price',
                            v_cost_price,

                        'margin_amount',
                            v_margin_amount,

                        'margin_percent',
                            v_margin_percent,

                        'notes',
                            v_notes,

                        'sales_uom_code',
                            v_sales_uom_code,

                        'base_uom_code',
                            v_base_uom_code,

                        'conversion_factor',
                            v_conversion_factor,

                        'base_quantity',
                            round(
                                v_quantity
                                * v_conversion_factor,
                                6
                            ),

                        'allow_fractional_quantity',
                            v_allow_fractional,

                        'is_optional',
                            v_is_optional,

                        'billing_method',
                            v_billing_method,

                        'price_book_id',
                            null,

                        'price_book_line_id',
                            null,

                        'price_source',
                            'Manual',

                        'original_unit_price',
                            v_unit_price,

                        'minimum_price_snapshot',
                            null,

                        'manual_price_reason',
                            nullif(
                                btrim(
                                    v_line
                                    ->> 'manual_price_reason'
                                ),
                                ''
                            )
                    )
                );

        end if;


        /* ====================================================================
        Header totals
        ==================================================================== */

        if not v_is_optional then

            v_subtotal_total :=
                v_subtotal_total
                + v_line_subtotal;


            v_discount_total :=
                v_discount_total
                + v_discount_amount;


            v_tax_total :=
                v_tax_total
                + v_tax_amount;


            v_grand_total :=
                v_grand_total
                + v_line_total;

        end if;

    end loop;


    v_line_count :=
        jsonb_array_length(
            v_resolved
        );


    /* ========================================================================
    8. Soft-delete old Draft lines

    Business identity is retained through line_uid in replacement rows.
    ======================================================================== */

    v_deleted_at := now();


    update public.quotation_revision_lines

    set
        is_deleted = true,

        deleted_at =
            v_deleted_at,

        updated_at =
            v_deleted_at,

        updated_by =
            v_user_id

    where revision_id =
          p_revision_id

      and is_deleted = false;


    /* ========================================================================
    9. Insert authoritative replacement lines
    ======================================================================== */

    insert into public.quotation_revision_lines (
        revision_id,
        quotation_line_id,
        line_no,

        product_id,
        project_area_id,

        description,
        unit_of_measure,

        quantity,
        unit_price,

        discount_percent,
        discount_amount,
        discount_reason,

        tax_rate,
        tax_amount,
        line_total,

        cost_price,
        margin_amount,
        margin_percent,

        notes,

        sales_uom_code,
        base_uom_code,
        conversion_factor,
        base_quantity,
        allow_fractional_quantity,

        is_optional,
        is_deleted,

        line_uid,
        billing_method,

        price_book_id,
        price_book_line_id,
        price_source,

        original_unit_price,
        minimum_price_snapshot,

        manual_price_reason,

        created_by,
        updated_by
    )

    select
        p_revision_id,

        nullif(
            x.value
            ->> 'quotation_line_id',
            ''
        )::uuid,

        (
            x.value
            ->> 'line_no'
        )::integer,

        nullif(
            x.value
            ->> 'product_id',
            ''
        )::uuid,

        nullif(
            x.value
            ->> 'project_area_id',
            ''
        )::uuid,

        x.value
        ->> 'description',

        x.value
        ->> 'unit_of_measure',

        (
            x.value
            ->> 'quantity'
        )::numeric,

        (
            x.value
            ->> 'unit_price'
        )::numeric,

        (
            x.value
            ->> 'discount_percent'
        )::numeric,

        (
            x.value
            ->> 'discount_amount'
        )::numeric,

        nullif(
            btrim(
                x.value
                ->> 'discount_reason'
            ),
            ''
        ),

        (
            x.value
            ->> 'tax_rate'
        )::numeric,

        (
            x.value
            ->> 'tax_amount'
        )::numeric,

        (
            x.value
            ->> 'line_total'
        )::numeric,

        nullif(
            x.value
            ->> 'cost_price',
            ''
        )::numeric,

        nullif(
            x.value
            ->> 'margin_amount',
            ''
        )::numeric,

        nullif(
            x.value
            ->> 'margin_percent',
            ''
        )::numeric,

        nullif(
            btrim(
                x.value
                ->> 'notes'
            ),
            ''
        ),

        x.value
        ->> 'sales_uom_code',

        x.value
        ->> 'base_uom_code',

        (
            x.value
            ->> 'conversion_factor'
        )::numeric,

        (
            x.value
            ->> 'base_quantity'
        )::numeric,

        (
            x.value
            ->> 'allow_fractional_quantity'
        )::boolean,

        (
            x.value
            ->> 'is_optional'
        )::boolean,

        false,

        (
            x.value
            ->> 'line_uid'
        )::uuid,

        x.value
        ->> 'billing_method',

        nullif(
            x.value
            ->> 'price_book_id',
            ''
        )::uuid,

        nullif(
            x.value
            ->> 'price_book_line_id',
            ''
        )::uuid,

        nullif(
            x.value
            ->> 'price_source',
            ''
        ),

        nullif(
            x.value
            ->> 'original_unit_price',
            ''
        )::numeric,

        nullif(
            x.value
            ->> 'minimum_price_snapshot',
            ''
        )::numeric,

        nullif(
            btrim(
                x.value
                ->> 'manual_price_reason'
            ),
            ''
        ),

        v_user_id,
        v_user_id

    from jsonb_array_elements(
        v_resolved
    ) x(value);


    /* ========================================================================
    10. Existing WorkUnit Billing cannot exceed revised quantity

    Exact equality remains Send validation.
    ======================================================================== */

    if exists (

        select 1

        from public.quotation_revision_lines qrl

        join (
            select
                a.line_uid,

                sum(
                    coalesce(
                        a.allocated_quantity,
                        0
                    )
                ) as allocated_quantity

            from public.quotation_revision_line_billing_allocations a

            where a.revision_id =
                  p_revision_id

              and a.is_active = true
              and a.is_deleted = false

            group by a.line_uid
        ) allocation

          on allocation.line_uid =
             qrl.line_uid

        where qrl.revision_id =
              p_revision_id

          and qrl.is_deleted = false

          and qrl.billing_method =
              'WorkUnit'

          and allocation.allocated_quantity >
              qrl.quantity
              + 0.000001

    ) then

        raise exception
            'Revision WorkUnit Billing Allocation exceeds the updated Revision line quantity.';

    end if;


    /* ========================================================================
    11. Update Revision Header
    ======================================================================== */

    update public.quotation_revisions

    set
        price_book_id =
            v_revision.price_book_id,

        quotation_segment =
            v_quotation_segment,

        quotation_source =
            v_quotation_source,

        issue_date =
            v_issue_date,

        valid_until =
            v_valid_until,

        notes =
            v_header_notes,

        internal_notes =
            v_internal_notes,

        revision_reason =
            v_revision_reason,

        revision_notes =
            v_revision_notes,

        subtotal_amount =
            round(
                v_subtotal_total,
                2
            ),

        discount_amount =
            round(
                v_discount_total,
                2
            ),

        tax_amount =
            round(
                v_tax_total,
                2
            ),

        total_amount =
            round(
                v_grand_total,
                2
            ),

        updated_by =
            v_user_id

    where revision_id =
          p_revision_id

      and revision_status =
          'Draft'

      and is_active = true
      and is_deleted = false;


    if not found then
        raise exception
            'Draft Revision could not be updated because its workflow state changed.';
    end if;


    /*
    Validate deferred Discount Reason constraints now.
    */

    set constraints all immediate;


    return jsonb_build_object(
        'quotation_id',
            v_revision.quotation_id,

        'quotation_no',
            v_parent.quotation_no,

        'revision_id',
            p_revision_id,

        'revision_no',
            v_revision.revision_no,

        'revision_status',
            'Draft',

        'line_count',
            v_line_count,

        'subtotal_amount',
            round(
                v_subtotal_total,
                2
            ),

        'discount_amount',
            round(
                v_discount_total,
                2
            ),

        'tax_amount',
            round(
                v_tax_total,
                2
            ),

        'total_amount',
            round(
                v_grand_total,
                2
            )
    );

end;
$function$;
-- validate_price_book_line_pricing_uom()
CREATE OR REPLACE FUNCTION public.validate_price_book_line_pricing_uom()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
declare
    v_product_code text;
    v_pricing_uom_code text;
begin
    select
        p.product_code,
        p.pricing_uom_code
    into
        v_product_code,
        v_pricing_uom_code
    from public.products p
    where p.product_id = new.product_id
      and p.is_deleted = false;

    if not found then
        raise exception
            'Price Book Product does not exist or has been deleted.';
    end if;


    /*
    Compatibility period:
    Products without Pricing UOM are allowed to retain their existing rows.
    New pricing RPCs will require Pricing UOM before writing.
    */
    if v_pricing_uom_code is null then
        return new;
    end if;


    if nullif(btrim(new.price_uom_code), '')
       is distinct from v_pricing_uom_code then

        raise exception
            'Product % uses Pricing UOM %. Price Book prices cannot be stored at UOM %.',
            v_product_code,
            v_pricing_uom_code,
            new.price_uom_code;
    end if;


    return new;
end;
$function$;
-- validate_product_pricing_uom()
CREATE OR REPLACE FUNCTION public.validate_product_pricing_uom()
 RETURNS trigger
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
begin
    if new.pricing_uom_code is null then
        return new;
    end if;

    new.pricing_uom_code :=
        nullif(btrim(new.pricing_uom_code), '');

    if new.pricing_uom_code is null then
        return new;
    end if;


    /*
    During INSERT the Product row may not yet have product_units because
    the Product atomic RPC creates dependent UOM rows afterwards.

    Therefore strict Supported-UOM validation is applied on UPDATE.

    Product create/update RPC migration will enforce the same rule
    atomically once the frontend is migrated.
    */

    if tg_op = 'UPDATE' then

        if not exists (
            select 1
            from public.product_units pu
            where pu.product_id = new.product_id
              and pu.uom_code = new.pricing_uom_code
              and pu.is_active = true
              and pu.is_deleted = false
              and pu.conversion_to_base > 0
        ) then
            raise exception
                'Pricing UOM % must be an active Supported UOM for Product %.',
                new.pricing_uom_code,
                new.product_code;
        end if;

    end if;

    return new;
end;
$function$;
-- validate_quotation_product_discount(p_product_id uuid, p_discount_percent numeric, p_discount_reason text)
CREATE OR REPLACE FUNCTION public.validate_quotation_product_discount(p_product_id uuid, p_discount_percent numeric, p_discount_reason text)
 RETURNS TABLE(discount_percent numeric, discount_reason text, maximum_discount_percent numeric)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public', 'auth', 'pg_temp'
AS $function$
declare
    v_discount_percent numeric;
    v_discount_reason text;
    v_maximum_discount numeric;
begin
    if auth.uid() is null then
        raise exception 'Authentication is required.';
    end if;


    if p_product_id is null then
        raise exception 'Product is required.';
    end if;


    v_discount_percent :=
        coalesce(
            p_discount_percent,
            0
        );


    v_discount_reason :=
        nullif(
            btrim(
                coalesce(
                    p_discount_reason,
                    ''
                )
            ),
            ''
        );


    if v_discount_percent < 0
       or v_discount_percent > 100 then
        raise exception
            'Discount Percent must be between 0 and 100.';
    end if;


    select p.maximum_discount_percent
    into v_maximum_discount

    from public.products p

    where p.product_id = p_product_id
      and p.is_active = true
      and p.is_deleted = false;


    if not found then
        raise exception
            'Selected Product is missing, inactive, or deleted.';
    end if;


    v_maximum_discount :=
        coalesce(
            v_maximum_discount,
            0
        );


    /* ----------------------------------------------------------------
    No discount
    ---------------------------------------------------------------- */

    if v_discount_percent = 0 then

        return query
        select
            0::numeric,
            null::text,
            v_maximum_discount;

        return;

    end if;


    /* ----------------------------------------------------------------
    Positive discount requires explicit permission
    ---------------------------------------------------------------- */

    if not public.has_permission(
        'quotations.apply_discount'
    ) then
        raise exception
            'Permission quotations.apply_discount is required to apply a Product discount.';
    end if;


    /* ----------------------------------------------------------------
    Positive discount requires reason
    ---------------------------------------------------------------- */

    if v_discount_reason is null then
        raise exception
            'Discount Reason is required when Product discount is greater than zero.';
    end if;


    /* ----------------------------------------------------------------
    Product maximum
    ---------------------------------------------------------------- */

    if v_discount_percent >
       v_maximum_discount then

        raise exception
            'Discount Percent % exceeds the Product maximum discount of %%%.',
            v_discount_percent,
            v_maximum_discount;
    end if;


    return query
    select
        v_discount_percent,
        v_discount_reason,
        v_maximum_discount;
end;
$function$;
-- NOTE: Hosted export referenced trg_assert_quotation_discount_reason_deferred
-- but did not include the exact function body. It is intentionally NOT recreated
-- in this catch-up migration; no unverified function definition is invented.

-- ---------------------------------------------------------------------------
-- 7. TRIGGERS
-- ---------------------------------------------------------------------------

drop trigger if exists trg_validate_price_book_line_pricing_uom on public.price_book_lines;
CREATE TRIGGER trg_validate_price_book_line_pricing_uom BEFORE INSERT OR UPDATE OF product_id, price_uom_code ON price_book_lines FOR EACH ROW EXECUTE FUNCTION validate_price_book_line_pricing_uom();

drop trigger if exists trg_validate_product_pricing_uom on public.products;
CREATE TRIGGER trg_validate_product_pricing_uom BEFORE INSERT OR UPDATE OF pricing_uom_code ON products FOR EACH ROW EXECUTE FUNCTION validate_product_pricing_uom();


drop trigger if exists trg_guard_quotation_product_discount on public.quotation_lines;
CREATE TRIGGER trg_guard_quotation_product_discount BEFORE INSERT OR UPDATE OF product_id, discount_percent, discount_amount, discount_reason ON quotation_lines FOR EACH ROW EXECUTE FUNCTION guard_quotation_product_discount();

drop trigger if exists trg_assert_quotation_revision_discount_reason_deferred on public.quotation_revision_lines;
CREATE CONSTRAINT TRIGGER trg_assert_quotation_revision_discount_reason_deferred AFTER INSERT OR UPDATE ON quotation_revision_lines DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION assert_quotation_revision_discount_reason_deferred();

drop trigger if exists trg_guard_quotation_revision_product_discount on public.quotation_revision_lines;
CREATE TRIGGER trg_guard_quotation_revision_product_discount BEFORE INSERT OR UPDATE OF product_id, line_uid, quotation_line_id, line_no, discount_percent, discount_amount, discount_reason ON quotation_revision_lines FOR EACH ROW EXECUTE FUNCTION guard_quotation_revision_product_discount();

drop trigger if exists trg_guard_quotation_revision_send_current_price on public.quotation_revisions;
CREATE TRIGGER trg_guard_quotation_revision_send_current_price BEFORE UPDATE OF revision_status ON quotation_revisions FOR EACH ROW EXECUTE FUNCTION guard_quotation_revision_send_current_price();

drop trigger if exists trg_guard_quotation_send_current_price on public.quotations;
CREATE TRIGGER trg_guard_quotation_send_current_price BEFORE UPDATE OF quotation_status ON quotations FOR EACH ROW EXECUTE FUNCTION guard_quotation_send_current_price();

-- ---------------------------------------------------------------------------
-- 8. RPC EXECUTE GRANTS
-- ---------------------------------------------------------------------------
grant execute on function public.assert_product_pricing_uom_supported(uuid,text) to authenticated;
grant execute on function public.convert_product_quantity_between_uoms(uuid,numeric,text,text) to authenticated;
grant execute on function public.get_product_uom_factor_to_base(uuid,text) to authenticated;
grant execute on function public.resolve_product_transaction_price(uuid,uuid,text,date) to authenticated;
grant execute on function public.set_price_book_product_selling_price_atomic(uuid,uuid,text,numeric,numeric,date) to authenticated;
grant execute on function public.set_product_pricing_policy_atomic(uuid,text,numeric) to authenticated;
grant execute on function public.set_product_selling_price_matrix_atomic(uuid,text,date,jsonb) to authenticated;
grant execute on function public.set_standard_product_selling_price_atomic(uuid,text,numeric,numeric,date) to authenticated;
grant execute on function public.validate_quotation_product_discount(uuid,numeric,text) to authenticated;
grant execute on function public.create_quotation_progress_atomic(jsonb,jsonb,jsonb,jsonb) to authenticated;
grant execute on function public.update_draft_quotation_progress_atomic(uuid,jsonb,jsonb,jsonb,jsonb) to authenticated;
grant execute on function public.create_quotation_revision_atomic(uuid,text,text) to authenticated;
grant execute on function public.update_draft_quotation_revision_atomic(uuid,jsonb,jsonb) to authenticated;
grant execute on function public.get_quotation_send_price_changes(uuid) to authenticated;
grant execute on function public.get_quotation_revision_send_price_changes(uuid) to authenticated;
grant execute on function public.resolve_quotation_send_price_change_atomic(uuid,uuid,text,text) to authenticated;
grant execute on function public.resolve_quotation_revision_send_price_change_atomic(uuid,uuid,text,text) to authenticated;


commit;

-- ---------------------------------------------------------------------------
-- POST-MIGRATION READ-ONLY VERIFICATION
-- ---------------------------------------------------------------------------
select
    'LOCAL_PRICING_CATCHUP'::text as verification,
    jsonb_build_object(
        'pricing_uom_column', exists (
            select 1 from information_schema.columns
            where table_schema='public' and table_name='products' and column_name='pricing_uom_code'
        ),
        'maximum_discount_column', exists (
            select 1 from information_schema.columns
            where table_schema='public' and table_name='products' and column_name='maximum_discount_percent'
        ),
        'price_uom_column', exists (
            select 1 from information_schema.columns
            where table_schema='public' and table_name='price_book_lines' and column_name='price_uom_code'
        ),
        'product_unit_fractional_column', exists (
            select 1 from information_schema.columns
            where table_schema='public' and table_name='product_units' and column_name='allow_fractional_quantity'
        ),
        'quotation_discount_reason', exists (
            select 1 from information_schema.columns
            where table_schema='public' and table_name='quotation_lines' and column_name='discount_reason'
        ),
        'revision_discount_reason', exists (
            select 1 from information_schema.columns
            where table_schema='public' and table_name='quotation_revision_lines' and column_name='discount_reason'
        ),
        'pricing_policy_rpc', to_regprocedure('public.set_product_pricing_policy_atomic(uuid,text,numeric)') is not null,
        'matrix_rpc', to_regprocedure('public.set_product_selling_price_matrix_atomic(uuid,text,date,jsonb)') is not null,
        'transaction_price_rpc', to_regprocedure('public.resolve_product_transaction_price(uuid,uuid,text,date)') is not null,
        'send_price_reader', to_regprocedure('public.get_quotation_send_price_changes(uuid)') is not null,
        'revision_send_price_reader', to_regprocedure('public.get_quotation_revision_send_price_changes(uuid)') is not null
    ) as result;
