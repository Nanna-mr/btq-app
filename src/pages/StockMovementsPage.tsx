import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Grid2X2, List, Plus, Search, SlidersHorizontal, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { useAddStockMovement, useProductVariants, useStockMovements } from '../hooks/useStockMovements';
import { fetchSaleTicket } from '../hooks/useSales';
import { downloadSaleTicket } from '../lib/tickets';
import { defaultShopSettings, useShopSettings } from '../hooks/useShopSettings';

export function StockMovementsPage() {
  const { t } = useTranslation();
  const { data: variants = [] } = useProductVariants();
  const { data: movements = [], isLoading } = useStockMovements();
  const { data: settings = defaultShopSettings } = useShopSettings();
  const addMovement = useAddStockMovement();
  const [variantId, setVariantId] = useState('');
  const [movementType, setMovementType] = useState<'in' | 'out' | 'adjustment'>('in');
  const [quantity, setQuantity] = useState(1);
  const [note, setNote] = useState('');
  const [feedback, setFeedback] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [downloadingSaleId, setDownloadingSaleId] = useState('');
  const [dialogOpen, setDialogOpen] = useState(false);
  const [search, setSearch] = useState('');
  const [typeFilter, setTypeFilter] = useState('all');
  const [sortMode, setSortMode] = useState('date-desc');
  const [viewMode, setViewMode] = useState<'list' | 'grid'>('list');

  const filteredMovements = movements
    .filter((movement) => typeFilter === 'all' || movement.movementType === typeFilter)
    .filter((movement) => {
      const value = `${movement.productName} ${movement.sku} ${movement.note}`.toLowerCase();
      return value.includes(search.trim().toLowerCase());
    })
    .sort((a, b) => {
      if (sortMode === 'date-asc') {
        return new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
      }
      if (sortMode === 'product') {
        return a.productName.localeCompare(b.productName);
      }
      return new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime();
    });

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    if (!variantId || quantity <= 0) {
      setErrorMessage(t('required'));
      return;
    }

    try {
      await addMovement.mutateAsync({ variantId, movementType, quantity, note });
      setQuantity(1);
      setNote('');
      setDialogOpen(false);
      setFeedback(t('stockMovementCreated'));
      window.setTimeout(() => setFeedback(''), 3000);
    } catch {
      setErrorMessage(t('operationFailed'));
    }
  };

  const handleDownloadTicket = async (saleId: string) => {
    setErrorMessage('');
    setDownloadingSaleId(saleId);

    try {
      const ticket = await fetchSaleTicket(saleId);
      downloadSaleTicket(ticket, settings);
    } catch {
      setErrorMessage(t('ticketDownloadFailed'));
    } finally {
      setDownloadingSaleId('');
    }
  };

  return (
    <div className="stock-page erp-page">
      {feedback ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">{feedback}</div> : null}
      {errorMessage ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{errorMessage}</div> : null}
      <div className="stock-toolbar">
        <div className="stock-view-toggle" aria-label="Vue">
          <button className={viewMode === 'list' ? 'is-active' : ''} type="button" aria-label="Vue liste" onClick={() => setViewMode('list')}><List size={25} /></button>
          <button className={viewMode === 'grid' ? 'is-active' : ''} type="button" aria-label="Vue grille" onClick={() => setViewMode('grid')}><Grid2X2 size={23} /></button>
        </div>
        <label className="stock-search">
          <Search size={22} />
          <input value={search} onChange={(event) => setSearch(event.target.value)} placeholder="Recherche" />
        </label>
        <label className="stock-select">
          <SlidersHorizontal size={19} />
          <select value={typeFilter} onChange={(event) => setTypeFilter(event.target.value)}>
            <option value="all">Filter</option>
            <option value="in">{t('stockIn')}</option>
            <option value="out">{t('stockOut')}</option>
            <option value="adjustment">{t('stockAdjustment')}</option>
          </select>
        </label>
        <label className="stock-select">
          <span>Sort by :</span>
          <select value={sortMode} onChange={(event) => setSortMode(event.target.value)}>
            <option value="date-desc">Default</option>
            <option value="date-asc">{t('date')}</option>
            <option value="product">{t('products')}</option>
          </select>
        </label>
        <button className="stock-add-button" type="button" onClick={() => setDialogOpen(true)}>
          <Plus size={21} />
          Ajouter
        </button>
      </div>

      {viewMode === 'list' ? (
        <Card className="stock-table-card">
          <div className="stock-table-wrap">
            <table className="stock-table">
              <thead>
                <tr>
                  <th>{t('products')}</th>
                  <th>SKU</th>
                  <th>{t('movementType')}</th>
                  <th>{t('quantity')}</th>
                  <th>{t('reason')}</th>
                  <th>{t('date')}</th>
                  <th>{t('ticket')}</th>
                </tr>
              </thead>
              <tbody>
                {isLoading ? (
                  <tr><td colSpan={7}>{t('loading')}</td></tr>
                ) : (
                  filteredMovements.map((movement) => (
                    <tr key={movement.id}>
                      <td>{movement.productName}</td>
                      <td>{movement.sku}</td>
                      <td><span className={`stock-type stock-type-${movement.movementType}`}>{t(movement.movementType)}</span></td>
                      <td>{movement.quantity}</td>
                      <td>{movement.note}</td>
                      <td>{new Date(movement.createdAt).toLocaleDateString()}</td>
                      <td>
                        {movement.saleId ? (
                          <Button className="stock-pdf-button" size="sm" variant="secondary" icon={<Download size={15} />} onClick={() => handleDownloadTicket(movement.saleId ?? '')} disabled={downloadingSaleId === movement.saleId}>
                            {downloadingSaleId === movement.saleId ? t('loading') : 'PDF'}
                          </Button>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="stock-grid-view">
          {isLoading ? <div className="stock-grid-empty">{t('loading')}</div> : null}
          {!isLoading && filteredMovements.length === 0 ? <div className="stock-grid-empty">-</div> : null}
          {filteredMovements.map((movement) => (
            <article className="stock-grid-card" key={movement.id}>
              <div className="stock-grid-card-head">
                <div>
                  <p>{movement.productName}</p>
                  <span>{movement.sku}</span>
                </div>
                <span className={`stock-type stock-type-${movement.movementType}`}>{t(movement.movementType)}</span>
              </div>
              <div className="stock-grid-card-body">
                <p><span>{t('quantity')}</span><strong>{movement.quantity}</strong></p>
                <p><span>{t('date')}</span><strong>{new Date(movement.createdAt).toLocaleDateString()}</strong></p>
                <p><span>{t('reason')}</span><strong>{movement.note || '-'}</strong></p>
              </div>
              {movement.saleId ? (
                <Button className="stock-pdf-button" size="sm" variant="secondary" icon={<Download size={15} />} onClick={() => handleDownloadTicket(movement.saleId ?? '')} disabled={downloadingSaleId === movement.saleId}>
                  {downloadingSaleId === movement.saleId ? t('loading') : 'PDF'}
                </Button>
              ) : null}
            </article>
          ))}
        </div>
      )}
      {dialogOpen ? (
        <div className="stock-dialog-backdrop fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
          <Card className="stock-dialog-card w-full max-w-xl p-5">
            <div className="stock-dialog-header mb-4 flex items-center justify-between gap-3">
              <h2 className="text-2xl font-black text-emerald-950">{t('addStockMovement')}</h2>
              <Button variant="ghost" icon={<X size={18} />} onClick={() => setDialogOpen(false)}>{t('close')}</Button>
            </div>
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <label className="form-field">
                <span className="field-label">{t('variant')}</span>
                <select className="input-control" value={variantId} onChange={(event) => setVariantId(event.target.value)}>
                  <option value="">{t('chooseVariant')}</option>
                  {variants.map((variant) => (
                    <option key={variant.id} value={variant.id}>
                      {variant.productName} · {variant.sku} · {variant.stock}
                    </option>
                  ))}
                </select>
              </label>
              <label className="form-field">
                <span className="field-label">{t('movementType')}</span>
                <select className="input-control" value={movementType} onChange={(event) => setMovementType(event.target.value as typeof movementType)}>
                  <option value="in">{t('stockIn')}</option>
                  <option value="out">{t('stockOut')}</option>
                  <option value="adjustment">{t('stockAdjustment')}</option>
                </select>
              </label>
              <Input label={t('quantity')} type="number" min={1} value={quantity} onChange={(event) => setQuantity(Number(event.target.value))} />
              <label className="form-field">
                <span className="field-label">{t('reason')}</span>
                <textarea className="input-control min-h-24" value={note} onChange={(event) => setNote(event.target.value)} />
              </label>
              <Button type="submit" icon={<Plus size={18} />} disabled={addMovement.isPending}>{addMovement.isPending ? t('loading') : t('save')}</Button>
            </form>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
