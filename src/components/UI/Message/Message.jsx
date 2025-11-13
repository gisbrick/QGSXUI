import React from 'react';
import PropTypes from 'prop-types';
import './Message.css';

const Message = ({ type = 'info', title, message, children, onClose, className = '' }) => {
  const messageClasses = [
    'ui-message',
    `ui-message--${type}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={messageClasses}>
      {/* Botón de cerrar opcional */}
      {onClose && (
        <button
          onClick={onClose}
          className="ui-message__close"
          aria-label="Cerrar mensaje"
        >
          ×
        </button>
      )}
      
      {/* Título opcional */}
      {title && (
        <div className="ui-message__title">
          {title}
        </div>
      )}
      
      {/* Mensaje o children */}
      {message ? (
        <div className="ui-message__content">{message}</div>
      ) : (
        <div className="ui-message__content">{children}</div>
      )}
    </div>
  );
};

Message.propTypes = {
  type: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
  title: PropTypes.string,
  message: PropTypes.string,
  children: PropTypes.node,
  onClose: PropTypes.func,
  className: PropTypes.string
};

export default Message;