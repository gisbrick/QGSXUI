import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { loadTranslations } from '../../../hooks/translations';
import { useTranslation } from '../../../hooks/useTranslation';
import './Modal.css';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  closeText,
  size = 'medium',
  footer,
  lang = 'es',
  className = ''
}) => {
  const [translations, setTranslations] = useState(null);

  // Cargar traducciones cuando cambie el idioma
  useEffect(() => {
    const loadLang = async () => {
      const t = await loadTranslations(lang);
      setTranslations(t);
    };
    loadLang();
  }, [lang]);

  // Usar el hook de traducción
  const t = useTranslation(lang, translations);

  if (!isOpen) return null;

  const modalClasses = [
    'modal-content',
    `modal-content--${size}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div 
      className="modal-backdrop"
      onClick={onClose}
    >
      <div 
        className={modalClasses}
        onClick={(e) => e.stopPropagation()}
      >
        {title && (
          <div className="modal-header">
            <h2>{title}</h2>
            <button 
              onClick={onClose}
              aria-label={closeText || (translations ? t('ui.modal.close') : (lang === 'en' ? 'Close' : 'Cerrar'))}
            >
              ×
            </button>
          </div>
        )}
        <div className="modal-body">
          {children}
        </div>
        {footer && (
          <div className="modal-footer">
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};

Modal.propTypes = {
  /** Si el modal está abierto */
  isOpen: PropTypes.bool.isRequired,
  /** Función para cerrar el modal */
  onClose: PropTypes.func.isRequired,
  /** Título del modal */
  title: PropTypes.string,
  /** Contenido del modal */
  children: PropTypes.node,
  /** Texto del botón de cerrar */
  closeText: PropTypes.string,
  /** Tamaño del modal */
  size: PropTypes.oneOf(['small', 'medium', 'large', 'full']),
  /** Footer del modal (botones, etc.) */
  footer: PropTypes.node,
  /** Idioma para las traducciones */
  lang: PropTypes.oneOf(['es', 'en']),
  /** Clase CSS adicional */
  className: PropTypes.string
};

export default Modal;