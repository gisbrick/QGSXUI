import i18n from 'i18next';
import { initReactI18next } from 'react-i18next';

// Importar traducciones externas
import enTranslations from './locales/en/translation.json';
import esTranslations from './locales/es/translation.json';

i18n
  .use(initReactI18next)
  .init({
    resources: {
      en: { translation: enTranslations },
      es: { translation: esTranslations }
    },
    lng: 'es',            // idioma por defecto
    fallbackLng: 'en',    // si falta clave en 'es' usa 'en'
    interpolation: {
      escapeValue: false,
    },
  });

export default i18n;