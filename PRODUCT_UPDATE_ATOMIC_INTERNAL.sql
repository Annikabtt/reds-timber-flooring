CREATE OR REPLACE FUNCTION public.update_product_atomic_internal(p_product_id uuid, p_product jsonb, p_uom_conversions jsonb DEFAULT '[]'::jsonb, p_coverages jsonb DEFAULT '[]'::jsonb, p_attributes jsonb DEFAULT '[]'::jsonb)
 RETURNS TABLE(product_id uuid, product_code text, product_name text)
 LANGUAGE plpgsql
 SECURITY DEFINER
 SET search_path TO 'public'
AS $function$
declare
    v_existing_product public.products%rowtype;

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

    v_has_transactions boolean := false;

    v_conversion jsonb;
    v_coverage jsonb;
    v_attribute jsonb;

    v_from_uom_code text;
    v_conversion_factor numeric;
    v_allow_fractional_quantity boolean;
    v_conversion_sort_order integer;
    v_conversion_is_active boolean;

    v_attribute_id uuid;
    v_selected_option_id uuid;
    v_attribute_value_id uuid;
    v_matching_attribute_value_id uuid;

    v_attribute_value_text text;
    v_attribute_value_number numeric;
    v_attribute_value_boolean boolean;
    v_attribute_value_date date;

    v_option_ids jsonb;
    v_normalized_option_ids jsonb;
    v_option_id_text text;

    v_updated_by uuid;
begin
    -- ========================================================
    -- 1. Validate caller
    -- ========================================================

    if not public.can_manage_products_strict() then
        raise exception
            'Only Admin can update Products.';
    end if;


    if p_product_id is null then
        raise exception
            'Product ID is required.';
    end if;


    if p_product is null
       or jsonb_typeof(p_product) <> 'object' then
        raise exception
            'Product data is required.';
    end if;


    if coalesce(
        jsonb_typeof(p_uom_conversions),
        'null'
    ) <> 'array' then
        raise exception
            'UOM Conversions must be supplied as a JSON array.';
    end if;


    if coalesce(
        jsonb_typeof(p_coverages),
        'null'
    ) <> 'array' then
        raise exception
            'Product Coverages must be supplied as a JSON array.';
    end if;


    if coalesce(
        jsonb_typeof(p_attributes),
        'null'
    ) <> 'array' then
        raise exception
            'Product Attributes must be supplied as a JSON array.';
    end if;


    -- Lock Product row during update
    select product_row.*
    into v_existing_product
    from public.products product_row
    where product_row.product_id = p_product_id
      and product_row.is_deleted = false
    for update;


    if not found then
        raise exception
            'Product does not exist or has been deleted.';
    end if;


    v_updated_by := auth.uid();


    -- ========================================================
    -- 2. Product Core values
    -- ========================================================

    v_product_name :=
        nullif(btrim(p_product ->> 'product_name'), '');

    if v_product_name is null then
        raise exception
            'Product Name is required.';
    end if;


    if char_length(v_product_name) > 200 then
        raise exception
            'Product Name cannot exceed 200 characters.';
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
            raise exception
                'Product Category is invalid.';
    end;


    if v_category_id is null then
        raise exception
            'Product Category is required.';
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
        raise exception
            'Base UOM is required.';
    end if;


    if not exists (
        select 1
        from public.units_of_measure uom_row
        where uom_row.uom_code = v_base_uom_code
          and uom_row.is_active = true
          and uom_row.is_deleted = false
    ) then
        raise exception
            'Base UOM % is inactive or does not exist.',
            v_base_uom_code;
    end if;


    v_default_purchase_uom_code :=
        coalesce(
            nullif(
                btrim(
                    p_product ->> 'default_purchase_uom_code'
                ),
                ''
            ),
            v_base_uom_code
        );


    v_default_request_uom_code :=
        coalesce(
            nullif(
                btrim(
                    p_product ->> 'default_request_uom_code'
                ),
                ''
            ),
            v_base_uom_code
        );


    v_default_sales_uom_code :=
        coalesce(
            nullif(
                btrim(
                    p_product ->> 'default_sales_uom_code'
                ),
                ''
            ),
            v_base_uom_code
        );


    -- α╕òα╕úα╕ºα╕êα╕ºα╣êα╕▓ Default UOM α╕ùα╕╕α╕üα╕òα╕▒α╕ºα╕íα╕╡α╕¡α╕óα╕╣α╣êα╕êα╕úα╕┤α╕çα╣üα╕Ñα╕░ Active
    if not exists (
        select 1
        from public.units_of_measure uom_row
        where uom_row.uom_code =
              v_default_purchase_uom_code
          and uom_row.is_active = true
          and uom_row.is_deleted = false
    ) then
        raise exception
            'Default Purchase UOM % is inactive or does not exist.',
            v_default_purchase_uom_code;
    end if;


    if not exists (
        select 1
        from public.units_of_measure uom_row
        where uom_row.uom_code =
              v_default_request_uom_code
          and uom_row.is_active = true
          and uom_row.is_deleted = false
    ) then
        raise exception
            'Default Request UOM % is inactive or does not exist.',
            v_default_request_uom_code;
    end if;


    if not exists (
        select 1
        from public.units_of_measure uom_row
        where uom_row.uom_code =
              v_default_sales_uom_code
          and uom_row.is_active = true
          and uom_row.is_deleted = false
    ) then
        raise exception
            'Default Sales UOM % is inactive or does not exist.',
            v_default_sales_uom_code;
    end if;


    v_variant_name :=
        nullif(btrim(p_product ->> 'variant_name'), '');

    if v_variant_name is null then
        raise exception
            'Variant Name is required.';
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
            v_existing_product.is_active
        );


    -- ========================================================
    -- 3. Check whether Base UOM is locked
    -- ========================================================

    v_has_transactions :=
        exists (
            select 1
            from public.purchase_order_lines row_item
            where row_item.product_id = p_product_id
        )
        or exists (
            select 1
            from public.quotation_lines row_item
            where row_item.product_id = p_product_id
        )
        or exists (
            select 1
            from public.quotation_revision_lines row_item
            where row_item.product_id = p_product_id
        )
        or exists (
            select 1
            from public.stock_request_items row_item
            where row_item.product_id = p_product_id
        )
        or exists (
            select 1
            from public.supplier_delivery_items row_item
            where row_item.product_id = p_product_id
        )
        or exists (
            select 1
            from public.stock_lots row_item
            where row_item.product_id = p_product_id
        )
        or exists (
            select 1
            from public.stock_movements row_item
            where row_item.product_id = p_product_id
        )
        or exists (
            select 1
            from public.supplier_replacement_claim_items row_item
            where row_item.product_id = p_product_id
        )
        or exists (
            select 1
            from public.supplier_replacement_receipt_items row_item
            where row_item.product_id = p_product_id
        );


    if v_existing_product.base_uom_code
       is distinct from v_base_uom_code
       and v_has_transactions then
        raise exception
            'Base UOM cannot be changed because this Product has already been used in a transaction.';
    end if;


    -- ========================================================
    -- 4. Update Product Core
    --
    -- Temporarily set all Default UOMs to Base UOM.
    -- This allows Conversion rows to be rebuilt safely.
    --
    -- Product Code Identity columns are intentionally omitted.
    -- ========================================================

    update public.products
    set
        product_name = v_product_name,
        category_id = v_category_id,
        description = nullif(
            btrim(p_product ->> 'description'),
            ''
        ),

        is_stock_item = v_is_stock_item,
        is_service_item = v_is_service_item,

        product_type = v_product_type,
        search_keywords = nullif(
            btrim(p_product ->> 'search_keywords'),
            ''
        ),

        base_uom_code = v_base_uom_code,
        unit = v_base_uom_code,

        default_purchase_uom_code = v_base_uom_code,
        default_request_uom_code = v_base_uom_code,
        default_sales_uom_code = v_base_uom_code,

        uses_coverage = v_uses_coverage,
        default_waste_percent =
            v_default_waste_percent,

        variant_name = v_variant_name,
        variant_description =
            v_variant_description,

        is_active = v_is_active,

        updated_at = now(),
        updated_by = v_updated_by
    where products.product_id = p_product_id;


    -- ========================================================
    -- 5. Validate submitted UOM Conversions
    -- ========================================================

    if exists (
        select 1
        from (
            select
                nullif(
                    btrim(conversion_item ->> 'from_uom_code'),
                    ''
                ) as from_uom_code,
                count(*) as row_count
            from jsonb_array_elements(p_uom_conversions)
                as submitted_conversion(conversion_item)
            group by
                nullif(
                    btrim(conversion_item ->> 'from_uom_code'),
                    ''
                )
        ) duplicate_check
        where duplicate_check.from_uom_code is not null
          and duplicate_check.row_count > 1
    ) then
        raise exception
            'Each Transaction UOM may appear only once in UOM Conversions.';
    end if;


    for v_conversion in
        select value
        from jsonb_array_elements(p_uom_conversions)
    loop
        v_from_uom_code :=
            nullif(
                btrim(
                    v_conversion ->> 'from_uom_code'
                ),
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
            from public.units_of_measure uom_row
            where uom_row.uom_code =
                  v_from_uom_code
              and uom_row.is_active = true
              and uom_row.is_deleted = false
        ) then
            raise exception
                'Transaction UOM % is inactive or does not exist.',
                v_from_uom_code;
        end if;


        begin
            v_conversion_factor :=
                nullif(
                    v_conversion ->> 'conversion_factor',
                    ''
                )::numeric;
        exception
            when invalid_text_representation then
                raise exception
                    'Conversion Factor for UOM % is invalid.',
                    v_from_uom_code;
        end;


        if v_conversion_factor is null
           or v_conversion_factor <= 0 then
            raise exception
                'Conversion Factor for UOM % must be greater than zero.',
                v_from_uom_code;
        end if;


        begin
            v_conversion_sort_order :=
                coalesce(
                    nullif(
                        v_conversion ->> 'sort_order',
                        ''
                    )::integer,
                    10
                );
        exception
            when invalid_text_representation then
                raise exception
                    'Sort Order for UOM % is invalid.',
                    v_from_uom_code;
        end;


        v_allow_fractional_quantity :=
            coalesce(
                (
                    v_conversion ->>
                    'allow_fractional_quantity'
                )::boolean,
                false
            );


        v_conversion_is_active :=
            coalesce(
                (
                    v_conversion ->>
                    'is_active'
                )::boolean,
                true
            );
    end loop;


    -- ========================================================
    -- 6. Reconcile UOM Conversions
    --
    -- Keep unchanged rows as-is.
    -- Archive only rows that were removed or changed.
    -- Insert only rows that are new or changed.
    -- ========================================================

    update public.product_uom_conversions as conversion_row
    set
        is_active = false,
        is_deleted = true,
        deleted_at = now(),
        updated_at = now(),
        updated_by = v_updated_by
    where conversion_row.product_id = p_product_id
      and conversion_row.is_deleted = false
      and not exists (
          select 1
          from jsonb_array_elements(p_uom_conversions)
              as submitted_conversion(conversion_item)
          where nullif(
                    btrim(
                        conversion_item ->> 'from_uom_code'
                    ),
                    ''
                ) = conversion_row.from_uom_code
            and conversion_row.to_uom_code =
                v_base_uom_code
            and conversion_row.conversion_factor =
                nullif(
                    conversion_item ->> 'conversion_factor',
                    ''
                )::numeric
            and conversion_row.allow_fractional_quantity =
                coalesce(
                    (
                        conversion_item ->>
                        'allow_fractional_quantity'
                    )::boolean,
                    false
                )
            and conversion_row.sort_order =
                coalesce(
                    nullif(
                        conversion_item ->> 'sort_order',
                        ''
                    )::integer,
                    10
                )
            and conversion_row.is_active =
                coalesce(
                    (
                        conversion_item ->>
                        'is_active'
                    )::boolean,
                    true
                )
      );


    for v_conversion in
        select value
        from jsonb_array_elements(p_uom_conversions)
    loop
        v_from_uom_code :=
            nullif(
                btrim(
                    v_conversion ->> 'from_uom_code'
                ),
                ''
            );

        v_conversion_factor :=
            nullif(
                v_conversion ->> 'conversion_factor',
                ''
            )::numeric;

        v_allow_fractional_quantity :=
            coalesce(
                (
                    v_conversion ->>
                    'allow_fractional_quantity'
                )::boolean,
                false
            );

        v_conversion_sort_order :=
            coalesce(
                nullif(
                    v_conversion ->> 'sort_order',
                    ''
                )::integer,
                10
            );

        v_conversion_is_active :=
            coalesce(
                (
                    v_conversion ->>
                    'is_active'
                )::boolean,
                true
            );


        if not exists (
            select 1
            from public.product_uom_conversions conversion_row
            where conversion_row.product_id = p_product_id
              and conversion_row.from_uom_code =
                  v_from_uom_code
              and conversion_row.to_uom_code =
                  v_base_uom_code
              and conversion_row.conversion_factor =
                  v_conversion_factor
              and conversion_row.allow_fractional_quantity =
                  v_allow_fractional_quantity
              and conversion_row.sort_order =
                  v_conversion_sort_order
              and conversion_row.is_active =
                  v_conversion_is_active
              and conversion_row.is_deleted = false
        ) then
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
                p_product_id,
                v_from_uom_code,
                v_base_uom_code,
                v_conversion_factor,
                v_allow_fractional_quantity,
                v_conversion_sort_order,
                v_conversion_is_active,
                false,
                v_updated_by,
                v_updated_by
            );
        end if;
    end loop;


    -- ========================================================
    -- 7. Apply actual Default UOM values
    --
    -- Product Trigger validates that every non-base default
    -- has an active Conversion.
    -- ========================================================

    update public.products
    set
        default_purchase_uom_code =
            v_default_purchase_uom_code,

        default_request_uom_code =
            v_default_request_uom_code,

        default_sales_uom_code =
            v_default_sales_uom_code,

        updated_at = now(),
        updated_by = v_updated_by
    where products.product_id = p_product_id;


    -- ========================================================
    -- 8. Validate submitted Coverage rows
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
        if nullif(
            btrim(v_coverage ->> 'source_uom_code'),
            ''
        ) is null then
            raise exception
                'Coverage Source UOM is required.';
        end if;


        if not exists (
            select 1
            from public.units_of_measure uom_row
            where uom_row.uom_code = nullif(
                      btrim(
                          v_coverage ->>
                          'source_uom_code'
                      ),
                      ''
                  )
              and uom_row.is_active = true
              and uom_row.is_deleted = false
        ) then
            raise exception
                'Coverage Source UOM % is inactive or does not exist.',
                nullif(
                    btrim(
                        v_coverage ->>
                        'source_uom_code'
                    ),
                    ''
                );
        end if;


        if nullif(
            btrim(v_coverage ->> 'coverage_uom_code'),
            ''
        ) is null then
            raise exception
                'Coverage UOM is required.';
        end if;


        if not exists (
            select 1
            from public.units_of_measure uom_row
            where uom_row.uom_code = nullif(
                      btrim(
                          v_coverage ->>
                          'coverage_uom_code'
                      ),
                      ''
                  )
              and uom_row.is_active = true
              and uom_row.is_deleted = false
        ) then
            raise exception
                'Coverage UOM % is inactive or does not exist.',
                nullif(
                    btrim(
                        v_coverage ->>
                        'coverage_uom_code'
                    ),
                    ''
                );
        end if;


        if coalesce(
            nullif(
                v_coverage ->> 'source_quantity',
                ''
            )::numeric,
            1
        ) <= 0 then
            raise exception
                'Coverage Source Quantity must be greater than zero.';
        end if;


        if nullif(
            v_coverage ->> 'coverage_quantity',
            ''
        )::numeric is null
        or nullif(
            v_coverage ->> 'coverage_quantity',
            ''
        )::numeric <= 0 then
            raise exception
                'Coverage Quantity must be greater than zero.';
        end if;


        if nullif(
            v_coverage ->> 'minimum_coverage',
            ''
        )::numeric is not null
        and nullif(
            v_coverage ->> 'minimum_coverage',
            ''
        )::numeric < 0 then
            raise exception
                'Minimum Coverage cannot be negative.';
        end if;


        if nullif(
            v_coverage ->> 'maximum_coverage',
            ''
        )::numeric is not null
        and nullif(
            v_coverage ->> 'maximum_coverage',
            ''
        )::numeric < 0 then
            raise exception
                'Maximum Coverage cannot be negative.';
        end if;


        if nullif(
            v_coverage ->> 'minimum_coverage',
            ''
        )::numeric is not null
        and nullif(
            v_coverage ->> 'maximum_coverage',
            ''
        )::numeric is not null
        and nullif(
            v_coverage ->> 'minimum_coverage',
            ''
        )::numeric > nullif(
            v_coverage ->> 'maximum_coverage',
            ''
        )::numeric then
            raise exception
                'Minimum Coverage cannot be greater than Maximum Coverage.';
        end if;
    end loop;


    -- ========================================================
    -- 9. Reconcile Coverage rows
    --
    -- Keep unchanged rows as-is.
    -- Archive only rows that were removed or changed.
    -- Insert only rows that are new or changed.
    -- ========================================================

    update public.product_coverages as coverage_row
    set
        is_active = false,
        is_deleted = true,
        deleted_at = now(),
        updated_at = now(),
        updated_by = v_updated_by
    where coverage_row.product_id = p_product_id
      and coverage_row.is_deleted = false
      and not exists (
          select 1
          from jsonb_array_elements(p_coverages)
              as submitted_coverage(coverage_item)
          where coverage_row.source_quantity =
                coalesce(
                    nullif(
                        coverage_item ->>
                        'source_quantity',
                        ''
                    )::numeric,
                    1
                )
            and coverage_row.source_uom_code =
                nullif(
                    btrim(
                        coverage_item ->>
                        'source_uom_code'
                    ),
                    ''
                )
            and coverage_row.coverage_quantity =
                nullif(
                    coverage_item ->>
                    'coverage_quantity',
                    ''
                )::numeric
            and coverage_row.coverage_uom_code =
                nullif(
                    btrim(
                        coverage_item ->>
                        'coverage_uom_code'
                    ),
                    ''
                )
            and coverage_row.minimum_coverage
                is not distinct from
                nullif(
                    coverage_item ->>
                    'minimum_coverage',
                    ''
                )::numeric
            and coverage_row.maximum_coverage
                is not distinct from
                nullif(
                    coverage_item ->>
                    'maximum_coverage',
                    ''
                )::numeric
            and coverage_row.is_estimate =
                coalesce(
                    (
                        coverage_item ->>
                        'is_estimate'
                    )::boolean,
                    true
                )
            and coverage_row.is_default =
                coalesce(
                    (
                        coverage_item ->>
                        'is_default'
                    )::boolean,
                    false
                )
            and coverage_row.notes
                is not distinct from
                nullif(
                    btrim(
                        coverage_item ->> 'notes'
                    ),
                    ''
                )
            and coverage_row.sort_order =
                coalesce(
                    nullif(
                        coverage_item ->>
                        'sort_order',
                        ''
                    )::integer,
                    10
                )
            and coverage_row.is_active =
                coalesce(
                    (
                        coverage_item ->>
                        'is_active'
                    )::boolean,
                    true
                )
      );


    for v_coverage in
        select value
        from jsonb_array_elements(p_coverages)
    loop
        if not exists (
            select 1
            from public.product_coverages coverage_row
            where coverage_row.product_id = p_product_id
              and coverage_row.is_deleted = false
              and coverage_row.source_quantity =
                  coalesce(
                      nullif(
                          v_coverage ->>
                          'source_quantity',
                          ''
                      )::numeric,
                      1
                  )
              and coverage_row.source_uom_code =
                  nullif(
                      btrim(
                          v_coverage ->>
                          'source_uom_code'
                      ),
                      ''
                  )
              and coverage_row.coverage_quantity =
                  nullif(
                      v_coverage ->>
                      'coverage_quantity',
                      ''
                  )::numeric
              and coverage_row.coverage_uom_code =
                  nullif(
                      btrim(
                          v_coverage ->>
                          'coverage_uom_code'
                      ),
                      ''
                  )
              and coverage_row.minimum_coverage
                  is not distinct from
                  nullif(
                      v_coverage ->>
                      'minimum_coverage',
                      ''
                  )::numeric
              and coverage_row.maximum_coverage
                  is not distinct from
                  nullif(
                      v_coverage ->>
                      'maximum_coverage',
                      ''
                  )::numeric
              and coverage_row.is_estimate =
                  coalesce(
                      (
                          v_coverage ->>
                          'is_estimate'
                      )::boolean,
                      true
                  )
              and coverage_row.is_default =
                  coalesce(
                      (
                          v_coverage ->>
                          'is_default'
                      )::boolean,
                      false
                  )
              and coverage_row.notes
                  is not distinct from
                  nullif(
                      btrim(
                          v_coverage ->> 'notes'
                      ),
                      ''
                  )
              and coverage_row.sort_order =
                  coalesce(
                      nullif(
                          v_coverage ->>
                          'sort_order',
                          ''
                      )::integer,
                      10
                  )
              and coverage_row.is_active =
                  coalesce(
                      (
                          v_coverage ->>
                          'is_active'
                      )::boolean,
                      true
                  )
        ) then
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
                p_product_id,

                coalesce(
                    nullif(
                        v_coverage ->>
                        'source_quantity',
                        ''
                    )::numeric,
                    1
                ),

                nullif(
                    btrim(
                        v_coverage ->>
                        'source_uom_code'
                    ),
                    ''
                ),

                nullif(
                    v_coverage ->>
                    'coverage_quantity',
                    ''
                )::numeric,

                nullif(
                    btrim(
                        v_coverage ->>
                        'coverage_uom_code'
                    ),
                    ''
                ),

                nullif(
                    v_coverage ->>
                    'minimum_coverage',
                    ''
                )::numeric,

                nullif(
                    v_coverage ->>
                    'maximum_coverage',
                    ''
                )::numeric,

                coalesce(
                    (
                        v_coverage ->>
                        'is_estimate'
                    )::boolean,
                    true
                ),

                coalesce(
                    (
                        v_coverage ->>
                        'is_default'
                    )::boolean,
                    false
                ),

                nullif(
                    btrim(
                        v_coverage ->> 'notes'
                    ),
                    ''
                ),

                coalesce(
                    nullif(
                        v_coverage ->>
                        'sort_order',
                        ''
                    )::integer,
                    10
                ),

                coalesce(
                    (
                        v_coverage ->>
                        'is_active'
                    )::boolean,
                    true
                ),

                false,
                v_updated_by,
                v_updated_by
            );
        end if;
    end loop;


    -- ========================================================
    -- 10. Validate and apply Attribute Value differences
    --
    -- Existing Attribute rows are preserved when every scalar
    -- value and the complete option set are unchanged.
    -- Changed rows are archived and replaced. Attributes omitted
    -- from the submitted payload are archived after this loop.
    -- ========================================================

    if exists (
        select 1
        from (
            select
                nullif(attribute_item ->> 'attribute_id', '')::uuid
                    as attribute_id,
                count(*) as item_count
            from jsonb_array_elements(p_attributes)
                as submitted(attribute_item)
            group by
                nullif(attribute_item ->> 'attribute_id', '')::uuid
            having count(*) > 1
        ) duplicate_rows
    ) then
        raise exception
            'Each Product Attribute may be submitted only once.';
    end if;


    for v_attribute in
        select value
        from jsonb_array_elements(p_attributes)
    loop
        begin
            v_attribute_id :=
                nullif(
                    v_attribute ->>
                    'attribute_id',
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


        -- Validate against the effective Attribute set, not only direct
        -- mappings on the selected Category. This supports inherited
        -- Attributes from parent Categories and respects overrides/hiding.
        if not exists (
            select 1
            from public.get_effective_product_category_attributes(
                v_category_id
            ) as effective_attribute
            where effective_attribute.attribute_id =
                  v_attribute_id
        ) then
            raise exception
                'Attribute % is not available for the selected Product Category.',
                v_attribute_id;
        end if;


        begin
            v_selected_option_id :=
                nullif(
                    v_attribute ->>
                    'selected_option_id',
                    ''
                )::uuid;
        exception
            when invalid_text_representation then
                raise exception
                    'A selected Attribute Option ID is invalid.';
        end;


        if v_selected_option_id is not null
           and not exists (
               select 1
               from public.product_attribute_options option_row
               where option_row.attribute_option_id =
                     v_selected_option_id
                 and option_row.attribute_id =
                     v_attribute_id
                 and option_row.is_active = true
                 and option_row.is_deleted = false
           ) then
            raise exception
                'Selected Option is invalid for Attribute %.',
                v_attribute_id;
        end if;


        v_attribute_value_text :=
            nullif(
                btrim(
                    v_attribute ->>
                    'value_text'
                ),
                ''
            );


        begin
            v_attribute_value_number :=
                nullif(
                    v_attribute ->>
                    'value_number',
                    ''
                )::numeric;
        exception
            when invalid_text_representation then
                raise exception
                    'The numeric value for Attribute % is invalid.',
                    v_attribute_id;
        end;


        begin
            v_attribute_value_boolean :=
                case
                    when v_attribute ? 'value_boolean'
                         and v_attribute ->> 'value_boolean'
                             is not null
                    then
                        (
                            v_attribute ->>
                            'value_boolean'
                        )::boolean
                    else null
                end;
        exception
            when invalid_text_representation then
                raise exception
                    'The boolean value for Attribute % is invalid.',
                    v_attribute_id;
        end;


        begin
            v_attribute_value_date :=
                nullif(
                    v_attribute ->>
                    'value_date',
                    ''
                )::date;
        exception
            when invalid_text_representation
                 or datetime_field_overflow then
                raise exception
                    'The date value for Attribute % is invalid.',
                    v_attribute_id;
        end;


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
            select jsonb_array_elements_text(
                v_option_ids
            )
        loop
            begin
                perform v_option_id_text::uuid;
            exception
                when invalid_text_representation then
                    raise exception
                        'Attribute Option % is not a valid UUID.',
                        v_option_id_text;
            end;


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
        end loop;


        select coalesce(
            jsonb_agg(
                to_jsonb(normalized.option_id_text)
                order by normalized.option_id_text
            ),
            '[]'::jsonb
        )
        into v_normalized_option_ids
        from (
            select distinct option_id_text
            from jsonb_array_elements_text(v_option_ids)
                as submitted_options(option_id_text)
        ) normalized;


        v_matching_attribute_value_id := null;

        select attribute_value_row.product_attribute_value_id
        into v_matching_attribute_value_id
        from public.product_attribute_values attribute_value_row
        where attribute_value_row.product_id = p_product_id
          and attribute_value_row.attribute_id = v_attribute_id
          and attribute_value_row.is_deleted = false
          and attribute_value_row.value_text
                is not distinct from v_attribute_value_text
          and attribute_value_row.value_number
                is not distinct from v_attribute_value_number
          and attribute_value_row.value_boolean
                is not distinct from v_attribute_value_boolean
          and attribute_value_row.value_date
                is not distinct from v_attribute_value_date
          and attribute_value_row.selected_option_id
                is not distinct from v_selected_option_id
          and coalesce(
                (
                    select jsonb_agg(
                        to_jsonb(
                            option_link.attribute_option_id::text
                        )
                        order by
                            option_link.attribute_option_id::text
                    )
                    from public.product_attribute_value_options option_link
                    where option_link.product_attribute_value_id =
                          attribute_value_row.product_attribute_value_id
                ),
                '[]'::jsonb
              ) = v_normalized_option_ids
        order by attribute_value_row.created_at desc
        limit 1;


        if v_matching_attribute_value_id is not null then
            -- Preserve the unchanged active row. Archive any accidental
            -- duplicate active rows for the same Product Attribute.
            update public.product_attribute_values attribute_value_row
            set
                is_deleted = true,
                deleted_at = now(),
                updated_at = now(),
                updated_by = v_updated_by
            where attribute_value_row.product_id = p_product_id
              and attribute_value_row.attribute_id = v_attribute_id
              and attribute_value_row.is_deleted = false
              and attribute_value_row.product_attribute_value_id <>
                  v_matching_attribute_value_id;
        else
            -- The submitted value differs from the active value.
            update public.product_attribute_values attribute_value_row
            set
                is_deleted = true,
                deleted_at = now(),
                updated_at = now(),
                updated_by = v_updated_by
            where attribute_value_row.product_id = p_product_id
              and attribute_value_row.attribute_id = v_attribute_id
              and attribute_value_row.is_deleted = false;


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
                p_product_id,
                v_attribute_id,
                v_attribute_value_text,
                v_attribute_value_number,
                v_attribute_value_boolean,
                v_attribute_value_date,
                v_selected_option_id,
                false,
                v_updated_by,
                v_updated_by
            )
            returning product_attribute_value_id
            into v_attribute_value_id;


            for v_option_id_text in
                select distinct option_id_text
                from jsonb_array_elements_text(v_option_ids)
                    as submitted_options(option_id_text)
            loop
                insert into public.product_attribute_value_options (
                    product_attribute_value_id,
                    attribute_option_id,
                    created_by
                )
                values (
                    v_attribute_value_id,
                    v_option_id_text::uuid,
                    v_updated_by
                );
            end loop;
        end if;
    end loop;


    -- Archive active Attribute values that were removed from the form.
    update public.product_attribute_values attribute_value_row
    set
        is_deleted = true,
        deleted_at = now(),
        updated_at = now(),
        updated_by = v_updated_by
    where attribute_value_row.product_id = p_product_id
      and attribute_value_row.is_deleted = false
      and not exists (
          select 1
          from jsonb_array_elements(p_attributes)
              as submitted(attribute_item)
          where nullif(
                    submitted.attribute_item ->>
                    'attribute_id',
                    ''
                )::uuid = attribute_value_row.attribute_id
      );


    -- ========================================================
    -- 12. Return updated Product
    -- ========================================================

    return query
    select
        product_row.product_id,
        product_row.product_code,
        product_row.product_name
    from public.products product_row
    where product_row.product_id =
          p_product_id;

end;
$function$

