import React from 'react';
import './BaseControl.css';

const BaseControl = ({
  label,
  children,
  error,
  required = false,
  disabled = false,
  className = '',
  ...props
}) => {
  return (
    <div className={`base-control ${disabled ? 'base-control--disabled' : ''} ${className}`} {...props}>
      {label && (
        <label className="base-control__label">
          {label}
          {required && <span className="base-control__required">*</span>}
        </label>
      )}
      <div className="base-control__content">
        {children}
      </div>
      {error && <span className="base-control__error">{error}</span>}
    </div>
  );
};

export default BaseControl;
