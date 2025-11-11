import React from 'react';
import PropTypes from 'prop-types';

const Message = ({ type = 'info', title, message, children, onClose }) => {
  const colors = {
    info: '#e3f2fd',
    success: '#e8f5e8',
    warning: '#fff3cd',
    error: '#f8d7da'
  };

  return (
    <div style={{
      padding: '12px 16px',
      backgroundColor: colors[type],
      border: '1px solid #ddd',
      borderRadius: '4px',
      margin: '8px 0',
      position: 'relative'
    }}>
      {/* Botón de cerrar opcional */}
      {onClose && (
        <button
          onClick={onClose}
          style={{
            position: 'absolute',
            top: '8px',
            right: '8px',
            background: 'none',
            border: 'none',
            fontSize: '16px',
            cursor: 'pointer',
            color: '#666'
          }}
          aria-label="Cerrar mensaje"
        >
          ×
        </button>
      )}
      
      {/* Título opcional */}
      {title && (
        <div style={{ fontWeight: 'bold', marginBottom: '4px' }}>
          {title}
        </div>
      )}
      
      {/* Mensaje o children */}
      {message ? (
        <div>{message}</div>
      ) : (
        children
      )}
    </div>
  );
};

Message.propTypes = {
  type: PropTypes.oneOf(['info', 'success', 'warning', 'error']),
  title: PropTypes.string,
  message: PropTypes.string,
  children: PropTypes.node,
  onClose: PropTypes.func
};

export default Message;