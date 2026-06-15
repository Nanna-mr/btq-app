import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import fr from '../locales/fr/common.json';
import ar from '../locales/ar/common.json';

i18n.use(initReactI18next).init({
  resources: {
    fr: { common: fr },
    ar: { common: ar },
  },
  lng: 'fr',
  fallbackLng: 'fr',
  defaultNS: 'common',
  interpolation: {
    escapeValue: false,
  },
});

export default i18n;
