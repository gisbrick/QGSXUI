import React from 'react';

const Toast = ({ message, type = 'info', onClose }) => (
  <div 
    style={{
      position: 'fixed',
      top: '20px',
      right: '20px',
      padding: '12px 16px',
      backgroundColor: type === 'error' ? '#f44336' : type === 'success' ? '#4caf50' : '#2196f3',
      color: 'white',
      borderRadius: '4px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.2)',
      zIndex: 1000
    }}
  >
    {message}
    {onClose && (
      <button 
        onClick={onClose}
        style={{ 
          background: 'none', 
          border: 'none', 
          color: 'white', 
          marginLeft: '8px', 
          cursor: 'pointer' 
        }}
      >
        ×
      </button>
    )}
  </div>
);

export default Toast;