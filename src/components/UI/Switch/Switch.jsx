import React from 'react';
import PropTypes from 'prop-types';
import './Switch.css';

const Switch = ({
  checked = false,
  onChange,
  disabled = false,
  size = 'medium',
  label,
  labelPosition = 'right',
  className = '',
  ...props
}) => {
  const switchClasses = [
    'ui-switch',
    `ui-switch--${size}`,
    checked && 'ui-switch--checked',
    disabled && 'ui-switch--disabled',
    className
  ].filter(Boolean).join(' ');

  const wrapperClasses = [
    'ui-switch-wrapper',
    `ui-switch-wrapper--${labelPosition}`,
    disabled && 'ui-switch-wrapper--disabled'
  ].filter(Boolean).join(' ');

  const handleChange = (event) => {
    if (onChange && !disabled) {
      onChange(event.target.checked, event);
    }
  };

  const switchElement = (
    <label className={switchClasses}>
      <input
        type="checkbox"
        checked={checked}
        onChange={handleChange}
        disabled={disabled}
        className="ui-switch__input"
        {...props}
      />
      <span className="ui-switch__slider">
        <span className="ui-switch__thumb"></span>
      </span>
    </label>
  );

  if (label) {
    return (
      <div className={wrapperClasses}>
        {labelPosition === 'left' && (
          <span className="ui-switch__label">{label}</span>
        )}
        {switchElement}
        {labelPosition === 'right' && (
          <span className="ui-switch__label">{label}</span>
        )}
      </div>
    );
  }

  return switchElement;
};

Switch.propTypes = {
  checked: PropTypes.bool,
  onChange: PropTypes.func,
  disabled: PropTypes.bool,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  label: PropTypes.string,
  labelPosition: PropTypes.oneOf(['left', 'right']),
  className: PropTypes.string
};

export default Switch;
