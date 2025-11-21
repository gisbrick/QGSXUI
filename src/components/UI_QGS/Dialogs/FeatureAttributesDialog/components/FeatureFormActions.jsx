import React, { useState, useEffect, useRef, useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useForm } from '../../../../QGS/Form/FormProvider';
import { QgisConfigContext } from '../../../../QGS/QgisConfigContext';
import { getTranslationsSync } from '../../../../../utilities/translationsLoader';
import { normalizeLanguage } from '../../../../../config/languages';
import enTranslations from '../../../../../locales/en/translation.json';
import esTranslations from '../../../../../locales/es/translation.json';

/**
 * Componente para los botones de acción del formulario (Guardar/Cancelar)
 * Se renderiza dentro del FormProvider para tener acceso al contexto del formulario
 */
const FeatureFormActions = ({ 
  onIsDirtyChange, 
  onFormRefsChange,
  language = 'es'
}) => {
  const {
    canSave,
    handleSave,
    handleCancel,
    values,
    isDirty,
    context
  } = useForm();
  
  const qgisContext = useContext(QgisConfigContext);
  const [isSaving, setIsSaving] = useState(false);
  const [isSaveLocked, setIsSaveLocked] = useState(false);
  const formValuesRef = useRef(values);
  
  // Actualizar referencia isDirty cuando cambie
  useEffect(() => {
    if (onIsDirtyChange) {
      onIsDirtyChange(isDirty);
    }
  }, [isDirty, onIsDirtyChange]);
  
  // Actualizar referencias del formulario
  useEffect(() => {
    formValuesRef.current = values;
    if (onFormRefsChange && handleSave && context) {
      onFormRefsChange(handleSave, values, context);
    }
  }, [values, handleSave, context, onFormRefsChange]);
  
  // Desbloquear el guardado cuando se detecten cambios nuevos
  useEffect(() => {
    if (isSaveLocked && isDirty) {
      setIsSaveLocked(false);
    }
  }, [isSaveLocked, isDirty]);
  
  // Función de traducción
  const translate = useMemo(() => {
    const getTranslation = (translations, key) => {
      if (!translations || !key) return key;
      const keys = key.split('.');
      let result = translations;
      for (const k of keys) {
        if (result && typeof result === 'object' && k in result) {
          result = result[k];
        } else {
          return key;
        }
      }
      return typeof result === 'string' && result !== '' ? result : key;
    };
    
    const contextToUse = qgisContext || {};
    const contextLanguage = contextToUse?.language || language || 'es';
    const availableTranslations = { es: esTranslations, en: enTranslations };
    const contextTranslations = getTranslationsSync(contextLanguage, availableTranslations);
    
    return (key) => {
      const directValue = getTranslation(contextTranslations, key);
      if (directValue && directValue !== key) return directValue;
      
      if (contextToUse?.translations) {
        const value = getTranslation(contextToUse.translations, key);
        if (value && value !== key) return value;
      }
      
      if (contextToUse?.t && typeof contextToUse.t === 'function') {
        const value = contextToUse.t(key);
        if (value && value !== '' && value !== null && value !== undefined && value !== key) {
          return value;
        }
      }
      
      return key;
    };
  }, [qgisContext, language]);
  
  // Handler para el submit del formulario
  const handleSubmit = React.useCallback(async (e) => {
    e.preventDefault();
    
    if (!canSave || isSaving || isSaveLocked) {
      return;
    }
    
    setIsSaving(true);
    try {
      await handleSave(values, context);
      setIsSaveLocked(true);
    } catch (error) {
      console.error('Error al guardar:', error);
    } finally {
      setIsSaving(false);
    }
  }, [canSave, isSaving, isSaveLocked, handleSave, values, context]);
  
  // Guardar referencias para acceso externo
  const handleSubmitRef = useRef(handleSubmit);
  const handleCancelRef = useRef(handleCancel);
  
  useEffect(() => {
    handleSubmitRef.current = handleSubmit;
    handleCancelRef.current = handleCancel;
  }, [handleSubmit, handleCancel]);
  
  // Exponer referencias para acceso externo
  React.useImperativeHandle(React.useRef(), () => ({
    handleSubmit: () => handleSubmitRef.current({ preventDefault: () => {} }),
    handleCancel: () => handleCancelRef.current()
  }));
  
  // Este componente no renderiza nada directamente
  // Los botones se renderizan en el footer del diálogo
  return null;
};

FeatureFormActions.propTypes = {
  onIsDirtyChange: PropTypes.func,
  onFormRefsChange: PropTypes.func,
  language: PropTypes.string
};

export default FeatureFormActions;

