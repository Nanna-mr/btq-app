import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Download, Plus } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
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
    <div className="grid gap-5 xl:grid-cols-[24rem_1fr]">
      <Card className="h-fit p-5">
        <h2 className="mb-4 text-2xl font-black text-emerald-950">{t('addStockMovement')}</h2>
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
          {feedback ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">{feedback}</div> : null}
          {errorMessage ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{errorMessage}</div> : null}
          <Button type="submit" icon={<Plus size={18} />} disabled={addMovement.isPending}>{addMovement.isPending ? t('loading') : t('save')}</Button>
        </form>
      </Card>
      <Card className="p-4">
        <h2 className="mb-4 text-2xl font-black text-emerald-950">{t('stockMovements')}</h2>
        <div className="table-wrap">
          <table className="data-table">
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
                movements.map((movement) => (
                  <tr key={movement.id}>
                    <td>{movement.productName}</td>
                    <td>{movement.sku}</td>
                    <td><Badge tone={movement.movementType === 'in' ? 'green' : movement.movementType === 'out' ? 'red' : 'amber'}>{t(movement.movementType)}</Badge></td>
                    <td>{movement.quantity}</td>
                    <td>{movement.note}</td>
                    <td>{new Date(movement.createdAt).toLocaleDateString()}</td>
                    <td>
                      {movement.saleId ? (
                        <Button size="sm" variant="secondary" icon={<Download size={15} />} onClick={() => handleDownloadTicket(movement.saleId ?? '')} disabled={downloadingSaleId === movement.saleId}>
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
    </div>
  );
}
