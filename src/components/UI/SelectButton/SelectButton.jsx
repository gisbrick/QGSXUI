import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import { loadTranslations } from '../../../hooks/translations';
import { useTranslation } from '../../../hooks/useTranslation';
import './SelectButton.css';

const SelectButton = ({
  children,
  options = [],
  placeholder,
  disabled = false,
  size = 'medium',
  circular = false,
  selected = false,
  icon,
  className = '',
  dropdownClassName = '',
  gridColumns = 1,
  lang = 'es',
  onSelect = () => {},
  ...props
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [translations, setTranslations] = useState(null);
  const selectRef = useRef(null);
  const dropdownRef = useRef(null);

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

  // Resolver el placeholder
  const resolvedPlaceholder = placeholder || (translations ? t('ui.common.select') : (lang === 'en' ? 'Select...' : 'Seleccionar...'));

  // Cerrar el dropdown cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (selectRef.current && !selectRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const toggleDropdown = () => {
    if (!disabled) {
      setIsOpen(!isOpen);
    }
  };

  const handleOptionSelect = (option, index) => {
    onSelect(option, index);
    setIsOpen(false);
  };

  const buttonClasses = [
    'ui-select-button',
    `ui-select-button--${size}`,
    circular && 'ui-select-button--circular',
    selected && 'ui-select-button--selected',
    disabled && 'ui-select-button--disabled',
    isOpen && 'ui-select-button--open',
    className
  ].filter(Boolean).join(' ');

  const dropdownClasses = [
    'ui-select-button__dropdown',
    `ui-select-button__dropdown--${size}`,
    gridColumns > 1 && 'ui-select-button__dropdown--grid',
    dropdownClassName
  ].filter(Boolean).join(' ');

  const gridStyle = gridColumns > 1 ? {
    gridTemplateColumns: `repeat(${gridColumns}, 1fr)`
  } : {};

  return (
    <div className="ui-select-button-container" ref={selectRef}>
      <button
        type="button"
        className={buttonClasses}
        onClick={toggleDropdown}
        disabled={disabled}
        {...props}
      >
        {icon && <span className="ui-select-button__icon">{icon}</span>}
        {children && <span className="ui-select-button__text">{children}</span>}
        {!children && !icon && <span className="ui-select-button__placeholder">{resolvedPlaceholder}</span>}
        <span className="ui-select-button__arrow">
          <svg 
            width="12" 
            height="12" 
            viewBox="0 0 12 12" 
            fill="currentColor"
            style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
          >
            <path d="M2 4l4 4 4-4" stroke="currentColor" strokeWidth="1.5" fill="none" strokeLinecap="round" strokeLinejoin="round"/>
          </svg>
        </span>
      </button>

      {isOpen && (
        <div 
          className={dropdownClasses}
          ref={dropdownRef}
          style={gridStyle}
        >
          {options.map((option, index) => {
            // Si option es un React element, lo renderizamos directamente
            if (React.isValidElement(option)) {
              return (
                <div 
                  key={index}
                  className="ui-select-button__option"
                  onClick={() => handleOptionSelect(option, index)}
                >
                  {option}
                </div>
              );
            }
            
            // Si option es un objeto con render function
            if (option && typeof option.render === 'function') {
              return (
                <div 
                  key={option.key || index}
                  className="ui-select-button__option"
                  onClick={() => handleOptionSelect(option, index)}
                >
                  {option.render()}
                </div>
              );
            }
            
            // Si option es un objeto con propiedades
            if (option && typeof option === 'object') {
              return (
                <div 
                  key={option.key || option.value || index}
                  className="ui-select-button__option"
                  onClick={() => handleOptionSelect(option, index)}
                >
                  {option.icon && <span className="ui-select-button__option-icon">{option.icon}</span>}
                  {option.image && <img src={option.image} alt={option.label || ''} className="ui-select-button__option-image" />}
                  {option.label && <span className="ui-select-button__option-label">{option.label}</span>}
                </div>
              );
            }
            
            // Fallback para strings simples
            return (
              <div 
                key={index}
                className="ui-select-button__option"
                onClick={() => handleOptionSelect(option, index)}
              >
                {option}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

SelectButton.propTypes = {
  children: PropTypes.node,
  options: PropTypes.array,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  circular: PropTypes.bool,
  selected: PropTypes.bool,
  icon: PropTypes.node,
  className: PropTypes.string,
  dropdownClassName: PropTypes.string,
  gridColumns: PropTypes.number,
  lang: PropTypes.string, // Idioma para las traducciones
  onSelect: PropTypes.func
};

export default SelectButton;
