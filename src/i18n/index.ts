import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

import en from './locales/en.json';
import zhCN from './locales/zh-CN.json';

const resources = {
  en: { translation: en },
  'zh-CN': { translation: zhCN },
};

// Get saved language or detect from browser
const getSavedLanguage = (): string => {
  const saved = localStorage.getItem('language');
  if (saved && (saved === 'en' || saved === 'zh-CN')) {
    return saved;
  }
  // Detect from browser
  const browserLang = navigator.language;
  if (browserLang.startsWith('zh')) {
    return 'zh-CN';
  }
  return 'en';
};

i18n
  .use(initReactI18next)
  .init({
    resources,
    lng: getSavedLanguage(),
    fallbackLng: 'en',
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;

export const changeLanguage = (lang: string) => {
  localStorage.setItem('language', lang);
  i18n.changeLanguage(lang);
};

export const getCurrentLanguage = () => i18n.language;
