grant select, insert, update on public.cash_sessions to authenticated;

drop policy if exists cash_sessions_staff_select on public.cash_sessions;
create policy cash_sessions_staff_select
on public.cash_sessions
for select
to authenticated
using (
  opened_by = auth.uid()
  or public.current_role() = 'gerant'
);

drop policy if exists cash_sessions_staff_insert on public.cash_sessions;
create policy cash_sessions_staff_insert
on public.cash_sessions
for insert
to authenticated
with check (
  opened_by = auth.uid()
  or public.current_role() = 'gerant'
);

drop policy if exists cash_sessions_staff_update on public.cash_sessions;
create policy cash_sessions_staff_update
on public.cash_sessions
for update
to authenticated
using (
  opened_by = auth.uid()
  or public.current_role() = 'gerant'
)
with check (
  opened_by = auth.uid()
  or public.current_role() = 'gerant'
);
