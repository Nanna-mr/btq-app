insert into public.categories (name) values
  ('Melhfas'),
  ('Daraas'),
  ('Literie')
on conflict (name) do nothing;

with category_map as (
  select id, name from public.categories
),
inserted_products as (
  insert into public.products (category_id, name, description, price, purchase_price, image_url)
  select
    category_map.id,
    product_name,
    product_description,
    product_price,
    product_purchase_price,
    product_image
  from (
    values
      ('Melhfas', 'Melhfa voile premium', 'Tissu leger pour ceremonie', 8500, 5600, 'https://images.unsplash.com/photo-1594736797933-d0501ba2fe65'),
      ('Melhfas', 'Melhfa coton doux', 'Modele quotidien confortable', 5200, 3100, 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f'),
      ('Melhfas', 'Melhfa soie imprimee', 'Imprime elegant', 9800, 6700, 'https://images.unsplash.com/photo-1539109136881-3be0616acf4b'),
      ('Daraas', 'Daraa bleu nuit', 'Daraa brode coupe classique', 12000, 7800, 'https://images.unsplash.com/photo-1523398002811-999ca8dec234'),
      ('Daraas', 'Daraa blanc luxe', 'Tenue haut de gamme', 14500, 9200, 'https://images.unsplash.com/photo-1506629905607-d405b7a30db9'),
      ('Daraas', 'Boubou enfant', 'Tenue enfant brodee', 6500, 4100, 'https://images.unsplash.com/photo-1519238263530-99bdd11df2ea'),
      ('Literie', 'Matelas confort 140', 'Matelas deux places ferme', 38000, 27000, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85'),
      ('Literie', 'Matelas confort 160', 'Format familial renforce', 46000, 33000, 'https://images.unsplash.com/photo-1505693416388-ac5ce068fe85'),
      ('Literie', 'Oreiller mousse', 'Oreiller respirant', 3200, 1800, 'https://images.unsplash.com/photo-1584100936595-c0654b55a2e2'),
      ('Literie', 'Drap coton 2 places', 'Parure complete', 7800, 4700, 'https://images.unsplash.com/photo-1583847268964-b28dc8f51f92')
  ) as source(category_name, product_name, product_description, product_price, product_purchase_price, product_image)
  join category_map on category_map.name = source.category_name
  returning id, name
)
insert into public.product_variants (product_id, sku, color, size)
select id, 'BTQ-' || upper(substr(replace(name, ' ', '-'), 1, 12)) || '-STD', 'standard', 'standard'
from inserted_products
on conflict (sku) do nothing;

insert into public.stock_movements (variant_id, movement_type, quantity, unit_cost, note)
select id, 'in', 10 + row_number() over (), 0, 'Stock initial'
from public.product_variants
where sku like 'BTQ-%';
