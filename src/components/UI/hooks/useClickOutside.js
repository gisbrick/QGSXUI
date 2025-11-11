import { useState, useEffect } from 'react';

/**
 * Hook para detectar clics fuera de un elemento
 * @param {RefObject} ref - Referencia al elemento
 * @param {Function} handler - Función a ejecutar cuando se hace clic fuera
 */
export const useClickOutside = (ref, handler) => {
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (ref.current && !ref.current.contains(event.target)) {
        handler();
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [ref, handler]);
};

/**
 * Hook para manejar teclas de escape
 * @param {Function} handler - Función a ejecutar cuando se presiona escape
 */
export const useEscapeKey = (handler) => {
  useEffect(() => {
    const handleEscapeKey = (event) => {
      if (event.key === 'Escape') {
        handler();
      }
    };

    document.addEventListener('keydown', handleEscapeKey);
    return () => {
      document.removeEventListener('keydown', handleEscapeKey);
    };
  }, [handler]);
};
