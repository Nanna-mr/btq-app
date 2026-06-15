grant usage on schema public to authenticated;
alter type public.custom_order_status add value if not exists 'paid';

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
