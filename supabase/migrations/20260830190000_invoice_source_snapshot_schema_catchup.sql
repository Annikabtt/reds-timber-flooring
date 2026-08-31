-- Catch up local and newly rebuilt databases with the commercial source
-- snapshot columns already present in the hosted schema and generated types.

begin;

alter table public.quotations
    add column if not exists payment_terms_type_snapshot text,
    add column if not exists payment_terms_days_snapshot integer;

alter table public.quotation_revisions
    add column if not exists payment_terms_type_snapshot text,
    add column if not exists payment_terms_days_snapshot integer;

alter table public.variations
    add column if not exists price_book_id uuid,
    add column if not exists payment_terms_type_snapshot text,
    add column if not exists payment_terms_days_snapshot integer;

comment on column public.quotations.payment_terms_type_snapshot is
    'Payment terms type captured for the accepted Quotation commercial snapshot.';

comment on column public.quotations.payment_terms_days_snapshot is
    'Payment terms day count captured for the accepted Quotation commercial snapshot.';

comment on column public.quotation_revisions.payment_terms_type_snapshot is
    'Payment terms type captured for the immutable Quotation Revision snapshot.';

comment on column public.quotation_revisions.payment_terms_days_snapshot is
    'Payment terms day count captured for the immutable Quotation Revision snapshot.';

comment on column public.variations.price_book_id is
    'Price Book captured for the accepted Variation commercial snapshot.';

comment on column public.variations.payment_terms_type_snapshot is
    'Payment terms type captured for the accepted Variation commercial snapshot.';

comment on column public.variations.payment_terms_days_snapshot is
    'Payment terms day count captured for the accepted Variation commercial snapshot.';

do $block$
begin
    if not exists (
        select 1
        from pg_constraint constraint_row
        where constraint_row.contype = 'f'
          and constraint_row.conrelid = 'public.variations'::regclass
          and constraint_row.confrelid = 'public.price_books'::regclass
          and constraint_row.conkey = array[
              (
                  select attribute_row.attnum
                  from pg_attribute attribute_row
                  where attribute_row.attrelid = 'public.variations'::regclass
                    and attribute_row.attname = 'price_book_id'
                    and not attribute_row.attisdropped
              )
          ]::smallint[]
          and constraint_row.confkey = array[
              (
                  select attribute_row.attnum
                  from pg_attribute attribute_row
                  where attribute_row.attrelid = 'public.price_books'::regclass
                    and attribute_row.attname = 'price_book_id'
                    and not attribute_row.attisdropped
              )
          ]::smallint[]
    ) then
        alter table public.variations
            add constraint variations_price_book_id_fkey
            foreign key (price_book_id)
            references public.price_books(price_book_id)
            on delete restrict;
    end if;
end
$block$;

commit;
