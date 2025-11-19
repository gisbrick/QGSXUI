import { useCallback, useRef, useEffect } from 'react';
import { updateFeature } from '../../../../services/qgisWFSFetcher';

/**
 * Hook para gestionar las acciones del formulario (guardar, cancelar, eliminar)
 * 
 * @param {Object} params - Parámetros del hook
 * @param {Object} params.layer - Configuración de la capa QGIS
 * @param {Object} params.feature - Feature actual
 * @param {boolean} params.isNewFeature - Indica si es una feature nueva
 * @param {Object} params.values - Valores actuales del formulario
 * @param {Function} params.setValues - Función para actualizar valores
 * @param {Function} params.setIsDirty - Función para actualizar estado de modificación
 * @param {Function} params.setFeature - Función para actualizar la feature
 * @param {Function} params.validateAllFields - Función para validar todos los campos
 * @param {Function} params.resetForm - Función para resetear el formulario
 * @param {Function} params.clearErrors - Función para limpiar errores
 * @param {string} params.qgsUrl - URL del servicio QGIS
 * @param {string} params.qgsProjectPath - Ruta del proyecto QGIS
 * @param {string} params.token - Token de autenticación
 * @param {Function} params.t - Función de traducción
 * @param {Object} params.notificationManager - Manager de notificaciones
 * @param {Function} params.onSaveProp - Callback opcional cuando se guarda exitosamente
 * @param {Function} params.getHandler - Función para obtener handlers personalizados
 * @returns {Object} Handlers de acciones del formulario
 */
export const useFormActions = ({
  layer,
  feature,
  isNewFeature,
  values,
  setValues,
  setIsDirty,
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
  language
}) => {
  // Referencia a los valores actuales para evitar problemas con closures
  const valuesRef = useRef(values);
  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  /**
   * Handler por defecto para guardar el formulario
   * Valida todos los campos y guarda los cambios
   */
  const defaultSave = useCallback(async (data, context) => {
    console.log('[useFormActions] defaultSave - LLAMADO', {
      dataKeys: Object.keys(data || {}),
      context,
      isNewFeature,
      featureId: feature?.id,
      hasFeature: !!feature,
      hasLayer: !!layer,
      hasService: !!layer?.service,
      qgsUrl: !!qgsUrl,
      qgsProjectPath: !!qgsProjectPath
    });
    
    // Validar todos los campos antes de guardar
    console.log('[useFormActions] defaultSave - Validando campos...');
    const validationResult = validateAllFields();
    console.log('[useFormActions] defaultSave - Validación completada', {
      valid: validationResult.valid,
      errorsCount: Object.keys(validationResult.errors || {}).length,
      errors: validationResult.errors
    });
    if (!validationResult.valid) {
      // Si hay errores de validación, mostrar notificación con detalles
      const errorFields = Object.keys(validationResult.errors);
      const errorMessages = errorFields.map(fieldName => {
        const field = layer?.fields?.find(f => f.name === fieldName);
        const fieldAlias = field?.alias || fieldName;
        const errorMsg = validationResult.errors[fieldName];
        return `• ${fieldAlias}: ${errorMsg}`;
      });
      
      const errorTextKey = errorMessages.length > 0 
        ? 'ui.qgis.error.validationFailed.detailedMessage'
        : 'ui.qgis.error.validationFailed.message';
      
      let errorText = errorMessages.length > 0 
        ? t(errorTextKey, { errors: errorMessages.join('\n') })
        : t(errorTextKey);
      
      // Usar fallback según el idioma si la traducción no se encuentra
      if (!errorText || errorText === errorTextKey) {
        if (errorMessages.length > 0) {
          errorText = language === 'en' 
            ? `Please correct the following errors:\n${errorMessages.join('\n')}`
            : `Por favor, corrige los siguientes errores:\n${errorMessages.join('\n')}`;
        } else {
          errorText = language === 'en'
            ? 'Please correct the errors in the form before saving'
            : 'Por favor, corrige los errores en el formulario antes de guardar';
        }
      }
      
      const titleKey = 'ui.qgis.error.validationFailed.title';
      let errorTitle = t(titleKey);
      if (!errorTitle || errorTitle === titleKey) {
        errorTitle = language === 'en' ? 'Validation error' : 'Error de validación';
      }
      
      if (notificationManager?.addNotification) {
        notificationManager.addNotification({
          title: errorTitle,
          text: errorText,
          level: 'error'
        });
      }
      throw new Error(errorText);
    }
    
    // Usar los valores actuales del estado (no los datos pasados que pueden estar desactualizados)
    const dataToSave = valuesRef.current;
    
    // Si hay servicio de capa con métodos, usarlo
    // IMPORTANTE: Si no hay servicio o el servicio no tiene métodos, usar las funciones directas de qgisWFSFetcher
    const hasServiceWithMethods = layer?.service && (
      layer.service.createFeature || 
      layer.service.updateFeature || 
      layer.service.getFeature
    );
    
    if (hasServiceWithMethods) {
      try {
        console.log('[useFormActions] defaultSave - INICIO', {
          isNewFeature,
          featureId: feature?.id,
          hasFeature: !!feature,
          layerName: context?.layerName,
          dataToSaveKeys: Object.keys(dataToSave || {}),
          hasService: !!layer?.service,
          hasCreateFeature: !!(layer?.service?.createFeature),
          hasUpdateFeature: !!(layer?.service?.updateFeature)
        });
        
        let result;
        if (isNewFeature) {
          console.log('[useFormActions] defaultSave - INSERT mode');
          
          // Si hay servicio con createFeature, usarlo; sino usar insertFeatureWithGeometry directamente
          if (layer.service.createFeature) {
            result = await layer.service.createFeature(dataToSave);
          } else {
            // Fallback: usar insertFeatureWithGeometry si no hay servicio
            // Pero necesitamos la geometría, que debería estar en feature.geometry
            const geometry = feature?.geometry || null;
            if (!geometry) {
              throw new Error('No se puede insertar una feature sin geometría');
            }
            const { insertFeatureWithGeometry } = await import('../../../../services/qgisWFSFetcher');
            result = await insertFeatureWithGeometry(
              qgsUrl,
              qgsProjectPath,
              context?.layerName || layerName,
              geometry,
              dataToSave,
              token,
              layer
            );
          }
          console.log('[useFormActions] defaultSave - INSERT result', {
            result,
            hasFid: !!(result?.fid),
            hasId: !!(result?.id),
            fid: result?.fid,
            id: result?.id
          });
          
          // Después de un insert exitoso, crear la feature con el ID devuelto
          // Esto cambiará el formulario a modo update
          if (result && (result.fid || result.id)) {
            const newFeatureId = result.fid || result.id;
            // El ID de la feature debe estar en formato "layerName.featureId"
            const featureId = context?.layerName ? `${context.layerName}.${newFeatureId}` : newFeatureId;
            
            console.log('[useFormActions] defaultSave - Creando nueva feature con ID', {
              newFeatureId,
              featureId,
              layerName: context?.layerName
            });
            
            // Crear la feature con el ID correcto
            const newFeature = {
              id: featureId,
              type: 'Feature',
              properties: dataToSave,
              geometry: feature?.geometry || null
            };
            
            console.log('[useFormActions] defaultSave - Nueva feature creada', {
              newFeature,
              newFeatureId: newFeature.id
            });
            
            // Actualizar la feature para que el formulario entre en modo update
            setFeature(newFeature);
            
            // Resetear el formulario con los valores guardados para que isDirty vuelva a false
            resetForm(dataToSave);
            
            console.log('[useFormActions] defaultSave - Feature actualizada, debería cambiar a modo UPDATE');
          } else {
            console.warn('[useFormActions] defaultSave - INSERT result no tiene fid ni id', result);
            // Si no hay ID en el resultado, mantener como estaba pero actualizar propiedades
            const updatedFeature = feature ? {
              ...feature,
              properties: dataToSave
            } : null;
            
            if (updatedFeature) {
              setFeature(updatedFeature);
            }
            
            resetForm(dataToSave);
          }
        } else {
          console.log('[useFormActions] defaultSave - UPDATE mode', {
            featureId: feature?.id,
            hasService: !!layer?.service,
            hasUpdateFeature: !!(layer?.service?.updateFeature)
          });
          
          // Si hay servicio con updateFeature, usarlo; sino usar updateFeature directamente
          if (layer?.service?.updateFeature) {
            result = await layer.service.updateFeature(feature.id, dataToSave);
          } else {
            // Usar updateFeature directamente de qgisWFSFetcher (solo atributos, sin geometría)
            result = await updateFeature(qgsUrl, qgsProjectPath, feature, dataToSave, token);
          }
          console.log('[useFormActions] defaultSave - UPDATE result', result);
          
          // Después de guardar exitosamente, actualizar feature y resetear estado del formulario
          // Actualizar la feature con los valores guardados
          const updatedFeature = feature ? {
            ...feature,
            properties: dataToSave
          } : null;
          
          if (updatedFeature) {
            setFeature(updatedFeature);
          }
          
          // Resetear el formulario con los valores guardados para que isDirty vuelva a false
          // Esto deshabilitará el botón de guardar hasta que se hagan nuevos cambios
          resetForm(dataToSave);
        }
        
        // Llamar al callback onSave si está disponible
        if (onSaveProp && typeof onSaveProp === 'function') {
          await onSaveProp(dataToSave, context);
        }
        return result;
      } catch (error) {
        const titleKey = 'ui.qgis.error.savingFeature.title';
        const messageKey = 'ui.qgis.error.savingFeature.message';
        let errorTitle = t(titleKey);
        let errorMessage = t(messageKey);
        
        if (!errorTitle || errorTitle === titleKey) {
          errorTitle = language === 'en' ? 'Error saving' : 'Error al guardar';
        }
        if (!errorMessage || errorMessage === messageKey) {
          errorMessage = language === 'en' ? 'Could not save the feature' : 'No se pudo guardar la feature';
        }
        
        notificationManager?.addNotification({
          title: errorTitle,
          text: error.message || errorMessage,
          level: 'error'
        });
        throw error;
      }
    }
    
    // Si no hay servicio (o el servicio no tiene métodos) pero tenemos los parámetros QGIS, usar las funciones directas
    // Esto es para cuando no hay servicio de capa configurado o el servicio está vacío
    if (!hasServiceWithMethods && qgsUrl && qgsProjectPath) {
      console.log('[useFormActions] defaultSave - Sin servicio, usando funciones directas', {
        isNewFeature,
        hasFeature: !!feature,
        featureId: feature?.id,
        qgsUrl: !!qgsUrl,
        qgsProjectPath: !!qgsProjectPath
      });
      
      try {
        let result;
        if (isNewFeature) {
          console.log('[useFormActions] defaultSave - INSERT mode (sin servicio)');
          // Para insert sin servicio, necesitamos la geometría
          const geometry = feature?.geometry || null;
          if (!geometry) {
            throw new Error('No se puede insertar una feature sin geometría');
          }
          const { insertFeatureWithGeometry } = await import('../../../../services/qgisWFSFetcher');
          result = await insertFeatureWithGeometry(
            qgsUrl,
            qgsProjectPath,
            context?.layerName || layerName,
            geometry,
            dataToSave,
            token,
            layer
          );
          
          console.log('[useFormActions] defaultSave - INSERT result (sin servicio)', {
            result,
            hasFid: !!(result?.fid),
            hasId: !!(result?.id),
            fid: result?.fid,
            id: result?.id
          });
          
          // Después de un insert exitoso, crear la feature con el ID devuelto
          if (result && (result.fid || result.id)) {
            const newFeatureId = result.fid || result.id;
            const featureId = context?.layerName ? `${context.layerName}.${newFeatureId}` : newFeatureId;
            
            console.log('[useFormActions] defaultSave - Creando nueva feature con ID (sin servicio)', {
              newFeatureId,
              featureId,
              layerName: context?.layerName
            });
            
            const newFeature = {
              id: featureId,
              type: 'Feature',
              properties: dataToSave,
              geometry: feature?.geometry || null
            };
            
            console.log('[useFormActions] defaultSave - Nueva feature creada (sin servicio)', {
              newFeature,
              newFeatureId: newFeature.id
            });
            
            setFeature(newFeature);
            resetForm(dataToSave);
            console.log('[useFormActions] defaultSave - Feature actualizada, debería cambiar a modo UPDATE (sin servicio)');
          } else {
            console.warn('[useFormActions] defaultSave - INSERT result no tiene fid ni id (sin servicio)', result);
            const updatedFeature = feature ? {
              ...feature,
              properties: dataToSave
            } : null;
            
            if (updatedFeature) {
              setFeature(updatedFeature);
            }
            
            resetForm(dataToSave);
          }
        } else if (!isNewFeature && feature && feature.id) {
          console.log('[useFormActions] defaultSave - UPDATE mode (sin servicio)', {
            featureId: feature?.id
          });
          // Usar updateFeature directamente (solo atributos, sin geometría)
          result = await updateFeature(qgsUrl, qgsProjectPath, feature, dataToSave, token);
          console.log('[useFormActions] defaultSave - UPDATE result (sin servicio)', result);
          
          // Actualizar la feature con los valores guardados
          const updatedFeature = feature ? {
            ...feature,
            properties: dataToSave
          } : null;
          
          if (updatedFeature) {
            setFeature(updatedFeature);
          }
          
          resetForm(dataToSave);
        } else {
          throw new Error('No se puede guardar: falta información de la feature');
        }
        
        // Mostrar notificación de éxito
        if (notificationManager?.addNotification) {
          const title = t('ui.qgis.success.savingFeature.title');
          const message = t('ui.qgis.success.savingFeature.message');
          const fallbackTitle = language === 'en' ? 'Saved successfully' : 'Guardado exitoso';
          const fallbackMessage = language === 'en' ? 'Changes have been saved successfully' : 'Los cambios se han guardado correctamente';
          
          notificationManager.addNotification({
            title: (title && title !== 'ui.qgis.success.savingFeature.title') ? title : fallbackTitle,
            text: (message && message !== 'ui.qgis.success.savingFeature.message') ? message : fallbackMessage,
            level: 'success'
          });
        }
        
        // Llamar al callback onSave si está disponible
        if (onSaveProp && typeof onSaveProp === 'function') {
          await onSaveProp(dataToSave, context);
        }
        return result;
      } catch (error) {
        const titleKey = 'ui.qgis.error.savingFeature.title';
        const messageKey = 'ui.qgis.error.savingFeature.message';
        let errorTitle = t(titleKey);
        let errorMessage = t(messageKey);
        
        if (!errorTitle || errorTitle === titleKey) {
          errorTitle = language === 'en' ? 'Error saving' : 'Error al guardar';
        }
        if (!errorMessage || errorMessage === messageKey) {
          errorMessage = language === 'en' ? 'Could not save the feature' : 'No se pudo guardar la feature';
        }
        
        notificationManager?.addNotification({
          title: errorTitle,
          text: error.message || errorMessage,
          level: 'error'
        });
        throw error;
      }
    }
    
    // Fallback: si no hay servicio ni parámetros directos, intentar onSave proporcionado
    if (typeof onSaveProp === 'function') {
      return await onSaveProp(dataToSave, context);
    }

    // Si llegamos aquí, no hay forma de guardar
    const errorKey = 'ui.qgis.error.layerServiceNotAvailable.message';
    let errorMessage = t(errorKey);
    if (!errorMessage || errorMessage === errorKey) {
      errorMessage = language === 'en' 
        ? 'Layer service not available and cannot use direct QGIS parameters'
        : 'Servicio de capa no disponible y no se pueden usar parámetros QGIS directos';
    }
    throw new Error(errorMessage);
  }, [
    layer,
    feature,
    isNewFeature,
    validateAllFields,
    setFeature,
    resetForm,
    qgsUrl,
    qgsProjectPath,
    token,
    t,
    notificationManager,
    onSaveProp,
    language
  ]);

  /**
   * Handler por defecto para cancelar los cambios
   * Resetea el formulario a sus valores originales
   */
  const defaultCancel = useCallback(() => {
    if (feature) {
      resetForm(feature.properties || {});
    } else {
      resetForm({});
    }
  }, [feature, resetForm]);

  /**
   * Handler por defecto para eliminar una feature
   */
  const defaultDelete = useCallback(async (featureIdToDelete, context) => {
    if (!layer?.service) {
      const errorKey = 'ui.qgis.error.layerServiceUnavailable.message';
      let errorMessage = t(errorKey);
      if (!errorMessage || errorMessage === errorKey) {
        errorMessage = language === 'en' ? 'Layer service not available' : 'Servicio de capa no disponible';
      }
      throw new Error(errorMessage);
    }
    
    try {
      return await layer.service.deleteFeature(featureIdToDelete);
    } catch (error) {
      const titleKey = 'ui.qgis.error.deletingFeature.title';
      const messageKey = 'ui.qgis.error.deletingFeature.message';
      let errorTitle = t(titleKey);
      let errorMessage = t(messageKey);
      
      if (!errorTitle || errorTitle === titleKey) {
        errorTitle = language === 'en' ? 'Error deleting' : 'Error al borrar';
      }
      if (!errorMessage || errorMessage === messageKey) {
        errorMessage = language === 'en' ? 'Could not delete the feature' : 'No se pudo borrar la feature';
      }
      
      notificationManager?.addNotification({
        title: errorTitle,
        text: error.message || errorMessage,
        level: 'error'
      });
      throw error;
    }
  }, [layer, t, notificationManager, language]);

  /**
   * Handler por defecto para cambios en campos
   */
  const defaultFieldChange = useCallback((fieldName, value) => {
    setValues(prev => ({ ...prev, [fieldName]: value }));
  }, [setValues]);

  // Obtener handlers personalizados o usar los por defecto
  const handleSave = getHandler('form', 'onSave', defaultSave);
  const handleCancel = getHandler('form', 'onCancel', defaultCancel);
  const handleDelete = getHandler('form', 'onDelete', defaultDelete);
  const handleFieldChange = getHandler('form', 'onFieldChange', defaultFieldChange);

  return {
    handleSave,
    handleCancel,
    handleDelete,
    handleFieldChange
  };
};

