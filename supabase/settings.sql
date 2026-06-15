create table if not exists public.app_settings (
  id text primary key default 'default',
  shop_name text not null default '1ere Commerce',
  logo_url text,
  phone text,
  address text,
  footer_message text not null default 'Thank you for shopping with us',
  updated_at timestamptz not null default now()
);

insert into public.app_settings (id, shop_name)
values ('default', '1ere Commerce')
on conflict (id) do nothing;

grant usage on schema public to authenticated;
grant select on public.app_settings to authenticated;
grant insert, update on public.app_settings to authenticated;

alter table public.app_settings enable row level security;

drop policy if exists app_settings_read_all on public.app_settings;
create policy app_settings_read_all
on public.app_settings
for select
to authenticated
using (true);

drop policy if exists app_settings_manager_write on public.app_settings;
create policy app_settings_manager_write
on public.app_settings
for all
to authenticated
using (public.current_role() = 'gerant')
with check (public.current_role() = 'gerant');

insert into storage.buckets (id, name, public)
values ('boutique', 'boutique', true)
on conflict (id) do update set public = true;

drop policy if exists boutique_public_read on storage.objects;
create policy boutique_public_read
on storage.objects
for select
using (bucket_id = 'boutique');

drop policy if exists boutique_settings_upload on storage.objects;
create policy boutique_settings_upload
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'boutique'
  and public.current_role() = 'gerant'
);

drop policy if exists boutique_settings_update on storage.objects;
create policy boutique_settings_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'boutique'
  and public.current_role() = 'gerant'
)
with check (
  bucket_id = 'boutique'
  and public.current_role() = 'gerant'
);
