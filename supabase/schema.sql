create type public.user_role as enum ('vendeur', 'gerant');
create type public.sale_status as enum ('draft', 'paid', 'cancelled');
create type public.custom_order_status as enum ('new', 'in_progress', 'ready', 'delivered', 'cancelled');
create type public.stock_movement_type as enum ('in', 'out', 'adjustment');

create table public.users (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null,
  email text not null unique,
  role public.user_role not null default 'vendeur',
  created_at timestamptz not null default now()
);

create table public.categories (
  id uuid primary key default gen_random_uuid(),
  name text not null unique,
  created_at timestamptz not null default now()
);

create table public.products (
  id uuid primary key default gen_random_uuid(),
  category_id uuid not null references public.categories(id) on delete restrict,
  name text not null,
  description text not null default '',
  price numeric(12, 2) not null check (price > 0),
  purchase_price numeric(12, 2) not null check (purchase_price >= 0),
  image_url text,
  is_active boolean not null default true,
  created_at timestamptz not null default now()
);

create table public.product_variants (
  id uuid primary key default gen_random_uuid(),
  product_id uuid not null references public.products(id) on delete cascade,
  sku text not null unique,
  color text not null,
  size text not null,
  price_override numeric(12, 2),
  created_at timestamptz not null default now()
);

create table public.stock_movements (
  id uuid primary key default gen_random_uuid(),
  variant_id uuid not null references public.product_variants(id) on delete cascade,
  movement_type public.stock_movement_type not null,
  quantity integer not null check (quantity > 0),
  unit_cost numeric(12, 2) not null default 0,
  note text,
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create table public.sales (
  id uuid primary key default gen_random_uuid(),
  seller_id uuid not null references public.users(id) on delete restrict,
  status public.sale_status not null default 'paid',
  payment_method text not null check (payment_method in ('cash', 'bankily', 'sedad', 'card')),
  subtotal numeric(12, 2) not null check (subtotal >= 0),
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  tax numeric(12, 2) not null default 0 check (tax >= 0),
  total numeric(12, 2) not null check (total >= 0),
  created_at timestamptz not null default now()
);

create table public.sale_items (
  id uuid primary key default gen_random_uuid(),
  sale_id uuid not null references public.sales(id) on delete cascade,
  variant_id uuid not null references public.product_variants(id) on delete restrict,
  quantity integer not null check (quantity > 0),
  unit_price numeric(12, 2) not null check (unit_price > 0),
  discount numeric(12, 2) not null default 0 check (discount >= 0),
  total numeric(12, 2) not null check (total >= 0)
);

create table public.custom_orders (
  id uuid primary key default gen_random_uuid(),
  customer_name text not null,
  customer_phone text not null,
  product_type text not null,
  details text not null,
  deposit numeric(12, 2) not null default 0 check (deposit >= 0),
  total_price numeric(12, 2) not null check (total_price > 0),
  due_date date not null,
  status public.custom_order_status not null default 'new',
  created_by uuid references public.users(id) on delete set null,
  created_at timestamptz not null default now()
);

create view public.v_current_stock as
select
  pv.id as variant_id,
  pv.product_id,
  p.name as product_name,
  pv.sku,
  coalesce(sum(case when sm.movement_type = 'in' then sm.quantity when sm.movement_type in ('out', 'adjustment') then -sm.quantity else 0 end), 0) as current_stock
from public.product_variants pv
join public.products p on p.id = pv.product_id
left join public.stock_movements sm on sm.variant_id = pv.id
group by pv.id, pv.product_id, p.name, pv.sku;

alter table public.users enable row level security;
alter table public.categories enable row level security;
alter table public.products enable row level security;
alter table public.product_variants enable row level security;
alter table public.stock_movements enable row level security;
alter table public.sales enable row level security;
alter table public.sale_items enable row level security;
alter table public.custom_orders enable row level security;

create or replace function public.current_role()
returns public.user_role
language sql
security definer
set search_path = public
stable
as $$
  select role from public.users where id = auth.uid()
$$;

create policy users_select_self_or_manager on public.users for select using (id = auth.uid() or public.current_role() = 'gerant');
create policy users_insert_self on public.users for insert with check (id = auth.uid());
create policy users_manager_all on public.users for all using (public.current_role() = 'gerant') with check (public.current_role() = 'gerant');

create policy categories_read_all on public.categories for select using (auth.role() = 'authenticated');
create policy categories_manager_all on public.categories for all using (public.current_role() = 'gerant') with check (public.current_role() = 'gerant');

create policy products_read_all on public.products for select using (auth.role() = 'authenticated');
create policy products_manager_all on public.products for all using (public.current_role() = 'gerant') with check (public.current_role() = 'gerant');

create policy variants_read_all on public.product_variants for select using (auth.role() = 'authenticated');
create policy variants_manager_all on public.product_variants for all using (public.current_role() = 'gerant') with check (public.current_role() = 'gerant');

create policy stock_read_all on public.stock_movements for select using (auth.role() = 'authenticated');
create policy stock_manager_all on public.stock_movements for all using (public.current_role() = 'gerant') with check (public.current_role() = 'gerant');

create policy sales_seller_select on public.sales for select using (seller_id = auth.uid() or public.current_role() = 'gerant');
create policy sales_seller_insert on public.sales for insert with check (seller_id = auth.uid() or public.current_role() = 'gerant');
create policy sales_manager_all on public.sales for all using (public.current_role() = 'gerant') with check (public.current_role() = 'gerant');

create policy sale_items_select_by_sale on public.sale_items for select using (exists (select 1 from public.sales s where s.id = sale_id and (s.seller_id = auth.uid() or public.current_role() = 'gerant')));
create policy sale_items_insert_by_sale on public.sale_items for insert with check (exists (select 1 from public.sales s where s.id = sale_id and (s.seller_id = auth.uid() or public.current_role() = 'gerant')));
create policy sale_items_manager_all on public.sale_items for all using (public.current_role() = 'gerant') with check (public.current_role() = 'gerant');

create policy custom_orders_read_all on public.custom_orders for select using (auth.role() = 'authenticated');
create policy custom_orders_insert_authenticated on public.custom_orders for insert with check (created_by = auth.uid() or public.current_role() = 'gerant');
create policy custom_orders_manager_all on public.custom_orders for all using (public.current_role() = 'gerant') with check (public.current_role() = 'gerant');
