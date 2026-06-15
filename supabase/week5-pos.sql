grant select, insert on public.sales to authenticated;
grant select, insert on public.sale_items to authenticated;
grant select, insert on public.stock_movements to authenticated;

alter table public.sales add column if not exists paid_amount numeric(12, 2) not null default 0 check (paid_amount >= 0);
alter table public.sales add column if not exists customer_phone text;

drop policy if exists sales_seller_select on public.sales;
create policy sales_seller_select
on public.sales
for select
to authenticated
using (seller_id = auth.uid() or public.current_role() = 'gerant');

drop policy if exists sales_seller_insert on public.sales;
create policy sales_seller_insert
on public.sales
for insert
to authenticated
with check (seller_id = auth.uid() or public.current_role() = 'gerant');

drop policy if exists sale_items_select_by_sale on public.sale_items;
create policy sale_items_select_by_sale
on public.sale_items
for select
to authenticated
using (
  exists (
    select 1
    from public.sales s
    where s.id = sale_id
    and (s.seller_id = auth.uid() or public.current_role() = 'gerant')
  )
);

drop policy if exists sale_items_insert_by_sale on public.sale_items;
create policy sale_items_insert_by_sale
on public.sale_items
for insert
to authenticated
with check (
  exists (
    select 1
    from public.sales s
    where s.id = sale_id
    and (s.seller_id = auth.uid() or public.current_role() = 'gerant')
  )
);

drop policy if exists stock_seller_insert_sale on public.stock_movements;
create policy stock_seller_insert_sale
on public.stock_movements
for insert
to authenticated
with check (created_by = auth.uid() or public.current_role() = 'gerant');
