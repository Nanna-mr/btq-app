update public.users
set role = 'gerant'
where lower(email) = 'gerant@btq.test';

update public.users
set role = 'vendeur'
where lower(email) <> 'gerant@btq.test';

drop policy if exists users_insert_self on public.users;
create policy users_insert_self
on public.users
for insert
to authenticated
with check (
  id = auth.uid()
  and role = case
    when lower(email) = 'gerant@btq.test' then 'gerant'::public.user_role
    else 'vendeur'::public.user_role
  end
);

drop policy if exists users_update_self_role_guard on public.users;
create policy users_update_self_role_guard
on public.users
for update
to authenticated
using (id = auth.uid())
with check (
  id = auth.uid()
  and role = case
    when lower(email) = 'gerant@btq.test' then 'gerant'::public.user_role
    else 'vendeur'::public.user_role
  end
);

grant usage on schema public to authenticated;
grant select, insert, update on public.users to authenticated;
