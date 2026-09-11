-- Prevent Supabase client roles from reading or modifying document counters.
-- Document numbers are generated only by the SECURITY DEFINER RPC.
ALTER TABLE public.document_sequences ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.document_sequences FROM anon, authenticated;

-- Product units are reference data used by several authenticated product and
-- transaction screens. Product changes themselves remain atomic RPC operations.
ALTER TABLE public.product_units ENABLE ROW LEVEL SECURITY;

REVOKE ALL ON TABLE public.product_units FROM anon, authenticated;
GRANT SELECT ON TABLE public.product_units TO authenticated;

DROP POLICY IF EXISTS product_units_select_authenticated ON public.product_units;

CREATE POLICY product_units_select_authenticated
  ON public.product_units
  FOR SELECT
  TO authenticated
  USING (is_deleted = false);
