import { useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { flexRender, getCoreRowModel, getFilteredRowModel, getPaginationRowModel, getSortedRowModel, useReactTable, type ColumnDef } from '@tanstack/react-table';
import { Edit, Grid2X2, ImagePlus, List, Menu, Plus, Trash2 } from 'lucide-react';
import { useFieldArray, useForm } from 'react-hook-form';
import { z } from 'zod';
import { zodResolver } from '@hookform/resolvers/zod';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useCategories } from '../hooks/useCategories';
import { useDeleteProduct, useProducts, useSaveProduct, useUploadProductImage } from '../hooks/useProducts';
import { formatCurrency } from '../lib/utils';
import type { Product, ProductFormPayload } from '../types/Product';
import { useAuthStore } from '../stores/authStore';

const variantSchema = z.object({
  id: z.string().optional(),
  color: z.string().min(1, 'required'),
  size: z.string().min(1, 'required'),
  sku: z.string().min(2, 'required'),
  stock: z.number().int().min(0, 'required'),
  priceOverride: z.preprocess((value) => (Number.isNaN(value) || value === '' ? null : value), z.number().min(0).nullable()),
});

const productSchema = z.object({
  name: z.string().min(2, 'required'),
  category: z.string().min(2, 'required'),
  price: z.number().positive('required'),
  purchasePrice: z.number().min(0, 'required'),
  description: z.string().min(5, 'required'),
  imageUrl: z.string().url().or(z.literal('')),
  variants: z.array(variantSchema).min(1, 'required'),
});

type ProductFormInput = z.input<typeof productSchema>;
type ProductFormValues = z.output<typeof productSchema>;

const emptyVariant = {
  id: undefined,
  color: 'standard',
  size: 'standard',
  sku: '',
  stock: 0,
  priceOverride: null,
};

const defaultProductValues: ProductFormInput = {
  name: '',
  category: '',
  price: 0,
  purchasePrice: 0,
  description: '',
  imageUrl: '',
  variants: [emptyVariant],
};

function productToForm(product: Product): ProductFormValues {
  return {
    name: product.name,
    category: product.category,
    price: product.price,
    purchasePrice: product.purchasePrice,
    description: product.description,
    imageUrl: product.imageUrl,
    variants: product.variants?.length
      ? product.variants.map((variant) => ({
          id: variant.id,
          color: variant.color,
          size: variant.size,
          sku: variant.sku,
          stock: variant.stock,
          priceOverride: variant.priceOverride ?? null,
        }))
      : [{ ...emptyVariant, sku: `${product.name.slice(0, 3).toUpperCase()}-STD`, stock: product.stock }],
  };
}

export function ProductsPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const { data: products = [], isLoading } = useProducts();
  const { data: categories = [] } = useCategories();
  const saveProduct = useSaveProduct();
  const deleteProduct = useDeleteProduct();
  const uploadProductImage = useUploadProductImage();
  const [globalFilter, setGlobalFilter] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreview, setImagePreview] = useState('');
  const [feedback, setFeedback] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('all');
  const [actionProductId, setActionProductId] = useState('');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');
  const canManageProducts = user?.role === 'gerant';
  const form = useForm<ProductFormInput, unknown, ProductFormValues>({
    resolver: zodResolver(productSchema),
    defaultValues: defaultProductValues,
  });
  const variants = useFieldArray({
    control: form.control,
    name: 'variants',
  });

  useEffect(() => {
    if (dialogOpen) {
      form.reset(editingProduct ? productToForm(editingProduct) : defaultProductValues);
      setSelectedImage(null);
      setImagePreview(editingProduct?.imageUrl ?? '');
    }
  }, [dialogOpen, editingProduct, form]);

  const columns = useMemo<ColumnDef<Product>[]>(
    () => [
      { accessorKey: 'name', header: t('name') },
      { accessorKey: 'category', header: t('category') },
      { accessorKey: 'price', header: t('price'), cell: ({ row }) => formatCurrency(row.original.price) },
      { accessorKey: 'stock', header: t('stock') },
      {
        id: 'margin',
        header: t('margin'),
        cell: ({ row }) => formatCurrency(row.original.price - row.original.purchasePrice),
      },
      {
        accessorKey: 'status',
        header: t('status'),
        cell: ({ row }) => {
          const status = row.original.status;
          const tone = status === 'available' ? 'green' : status === 'low' ? 'red' : 'red';
          return <span className={status === 'available' ? 'products-status-available' : 'products-status-low'}>{status === 'low' ? t('lowStockBadge') : t(status)}</span>;
        },
      },
      {
        id: 'actions',
        header: t('actions'),
        cell: ({ row }) =>
          canManageProducts ? (
            <div className="products-action-cell">
              <button className="products-action-trigger" type="button" onClick={() => setActionProductId((current) => (current === row.original.id ? '' : row.original.id))} aria-label={t('actions')}>
                <Menu size={26} />
              </button>
              {actionProductId === row.original.id ? (
                <div className="products-action-menu">
                  <button type="button" onClick={() => { setActionProductId(''); openEdit(row.original); }}>
                    <Edit size={16} />
                    {t('edit')}
                  </button>
                  <button type="button" onClick={() => { setActionProductId(''); void handleDelete(row.original.id); }}>
                    <Trash2 size={16} />
                    {t('delete')}
                  </button>
                </div>
              ) : null}
            </div>
          ) : null,
      },
    ],
    [actionProductId, canManageProducts, t],
  );
  const categoryOptions = useMemo(() => ['all', ...categories.map((category) => category.name)], [categories]);
  const filteredProducts = useMemo(
    () => products.filter((product) => categoryFilter === 'all' || product.category === categoryFilter),
    [categoryFilter, products],
  );

  const table = useReactTable({
    data: filteredProducts,
    columns,
    state: { globalFilter },
    onGlobalFilterChange: setGlobalFilter,
    getCoreRowModel: getCoreRowModel(),
    getSortedRowModel: getSortedRowModel(),
    getFilteredRowModel: getFilteredRowModel(),
    getPaginationRowModel: getPaginationRowModel(),
  });

  const showSuccess = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(''), 3000);
  };

  const openCreate = () => {
    setEditingProduct(null);
    setErrorMessage('');
    setDialogOpen(true);
  };

  const openEdit = (product: Product) => {
    setEditingProduct(product);
    setErrorMessage('');
    setDialogOpen(true);
  };

  const handleDelete = async (productId: string) => {
    if (!window.confirm(t('confirmDelete'))) {
      return;
    }

    try {
      await deleteProduct.mutateAsync(productId);
      showSuccess(t('productDeleted'));
    } catch {
      setErrorMessage(t('operationFailed'));
    }
  };

  const handleSaveProduct = async (values: ProductFormValues) => {
    let imageUrl = values.imageUrl;

    if (selectedImage) {
      imageUrl = await uploadProductImage.mutateAsync(selectedImage);
    }

    const payload: ProductFormPayload = {
      id: editingProduct?.id,
      ...values,
      imageUrl,
      variants: values.variants.map((variant) => ({
        ...variant,
        priceOverride: variant.priceOverride || null,
      })),
    };

    try {
      await saveProduct.mutateAsync(payload);
      setDialogOpen(false);
      setEditingProduct(null);
      setSelectedImage(null);
      setImagePreview('');
      form.reset(defaultProductValues);
      showSuccess(editingProduct ? t('productUpdated') : t('productCreated'));
    } catch {
      setErrorMessage(t('operationFailed'));
    }
  };

  return (
    <div className="products-page">
      {feedback ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">{feedback}</div> : null}
      {errorMessage ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{errorMessage}</div> : null}
      <div className="products-toolbar">
        <div className="products-view-icons">
          <button className={`products-view-button ${viewMode === 'list' ? 'is-active' : ''}`} type="button" onClick={() => setViewMode('list')} aria-label="Vue liste">
            <List size={26} />
          </button>
          <button className={`products-view-button ${viewMode === 'grid' ? 'is-active' : ''}`} type="button" onClick={() => setViewMode('grid')} aria-label="Vue grille">
            <Grid2X2 size={25} />
          </button>
        </div>
        <input className="products-search" value={globalFilter} onChange={(event) => setGlobalFilter(event.target.value)} placeholder={t('search')} aria-label={t('search')} />
        <select className="products-filter-select" value={categoryFilter} onChange={(event) => setCategoryFilter(event.target.value)} aria-label={t('category')}>
          {categoryOptions.map((category) => (
            <option key={category} value={category}>
              {category === 'all' ? 'Filter' : category}
            </option>
          ))}
        </select>
        {canManageProducts ? (
          <button className="products-add-button" type="button" onClick={openCreate}>
            {t('addProduct')}
          </button>
        ) : null}
        <p className="products-total">Total Produits: {products.length}</p>
      </div>
      {viewMode === 'list' ? (
        <>
          <div className="products-table-shell">
            <table className="products-table">
              <thead>
                  {table.getHeaderGroups().map((headerGroup) => (
                    <tr key={headerGroup.id}>
                      {headerGroup.headers.map((header) => (
                        <th key={header.id} onClick={header.column.getToggleSortingHandler()}>
                          {flexRender(header.column.columnDef.header, header.getContext())}
                        </th>
                      ))}
                    </tr>
                  ))}
              </thead>
              <tbody>
                  {isLoading ? (
                    <tr><td colSpan={7}>{t('loading')}</td></tr>
                  ) : (
                    table.getRowModel().rows.map((row) => (
                      <tr key={row.id}>
                        {row.getVisibleCells().map((cell) => (
                          <td key={cell.id}>{flexRender(cell.column.columnDef.cell, cell.getContext())}</td>
                        ))}
                      </tr>
                    ))
                  )}
              </tbody>
            </table>
          </div>
          <div className="products-pagination">
            <Button variant="ghost" disabled={!table.getCanPreviousPage()} onClick={() => table.previousPage()}>{t('previous')}</Button>
            <Button variant="ghost" disabled={!table.getCanNextPage()} onClick={() => table.nextPage()}>{t('next')}</Button>
          </div>
        </>
      ) : (
        <div className="products-grid-view">
          {isLoading ? <div className="products-grid-empty">{t('loading')}</div> : null}
          {!isLoading && table.getRowModel().rows.length === 0 ? <div className="products-grid-empty">{t('noProducts')}</div> : null}
          {table.getRowModel().rows.map((row) => {
            const product = row.original;
            return (
              <article className="products-grid-card" key={product.id}>
                <img src={product.imageUrl} alt={product.name} />
                <div className="products-grid-card-body">
                  <div>
                    <p>{product.name}</p>
                    <span>{product.category}</span>
                  </div>
                  <strong>{formatCurrency(product.price)}</strong>
                  <div className="products-grid-meta">
                    <span>Stock {product.stock}</span>
                    <span>{formatCurrency(product.price - product.purchasePrice)}</span>
                  </div>
                  <span className={product.status === 'available' ? 'products-status-available' : 'products-status-low'}>
                    {product.status === 'low' ? t('lowStockBadge') : t(product.status)}
                  </span>
                  {canManageProducts ? (
                    <div className="products-grid-actions">
                      <button type="button" onClick={() => openEdit(product)}>
                        <Edit size={16} />
                        {t('edit')}
                      </button>
                      <button type="button" onClick={() => void handleDelete(product.id)}>
                        <Trash2 size={16} />
                        {t('delete')}
                      </button>
                    </div>
                  ) : null}
                </div>
              </article>
            );
          })}
        </div>
      )}
      {dialogOpen && canManageProducts ? (
        <div className="fixed inset-0 z-20 grid place-items-center overflow-y-auto bg-emerald-950/50 p-4">
          <Card className="my-8 w-full max-w-3xl p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-2xl font-black text-emerald-950">{editingProduct ? t('editProduct') : t('addProduct')}</h3>
              <Button variant="ghost" onClick={() => setDialogOpen(false)}>{t('close')}</Button>
            </div>
            <form className="grid gap-4 md:grid-cols-2" onSubmit={form.handleSubmit(handleSaveProduct)}>
              <Input label={t('name')} {...form.register('name')} error={form.formState.errors.name ? t('required') : undefined} />
              <label className="form-field">
                <span className="field-label">{t('category')}</span>
                <select className="input-control" {...form.register('category')}>
                  <option value="">{t('chooseCategory')}</option>
                  {categories.map((category) => (
                    <option key={category.id} value={category.name}>
                      {category.name}
                    </option>
                  ))}
                </select>
                {categories.length === 0 ? <span className="text-sm font-semibold text-amber-700">{t('createCategoryFirst')}</span> : null}
                {form.formState.errors.category ? <span className="text-sm font-semibold text-red-700">{t('required')}</span> : null}
              </label>
              <Input label={t('price')} type="number" {...form.register('price', { valueAsNumber: true })} error={form.formState.errors.price ? t('positivePrice') : undefined} />
              <Input label={t('purchasePrice')} type="number" {...form.register('purchasePrice', { valueAsNumber: true })} error={form.formState.errors.purchasePrice ? t('required') : undefined} />
              <div className="md:col-span-2 grid gap-3 rounded-lg border border-slate-200 p-3">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="field-label">{t('productImage')}</p>
                    <p className="text-sm font-semibold text-slate-500">{t('productImageHint')}</p>
                  </div>
                  <label className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-amber-100 px-4 text-sm font-semibold text-amber-950 transition hover:bg-amber-200">
                    <ImagePlus size={18} />
                    {t('chooseImage')}
                    <input
                      className="hidden"
                      type="file"
                      accept="image/*"
                      onChange={(event) => {
                        const file = event.target.files?.[0] ?? null;
                        setSelectedImage(file);
                        setImagePreview(file ? URL.createObjectURL(file) : editingProduct?.imageUrl ?? '');
                      }}
                    />
                  </label>
                </div>
                {imagePreview ? <img className="h-44 w-full rounded-lg object-cover" src={imagePreview} alt={t('productImage')} /> : null}
                <Input label="Image URL" {...form.register('imageUrl')} error={form.formState.errors.imageUrl ? t('invalidUrl') : undefined} />
              </div>
              <label className="form-field md:col-span-2">
                <span className="field-label">{t('description')}</span>
                <textarea className="input-control min-h-24" {...form.register('description')} />
                {form.formState.errors.description ? <span className="text-sm font-semibold text-red-700">{t('required')}</span> : null}
              </label>
              <div className="md:col-span-2">
                <div className="mb-3 flex items-center justify-between gap-3">
                  <h4 className="text-lg font-black text-emerald-950">{t('variants')}</h4>
                  <Button type="button" variant="secondary" size="sm" icon={<Plus size={15} />} onClick={() => variants.append({ ...emptyVariant })}>{t('addVariant')}</Button>
                </div>
                <div className="grid gap-3">
                  {variants.fields.map((field, index) => (
                    <div className="grid gap-3 rounded-lg border border-slate-200 p-3 md:grid-cols-5" key={field.id}>
                      <Input label={t('color')} {...form.register(`variants.${index}.color`)} error={form.formState.errors.variants?.[index]?.color ? t('required') : undefined} />
                      <Input label={t('size')} {...form.register(`variants.${index}.size`)} error={form.formState.errors.variants?.[index]?.size ? t('required') : undefined} />
                      <Input label="SKU" {...form.register(`variants.${index}.sku`)} error={form.formState.errors.variants?.[index]?.sku ? t('required') : undefined} />
                      <Input label={t('stock')} type="number" {...form.register(`variants.${index}.stock`, { valueAsNumber: true })} error={form.formState.errors.variants?.[index]?.stock ? t('required') : undefined} />
                      <div className="flex items-end gap-2">
                        <Input label={t('priceOverride')} type="number" {...form.register(`variants.${index}.priceOverride`, { valueAsNumber: true })} />
                        <Button type="button" variant="danger" size="sm" icon={<Trash2 size={15} />} onClick={() => variants.fields.length > 1 && variants.remove(index)} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              <Button className="md:col-span-2" type="submit" disabled={saveProduct.isPending || uploadProductImage.isPending}>{saveProduct.isPending || uploadProductImage.isPending ? t('loading') : t('save')}</Button>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
