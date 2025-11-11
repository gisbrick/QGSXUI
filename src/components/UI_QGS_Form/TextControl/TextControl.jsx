import React from 'react';
import './TextControl.css';

const TextControl = ({
  label,
  value,
  onChange,
  placeholder,
  type = 'text',
  disabled = false,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className={`text-control ${className}`}>
      {label && <label className="text-control__label">{label}</label>}
      <input
        type={type}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        disabled={disabled}
        className={`text-control__input ${error ? 'text-control__input--error' : ''}`}
        {...props}
      />
      {error && <span className="text-control__error">{error}</span>}
    </div>
  );
};

export default TextControl;
