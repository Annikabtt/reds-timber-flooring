-- REDS Timber Flooring
-- Security Advisor hardening: SECURITY DEFINER functions must not be callable
-- by unauthenticated API clients.
--
-- This first-stage hardening intentionally preserves the existing signed-in
-- and service-role execution contract. A later, function-by-function audit can
-- further restrict helper functions without breaking application RPC calls.

begin;

do $block$
declare
    v_function record;
begin
    for v_function in
        select p.oid::regprocedure as function_signature
        from pg_proc p
        join pg_namespace n
          on n.oid = p.pronamespace
        where n.nspname = 'public'
          and p.prosecdef
          and has_function_privilege('anon', p.oid, 'EXECUTE')
        order by p.oid::regprocedure::text
    loop
        -- PUBLIC privileges are inherited by anon, so both grants must be
        -- removed. Explicit authenticated/service_role grants preserve the
        -- access those roles had previously inherited through PUBLIC.
        execute format(
            'revoke execute on function %s from public',
            v_function.function_signature
        );

        execute format(
            'revoke execute on function %s from anon',
            v_function.function_signature
        );

        execute format(
            'grant execute on function %s to authenticated',
            v_function.function_signature
        );

        execute format(
            'grant execute on function %s to service_role',
            v_function.function_signature
        );
    end loop;
end
$block$;

do $assertion$
declare
    v_remaining_count integer;
begin
    select count(*)
      into v_remaining_count
    from pg_proc p
    join pg_namespace n
      on n.oid = p.pronamespace
    where n.nspname = 'public'
      and p.prosecdef
      and has_function_privilege('anon', p.oid, 'EXECUTE');

    if v_remaining_count <> 0 then
        raise exception
            'Anonymous SECURITY DEFINER hardening failed: % callable functions remain.',
            v_remaining_count;
    end if;
end
$assertion$;

commit;
