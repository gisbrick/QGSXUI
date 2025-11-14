import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { loadTranslations } from '../../../hooks/translations';
import { useTranslation } from '../../../hooks/useTranslation';
import './ConfirmDialog.css';

const ConfirmDialog = ({
    open,
    title,
    message,
    confirmText,
    cancelText,
    onConfirm,
    onCancel,
    variant = 'default',
    lang = 'es',
    loading = false
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

    // Función helper para obtener traducciones de forma segura
    const getTranslation = (key, fallback) => {
        if (translations && typeof t === 'function') {
            const translated = t(key);
            // Si la traducción existe y no es igual a la clave, usarla
            if (translated && translated !== key) {
                return translated;
            }
        }
        return fallback;
    };

    // Usar traducciones por defecto si no se proporcionan
    const resolvedTitle = title || getTranslation('ui.confirmDialog.title', lang === 'en' ? 'Confirm' : 'Confirmar');
    const resolvedMessage = message || getTranslation('ui.confirmDialog.message', lang === 'en' ? 'Are you sure?' : '¿Estás seguro?');
    const resolvedConfirmText = confirmText || getTranslation('ui.confirmDialog.confirm', lang === 'en' ? 'Confirm' : 'Confirmar');
    const resolvedCancelText = cancelText || getTranslation('ui.confirmDialog.cancel', lang === 'en' ? 'Cancel' : 'Cancelar');
    const loadingText = getTranslation('ui.common.loading', lang === 'en' ? 'Loading...' : 'Cargando...');

    if (!open) return null;

    const dialogContent = (
        <div className="confirm-dialog-overlay">
            <div className={`confirm-dialog confirm-dialog--${variant}`} role="dialog" aria-modal="true">
                <div className="confirm-dialog__header">
                    <h3 className="confirm-dialog__title">{resolvedTitle}</h3>
                </div>
                <div className="confirm-dialog__body">
                    <p className="confirm-dialog__message">{resolvedMessage}</p>
                </div>
                <div className="confirm-dialog__actions">
                    <button 
                        className="confirm-dialog__button confirm-dialog__button--cancel"
                        onClick={onCancel}
                        type="button"
                        aria-label={resolvedCancelText}
                        disabled={loading}
                    >
                        {resolvedCancelText}
                    </button>
                    <button 
                        className="confirm-dialog__button confirm-dialog__button--confirm"
                        onClick={onConfirm}
                        type="button"
                        aria-label={resolvedConfirmText}
                        disabled={loading}
                    >
                        {loading ? loadingText : resolvedConfirmText}
                    </button>
                </div>
            </div>
        </div>
    );

    // Renderizar usando Portal para que aparezca fuera del árbol de componentes
    if (typeof document !== 'undefined') {
        return createPortal(dialogContent, document.body);
    }
    
    return dialogContent;
};

ConfirmDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    title: PropTypes.string,
    message: PropTypes.string,
    confirmText: PropTypes.string,
    cancelText: PropTypes.string,
    onConfirm: PropTypes.func.isRequired,
    onCancel: PropTypes.func.isRequired,
    variant: PropTypes.oneOf(['default', 'danger', 'warning']),
    lang: PropTypes.string, // Idioma para las traducciones
    loading: PropTypes.bool // Estado de carga
};

export default ConfirmDialog;