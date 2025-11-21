import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import './Drawer.css';

/**
 * Componente Drawer mejorado con animaciones y mejor estilo
 * Soporta posicionamiento (left, right, top, bottom) y animaciones suaves
 */
const Drawer = ({ 
  isOpen = false, 
  onClose, 
  children,
  position = 'right',
  width = '400px',
  title = null,
  showCloseButton = true,
  allowBackdropInteraction = false,
  showOverlay = true,
  className = ''
}) => {
  // Prevenir scroll del body cuando el drawer está abierto
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isOpen]);

  if (!isOpen) return null;
  
  const positionClass = `drawer--${position}`;
  const drawerStyle = {
    width: position === 'left' || position === 'right' ? width : '100%',
    height: position === 'top' || position === 'bottom' ? width : '100%',
  };

  return (
    <div 
      className={`drawer-overlay ${isOpen ? 'drawer-overlay--open' : ''} ${allowBackdropInteraction ? 'drawer-overlay--allow-interaction' : ''} ${!showOverlay ? 'drawer-overlay--no-backdrop' : ''}`}
      onClick={allowBackdropInteraction ? undefined : onClose}
      role="dialog"
      aria-modal="true"
      aria-labelledby={title ? 'drawer-title' : undefined}
    >
      <div 
        className={`drawer ${positionClass} ${isOpen ? 'drawer--open' : ''} ${className}`}
        style={drawerStyle}
        onClick={e => e.stopPropagation()}
        role="document"
      >
        {(title || showCloseButton) && (
          <div className="drawer__header">
            {title && (
              <h2 id="drawer-title" className="drawer__title">
                {title}
              </h2>
            )}
            {showCloseButton && (
              <button
                type="button"
                className="drawer__close-button"
                onClick={onClose}
                aria-label="Cerrar"
                title="Cerrar"
              >
                <i className="fas fa-times" aria-hidden="true" />
              </button>
            )}
          </div>
        )}
        <div className="drawer__content">
          {children}
        </div>
      </div>
    </div>
  );
};

Drawer.propTypes = {
  isOpen: PropTypes.bool,
  onClose: PropTypes.func,
  children: PropTypes.node,
  position: PropTypes.oneOf(['left', 'right', 'top', 'bottom']),
  width: PropTypes.string,
  title: PropTypes.string,
  showCloseButton: PropTypes.bool,
  allowBackdropInteraction: PropTypes.bool,
  showOverlay: PropTypes.bool,
};

export default Drawer;
