alter table public.sales add column if not exists paid_amount numeric(12, 2) not null default 0 check (paid_amount >= 0);
alter table public.sales add column if not exists customer_phone text;

alter type public.custom_order_status add value if not exists 'paid';

grant usage on schema public to authenticated;
grant select, insert on public.sales to authenticated;
grant select, insert on public.sale_items to authenticated;
grant select, insert on public.stock_movements to authenticated;
grant select, insert, update, delete on public.custom_orders to authenticated;

alter table public.custom_orders enable row level security;

drop policy if exists custom_orders_read_all on public.custom_orders;
create policy custom_orders_read_all
on public.custom_orders
for select
to authenticated
using (true);

drop policy if exists custom_orders_insert_authenticated on public.custom_orders;
create policy custom_orders_insert_authenticated
on public.custom_orders
for insert
to authenticated
with check (created_by = auth.uid() or public.current_role() = 'gerant');

drop policy if exists custom_orders_manager_all on public.custom_orders;
create policy custom_orders_manager_all
on public.custom_orders
for all
to authenticated
using (public.current_role() = 'gerant')
with check (public.current_role() = 'gerant');
