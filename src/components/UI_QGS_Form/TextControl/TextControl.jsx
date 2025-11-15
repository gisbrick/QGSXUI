import React from 'react';
import './TextControl.css';

const TextControl = React.memo(({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  error,
  required = false,
  className = '',
  ...props
}) => {
  // Asegurar que value siempre sea una cadena para evitar problemas con inputs controlados
  const inputValue = value !== null && value !== undefined ? String(value) : '';
  
  return (
    <div className={`text-control ${className}`}>
      {label && (
        <label className="text-control__label">
          {label}
          {required && <span className="text-control__required">*</span>}
        </label>
      )}
      <input
        type={type}
        value={inputValue}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`text-control__input ${error ? 'text-control__input--error' : ''}`}
        {...props}
      />
      {error && <span className="text-control__error">{error}</span>}
    </div>
  );
});

export default TextControl;
