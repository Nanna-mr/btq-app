import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Banknote, ClipboardList, ShoppingBag } from 'lucide-react';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatCurrency } from '../lib/utils';
import { useProducts } from '../hooks/useProducts';
import { useDashboardMetrics } from '../hooks/useDashboardMetrics';

export function DashboardPage() {
  const { t } = useTranslation();
  const { data: products = [], isLoading: productsLoading } = useProducts();
  const { data: metrics = { revenue: 0, todaySales: 0, pendingOrders: 0 }, isLoading: metricsLoading } = useDashboardMetrics();
  const lowStockProducts = useMemo(() => products.filter((product) => product.stock <= 5), [products]);
  const inventoryValue = useMemo(() => products.reduce((sum, product) => sum + product.price * product.stock, 0), [products]);
  const categoryCounts = useMemo(() => {
    const counts = new Map<string, number>();

    for (const product of products) {
      counts.set(product.category, (counts.get(product.category) ?? 0) + 1);
    }

    return Array.from(counts.entries()).slice(0, 7);
  }, [products]);

  const stats = [
    { label: t('revenue'), value: formatCurrency(metrics.revenue), icon: Banknote },
    { label: t('todaySales'), value: String(metrics.todaySales), icon: ShoppingBag },
    { label: t('pendingOrders'), value: String(metrics.pendingOrders), icon: ClipboardList },
    { label: t('lowStock'), value: String(lowStockProducts.length), icon: AlertTriangle },
    { label: t('inventoryValue'), value: formatCurrency(inventoryValue), icon: Banknote },
  ];

  return (
    <div className="grid gap-5">
      {(productsLoading || metricsLoading) ? <div className="content-card p-4 font-bold text-slate-500">{t('loading')}</div> : null}
      <section className="grid gap-3 md:grid-cols-2 xl:grid-cols-5">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <div className="metric-card" key={stat.label}>
              <div className="mb-4 flex h-11 w-11 items-center justify-center rounded-lg bg-emerald-100 text-emerald-900">
                <Icon size={22} />
              </div>
              <p className="text-sm font-bold text-slate-500">{stat.label}</p>
              <p className="mt-1 text-2xl font-black text-emerald-950">{stat.value}</p>
            </div>
          );
        })}
      </section>
      <div className="grid gap-5 xl:grid-cols-[1fr_22rem]">
        <Card className="p-4">
          <h2 className="mb-4 text-2xl font-black text-emerald-950">{t('productsByCategory')}</h2>
          {categoryCounts.length === 0 ? (
            <p className="rounded-lg bg-slate-50 p-4 text-sm font-semibold text-slate-500">{t('noProducts')}</p>
          ) : (
            <div className="grid h-80 items-end gap-3 sm:grid-cols-7">
              {categoryCounts.map(([category, count]) => (
                <div className="grid gap-2" key={category}>
                  <div className="rounded-t-lg bg-emerald-800" style={{ height: `${Math.max(24, count * 34)}px` }} />
                  <p className="text-center text-xs font-bold text-slate-500">{category}</p>
                </div>
              ))}
            </div>
          )}
        </Card>
        <Card className="p-4">
          <h2 className="mb-4 text-2xl font-black text-emerald-950">{t('lowStock')}</h2>
          <div className="grid gap-3">
            {lowStockProducts.length === 0 ? (
              <p className="rounded-lg bg-slate-50 p-4 text-sm font-semibold text-slate-500">{t('noStockAlerts')}</p>
            ) : (
              lowStockProducts.map((product) => (
                <div key={product.id} className="flex items-center justify-between gap-3 rounded-lg border border-slate-200 p-3">
                  <div>
                    <p className="font-bold text-emerald-950">{product.name}</p>
                    <p className="text-sm text-slate-500">{product.category}</p>
                  </div>
                  <Badge tone={product.stock === 0 ? 'red' : 'amber'}>{product.stock}</Badge>
                </div>
              ))
            )}
          </div>
        </Card>
      </div>
    </div>
  );
}
