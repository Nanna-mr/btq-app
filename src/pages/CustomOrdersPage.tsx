import { FormEvent, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { ClipboardCheck, Download, Edit, Plus, Trash2 } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { Badge } from '../components/ui/Badge';
import { formatCurrency } from '../lib/utils';
import { useCreateCustomOrder, useCustomOrders, useDeleteCustomOrder, useUpdateCustomOrder } from '../hooks/useCustomOrders';
import { useAuthStore } from '../stores/authStore';
import type { CustomOrder } from '../types/Sale';
import { downloadOrderTicket } from '../lib/tickets';
import { defaultShopSettings, useShopSettings } from '../hooks/useShopSettings';

const statusOptions: CustomOrder['status'][] = ['new', 'in_progress', 'ready', 'delivered', 'paid', 'cancelled'];

const emptyForm = {
  customerName: '',
  customerPhone: '',
  productType: '',
  details: '',
  deposit: '',
  totalPrice: '',
  dueDate: '',
  status: 'new' as CustomOrder['status'],
};

function statusTone(status: CustomOrder['status']) {
  if (status === 'ready' || status === 'delivered' || status === 'paid') {
    return 'green';
  }

  if (status === 'in_progress') {
    return 'amber';
  }

  if (status === 'cancelled') {
    return 'red';
  }

  return 'slate';
}

export function CustomOrdersPage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const { data: orders = [], isLoading, isError } = useCustomOrders();
  const createCustomOrder = useCreateCustomOrder();
  const updateCustomOrder = useUpdateCustomOrder();
  const deleteCustomOrder = useDeleteCustomOrder();
  const { data: settings = defaultShopSettings } = useShopSettings();
  const [feedback, setFeedback] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [editingOrder, setEditingOrder] = useState<CustomOrder | null>(null);
  const [form, setForm] = useState(emptyForm);
  const canManageOrders = user?.role === 'gerant';

  const showSuccess = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(''), 3000);
  };

  const resetForm = () => {
    setEditingOrder(null);
    setForm(emptyForm);
  };

  const handleEdit = (order: CustomOrder) => {
    setEditingOrder(order);
    setErrorMessage('');
    setForm({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      productType: order.productType,
      details: order.details,
      deposit: String(order.deposit),
      totalPrice: String(order.totalPrice),
      dueDate: order.dueDate,
      status: order.status,
    });
  };

  const handleDelete = async (order: CustomOrder) => {
    if (!window.confirm(t('confirmDeleteOrder'))) {
      return;
    }

    try {
      await deleteCustomOrder.mutateAsync(order.id);
      if (editingOrder?.id === order.id) {
        resetForm();
      }
      showSuccess(t('customOrderDeleted'));
    } catch {
      setErrorMessage(t('customOrderDeleteFailed'));
    }
  };

  const handleStatusChange = async (order: CustomOrder, status: CustomOrder['status']) => {
    if (!user || !canManageOrders) {
      return;
    }

    try {
      await updateCustomOrder.mutateAsync({
        id: order.id,
        customerName: order.customerName,
        customerPhone: order.customerPhone,
        productType: order.productType,
        details: order.details,
        deposit: order.deposit,
        totalPrice: order.totalPrice,
        dueDate: order.dueDate,
        status,
        createdBy: user.id,
      });
      showSuccess(t('customOrderStatusUpdated'));
    } catch {
      setErrorMessage(t('customOrderUpdateFailed'));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    if (!user) {
      setErrorMessage(t('operationFailed'));
      return;
    }

    const payload = {
      id: editingOrder?.id,
      customerName: form.customerName.trim(),
      customerPhone: form.customerPhone.trim(),
      productType: form.productType.trim(),
      details: form.details.trim(),
      deposit: Number(form.deposit),
      totalPrice: Number(form.totalPrice),
      dueDate: form.dueDate,
      status: form.status,
      createdBy: user.id,
    };

    try {
      if (editingOrder) {
        await updateCustomOrder.mutateAsync(payload);
        showSuccess(t('customOrderUpdated'));
      } else {
        await createCustomOrder.mutateAsync(payload);
        showSuccess(t('customOrderCreated'));
      }

      resetForm();
    } catch {
      setErrorMessage(editingOrder ? t('customOrderUpdateFailed') : t('customOrderFailed'));
    }
  };

  const saving = createCustomOrder.isPending || updateCustomOrder.isPending;

  return (
    <div className="grid gap-5">
      {feedback ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">{feedback}</div> : null}
      {errorMessage || isError ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{errorMessage || t('customOrdersLoadError')}</div> : null}
      <div className="grid gap-5 xl:grid-cols-[24rem_1fr]">
        <Card className="h-fit p-5">
          <h2 className="mb-4 flex items-center gap-2 text-2xl font-black text-emerald-950">
            {editingOrder ? <Edit size={22} /> : <Plus size={22} />}
            {editingOrder ? t('editOrder') : t('newOrder')}
          </h2>
          <form className="grid gap-4" onSubmit={handleSubmit}>
            <Input label={t('customerName')} value={form.customerName} onChange={(event) => setForm({ ...form, customerName: event.target.value })} required />
            <Input label={t('customerPhone')} value={form.customerPhone} onChange={(event) => setForm({ ...form, customerPhone: event.target.value })} required />
            <Input label={t('customOrder')} value={form.productType} onChange={(event) => setForm({ ...form, productType: event.target.value })} required />
            <label className="form-field">
              <span className="field-label">{t('details')}</span>
              <textarea className="input-control min-h-24" value={form.details} onChange={(event) => setForm({ ...form, details: event.target.value })} required />
            </label>
            <div className="grid gap-4 sm:grid-cols-2">
              <Input label={t('deposit')} type="number" value={form.deposit} onChange={(event) => setForm({ ...form, deposit: event.target.value })} required />
              <Input label={t('total')} type="number" value={form.totalPrice} onChange={(event) => setForm({ ...form, totalPrice: event.target.value })} required />
            </div>
            <Input label={t('dueDate')} type="date" value={form.dueDate} onChange={(event) => setForm({ ...form, dueDate: event.target.value })} required />
            {editingOrder ? (
              <label className="form-field">
                <span className="field-label">{t('status')}</span>
                <select className="input-control" value={form.status} onChange={(event) => setForm({ ...form, status: event.target.value as CustomOrder['status'] })}>
                  {statusOptions.map((status) => (
                    <option key={status} value={status}>{t(status)}</option>
                  ))}
                </select>
              </label>
            ) : null}
            <Button type="submit" icon={<ClipboardCheck size={18} />} disabled={saving || Boolean(editingOrder && !canManageOrders)}>
              {saving ? t('loading') : t('save')}
            </Button>
            {editingOrder ? (
              <Button type="button" variant="ghost" onClick={resetForm}>
                {t('close')}
              </Button>
            ) : null}
          </form>
        </Card>
        <section className="grid gap-3">
          {isLoading ? <Card className="p-4"><p className="font-bold text-slate-600">{t('loading')}</p></Card> : null}
          {!isLoading && orders.length === 0 ? <Card className="p-4"><p className="font-bold text-slate-600">{t('noCustomOrders')}</p></Card> : null}
          {!isLoading && orders.map((order) => (
            <Card key={order.id} className="p-4">
              <div className="flex flex-wrap items-start justify-between gap-3">
                <div>
                  <p className="text-xl font-black text-emerald-950">{order.productType}</p>
                  <p className="font-semibold text-slate-600">{order.customerName} - {order.customerPhone}</p>
                </div>
                <Badge tone={statusTone(order.status)}>{t(order.status)}</Badge>
              </div>
              <p className="mt-3 text-slate-700">{order.details}</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-3">
                <div className="metric-card"><p className="text-sm text-slate-500">{t('deposit')}</p><p className="font-black">{formatCurrency(order.deposit)}</p></div>
                <div className="metric-card"><p className="text-sm text-slate-500">{t('total')}</p><p className="font-black">{formatCurrency(order.totalPrice)}</p></div>
                <div className="metric-card"><p className="text-sm text-slate-500">{t('dueDate')}</p><p className="font-black">{order.dueDate}</p></div>
              </div>
              <div className="mt-4 flex flex-wrap gap-2">
                <Button size="sm" variant="secondary" icon={<Download size={15} />} onClick={() => downloadOrderTicket(order, t(order.status), settings)}>
                  {t('downloadTicket')}
                </Button>
              </div>
              {canManageOrders ? (
                <div className="mt-4 flex flex-wrap gap-2">
                  <label className="min-w-44">
                    <select className="input-control h-10 text-sm" value={order.status} onChange={(event) => handleStatusChange(order, event.target.value as CustomOrder['status'])} disabled={updateCustomOrder.isPending}>
                      {statusOptions.map((status) => (
                        <option key={status} value={status}>{t(status)}</option>
                      ))}
                    </select>
                  </label>
                  <Button size="sm" variant="ghost" icon={<Edit size={15} />} onClick={() => handleEdit(order)}>
                    {t('edit')}
                  </Button>
                  <Button size="sm" variant="danger" icon={<Trash2 size={15} />} onClick={() => handleDelete(order)} disabled={deleteCustomOrder.isPending}>
                    {t('delete')}
                  </Button>
                </div>
              ) : null}
            </Card>
          ))}
        </section>
      </div>
    </div>
  );
}
