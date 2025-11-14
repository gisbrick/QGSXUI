import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { loadTranslations } from '../../../hooks/translations';
import { useTranslation } from '../../../hooks/useTranslation';
import './Button.css';

const Button = ({
  children,
  onClick,
  type = 'button',
  disabled = false,
  icon,
  size = 'medium',
  circular = false,
  selected = false,
  className = '',
  lang = 'es',
  ...props
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

  const buttonClasses = [
    'ui-button',
    `ui-button--${size}`,
    circular && 'ui-button--circular',
    selected && 'ui-button--selected',
    className
  ].filter(Boolean).join(' ');

  return (
    <button
      type={type}
      className={buttonClasses}
      onClick={onClick}
      disabled={disabled}
      {...props}
    >
      {icon && <span className="ui-button__icon">{icon}</span>}
      {children && <span className="ui-button__text">{children}</span>}
    </button>
  );
};

Button.propTypes = {
  /** Contenido del botón */
  children: PropTypes.node,
  /** Función a ejecutar al hacer clic */
  onClick: PropTypes.func,
  /** Tipo de botón */
  type: PropTypes.oneOf(['button', 'submit', 'reset']),
  /** Si el botón está deshabilitado */
  disabled: PropTypes.bool,
  /** Icono del botón */
  icon: PropTypes.node,
  /** Tamaño del botón */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  /** Si el botón es circular */
  circular: PropTypes.bool,
  /** Si el botón está seleccionado */
  selected: PropTypes.bool,
  /** Clase CSS adicional */
  className: PropTypes.string,
  /** Idioma para las traducciones */
  lang: PropTypes.oneOf(['es', 'en'])
};

export default Button;
