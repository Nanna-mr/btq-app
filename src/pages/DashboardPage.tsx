import { useMemo } from 'react';
import { useTranslation } from 'react-i18next';
import { AlertTriangle, Banknote, ClipboardList, Package, ShoppingBag } from 'lucide-react';
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
  const categoryStockValues = useMemo(() => {
    const values = new Map<string, number>();

    for (const product of products) {
      values.set(product.category, (values.get(product.category) ?? 0) + product.price * product.stock);
    }

    return values;
  }, [products]);
  const maxCategoryCount = Math.max(1, ...categoryCounts.map(([, count]) => count));
  const donutTotal = metrics.todaySales + metrics.pendingOrders + lowStockProducts.length;
  const safeDonutTotal = Math.max(1, donutTotal);
  const ordersSlice = ((metrics.todaySales + metrics.pendingOrders) / safeDonutTotal) * 100;
  const safeSalesSlice = (metrics.todaySales / safeDonutTotal) * 100;
  const segmentPercent = (value: number) => Math.round((value / safeDonutTotal) * 100);
  const donutStyle = {
    background: `conic-gradient(#245f5b 0 ${safeSalesSlice}%, #4a8780 ${safeSalesSlice}% ${ordersSlice}%, #d9d9d9 ${ordersSlice}% 100%)`,
  };
  const yAxisSteps = [maxCategoryCount, Math.ceil(maxCategoryCount * 0.75), Math.ceil(maxCategoryCount * 0.5), Math.ceil(maxCategoryCount * 0.25), 0];

  const stats = [
    { label: t('revenue'), value: formatCurrency(metrics.revenue), icon: Banknote },
    { label: t('todaySales'), value: String(metrics.todaySales), icon: ShoppingBag },
    { label: t('pendingOrders'), value: String(metrics.pendingOrders), icon: ClipboardList },
    { label: t('inventoryValue'), value: formatCurrency(inventoryValue), icon: Package },
  ];

  return (
    <div className="dashboard-cummo">
      {(productsLoading || metricsLoading) ? <div className="content-card p-4 font-bold text-slate-500">{t('loading')}</div> : null}
      <div className="dashboard-top-grid">
        <section className="dashboard-stat-grid">
          {stats.map((stat) => {
            const Icon = stat.icon;
            return (
              <Card className="dashboard-stat-card" key={stat.label}>
                <div className="dashboard-stat-icon">
                  <Icon size={24} />
                </div>
                <p>{stat.label}</p>
                <strong>{stat.value}</strong>
              </Card>
            );
          })}
        </section>
        <aside className="stock-alert-window">
          <div className="stock-alert-title">
            <AlertTriangle size={22} />
            <h2>{t('lowStock')}</h2>
          </div>
          <div className="stock-alert-scroll">
            {lowStockProducts.length === 0 ? (
              <p className="stock-alert-empty">{t('noStockAlerts')}</p>
            ) : (
              lowStockProducts.map((product) => (
                <div key={product.id} className="stock-alert-item">
                  <div>
                    <p>{product.name}</p>
                    <span>{product.category}</span>
                  </div>
                  <Badge tone={product.stock === 0 ? 'red' : 'amber'}>{product.stock}</Badge>
                </div>
              ))
            )}
          </div>
        </aside>
      </div>
      <div className="dashboard-chart-grid">
        <Card className="dashboard-donut-card">
          <h2>statistique</h2>
          <div
            className="dashboard-donut"
            style={donutStyle}
            title={`${t('todaySales')}: ${metrics.todaySales} (${segmentPercent(metrics.todaySales)}%) · ${t('pendingOrders')}: ${metrics.pendingOrders} (${segmentPercent(metrics.pendingOrders)}%) · ${t('lowStock')}: ${lowStockProducts.length} (${segmentPercent(lowStockProducts.length)}%)`}
          >
            <span>
              <strong>{donutTotal}</strong>
              <small>Total</small>
            </span>
          </div>
          <div className="dashboard-donut-legend">
            <p className="dashboard-legend-sales"><i aria-hidden="true" /><span>{t('todaySales')} · {segmentPercent(metrics.todaySales)}%</span></p>
            <p className="dashboard-legend-orders"><i aria-hidden="true" /><span>{t('pendingOrders')} · {segmentPercent(metrics.pendingOrders)}%</span></p>
            <p className="dashboard-legend-alerts"><i aria-hidden="true" /><span>{t('lowStock')} · {segmentPercent(lowStockProducts.length)}%</span></p>
          </div>
        </Card>
        <Card className="dashboard-bar-card">
          <div className="dashboard-card-heading">
            <h2>{t('productsByCategory')}</h2>
            <span>View<br />all →</span>
          </div>
          {categoryCounts.length === 0 ? (
            <p className="rounded-lg bg-slate-50 p-4 text-sm font-semibold text-slate-500">{t('noProducts')}</p>
          ) : (
            <div className="dashboard-bar-plot">
              <div className="dashboard-bar-axis">
                {yAxisSteps.map((step) => (
                  <span key={step}>{step}</span>
                ))}
              </div>
              <div className="dashboard-bars">
                {categoryCounts.map(([category, count], index) => {
                  const height = Math.max(30, (count / maxCategoryCount) * 240);
                  const isPrimary = count === maxCategoryCount || index === Math.min(4, categoryCounts.length - 1);

                  return (
                    <div className="dashboard-bar-column" key={category}>
                    <div
                      className={isPrimary ? 'dashboard-bar dashboard-bar-primary' : 'dashboard-bar'}
                      style={{ height: `${height}px` }}
                      title={`${category}: ${count} ${t('products').toLowerCase()} · ${formatCurrency(categoryStockValues.get(category) ?? 0)}`}
                    >
                        <span>{count}</span>
                      </div>
                      <p>{category}</p>
                      <small>{formatCurrency(categoryStockValues.get(category) ?? 0)}</small>
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
