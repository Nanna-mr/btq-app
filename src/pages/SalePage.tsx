import { useEffect, useMemo, useRef, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { CreditCard, Download, Minus, Plus, Printer, ReceiptText, Search, Trash2, X } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Badge } from '../components/ui/Badge';
import { formatCurrency } from '../lib/utils';
import { useProducts } from '../hooks/useProducts';
import { useCartStore } from '../stores/cartStore';
import { useAuthStore } from '../stores/authStore';
import { useCheckoutSale, useTodaySalesCount } from '../hooks/useSales';
import type { Product, ProductVariant } from '../types/Product';
import { useCashSessions, useCashSessionSales, useCloseCashSession, useOpenCashSession } from '../hooks/useReports';
import { defaultShopSettings, useShopSettings } from '../hooks/useShopSettings';
import { downloadSaleTicket, type SaleTicket } from '../lib/tickets';

const SEARCH_DELAY = 300;

export function SalePage() {
  const { t } = useTranslation();
  const user = useAuthStore((state) => state.user);
  const { data: products = [], isLoading, error } = useProducts();
  const { data: settings = defaultShopSettings } = useShopSettings();
  const { data: todaySales = 0 } = useTodaySalesCount();
  const { data: cashSessions = [] } = useCashSessions();
  const checkoutSale = useCheckoutSale();
  const openCashSession = useOpenCashSession();
  const closeCashSession = useCloseCashSession();
  const searchRef = useRef<HTMLInputElement | null>(null);
  const items = useCartStore((state) => state.items);
  const discount = useCartStore((state) => state.discount);
  const addItem = useCartStore((state) => state.addItem);
  const updateQuantity = useCartStore((state) => state.updateQuantity);
  const removeItem = useCartStore((state) => state.removeItem);
  const clearCart = useCartStore((state) => state.clearCart);
  const applyDiscount = useCartStore((state) => state.applyDiscount);
  const subtotal = useCartStore((state) => state.subtotal());
  const tax = useCartStore((state) => state.tax());
  const total = useCartStore((state) => state.total());
  const [query, setQuery] = useState('');
  const [debouncedQuery, setDebouncedQuery] = useState('');
  const [category, setCategory] = useState('all');
  const [variantProduct, setVariantProduct] = useState<Product | null>(null);
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'bankily' | 'sedad' | 'card'>('cash');
  const [paidAmount, setPaidAmount] = useState(0);
  const [customerPhone, setCustomerPhone] = useState('');
  const [feedback, setFeedback] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [openingDialogOpen, setOpeningDialogOpen] = useState(false);
  const [closingDialogOpen, setClosingDialogOpen] = useState(false);
  const [openingAmount, setOpeningAmount] = useState(0);
  const [openingNote, setOpeningNote] = useState('');
  const [physicalCash, setPhysicalCash] = useState(0);
  const [latestTicket, setLatestTicket] = useState<SaleTicket | null>(null);
  const activeCashSession = cashSessions.find((session) => !session.closedAt && session.openedBy === user?.id);
  const { data: sessionSales = [] } = useCashSessionSales(activeCashSession?.id);

  useEffect(() => {
    const timeout = window.setTimeout(() => setDebouncedQuery(query), SEARCH_DELAY);
    return () => window.clearTimeout(timeout);
  }, [query]);

  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'F2') {
        event.preventDefault();
        searchRef.current?.focus();
      }

      if (event.key === 'Enter' && checkoutOpen && items.length > 0) {
        event.preventDefault();
        void handleCheckout();
      }

      if (event.key === 'Escape') {
        setVariantProduct(null);
        setCheckoutOpen(false);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  });

  const categories = useMemo(() => ['all', ...Array.from(new Set(products.map((product) => product.category)))], [products]);
  const filteredProducts = useMemo(
    () =>
      products
        .filter((product) => category === 'all' || product.category === category)
        .filter((product) => product.name.toLowerCase().includes(debouncedQuery.toLowerCase()) || product.category.toLowerCase().includes(debouncedQuery.toLowerCase()))
        .slice(0, 18),
    [category, debouncedQuery, products],
  );
  const remainingAmount = Math.max(0, total - paidAmount);
  const sessionTotal = sessionSales.reduce((sum, sale) => sum + sale.total, 0);
  const sessionCash = sessionSales.filter((sale) => sale.paymentMethod === 'cash').reduce((sum, sale) => sum + sale.total, 0);
  const sessionCard = sessionSales.filter((sale) => sale.paymentMethod === 'card').reduce((sum, sale) => sum + sale.total, 0);
  const sessionMobile = sessionSales.filter((sale) => sale.paymentMethod === 'bankily' || sale.paymentMethod === 'sedad').reduce((sum, sale) => sum + sale.total, 0);
  const sessionOther = Math.max(0, sessionTotal - sessionCash - sessionCard - sessionMobile);
  const expectedClosing = (activeCashSession?.openingAmount ?? 0) + sessionCash;
  const closingDifference = physicalCash - expectedClosing;

  const chooseProduct = (product: Product) => {
    const availableVariants = (product.variants ?? []).filter((variant) => variant.stock > 0);

    if (availableVariants.length === 0) {
      setErrorMessage(t('insufficientStock'));
      return;
    }

    if (availableVariants.length === 1) {
      addItem(product, availableVariants[0]);
      return;
    }

    setVariantProduct(product);
  };

  const chooseVariant = (product: Product, variant: ProductVariant) => {
    if (variant.stock <= 0) {
      setErrorMessage(t('insufficientStock'));
      return;
    }

    addItem(product, variant);
    setVariantProduct(null);
  };

  const openCheckout = () => {
    setPaidAmount(total);
    setCheckoutOpen(true);
  };

  const handleOpenCashSession = async () => {
    setErrorMessage('');

    if (!user) {
      return;
    }

    try {
      await openCashSession.mutateAsync({ openedBy: user.id, openingAmount, note: openingNote || 'Ouverture POS' });
      setOpeningDialogOpen(false);
      setOpeningAmount(0);
      setOpeningNote('');
    } catch (error) {
      console.error('Cash session opening failed', error);
      const message = error instanceof Error ? error.message : typeof error === 'object' && error && 'message' in error ? String(error.message) : t('operationFailed');
      setErrorMessage(message || t('operationFailed'));
    }
  };

  const handleCloseCashSession = async () => {
    setErrorMessage('');

    if (!activeCashSession) {
      return;
    }

    try {
      await closeCashSession.mutateAsync({
        id: activeCashSession.id,
        closingAmount: physicalCash,
        note: `Fermeture POS - attendu ${formatCurrency(expectedClosing)} - ecart ${formatCurrency(closingDifference)}`,
      });
      clearCart();
      setCheckoutOpen(false);
      setVariantProduct(null);
      setLatestTicket(null);
      setClosingDialogOpen(false);
      setPhysicalCash(0);
    } catch {
      setErrorMessage(t('operationFailed'));
    }
  };

  const handleCheckout = async () => {
    setErrorMessage('');

    if (!user || items.length === 0 || !activeCashSession) {
      return;
    }

    try {
      const saleTicket = await checkoutSale.mutateAsync({
        sellerId: user.id,
        cashSessionId: activeCashSession.id,
        items,
        paymentMethod,
        subtotal,
        discount,
        tax,
        total,
        paidAmount,
        customerPhone,
      });
      const ticket = { ...saleTicket, sellerName: user.name };
      clearCart();
      setCheckoutOpen(false);
      setCustomerPhone('');
      setPaidAmount(0);
      setLatestTicket(ticket);
    } catch {
      setErrorMessage(t('saleFailed'));
    }
  };

  if (!activeCashSession) {
    return (
      <div className="grid min-h-[calc(100vh-8rem)] place-items-center">
        <Card className="w-full max-w-md p-6 text-center">
          <p className="text-sm font-bold uppercase tracking-wide text-slate-500">{user?.name}</p>
          <h2 className="mt-2 text-4xl font-black text-slate-900">{t('pos')}</h2>
          <Badge tone="slate">{t('noActiveCashSession')}</Badge>
          <p className="mx-auto mt-3 max-w-sm text-sm font-semibold text-slate-500">{t('openCashHint')}</p>
          {errorMessage ? <div className="mt-4 rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{errorMessage}</div> : null}
          <Button className="mt-6 w-full" size="lg" icon={<CreditCard size={18} />} onClick={() => setOpeningDialogOpen(true)} disabled={openCashSession.isPending}>
            {t('openCash')}
          </Button>
        </Card>
        {openingDialogOpen ? (
          <div className="fixed inset-0 z-50 grid place-items-center bg-black/40 p-4">
            <Card className="w-full max-w-lg p-5">
              <div className="mb-5">
                <h3 className="text-2xl font-black text-slate-900">{t('cashOpening')}</h3>
                <p className="mt-1 text-sm font-semibold text-slate-500">{t('cashOpeningHint')}</p>
              </div>
              <div className="grid gap-4">
                <label className="form-field">
                  <span className="field-label">{t('openingAmountFound')}</span>
                  <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                    <input className="input-control" type="number" min={0} value={openingAmount} onChange={(event) => setOpeningAmount(Number(event.target.value))} />
                    <span className="text-sm font-black text-slate-500">MRU</span>
                  </div>
                </label>
                <label className="form-field">
                  <span className="field-label">{t('optionalNote')}</span>
                  <textarea className="input-control min-h-24" value={openingNote} onChange={(event) => setOpeningNote(event.target.value)} />
                </label>
                <div className="flex justify-end gap-2">
                  <Button variant="ghost" onClick={() => setOpeningDialogOpen(false)}>{t('close')}</Button>
                  <Button onClick={handleOpenCashSession} disabled={openCashSession.isPending}>
                    {openCashSession.isPending ? t('loading') : t('confirm')}
                  </Button>
                </div>
              </div>
            </Card>
          </div>
        ) : null}
      </div>
    );
  }

  return (
    <div className="pos-workspace">
      <section className="pos-product-panel">
        <div className="pos-topbar">
          <div className="pos-register-name">
            <span>{user?.name}</span>
            <strong>{t('pos')}</strong>
          </div>
          <div className="pos-session-metrics">
            <div>
              <span>{t('todaySales')}</span>
              <strong>{todaySales}</strong>
            </div>
            <div>
              <span>{t('sessionTotal')}</span>
              <strong>{formatCurrency(sessionTotal)}</strong>
            </div>
            <Button variant="danger" onClick={() => { setPhysicalCash(expectedClosing); setClosingDialogOpen(true); }} disabled={closeCashSession.isPending}>
              {t('closeCash')}
            </Button>
          </div>
        </div>
        <div className="pos-searchbar">
          <Search size={18} />
          <input ref={searchRef} value={query} onChange={(event) => setQuery(event.target.value)} placeholder={`${t('search')} · F2`} />
        </div>
        <div className="pos-category-tabs">
          {categories.map((item) => (
            <Button key={item} variant={category === item ? 'primary' : 'secondary'} size="sm" onClick={() => setCategory(item)}>
              {item === 'all' ? t('all') : item}
            </Button>
          ))}
        </div>
        {feedback ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">{feedback}</div> : null}
        {errorMessage ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{errorMessage}</div> : null}
        {error ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{t('productsLoadError')}</div> : null}
        {isLoading ? <div className="content-card p-4 font-bold text-slate-500">{t('loading')}</div> : null}
        {!isLoading && filteredProducts.length === 0 ? <div className="content-card p-4 font-bold text-slate-500">{t('noProducts')}</div> : null}
        <div className="pos-product-grid">
          {filteredProducts.map((product) => (
            <button
              key={product.id}
              className="pos-product-card"
              disabled={product.stock === 0}
              onClick={() => chooseProduct(product)}
            >
              <img src={product.imageUrl} alt={product.name} />
              <div>
                <div>
                  <p>{product.name}</p>
                  <span>{product.category}</span>
                </div>
                <Badge tone={product.stock > 5 ? 'green' : product.stock > 0 ? 'amber' : 'red'}>{product.stock}</Badge>
              </div>
              <strong>{formatCurrency(product.price)}</strong>
            </button>
          ))}
        </div>
      </section>
      <Card className="pos-cart-panel">
        <div className="pos-cart-header">
          <h2>{t('cart')} <span>{items.length}</span></h2>
          <Button variant="ghost" icon={<Trash2 size={17} />} onClick={clearCart}>{t('clear')}</Button>
        </div>
        <div className="pos-customer-strip">
          <span>{customerPhone || 'Client comptoir'}</span>
          <button type="button" onClick={() => setCustomerPhone('')}>×</button>
        </div>
        <div className="pos-cart-items">
          {items.length === 0 ? (
            <p className="pos-empty-cart">{t('emptyCart')}</p>
          ) : (
            items.map((item) => (
              <div key={item.variantId} className="pos-cart-item">
                <div className="flex justify-between gap-3">
                  <div>
                    <p>{item.name}</p>
                    <span>{item.sku}</span>
                  </div>
                  <strong>{formatCurrency(item.unitPrice * item.quantity)}</strong>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Button size="sm" variant="ghost" icon={<Minus size={15} />} onClick={() => updateQuantity(item.variantId, item.quantity - 1)} />
                    <span className="w-8 text-center font-black">{item.quantity}</span>
                    <Button size="sm" variant="ghost" icon={<Plus size={15} />} onClick={() => updateQuantity(item.variantId, item.quantity + 1)} />
                  </div>
                  <Button size="sm" variant="danger" icon={<Trash2 size={15} />} onClick={() => removeItem(item.variantId)} />
                </div>
              </div>
            ))
          )}
        </div>
        <div className="pos-cart-summary">
          <label className="form-field">
            <span className="field-label">{t('discount')}</span>
            <input className="input-control" type="number" min={0} value={discount} onChange={(event) => applyDiscount(Number(event.target.value))} />
          </label>
          <div className="grid gap-2 text-sm">
            <p className="flex justify-between"><span>{t('subtotal')}</span><strong>{formatCurrency(subtotal)}</strong></p>
            <p className="flex justify-between"><span>TVA</span><strong>{formatCurrency(tax)}</strong></p>
            <p className="flex justify-between text-xl font-black text-emerald-950"><span>{t('total')}</span><strong>{formatCurrency(total)}</strong></p>
          </div>
          <Button size="lg" icon={<CreditCard size={18} />} disabled={items.length === 0} onClick={openCheckout}>{t('checkout')}</Button>
        </div>
      </Card>
      {variantProduct ? (
        <div className="fixed inset-0 z-20 grid place-items-center bg-emerald-950/50 p-4">
          <Card className="w-full max-w-xl p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-2xl font-black text-emerald-950">{t('chooseVariant')}</h3>
              <Button variant="ghost" onClick={() => setVariantProduct(null)}>{t('close')}</Button>
            </div>
            <div className="grid gap-3">
              {(variantProduct.variants ?? []).map((variant) => (
                <button key={variant.id} className="flex items-center justify-between rounded-lg border border-slate-200 p-3 text-start disabled:cursor-not-allowed disabled:opacity-50" disabled={variant.stock <= 0} onClick={() => chooseVariant(variantProduct, variant)}>
                  <span>
                    <strong className="block text-emerald-950">{variant.color} · {variant.size}</strong>
                    <span className="text-sm font-semibold text-slate-500">{variant.sku}</span>
                  </span>
                  <Badge tone={variant.stock > 5 ? 'green' : variant.stock > 0 ? 'amber' : 'red'}>{variant.stock}</Badge>
                </button>
              ))}
            </div>
          </Card>
        </div>
      ) : null}
      {checkoutOpen ? (
        <div className="fixed inset-0 z-20 grid place-items-center bg-emerald-950/50 p-4">
          <Card className="w-full max-w-lg p-5">
            <div className="mb-4 flex items-center justify-between gap-3">
              <h3 className="text-2xl font-black text-emerald-950">{t('checkout')}</h3>
              <Button variant="ghost" onClick={() => setCheckoutOpen(false)}>{t('close')}</Button>
            </div>
            <div className="grid gap-4">
              <label className="form-field">
                <span className="field-label">{t('payment')}</span>
                <select className="input-control" value={paymentMethod} onChange={(event) => setPaymentMethod(event.target.value as typeof paymentMethod)}>
                  <option value="cash">{t('cash')}</option>
                  <option value="bankily">Bankily</option>
                  <option value="sedad">Sedad</option>
                  <option value="card">{t('card')}</option>
                </select>
              </label>
              <label className="form-field">
                <span className="field-label">{t('paidAmount')}</span>
                <input className="input-control" type="number" min={0} value={paidAmount} onChange={(event) => setPaidAmount(Number(event.target.value))} />
              </label>
              <label className="form-field">
                <span className="field-label">{t('customerPhoneOptional')}</span>
                <input className="input-control" value={customerPhone} onChange={(event) => setCustomerPhone(event.target.value)} />
              </label>
              <div className="rounded-lg bg-emerald-50 p-4 text-sm font-bold text-emerald-950">
                <p className="flex justify-between"><span>{t('total')}</span><span>{formatCurrency(total)}</span></p>
                <p className="flex justify-between"><span>{t('remainingAmount')}</span><span>{formatCurrency(remainingAmount)}</span></p>
              </div>
              <Button size="lg" icon={<ReceiptText size={18} />} disabled={checkoutSale.isPending} onClick={handleCheckout}>
                {checkoutSale.isPending ? t('loading') : t('validateSale')}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
      {latestTicket ? (
        <div className="fixed inset-0 z-[70] grid place-items-center bg-black/45 p-4">
          <Card className="max-h-[92vh] w-full max-w-md overflow-y-auto p-0">
            <div className="flex items-center justify-between gap-3 bg-slate-950 px-5 py-4 text-white">
              <div>
                <p className="text-xs font-bold uppercase tracking-wide">{t('saleTicket')}</p>
                <p className="text-2xl font-black">#{latestTicket.id.slice(0, 8).toUpperCase()}</p>
              </div>
              <Button variant="ghost" icon={<X size={18} />} onClick={() => setLatestTicket(null)}>
                {t('close')}
              </Button>
            </div>
            <div className="p-5">
              <div className="mb-4 border-b border-dashed border-slate-300 pb-4 text-center">
                {settings.logoUrl ? <img className="mx-auto mb-3 max-h-20 max-w-36 object-contain" src={settings.logoUrl} alt={settings.shopName} /> : null}
                <p className="text-2xl font-black text-slate-950">{settings.shopName}</p>
                {settings.address ? <p className="text-xs font-semibold text-slate-500">{settings.address}</p> : null}
                {settings.phone ? <p className="text-xs font-semibold text-slate-500">{settings.phone}</p> : null}
              </div>
              <div className="grid gap-1 border-b border-dashed border-slate-300 pb-4 text-sm font-semibold text-slate-600">
                <p className="flex justify-between gap-3"><span>{t('date')}</span><span>{new Date(latestTicket.createdAt).toLocaleString('fr-FR')}</span></p>
                <p className="flex justify-between gap-3"><span>{t('seller')}</span><span>{latestTicket.sellerName || '-'}</span></p>
                <p className="flex justify-between gap-3"><span>{t('customerPhone')}</span><span>{latestTicket.customerPhone || '-'}</span></p>
                <p className="flex justify-between gap-3"><span>{t('payment')}</span><span>{latestTicket.paymentMethod}</span></p>
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
                    {latestTicket.items.map((item) => (
                      <tr key={item.variantId} className="align-top">
                        <td className="py-2">
                          <p className="font-black text-slate-950">{item.name}</p>
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
                <p className="flex justify-between"><span>{t('subtotal')}</span><strong>{formatCurrency(latestTicket.subtotal)}</strong></p>
                <p className="flex justify-between"><span>{t('discount')}</span><strong>{formatCurrency(latestTicket.discount)}</strong></p>
                <p className="flex justify-between"><span>TVA</span><strong>{formatCurrency(latestTicket.tax)}</strong></p>
                <p className="flex justify-between text-xl font-black text-slate-950"><span>{t('total')}</span><strong>{formatCurrency(latestTicket.total)}</strong></p>
                <p className="flex justify-between"><span>{t('paidAmount')}</span><strong>{formatCurrency(latestTicket.paidAmount)}</strong></p>
                <p className="flex justify-between"><span>{t('remainingAmount')}</span><strong>{formatCurrency(Math.max(0, latestTicket.total - latestTicket.paidAmount))}</strong></p>
              </div>
              <p className="pt-4 text-center text-sm font-bold text-slate-500">{settings.footerMessage}</p>
            </div>
            <div className="grid gap-2 border-t border-slate-200 p-4 sm:grid-cols-3">
              <Button icon={<Download size={18} />} onClick={() => downloadSaleTicket(latestTicket, settings)}>
                {t('downloadPdf')}
              </Button>
              <Button variant="ghost" icon={<Printer size={18} />} onClick={() => window.print()}>
                {t('printTicket')}
              </Button>
              <Button variant="secondary" icon={<ReceiptText size={18} />} onClick={() => setLatestTicket(null)}>
                {t('newSale')}
              </Button>
            </div>
          </Card>
        </div>
      ) : null}
      {closingDialogOpen ? (
        <div className="fixed inset-0 z-[60] grid place-items-center bg-black/40 p-4">
          <Card className="w-full max-w-2xl p-5">
            <div className="mb-5">
              <h3 className="text-2xl font-black text-slate-900">{t('cashClosing')}</h3>
              <p className="mt-1 text-sm font-semibold text-slate-500">{t('cashClosingHint')}</p>
            </div>
            <div className="grid gap-4 md:grid-cols-2">
              <div className="metric-card"><p className="text-sm font-bold text-slate-500">{t('openingAmount')}</p><p className="text-xl font-black text-slate-900">{formatCurrency(activeCashSession.openingAmount)}</p></div>
              <div className="metric-card"><p className="text-sm font-bold text-slate-500">{t('totalSales')}</p><p className="text-xl font-black text-slate-900">{formatCurrency(sessionTotal)}</p></div>
              <div className="metric-card"><p className="text-sm font-bold text-slate-500">{t('cashSales')}</p><p className="text-xl font-black text-slate-900">{formatCurrency(sessionCash)}</p></div>
              <div className="metric-card"><p className="text-sm font-bold text-slate-500">{t('cardSales')}</p><p className="text-xl font-black text-slate-900">{formatCurrency(sessionCard)}</p></div>
              <div className="metric-card"><p className="text-sm font-bold text-slate-500">{t('mobileSales')}</p><p className="text-xl font-black text-slate-900">{formatCurrency(sessionMobile)}</p></div>
              <div className="metric-card"><p className="text-sm font-bold text-slate-500">{t('otherPayments')}</p><p className="text-xl font-black text-slate-900">{formatCurrency(sessionOther)}</p></div>
              <div className="metric-card"><p className="text-sm font-bold text-slate-500">{t('refunds')}</p><p className="text-xl font-black text-slate-900">{formatCurrency(0)}</p></div>
              <div className="metric-card"><p className="text-sm font-bold text-slate-500">{t('expectedCash')}</p><p className="text-xl font-black text-slate-900">{formatCurrency(expectedClosing)}</p></div>
            </div>
            <div className="mt-5 grid gap-4">
              <label className="form-field">
                <span className="field-label">{t('physicalCashCounted')}</span>
                <div className="grid grid-cols-[1fr_auto] items-center gap-2">
                  <input className="input-control" type="number" min={0} value={physicalCash} onChange={(event) => setPhysicalCash(Number(event.target.value))} />
                  <span className="text-sm font-black text-slate-500">MRU</span>
                </div>
              </label>
              <div className="rounded-md border border-slate-200 bg-slate-50 p-3 text-sm font-bold text-slate-700">
                <p className="flex justify-between"><span>{t('difference')}</span><span>{formatCurrency(closingDifference)}</span></p>
              </div>
              <div className="flex justify-end gap-2">
                <Button variant="ghost" onClick={() => setClosingDialogOpen(false)}>{t('close')}</Button>
                <Button onClick={handleCloseCashSession} disabled={closeCashSession.isPending}>{closeCashSession.isPending ? t('loading') : t('validateAndClose')}</Button>
              </div>
            </div>
          </Card>
        </div>
      ) : null}
    </div>
  );
}
