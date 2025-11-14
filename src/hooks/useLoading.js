import { useState, useCallback } from 'react';

/**
 * Hook para manejar el estado de carga
 * @param {boolean} initialState - Estado inicial de carga
 * @returns {Object} - { isLoading, startLoading, stopLoading, setLoading }
 */
export const useLoading = (initialState = false) => {
  const [isLoading, setIsLoading] = useState(initialState);

  const startLoading = useCallback(() => setIsLoading(true), []);
  const stopLoading = useCallback(() => setIsLoading(false), []);

  return {
    isLoading,
    startLoading,
    stopLoading,
    setLoading: setIsLoading,
  };
};

