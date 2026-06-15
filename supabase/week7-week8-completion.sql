alter table public.users add column if not exists is_active boolean not null default true;

alter table public.sales add column if not exists paid_amount numeric(12, 2) not null default 0 check (paid_amount >= 0);
alter table public.sales add column if not exists customer_phone text;

create table if not exists public.cash_sessions (
  id uuid primary key default gen_random_uuid(),
  opened_by uuid not null references public.users(id) on delete restrict,
  opening_amount numeric(12, 2) not null default 0 check (opening_amount >= 0),
  closing_amount numeric(12, 2) check (closing_amount >= 0),
  opened_at timestamptz not null default now(),
  closed_at timestamptz,
  note text
);

alter table public.sales add column if not exists cash_session_id uuid references public.cash_sessions(id) on delete set null;
alter table public.stock_movements add column if not exists cash_session_id uuid references public.cash_sessions(id) on delete set null;

alter table public.cash_sessions enable row level security;

grant usage on schema public to authenticated;
grant select, insert, update on public.cash_sessions to authenticated;
grant select, update on public.users to authenticated;
grant delete on public.users to authenticated;
grant select on public.sales to authenticated;
grant select on public.sale_items to authenticated;

drop policy if exists cash_sessions_manager_all on public.cash_sessions;
create policy cash_sessions_manager_all
on public.cash_sessions
for all
to authenticated
using (public.current_role() = 'gerant')
with check (public.current_role() = 'gerant');

drop policy if exists users_manager_update_status on public.users;
create policy users_manager_update_status
on public.users
for update
to authenticated
using (public.current_role() = 'gerant')
with check (public.current_role() = 'gerant');

create or replace function public.delete_user_with_relations(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if public.current_role() <> 'gerant' then
    raise exception 'Only gerant can delete users';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'Cannot delete the current user';
  end if;

  delete from public.sale_items
  where sale_id in (
    select id
    from public.sales
    where seller_id = target_user_id
       or cash_session_id in (
         select id from public.cash_sessions where opened_by = target_user_id
       )
  );

  delete from public.stock_movements
  where created_by = target_user_id
     or cash_session_id in (
       select id from public.cash_sessions where opened_by = target_user_id
     );

  delete from public.sales
  where seller_id = target_user_id
     or cash_session_id in (
       select id from public.cash_sessions where opened_by = target_user_id
     );

  delete from public.cash_sessions where opened_by = target_user_id;
  delete from public.custom_orders where created_by = target_user_id;
  delete from public.users where id = target_user_id;
end;
$$;

grant execute on function public.delete_user_with_relations(uuid) to authenticated;
