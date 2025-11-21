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
  feature: featureProp = null, // Feature opcional para nuevas features con geometría
  readOnly: readOnlyProp = false, 
  onSave: onSaveProp = null,
  cancelDrawing = null, // Función para cancelar el dibujo y limpiar geometrías temporales
  refreshWMSLayer = null, // Función para refrescar la capa WMS del mapa
  mapInstance = null, // Instancia del mapa para refrescar tiles
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
    feature: featureProp, // Pasar la feature prop para nuevas features con geometría
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
      setIsDirty(false);
    } else if (!featureId) {
      setValues({});
      setIsDirty(false);
    }
  }, [feature, featureId, setValues, setIsDirty]);

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
    translations,
    isNewFeature
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
    getHandler,
    language,
    cancelDrawing,
    refreshWMSLayer,
    mapInstance
  });

  // Determinar si se puede guardar
  // Para nuevas features: solo requiere que sea válido (sin necesidad de cambios)
  // Para features existentes: requiere cambios y que sea válido
  const canSave = isNewFeature ? isValid : (isDirty && isValid);

  /**
   * Valor del contexto que se proporciona a los componentes hijos
   * IMPORTANTE: Este useMemo siempre debe devolver un objeto válido
   * para que el FormContext.Provider siempre tenga un valor disponible
   */
  const contextValue = React.useMemo(() => {
    // Asegurar que siempre devolvemos un objeto válido
    return {
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
      cancelDrawing,
      refreshWMSLayer,
      mapInstance,
      layer,
      feature,
      isNewFeature
    }
    };
  }, [
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

  // Asegurar que el contexto siempre esté disponible
  // useMemo siempre debería devolver un objeto, pero por si acaso verificamos
  const safeContextValue = contextValue || {
    layer: null,
    isNewFeature: true,
    feature: null,
    config: config || null,
    values: {},
    errors: {},
    readOnly: readOnlyProp,
    setValue: () => {},
    validateField: () => {},
    isValid: false,
    isDirty: false,
    canSave: false,
    handleSave: async () => {},
    handleCancel: () => {},
    handleDelete: async () => {},
    handleFieldChange: () => {},
    context: { layerName, featureId, layer: null, feature: null, isNewFeature: true }
  };

  return (
    <FormContext.Provider value={safeContextValue}>
      {children}
    </FormContext.Provider>
  );
};

FormProvider.propTypes = {
  layerName: PropTypes.string.isRequired,
  featureId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  readOnly: PropTypes.bool,
  onSave: PropTypes.func,
  cancelDrawing: PropTypes.func,
  refreshWMSLayer: PropTypes.func,
  mapInstance: PropTypes.object,
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
