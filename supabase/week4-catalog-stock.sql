alter table public.product_variants
add column if not exists price_override numeric(12, 2);

grant usage on schema public to authenticated;
grant select, insert, update, delete on public.categories to authenticated;
grant select, insert, update, delete on public.products to authenticated;
grant select, insert, update, delete on public.product_variants to authenticated;
grant select, insert, update, delete on public.stock_movements to authenticated;

drop policy if exists categories_manager_all on public.categories;
create policy categories_manager_all on public.categories
for all
to authenticated
using (public.current_role() = 'gerant')
with check (public.current_role() = 'gerant');

drop policy if exists products_manager_all on public.products;
create policy products_manager_all on public.products
for all
to authenticated
using (public.current_role() = 'gerant')
with check (public.current_role() = 'gerant');

drop policy if exists variants_manager_all on public.product_variants;
create policy variants_manager_all on public.product_variants
for all
to authenticated
using (public.current_role() = 'gerant')
with check (public.current_role() = 'gerant');

drop policy if exists stock_manager_all on public.stock_movements;
create policy stock_manager_all on public.stock_movements
for all
to authenticated
using (public.current_role() = 'gerant')
with check (public.current_role() = 'gerant');
