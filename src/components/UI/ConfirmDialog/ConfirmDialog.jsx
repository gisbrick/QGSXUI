import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { loadTranslations } from '../../../utilities/traslations';
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

    // Si las traducciones no están cargadas, mostrar loading
    if (!translations) {
        return null; // Para modales, mejor no mostrar nada mientras carga
    }

    // Usar traducciones por defecto si no se proporcionan
    const resolvedTitle = title || t('ui.confirmDialog.title');
    const resolvedMessage = message || t('ui.confirmDialog.message');
    const resolvedConfirmText = confirmText || t('ui.confirmDialog.confirm');
    const resolvedCancelText = cancelText || t('ui.confirmDialog.cancel');

    if (!open) return null;

    return (
        <div className="confirm-dialog-backdrop">
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
                    >
                        {resolvedCancelText}
                    </button>
                    <button 
                        className="confirm-dialog__button confirm-dialog__button--confirm"
                        onClick={onConfirm}
                        type="button"
                        aria-label={resolvedConfirmText}
                    >
                        {resolvedConfirmText}
                    </button>
                </div>
            </div>
        </div>
    );
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
    lang: PropTypes.string // Idioma para las traducciones
};

export default ConfirmDialog;