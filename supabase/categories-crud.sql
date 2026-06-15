grant usage on schema public to authenticated;
grant select, insert, update, delete on public.categories to authenticated;

alter table public.categories enable row level security;

drop policy if exists categories_read_all on public.categories;
create policy categories_read_all
on public.categories
for select
to authenticated
using (true);

drop policy if exists categories_manager_all on public.categories;
create policy categories_manager_all
on public.categories
for all
to authenticated
using (public.current_role() = 'gerant')
with check (public.current_role() = 'gerant');
