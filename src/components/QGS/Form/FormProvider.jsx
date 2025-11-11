import React, { createContext, useContext, useEffect, useState } from 'react';
import { validateValue } from '../../../utilities/formValuesValidators';
import { QgisConfigContext } from '../QgisConfigContext';
import { useActionHandlers } from '../../../contexts/ActionHandlersContext';

// Creamos un contexto para compartir estado entre componentes
const FormContext = createContext(null);

export const FormProvider = ({ layerName, featureId, children }) => {

  // Obtener configuración QGIS y función de traducción del contexto
  const { config, t, notificationManager } = useContext(QgisConfigContext);
  
  // Obtener action handlers personalizables
  const { getHandler } = useActionHandlers();

  const [layer, setLayer] = useState(null);     // capa actual seleccionada
  const [feature, setFeature] = useState(null); // elemento actual que se está editando
  const [isNewFeature, setisNewFeature] = useState(null);     // si es un nuevo elemento o uno existente
  const [values, setValues] = useState({});     // valores actuales del formulario
  const [errors, setErrors] = useState({});     // errores actuales por campo
  const [isDirty, setIsDirty] = useState(false); // si el usuario ha modificado algo
  const [readOnly, setReadOnly] = useState(false); // modo solo lectura


  useEffect(() => {
    // Buscar la capa que coincide con layerName en config.layers
    const layer_ = Object.entries(config.layers).find(
      ([key]) => key === layerName
    )?.[1];
    setLayer(layer_);

    if (layer_) {
      if (featureId) {
        // Recuperar la feature desde el servicio
        layer_.service.getFeature(featureId)
          .then(f => {
            setFeature(f);
            setValues(f.properties || {});
            setisNewFeature(false);
          })
          .catch(() => {
            notificationManager.addNotification({
              title: t('ui.qgis.error.retrievingFeature.title'),
              text: t('ui.qgis.error.retrievingFeature.message'),
              level: 'error'
            })
          });
      } else {
        // Inicializar valores vacíos 
        setValues({});
        setFeature(null);
        setisNewFeature(true);
      }
    }
  }, []);



  // Función para actualizar el valor de un campo
  const setValue = (field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  // Función que valida un campo específico usando las reglas definidas
  const validateField = (field, value) => {
    const fieldConfig = config.fields.find(f => f.name === field);
    const rules = fieldConfig?.validate || [];
    const error = validateValue(value, rules);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Determina si todos los campos son válidos
  const isValid = Object.values(errors).every(e => !e);
  const canSave = isDirty && isValid; // solo se puede guardar si hay cambios y todo está válido

  // Handler por defecto para guardar
  const defaultSave = async (data, context) => {
    if (!layer?.service) {
      throw new Error('Servicio de capa no disponible');
    }
    
    try {
      if (isNewFeature) {
        return await layer.service.createFeature(data);
      } else {
        return await layer.service.updateFeature(feature.id, data);
      }
    } catch (error) {
      notificationManager.addNotification({
        title: t('ui.qgis.error.savingFeature.title'),
        text: error.message || t('ui.qgis.error.savingFeature.message'),
        level: 'error'
      });
      throw error;
    }
  };

  // Handler por defecto para cancelar
  const defaultCancel = () => {
    // Resetear valores al estado original
    if (feature) {
      setValues(feature.properties || {});
    } else {
      setValues({});
    }
    setIsDirty(false);
    setErrors({});
  };

  // Handler por defecto para eliminar
  const defaultDelete = async (featureIdToDelete, context) => {
    if (!layer?.service) {
      throw new Error('Servicio de capa no disponible');
    }
    
    try {
      return await layer.service.deleteFeature(featureIdToDelete);
    } catch (error) {
      notificationManager.addNotification({
        title: t('ui.qgis.error.deletingFeature.title'),
        text: error.message || t('ui.qgis.error.deletingFeature.message'),
        level: 'error'
      });
      throw error;
    }
  };

  // Obtener handlers personalizados o usar los por defecto
  const handleSave = getHandler('form', 'onSave', defaultSave);
  const handleCancel = getHandler('form', 'onCancel', defaultCancel);
  const handleDelete = getHandler('form', 'onDelete', defaultDelete);
  const handleFieldChange = getHandler('form', 'onFieldChange', (fieldName, value) => {
    // Handler por defecto solo actualiza el valor
    setValue(fieldName, value);
  });

  return (
    <FormContext.Provider value={{
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
      // Handlers expuestos para uso en componentes
      handleSave,
      handleCancel,
      handleDelete,
      handleFieldChange,
      // Contexto para pasar a los handlers
      context: { layerName, featureId, layer, feature, isNewFeature }
    }}>
      {children}
    </FormContext.Provider>
  );
};

// Hook para acceder fácilmente al contexto
export const useForm = () => useContext(FormContext);