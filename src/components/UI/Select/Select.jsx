import React from 'react';
import PropTypes from 'prop-types';
import './Select.css';

const Select = ({
  options = [],
  value,
  onChange,
  placeholder = 'Selecciona una opción',
  disabled = false,
  size = 'medium',
  className = '',
  ...props
}) => {
  const selectClasses = [
    'ui-select',
    `ui-select--${size}`,
    disabled && 'ui-select--disabled',
    className
  ].filter(Boolean).join(' ');

  const handleChange = (event) => {
    if (onChange) {
      onChange(event.target.value, event);
    }
  };

  return (
    <div className="ui-select-wrapper">
      <select
        className={selectClasses}
        value={value || ''}
        onChange={handleChange}
        disabled={disabled}
        {...props}
      >
        {placeholder && (
          <option value="" disabled>
            {placeholder}
          </option>
        )}
        {options.map((option, index) => {
          if (typeof option === 'string') {
            return (
              <option key={index} value={option}>
                {option}
              </option>
            );
          }
          return (
            <option key={option.value || index} value={option.value}>
              {option.label || option.value}
            </option>
          );
        })}
      </select>
      <div className="ui-select-arrow">
        <i className="fas fa-chevron-down"></i>
      </div>
    </div>
  );
};

Select.propTypes = {
  options: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
        label: PropTypes.string.isRequired,
      })
    ])
  ).isRequired,
  value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onChange: PropTypes.func,
  placeholder: PropTypes.string,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  className: PropTypes.string
};

export default Select;
