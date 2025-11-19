import { useCallback, useEffect, useRef } from 'react';
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
 * @param {boolean} isNewFeature - Si es true, es un insert (nueva feature)
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
  translations,
  isNewFeature = false
) => {
  // Usar ref para obtener los valores más recientes en validateField y validateAllFields
  // DEBE estar declarado ANTES de validateField para que pueda usarlo
  const valuesRef = useRef(values);
  useEffect(() => {
    valuesRef.current = values;
  }, [values]);

  /**
   * Valida un campo específico usando las reglas definidas en la configuración
   * @param {string} fieldName - Nombre del campo a validar
   * @param {*} value - Valor del campo a validar (opcional, si no se proporciona se usa el valor del estado)
   */
  const validateField = useCallback((fieldName, value) => {
    // Si no se proporciona el valor, usar el valor más reciente del estado
    const currentValues = valuesRef.current;
    const fieldValue = value !== undefined ? value : currentValues[fieldName];
    
    console.log('[useFormValidation] validateField', {
      fieldName,
      valueProvided: value !== undefined,
      value,
      fieldValueFromState: currentValues[fieldName],
      fieldValue,
      currentValuesKeys: Object.keys(currentValues || {})
    });
    
    // Buscar el campo en la configuración de la capa
    if (!layer || !layer.fields || !Array.isArray(layer.fields)) {
      // Si no hay layer.fields, intentar buscar en config.fields como fallback
      if (config && config.fields && Array.isArray(config.fields)) {
        const fieldConfig = config.fields.find(f => f.name === fieldName);
        if (fieldConfig) {
          // Validación básica con validateValue (sistema antiguo)
          const rules = fieldConfig?.validate || [];
          const error = validateValue(fieldValue, rules);
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
    
    const fieldAlias = fieldConfig.alias || fieldConfig.name || fieldName;
    
    const replaceFieldPlaceholder = (message) => {
      if (!message) return message;
      // Reemplazar tanto {field} como {{field}} para compatibilidad
      return message.replace(/\{\{field\}\}/g, fieldAlias).replace(/\{field\}/g, fieldAlias);
    };

    // Función helper para identificar si un campo es PK
    const isPrimaryKey = (field) => {
      if (!field) return false;
      // El campo con index 0 suele ser el PK
      if (field.index === 0) {
        return true;
      }
      // También puede ser PK si tiene constraintUnique y constraintNotNull y se llama "fid" o "id"
      const fieldNameLower = (field.name || '').toLowerCase();
      if ((field.constraintUnique === true && field.constraintNotNull === true) &&
          (fieldNameLower === 'fid' || fieldNameLower === 'id' || fieldNameLower.endsWith('_id'))) {
        return true;
      }
      return false;
    };

    // Usar el sistema de validación completo con los valores más recientes
    const validation = validateFieldValue(
      fieldConfig, 
      fieldValue, 
      currentValues, 
      layer, 
      t, 
      language, 
      translations,
      isNewFeature
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
        
        // Para inserts (nuevas features), no validar constraintNotNull en el PK ya que se asigna automáticamente en el servidor
        const fieldIsPK = isPrimaryKey(fieldConfig);
        const shouldValidateNotNull = !(fieldIsPK && isNewFeature);
        
        if (fieldConfig.constraintNotNull && shouldValidateNotNull && (fieldValue === null || fieldValue === undefined || fieldValue === '')) {
          let requiredMsg =
            t('ui.qgis.validation.requiredWithField', { field: fieldAlias }) ||
            t('ui.qgis.validation.required');
          
          // Si la traducción devuelve la clave (no se encontró), usar fallback
          if (!requiredMsg || requiredMsg === 'ui.qgis.validation.requiredWithField' || requiredMsg === 'ui.qgis.validation.required') {
            // Intentar obtener el mensaje directamente de las traducciones
            if (translations && translations.ui && translations.ui.qgis && translations.ui.qgis.validation) {
              const validationTranslations = translations.ui.qgis.validation;
              requiredMsg = validationTranslations.requiredWithField || validationTranslations.required;
            }
            
            // Si aún no hay mensaje, usar fallback hardcodeado
            if (!requiredMsg || requiredMsg === 'ui.qgis.validation.requiredWithField' || requiredMsg === 'ui.qgis.validation.required') {
              requiredMsg = `El campo "${fieldAlias}" debe rellenarse de manera obligatoria`;
            } else {
              // Interpolar {field} manualmente si existe
              requiredMsg = replaceFieldPlaceholder(requiredMsg);
            }
          } else {
            // Interpolar {field} o {{field}} manualmente si existe en el mensaje
            requiredMsg = replaceFieldPlaceholder(requiredMsg);
            // Si el mensaje genérico no incluye el nombre del campo, agregarlo
            if (requiredMsg.includes('Este campo')) {
              requiredMsg = requiredMsg.replace('Este campo', `El campo "${fieldAlias}"`);
            }
          }
          errorMessage = requiredMsg;
        } else if (fieldConfig.typeName) {
          const typeNameUpper = String(fieldConfig.typeName).toUpperCase();
          if (typeNameUpper.includes('INT') || typeNameUpper.includes('LONG')) {
            let msg = t('ui.qgis.validation.integerTypeWithField', { field: fieldAlias }) ||
              t('ui.qgis.validation.integerType') ||
              'El valor debe ser un número entero';
            
            // Si la traducción devuelve la clave, intentar obtener de translations directamente
            if (msg === 'ui.qgis.validation.integerTypeWithField' || msg === 'ui.qgis.validation.integerType') {
              if (translations && translations.ui && translations.ui.qgis && translations.ui.qgis.validation) {
                msg = translations.ui.qgis.validation.integerTypeWithField || translations.ui.qgis.validation.integerType || msg;
              }
            }
            
            // Interpolar {field} o {{field}} si existe
            msg = replaceFieldPlaceholder(msg);
            // Si el mensaje no incluye el nombre del campo, agregarlo
            if (!msg.includes(fieldAlias) && !msg.includes('{field}') && !msg.includes('{{field}}')) {
              errorMessage = `El campo "${fieldAlias}": ${msg}`;
            } else {
              errorMessage = msg;
            }
          } else if (typeNameUpper.includes('REAL') || typeNameUpper.includes('FLOAT')) {
            let msg = t('ui.qgis.validation.numberTypeWithField', { field: fieldAlias }) ||
              t('ui.qgis.validation.numberType') ||
              'El valor debe ser un número';
            
            // Si la traducción devuelve la clave, intentar obtener de translations directamente
            if (msg === 'ui.qgis.validation.numberTypeWithField' || msg === 'ui.qgis.validation.numberType') {
              if (translations && translations.ui && translations.ui.qgis && translations.ui.qgis.validation) {
                msg = translations.ui.qgis.validation.numberTypeWithField || translations.ui.qgis.validation.numberType || msg;
              }
            }
            
            // Interpolar {field} o {{field}} si existe
            msg = replaceFieldPlaceholder(msg);
            // Si el mensaje no incluye el nombre del campo, agregarlo
            if (!msg.includes(fieldAlias) && !msg.includes('{field}') && !msg.includes('{{field}}')) {
              errorMessage = `El campo "${fieldAlias}": ${msg}`;
            } else {
              errorMessage = msg;
            }
          } else if (typeNameUpper.includes('DATE')) {
            let msg = t('ui.qgis.validation.dateTypeWithField', { field: fieldAlias }) ||
              t('ui.qgis.validation.dateType') ||
              'El valor debe ser una fecha válida';
            
            // Si la traducción devuelve la clave, intentar obtener de translations directamente
            if (msg === 'ui.qgis.validation.dateTypeWithField' || msg === 'ui.qgis.validation.dateType') {
              if (translations && translations.ui && translations.ui.qgis && translations.ui.qgis.validation) {
                msg = translations.ui.qgis.validation.dateTypeWithField || translations.ui.qgis.validation.dateType || msg;
              }
            }
            
            // Interpolar {field} o {{field}} si existe
            msg = replaceFieldPlaceholder(msg);
            // Si el mensaje no incluye el nombre del campo, agregarlo
            if (!msg.includes(fieldAlias) && !msg.includes('{field}') && !msg.includes('{{field}}')) {
              errorMessage = `El campo "${fieldAlias}": ${msg}`;
            } else {
              errorMessage = msg;
            }
          } else {
            let invalidMsg = t('ui.qgis.validation.invalidValueWithField', { field: fieldAlias }) ||
              t('ui.qgis.validation.invalidValue') ||
              'El valor introducido no es válido';
            
            // Si la traducción devuelve la clave, intentar obtener de translations directamente
            if (invalidMsg === 'ui.qgis.validation.invalidValueWithField' || invalidMsg === 'ui.qgis.validation.invalidValue') {
              if (translations && translations.ui && translations.ui.qgis && translations.ui.qgis.validation) {
                invalidMsg = translations.ui.qgis.validation.invalidValueWithField || translations.ui.qgis.validation.invalidValue || invalidMsg;
              }
            }
            
            // Interpolar {field} o {{field}} si existe
            invalidMsg = replaceFieldPlaceholder(invalidMsg);
            // Si el mensaje no incluye el nombre del campo, agregarlo
            if (!invalidMsg.includes(fieldAlias) && !invalidMsg.includes('{field}') && !invalidMsg.includes('{{field}}')) {
              errorMessage = `El campo "${fieldAlias}": ${invalidMsg}`;
            } else {
              errorMessage = invalidMsg;
            }
          }
        } else {
          let invalidMsg = t('ui.qgis.validation.invalidValueWithField', { field: fieldAlias }) ||
            t('ui.qgis.validation.invalidValue') ||
            'El valor introducido no es válido';
          
          // Si la traducción devuelve la clave, intentar obtener de translations directamente
          if (invalidMsg === 'ui.qgis.validation.invalidValueWithField' || invalidMsg === 'ui.qgis.validation.invalidValue') {
            if (translations && translations.ui && translations.ui.qgis && translations.ui.qgis.validation) {
              invalidMsg = translations.ui.qgis.validation.invalidValueWithField || translations.ui.qgis.validation.invalidValue || invalidMsg;
            }
          }
          
          // Interpolar {field} o {{field}} si existe
          invalidMsg = replaceFieldPlaceholder(invalidMsg);
          // Si el mensaje no incluye el nombre del campo, agregarlo
          if (!invalidMsg.includes(fieldAlias) && !invalidMsg.includes('{field}') && !invalidMsg.includes('{{field}}')) {
            errorMessage = `El campo "${fieldAlias}": ${invalidMsg}`;
          } else {
            errorMessage = invalidMsg;
          }
        }
        
        setFieldError(fieldName, errorMessage);
      }
    }
  }, [layer, config, t, language, translations, setFieldError, isNewFeature]);

  /**
   * Valida todos los campos del formulario
   * @returns {Object} Objeto con valid: boolean y errors: Object
   */
  const validateAllFields = useCallback(() => {
    if (!layer || !layer.fields) {
      return { valid: true, errors: {} };
    }
    
    // Usar los valores más recientes del ref para evitar problemas de sincronización
    const currentValues = valuesRef.current;
    
    console.log('[useFormValidation] validateAllFields', {
      currentValuesKeys: Object.keys(currentValues || {}),
      currentValues,
      layerFieldsCount: layer.fields?.length || 0
    });
    
    const newErrors = {};
    let hasErrors = false;
    
    layer.fields.forEach(field => {
      // Solo validar campos editables
      if (field.readOnly) return;
      
      const value = currentValues[field.name];
      
      console.log('[useFormValidation] validateAllFields - campo', {
        fieldName: field.name,
        value,
        constraintNotNull: field.constraintNotNull,
        isNewFeature
      });
      const validation = validateFieldValue(
        field, 
        value, 
        currentValues, 
        layer, 
        t, 
        language, 
        translations,
        isNewFeature
      );
      
      if (!validation.valid && validation.error) {
        newErrors[field.name] = validation.error;
        hasErrors = true;
        setFieldError(field.name, validation.error);
      }
    });
    
    return { valid: !hasErrors, errors: newErrors };
  }, [layer, t, language, translations, setFieldError, isNewFeature]);

  /**
   * Determina si todos los campos son válidos
   */
  const isValid = Object.values(errors).every(e => !e || e === '');

  // Usar ref para rastrear el último idioma y evitar ciclos infinitos
  const lastLanguageRef = useRef(language);
  const errorsRef = useRef(errors);
  
  // Mantener la referencia de errores actualizada
  useEffect(() => {
    errorsRef.current = errors;
  }, [errors]);

  // Re-validar todos los campos cuando cambia el idioma para actualizar los mensajes de error
  useEffect(() => {
    // Solo re-validar si realmente cambió el idioma
    const languageChanged = lastLanguageRef.current !== language;
    
    if (languageChanged && layer && layer.fields) {
      lastLanguageRef.current = language;
      // Usar los errores actuales desde la ref para evitar dependencias
      const currentErrors = errorsRef.current;
      const hasErrors = Object.keys(currentErrors).length > 0;
      
      if (hasErrors) {
        // Solo re-validar campos que tienen errores actualmente
        const fieldsWithErrors = Object.keys(currentErrors);
        fieldsWithErrors.forEach(fieldName => {
          const field = layer.fields.find(f => f.name === fieldName);
          if (field) {
            const value = values[fieldName];
            validateField(fieldName, value);
          }
        });
      }
    }
  }, [language, t, layer, values, validateField]); // Removido 'errors' de las dependencias

  return {
    validateField,
    validateAllFields,
    isValid
  };
};

