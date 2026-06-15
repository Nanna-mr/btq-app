insert into storage.buckets (id, name, public)
values ('boutique', 'boutique', true)
on conflict (id) do update set public = true;

drop policy if exists boutique_public_read on storage.objects;
create policy boutique_public_read
on storage.objects
for select
using (bucket_id = 'boutique');

drop policy if exists boutique_manager_upload on storage.objects;
drop policy if exists boutique_authenticated_upload on storage.objects;
create policy boutique_authenticated_upload
on storage.objects
for insert
to authenticated
with check (
  bucket_id = 'boutique'
);

drop policy if exists boutique_manager_update on storage.objects;
drop policy if exists boutique_authenticated_update on storage.objects;
create policy boutique_authenticated_update
on storage.objects
for update
to authenticated
using (
  bucket_id = 'boutique'
)
with check (
  bucket_id = 'boutique'
);

drop policy if exists boutique_manager_delete on storage.objects;
drop policy if exists boutique_authenticated_delete on storage.objects;
create policy boutique_authenticated_delete
on storage.objects
for delete
to authenticated
using (
  bucket_id = 'boutique'
);
