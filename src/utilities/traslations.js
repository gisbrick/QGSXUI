// Función para cargar traducciones dinámicamente
export const loadTranslations = async (lang = 'es') => {
  try {
    // Cargar dinámicamente el archivo de traducción
    const translations = await import(`../locales/${lang}/translation.json`);
    return translations.default;
  } catch (error) {
    console.warn(`No se pudieron cargar las traducciones para el idioma: ${lang}. Error:`, error);
    // Fallback a español si no se encuentra el idioma
    try {
      const fallback = await import(`../locales/es/translation.json`);
      return fallback.default;
    } catch (fallbackError) {
      console.error('Error cargando traducciones de fallback:', fallbackError);
      return {};
    }
  }
};
