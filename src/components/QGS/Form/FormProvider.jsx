import React, { createContext, useContext, useEffect, useState } from 'react';
import { validateValue, validateFieldValue } from '../../../utilities/formValuesValidators';
import { QgisConfigContext } from '../QgisConfigContext';
import { useActionHandlers } from '../../../contexts/ActionHandlersContext';
import { fetchFeatureById, updateFeature } from '../../../services/qgisWFSFetcher';

// Creamos un contexto para compartir estado entre componentes
const FormContext = createContext(null);

export const FormProvider = ({ layerName, featureId, readOnly: readOnlyProp = false, onSave: onSaveProp = null, children }) => {

  // Obtener configuración QGIS y función de traducción del contexto
  const { config, t, notificationManager, qgsUrl, qgsProjectPath, token, language, translations } = useContext(QgisConfigContext);
  
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
  const validateField = React.useCallback((fieldName, value) => {
    // Buscar el campo en la configuración de la capa
    if (!layer || !layer.fields || !Array.isArray(layer.fields)) {
      // Si no hay layer.fields, intentar buscar en config.fields como fallback
      if (config && config.fields && Array.isArray(config.fields)) {
        const fieldConfig = config.fields.find(f => f.name === fieldName);
        if (fieldConfig) {
          const rules = fieldConfig?.validate || [];
          const error = validateValue(value, rules);
          setErrors(prev => ({ ...prev, [fieldName]: error }));
        }
      }
      return;
    }
    
    // Buscar el campo en layer.fields
    const fieldConfig = layer.fields.find(f => f.name === fieldName);
    if (!fieldConfig) {
      // Si no se encuentra el campo, limpiar el error
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
      return;
    }
    
    // Usar el nuevo sistema de validación completo
    // Usar los valores actuales del estado para validaciones comparativas
    // Pasar también el idioma y las traducciones para el fallback
    const validation = validateFieldValue(fieldConfig, value, values, layer, t, language, translations);
    
    if (validation.valid) {
      // Si es válido, limpiar el error
      setErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[fieldName];
        return newErrors;
      });
    } else {
      // Si no es válido, establecer el mensaje de error
      // validateFieldValue siempre debe devolver un error específico cuando valid es false
      if (validation.error && validation.error.trim()) {
        setErrors(prev => {
          const newErrors = { ...prev };
          newErrors[fieldName] = validation.error;
          return newErrors;
        });
      } else {
        // Si por alguna razón no hay mensaje de error, intentar generar uno específico
        const fieldAlias = fieldConfig.alias || fieldConfig.name || fieldName;
        let errorMessage = '';
        
        // Intentar determinar el tipo de error usando traducciones
        if (fieldConfig.constraintNotNull && (value === null || value === undefined || value === '')) {
          const requiredMsg = t('ui.qgis.validation.required') || 'Este campo debe rellenarse de manera obligatoria';
          errorMessage = requiredMsg.replace('Este campo', `El campo "${fieldAlias}"`);
        } else if (fieldConfig.typeName) {
          const typeNameUpper = String(fieldConfig.typeName).toUpperCase();
          if (typeNameUpper.includes('INT') || typeNameUpper.includes('LONG')) {
            const msg = t('ui.qgis.validation.integerType') || 'El valor debe ser un número entero';
            errorMessage = `El campo "${fieldAlias}": ${msg}`;
          } else if (typeNameUpper.includes('REAL') || typeNameUpper.includes('FLOAT')) {
            const msg = t('ui.qgis.validation.numberType') || 'El valor debe ser un número';
            errorMessage = `El campo "${fieldAlias}": ${msg}`;
          } else if (typeNameUpper.includes('DATE')) {
            const msg = t('ui.qgis.validation.dateType') || 'El valor debe ser una fecha válida';
            errorMessage = `El campo "${fieldAlias}": ${msg}`;
          } else {
            const invalidMsg = t('ui.qgis.validation.invalidValue') || 'El valor introducido no es válido';
            errorMessage = `El campo "${fieldAlias}": ${invalidMsg}`;
          }
        } else {
          const invalidMsg = t('ui.qgis.validation.invalidValue') || 'El valor introducido no es válido';
          errorMessage = `El campo "${fieldAlias}": ${invalidMsg}`;
        }
        
        setErrors(prev => {
          const newErrors = { ...prev };
          newErrors[fieldName] = errorMessage;
          return newErrors;
        });
      }
    }
  }, [layer, values, config, t, language]);

  // Determina si todos los campos son válidos
  const isValid = Object.values(errors).every(e => !e || e === '');
  const canSave = isDirty && isValid; // solo se puede guardar si hay cambios y todo está válido
  
  // Validar todos los campos cuando se intenta guardar
  const validateAllFields = React.useCallback(() => {
    if (!layer || !layer.fields) return { valid: true, errors: {} };
    
    const newErrors = {};
    let hasErrors = false;
    
    layer.fields.forEach(field => {
      // Solo validar campos editables
      if (field.readOnly) return;
      
      const value = values[field.name];
      const validation = validateFieldValue(field, value, values, layer, t, language, translations);
      
      if (!validation.valid && validation.error) {
        newErrors[field.name] = validation.error;
        hasErrors = true;
      }
    });
    
    // Actualizar errores: mantener los existentes y añadir/actualizar los nuevos
    setErrors(prev => {
      const updatedErrors = { ...prev };
      // Añadir o actualizar errores encontrados
      Object.keys(newErrors).forEach(fieldName => {
        updatedErrors[fieldName] = newErrors[fieldName];
      });
      // Log para depuración
      if (hasErrors) {
        console.log('[FormProvider] Errores de validación encontrados:', updatedErrors);
      }
      return updatedErrors;
    });
    
    return { valid: !hasErrors, errors: newErrors };
  }, [layer, values, t, language]);
  
  // Re-validar todos los campos cuando cambia el idioma para actualizar los mensajes de error
  React.useEffect(() => {
    if (layer && layer.fields && Object.keys(errors).length > 0) {
      // Re-validar todos los campos que tienen errores para actualizar los mensajes
      const fieldsWithErrors = Object.keys(errors);
      fieldsWithErrors.forEach(fieldName => {
        const field = layer.fields.find(f => f.name === fieldName);
        if (field) {
          const value = values[fieldName];
          validateField(fieldName, value);
        }
      });
    }
  }, [language, t]); // Re-validar cuando cambia el idioma o la función de traducción

  // Handler por defecto para guardar
  // Usar useRef para mantener una referencia a los valores actuales
  const valuesRef = React.useRef(values);
  React.useEffect(() => {
    valuesRef.current = values;
  }, [values]);
  
  const defaultSave = async (data, context) => {
    // Validar todos los campos antes de guardar
    const validationResult = validateAllFields();
    if (!validationResult.valid) {
      // Si hay errores de validación, no guardar y mostrar notificación con detalles
      const errorFields = Object.keys(validationResult.errors);
      const errorMessages = errorFields.map(fieldName => {
        const field = layer?.fields?.find(f => f.name === fieldName);
        const fieldAlias = field?.alias || fieldName;
        const errorMsg = validationResult.errors[fieldName];
        return `• ${fieldAlias}: ${errorMsg}`;
      });
      
      const errorText = errorMessages.length > 0 
        ? `Por favor, corrige los siguientes errores:\n${errorMessages.join('\n')}`
        : 'Por favor, corrige los errores en el formulario antes de guardar';
      
      if (notificationManager && notificationManager.addNotification) {
        notificationManager.addNotification({
          title: t('ui.qgis.error.validationFailed.title') || 'Error de validación',
          text: errorText,
          level: 'error'
        });
      }
      throw new Error('Hay errores de validación en el formulario');
    }
    
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