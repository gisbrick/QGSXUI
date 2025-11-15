import React from 'react';
import './ValueMapControl.css';

const ValueMapControl = ({
  label,
  value,
  onChange,
  options = [],
  disabled = false,
  required = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`value-map-control ${className}`}>
      {label && (
        <label className="value-map-control__label">
          {label}
          {required && <span className="value-map-control__required">*</span>}
        </label>
      )}
      <select
        value={value}
        onChange={onChange}
        disabled={disabled}
        className="value-map-control__select"
        {...props}
      >
        <option value="">Select an option...</option>
        {options.map((option) => (
          <option key={option.value} value={option.value}>
            {option.label}
          </option>
        ))}
      </select>
    </div>
  );
};

export default ValueMapControl;
