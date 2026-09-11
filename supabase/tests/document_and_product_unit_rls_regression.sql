BEGIN;

DO $$
DECLARE
  v_rls_enabled boolean;
  v_product_unit_read_policy boolean;
  v_document_client_privileges boolean;
  v_product_unit_policies boolean;
  v_product_unit_read_grant boolean;
  v_document_number_rpc_is_definer boolean;
BEGIN
  SELECT c.relrowsecurity
    INTO v_rls_enabled
    FROM pg_class AS c
    JOIN pg_namespace AS n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relname = 'document_sequences';

  IF v_rls_enabled IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'document_sequences must have RLS enabled';
  END IF;

  SELECT c.relrowsecurity
    INTO v_rls_enabled
    FROM pg_class AS c
    JOIN pg_namespace AS n ON n.oid = c.relnamespace
   WHERE n.nspname = 'public'
     AND c.relname = 'product_units';

  IF v_rls_enabled IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'product_units must have RLS enabled';
  END IF;

  SELECT EXISTS (
    SELECT 1
      FROM pg_policies
     WHERE schemaname = 'public'
       AND tablename = 'product_units'
       AND policyname = 'product_units_select_authenticated'
       AND cmd = 'SELECT'
       AND roles = ARRAY['authenticated']::name[]
       AND qual = '(is_deleted = false)'
  ) INTO v_product_unit_read_policy;

  IF NOT v_product_unit_read_policy THEN
    RAISE EXCEPTION 'product_units authenticated read policy is missing or changed';
  END IF;

  SELECT EXISTS (
    SELECT 1
      FROM information_schema.role_table_grants
     WHERE table_schema = 'public'
       AND table_name = 'document_sequences'
       AND grantee IN ('anon', 'authenticated')
  ) INTO v_document_client_privileges;

  IF v_document_client_privileges THEN
    RAISE EXCEPTION 'document_sequences must not grant client table privileges';
  END IF;

  SELECT count(*) = 4
    INTO v_product_unit_policies
    FROM pg_policies
   WHERE schemaname = 'public'
     AND tablename = 'product_units'
     AND policyname IN (
       'product_units_delete_strict_admin',
       'product_units_insert_strict_admin',
       'product_units_select_authenticated',
       'product_units_update_strict_admin'
     );

  IF NOT v_product_unit_policies THEN
    RAISE EXCEPTION 'product_units must retain its strict-admin write policies';
  END IF;

  SELECT has_table_privilege('authenticated', 'public.product_units', 'SELECT')
    INTO v_product_unit_read_grant;

  IF NOT v_product_unit_read_grant THEN
    RAISE EXCEPTION 'authenticated users must retain product_units read access';
  END IF;

  SELECT p.prosecdef
    INTO v_document_number_rpc_is_definer
    FROM pg_proc AS p
    JOIN pg_namespace AS n ON n.oid = p.pronamespace
   WHERE n.nspname = 'public'
     AND p.proname = 'generate_document_number'
     AND pg_get_function_identity_arguments(p.oid) = 'p_document_type text, p_prefix text, p_reset_monthly boolean';

  IF v_document_number_rpc_is_definer IS DISTINCT FROM true THEN
    RAISE EXCEPTION 'generate_document_number must remain SECURITY DEFINER';
  END IF;
END;
$$;

ROLLBACK;
