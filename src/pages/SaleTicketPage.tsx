import { Navigate, useLocation, useNavigate } from 'react-router-dom';
import { Download, Printer, ShoppingCart } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { downloadSaleTicket, type SaleTicket } from '../lib/tickets';
import { formatCurrency } from '../lib/utils';
import { defaultShopSettings, useShopSettings } from '../hooks/useShopSettings';

interface TicketLocationState {
  ticket?: SaleTicket;
}

export function SaleTicketPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const ticket = (location.state as TicketLocationState | null)?.ticket;
  const { data: settings = defaultShopSettings } = useShopSettings();

  if (!ticket) {
    return <Navigate to="/vente" replace />;
  }

  return (
    <div className="grid min-h-[calc(100vh-6rem)] place-items-center">
      <div className="grid w-full max-w-md gap-4">
        <Card className="overflow-hidden p-0 print:border-0 print:shadow-none">
          <div className="bg-emerald-950 px-5 py-4 text-white print:bg-white print:text-emerald-950">
            <p className="text-xs font-bold uppercase tracking-wide">{t('saleTicket')}</p>
            <p className="text-2xl font-black">#{ticket.id.slice(0, 8).toUpperCase()}</p>
          </div>
          <div className="p-5">
          <div className="mb-4 border-b border-dashed border-slate-300 pb-4 text-center">
            {settings.logoUrl ? <img className="mx-auto mb-3 max-h-20 max-w-36 object-contain" src={settings.logoUrl} alt={settings.shopName} /> : null}
            <p className="text-2xl font-black text-emerald-950">{settings.shopName}</p>
            {settings.address ? <p className="text-xs font-semibold text-slate-500">{settings.address}</p> : null}
            {settings.phone ? <p className="text-xs font-semibold text-slate-500">{settings.phone}</p> : null}
          </div>
          <div className="grid gap-1 border-b border-dashed border-slate-300 pb-4 text-sm font-semibold text-slate-600">
            <p className="flex justify-between gap-3"><span>{t('date')}</span><span>{new Date(ticket.createdAt).toLocaleString('fr-FR')}</span></p>
            <p className="flex justify-between gap-3"><span>{t('seller')}</span><span>{ticket.sellerName || '-'}</span></p>
            <p className="flex justify-between gap-3"><span>{t('customerPhone')}</span><span>{ticket.customerPhone || '-'}</span></p>
            <p className="flex justify-between gap-3"><span>{t('payment')}</span><span>{ticket.paymentMethod}</span></p>
          </div>
          <div className="border-b border-dashed border-slate-300 py-4">
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs uppercase text-slate-500">
                  <th className="pb-2">{t('products')}</th>
                  <th className="pb-2 text-center">{t('quantity')}</th>
                  <th className="pb-2 text-right">{t('total')}</th>
                </tr>
              </thead>
              <tbody>
                {ticket.items.map((item) => (
                  <tr key={item.variantId} className="align-top">
                    <td className="py-2">
                      <p className="font-black text-emerald-950">{item.name}</p>
                      <p className="text-xs font-semibold text-slate-500">{item.sku}</p>
                    </td>
                    <td className="py-2 text-center font-bold">{item.quantity}</td>
                    <td className="py-2 text-right font-black">{formatCurrency(item.unitPrice * item.quantity)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="grid gap-2 border-b border-dashed border-slate-300 py-4 text-sm">
            <p className="flex justify-between"><span>{t('subtotal')}</span><strong>{formatCurrency(ticket.subtotal)}</strong></p>
            <p className="flex justify-between"><span>{t('discount')}</span><strong>{formatCurrency(ticket.discount)}</strong></p>
            <p className="flex justify-between"><span>TVA</span><strong>{formatCurrency(ticket.tax)}</strong></p>
            <p className="flex justify-between text-xl font-black text-emerald-950"><span>{t('total')}</span><strong>{formatCurrency(ticket.total)}</strong></p>
            <p className="flex justify-between"><span>{t('paidAmount')}</span><strong>{formatCurrency(ticket.paidAmount)}</strong></p>
            <p className="flex justify-between"><span>{t('remainingAmount')}</span><strong>{formatCurrency(Math.max(0, ticket.total - ticket.paidAmount))}</strong></p>
          </div>
          <p className="pt-4 text-center text-sm font-bold text-slate-500">{settings.footerMessage}</p>
          </div>
        </Card>
        <div className="grid gap-2 sm:grid-cols-3 print:hidden">
          <Button icon={<Download size={18} />} onClick={() => downloadSaleTicket(ticket, settings)}>
            {t('downloadPdf')}
          </Button>
          <Button variant="ghost" icon={<Printer size={18} />} onClick={() => window.print()}>
            {t('printTicket')}
          </Button>
          <Button variant="secondary" icon={<ShoppingCart size={18} />} onClick={() => navigate('/vente')}>
            {t('newSale')}
          </Button>
        </div>
      </div>
    </div>
  );
}
