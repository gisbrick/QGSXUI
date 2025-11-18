import React, { useState, useRef, useEffect } from 'react';
import PropTypes from 'prop-types';
import './SearchInput.css';

/**
 * Componente de búsqueda con input de texto y botón para limpiar
 * Sigue el sistema de diseño UI del proyecto
 */
const SearchInput = ({
  value = '',
  onChange,
  placeholder = 'Buscar...',
  size = 'medium',
  disabled = false,
  className = '',
  onClear,
  ...props
}) => {
  const [internalValue, setInternalValue] = useState(value);
  const inputRef = useRef(null);

  // Sincronizar con value externo si cambia
  useEffect(() => {
    setInternalValue(value);
  }, [value]);

  const handleChange = (e) => {
    const newValue = e.target.value;
    setInternalValue(newValue);
    if (onChange) {
      onChange(e);
    }
  };

  const handleClear = () => {
    setInternalValue('');
    if (inputRef.current) {
      inputRef.current.focus();
    }
    if (onChange) {
      // Crear un evento sintético para mantener la consistencia
      const syntheticEvent = {
        target: { value: '' },
        currentTarget: { value: '' }
      };
      onChange(syntheticEvent);
    }
    if (onClear) {
      onClear();
    }
  };

  const hasValue = internalValue && internalValue.length > 0;

  const searchInputClasses = [
    'ui-search-input',
    `ui-search-input--${size}`,
    disabled && 'ui-search-input--disabled',
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={searchInputClasses}>
      <div className="ui-search-input__wrapper">
        <div className="ui-search-input__icon">
          <i className="fas fa-search" />
        </div>
        <input
          ref={inputRef}
          type="text"
          className="ui-search-input__input"
          value={internalValue}
          onChange={handleChange}
          placeholder={placeholder}
          disabled={disabled}
          {...props}
        />
        {hasValue && !disabled && (
          <button
            type="button"
            className="ui-search-input__clear"
            onClick={handleClear}
            aria-label="Limpiar búsqueda"
            tabIndex={-1}
          >
            <i className="fas fa-times" />
          </button>
        )}
      </div>
    </div>
  );
};

SearchInput.propTypes = {
  /** Valor del input */
  value: PropTypes.string,
  /** Función que se ejecuta cuando cambia el valor */
  onChange: PropTypes.func,
  /** Texto placeholder */
  placeholder: PropTypes.string,
  /** Tamaño del input */
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  /** Si el input está deshabilitado */
  disabled: PropTypes.bool,
  /** Clase CSS adicional */
  className: PropTypes.string,
  /** Función que se ejecuta al limpiar (opcional) */
  onClear: PropTypes.func
};

export default SearchInput;

