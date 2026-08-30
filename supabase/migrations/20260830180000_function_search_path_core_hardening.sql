-- First mutable-search-path hardening batch: shared role helpers, document
-- number triggers and the ubiquitous updated_at trigger.

begin;

alter function public.current_app_role()
    set search_path = public, pg_temp;

alter function public.generate_document_number(text, text, boolean)
    set search_path = public, pg_temp;

alter function public.generate_employee_code()
    set search_path = public, pg_temp;

alter function public.generate_work_order_no(timestamptz)
    set search_path = public, pg_temp;

alter function public.is_admin_role()
    set search_path = public, pg_temp;

alter function public.is_payroll_role()
    set search_path = public, pg_temp;

alter function public.is_project_role()
    set search_path = public, pg_temp;

alter function public.set_customer_invoice_no()
    set search_path = public, pg_temp;

alter function public.set_customer_payment_no()
    set search_path = public, pg_temp;

alter function public.set_employee_code()
    set search_path = public, pg_temp;

alter function public.set_payroll_payment_no()
    set search_path = public, pg_temp;

alter function public.set_payroll_period_no()
    set search_path = public, pg_temp;

alter function public.set_purchase_order_no()
    set search_path = public, pg_temp;

alter function public.set_stock_request_no()
    set search_path = public, pg_temp;

alter function public.set_supplier_delivery_no()
    set search_path = public, pg_temp;

alter function public.set_work_order_no()
    set search_path = public, pg_temp;

alter function public.set_updated_at()
    set search_path = public, pg_temp;

commit;
