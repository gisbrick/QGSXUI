import React from 'react';
import PropTypes from 'prop-types';

const Drawer = ({ isOpen = false, onClose, children }) => {
  if (!isOpen) return null;
  
  return (
    <div style={{ 
      position: 'fixed', 
      top: 0, 
      left: 0, 
      right: 0, 
      bottom: 0, 
      backgroundColor: 'rgba(0,0,0,0.5)',
      zIndex: 1000
    }} onClick={onClose}>
      <div style={{
        position: 'fixed',
        right: 0,
        top: 0,
        bottom: 0,
        width: '300px',
        backgroundColor: 'white',
        padding: '16px'
      }} onClick={e => e.stopPropagation()}>
        {children}
      </div>
    </div>
  );
};

Drawer.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  children: PropTypes.node
};

export default Drawer;