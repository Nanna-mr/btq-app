import { useMemo, useState } from 'react';
import { Download } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useSalesReport } from '../hooks/useReports';
import { downloadCsv } from '../lib/csv';
import { formatCurrency } from '../lib/utils';

export function SalesReportPage() {
  const { t } = useTranslation();
  const [period, setPeriod] = useState<'today' | 'month' | 'all'>('today');
  const { data: sales = [], isLoading, isError } = useSalesReport(period);
  const totals = useMemo(() => {
    const byPayment = new Map<string, number>();
    for (const sale of sales) {
      byPayment.set(sale.paymentMethod, (byPayment.get(sale.paymentMethod) ?? 0) + sale.total);
    }
    return {
      revenue: sales.reduce((sum, sale) => sum + sale.total, 0),
      average: sales.length ? sales.reduce((sum, sale) => sum + sale.total, 0) / sales.length : 0,
      byPayment: Array.from(byPayment.entries()),
    };
  }, [sales]);

  const exportSales = () => {
    downloadCsv(
      `ventes-${period}.csv`,
      sales.map((sale) => ({
        id: sale.id,
        date: new Date(sale.createdAt).toLocaleString('fr-FR'),
        vendeur: sale.sellerName,
        paiement: sale.paymentMethod,
        client: sale.customerPhone,
        sous_total: sale.subtotal,
        remise: sale.discount,
        tva: sale.tax,
        total: sale.total,
      })),
    );
  };

  return (
    <div className="erp-page grid gap-5">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <p className="font-semibold text-emerald-800">{t('salesReports')}</p>
          <h2 className="text-3xl font-black text-emerald-950">{formatCurrency(totals.revenue)}</h2>
        </div>
        <div className="flex flex-wrap gap-2">
          {(['today', 'month', 'all'] as const).map((item) => (
            <Button key={item} variant={period === item ? 'primary' : 'secondary'} onClick={() => setPeriod(item)}>
              {t(item)}
            </Button>
          ))}
          <Button icon={<Download size={18} />} onClick={exportSales} disabled={sales.length === 0}>
            CSV
          </Button>
        </div>
      </div>
      {isError ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{t('reportsLoadError')}</div> : null}
      <section className="grid gap-3 md:grid-cols-3">
        <div className="metric-card"><p className="text-sm font-bold text-slate-500">{t('salesCount')}</p><p className="text-2xl font-black text-emerald-950">{sales.length}</p></div>
        <div className="metric-card"><p className="text-sm font-bold text-slate-500">{t('averageBasket')}</p><p className="text-2xl font-black text-emerald-950">{formatCurrency(totals.average)}</p></div>
        <div className="metric-card"><p className="text-sm font-bold text-slate-500">{t('payment')}</p><p className="text-sm font-black text-emerald-950">{totals.byPayment.map(([key, value]) => `${key}: ${formatCurrency(value)}`).join(' | ') || '-'}</p></div>
      </section>
      <Card className="p-4">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('date')}</th>
                <th>{t('seller')}</th>
                <th>{t('payment')}</th>
                <th>{t('customerPhone')}</th>
                <th>{t('total')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={5}>{t('loading')}</td></tr>
              ) : sales.length === 0 ? (
                <tr><td colSpan={5}>{t('noSales')}</td></tr>
              ) : (
                sales.map((sale) => (
                  <tr key={sale.id}>
                    <td>{new Date(sale.createdAt).toLocaleString('fr-FR')}</td>
                    <td>{sale.sellerName}</td>
                    <td><Badge>{sale.paymentMethod}</Badge></td>
                    <td>{sale.customerPhone || '-'}</td>
                    <td className="font-black text-emerald-950">{formatCurrency(sale.total)}</td>
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
