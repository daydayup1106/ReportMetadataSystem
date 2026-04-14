import i18n from 'i18next'
import { initReactI18next } from 'react-i18next'
import en from './locales/en/common.json'
import zh from './locales/zh/common.json'

i18n.use(initReactI18next).init({
  resources: {
    en: { common: en },
    zh: { common: zh },
  },
  lng: localStorage.getItem('locale') ?? (navigator.language.startsWith('zh') ? 'zh' : 'en'),
  fallbackLng: 'en',
  defaultNS: 'common',
  interpolation: { escapeValue: false },
})

export default i18n
