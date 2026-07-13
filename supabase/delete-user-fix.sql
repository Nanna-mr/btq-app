alter table public.users add column if not exists is_active boolean not null default true;
alter table public.users add column if not exists archived_at timestamptz;

create or replace function public.archive_user_account(target_user_id uuid)
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
    raise exception 'Only gerant can archive users';
  end if;

  if target_user_id = auth.uid() then
    raise exception 'Cannot archive the current user';
  end if;

  update public.users
  set
    is_active = false,
    archived_at = now()
  where id = target_user_id;

  if not found then
    raise exception 'User not found';
  end if;
end;
$$;

create or replace function public.delete_user_with_relations(target_user_id uuid)
returns void
language plpgsql
security definer
set search_path = public
as $$
begin
  perform public.archive_user_account(target_user_id);
end;
$$;

grant execute on function public.archive_user_account(uuid) to authenticated;
grant execute on function public.delete_user_with_relations(uuid) to authenticated;
