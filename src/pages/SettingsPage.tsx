import { FormEvent, useEffect, useState } from 'react';
import { ImagePlus, Save } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '../components/ui/Button';
import { Card } from '../components/ui/Card';
import { Input } from '../components/ui/Input';
import { defaultShopSettings, useSaveShopSettings, useShopSettings, useUploadShopLogo, type ShopSettings } from '../hooks/useShopSettings';
import { supabase } from '../lib/supabase';

export function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { data: settings = defaultShopSettings, isLoading } = useShopSettings();
  const saveSettings = useSaveShopSettings();
  const uploadLogo = useUploadShopLogo();
  const [form, setForm] = useState<ShopSettings>(settings);
  const [feedback, setFeedback] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  const [password, setPassword] = useState('');
  const [theme, setTheme] = useState(() => localStorage.getItem('btq-theme') || 'light');
  const [activeTab, setActiveTab] = useState<'settings' | 'preferences'>('settings');

  useEffect(() => {
    setForm(settings);
  }, [settings]);

  const showSuccess = (message: string) => {
    setFeedback(message);
    window.setTimeout(() => setFeedback(''), 3000);
  };

  const handleLogoChange = async (file: File | null) => {
    if (!file) {
      return;
    }

    setErrorMessage('');

    try {
      const logoUrl = await uploadLogo.mutateAsync(file);
      const nextSettings = { ...form, logoUrl };
      setForm(nextSettings);
      await saveSettings.mutateAsync(nextSettings);
      showSuccess(t('settingsSaved'));
    } catch {
      setErrorMessage(t('settingsSaveFailed'));
    }
  };

  const handleSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setErrorMessage('');

    try {
      await saveSettings.mutateAsync(form);
      showSuccess(t('settingsSaved'));
    } catch {
      setErrorMessage(t('settingsSaveFailed'));
    }
  };

  const handlePasswordUpdate = async () => {
    setErrorMessage('');

    if (password.length < 6) {
      setErrorMessage(t('passwordTooShort'));
      return;
    }

    const { error } = await supabase.auth.updateUser({ password });

    if (error) {
      setErrorMessage(t('settingsSaveFailed'));
      return;
    }

    setPassword('');
    showSuccess(t('passwordUpdated'));
  };

  const handleThemeChange = (value: string) => {
    setTheme(value);
    localStorage.setItem('btq-theme', value);
    document.documentElement.dataset.theme = value;
  };

  return (
    <div className="settings-page grid gap-5">
      {feedback ? <div className="rounded-lg border border-emerald-200 bg-emerald-50 px-4 py-3 text-sm font-bold text-emerald-900">{feedback}</div> : null}
      {errorMessage ? <div className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm font-bold text-red-800">{errorMessage}</div> : null}
      <div className="settings-layout">
        <Card className="settings-preview-card p-5">
          <h3 className="mb-4 text-xl font-black text-emerald-950">{t('ticketPreview')}</h3>
          <div className="mx-auto max-w-sm rounded-sm border border-slate-200 bg-white p-5 font-mono text-sm shadow-sm">
            <div className="border-b border-dashed border-slate-300 pb-4 text-center">
              {form.logoUrl ? <img className="mx-auto mb-3 max-h-20 max-w-36 object-contain" src={form.logoUrl} alt={form.shopName} /> : <div className="mx-auto mb-3 grid h-16 w-16 place-items-center rounded bg-emerald-950 text-xl font-black text-white">B</div>}
              <p className="font-black text-emerald-950">{form.shopName}</p>
              {form.address ? <p className="text-xs text-slate-500">{form.address}</p> : null}
              {form.phone ? <p className="text-xs text-slate-500">{form.phone}</p> : null}
            </div>
            <div className="grid gap-2 border-b border-dashed border-slate-300 py-4">
              <p>Ticket de vente</p>
              <p>REF: SALE-0001</p>
              <p>Caissier: Gerant</p>
            </div>
            <div className="grid gap-2 border-b border-dashed border-slate-300 py-4">
              <p>Article exemple x2</p>
              <p className="text-right font-black">250 MRU</p>
            </div>
            <div className="grid gap-2 py-4">
              <p className="flex justify-between"><span>Total</span><strong>250 MRU</strong></p>
              <p className="text-center text-xs text-slate-500">{form.footerMessage}</p>
            </div>
          </div>
        </Card>
        <Card className="settings-tabs-card p-5">
          <div className="settings-tabs">
            <button className={activeTab === 'settings' ? 'is-active' : ''} type="button" onClick={() => setActiveTab('settings')}>
              {t('settings')}
            </button>
            <button className={activeTab === 'preferences' ? 'is-active' : ''} type="button" onClick={() => setActiveTab('preferences')}>
              {t('preferences')}
            </button>
          </div>

          {activeTab === 'settings' ? (
            <form className="grid gap-4" onSubmit={handleSubmit}>
              <Input label={t('shopName')} value={form.shopName} onChange={(event) => setForm({ ...form, shopName: event.target.value })} required />
              <Input label={t('shopPhone')} value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} />
              <Input label={t('shopAddress')} value={form.address} onChange={(event) => setForm({ ...form, address: event.target.value })} />
              <Input label={t('ticketFooter')} value={form.footerMessage} onChange={(event) => setForm({ ...form, footerMessage: event.target.value })} />
              <label className="grid gap-2">
                <span className="field-label">{t('shopLogo')}</span>
                <span className="inline-flex min-h-11 cursor-pointer items-center justify-center gap-2 rounded-lg bg-amber-100 px-4 text-sm font-semibold text-amber-950 transition hover:bg-amber-200">
                  <ImagePlus size={18} />
                  {uploadLogo.isPending ? t('loading') : t('uploadLogo')}
                  <input className="hidden" type="file" accept="image/*" onChange={(event) => handleLogoChange(event.target.files?.[0] ?? null)} />
                </span>
              </label>
              <Button type="submit" icon={<Save size={18} />} disabled={isLoading || saveSettings.isPending || uploadLogo.isPending}>
                {saveSettings.isPending ? t('loading') : t('save')}
              </Button>
            </form>
          ) : (
            <div className="grid gap-4">
              <label className="form-field">
                <span className="field-label">{t('language')}</span>
                <select className="input-control" value={i18n.language} onChange={(event) => void i18n.changeLanguage(event.target.value)}>
                  <option value="fr">Français</option>
                  <option value="ar">العربية</option>
                </select>
              </label>
              <label className="form-field">
                <span className="field-label">{t('theme')}</span>
                <select className="input-control" value={theme} onChange={(event) => handleThemeChange(event.target.value)}>
                  <option value="light">{t('lightTheme')}</option>
                  <option value="dark">{t('darkTheme')}</option>
                </select>
              </label>
              <Input label={t('newPassword')} type="password" value={password} onChange={(event) => setPassword(event.target.value)} />
              <Button type="button" variant="secondary" onClick={handlePasswordUpdate}>
                {t('updatePassword')}
              </Button>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
