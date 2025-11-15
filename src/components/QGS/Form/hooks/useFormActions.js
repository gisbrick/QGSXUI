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
  getHandler
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
    // Validar todos los campos antes de guardar
    const validationResult = validateAllFields();
    if (!validationResult.valid) {
      // Si hay errores de validación, mostrar notificación con detalles
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
      
      if (notificationManager?.addNotification) {
        notificationManager.addNotification({
          title: t('ui.qgis.error.validationFailed.title') || 'Error de validación',
          text: errorText,
          level: 'error'
        });
      }
      throw new Error('Hay errores de validación en el formulario');
    }
    
    // Usar los valores actuales del estado (no los datos pasados que pueden estar desactualizados)
    const dataToSave = valuesRef.current;
    
    // Si hay servicio de capa, usarlo
    if (layer?.service) {
      try {
        let result;
        if (isNewFeature) {
          result = await layer.service.createFeature(dataToSave);
        } else {
          result = await layer.service.updateFeature(feature.id, dataToSave);
        }
        
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
        
        // Llamar al callback onSave si está disponible
        if (onSaveProp && typeof onSaveProp === 'function') {
          await onSaveProp(dataToSave, context);
        }
        return result;
      } catch (error) {
        notificationManager?.addNotification({
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
        if (notificationManager?.addNotification) {
          notificationManager.addNotification({
            title: t('ui.qgis.success.savingFeature.title') || 'Guardado exitoso',
            text: t('ui.qgis.success.savingFeature.message') || 'Los cambios se han guardado correctamente',
            level: 'success'
          });
        }
        
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
        
        // Llamar al callback onSave si está disponible
        if (onSaveProp && typeof onSaveProp === 'function') {
          await onSaveProp(dataToSave, context);
        }
        return { success: true };
      } catch (error) {
        notificationManager?.addNotification({
          title: t('ui.qgis.error.savingFeature.title'),
          text: error.message || t('ui.qgis.error.savingFeature.message'),
          level: 'error'
        });
        throw error;
      }
    }
    
    throw new Error('Servicio de capa no disponible y no se pueden usar parámetros QGIS directos');
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
    onSaveProp
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
      throw new Error('Servicio de capa no disponible');
    }
    
    try {
      return await layer.service.deleteFeature(featureIdToDelete);
    } catch (error) {
      notificationManager?.addNotification({
        title: t('ui.qgis.error.deletingFeature.title'),
        text: error.message || t('ui.qgis.error.deletingFeature.message'),
        level: 'error'
      });
      throw error;
    }
  }, [layer, t, notificationManager]);

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

