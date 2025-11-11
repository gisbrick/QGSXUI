import { useMemo } from 'react';

/**
 * Hook para manejar traducciones en componentes
 * Utiliza traducciones locales pasadas como props
 * 
 * @param {string} locale - Idioma específico a usar
 * @param {Object} translations - Traducciones locales personalizadas
 * @returns {Function} - Función t para traducir claves
 */
export const useTranslation = (locale, translations) => {
   
    // Función de traducción que busca en las traducciones locales
    const t = useMemo(() => {
        return (key, params = {}) => {
            if (!translations || !key) return key;
            
            // Buscar la clave anidada (ej: 'common.save' busca translations.common.save)
            const keys = key.split('.');
            let result = translations;
            
            for (const k of keys) {
                if (result && typeof result === 'object' && k in result) {
                    result = result[k];
                } else {
                    return key; // Devolver la clave original si no se encuentra
                }
            }
            
            if (typeof result !== 'string') {
                return key;
            }
            
            // Interpolación de variables: reemplazar {{variable}} con valores de params
            if (Object.keys(params).length > 0) {
                return result.replace(/\{\{(\w+)\}\}/g, (match, varName) => {
                    return params[varName] !== undefined ? String(params[varName]) : match;
                });
            }
            
            return result;
        };
    }, [translations, locale]);

    return t;
};

/**
 * Hook específico para componentes UI (mantiene compatibilidad)
 * Devuelve un objeto con la función t para mantener la API existente
 */
export const useUITranslation = (namespace, options = {}) => {
    // Si se pasan los parámetros en el formato viejo: useUITranslation(locale, translations)
    if (typeof namespace === 'string' && typeof options === 'object' && !options.locale && !options.translations) {
        // Formato viejo: namespace es locale, options es translations
        const locale = namespace;
        const translations = options;
        const t = useTranslation(locale, translations);
        return { t };
    }
    
    // Formato nuevo: useUITranslation(namespace, { locale, translations })
    const { locale, translations } = options;
    const t = useTranslation(locale, translations);
    
    return { t };
};

/**
 * Hook específico para componentes comunes
 */
export const useCommonTranslation = (locale, translations) => {
    return useTranslation(locale, translations);
};

/**
 * Higher Order Component para inyectar traducciones
 */
export const withTranslation = (Component) => {
    return function TranslatedComponent(props) {
        const { locale, translations, ...otherProps } = props;
        const t = useTranslation(locale, translations);
        
        return <Component {...otherProps} t={t} locale={locale} translations={translations} />;
    };
};

export default useTranslation;
