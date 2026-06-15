create or replace function public.delete_user_with_relations(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  if not exists (
    select 1
    from public.users
    where id = auth.uid()
      and role = 'gerant'
  ) then
    raise exception 'Only gerant can delete users';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'Cannot delete the current user';
  end if;

  if not exists (
    select 1
    from public.users
    where id = target_user_id
  ) then
    raise exception 'User not found';
  end if;

  delete from public.sale_items
  where sale_id in (
    select id
    from public.sales
    where seller_id = target_user_id
       or cash_session_id in (
         select id
         from public.cash_sessions
         where opened_by = target_user_id
       )
  );

  delete from public.stock_movements
  where created_by = target_user_id
     or cash_session_id in (
       select id
       from public.cash_sessions
       where opened_by = target_user_id
     );

  delete from public.sales
  where seller_id = target_user_id
     or cash_session_id in (
       select id
       from public.cash_sessions
       where opened_by = target_user_id
     );

  delete from public.cash_sessions
  where opened_by = target_user_id;

  delete from public.custom_orders
  where created_by = target_user_id;

  delete from public.users
  where id = target_user_id;
end;
$$;

grant execute on function public.delete_user_with_relations(uuid) to authenticated;
