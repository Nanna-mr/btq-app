drop policy if exists users_insert_self on public.users;

create policy users_insert_self
on public.users
for insert
to authenticated
with check (id = auth.uid());

grant usage on schema public to authenticated;
grant select, insert on public.users to authenticated;
