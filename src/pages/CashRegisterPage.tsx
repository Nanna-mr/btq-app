import { useMemo, useState } from 'react';
import { CheckCircle2, WalletCards } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Badge } from '../components/ui/Badge';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { useCashSessions, useCashSessionSales, useCloseCashSession } from '../hooks/useReports';
import { formatCurrency } from '../lib/utils';

function paymentTone(method: string) {
  return method === 'cash' ? 'green' : method === 'card' ? 'slate' : 'amber';
}

export function CashRegisterPage() {
  const { t } = useTranslation();
  const { data: sessions = [], isLoading } = useCashSessions();
  const closeSession = useCloseCashSession();
  const [errorMessage, setErrorMessage] = useState('');
  const activeSession = sessions.find((session) => !session.closedAt);
  const { data: sessionSales = [] } = useCashSessionSales(activeSession?.id);

  const totals = useMemo(() => {
    const paymentTotals = new Map<string, number>();

    for (const sale of sessionSales) {
      paymentTotals.set(sale.paymentMethod, (paymentTotals.get(sale.paymentMethod) ?? 0) + sale.total);
    }

    const cashSales = paymentTotals.get('cash') ?? 0;

    return {
      totalSales: sessionSales.reduce((sum, sale) => sum + sale.total, 0),
      cashSales,
      cardSales: paymentTotals.get('card') ?? 0,
      mobileSales: (paymentTotals.get('bankily') ?? 0) + (paymentTotals.get('sedad') ?? 0),
      refunds: 0,
      expenses: 0,
      adjustments: 0,
      expectedClosing: (activeSession?.openingAmount ?? 0) + cashSales,
      paymentTotals: Array.from(paymentTotals.entries()),
    };
  }, [activeSession?.openingAmount, sessionSales]);

  const handleClose = async () => {
    if (!activeSession) {
      return;
    }

    setErrorMessage('');

    try {
      await closeSession.mutateAsync({
        id: activeSession.id,
        closingAmount: totals.expectedClosing,
        note: `Validation automatique - ventes ${formatCurrency(totals.totalSales)}`,
      });
    } catch {
      setErrorMessage(t('operationFailed'));
    }
  };

  return (
    <div className="grid gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm font-bold uppercase tracking-wide text-slate-500">{t('cashRegister')}</p>
          <h2 className="text-3xl font-black text-slate-900">{activeSession ? t('activeCashSession') : t('noActiveCashSession')}</h2>
        </div>
        {activeSession ? (
          <Button icon={<CheckCircle2 size={18} />} onClick={handleClose} disabled={closeSession.isPending}>
            {closeSession.isPending ? t('loading') : t('validateAndClose')}
          </Button>
        ) : null}
      </div>

      {errorMessage ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{errorMessage}</div> : null}

      {!activeSession ? (
        <Card className="grid min-h-80 place-items-center p-6 text-center">
          <div>
            <div className="mx-auto mb-4 grid h-12 w-12 place-items-center rounded-md bg-slate-100 text-slate-700">
              <WalletCards size={24} />
            </div>
            <h3 className="text-xl font-black text-slate-900">{t('noActiveCashSession')}</h3>
            <p className="mt-2 max-w-md text-sm font-semibold text-slate-500">{t('openCashFromPos')}</p>
          </div>
        </Card>
      ) : (
        <>
          <section className="grid gap-3 md:grid-cols-4">
            <div className="metric-card">
              <p className="text-sm font-bold text-slate-500">{t('openingAmount')}</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{formatCurrency(activeSession.openingAmount)}</p>
            </div>
            <div className="metric-card">
              <p className="text-sm font-bold text-slate-500">{t('totalSales')}</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{formatCurrency(totals.totalSales)}</p>
            </div>
            <div className="metric-card">
              <p className="text-sm font-bold text-slate-500">{t('cashSales')}</p>
              <p className="mt-1 text-2xl font-black text-slate-900">{formatCurrency(totals.cashSales)}</p>
            </div>
            <div className="metric-card">
              <p className="text-sm font-bold text-slate-500">{t('expectedCash')}</p>
              <p className="mt-1 text-2xl font-black text-blue-700">{formatCurrency(totals.expectedClosing)}</p>
            </div>
          </section>

          <div className="grid gap-4 xl:grid-cols-[1fr_22rem]">
            <Card className="p-4">
              <h3 className="mb-3 text-xl font-black text-slate-900">{t('sessionTransactions')}</h3>
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
                    {sessionSales.length === 0 ? (
                      <tr><td colSpan={5}>{t('noSales')}</td></tr>
                    ) : (
                      sessionSales.map((sale) => (
                        <tr key={sale.id}>
                          <td>{new Date(sale.createdAt).toLocaleString('fr-FR')}</td>
                          <td>{sale.sellerName}</td>
                          <td><Badge tone={paymentTone(sale.paymentMethod)}>{sale.paymentMethod}</Badge></td>
                          <td>{sale.customerPhone || '-'}</td>
                          <td className="font-black text-slate-900">{formatCurrency(sale.total)}</td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </Card>

            <Card className="p-4">
              <h3 className="mb-3 text-xl font-black text-slate-900">{t('sessionSummary')}</h3>
              <div className="grid gap-3 text-sm font-semibold text-slate-600">
                <p className="flex justify-between"><span>{t('cashSales')}</span><strong>{formatCurrency(totals.cashSales)}</strong></p>
                <p className="flex justify-between"><span>{t('cardSales')}</span><strong>{formatCurrency(totals.cardSales)}</strong></p>
                <p className="flex justify-between"><span>{t('mobileSales')}</span><strong>{formatCurrency(totals.mobileSales)}</strong></p>
                <p className="flex justify-between"><span>{t('refunds')}</span><strong>{formatCurrency(totals.refunds)}</strong></p>
                <p className="flex justify-between"><span>{t('expenses')}</span><strong>{formatCurrency(totals.expenses)}</strong></p>
                <p className="flex justify-between"><span>{t('adjustments')}</span><strong>{formatCurrency(totals.adjustments)}</strong></p>
                <div className="border-t border-slate-200 pt-3">
                  <p className="flex justify-between text-lg font-black text-slate-900"><span>{t('expectedCash')}</span><strong>{formatCurrency(totals.expectedClosing)}</strong></p>
                </div>
              </div>
            </Card>
          </div>
        </>
      )}

      <Card className="p-4">
        <h3 className="mb-4 text-xl font-black text-slate-900">{t('cashHistory')}</h3>
        <div className="table-wrap">
          <table className="data-table">
            <thead><tr><th>{t('seller')}</th><th>{t('openingAmount')}</th><th>{t('closingAmount')}</th><th>{t('sessionStart')}</th><th>{t('sessionEnd')}</th><th>{t('status')}</th></tr></thead>
            <tbody>
              {isLoading ? (
                <tr><td colSpan={6}>{t('loading')}</td></tr>
              ) : (
                sessions.map((session) => (
                  <tr key={session.id}>
                    <td>{session.openedByName}</td>
                    <td>{formatCurrency(session.openingAmount)}</td>
                    <td>{session.closingAmount === null ? '-' : formatCurrency(session.closingAmount)}</td>
                    <td>{new Date(session.openedAt).toLocaleString('fr-FR')}</td>
                    <td>{session.closedAt ? new Date(session.closedAt).toLocaleString('fr-FR') : '-'}</td>
                    <td><Badge tone={session.closedAt ? 'slate' : 'green'}>{session.closedAt ? t('closed') : t('open')}</Badge></td>
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
