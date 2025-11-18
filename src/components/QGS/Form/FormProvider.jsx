import React, { createContext, useContext } from 'react';
import PropTypes from 'prop-types';
import { QgisConfigContext } from '../QgisConfigContext';
import { useActionHandlers } from '../../../contexts/ActionHandlersContext';
import { useFormState } from './hooks/useFormState';
import { useFormValidation } from './hooks/useFormValidation';
import { useFormFeature } from './hooks/useFormFeature';
import { useFormActions } from './hooks/useFormActions';

/**
 * Contexto de React para compartir el estado del formulario entre componentes
 */
const FormContext = createContext(null);

/**
 * Proveedor de contexto para formularios QGIS
 * 
 * Este componente gestiona el estado completo de un formulario de edición de features,
 * incluyendo validación, carga de datos y acciones de guardado/cancelación.
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.layerName - Nombre de la capa QGIS
 * @param {string|number} props.featureId - ID de la feature a editar (opcional, null para nueva feature)
 * @param {boolean} props.readOnly - Si es true, el formulario está en modo solo lectura
 * @param {Function} props.onSave - Callback opcional que se ejecuta cuando se guarda exitosamente
 * @param {React.ReactNode} props.children - Componentes hijos que consumirán el contexto del formulario
 */
export const FormProvider = ({ 
  layerName, 
  featureId, 
  readOnly: readOnlyProp = false, 
  onSave: onSaveProp = null, 
  children 
}) => {
  // Obtener configuración QGIS del contexto
  const { 
    config, 
    t, 
    notificationManager, 
    qgsUrl, 
    qgsProjectPath, 
    token, 
    language, 
    translations 
  } = useContext(QgisConfigContext);
  
  // Obtener action handlers personalizables
  const { getHandler } = useActionHandlers();

  // Hook para gestionar el estado del formulario (valores, errores, dirty state)
  const {
    values,
    errors,
    isDirty,
    readOnly,
    setValue,
    setValues,
    setFieldError,
    clearErrors,
    setIsDirty,
    resetForm
  } = useFormState(readOnlyProp);

  // Hook para cargar la capa y la feature
  const {
    layer,
    feature,
    isNewFeature,
    setFeature
  } = useFormFeature({
    config,
    layerName,
    featureId,
    qgsUrl,
    qgsProjectPath,
    token,
    t,
    notificationManager
  });

  // Inicializar valores cuando se carga la feature
  React.useEffect(() => {
    if (feature && feature.properties) {
      setValues(feature.properties);
    } else if (!featureId) {
      // Si no hay featureId, es una feature nueva, mantener valores vacíos
      setValues({});
    }
  }, [feature, featureId, setValues]);

  // Hook para gestionar la validación del formulario
  const {
    validateField,
    validateAllFields,
    isValid
  } = useFormValidation(
    layer,
    config,
    values,
    errors,
    setFieldError,
    t,
    language,
    translations
  );

  // Hook para gestionar las acciones del formulario (guardar, cancelar, eliminar)
  const {
    handleSave,
    handleCancel,
    handleDelete,
    handleFieldChange
  } = useFormActions({
    layer,
    feature,
    isNewFeature,
    values,
    setValues,
    setIsDirty, // Pasar setIsDirty para poder resetear el estado después de guardar
    setFeature,
    validateAllFields,
    resetForm,
    clearErrors,
    qgsUrl,
    qgsProjectPath,
    token,
    t,
    notificationManager,
    onSaveProp,
    getHandler
  });

  // Determinar si se puede guardar
  // Para nuevas features: solo requiere que sea válido (sin necesidad de cambios)
  // Para features existentes: requiere cambios y que sea válido
  const canSave = isNewFeature ? isValid : (isDirty && isValid);

  /**
   * Valor del contexto que se proporciona a los componentes hijos
   */
  const contextValue = React.useMemo(() => ({
    layer,                    // Configuración de la capa QGIS
    isNewFeature,            // Indica si es una feature nueva
    feature,                 // Feature actual
    config,                  // Configuración completa del proyecto
    values,                  // Valores actuales del formulario
    errors,                  // Errores de validación por campo
    readOnly,                // Modo solo lectura
    setValue,                // Función para actualizar un valor
    validateField,           // Función para validar un campo
    isValid,                 // Indica si todos los campos son válidos
    isDirty,                 // Indica si el formulario ha sido modificado
    canSave,                 // Indica si se puede guardar
    handleSave,              // Handler para guardar
    handleCancel,            // Handler para cancelar
    handleDelete,            // Handler para eliminar
    handleFieldChange,       // Handler para cambios en campos
    context: {               // Contexto adicional para pasar a los handlers
      layerName,
      featureId,
      layer,
      feature,
      isNewFeature
    }
  }), [
    layer,
    isNewFeature,
    feature,
    config,
    values,
    errors,
    readOnly,
    setValue,
    validateField,
    isValid,
    isDirty,
    canSave,
    handleSave,
    handleCancel,
    handleDelete,
    handleFieldChange,
    layerName,
    featureId
  ]);

  return (
    <FormContext.Provider value={contextValue}>
      {children}
    </FormContext.Provider>
  );
};

FormProvider.propTypes = {
  layerName: PropTypes.string.isRequired,
  featureId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  readOnly: PropTypes.bool,
  onSave: PropTypes.func,
  children: PropTypes.node.isRequired
};

/**
 * Hook para acceder al contexto del formulario
 * @returns {Object} Estado y funciones del formulario
 */
export const useForm = () => {
  const context = useContext(FormContext);
  if (!context) {
    throw new Error('useForm debe usarse dentro de un FormProvider');
  }
  return context;
};
