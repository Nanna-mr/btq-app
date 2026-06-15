import { useTranslation } from 'react-i18next';
import { AlertTriangle } from 'lucide-react';
import { Badge } from '../components/ui/Badge';
import { Card } from '../components/ui/Card';
import { useProducts } from '../hooks/useProducts';

const LOW_STOCK_THRESHOLD = 5;

export function StockAlertsPage() {
  const { t } = useTranslation();
  const { data: products = [], isLoading } = useProducts();
  const lowStockProducts = products.filter((product) => product.stock < LOW_STOCK_THRESHOLD);

  return (
    <div className="grid gap-5">
      <div>
        <p className="font-semibold text-red-700">{t('lowStock')}</p>
        <h2 className="text-3xl font-black text-emerald-950">{lowStockProducts.length} {t('alerts')}</h2>
      </div>
      <Card className="p-4">
        <div className="table-wrap">
          <table className="data-table">
            <thead>
              <tr>
                <th>{t('products')}</th>
                <th>{t('category')}</th>
                <th>{t('stock')}</th>
                <th>{t('status')}</th>
              </tr>
            </thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={4}>{t('loading')}</td></tr>
              ) : lowStockProducts.length === 0 ? (
                <tr><td colSpan={4}>{t('noStockAlerts')}</td></tr>
              ) : (
                lowStockProducts.map((product) => (
                  <tr key={product.id}>
                    <td className="font-bold text-emerald-950">
                      <span className="inline-flex items-center gap-2"><AlertTriangle size={17} className="text-red-700" />{product.name}</span>
                    </td>
                    <td>{product.category}</td>
                    <td>{product.stock}</td>
                    <td><Badge tone="red">{product.stock === 0 ? t('out') : t('lowStockBadge')}</Badge></td>
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
