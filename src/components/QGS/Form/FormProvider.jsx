import React, { createContext, useContext, useEffect, useState } from 'react';
import { validateValue } from '../../../utilities/formValuesValidators';
import { QgisConfigContext } from '../QgisConfigContext';
import { useActionHandlers } from '../../../contexts/ActionHandlersContext';
import { fetchFeatureById, updateFeature } from '../../../services/qgisWFSFetcher';

// Creamos un contexto para compartir estado entre componentes
const FormContext = createContext(null);

export const FormProvider = ({ layerName, featureId, readOnly: readOnlyProp = false, onSave: onSaveProp = null, children }) => {

  // Obtener configuración QGIS y función de traducción del contexto
  const { config, t, notificationManager, qgsUrl, qgsProjectPath, token } = useContext(QgisConfigContext);
  
  // Obtener action handlers personalizables
  const { getHandler } = useActionHandlers();

  const [layer, setLayer] = useState(null);     // capa actual seleccionada
  const [feature, setFeature] = useState(null); // elemento actual que se está editando
  const [isNewFeature, setisNewFeature] = useState(null);     // si es un nuevo elemento o uno existente
  const [values, setValues] = useState({});     // valores actuales del formulario
  const [errors, setErrors] = useState({});     // errores actuales por campo
  const [isDirty, setIsDirty] = useState(false); // si el usuario ha modificado algo
  const [readOnly, setReadOnly] = useState(readOnlyProp); // modo solo lectura


  // Actualizar readOnly cuando cambie la prop
  useEffect(() => {
    setReadOnly(readOnlyProp);
  }, [readOnlyProp]);

  useEffect(() => {
    // Verificar que config existe antes de usarlo
    if (!config || !config.layers) {
      console.warn('FormProvider: config o config.layers no está disponible');
      setLayer(null);
      return;
    }

    // Buscar la capa que coincide con layerName en config.layers
    const layer_ = Object.entries(config.layers).find(
      ([key]) => key === layerName
    )?.[1];
    
    setLayer(layer_);

    if (layer_) {
      if (featureId) {
        // Solo cargar la feature si no está ya cargada o si cambió el featureId
        // Esto evita resetear los valores cuando el usuario está editando
        const currentFeatureId = feature?.id ? feature.id.split('.')[1] : null;
        const newFeatureId = featureId.toString();
        
        if (currentFeatureId !== newFeatureId) {
          // Recuperar la feature desde el servicio o usando fetchFeatureById directamente
          const fetchFeature = async () => {
            try {
              let f;
              // Si la capa tiene un servicio con getFeature, usarlo
              if (layer_.service && typeof layer_.service.getFeature === 'function') {
                f = await layer_.service.getFeature(featureId);
              } else if (qgsUrl && qgsProjectPath) {
                // Si no hay servicio, usar fetchFeatureById directamente
                f = await fetchFeatureById(qgsUrl, qgsProjectPath, layerName, featureId, token);
              } else {
                throw new Error('No hay servicio disponible ni parámetros QGIS para obtener la feature');
              }
              
              setFeature(f);
              setValues(f.properties || {});
              setisNewFeature(false);
            } catch (error) {
              console.error('Error obteniendo feature:', error);
              if (notificationManager && notificationManager.addNotification) {
                notificationManager.addNotification({
                  title: t('ui.qgis.error.retrievingFeature.title') || 'Error',
                  text: t('ui.qgis.error.retrievingFeature.message') || error.message || 'Error al obtener la feature',
                  level: 'error'
                });
              }
            }
          };
          
          fetchFeature();
        }
      } else {
        // Inicializar valores vacíos solo si no hay featureId y no hay feature cargada
        if (!feature) {
          setValues({});
          setFeature(null);
          setisNewFeature(true);
        }
      }
    }
  }, [layerName, featureId, qgsUrl, qgsProjectPath, token, config]);



  // Función para actualizar el valor de un campo
  const setValue = (field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  };

  // Función que valida un campo específico usando las reglas definidas
  const validateField = (field, value) => {
    // Verificar que config y fields existan
    if (!config || !config.fields || !Array.isArray(config.fields)) {
      // Si no hay config.fields, intentar buscar en layer.fields
      if (layer && layer.fields && Array.isArray(layer.fields)) {
        const fieldConfig = layer.fields.find(f => f.name === field);
        const rules = fieldConfig?.validate || [];
        const error = validateValue(value, rules);
        setErrors(prev => ({ ...prev, [field]: error }));
        return;
      }
      // Si no hay campos disponibles, no validar
      return;
    }
    
    const fieldConfig = config.fields.find(f => f.name === field);
    const rules = fieldConfig?.validate || [];
    const error = validateValue(value, rules);
    setErrors(prev => ({ ...prev, [field]: error }));
  };

  // Determina si todos los campos son válidos
  const isValid = Object.values(errors).every(e => !e);
  const canSave = isDirty && isValid; // solo se puede guardar si hay cambios y todo está válido

  // Handler por defecto para guardar
  // Usar useRef para mantener una referencia a los valores actuales
  const valuesRef = React.useRef(values);
  React.useEffect(() => {
    valuesRef.current = values;
  }, [values]);
  
  const defaultSave = async (data, context) => {
    // Siempre usar los valores actuales del estado en lugar de los datos pasados
    // Esto evita problemas con closures que capturan valores antiguos
    const currentValues = valuesRef.current;
    
    // Usar los valores actuales del estado, no los datos pasados (que pueden estar desactualizados)
    const dataToSave = currentValues;
    
    // Si hay servicio de capa, usarlo
    if (layer?.service) {
      try {
        let result;
        if (isNewFeature) {
          result = await layer.service.createFeature(dataToSave);
        } else {
          result = await layer.service.updateFeature(feature.id, dataToSave);
        }
        
        // Después de guardar exitosamente, resetear isDirty y actualizar la feature
        setIsDirty(false);
        // Actualizar la feature con los valores guardados para que el formulario refleje el estado guardado
        if (feature) {
          setFeature({
            ...feature,
            properties: dataToSave
          });
        }
        
        // Llamar al callback onSave si está disponible
        if (onSaveProp && typeof onSaveProp === 'function') {
          await onSaveProp(dataToSave, context);
        }
        return result;
      } catch (error) {
        notificationManager.addNotification({
          title: t('ui.qgis.error.savingFeature.title'),
          text: error.message || t('ui.qgis.error.savingFeature.message'),
          level: 'error'
        });
        throw error;
      }
    }
    
    // Si no hay servicio pero tenemos los parámetros QGIS, usar updateFeature directamente
    if (!isNewFeature && feature && feature.id && qgsUrl && qgsProjectPath) {
      try {
        await updateFeature(qgsUrl, qgsProjectPath, feature, dataToSave, token);
        // Mostrar notificación de éxito
        if (notificationManager && notificationManager.addNotification) {
          notificationManager.addNotification({
            title: t('ui.qgis.success.savingFeature.title') || 'Guardado exitoso',
            text: t('ui.qgis.success.savingFeature.message') || 'Los cambios se han guardado correctamente',
            level: 'success'
          });
        }
        
        // Después de guardar exitosamente, resetear isDirty y actualizar la feature
        setIsDirty(false);
        // Actualizar la feature con los valores guardados para que el formulario refleje el estado guardado
        if (feature) {
          setFeature({
            ...feature,
            properties: dataToSave
          });
        }
        
        // Llamar al callback onSave si está disponible
        if (onSaveProp && typeof onSaveProp === 'function') {
          await onSaveProp(dataToSave, context);
        }
        return { success: true };
      } catch (error) {
        notificationManager.addNotification({
          title: t('ui.qgis.error.savingFeature.title'),
          text: error.message || t('ui.qgis.error.savingFeature.message'),
          level: 'error'
        });
        throw error;
      }
    }
    
    throw new Error('Servicio de capa no disponible y no se pueden usar parámetros QGIS directos');
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