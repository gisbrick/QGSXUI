import { useState, useEffect, useCallback } from 'react';

/**
 * Hook para gestionar el estado del formulario
 * Maneja los valores, errores, estado de modificación y modo de solo lectura
 * 
 * @param {boolean} readOnlyProp - Prop que indica si el formulario está en modo solo lectura
 * @returns {Object} Estado y funciones para gestionar el formulario
 */
export const useFormState = (readOnlyProp = false) => {
  const [values, setValues] = useState({});
  const [errors, setErrors] = useState({});
  const [isDirty, setIsDirty] = useState(false);
  const [readOnly, setReadOnly] = useState(readOnlyProp);

  // Actualizar readOnly cuando cambie la prop
  useEffect(() => {
    setReadOnly(readOnlyProp);
  }, [readOnlyProp]);

  /**
   * Actualiza el valor de un campo y marca el formulario como modificado
   * @param {string} field - Nombre del campo
   * @param {*} value - Nuevo valor del campo
   */
  const setValue = useCallback((field, value) => {
    setValues(prev => ({ ...prev, [field]: value }));
    setIsDirty(true);
  }, []);

  /**
   * Establece un error para un campo específico
   * @param {string} fieldName - Nombre del campo
   * @param {string} error - Mensaje de error (null o '' para limpiar)
   */
  const setFieldError = useCallback((fieldName, error) => {
    setErrors(prev => {
      const newErrors = { ...prev };
      if (error && error.trim()) {
        newErrors[fieldName] = error;
      } else {
        delete newErrors[fieldName];
      }
      return newErrors;
    });
  }, []);

  /**
   * Limpia todos los errores del formulario
   */
  const clearErrors = useCallback(() => {
    setErrors({});
  }, []);

  /**
   * Resetea el formulario a sus valores iniciales
   * @param {Object} initialValues - Valores iniciales del formulario
   */
  const resetForm = useCallback((initialValues = {}) => {
    setValues(initialValues);
    setIsDirty(false);
    setErrors({});
  }, []);

  return {
    values,
    errors,
    isDirty,
    readOnly,
    setValue,
    setValues,
    setErrors,
    setFieldError,
    clearErrors,
    setIsDirty,
    resetForm
  };
};

