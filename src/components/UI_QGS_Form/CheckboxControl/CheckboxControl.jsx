import React from 'react';
import './CheckboxControl.css';

const CheckboxControl = ({
  label,
  checked = false,
  onChange,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`checkbox-control ${className}`}>
      <label className="checkbox-control__label">
        <input
          type="checkbox"
          checked={checked}
          onChange={onChange}
          disabled={disabled}
          className="checkbox-control__input"
          {...props}
        />
        <span className="checkbox-control__text">{label}</span>
      </label>
    </div>
  );
};

export default CheckboxControl;
