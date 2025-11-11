import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { loadTranslations } from '../../../utilities/traslations';
import { useTranslation } from '../../../hooks/useTranslation';

const Modal = ({ 
  isOpen, 
  onClose, 
  title, 
  children, 
  closeText,
  lang = 'es' 
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

  return (
    <div 
      style={{
        position: 'fixed',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000
      }}
      onClick={onClose}
    >
      <div 
        style={{
          backgroundColor: 'white',
          padding: '20px',
          borderRadius: '8px',
          maxWidth: '500px',
          width: '90%',
          maxHeight: '80%',
          overflow: 'auto'
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
          <h3 style={{ margin: 0 }}>{title}</h3>
          <button 
            onClick={onClose} 
            style={{ background: 'none', border: 'none', fontSize: '20px', cursor: 'pointer' }}
            aria-label={closeText || (translations ? t('ui.modal.close') : (lang === 'en' ? 'Close' : 'Cerrar'))}
          >
            ×
          </button>
        </div>
        {children}
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
  /** Idioma para las traducciones */
  lang: PropTypes.oneOf(['es', 'en'])
};

export default Modal;