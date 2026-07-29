\set ON_ERROR_STOP on
\pset pager off

BEGIN;

CREATE TEMP TABLE tool_loan_test_results (
    test_order integer NOT NULL,
    test_name text NOT NULL,
    test_result text NOT NULL,
    detail text
) ON COMMIT DROP;

DO $test$
DECLARE
    v_suffix text := to_char(clock_timestamp(), 'YYYYMMDDHH24MISSMS');
    v_auth_user_id uuid := gen_random_uuid();
    v_app_user_id uuid := gen_random_uuid();
    v_employee_id uuid := gen_random_uuid();
    v_role_id uuid := gen_random_uuid();
    v_customer_id uuid := gen_random_uuid();
    v_project_id uuid := gen_random_uuid();
    v_site_id uuid := gen_random_uuid();
    v_area_id uuid := gen_random_uuid();
    v_category_id uuid := gen_random_uuid();
    v_product_id uuid := gen_random_uuid();
    v_location_id uuid := gen_random_uuid();
    v_lot_id uuid := gen_random_uuid();
    v_request_id uuid := gen_random_uuid();
    v_request_item_id uuid := gen_random_uuid();
    v_tool_loan_id uuid;
    v_tool_loan_item_id uuid;
    v_permission_code text;
    v_permission_id uuid;
    v_before_remaining numeric;
    v_after_remaining numeric;
    v_header_status text;
    v_item_status text;
    v_posting_count integer;
    v_movement_count integer;
    v_active_item_count integer;
    v_cancelled_old_item_count integer;
    v_duplicate_blocked boolean := false;
    v_bad_allocation_blocked boolean := false;
    v_customer_type text := 'Company';
    v_employment_type text := 'Employee';
    v_uom_category text := 'Quantity';
BEGIN
    -- Simulate an authenticated Supabase request for auth.uid().
    PERFORM set_config('request.jwt.claim.sub', v_auth_user_id::text, true);
    PERFORM set_config('request.jwt.claim.role', 'authenticated', true);
    PERFORM set_config(
        'request.jwt.claims',
        jsonb_build_object(
            'sub', v_auth_user_id::text,
            'role', 'authenticated',
            'email', 'tool-loan-local-' || v_suffix || '@example.test'
        )::text,
        true
    );

    -- Minimal local Auth user. This transaction is rolled back at the end.
    INSERT INTO auth.users (
        instance_id,
        id,
        aud,
        role,
        email,
        encrypted_password,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        confirmation_token,
        email_change,
        email_change_token_new,
        recovery_token
    ) VALUES (
        '00000000-0000-0000-0000-000000000000',
        v_auth_user_id,
        'authenticated',
        'authenticated',
        'tool-loan-local-' || v_suffix || '@example.test',
        '',
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{}'::jsonb,
        now(),
        now(),
        '',
        '',
        '',
        ''
    );

    INSERT INTO public.app_users (
        app_user_id,
        auth_user_id,
        email,
        display_name,
        account_status,
        approved_at
    ) VALUES (
        v_app_user_id,
        v_auth_user_id,
        'tool-loan-local-' || v_suffix || '@example.test',
        'Tool Loan Local Test User',
        'Active',
        now()
    );

    INSERT INTO public.app_roles (
        role_id,
        role_code,
        role_name,
        description,
        is_system_role,
        is_active,
        sort_order
    ) VALUES (
        v_role_id,
        'local_tool_loan_' || v_suffix,
        'Local Tool Loan Test',
        'Temporary role for local regression testing',
        false,
        true,
        9999
    );

    INSERT INTO public.app_user_roles (
        auth_user_id,
        role_id,
        is_active,
        assigned_by,
        notes
    ) VALUES (
        v_auth_user_id,
        v_role_id,
        true,
        v_auth_user_id,
        'Local regression fixture'
    );

    FOREACH v_permission_code IN ARRAY ARRAY[
        'tool_loans.create',
        'tool_loans.approve',
        'tool_loans.prepare',
        'tool_loans.issue',
        'tool_loans.cancel'
    ] LOOP
        SELECT permission_id
        INTO v_permission_id
        FROM public.app_permissions
        WHERE permission_code = v_permission_code
          AND is_active = true
        LIMIT 1;

        IF v_permission_id IS NULL THEN
            v_permission_id := gen_random_uuid();

            INSERT INTO public.app_permissions (
                permission_id,
                permission_code,
                permission_name,
                module_code,
                action_code,
                description,
                is_system_permission,
                is_active,
                sort_order
            ) VALUES (
                v_permission_id,
                v_permission_code,
                initcap(replace(v_permission_code, '_', ' ')),
                'tool_loans',
                split_part(v_permission_code, '.', 2),
                'Temporary local regression permission',
                true,
                true,
                9999
            );
        END IF;

        INSERT INTO public.app_role_permissions (
            role_id,
            permission_id,
            is_allowed,
            created_by,
            updated_by
        ) VALUES (
            v_role_id,
            v_permission_id,
            true,
            v_auth_user_id,
            v_auth_user_id
        );
    END LOOP;

    IF NOT (
        public.has_permission('tool_loans.create')
        AND public.has_permission('tool_loans.approve')
        AND public.has_permission('tool_loans.prepare')
        AND public.has_permission('tool_loans.issue')
        AND public.has_permission('tool_loans.cancel')
    ) THEN
        RAISE EXCEPTION 'Fixture permission setup failed.';
    END IF;

    INSERT INTO tool_loan_test_results
    VALUES (1, 'authenticated_permissions', 'PASS', 'Active user has all Tool Loan permissions');

    -- Resolve permitted text values from CHECK constraints when present.
    -- Use scalar subqueries so a missing CHECK constraint keeps the declared default
    -- instead of assigning NULL to the variable.
    v_customer_type := coalesce(
        (
            SELECT (regexp_match(pg_get_constraintdef(c.oid), E'''([^'']+)'''))[1]
            FROM pg_constraint c
            WHERE c.conrelid = 'public.customers'::regclass
              AND c.contype = 'c'
              AND pg_get_constraintdef(c.oid) ILIKE '%customer_type%'
            LIMIT 1
        ),
        v_customer_type
    );

    v_employment_type := coalesce(
        (
            SELECT (regexp_match(pg_get_constraintdef(c.oid), E'''([^'']+)'''))[1]
            FROM pg_constraint c
            WHERE c.conrelid = 'public.employees'::regclass
              AND c.contype = 'c'
              AND pg_get_constraintdef(c.oid) ILIKE '%employment_type%'
            LIMIT 1
        ),
        v_employment_type
    );

    v_uom_category := coalesce(
        (
            SELECT (regexp_match(pg_get_constraintdef(c.oid), E'''([^'']+)'''))[1]
            FROM pg_constraint c
            WHERE c.conrelid = 'public.units_of_measure'::regclass
              AND c.contype = 'c'
              AND pg_get_constraintdef(c.oid) ILIKE '%uom_category%'
            LIMIT 1
        ),
        v_uom_category
    );

    INSERT INTO public.employees (
        employee_id,
        first_name,
        last_name,
        display_name,
        employment_type,
        auth_user_id,
        is_active,
        is_deleted
    ) VALUES (
        v_employee_id,
        'Local',
        'Borrower',
        'Local Borrower',
        v_employment_type,
        v_auth_user_id,
        true,
        false
    );

    INSERT INTO public.customers (
        customer_id,
        customer_code,
        customer_name,
        customer_type,
        is_active,
        is_deleted
    ) VALUES (
        v_customer_id,
        'TL-CUST-' || v_suffix,
        'Tool Loan Local Test Customer',
        v_customer_type,
        true,
        false
    );

    INSERT INTO public.projects (
        project_id,
        project_no,
        customer_id,
        project_name,
        project_type,
        project_status,
        is_active,
        is_deleted
    ) VALUES (
        v_project_id,
        'TL-PRJ-' || v_suffix,
        v_customer_id,
        'Tool Loan Local Test Project',
        'Commercial',
        'Approved',
        true,
        false
    );

    INSERT INTO public.project_sites (
        site_id,
        project_id,
        site_name,
        site_status,
        is_active,
        is_deleted
    ) VALUES (
        v_site_id,
        v_project_id,
        'Tool Loan Local Test Site',
        'Active',
        true,
        false
    );

    INSERT INTO public.project_areas (
        area_id,
        project_id,
        site_id,
        area_name,
        area_status,
        is_active,
        is_deleted
    ) VALUES (
        v_area_id,
        v_project_id,
        v_site_id,
        'Tool Loan Local Test Area',
        'Active',
        true,
        false
    );

    INSERT INTO public.units_of_measure (
        uom_code,
        uom_name,
        uom_symbol,
        uom_category,
        decimal_places,
        sort_order,
        is_active,
        is_deleted
    ) VALUES (
        'ea_' || lower(v_suffix),
        'Each Local ' || v_suffix,
        'ea',
        v_uom_category,
        0,
        9999,
        true,
        false
    );

    INSERT INTO public.product_categories (
        category_id,
        category_code,
        category_name,
        description,
        sort_order,
        is_active,
        is_deleted
    ) VALUES (
        v_category_id,
        'TL' || right(v_suffix, 10),
        'Local Tool Category ' || v_suffix,
        'Temporary local regression category',
        9999,
        true,
        false
    );

    INSERT INTO public.products (
        product_id,
        product_code,
        product_name,
        category_id,
        unit,
        product_type,
        base_uom_code,
        is_stock_item,
        is_service_item,
        is_active,
        is_deleted
    ) VALUES (
        v_product_id,
        'TL-TOOL-' || v_suffix,
        'Local Test Tool',
        v_category_id,
        'ea_' || lower(v_suffix),
        'Tool',
        'ea_' || lower(v_suffix),
        true,
        false,
        true,
        false
    );

    INSERT INTO public.stock_locations (
        stock_location_id,
        location_code,
        location_name,
        location_type,
        description,
        is_active,
        is_deleted
    ) VALUES (
        v_location_id,
        'TL-WH-' || v_suffix,
        'Tool Loan Local Warehouse',
        'Warehouse',
        'Temporary local regression warehouse',
        true,
        false
    );

    INSERT INTO public.stock_lots (
        stock_lot_id,
        lot_no,
        product_id,
        stock_location_id,
        base_uom_code,
        received_quantity,
        remaining_quantity,
        reserved_quantity,
        damaged_quantity,
        average_unit_cost,
        received_date,
        lot_status,
        notes,
        is_active,
        is_deleted
    ) VALUES (
        v_lot_id,
        'TL-LOT-' || v_suffix,
        v_product_id,
        v_location_id,
        'ea_' || lower(v_suffix),
        10,
        10,
        0,
        0,
        25.00,
        current_date,
        'Available',
        'Temporary local regression lot',
        true,
        false
    );

    INSERT INTO public.stock_requests (
        stock_request_id,
        stock_request_no,
        project_id,
        site_id,
        area_id,
        request_date,
        required_date,
        request_status,
        request_type,
        priority,
        requester_auth_user_id,
        requester_employee_id,
        requested_by,
        submitted_at,
        submitted_by,
        reviewed_at,
        reviewed_by,
        approved_at,
        approved_by,
        notes,
        is_deleted
    ) VALUES (
        v_request_id,
        '',
        v_project_id,
        v_site_id,
        v_area_id,
        current_date,
        current_date + 7,
        'Approved',
        'Tool',
        'Normal',
        v_auth_user_id,
        v_employee_id,
        v_auth_user_id,
        now(),
        v_auth_user_id,
        now(),
        v_auth_user_id,
        now(),
        v_auth_user_id,
        'Temporary local Tool Loan source request',
        false
    );

    INSERT INTO public.stock_request_items (
        stock_request_item_id,
        stock_request_id,
        product_id,
        line_no,
        description,
        unit_of_measure,
        requested_quantity,
        approved_quantity,
        request_uom_code,
        base_uom_code,
        conversion_factor_to_base,
        requested_base_quantity,
        approved_base_quantity,
        allow_fractional_quantity,
        request_line_type,
        fulfilment_method,
        line_status,
        requested_reason,
        is_deleted
    ) VALUES (
        v_request_item_id,
        v_request_id,
        v_product_id,
        1,
        'Local Test Tool',
        'ea_' || lower(v_suffix),
        2,
        2,
        'ea_' || lower(v_suffix),
        'ea_' || lower(v_suffix),
        1,
        2,
        2,
        false,
        'Tool',
        'Loan',
        'RoutedToToolLoan',
        'Local Tool Loan regression',
        false
    );

    SELECT public.create_tool_loan_atomic(
        jsonb_build_object(
            'stock_request_id', v_request_id,
            'from_stock_location_id', v_location_id,
            'borrower_employee_id', v_employee_id,
            'loan_date', current_date,
            'due_date', current_date + 14,
            'priority', 'High',
            'notes', 'Created by Local regression test'
        ),
        jsonb_build_array(
            jsonb_build_object(
                'stock_request_item_id', v_request_item_id,
                'approved_quantity', 2,
                'loan_uom_code', 'ea_' || lower(v_suffix),
                'asset_reference', 'LOCAL-ASSET-001',
                'serial_number', 'LOCAL-SERIAL-001',
                'description', 'Local Test Tool - Initial',
                'condition_before', 'Good',
                'condition_notes_before', 'Checked before preparation',
                'notes', 'Create test item'
            )
        )
    ) INTO v_tool_loan_id;

    SELECT loan_status INTO v_header_status
    FROM public.tool_loans
    WHERE tool_loan_id = v_tool_loan_id;

    IF v_header_status <> 'Draft' THEN
        RAISE EXCEPTION 'Create status mismatch: expected Draft, got %.', v_header_status;
    END IF;

    INSERT INTO tool_loan_test_results
    VALUES (2, 'create_tool_loan_atomic', 'PASS', 'Created Draft Tool Loan from approved Stock Request');

    PERFORM public.update_draft_tool_loan_atomic(
        v_tool_loan_id,
        jsonb_build_object(
            'from_stock_location_id', v_location_id,
            'borrower_employee_id', v_employee_id,
            'loan_date', current_date,
            'due_date', current_date + 21,
            'priority', 'Urgent',
            'notes', 'Updated by Local regression test'
        ),
        jsonb_build_array(
            jsonb_build_object(
                'stock_request_item_id', v_request_item_id,
                'approved_quantity', 2,
                'loan_uom_code', 'ea_' || lower(v_suffix),
                'asset_reference', 'LOCAL-ASSET-UPDATED',
                'serial_number', 'LOCAL-SERIAL-UPDATED',
                'description', 'Local Test Tool - Updated',
                'condition_before', 'Good',
                'condition_notes_before', 'Rechecked before preparation',
                'notes', 'Updated test item'
            )
        )
    );

    SELECT count(*) INTO v_active_item_count
    FROM public.tool_loan_items
    WHERE tool_loan_id = v_tool_loan_id
      AND is_deleted = false;

    SELECT count(*) INTO v_cancelled_old_item_count
    FROM public.tool_loan_items
    WHERE tool_loan_id = v_tool_loan_id
      AND is_deleted = true
      AND item_status = 'Cancelled';

    IF v_active_item_count <> 1 OR v_cancelled_old_item_count <> 1 THEN
        RAISE EXCEPTION
            'Update Draft item replacement mismatch: active %, archived %.',
            v_active_item_count,
            v_cancelled_old_item_count;
    END IF;

    INSERT INTO tool_loan_test_results
    VALUES (3, 'update_draft_tool_loan_atomic', 'PASS', 'Replaced active item and preserved soft-deleted history');

    PERFORM public.submit_tool_loan_atomic(v_tool_loan_id, 'Submitted locally');

    SELECT loan_status INTO v_header_status
    FROM public.tool_loans
    WHERE tool_loan_id = v_tool_loan_id;

    IF v_header_status <> 'Submitted' THEN
        RAISE EXCEPTION 'Submit status mismatch: %.', v_header_status;
    END IF;

    INSERT INTO tool_loan_test_results
    VALUES (4, 'submit_tool_loan_atomic', 'PASS', 'Draft transitioned to Submitted');

    PERFORM public.approve_tool_loan_atomic(v_tool_loan_id, 'Approved locally');

    SELECT loan_status INTO v_header_status
    FROM public.tool_loans
    WHERE tool_loan_id = v_tool_loan_id;

    IF v_header_status <> 'Approved' THEN
        RAISE EXCEPTION 'Approve status mismatch: %.', v_header_status;
    END IF;

    INSERT INTO tool_loan_test_results
    VALUES (5, 'approve_tool_loan_atomic', 'PASS', 'Submitted transitioned to Approved');

    PERFORM public.prepare_tool_loan_atomic(v_tool_loan_id, 'Prepared locally');

    SELECT loan_status INTO v_header_status
    FROM public.tool_loans
    WHERE tool_loan_id = v_tool_loan_id;

    SELECT tool_loan_item_id, item_status
    INTO v_tool_loan_item_id, v_item_status
    FROM public.tool_loan_items
    WHERE tool_loan_id = v_tool_loan_id
      AND is_deleted = false;

    IF v_header_status <> 'Prepared' OR v_item_status <> 'Prepared' THEN
        RAISE EXCEPTION
            'Prepare status mismatch: header %, item %.',
            v_header_status,
            v_item_status;
    END IF;

    INSERT INTO tool_loan_test_results
    VALUES (6, 'prepare_tool_loan_atomic', 'PASS', 'Approved transitioned to Prepared with Condition Before');

    -- Verify atomic validation: a partial allocation must fail without stock mutation.
    SELECT remaining_quantity INTO v_before_remaining
    FROM public.stock_lots
    WHERE stock_lot_id = v_lot_id;

    BEGIN
        PERFORM public.issue_tool_loan_atomic(
            v_tool_loan_id,
            jsonb_build_array(
                jsonb_build_object(
                    'tool_loan_item_id', v_tool_loan_item_id,
                    'stock_lot_id', v_lot_id,
                    'issue_base_quantity', 1
                )
            ),
            'Intentional partial allocation failure'
        );
    EXCEPTION WHEN OTHERS THEN
        IF position('B1 requires full issue' IN SQLERRM) > 0 THEN
            v_bad_allocation_blocked := true;
        ELSE
            RAISE;
        END IF;
    END;

    SELECT remaining_quantity INTO v_after_remaining
    FROM public.stock_lots
    WHERE stock_lot_id = v_lot_id;

    IF NOT v_bad_allocation_blocked OR v_after_remaining <> v_before_remaining THEN
        RAISE EXCEPTION
            'Partial allocation rollback failed: blocked %, before %, after %.',
            v_bad_allocation_blocked,
            v_before_remaining,
            v_after_remaining;
    END IF;

    INSERT INTO tool_loan_test_results
    VALUES (7, 'issue_validation_atomicity', 'PASS', 'Partial allocation rejected with no stock mutation');

    PERFORM public.issue_tool_loan_atomic(
        v_tool_loan_id,
        jsonb_build_array(
            jsonb_build_object(
                'tool_loan_item_id', v_tool_loan_item_id,
                'stock_lot_id', v_lot_id,
                'issue_base_quantity', 2
            )
        ),
        'Issued locally'
    );

    SELECT remaining_quantity INTO v_after_remaining
    FROM public.stock_lots
    WHERE stock_lot_id = v_lot_id;

    SELECT loan_status INTO v_header_status
    FROM public.tool_loans
    WHERE tool_loan_id = v_tool_loan_id;

    SELECT item_status INTO v_item_status
    FROM public.tool_loan_items
    WHERE tool_loan_item_id = v_tool_loan_item_id;

    SELECT count(*) INTO v_posting_count
    FROM public.tool_loan_issue_postings
    WHERE tool_loan_id = v_tool_loan_id
      AND is_deleted = false;

    SELECT count(*) INTO v_movement_count
    FROM public.stock_movements
    WHERE reference_no = (
        SELECT tool_loan_no
        FROM public.tool_loans
        WHERE tool_loan_id = v_tool_loan_id
    )
      AND movement_type = 'Issue'
      AND reason = 'Tool Loan Issue'
      AND is_deleted = false;

    IF v_after_remaining <> 8
       OR v_header_status <> 'Issued'
       OR v_item_status <> 'Issued'
       OR v_posting_count <> 1
       OR v_movement_count <> 1 THEN
        RAISE EXCEPTION
            'Issue result mismatch: remaining %, header %, item %, postings %, movements %.',
            v_after_remaining,
            v_header_status,
            v_item_status,
            v_posting_count,
            v_movement_count;
    END IF;

    INSERT INTO tool_loan_test_results
    VALUES (8, 'issue_tool_loan_atomic', 'PASS', 'Stock deducted; movement and posting created; statuses Issued');

    BEGIN
        PERFORM public.issue_tool_loan_atomic(
            v_tool_loan_id,
            jsonb_build_array(
                jsonb_build_object(
                    'tool_loan_item_id', v_tool_loan_item_id,
                    'stock_lot_id', v_lot_id,
                    'issue_base_quantity', 2
                )
            ),
            'Intentional duplicate issue failure'
        );
    EXCEPTION WHEN OTHERS THEN
        IF position('Only Prepared Tool Loans can be issued' IN SQLERRM) > 0
           OR position('already has active issue postings' IN SQLERRM) > 0 THEN
            v_duplicate_blocked := true;
        ELSE
            RAISE;
        END IF;
    END;

    SELECT remaining_quantity INTO v_before_remaining
    FROM public.stock_lots
    WHERE stock_lot_id = v_lot_id;

    SELECT count(*) INTO v_posting_count
    FROM public.tool_loan_issue_postings
    WHERE tool_loan_id = v_tool_loan_id
      AND is_deleted = false;

    IF NOT v_duplicate_blocked
       OR v_before_remaining <> 8
       OR v_posting_count <> 1 THEN
        RAISE EXCEPTION
            'Duplicate issue protection failed: blocked %, remaining %, postings %.',
            v_duplicate_blocked,
            v_before_remaining,
            v_posting_count;
    END IF;

    INSERT INTO tool_loan_test_results
    VALUES (9, 'duplicate_issue_protection', 'PASS', 'Second issue rejected with no extra stock movement/posting');
END;
$test$;

SELECT test_name, test_result, detail
FROM tool_loan_test_results
ORDER BY test_order;

SELECT
    count(*) FILTER (WHERE test_result = 'PASS') AS pass_count,
    count(*) FILTER (WHERE test_result <> 'PASS') AS fail_count
FROM tool_loan_test_results;

ROLLBACK;
