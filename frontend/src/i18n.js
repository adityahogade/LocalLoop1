import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';
import LanguageDetector from 'i18next-browser-languagedetector';

import commonEn from './locales/en/common.json';
import customerEn from './locales/en/customer.json';
import providerEn from './locales/en/provider.json';
import adminEn from './locales/en/admin.json';

import commonHi from './locales/hi/common.json';
import customerHi from './locales/hi/customer.json';
import providerHi from './locales/hi/provider.json';
import adminHi from './locales/hi/admin.json';

import commonMr from './locales/mr/common.json';
import customerMr from './locales/mr/customer.json';
import providerMr from './locales/mr/provider.json';
import adminMr from './locales/mr/admin.json';

const resources = {
  en: {
    common: commonEn,
    customer: customerEn,
    provider: providerEn,
    admin: adminEn,
  },
  hi: {
    common: commonHi,
    customer: customerHi,
    provider: providerHi,
    admin: adminHi,
  },
  mr: {
    common: commonMr,
    customer: customerMr,
    provider: providerMr,
    admin: adminMr,
  },
};

i18n
  .use(LanguageDetector)
  .use(initReactI18next)
  .init({
    resources,
    fallbackLng: 'en',
    ns: ['common', 'customer', 'provider', 'admin'],
    defaultNS: 'common',
    interpolation: {
      escapeValue: false,
    },
    detection: {
      order: ['localStorage', 'navigator'],
      caches: ['localStorage'],
    },
  });

export default i18n;
