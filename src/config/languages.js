/**
 * Configuración de idiomas soportados en la aplicación
 * Para añadir un nuevo idioma:
 * 1. Añade el código del idioma aquí con su configuración
 * 2. Crea el archivo de traducción en src/locales/{codigo}/translation.json
 * 3. El sistema lo cargará automáticamente
 */

// Idioma por defecto (fallback)
export const DEFAULT_LANGUAGE = 'es';

// Idioma secundario de fallback (si no existe el idioma solicitado ni el por defecto)
export const FALLBACK_LANGUAGE = 'en';

/**
 * Configuración de idiomas soportados
 * @type {Object<string, {code: string, name: string, nativeName: string, flag?: string}>}
 */
export const SUPPORTED_LANGUAGES = {
  es: {
    code: 'es',
    name: 'Spanish',
    nativeName: 'Español',
    flag: '🇪🇸'
  },
  en: {
    code: 'en',
    name: 'English',
    nativeName: 'English',
    flag: '🇬🇧'
  },
  // Ejemplos de cómo añadir nuevos idiomas (descomentar cuando se añadan los archivos de traducción):
  // ca: {
  //   code: 'ca',
  //   name: 'Catalan',
  //   nativeName: 'Català',
  //   flag: '🇪🇸'
  // },
  // fr: {
  //   code: 'fr',
  //   name: 'French',
  //   nativeName: 'Français',
  //   flag: '🇫🇷'
  // }
};

/**
 * Obtiene la configuración de un idioma
 * @param {string} languageCode - Código del idioma (ej: 'es', 'en', 'ca')
 * @returns {Object|null} Configuración del idioma o null si no está soportado
 */
export const getLanguageConfig = (languageCode) => {
  return SUPPORTED_LANGUAGES[languageCode] || null;
};

/**
 * Verifica si un idioma está soportado
 * @param {string} languageCode - Código del idioma
 * @returns {boolean} true si el idioma está soportado
 */
export const isLanguageSupported = (languageCode) => {
  return languageCode && languageCode in SUPPORTED_LANGUAGES;
};

/**
 * Normaliza un código de idioma (devuelve el código válido o el idioma por defecto)
 * @param {string} languageCode - Código del idioma a normalizar
 * @returns {string} Código de idioma válido
 */
export const normalizeLanguage = (languageCode) => {
  if (isLanguageSupported(languageCode)) {
    return languageCode;
  }
  return DEFAULT_LANGUAGE;
};

/**
 * Obtiene la lista de códigos de idiomas soportados
 * @returns {string[]} Array de códigos de idioma
 */
export const getSupportedLanguageCodes = () => {
  return Object.keys(SUPPORTED_LANGUAGES);
};

