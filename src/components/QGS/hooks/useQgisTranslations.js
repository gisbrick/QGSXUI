import { useState, useEffect } from 'react';
import { getTranslationsSync, loadTranslations } from '../../../utilities/translationsLoader';
import { normalizeLanguage } from '../../../config/languages';

// Importar traducciones base (para carga inicial rápida)
import enTranslations from '../../../locales/en/translation.json';
import esTranslations from '../../../locales/es/translation.json';

/**
 * Hook personalizado para gestionar las traducciones de QGIS
 * Carga traducciones síncronamente para ES y EN, y dinámicamente para otros idiomas
 * 
 * @param {string} language - Código del idioma (ej: 'es', 'en', 'ca', 'fr')
 * @returns {Object} Objeto con las traducciones cargadas
 */
export const useQgisTranslations = (language) => {
  const [translations, setTranslations] = useState(() => {
    // Carga inicial síncrona con traducciones base
    const normalizedLang = normalizeLanguage(language);
    const availableTranslations = { es: esTranslations, en: enTranslations };
    return getTranslationsSync(normalizedLang, availableTranslations);
  });

  // Cargar traducciones dinámicamente si el idioma no está en las traducciones base
  useEffect(() => {
    const normalizedLang = normalizeLanguage(language);
    const availableTranslations = { es: esTranslations, en: enTranslations };
    
    // Si el idioma ya está disponible síncronamente, usarlo
    if (availableTranslations[normalizedLang]) {
      setTranslations(availableTranslations[normalizedLang]);
      return;
    }
    
    // Si no, cargarlo dinámicamente
    loadTranslations(normalizedLang)
      .then(loadedTranslations => {
        if (loadedTranslations && Object.keys(loadedTranslations).length > 0) {
          setTranslations(loadedTranslations);
        }
      })
      .catch(error => {
        console.error(`Error cargando traducciones para ${normalizedLang}:`, error);
        // Mantener las traducciones actuales en caso de error
      });
  }, [language]);

  return translations;
};

