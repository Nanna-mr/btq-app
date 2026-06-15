import { FormEvent, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useTranslation } from 'react-i18next';
import { Eye, Languages, LockKeyhole, Mail, UserPlus } from 'lucide-react';
import { Button } from '../components/ui/Button';
import { Input } from '../components/ui/Input';
import { Card } from '../components/ui/Card';
import { useAuthStore } from '../stores/authStore';

interface LoginErrors {
  name?: string;
  email?: string;
  password?: string;
}

export function LoginPage() {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const login = useAuthStore((state) => state.login);
  const signup = useAuthStore((state) => state.signup);
  const loading = useAuthStore((state) => state.loading);
  const [isCreatingManager, setIsCreatingManager] = useState(false);
  const [name, setName] = useState('Nanna Marrakchi');
  const [email, setEmail] = useState('gerant@btq.test');
  const [password, setPassword] = useState('demo1234');
  const [errors, setErrors] = useState<LoginErrors>({});
  const [formError, setFormError] = useState('');

  const switchLanguage = () => {
    void i18n.changeLanguage(i18n.language === 'fr' ? 'ar' : 'fr');
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const nextErrors: LoginErrors = {};
    setFormError('');

    if (isCreatingManager && !name.trim()) {
      nextErrors.name = t('required');
    }

    if (!email) {
      nextErrors.email = t('required');
    } else if (!email.includes('@')) {
      nextErrors.email = t('invalidEmail');
    }

    if (!password) {
      nextErrors.password = t('required');
    }

    setErrors(nextErrors);

    if (Object.keys(nextErrors).length > 0) {
      return;
    }

    if (isCreatingManager) {
      try {
        await signup(email, password, name.trim());
        const signedUpUser = useAuthStore.getState().user;
        navigate(signedUpUser?.role === 'gerant' ? '/dashboard' : '/vente');
      } catch (error) {
        const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
        setFormError(code === 'supabase_not_configured' ? t('supabaseNotConfigured') : code === 'email_confirmation_required' || code === 'over_email_send_rate_limit' ? t('emailConfirmationRequired') : code === 'email_already_exists' ? t('emailAlreadyExists') : code === 'account_disabled' ? t('accountDisabled') : t('accountCreationFailed'));
      }
      return;
    }

    try {
      await login(email, password);
      const loggedUser = useAuthStore.getState().user;
      navigate(loggedUser?.role === 'gerant' ? '/dashboard' : '/vente');
    } catch (error) {
      const code = typeof error === 'object' && error && 'code' in error ? String(error.code) : '';
      setFormError(code === 'account_disabled' ? t('accountDisabled') : t('invalidCredentials'));
    }
  };

  return (
    <div className="page-shell grid min-h-screen place-items-center p-4 md:p-6">
      <Card className="grid w-full max-w-5xl overflow-hidden p-0 md:grid-cols-[1.05fr_0.95fr]">
        <div className="bg-slate-950 p-8 text-white md:p-12">
          <div className="mb-12 grid h-14 w-14 place-items-center rounded-lg bg-blue-500 text-2xl font-black text-white shadow-md">B</div>
          <h1 className="max-w-lg text-4xl font-black leading-tight tracking-tight md:text-5xl">{t('appName')}</h1>
          <p className="mt-5 max-w-md text-lg font-medium text-slate-300">{t('demoHint')}</p>
          <div className="mt-8 grid grid-cols-2 gap-3">
            <div className="rounded-lg border border-white/10 bg-white/10 p-4">
              <p className="text-3xl font-black">20</p>
              <p className="text-sm font-semibold text-slate-300">{t('products')}</p>
            </div>
            <div className="rounded-lg border border-white/10 bg-white/10 p-4">
              <p className="text-3xl font-black">FR/AR</p>
              <p className="text-sm font-semibold text-slate-300">{t('dashboard')}</p>
            </div>
          </div>
        </div>
        <form className="grid gap-5 bg-white p-8 md:p-12" onSubmit={handleSubmit}>
          <div className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-blue-700">{isCreatingManager ? t('newAccount') : t('login')}</p>
              <h2 className="text-3xl font-black tracking-tight text-slate-950">{isCreatingManager ? t('createUserAccount') : t('signIn')}</h2>
            </div>
            <Button type="button" variant="ghost" icon={<Languages size={18} />} onClick={switchLanguage}>
              {i18n.language.toUpperCase()}
            </Button>
          </div>
          {isCreatingManager ? (
            <Input label={t('name')} value={name} onChange={(event) => setName(event.target.value)} error={errors.name} />
          ) : null}
          <Input label={t('email')} type="email" value={email} onChange={(event) => setEmail(event.target.value.toLowerCase().trim())} error={errors.email} />
          <Input label={t('password')} type="password" value={password} onChange={(event) => setPassword(event.target.value)} error={errors.password} />
          <div className="grid gap-3 rounded-lg border border-blue-100 bg-blue-50 p-4 text-sm text-slate-800">
            <p className="flex items-center gap-2 font-semibold"><Mail size={17} /> {isCreatingManager ? t('newAccountRoleHint') : 'gerant@btq.test'}</p>
            <p className="flex items-center gap-2 font-semibold"><LockKeyhole size={17} /> {isCreatingManager ? t('temporaryPasswordHint') : 'vendeur@btq.test'}</p>
          </div>
          {formError ? (
            <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">
              {formError}
            </div>
          ) : null}
          <Button type="submit" size="lg" disabled={loading} icon={isCreatingManager ? <UserPlus size={18} /> : <Eye size={18} />}>
            {isCreatingManager ? t('createAccount') : t('signIn')}
          </Button>
          <Button
            type="button"
            variant="ghost"
            onClick={() => {
              setErrors({});
              setIsCreatingManager((current) => !current);
            }}
          >
            {isCreatingManager ? t('alreadyHaveAccount') : t('createUserAccount')}
          </Button>
        </form>
      </Card>
    </div>
  );
}
