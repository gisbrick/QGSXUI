import React from 'react';
import './DateControl.css';

const DateControl = ({
  label,
  value,
  onChange,
  disabled = false,
  error,
  className = '',
  ...props
}) => {
  return (
    <div className={`date-control ${className}`}>
      {label && <label className="date-control__label">{label}</label>}
      <input
        type="date"
        value={value}
        onChange={onChange}
        disabled={disabled}
        className={`date-control__input ${error ? 'date-control__input--error' : ''}`}
        {...props}
      />
      {error && <span className="date-control__error">{error}</span>}
    </div>
  );
};

export default DateControl;
