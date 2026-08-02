-- ============================================================
-- REDS Timber Flooring
-- Product Code Independent Identity v2
--
-- Product Code:
--   CC + Thickness Code + "-" + Type + "-" + Size + "-"
--   + Colour + "-" + Variant
--
-- Example:
--   41Z-LEV-NNNXNNNN-XXX-01
--
-- Independent identity:
--   Product Family
--   Thickness Code
--   Product Code Type
--   Size Rule / Size Values
--   Colour
--   Variant Number
--
-- This migration:
--   1. Creates product_thickness_codes
--   2. Adds v2 identity columns to products
--   3. Updates Product Code format constraints
--   4. Adds RLS and Admin policies
--   5. Updates immutable Product Code protection
--   6. Creates Product Code RPC v2 functions
--
-- create_product_atomic_internal will be migrated separately
-- after this identity foundation passes regression testing.
-- ============================================================

begin;


-- ============================================================
-- 1. Product Thickness Code Master
-- ============================================================

create table if not exists public.product_thickness_codes (
    product_thickness_code_id uuid
        primary key
        default gen_random_uuid(),

    thickness_code text not null,
    thickness_name text not null,
    description text,

    -- Optional reference value only.
    -- Actual physical thickness remains operational Product data
    -- and must not be inferred solely from this field.
    reference_thickness_mm numeric(12, 4),

    is_unspecified boolean not null default false,

    guidance_text text,

    status text not null default 'active',
    sort_order integer not null default 0,

    is_active boolean not null default true,
    is_deleted boolean not null default false,

    created_at timestamptz not null default now(),
    created_by uuid,
    updated_at timestamptz not null default now(),
    updated_by uuid,
    deleted_at timestamptz,

    constraint product_thickness_codes_code_chk
        check (
            thickness_code ~ '^[0-9A-Z]$'
        ),

    constraint product_thickness_codes_name_chk
        check (
            char_length(btrim(thickness_name))
            between 2 and 120
        ),

    constraint product_thickness_codes_reference_chk
        check (
            reference_thickness_mm is null
            or reference_thickness_mm > 0
        ),

    constraint product_thickness_codes_status_chk
        check (
            status in (
                'active',
                'reserved',
                'inactive'
            )
        ),

    constraint product_thickness_codes_unspecified_chk
        check (
            not is_unspecified
            or thickness_code = 'Z'
        )
);


comment on table public.product_thickness_codes is
'Independent one-character Product Thickness Code master. The code forms the third character of the Product category identity.';


comment on column
public.product_thickness_codes.reference_thickness_mm is
'Optional reference thickness only. Actual Product physical thickness may differ or may be recorded separately without changing the immutable Product Code.';


comment on column
public.product_thickness_codes.is_unspecified is
'True only for code Z, representing unspecified, variable or not encoded thickness.';


create unique index if not exists
    uq_product_thickness_codes_code
on public.product_thickness_codes (
    thickness_code
);


create index if not exists
    idx_product_thickness_codes_active_sort
on public.product_thickness_codes (
    sort_order,
    thickness_code
)
where is_active = true
  and is_deleted = false;


-- The only universally locked code is Z.
-- Numeric or alphabetic business mappings must be configured
-- by Admin and must not be guessed by this migration.

insert into public.product_thickness_codes (
    thickness_code,
    thickness_name,
    description,
    reference_thickness_mm,
    is_unspecified,
    guidance_text,
    status,
    sort_order,
    is_active,
    is_deleted
)
values (
    'Z',
    'Unspecified / Variable',
    'Thickness is not encoded in the Product Code or may vary by Product.',
    null,
    true,
    'The actual physical thickness may be entered later without changing the Product Code.',
    'active',
    999,
    true,
    false
)
on conflict (thickness_code)
do nothing;


-- ============================================================
-- 2. Standard metadata trigger
-- ============================================================

drop trigger if exists
    trg_product_thickness_codes_updated_at
on public.product_thickness_codes;


create trigger trg_product_thickness_codes_updated_at
before update
on public.product_thickness_codes
for each row
execute function public.set_updated_at();


-- ============================================================
-- 3. RLS and policies
-- ============================================================

alter table public.product_thickness_codes
enable row level security;


drop policy if exists
    product_thickness_codes_select_authenticated
on public.product_thickness_codes;

drop policy if exists
    product_thickness_codes_insert_strict_admin
on public.product_thickness_codes;

drop policy if exists
    product_thickness_codes_update_strict_admin
on public.product_thickness_codes;

drop policy if exists
    product_thickness_codes_delete_strict_admin
on public.product_thickness_codes;


create policy
    product_thickness_codes_select_authenticated
on public.product_thickness_codes
for select
to authenticated
using (
    is_deleted = false
);


create policy
    product_thickness_codes_insert_strict_admin
on public.product_thickness_codes
for insert
to authenticated
with check (
    public.is_strict_admin_role()
);


create policy
    product_thickness_codes_update_strict_admin
on public.product_thickness_codes
for update
to authenticated
using (
    public.is_strict_admin_role()
)
with check (
    public.is_strict_admin_role()
);


create policy
    product_thickness_codes_delete_strict_admin
on public.product_thickness_codes
for delete
to authenticated
using (
    public.is_strict_admin_role()
);


grant select
on public.product_thickness_codes
to authenticated;


grant insert, update, delete
on public.product_thickness_codes
to authenticated;


-- ============================================================
-- 4. Add Product Identity v2 columns
-- ============================================================

alter table public.products
    add column if not exists
        product_code_family_id uuid,

    add column if not exists
        product_thickness_code_id uuid;


comment on column public.products.product_code_family_id is
'Independent Product Family forming the first two characters of the generated Product Code.';


comment on column public.products.product_thickness_code_id is
'Independent Thickness Code forming the third character of the generated Product Code.';


-- Existing local database has no Products, but columns remain
-- nullable during the controlled transition from the legacy RPC.


alter table public.products
    drop constraint if exists
        products_product_code_family_id_fkey;


alter table public.products
    add constraint products_product_code_family_id_fkey
    foreign key (
        product_code_family_id
    )
    references public.product_code_families (
        product_code_family_id
    )
    on delete restrict;


alter table public.products
    drop constraint if exists
        products_product_thickness_code_id_fkey;


alter table public.products
    add constraint products_product_thickness_code_id_fkey
    foreign key (
        product_thickness_code_id
    )
    references public.product_thickness_codes (
        product_thickness_code_id
    )
    on delete restrict;


create index if not exists
    idx_products_product_code_family_id
on public.products (
    product_code_family_id
)
where is_deleted = false;


create index if not exists
    idx_products_product_thickness_code_id
on public.products (
    product_thickness_code_id
)
where is_deleted = false;


-- ============================================================
-- 5. Product Code category format
--
-- Legacy format accepted only 000–999.
-- v2 accepts:
--   two numeric Family characters
--   plus one numeric or uppercase alphabetic Thickness character
-- ============================================================

alter table public.product_code_sequences
    drop constraint if exists
        product_code_sequences_category_chk;


alter table public.product_code_sequences
    add constraint product_code_sequences_category_chk
    check (
        full_category_code ~ '^[0-9]{2}[0-9A-Z]$'
    );


alter table public.product_code_variant_registry
    drop constraint if exists
        product_code_variant_registry_category_chk;


alter table public.product_code_variant_registry
    add constraint product_code_variant_registry_category_chk
    check (
        full_category_code ~ '^[0-9]{2}[0-9A-Z]$'
    );


-- Preserve the registry rule that the full code must equal
-- its component values.

alter table public.product_code_variant_registry
    drop constraint if exists
        product_code_variant_registry_full_code_chk;


alter table public.product_code_variant_registry
    add constraint product_code_variant_registry_full_code_chk
    check (
        full_product_code =
            full_category_code
            || '-'
            || type_code
            || '-'
            || size_token
            || '-'
            || colour_code
            || '-'
            || variant_code
    );


-- ============================================================
-- 6. Immutable Product Code identity v2
-- ============================================================

create or replace function public.prevent_product_code_change()
returns trigger
language plpgsql
set search_path to 'public'
as $function$
begin
    -- Product Code itself is always immutable.
    if old.product_code
       is distinct from new.product_code then

        raise exception
            'Product Code cannot be changed after the Product has been created.';
    end if;


    -- Once generated and assigned, every identity component
    -- forming the Product Code is immutable.
    if old.product_code_generated_at is not null then

        if old.product_code_family_id
              is distinct from new.product_code_family_id

           or old.product_thickness_code_id
              is distinct from new.product_thickness_code_id

           or old.product_code_category_variant_id
              is distinct from new.product_code_category_variant_id

           or old.product_code_type_id
              is distinct from new.product_code_type_id

           or old.product_code_size_rule_id
              is distinct from new.product_code_size_rule_id

           or old.product_colour_id
              is distinct from new.product_colour_id

           or old.product_code_size_token
              is distinct from new.product_code_size_token

           or old.product_code_variant_number
              is distinct from new.product_code_variant_number

           or old.product_code_generated_at
              is distinct from new.product_code_generated_at

           or old.product_code_generated_by
              is distinct from new.product_code_generated_by
        then
            raise exception
                'Generated Product Code identity cannot be changed after assignment.';
        end if;

    end if;


    return new;
end;
$function$;


drop trigger if exists
    trg_prevent_product_code_change
on public.products;


create trigger trg_prevent_product_code_change
before update of
    product_code,
    product_code_family_id,
    product_thickness_code_id,
    product_code_category_variant_id,
    product_code_type_id,
    product_code_size_rule_id,
    product_colour_id,
    product_code_size_token,
    product_code_variant_number,
    product_code_generated_at,
    product_code_generated_by
on public.products
for each row
execute function public.prevent_product_code_change();


-- ============================================================
-- 7. Shared v2 Product Code context
-- ============================================================

create or replace function public.get_product_code_context_v2(
    p_product_code_family_id uuid,
    p_product_thickness_code_id uuid,
    p_product_code_type_id uuid,
    p_size_rule_id uuid,
    p_colour_id uuid,
    p_first_value integer,
    p_second_value integer
)
returns table (
    full_category_code text,

    family_code text,
    family_name text,

    thickness_code text,
    thickness_name text,
    reference_thickness_mm numeric,
    thickness_is_unspecified boolean,

    type_code text,
    type_name text,

    size_token text,
    size_rule_name text,

    colour_code text,
    colour_name text
)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
    v_family public.product_code_families%rowtype;
    v_thickness public.product_thickness_codes%rowtype;
    v_type public.product_code_types%rowtype;
    v_size_rule public.product_code_size_rules%rowtype;
    v_colour public.product_colours%rowtype;

    v_first_token text;
    v_second_token text;
begin
    if auth.uid() is null then
        raise exception
            'Authentication is required.';
    end if;


    if p_product_code_family_id is null then
        raise exception
            'Product Family is required.';
    end if;


    if p_product_thickness_code_id is null then
        raise exception
            'Thickness Code is required.';
    end if;


    if p_product_code_type_id is null then
        raise exception
            'Product Code Type is required.';
    end if;


    if p_size_rule_id is null then
        raise exception
            'Product Code Size Rule is required.';
    end if;


    if p_colour_id is null then
        raise exception
            'Product Colour is required.';
    end if;


    select family_row.*
    into v_family
    from public.product_code_families family_row
    where family_row.product_code_family_id =
            p_product_code_family_id
      and family_row.status = 'active'
      and family_row.is_active = true
      and family_row.is_deleted = false;


    if not found then
        raise exception
            'The selected Product Family is inactive or does not exist.';
    end if;


    select thickness_row.*
    into v_thickness
    from public.product_thickness_codes thickness_row
    where thickness_row.product_thickness_code_id =
            p_product_thickness_code_id
      and thickness_row.status = 'active'
      and thickness_row.is_active = true
      and thickness_row.is_deleted = false;


    if not found then
        raise exception
            'The selected Thickness Code is inactive or does not exist.';
    end if;


    select type_row.*
    into v_type
    from public.product_code_types type_row
    where type_row.product_code_type_id =
            p_product_code_type_id
      and type_row.status = 'active'
      and type_row.is_active = true
      and type_row.is_deleted = false;


    if not found then
        raise exception
            'The selected Product Code Type is inactive or does not exist.';
    end if;


    -- Product Code Type is independent.
    -- product_code_family_types is recommendation/default metadata
    -- and is intentionally not used as a restrictive validation.

    select rule_row.*
    into v_size_rule
    from public.product_code_size_rules rule_row
    where rule_row.product_code_size_rule_id =
            p_size_rule_id
      and rule_row.status = 'active'
      and rule_row.is_active = true
      and rule_row.is_deleted = false;


    if not found then
        raise exception
            'The selected Product Code Size Rule is inactive or does not exist.';
    end if;


    select colour_row.*
    into v_colour
    from public.product_colours colour_row
    where colour_row.product_colour_id =
            p_colour_id
      and colour_row.status = 'active'
      and colour_row.is_active = true
      and colour_row.is_deleted = false;


    if not found then
        raise exception
            'The selected Product Colour is inactive or does not exist.';
    end if;


    -- First size component: exactly three characters.

    if v_size_rule.first_value_mode =
       'not_applicable' then

        v_first_token := 'NNN';

    else
        if p_first_value is null then
            if v_size_rule.allow_first_unspecified then
                v_first_token := 'NNN';
            else
                raise exception
                    '% is required.',
                    v_size_rule.first_value_label;
            end if;

        elsif p_first_value < 0
           or p_first_value > 999 then

            raise exception
                '% must be between 0 and 999.',
                v_size_rule.first_value_label;

        else
            v_first_token :=
                lpad(p_first_value::text, 3, '0');
        end if;
    end if;


    -- Second size component: exactly four characters.

    if v_size_rule.second_value_mode =
       'not_applicable' then

        v_second_token := 'NNNN';

    else
        if p_second_value is null then
            if v_size_rule.allow_second_unspecified
               or v_size_rule.second_value_mode =
                    'random_or_numeric' then

                v_second_token := 'NNNN';
            else
                raise exception
                    '% is required.',
                    v_size_rule.second_value_label;
            end if;

        elsif p_second_value < 0
           or p_second_value > 9999 then

            raise exception
                '% must be between 0 and 9999.',
                v_size_rule.second_value_label;

        else
            v_second_token :=
                lpad(p_second_value::text, 4, '0');
        end if;
    end if;


    return query
    select
        v_family.family_code
            || v_thickness.thickness_code,

        v_family.family_code,
        v_family.family_name,

        v_thickness.thickness_code,
        v_thickness.thickness_name,
        v_thickness.reference_thickness_mm,
        v_thickness.is_unspecified,

        v_type.type_code,
        v_type.type_name,

        v_first_token
            || 'X'
            || v_second_token,

        v_size_rule.size_rule_name,

        v_colour.colour_code,
        v_colour.colour_name;
end;
$function$;


-- ============================================================
-- 8. Preview Product Code Variant v2
-- ============================================================

create or replace function
public.preview_product_code_variant_v2(
    p_product_code_family_id uuid,
    p_product_thickness_code_id uuid,
    p_product_code_type_id uuid,
    p_size_rule_id uuid,
    p_colour_id uuid,
    p_first_value integer,
    p_second_value integer,
    p_variant_number smallint,
    p_variant_name text default null,
    p_variant_description text default null
)
returns table (
    product_code_preview text,

    full_category_code text,

    family_code text,
    family_name text,

    thickness_code text,
    thickness_name text,

    type_code text,
    type_name text,

    size_token text,
    size_rule_name text,

    colour_code text,
    colour_name text,

    selected_variant_number smallint,
    variant_code text,
    variant_name text,
    variant_description text,

    is_variant_available boolean,
    warning_text text
)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
    v_context record;

    v_variant_code text;
    v_variant_name text;
    v_variant_description text;

    v_full_product_code text;
    v_is_available boolean;
    v_warning text;
begin
    if auth.uid() is null then
        raise exception
            'Authentication is required.';
    end if;


    if p_variant_number is null
       or p_variant_number < 1
       or p_variant_number > 99 then

        raise exception
            'Variant Number must be between 1 and 99.';
    end if;


    v_variant_code :=
        lpad(p_variant_number::text, 2, '0');


    v_variant_name :=
        nullif(btrim(p_variant_name), '');


    if p_variant_number = 1 then
        v_variant_name :=
            coalesce(
                v_variant_name,
                'Standard'
            );
    elsif v_variant_name is null then
        raise exception
            'Variant Name is required for Variant Codes 02 to 99.';
    end if;


    if char_length(v_variant_name)
       not between 2 and 120 then

        raise exception
            'Variant Name must contain between 2 and 120 characters.';
    end if;


    v_variant_description :=
        nullif(
            btrim(p_variant_description),
            ''
        );


    if v_variant_description is not null
       and char_length(v_variant_description)
           not between 2 and 500 then

        raise exception
            'Variant Description must contain between 2 and 500 characters.';
    end if;


    select context_row.*
    into v_context
    from public.get_product_code_context_v2(
        p_product_code_family_id,
        p_product_thickness_code_id,
        p_product_code_type_id,
        p_size_rule_id,
        p_colour_id,
        p_first_value,
        p_second_value
    ) context_row;


    v_full_product_code :=
        v_context.full_category_code
        || '-'
        || v_context.type_code
        || '-'
        || v_context.size_token
        || '-'
        || v_context.colour_code
        || '-'
        || v_variant_code;


    v_is_available :=
        not exists (
            select 1
            from public.product_code_variant_registry registry
            where registry.full_product_code =
                    v_full_product_code
               or (
                    registry.full_category_code =
                        v_context.full_category_code
                    and registry.type_code =
                        v_context.type_code
                    and registry.size_token =
                        v_context.size_token
                    and registry.colour_code =
                        v_context.colour_code
                    and registry.variant_number =
                        p_variant_number
               )
        );


    if not v_is_available then
        v_warning :=
            'The selected Product Variant Code has already been reserved and cannot be reused.';
    else
        v_warning := null;
    end if;


    return query
    select
        v_full_product_code,

        v_context.full_category_code,

        v_context.family_code,
        v_context.family_name,

        v_context.thickness_code,
        v_context.thickness_name,

        v_context.type_code,
        v_context.type_name,

        v_context.size_token,
        v_context.size_rule_name,

        v_context.colour_code,
        v_context.colour_name,

        p_variant_number,
        v_variant_code,
        v_variant_name,
        v_variant_description,

        v_is_available,
        v_warning;
end;
$function$;


-- ============================================================
-- 9. Generate and permanently reserve Product Code v2
-- ============================================================

create or replace function
public.generate_product_code_variant_v2(
    p_product_code_family_id uuid,
    p_product_thickness_code_id uuid,
    p_product_code_type_id uuid,
    p_size_rule_id uuid,
    p_colour_id uuid,
    p_first_value integer,
    p_second_value integer,
    p_variant_number smallint,
    p_variant_name text default null,
    p_variant_description text default null
)
returns table (
    generated_product_code text,

    full_category_code text,

    family_code text,
    family_name text,

    thickness_code text,
    thickness_name text,

    type_code text,
    type_name text,

    size_token text,
    size_rule_name text,

    colour_code text,
    colour_name text,

    variant_number smallint,
    variant_code text,
    variant_name text,
    variant_description text,

    generated_at timestamptz
)
language plpgsql
security definer
set search_path to 'public'
as $function$
declare
    v_preview record;
    v_generated_at timestamptz := now();
begin
    if not public.can_manage_products_strict() then
        raise exception
            'Only Admin can generate and reserve Product Codes.';
    end if;


    select preview_row.*
    into v_preview
    from public.preview_product_code_variant_v2(
        p_product_code_family_id,
        p_product_thickness_code_id,
        p_product_code_type_id,
        p_size_rule_id,
        p_colour_id,
        p_first_value,
        p_second_value,
        p_variant_number,
        p_variant_name,
        p_variant_description
    ) preview_row;


    if not v_preview.is_variant_available then
        raise exception
            '%',
            coalesce(
                v_preview.warning_text,
                'The selected Product Variant Code is not available.'
            );
    end if;


    begin
        insert into public.product_code_variant_registry (
            full_category_code,
            type_code,
            size_token,
            colour_code,

            variant_number,
            variant_code,

            full_product_code,

            reserved_at,
            reserved_by,

            variant_name,
            variant_description,

            product_id
        )
        values (
            v_preview.full_category_code,
            v_preview.type_code,
            v_preview.size_token,
            v_preview.colour_code,

            v_preview.selected_variant_number,
            v_preview.variant_code,

            v_preview.product_code_preview,

            v_generated_at,
            auth.uid(),

            v_preview.variant_name,
            v_preview.variant_description,

            null
        );

    exception
        when unique_violation then
            raise exception
                'The selected Product Variant Code has already been reserved and cannot be reused.';
    end;


    return query
    select
        v_preview.product_code_preview,

        v_preview.full_category_code,

        v_preview.family_code,
        v_preview.family_name,

        v_preview.thickness_code,
        v_preview.thickness_name,

        v_preview.type_code,
        v_preview.type_name,

        v_preview.size_token,
        v_preview.size_rule_name,

        v_preview.colour_code,
        v_preview.colour_name,

        v_preview.selected_variant_number,
        v_preview.variant_code,
        v_preview.variant_name,
        v_preview.variant_description,

        v_generated_at;
end;
$function$;


-- ============================================================
-- 10. Function permissions
-- ============================================================

revoke all
on function public.get_product_code_context_v2(
    uuid,
    uuid,
    uuid,
    uuid,
    uuid,
    integer,
    integer
)
from public;


revoke all
on function public.preview_product_code_variant_v2(
    uuid,
    uuid,
    uuid,
    uuid,
    uuid,
    integer,
    integer,
    smallint,
    text,
    text
)
from public;


revoke all
on function public.generate_product_code_variant_v2(
    uuid,
    uuid,
    uuid,
    uuid,
    uuid,
    integer,
    integer,
    smallint,
    text,
    text
)
from public;


grant execute
on function public.get_product_code_context_v2(
    uuid,
    uuid,
    uuid,
    uuid,
    uuid,
    integer,
    integer
)
to authenticated;


grant execute
on function public.preview_product_code_variant_v2(
    uuid,
    uuid,
    uuid,
    uuid,
    uuid,
    integer,
    integer,
    smallint,
    text,
    text
)
to authenticated;


grant execute
on function public.generate_product_code_variant_v2(
    uuid,
    uuid,
    uuid,
    uuid,
    uuid,
    integer,
    integer,
    smallint,
    text,
    text
)
to authenticated;


-- ============================================================
-- 11. Migration validation
-- ============================================================

do $validation$
begin
    if to_regclass(
        'public.product_thickness_codes'
    ) is null then
        raise exception
            'Migration validation failed: product_thickness_codes was not created.';
    end if;


    if not exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'products'
          and column_name =
                'product_code_family_id'
    ) then
        raise exception
            'Migration validation failed: products.product_code_family_id is missing.';
    end if;


    if not exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'products'
          and column_name =
                'product_thickness_code_id'
    ) then
        raise exception
            'Migration validation failed: products.product_thickness_code_id is missing.';
    end if;


    if not exists (
        select 1
        from pg_proc
        where pronamespace =
                'public'::regnamespace
          and proname =
                'get_product_code_context_v2'
    ) then
        raise exception
            'Migration validation failed: get_product_code_context_v2 is missing.';
    end if;


    if not exists (
        select 1
        from pg_proc
        where pronamespace =
                'public'::regnamespace
          and proname =
                'preview_product_code_variant_v2'
    ) then
        raise exception
            'Migration validation failed: preview_product_code_variant_v2 is missing.';
    end if;


    if not exists (
        select 1
        from pg_proc
        where pronamespace =
                'public'::regnamespace
          and proname =
                'generate_product_code_variant_v2'
    ) then
        raise exception
            'Migration validation failed: generate_product_code_variant_v2 is missing.';
    end if;
end;
$validation$;


commit;