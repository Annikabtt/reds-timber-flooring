CREATE OR REPLACE FUNCTION public.create_product_atomic_internal(p_product jsonb, p_uom_conversions jsonb DEFAULT '[]'::jsonb, p_coverages jsonb DEFAULT '[]'::jsonb, p_attributes jsonb DEFAULT '[]'::jsonb)
 RETURNS TABLE(product_id uuid, product_code text, product_name text, variant_code text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
    v_product_id uuid;
    v_product_code text;
    v_generated record;
    v_registry_id uuid;

    v_product_name text;
    v_product_type text;
    v_category_id uuid;

    v_base_uom_code text;
    v_default_purchase_uom_code text;
    v_default_request_uom_code text;
    v_default_sales_uom_code text;

    v_variant_name text;
    v_variant_description text;

    v_is_stock_item boolean;
    v_is_service_item boolean;
    v_uses_coverage boolean;
    v_default_waste_percent numeric;
    v_is_active boolean;

    v_conversion jsonb;
    v_coverage jsonb;
    v_attribute jsonb;

    v_attribute_value_id uuid;
    v_option_id_text text;

    v_from_uom_code text;
    v_conversion_factor numeric;

    v_attribute_id uuid;
    v_selected_option_id uuid;

    v_option_ids jsonb;

    v_generated_by uuid;
begin
    -- ========================================================
    -- 1. Strict Admin only
    -- ========================================================

    if not (
        public.is_strict_admin_role()
        or current_user in (
            'postgres',
            'service_role',
            'supabase_admin'
        )
    ) then
        raise exception
            'Only Admin can create Products.';
    end if;


    if p_product is null
       or jsonb_typeof(p_product) <> 'object' then
        raise exception
            'Product data is required.';
    end if;


    if coalesce(jsonb_typeof(p_uom_conversions), 'null') <> 'array' then
        raise exception
            'UOM Conversions must be supplied as a JSON array.';
    end if;

    if coalesce(jsonb_typeof(p_coverages), 'null') <> 'array' then
        raise exception
            'Product Coverages must be supplied as a JSON array.';
    end if;

    if coalesce(jsonb_typeof(p_attributes), 'null') <> 'array' then
        raise exception
            'Product Attributes must be supplied as a JSON array.';
    end if;


    -- ========================================================
    -- 2. Product Core values
    -- ========================================================

    v_product_name :=
        nullif(btrim(p_product ->> 'product_name'), '');

    if v_product_name is null then
        raise exception 'Product Name is required.';
    end if;


    v_product_type :=
        nullif(btrim(p_product ->> 'product_type'), '');

    if v_product_type not in (
        'Material',
        'Consumable',
        'Tool',
        'Equipment',
        'Service'
    ) then
        raise exception
            'Product Type must be Material, Consumable, Tool, Equipment or Service.';
    end if;


    begin
        v_category_id :=
            nullif(p_product ->> 'category_id', '')::uuid;
    exception
        when invalid_text_representation then
            raise exception 'Product Category is invalid.';
    end;

    if v_category_id is null then
        raise exception 'Product Category is required.';
    end if;


    if not exists (
        select 1
        from public.product_categories category_row
        where category_row.category_id = v_category_id
          and category_row.is_active = true
          and category_row.is_deleted = false
    ) then
        raise exception
            'The selected Product Category is inactive or does not exist.';
    end if;


    v_base_uom_code :=
        nullif(btrim(p_product ->> 'base_uom_code'), '');

    if v_base_uom_code is null then
        raise exception 'Base UOM is required.';
    end if;


    if not exists (
        select 1
        from public.units_of_measure uom
        where uom.uom_code = v_base_uom_code
          and uom.is_active = true
          and uom.is_deleted = false
    ) then
        raise exception
            'Base UOM % is inactive or does not exist.',
            v_base_uom_code;
    end if;


    v_default_purchase_uom_code :=
        nullif(btrim(p_product ->> 'default_purchase_uom_code'), '');

    v_default_request_uom_code :=
        nullif(btrim(p_product ->> 'default_request_uom_code'), '');

    v_default_sales_uom_code :=
        nullif(btrim(p_product ->> 'default_sales_uom_code'), '');


    -- α╕½α╕▓α╕üα╣äα╕íα╣êα╕¬α╣êα╕ç Default UOM α╣âα╕½α╣ëα╣âα╕èα╣ë Base UOM
    v_default_purchase_uom_code :=
        coalesce(
            v_default_purchase_uom_code,
            v_base_uom_code
        );

    v_default_request_uom_code :=
        coalesce(
            v_default_request_uom_code,
            v_base_uom_code
        );

    v_default_sales_uom_code :=
        coalesce(
            v_default_sales_uom_code,
            v_base_uom_code
        );


    v_variant_name :=
        nullif(btrim(p_product ->> 'variant_name'), '');

    if v_variant_name is null then
        raise exception 'Variant Name is required.';
    end if;

    if char_length(v_variant_name) < 2
       or char_length(v_variant_name) > 120 then
        raise exception
            'Variant Name must contain between 2 and 120 characters.';
    end if;


    v_variant_description :=
        nullif(
            btrim(p_product ->> 'variant_description'),
            ''
        );

    if v_variant_description is not null
       and char_length(v_variant_description) > 500 then
        raise exception
            'Variant Description cannot exceed 500 characters.';
    end if;


    v_is_stock_item :=
        coalesce(
            (p_product ->> 'is_stock_item')::boolean,
            v_product_type <> 'Service'
        );

    v_is_service_item :=
        coalesce(
            (p_product ->> 'is_service_item')::boolean,
            v_product_type = 'Service'
        );

    if v_product_type = 'Service' then
        v_is_stock_item := false;
        v_is_service_item := true;
    else
        v_is_service_item := false;
    end if;


    v_uses_coverage :=
        coalesce(
            (p_product ->> 'uses_coverage')::boolean,
            false
        );

    v_default_waste_percent :=
        coalesce(
            nullif(
                p_product ->> 'default_waste_percent',
                ''
            )::numeric,
            0
        );

    if v_default_waste_percent < 0
       or v_default_waste_percent > 100 then
        raise exception
            'Default Waste Percent must be between 0 and 100.';
    end if;


    v_is_active :=
        coalesce(
            (p_product ->> 'is_active')::boolean,
            true
        );

    v_generated_by := auth.uid();


    -- ========================================================
    -- 3. Generate and reserve Admin-selected Variant Code
    --
    -- α╕½α╕▓α╕üα╕éα╕▒α╣ëα╕Öα╕òα╕¡α╕Öα╕áα╕▓α╕óα╕½α╕Ñα╕▒α╕çα╕Ñα╣ëα╕íα╣Çα╕½α╕Ñα╕º Registry INSERT α╕Öα╕╡α╣ëα╕êα╕░ Rollback
    -- ========================================================

    select generated.*
    into v_generated
    from public.generate_product_code_variant(
        nullif(
            p_product ->> 'product_code_category_variant_id',
            ''
        )::uuid,

        nullif(
            p_product ->> 'product_code_type_id',
            ''
        )::uuid,

        nullif(
            p_product ->> 'product_code_size_rule_id',
            ''
        )::uuid,

        nullif(
            p_product ->> 'product_colour_id',
            ''
        )::uuid,

        nullif(
            p_product ->> 'first_size_value',
            ''
        )::integer,

        nullif(
            p_product ->> 'second_size_value',
            ''
        )::integer,

        nullif(
            p_product ->> 'product_code_variant_number',
            ''
        )::smallint,

        v_variant_name,
        v_variant_description
    ) as generated;


    if v_generated.generated_product_code is null then
        raise exception
            'Unable to generate the Product Code.';
    end if;

    v_product_code :=
        v_generated.generated_product_code;


    -- ========================================================
    -- 4. Insert Product
    --
    -- α╣âα╕¬α╣ê Default UOM α╣Çα╕¢α╣çα╕Ö Base UOM α╕èα╕▒α╣êα╕ºα╕äα╕úα╕▓α╕º
    -- α╣Çα╕₧α╕╖α╣êα╕¡α╣âα╕½α╣ë Trigger Validation α╕£α╣êα╕▓α╕Öα╕üα╣êα╕¡α╕Öα╕¬α╕úα╣ëα╕▓α╕ç Conversion
    -- ========================================================

    insert into public.products (
        product_code,
        product_name,
        category_id,
        unit,
        description,

        is_stock_item,
        is_service_item,

        cost_price,
        default_sell_price,

        is_active,
        is_deleted,

        created_by,
        updated_by,

        product_type,
        search_keywords,

        base_uom_code,
        default_purchase_uom_code,
        default_request_uom_code,
        default_sales_uom_code,

        uses_coverage,
        default_waste_percent,

        product_code_category_variant_id,
        product_code_type_id,
        product_code_size_rule_id,
        product_colour_id,
        product_code_size_token,
        product_code_variant_number,
        product_code_generated_at,
        product_code_generated_by,

        variant_name,
        variant_description
    )
    values (
        v_product_code,
        v_product_name,
        v_category_id,
        v_base_uom_code,

        nullif(
            btrim(p_product ->> 'description'),
            ''
        ),

        v_is_stock_item,
        v_is_service_item,

        null,
        null,

        v_is_active,
        false,

        v_generated_by,
        v_generated_by,

        v_product_type,

        nullif(
            btrim(p_product ->> 'search_keywords'),
            ''
        ),

        v_base_uom_code,

        -- α╕èα╕▒α╣êα╕ºα╕äα╕úα╕▓α╕ºα╣âα╕èα╣ë Base UOM
        v_base_uom_code,
        v_base_uom_code,
        v_base_uom_code,

        v_uses_coverage,
        v_default_waste_percent,

        nullif(
            p_product ->> 'product_code_category_variant_id',
            ''
        )::uuid,

        nullif(
            p_product ->> 'product_code_type_id',
            ''
        )::uuid,

        nullif(
            p_product ->> 'product_code_size_rule_id',
            ''
        )::uuid,

        nullif(
            p_product ->> 'product_colour_id',
            ''
        )::uuid,

        v_generated.size_token,
        v_generated.variant_number,
        v_generated.generated_at,
        v_generated_by,

        v_variant_name,
        v_variant_description
    )
    returning products.product_id
    into v_product_id;


    -- ========================================================
    -- 5. Link Variant Registry to Product
    -- ========================================================

    select registry.product_code_variant_registry_id
    into v_registry_id
    from public.product_code_variant_registry registry
    where registry.full_product_code = v_product_code
      and registry.product_id is null
    for update;


    if v_registry_id is null then
        raise exception
            'Unable to locate the reserved Product Variant Registry record.';
    end if;


    update public.product_code_variant_registry
    set product_id = v_product_id
    where product_code_variant_registry_id = v_registry_id;


    -- ========================================================
    -- 6. Insert UOM Conversions
    -- ========================================================

    for v_conversion in
        select value
        from jsonb_array_elements(p_uom_conversions)
    loop
        v_from_uom_code :=
            nullif(
                btrim(v_conversion ->> 'from_uom_code'),
                ''
            );

        if v_from_uom_code is null then
            raise exception
                'Transaction UOM is required for every conversion.';
        end if;


        if v_from_uom_code = v_base_uom_code then
            raise exception
                'A conversion is not required for Base UOM %.',
                v_base_uom_code;
        end if;


        if not exists (
            select 1
            from public.units_of_measure uom
            where uom.uom_code = v_from_uom_code
              and uom.is_active = true
              and uom.is_deleted = false
        ) then
            raise exception
                'Transaction UOM % is inactive or does not exist.',
                v_from_uom_code;
        end if;


        v_conversion_factor :=
            nullif(
                v_conversion ->> 'conversion_factor',
                ''
            )::numeric;

        if v_conversion_factor is null
           or v_conversion_factor <= 0 then
            raise exception
                'Conversion Factor for UOM % must be greater than zero.',
                v_from_uom_code;
        end if;


        insert into public.product_uom_conversions (
            product_id,
            from_uom_code,
            to_uom_code,
            conversion_factor,
            allow_fractional_quantity,
            sort_order,
            is_active,
            is_deleted,
            created_by,
            updated_by
        )
        values (
            v_product_id,
            v_from_uom_code,
            v_base_uom_code,
            v_conversion_factor,

            coalesce(
                (v_conversion ->>
                    'allow_fractional_quantity')::boolean,
                false
            ),

            coalesce(
                nullif(
                    v_conversion ->> 'sort_order',
                    ''
                )::integer,
                10
            ),

            coalesce(
                (v_conversion ->> 'is_active')::boolean,
                true
            ),

            false,
            v_generated_by,
            v_generated_by
        );
    end loop;


    -- ========================================================
    -- 7. Apply real Default UOM values
    --
    -- Trigger α╕êα╕░α╕òα╕úα╕ºα╕êα╕ºα╣êα╕▓ UOM α╕òα╣êα╕▓α╕çα╕êα╕▓α╕ü Base α╕íα╕╡ Conversion α╣üα╕Ñα╣ëα╕º
    -- ========================================================

    update public.products
    set
        default_purchase_uom_code =
            v_default_purchase_uom_code,
        default_request_uom_code =
            v_default_request_uom_code,
        default_sales_uom_code =
            v_default_sales_uom_code,
        updated_by = v_generated_by
    where products.product_id = v_product_id;


    -- ========================================================
    -- 8. Insert Coverage
    -- ========================================================

    if jsonb_array_length(p_coverages) > 0
       and v_uses_coverage = false then
        raise exception
            'Uses Coverage must be enabled before Coverage rows can be added.';
    end if;


    for v_coverage in
        select value
        from jsonb_array_elements(p_coverages)
    loop
        insert into public.product_coverages (
            product_id,

            source_quantity,
            source_uom_code,

            coverage_quantity,
            coverage_uom_code,

            minimum_coverage,
            maximum_coverage,

            is_estimate,
            is_default,

            notes,
            sort_order,

            is_active,
            is_deleted,

            created_by,
            updated_by
        )
        values (
            v_product_id,

            coalesce(
                nullif(
                    v_coverage ->> 'source_quantity',
                    ''
                )::numeric,
                1
            ),

            nullif(
                btrim(v_coverage ->> 'source_uom_code'),
                ''
            ),

            nullif(
                v_coverage ->> 'coverage_quantity',
                ''
            )::numeric,

            nullif(
                btrim(v_coverage ->> 'coverage_uom_code'),
                ''
            ),

            nullif(
                v_coverage ->> 'minimum_coverage',
                ''
            )::numeric,

            nullif(
                v_coverage ->> 'maximum_coverage',
                ''
            )::numeric,

            coalesce(
                (v_coverage ->> 'is_estimate')::boolean,
                true
            ),

            coalesce(
                (v_coverage ->> 'is_default')::boolean,
                false
            ),

            nullif(
                btrim(v_coverage ->> 'notes'),
                ''
            ),

            coalesce(
                nullif(
                    v_coverage ->> 'sort_order',
                    ''
                )::integer,
                10
            ),

            coalesce(
                (v_coverage ->> 'is_active')::boolean,
                true
            ),

            false,
            v_generated_by,
            v_generated_by
        );
    end loop;


    -- ========================================================
    -- 9. Insert Dynamic Attribute Values
    -- ========================================================

    for v_attribute in
        select value
        from jsonb_array_elements(p_attributes)
    loop
        begin
            v_attribute_id :=
                nullif(
                    v_attribute ->> 'attribute_id',
                    ''
                )::uuid;
        exception
            when invalid_text_representation then
                raise exception
                    'A Product Attribute ID is invalid.';
        end;


        if v_attribute_id is null then
            raise exception
                'Attribute ID is required.';
        end if;


        if not exists (
            select 1
            from public.product_category_attributes mapping
            join public.product_attribute_definitions definition
              on definition.attribute_id =
                 mapping.attribute_id
            where mapping.category_id = v_category_id
              and mapping.attribute_id = v_attribute_id
              and mapping.is_active = true
              and mapping.is_deleted = false
              and mapping.is_hidden = false
              and definition.is_active = true
              and definition.is_deleted = false
        ) then
            raise exception
                'Attribute % is not available for the selected Product Category.',
                v_attribute_id;
        end if;


        v_selected_option_id :=
            nullif(
                v_attribute ->> 'selected_option_id',
                ''
            )::uuid;


        insert into public.product_attribute_values (
            product_id,
            attribute_id,

            value_text,
            value_number,
            value_boolean,
            value_date,
            selected_option_id,

            is_deleted,
            created_by,
            updated_by
        )
        values (
            v_product_id,
            v_attribute_id,

            nullif(
                btrim(v_attribute ->> 'value_text'),
                ''
            ),

            nullif(
                v_attribute ->> 'value_number',
                ''
            )::numeric,

            case
                when v_attribute ? 'value_boolean'
                     and v_attribute ->>
                         'value_boolean' is not null
                then
                    (v_attribute ->>
                        'value_boolean')::boolean
                else null
            end,

            nullif(
                v_attribute ->> 'value_date',
                ''
            )::date,

            v_selected_option_id,

            false,
            v_generated_by,
            v_generated_by
        )
        returning
            product_attribute_value_id
        into v_attribute_value_id;


        -- ----------------------------------------------------
        -- Multi-select options
        -- ----------------------------------------------------

        v_option_ids :=
            coalesce(
                v_attribute -> 'option_ids',
                '[]'::jsonb
            );

        if jsonb_typeof(v_option_ids) <> 'array' then
            raise exception
                'Attribute option_ids must be a JSON array.';
        end if;


        for v_option_id_text in
            select jsonb_array_elements_text(v_option_ids)
        loop
            if not exists (
                select 1
                from public.product_attribute_options option_row
                where option_row.attribute_option_id =
                      v_option_id_text::uuid
                  and option_row.attribute_id =
                      v_attribute_id
                  and option_row.is_active = true
                  and option_row.is_deleted = false
            ) then
                raise exception
                    'Attribute Option % is invalid for Attribute %.',
                    v_option_id_text,
                    v_attribute_id;
            end if;


            insert into
                public.product_attribute_value_options (
                    product_attribute_value_id,
                    attribute_option_id,
                    created_by
                )
            values (
                v_attribute_value_id,
                v_option_id_text::uuid,
                v_generated_by
            );
        end loop;
    end loop;


    -- ========================================================
    -- 10. Return created Product
    -- ========================================================

    return query
    select
        v_product_id,
        v_product_code,
        v_product_name,
        lpad(
            v_generated.variant_number::text,
            2,
            '0'
        );

end;
$function$

