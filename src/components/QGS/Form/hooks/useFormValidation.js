import { useCallback, useEffect } from 'react';
import { validateFieldValue } from '../../../../utilities/formValuesValidators';

/**
 * Hook para gestionar la validación del formulario
 * Proporciona funciones para validar campos individuales y todo el formulario
 * 
 * @param {Object} layer - Configuración de la capa QGIS
 * @param {Object} config - Configuración completa del proyecto QGIS
 * @param {Object} values - Valores actuales del formulario
 * @param {Object} errors - Errores actuales del formulario
 * @param {Function} setFieldError - Función para establecer errores de campos
 * @param {Function} t - Función de traducción
 * @param {string} language - Código del idioma
 * @param {Object} translations - Traducciones completas
 * @returns {Object} Funciones y estado de validación
 */
export const useFormValidation = (
  layer,
  config,
  values,
  errors,
  setFieldError,
  t,
  language,
  translations
) => {
  /**
   * Valida un campo específico usando las reglas definidas en la configuración
   * @param {string} fieldName - Nombre del campo a validar
   * @param {*} value - Valor del campo a validar
   */
  const validateField = useCallback((fieldName, value) => {
    // Buscar el campo en la configuración de la capa
    if (!layer || !layer.fields || !Array.isArray(layer.fields)) {
      // Si no hay layer.fields, intentar buscar en config.fields como fallback
      if (config && config.fields && Array.isArray(config.fields)) {
        const fieldConfig = config.fields.find(f => f.name === fieldName);
        if (fieldConfig) {
          // Validación básica con validateValue (sistema antiguo)
          const rules = fieldConfig?.validate || [];
          const error = validateValue(value, rules);
          setFieldError(fieldName, error);
        }
      }
      return;
    }
    
    // Buscar el campo en layer.fields
    const fieldConfig = layer.fields.find(f => f.name === fieldName);
    if (!fieldConfig) {
      // Si no se encuentra el campo, limpiar el error
      setFieldError(fieldName, null);
      return;
    }
    
    // Usar el sistema de validación completo
    const validation = validateFieldValue(
      fieldConfig, 
      value, 
      values, 
      layer, 
      t, 
      language, 
      translations
    );
    
    if (validation.valid) {
      setFieldError(fieldName, null);
    } else {
      // Si hay un mensaje de error específico, usarlo
      if (validation.error && validation.error.trim()) {
        setFieldError(fieldName, validation.error);
      } else {
        // Generar mensaje de error genérico si no hay uno específico
        const fieldAlias = fieldConfig.alias || fieldConfig.name || fieldName;
        let errorMessage = '';
        
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
        
        setFieldError(fieldName, errorMessage);
      }
    }
  }, [layer, values, config, t, language, translations, setFieldError]);

  /**
   * Valida todos los campos del formulario
   * @returns {Object} Objeto con valid: boolean y errors: Object
   */
  const validateAllFields = useCallback(() => {
    if (!layer || !layer.fields) {
      return { valid: true, errors: {} };
    }
    
    const newErrors = {};
    let hasErrors = false;
    
    layer.fields.forEach(field => {
      // Solo validar campos editables
      if (field.readOnly) return;
      
      const value = values[field.name];
      const validation = validateFieldValue(
        field, 
        value, 
        values, 
        layer, 
        t, 
        language, 
        translations
      );
      
      if (!validation.valid && validation.error) {
        newErrors[field.name] = validation.error;
        hasErrors = true;
        setFieldError(field.name, validation.error);
      }
    });
    
    return { valid: !hasErrors, errors: newErrors };
  }, [layer, values, t, language, translations, setFieldError]);

  /**
   * Determina si todos los campos son válidos
   */
  const isValid = Object.values(errors).every(e => !e || e === '');

  // Re-validar todos los campos cuando cambia el idioma para actualizar los mensajes de error
  useEffect(() => {
    if (layer && layer.fields && Object.keys(errors).length > 0) {
      const fieldsWithErrors = Object.keys(errors);
      fieldsWithErrors.forEach(fieldName => {
        const field = layer.fields.find(f => f.name === fieldName);
        if (field) {
          const value = values[fieldName];
          validateField(fieldName, value);
        }
      });
    }
  }, [language, t, layer, values, errors, validateField]);

  return {
    validateField,
    validateAllFields,
    isValid
  };
};

