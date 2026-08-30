-- Reconcile the local Product Thickness Code foundation with the hosted schema
-- consumed by the generated types and current Product UI.

begin;

alter table public.product_thickness_codes
    add column if not exists thickness_mm numeric(10,3),
    add column if not exists thickness_meaning text;

update public.product_thickness_codes
set
    thickness_mm = case
        when thickness_code in ('X', 'Z') then null
        else reference_thickness_mm
    end,
    thickness_meaning = case
        when thickness_code = 'Z' then 'unknown'
        when thickness_code = 'X' then 'not_applicable'
        when reference_thickness_mm is not null then 'physical'
        else 'reserved'
    end
where thickness_meaning is null;

alter table public.product_thickness_codes
    alter column thickness_meaning set default 'physical',
    alter column thickness_meaning set not null;

alter table public.product_thickness_codes
    drop constraint if exists product_thickness_codes_reference_chk,
    drop constraint if exists product_thickness_codes_unspecified_chk,
    drop constraint if exists product_thickness_codes_code_chk,
    drop constraint if exists product_thickness_codes_meaning_chk,
    drop constraint if exists product_thickness_codes_reserved_code_chk,
    drop constraint if exists product_thickness_codes_thickness_chk;

alter table public.product_thickness_codes
    add constraint product_thickness_codes_code_chk
        check (
            thickness_code = upper(thickness_code)
            and thickness_code ~ '^[0-9A-Z]$'
        ),
    add constraint product_thickness_codes_meaning_chk
        check (
            thickness_meaning = any (
                array['physical', 'unknown', 'not_applicable', 'reserved']
            )
        ),
    add constraint product_thickness_codes_reserved_code_chk
        check (
            (thickness_code = 'Z' and thickness_meaning = 'unknown')
            or (thickness_code = 'X' and thickness_meaning = 'not_applicable')
            or thickness_code <> all (array['X', 'Z'])
        ),
    add constraint product_thickness_codes_thickness_chk
        check (
            (
                thickness_meaning = 'physical'
                and thickness_mm is not null
                and thickness_mm > 0
            )
            or (
                thickness_meaning <> 'physical'
                and thickness_mm is null
            )
        );

alter table public.product_thickness_codes
    drop column if exists reference_thickness_mm,
    drop column if exists is_unspecified;

create or replace view public.product_thickness_codes_ui
with (security_invoker = true)
as
select
    thickness.product_thickness_code_id,
    thickness.thickness_code,
    thickness.thickness_name,
    thickness.thickness_mm,
    thickness.thickness_meaning,
    thickness.description,
    thickness.guidance_text,
    thickness.status,
    thickness.sort_order,
    thickness.is_active,
    thickness.is_deleted,
    case
        when thickness.thickness_code = 'Z' then 'Z — Unknown'
        when thickness.thickness_code = 'X' then 'X — Not Applicable'
        when thickness.thickness_mm is not null then
            thickness.thickness_code
            || ' — '
            || trim(trailing '.0' from thickness.thickness_mm::text)
            || ' mm'
        else thickness.thickness_code || ' — ' || thickness.thickness_name
    end as display_label
from public.product_thickness_codes thickness
where thickness.is_deleted = false;

revoke all on table public.product_thickness_codes_ui from anon, authenticated;
grant select on table public.product_thickness_codes_ui to authenticated;
grant all on table public.product_thickness_codes_ui to service_role;

drop function if exists public.get_product_code_context_v2(
    uuid, uuid, uuid, uuid, uuid, integer, integer
);

CREATE OR REPLACE FUNCTION "public"."get_product_code_context_v2"("p_product_code_family_id" "uuid", "p_product_thickness_code_id" "uuid", "p_product_code_type_id" "uuid", "p_size_rule_id" "uuid", "p_colour_id" "uuid", "p_first_value" integer DEFAULT NULL::integer, "p_second_value" integer DEFAULT NULL::integer) RETURNS TABLE("full_category_code" "text", "family_code" "text", "family_name" "text", "thickness_code" "text", "thickness_name" "text", "thickness_mm" numeric, "thickness_meaning" "text", "type_code" "text", "type_name" "text", "size_token" "text", "size_rule_name" "text", "colour_code" "text", "colour_name" "text")
    LANGUAGE "plpgsql" STABLE
    SET "search_path" TO 'public'
    AS $$
declare
    v_family public.product_code_families%rowtype;
    v_thickness public.product_thickness_codes%rowtype;
    v_type public.product_code_types%rowtype;
    v_colour public.product_colours%rowtype;
    v_effective_size_rule_id uuid;
begin
    select *
    into v_family
    from public.product_code_families family
    where family.product_code_family_id = p_product_code_family_id
      and family.is_deleted = false
      and family.is_active = true
      and family.status = 'active';

    if not found then
        raise exception
            'The selected Product Family is not active or does not exist.';
    end if;

    select *
    into v_thickness
    from public.product_thickness_codes thickness
    where thickness.product_thickness_code_id =
          p_product_thickness_code_id
      and thickness.is_deleted = false
      and thickness.is_active = true
      and thickness.status = 'active';

    if not found then
        raise exception
            'The selected Thickness Code is not active or does not exist.';
    end if;

    select *
    into v_type
    from public.product_code_types product_type
    where product_type.product_code_type_id =
          p_product_code_type_id
      and product_type.is_deleted = false
      and product_type.is_active = true
      and product_type.status = 'active';

    if not found then
        raise exception
            'The selected Product Type Code is not active or does not exist.';
    end if;

    if not exists (
        select 1
        from public.product_code_family_types allowed_type
        where allowed_type.product_code_family_id =
              v_family.product_code_family_id
          and allowed_type.product_code_type_id =
              p_product_code_type_id
          and allowed_type.is_deleted = false
          and allowed_type.is_active = true
    ) then
        raise exception
            'Product Type % is not allowed for Product Family %.',
            v_type.type_code,
            v_family.family_code;
    end if;

    -- Product Type is validated independently.
    -- It does not define or alter Thickness Code.

    if v_family.variant_meaning = 'thickness'
       and v_thickness.thickness_meaning = 'not_applicable' then
        raise exception
            'Thickness Code X cannot be used for Product Family % because thickness is required.',
            v_family.family_code;
    end if;

    v_effective_size_rule_id :=
        coalesce(p_size_rule_id, v_family.default_size_rule_id);

    if v_effective_size_rule_id is null then
        raise exception
            'No Product Code Size Rule is configured for Product Family %.',
            v_family.family_code;
    end if;

    select *
    into v_colour
    from public.product_colours colour
    where colour.product_colour_id = p_colour_id
      and colour.is_deleted = false
      and colour.is_active = true
      and colour.status = 'active';

    if not found then
        raise exception
            'The selected Product Colour is not active or does not exist.';
    end if;

    if v_family.colour_mode = 'not_applicable'
       and v_colour.colour_code <> 'XXX' then
        raise exception
            'Product Family % requires Colour XXX (Not Applicable).',
            v_family.family_code;
    end if;

    if v_family.colour_mode = 'required'
       and v_colour.colour_code = 'XXX' then
        raise exception
            'A Product Colour is required for Product Family %.',
            v_family.family_code;
    end if;

    return query
    select
        (
            v_family.family_code
            || v_thickness.thickness_code
        )::text,
        v_family.family_code::text,
        v_family.family_name::text,
        v_thickness.thickness_code::text,
        v_thickness.thickness_name::text,
        v_thickness.thickness_mm,
        v_thickness.thickness_meaning::text,
        v_type.type_code::text,
        v_type.type_name::text,
        public.build_product_code_size_token(
            v_effective_size_rule_id,
            p_first_value,
            p_second_value
        )::text,
        size_rule.size_rule_name::text,
        v_colour.colour_code::text,
        v_colour.colour_name::text
    from public.product_code_size_rules size_rule
    where size_rule.product_code_size_rule_id =
          v_effective_size_rule_id
      and size_rule.is_deleted = false
      and size_rule.is_active = true
      and size_rule.status = 'active';

    if not found then
        raise exception
            'The selected Product Code Size Rule is not active or does not exist.';
    end if;
end;
$$;

revoke all on function public.get_product_code_context_v2(
    uuid, uuid, uuid, uuid, uuid, integer, integer
) from public, anon;
grant execute on function public.get_product_code_context_v2(
    uuid, uuid, uuid, uuid, uuid, integer, integer
) to authenticated, service_role;

commit;
