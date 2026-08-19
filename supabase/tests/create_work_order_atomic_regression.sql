begin;

do $test$
declare
    -- ========================================================
    -- REDS Timber Flooring
    -- create_work_order_atomic self-contained local regression
    --
    -- All auth, permission and business fixtures are temporary.
    -- Final ROLLBACK removes everything created by this test.
    -- ========================================================

    v_actor_id uuid := 'c09ab12d-d8ea-48f1-bcdd-e43f66644497';
    v_actor_email text := 'work-order-regression@reds.local';
    v_run_token text := upper(substr(replace(gen_random_uuid()::text, '-', ''), 1, 10));

    v_customer_id uuid;
    v_project_id uuid;
    v_site_id uuid;
    v_area_id uuid;
    v_work_order_type_id uuid;
    v_work_order_scope_id uuid;
    v_employee_id uuid;
    v_activity_type_id uuid;

    v_success_result jsonb;
    v_success_work_order_id uuid;

    v_failure_marker text :=
        'REGRESSION_ATOMIC_ROLLBACK_' ||
        replace(gen_random_uuid()::text, '-', '');

    v_success_marker text :=
        'REGRESSION_ATOMIC_SUCCESS_' ||
        replace(gen_random_uuid()::text, '-', '');

    v_count integer;
    v_assignment_count integer;
    v_expected_failure boolean := false;
begin
    -- ========================================================
    -- 0. Temporary Auth identity
    -- ========================================================

    insert into auth.users (
        id,
        aud,
        role,
        email,
        email_confirmed_at,
        raw_app_meta_data,
        raw_user_meta_data,
        created_at,
        updated_at,
        is_sso_user,
        is_anonymous
    )
    values (
        v_actor_id,
        'authenticated',
        'authenticated',
        v_actor_email,
        now(),
        '{"provider":"email","providers":["email"]}'::jsonb,
        '{}'::jsonb,
        now(),
        now(),
        false,
        false
    );

    insert into public.app_users (
        auth_user_id,
        email,
        display_name,
        account_status,
        approved_at
    )
    values (
        v_actor_id,
        v_actor_email,
        'Work Order Regression User',
        'Active',
        now()
    );

    -- ========================================================
    -- 1. Temporary permission overrides
    -- ========================================================

    insert into public.app_user_permission_overrides (
        auth_user_id,
        permission_id,
        is_allowed,
        reason,
        is_active
    )
    select
        v_actor_id,
        p.permission_id,
        true,
        'Temporary Work Order atomic regression',
        true
    from public.app_permissions p
    where p.permission_code in (
        'work_orders.view',
        'work_orders.create',
        'work_orders.update',
        'work_orders.assign_worker',
        'work_orders.reassign_worker',
        'work_orders.view_commercial_source',
        'work_orders.allocate_commercial_scope',
        'work_orders.release_commercial_scope',
        'work_orders.cancel'
    )
      and p.is_active = true;

    select count(*)
    into v_count
    from public.app_user_permission_overrides upo
    join public.app_permissions p
      on p.permission_id = upo.permission_id
    where upo.auth_user_id = v_actor_id
      and upo.is_allowed = true
      and upo.is_active = true
      and p.permission_code in (
          'work_orders.view',
          'work_orders.create',
          'work_orders.update',
          'work_orders.assign_worker',
          'work_orders.reassign_worker',
          'work_orders.view_commercial_source',
          'work_orders.allocate_commercial_scope',
          'work_orders.release_commercial_scope',
          'work_orders.cancel'
      );

    if v_count <> 9 then
        raise exception
            'TEST SETUP FAILED: expected 9 Work Order permission overrides, found %',
            v_count;
    end if;

    perform set_config('request.jwt.claim.sub', v_actor_id::text, true);
    perform set_config('request.jwt.claim.role', 'authenticated', true);

    if not public.has_permission('work_orders.view') then
        raise exception 'PRECHECK FAILED: work_orders.view was not granted';
    end if;

    if not public.has_permission('work_orders.create') then
        raise exception 'PRECHECK FAILED: work_orders.create was not granted';
    end if;

    if not public.has_permission('work_orders.assign_worker') then
        raise exception 'PRECHECK FAILED: work_orders.assign_worker was not granted';
    end if;

    if not public.has_permission('work_orders.allocate_commercial_scope') then
        raise exception 'PRECHECK FAILED: work_orders.allocate_commercial_scope was not granted';
    end if;

    raise notice 'PERMISSION PRECHECK PASS';

    -- ========================================================
    -- 2. Temporary business fixtures
    -- Local db reset contains schema only, so create every
    -- dependency required by Manual WO + Worker Assignment.
    -- ========================================================

    insert into public.units_of_measure (
        uom_code,
        uom_name,
        uom_symbol,
        uom_category,
        decimal_places,
        description,
        sort_order,
        is_active,
        is_deleted
    )
    values (
        'sqm',
        'Square Metre',
        'sqm',
        'Area',
        2,
        'Temporary regression UOM',
        10,
        true,
        false
    );

    insert into public.customers (
        customer_name,
        customer_type,
        email,
        notes,
        is_active,
        is_deleted
    )
    values (
        'WO Regression Customer ' || v_run_token,
        'Residential',
        'wo-regression-customer-' || lower(v_run_token) || '@reds.local',
        'Temporary create_work_order_atomic regression fixture',
        true,
        false
    )
    returning customer_id
    into v_customer_id;

    insert into public.projects (
        project_no,
        customer_id,
        project_name,
        project_type,
        project_status,
        contract_value,
        notes,
        is_active,
        is_deleted
    )
    values (
        'TST-' || v_run_token,
        v_customer_id,
        'WO Regression Project ' || v_run_token,
        'Residential',
        'Approved',
        0,
        'Temporary create_work_order_atomic regression fixture',
        true,
        false
    )
    returning project_id
    into v_project_id;

    insert into public.project_sites (
        project_id,
        site_name,
        country,
        site_status,
        contract_value,
        notes,
        is_active,
        is_deleted
    )
    values (
        v_project_id,
        'WO Regression Site ' || v_run_token,
        'Australia',
        'Active',
        0,
        'Temporary create_work_order_atomic regression fixture',
        true,
        false
    )
    returning site_id
    into v_site_id;

    insert into public.project_areas (
        project_id,
        site_id,
        area_name,
        estimated_quantity,
        unit_of_measure,
        notes,
        area_status,
        is_active,
        is_deleted
    )
    values (
        v_project_id,
        v_site_id,
        'WO Regression Area ' || v_run_token,
        100,
        'sqm',
        'Temporary create_work_order_atomic regression fixture',
        'Active',
        true,
        false
    )
    returning area_id
    into v_area_id;

    insert into public.work_order_types (
        work_order_type_code,
        work_order_type_name,
        description,
        sort_order,
        is_active,
        is_deleted
    )
    values (
        'TST' || substr(v_run_token, 1, 7),
        'Regression Work Order Type ' || v_run_token,
        'Temporary create_work_order_atomic regression fixture',
        9990,
        true,
        false
    )
    returning work_order_type_id
    into v_work_order_type_id;

    insert into public.work_order_scopes (
        work_order_type_id,
        work_order_scope_code,
        work_order_scope_name,
        description,
        sort_order,
        is_active,
        is_deleted
    )
    values (
        v_work_order_type_id,
        'TSC' || substr(v_run_token, 1, 7),
        'Regression Work Scope ' || v_run_token,
        'Temporary create_work_order_atomic regression fixture',
        9990,
        true,
        false
    )
    returning work_order_scope_id
    into v_work_order_scope_id;

    insert into public.employees (
        first_name,
        last_name,
        display_name,
        email,
        employment_type,
        start_date,
        is_active,
        is_deleted
    )
    values (
        'Regression',
        'Worker',
        'Regression Worker ' || v_run_token,
        'wo-regression-worker-' || lower(v_run_token) || '@reds.local',
        'Full Time',
        current_date,
        true,
        false
    )
    returning employee_id
    into v_employee_id;

    insert into public.work_activity_types (
        activity_code,
        activity_name,
        description,
        is_active,
        sort_order,
        is_deleted,
        counts_toward_progress
    )
    values (
        'TAC' || substr(v_run_token, 1, 7),
        'Regression Activity ' || v_run_token,
        'Temporary create_work_order_atomic regression fixture',
        true,
        9990,
        false,
        true
    )
    returning activity_type_id
    into v_activity_type_id;

    raise notice
        'FIXTURE PRECHECK PASS | customer=% | project=% | site=% | area=% | employee=% | activity=%',
        v_customer_id,
        v_project_id,
        v_site_id,
        v_area_id,
        v_employee_id,
        v_activity_type_id;

    -- ========================================================
    -- TEST A
    -- OperationalManual + one initial Worker Assignment.
    -- ========================================================

    v_success_result :=
        public.create_work_order_atomic(
            jsonb_build_object(
                'project_id', v_project_id,
                'site_id', v_site_id,
                'area_id', v_area_id,
                'work_order_type_id', v_work_order_type_id,
                'work_order_scope_id', v_work_order_scope_id,
                'commercial_mode', 'OperationalManual',
                'priority', 'Normal',
                'planned_start_date', current_date,
                'planned_end_date', current_date + 1,
                'description', 'Atomic create regression success',
                'notes', v_success_marker
            ),
            '[]'::jsonb,
            jsonb_build_array(
                jsonb_build_object(
                    'employee_id', v_employee_id,
                    'activity_type_id', v_activity_type_id,
                    'assigned_quantity', 5,
                    'assigned_uom_code', 'sqm',
                    'notes', 'Atomic regression initial worker'
                )
            )
        );

    v_success_work_order_id :=
        (v_success_result->>'work_order_id')::uuid;

    if v_success_work_order_id is null then
        raise exception 'TEST A FAILED: RPC returned no work_order_id';
    end if;

    select count(*)
    into v_count
    from public.work_orders wo
    where wo.work_order_id = v_success_work_order_id
      and wo.is_deleted = false
      and wo.commercial_mode = 'OperationalManual';

    if v_count <> 1 then
        raise exception 'TEST A FAILED: Work Order was not created correctly';
    end if;

    select count(*)
    into v_assignment_count
    from public.work_assignments wa
    where wa.work_order_id = v_success_work_order_id;

    if v_assignment_count <> 1 then
        raise exception
            'TEST A FAILED: expected 1 worker assignment, found %',
            v_assignment_count;
    end if;

    raise notice
        'TEST A PASS | Manual WO + initial worker assignment | work_order_id=%',
        v_success_work_order_id;

    -- ========================================================
    -- TEST B
    -- Force assignment failure after WO creation starts.
    -- The nested block is a PostgreSQL subtransaction.
    -- No Work Order from this failed call may survive.
    -- ========================================================

    begin
        perform public.create_work_order_atomic(
            jsonb_build_object(
                'project_id', v_project_id,
                'site_id', v_site_id,
                'area_id', v_area_id,
                'work_order_type_id', v_work_order_type_id,
                'work_order_scope_id', v_work_order_scope_id,
                'commercial_mode', 'OperationalManual',
                'priority', 'Normal',
                'planned_start_date', current_date,
                'planned_end_date', current_date + 1,
                'description', 'Atomic rollback regression',
                'notes', v_failure_marker
            ),
            '[]'::jsonb,
            jsonb_build_array(
                jsonb_build_object(
                    'employee_id',
                    '00000000-0000-0000-0000-000000000001',
                    'activity_type_id',
                    v_activity_type_id,
                    'assigned_quantity',
                    5,
                    'assigned_uom_code',
                    'sqm',
                    'notes',
                    'THIS ASSIGNMENT MUST FAIL'
                )
            )
        );

        raise exception
            'TEST B FAILED: invalid worker assignment was unexpectedly accepted';

    exception
        when others then
            if sqlerrm like 'TEST B FAILED:%' then
                raise;
            end if;

            v_expected_failure := true;

            raise notice
                'TEST B expected rejection captured: %',
                sqlerrm;
    end;

    if not v_expected_failure then
        raise exception 'TEST B FAILED: expected failure was not captured';
    end if;

    select count(*)
    into v_count
    from public.work_orders wo
    where wo.notes = v_failure_marker;

    if v_count <> 0 then
        raise exception
            'TEST B FAILED: failed atomic call left % Work Order row(s)',
            v_count;
    end if;

    raise notice
        'TEST B PASS | failed assignment rolled back complete Work Order';

    -- ========================================================
    -- TEST C
    -- OperationalManual must never create commercial allocation.
    -- ========================================================

    select count(*)
    into v_count
    from public.work_order_commercial_allocations woca
    where woca.work_order_id = v_success_work_order_id;

    if v_count <> 0 then
        raise exception
            'TEST C FAILED: OperationalManual Work Order created % commercial allocation(s)',
            v_count;
    end if;

    raise notice
        'TEST C PASS | OperationalManual created no commercial allocations';

    -- ========================================================
    -- FINAL
    -- ========================================================

    raise notice '============================================================';
    raise notice 'CREATE_WORK_ORDER_ATOMIC REGRESSION: PASS';
    raise notice 'TEST A: Manual WO + initial worker assignment = PASS';
    raise notice 'TEST B: Forced worker failure + complete rollback = PASS';
    raise notice 'TEST C: Manual WO has no commercial allocation = PASS';
    raise notice 'All temporary auth/permission/business/test data will ROLLBACK';
    raise notice '============================================================';
end;
$test$;

rollback;