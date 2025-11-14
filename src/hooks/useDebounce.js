import { useState, useEffect } from 'react';

/**
 * Hook para debounce - retrasa la actualización de un valor
 * @param {any} value - Valor a hacer debounce
 * @param {number} delay - Tiempo de retraso en milisegundos
 * @returns {any} - Valor con debounce aplicado
 */
export const useDebounce = (value, delay) => {
  const [debouncedValue, setDebouncedValue] = useState(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
};

