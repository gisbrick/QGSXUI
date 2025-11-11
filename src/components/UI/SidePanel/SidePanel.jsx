import React from 'react';
import PropTypes from 'prop-types';

const SidePanel = ({ isOpen = false, children, side = 'right' }) => {
  if (!isOpen) return null;
  
  const sideStyles = {
    left: { left: 0 },
    right: { right: 0 }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      bottom: 0,
      width: '300px',
      backgroundColor: 'white',
      border: '1px solid #ddd',
      padding: '16px',
      zIndex: 1000,
      ...sideStyles[side]
    }}>
      {children}
    </div>
  );
};

SidePanel.propTypes = {
  isOpen: PropTypes.bool,
  children: PropTypes.node,
  side: PropTypes.oneOf(['left', 'right'])
};

export default SidePanel;