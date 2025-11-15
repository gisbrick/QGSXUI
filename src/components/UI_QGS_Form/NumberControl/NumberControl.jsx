import React from 'react';
import './NumberControl.css';

const NumberControl = ({
  label,
  value,
  onChange,
  placeholder,
  min,
  max,
  step = 1,
  disabled = false,
  error,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`number-control ${className}`}>
      {label && (
        <label className="number-control__label">
          {label}
          {required && <span className="number-control__required">*</span>}
        </label>
      )}
      <input
        type="number"
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        min={min}
        max={max}
        step={step}
        disabled={disabled}
        className={`number-control__input ${error ? 'number-control__input--error' : ''}`}
        {...props}
      />
      {error && <span className="number-control__error">{error}</span>}
    </div>
  );
};

export default NumberControl;
