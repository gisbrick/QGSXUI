import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { loadTranslations } from '../../../hooks/translations';
import { useTranslation } from '../../../hooks/useTranslation';
import './Spinner.css';

/**
 * Componente Spinner simple que rota
 */
const Spinner = ({ 
  size = 'medium', 
  loadingText,
  lang = 'es' 
}) => {
  const [translations, setTranslations] = useState(null);

  // Cargar traducciones cuando cambie el idioma
  useEffect(() => {
    const loadLang = async () => {
      const t = await loadTranslations(lang);
      setTranslations(t);
    };
    loadLang();
  }, [lang]);

  // Usar el hook de traducción
  const t = useTranslation(lang, translations);

  const ariaLabel = loadingText || (translations ? t('ui.spinner.loading') : (lang === 'en' ? 'Loading...' : 'Cargando...'));

  return (
    <div 
      className={`spinner ${size !== 'medium' ? `spinner--${size}` : ''}`} 
      role="status"
      aria-label={ariaLabel}
    />
  );
};

Spinner.propTypes = {
  /** Tamaño del spinner */
  size: PropTypes.oneOf(['small', 'medium', 'large', 'extra-large']),
  /** Texto de carga personalizado */
  loadingText: PropTypes.string,
  /** Idioma para las traducciones */
  lang: PropTypes.oneOf(['es', 'en'])
};

export default Spinner;