/**
 * Utilidad para cargar traducciones dinámicamente según el idioma
 */

import { DEFAULT_LANGUAGE, FALLBACK_LANGUAGE, normalizeLanguage } from '../config/languages';

// Cache de traducciones cargadas para evitar recargas innecesarias
const translationsCache = {};

/**
 * Carga las traducciones para un idioma específico
 * @param {string} languageCode - Código del idioma (ej: 'es', 'en', 'ca')
 * @returns {Promise<Object>} Objeto con las traducciones
 */
export const loadTranslations = async (languageCode) => {
  const normalizedLang = normalizeLanguage(languageCode);
  
  // Si ya está en cache, devolverlo
  if (translationsCache[normalizedLang]) {
    return translationsCache[normalizedLang];
  }
  
  try {
    // Intentar cargar el archivo de traducción dinámicamente
    const translationsModule = await import(`../locales/${normalizedLang}/translation.json`);
    const translations = translationsModule.default || translationsModule;
    
    // Guardar en cache
    translationsCache[normalizedLang] = translations;
    
    return translations;
  } catch (error) {
    console.warn(`No se pudieron cargar las traducciones para el idioma: ${normalizedLang}. Error:`, error);
    
    // Si falla y no es el idioma por defecto, intentar con el idioma por defecto
    if (normalizedLang !== DEFAULT_LANGUAGE) {
      try {
        const fallbackModule = await import(`../locales/${DEFAULT_LANGUAGE}/translation.json`);
        const fallbackTranslations = fallbackModule.default || fallbackModule;
        translationsCache[DEFAULT_LANGUAGE] = fallbackTranslations;
        return fallbackTranslations;
      } catch (fallbackError) {
        console.warn(`No se pudieron cargar las traducciones de fallback (${DEFAULT_LANGUAGE}). Error:`, fallbackError);
      }
    }
    
    // Si también falla el fallback, intentar con el idioma secundario
    if (normalizedLang !== FALLBACK_LANGUAGE && DEFAULT_LANGUAGE !== FALLBACK_LANGUAGE) {
      try {
        const secondaryFallbackModule = await import(`../locales/${FALLBACK_LANGUAGE}/translation.json`);
        const secondaryFallbackTranslations = secondaryFallbackModule.default || secondaryFallbackModule;
        translationsCache[FALLBACK_LANGUAGE] = secondaryFallbackTranslations;
        return secondaryFallbackTranslations;
      } catch (secondaryFallbackError) {
        console.warn(`No se pudieron cargar las traducciones de fallback secundario (${FALLBACK_LANGUAGE}). Error:`, secondaryFallbackError);
      }
    }
    
    // Si todo falla, devolver un objeto vacío
    console.error('No se pudieron cargar traducciones. Devolviendo objeto vacío.');
    return {};
  }
};

/**
 * Carga las traducciones de forma síncrona (solo para idiomas ya importados estáticamente)
 * Útil para casos donde ya se tienen las traducciones importadas
 * @param {string} languageCode - Código del idioma
 * @param {Object} availableTranslations - Objeto con traducciones ya importadas {es: {...}, en: {...}}
 * @returns {Object} Traducciones para el idioma solicitado o el idioma por defecto
 */
export const getTranslationsSync = (languageCode, availableTranslations = {}) => {
  const normalizedLang = normalizeLanguage(languageCode);
  
  // Si hay traducciones disponibles para el idioma solicitado, usarlas
  if (availableTranslations[normalizedLang]) {
    return availableTranslations[normalizedLang];
  }
  
  // Si no, intentar con el idioma por defecto
  if (availableTranslations[DEFAULT_LANGUAGE]) {
    return availableTranslations[DEFAULT_LANGUAGE];
  }
  
  // Si tampoco, intentar con el fallback
  if (availableTranslations[FALLBACK_LANGUAGE]) {
    return availableTranslations[FALLBACK_LANGUAGE];
  }
  
  // Si no hay nada, devolver el primer idioma disponible o un objeto vacío
  const firstAvailable = Object.values(availableTranslations)[0];
  return firstAvailable || {};
};

/**
 * Limpia el cache de traducciones (útil para testing o recarga forzada)
 */
export const clearTranslationsCache = () => {
  Object.keys(translationsCache).forEach(key => {
    delete translationsCache[key];
  });
};

