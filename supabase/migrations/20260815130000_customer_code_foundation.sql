-- ============================================================
-- REDS Timber Flooring
-- CUSTOMER CODE FOUNDATION
-- Locked rule:
--   CUS-######, database-generated, immutable, never reset.
--   Existing customer codes are retained unchanged.
-- ============================================================

begin;

-- ------------------------------------------------------------
-- 1. PRECHECK
-- ------------------------------------------------------------
do $precheck$
begin
    if to_regclass('public.customers') is null then
        raise exception 'CUSTOMER CODE PRECHECK FAILED: public.customers is missing.';
    end if;

    if not exists (
        select 1
        from information_schema.columns
        where table_schema = 'public'
          and table_name = 'customers'
          and column_name = 'customer_code'
          and data_type = 'text'
          and is_nullable = 'NO'
    ) then
        raise exception
            'CUSTOMER CODE PRECHECK FAILED: customers.customer_code must exist as NOT NULL text.';
    end if;

    if not exists (
        select 1
        from pg_constraint c
        join pg_class t on t.oid = c.conrelid
        join pg_namespace n on n.oid = t.relnamespace
        where n.nspname = 'public'
          and t.relname = 'customers'
          and c.contype = 'u'
          and pg_get_constraintdef(c.oid) = 'UNIQUE (customer_code)'
    ) then
        raise exception
            'CUSTOMER CODE PRECHECK FAILED: UNIQUE(customer_code) is missing.';
    end if;
end;
$precheck$;

-- ------------------------------------------------------------
-- 2. DEDICATED NEVER-RESET SEQUENCE
-- ------------------------------------------------------------
create sequence if not exists public.customer_code_sequence
    as bigint
    increment by 1
    minvalue 1
    maxvalue 999999
    start with 1
    no cycle;

-- ------------------------------------------------------------
-- 3. AUTHORITATIVE GENERATOR
--    Existing legacy CUS codes are not renumbered.
--    If a generated number already exists, advance and skip it.
-- ------------------------------------------------------------
create or replace function public.generate_customer_code()
returns text
language plpgsql
security definer
set search_path = public, pg_temp
as $function$
declare
    v_number bigint;
    v_code text;
begin
    loop
        v_number := nextval('public.customer_code_sequence');

        if v_number > 999999 then
            raise exception
                'Customer Code range exhausted. Maximum supported code is CUS-999999.';
        end if;

        v_code := 'CUS-' || lpad(v_number::text, 6, '0');

        exit when not exists (
            select 1
            from public.customers c
            where c.customer_code = v_code
        );
    end loop;

    return v_code;
end;
$function$;

revoke all on function public.generate_customer_code() from anon;
grant execute on function public.generate_customer_code() to authenticated;

-- The default makes customer_code optional for inserts generated from the
-- database schema while keeping the column NOT NULL.
alter table public.customers
    alter column customer_code
    set default public.generate_customer_code();

comment on column public.customers.customer_code is
'Permanent REDS customer identifier. New application customers use database-generated CUS-###### codes. Existing codes are retained.';

comment on function public.generate_customer_code() is
'Generates the next permanent never-reset CUS-###### Customer Code and skips any existing legacy collision.';

-- ------------------------------------------------------------
-- 4. IMMUTABILITY
-- ------------------------------------------------------------
create or replace function public.prevent_customer_code_change()
returns trigger
language plpgsql
set search_path = public, pg_temp
as $function$
begin
    if new.customer_code is distinct from old.customer_code then
        raise exception
            'Customer Code cannot be changed after the customer is created.';
    end if;

    return new;
end;
$function$;

drop trigger if exists trg_prevent_customer_code_change on public.customers;

create trigger trg_prevent_customer_code_change
before update on public.customers
for each row
execute function public.prevent_customer_code_change();

comment on function public.prevent_customer_code_change() is
'Prevents mutation of the permanent REDS Customer Code.';

commit;
