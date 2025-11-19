import React, { useState, useEffect } from 'react';
import { createPortal } from 'react-dom';
import PropTypes from 'prop-types';
import { loadTranslations } from '../../../hooks/translations';
import { useTranslation } from '../../../hooks/useTranslation';
import './UnsavedChangesDialog.css';

const UnsavedChangesDialog = ({
    open,
    onSave,
    onExit,
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
    const resolvedTitle = getTranslation('ui.unsavedChangesDialog.title', lang === 'en' ? 'Unsaved Changes' : 'Cambios sin guardar');
    const resolvedMessage = getTranslation('ui.unsavedChangesDialog.message', lang === 'en' ? 'There are unsaved changes, and if you exit they will be lost. Do you want to save the data before exiting?' : 'Hay datos sin guardar, y si sale se perderán. ¿Desea guardar los datos antes de salir?');
    const saveText = getTranslation('ui.common.save', lang === 'en' ? 'Save' : 'Guardar');
    const exitText = getTranslation('ui.common.exit', lang === 'en' ? 'Exit' : 'Salir');
    const savingText = getTranslation('ui.common.saving', lang === 'en' ? 'Saving...' : 'Guardando...');

    if (!open) return null;

    const dialogContent = (
        <div className="unsaved-changes-dialog-overlay">
            <div className="unsaved-changes-dialog" role="dialog" aria-modal="true">
                <div className="unsaved-changes-dialog__header">
                    <h3 className="unsaved-changes-dialog__title">{resolvedTitle}</h3>
                </div>
                <div className="unsaved-changes-dialog__body">
                    <p className="unsaved-changes-dialog__message">{resolvedMessage}</p>
                </div>
                <div className="unsaved-changes-dialog__actions">
                    <button 
                        className="unsaved-changes-dialog__button unsaved-changes-dialog__button--save"
                        onClick={onSave}
                        type="button"
                        aria-label={saveText}
                        disabled={loading}
                    >
                        <i className="fas fa-floppy-disk" style={{ marginRight: '8px' }} />
                        {loading ? savingText : saveText}
                    </button>
                    <button 
                        className="unsaved-changes-dialog__button unsaved-changes-dialog__button--exit"
                        onClick={onExit}
                        type="button"
                        aria-label={exitText}
                        disabled={loading}
                    >
                        <i className="fas fa-xmark" style={{ marginRight: '8px' }} />
                        {exitText}
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

UnsavedChangesDialog.propTypes = {
    open: PropTypes.bool.isRequired,
    onSave: PropTypes.func.isRequired,
    onExit: PropTypes.func.isRequired,
    lang: PropTypes.string, // Idioma para las traducciones
    loading: PropTypes.bool // Estado de carga
};

export default UnsavedChangesDialog;

