import { useState, useCallback, useMemo } from 'react';

/**
 * Hook personalizado para gestionar notificaciones
 * Proporciona métodos para añadir, eliminar y gestionar notificaciones del sistema
 * 
 * @returns {Object} Objeto con el array de notificaciones y métodos para gestionarlas
 */
export const useNotifications = () => {
  const [notifications, setNotifications] = useState([]);

  /**
   * Elimina una notificación por su ID
   * @param {string|number} id - ID de la notificación a eliminar
   */
  const removeNotification = useCallback((id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  }, []);

  /**
   * Añade una nueva notificación al sistema
   * @param {Object} notification - Objeto con title, text y level de la notificación
   * @param {string} notification.title - Título de la notificación
   * @param {string} notification.text - Texto del mensaje
   * @param {string} notification.level - Nivel: 'info', 'success', 'warning', 'error'
   */
  const addNotification = useCallback(({ title, text, level }) => {
    // Normalizar el nivel: 'warn' -> 'warning', etc.
    const normalizedLevel = level === 'warn' ? 'warning' : (level || 'info');
    
    // Validar que el nivel sea uno de los permitidos
    const validLevels = ['info', 'success', 'warning', 'error'];
    const messageLevel = validLevels.includes(normalizedLevel) ? normalizedLevel : 'info';
    
    // Generar ID único para la notificación
    const id = Date.now() + Math.random();
    
    // Añadir la notificación al estado
    setNotifications(prev => [
      ...prev,
      {
        id,
        title,
        text,
        level: messageLevel
      }
    ]);

    // Eliminar automáticamente después de 5 segundos
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  }, [removeNotification]);
  
  /**
   * Métodos de conveniencia para añadir notificaciones por tipo
   */
  const addSuccess = useCallback(
    (title, text) => addNotification({ title, text, level: 'success' }), 
    [addNotification]
  );
  
  const addError = useCallback(
    (title, text) => addNotification({ title, text, level: 'error' }), 
    [addNotification]
  );
  
  const addWarning = useCallback(
    (title, text) => addNotification({ title, text, level: 'warning' }), 
    [addNotification]
  );
  
  const addInfo = useCallback(
    (title, text) => addNotification({ title, text, level: 'info' }), 
    [addNotification]
  );

  /**
   * Manager de notificaciones expuesto (sin incluir el array para evitar re-renders)
   */
  const notificationManager = useMemo(() => ({
    addNotification,
    addSuccess,
    addError,
    addWarning,
    addInfo,
    removeNotification
  }), [addNotification, addSuccess, addError, addWarning, addInfo, removeNotification]);

  return {
    notifications,
    notificationManager
  };
};

