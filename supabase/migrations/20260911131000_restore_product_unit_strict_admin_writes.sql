-- Keep the existing product-master authorization model after enabling RLS.
-- Browser users may read active product units; only strict admins may write.
ALTER TABLE public.product_units ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.product_units FROM anon;
GRANT SELECT, INSERT, UPDATE, DELETE ON TABLE public.product_units TO authenticated;

DROP POLICY IF EXISTS product_units_delete_strict_admin ON public.product_units;
DROP POLICY IF EXISTS product_units_insert_strict_admin ON public.product_units;
DROP POLICY IF EXISTS product_units_select_authenticated ON public.product_units;
DROP POLICY IF EXISTS product_units_update_strict_admin ON public.product_units;

CREATE POLICY product_units_delete_strict_admin
  ON public.product_units
  FOR DELETE
  TO authenticated
  USING (public.is_strict_admin_role());

CREATE POLICY product_units_insert_strict_admin
  ON public.product_units
  FOR INSERT
  TO authenticated
  WITH CHECK (public.is_strict_admin_role());

CREATE POLICY product_units_select_authenticated
  ON public.product_units
  FOR SELECT
  TO authenticated
  USING (is_deleted = false);

CREATE POLICY product_units_update_strict_admin
  ON public.product_units
  FOR UPDATE
  TO authenticated
  USING (public.is_strict_admin_role())
  WITH CHECK (public.is_strict_admin_role());
