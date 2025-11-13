import React from 'react';
import PropTypes from 'prop-types';
import './Toast.css';

const Toast = ({ 
  message, 
  title,
  type = 'info', 
  onClose,
  icon,
  className = ''
}) => {
  const toastClasses = [
    'toast',
    `toast--${type}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={toastClasses}>
      {icon && (
        <span className="toast__icon">{icon}</span>
      )}
      <div className="toast__content">
        {title && (
          <div className="toast__title">{title}</div>
        )}
        <div className="toast__message">{message}</div>
      </div>
      {onClose && (
        <button 
          onClick={onClose}
          className="toast__close"
          aria-label="Cerrar"
        >
          ×
        </button>
      )}
    </div>
  );
};

Toast.propTypes = {
  message: PropTypes.string.isRequired,
  title: PropTypes.string,
  type: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
  onClose: PropTypes.func,
  icon: PropTypes.node,
  className: PropTypes.string
};

export default Toast;