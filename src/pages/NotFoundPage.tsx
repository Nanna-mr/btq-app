import { Link } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';

export function NotFoundPage() {
  const { t } = useTranslation();

  return (
    <div className="page-shell grid min-h-screen place-items-center p-6 text-center">
      <div>
        <p className="text-7xl font-black text-emerald-950">404</p>
        <h1 className="mt-4 text-3xl font-black text-emerald-950">{t('notFound')}</h1>
        <Link className="mt-6 inline-flex" to="/login">
          <Button>{t('goToLogin')}</Button>
        </Link>
      </div>
    </div>
  );
}
