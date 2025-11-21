import { useMemo, useContext } from 'react';
import { QgisConfigContext } from '../../../../QGS/QgisConfigContext';
import { useUITranslation } from '../../../../../hooks/useTranslation';
import { getTranslationsSync } from '../../../../../utilities/translationsLoader';
import { normalizeLanguage } from '../../../../../config/languages';
import enTranslations from '../../../../../locales/en/translation.json';
import esTranslations from '../../../../../locales/es/translation.json';

/**
 * Hook para manejar las traducciones del diálogo de atributos
 * Centraliza toda la lógica de traducción y prioridades
 */
export const useFeatureDialogTranslation = (language = 'es', tProp = null) => {
  const qgisContext = useContext(QgisConfigContext);
  const contextT = qgisContext?.t || tProp;
  
  // Priorizar siempre el idioma del contexto QGIS
  const finalLanguage = useMemo(() => {
    return qgisContext?.language || language || 'es';
  }, [qgisContext?.language, language]);
  
  // Crear traducciones sincronizadas
  const translations = useMemo(() => {
    const langToUse = normalizeLanguage(qgisContext?.language || finalLanguage || 'es');
    const availableTranslations = { es: esTranslations, en: enTranslations };
    return getTranslationsSync(langToUse, availableTranslations);
  }, [finalLanguage, qgisContext?.language]);
  
  const { t: tempT } = useUITranslation(finalLanguage, translations);
  
  // Función de traducción final con prioridades
  const finalT = useMemo(() => {
    return contextT || tempT;
  }, [contextT, tempT, finalLanguage]);
  
  return {
    t: finalT,
    language: finalLanguage,
    translations
  };
};

