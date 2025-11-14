import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { loadTranslations } from '../../../hooks/translations';
import { useTranslation } from '../../../hooks/useTranslation';

const Tooltip = ({ 
  children, 
  content, 
  position = 'top',
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

  return (
    <div 
      className={`tooltip tooltip--${position}`} 
      title={content}
      role="tooltip"
      aria-label={content}
    >
      {children}
    </div>
  );
};

Tooltip.propTypes = {
  /** Elemento hijo que activará el tooltip */
  children: PropTypes.node.isRequired,
  /** Contenido del tooltip */
  content: PropTypes.string,
  /** Posición del tooltip */
  position: PropTypes.oneOf(['top', 'bottom', 'left', 'right']),
  /** Idioma para las traducciones */
  lang: PropTypes.oneOf(['es', 'en'])
};

export default Tooltip;