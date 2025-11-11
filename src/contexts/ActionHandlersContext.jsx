import React, { createContext, useContext } from 'react';
import PropTypes from 'prop-types';

/**
 * Contexto para gestionar handlers de acciones personalizables
 * Permite sobrescribir acciones por defecto de los componentes
 */
const ActionHandlersContext = createContext(null);

/**
 * Provider de Action Handlers
 * 
 * @example
 * // En tu aplicación:
 * <ActionHandlersProvider handlers={{
 *   form: {
 *     onSave: async (data) => {
 *       // Tu lógica personalizada
 *       console.log('Guardando con lógica personalizada', data);
 *       return await customSaveFunction(data);
 *     },
 *     onCancel: () => {
 *       // Lógica personalizada para cancelar
 *     }
 *   },
 *   table: {
 *     onRowClick: (row) => {
 *       // Lógica personalizada al hacer clic en una fila
 *     },
 *     onEdit: (row) => {
 *       // Lógica personalizada para editar
 *     }
 *   },
 *   map: {
 *     onFeatureClick: (feature) => {
 *       // Lógica personalizada al hacer clic en una feature
 *     }
 *   }
 * }}>
 *   <App />
 * </ActionHandlersProvider>
 */
export const ActionHandlersProvider = ({ handlers = {}, children }) => {
  return (
    <ActionHandlersContext.Provider value={handlers}>
      {children}
    </ActionHandlersContext.Provider>
  );
};

ActionHandlersProvider.propTypes = {
  /** Objeto con handlers personalizados por componente */
  handlers: PropTypes.shape({
    form: PropTypes.shape({
      onSave: PropTypes.func,
      onCancel: PropTypes.func,
      onDelete: PropTypes.func,
      onFieldChange: PropTypes.func,
      onValidation: PropTypes.func
    }),
    table: PropTypes.shape({
      onRowClick: PropTypes.func,
      onRowEdit: PropTypes.func,
      onRowDelete: PropTypes.func,
      onRowSelect: PropTypes.func,
      onPageChange: PropTypes.func
    }),
    map: PropTypes.shape({
      onFeatureClick: PropTypes.func,
      onFeatureSelect: PropTypes.func,
      onMapClick: PropTypes.func,
      onMapMove: PropTypes.func,
      onLayerChange: PropTypes.func
    })
  }),
  children: PropTypes.node.isRequired
};

/**
 * Hook para acceder a los action handlers
 * 
 * @param {string} component - Nombre del componente ('form', 'table', 'map')
 * @param {string} action - Nombre de la acción ('onSave', 'onCancel', etc.)
 * @param {Function} defaultHandler - Handler por defecto si no hay uno personalizado
 * @returns {Function} - Handler a ejecutar (personalizado o por defecto)
 * 
 * @example
 * // En un componente:
 * const { getHandler } = useActionHandlers();
 * 
 * const handleSave = getHandler('form', 'onSave', async (data) => {
 *   // Handler por defecto
 *   return await defaultSave(data);
 * });
 * 
 * // Usar el handler
 * await handleSave(formData);
 */
export const useActionHandlers = () => {
  const handlers = useContext(ActionHandlersContext) || {};

  /**
   * Obtiene un handler personalizado o devuelve el por defecto
   */
  const getHandler = (component, action, defaultHandler) => {
    const componentHandlers = handlers[component];
    const customHandler = componentHandlers?.[action];
    
    // Si hay un handler personalizado, lo devolvemos
    if (customHandler && typeof customHandler === 'function') {
      return customHandler;
    }
    
    // Si no, devolvemos el handler por defecto o una función vacía
    return defaultHandler || (() => {});
  };

  /**
   * Ejecuta un handler si existe, o el por defecto
   */
  const executeHandler = async (component, action, defaultHandler, ...args) => {
    const handler = getHandler(component, action, defaultHandler);
    return await handler(...args);
  };

  /**
   * Verifica si existe un handler personalizado para una acción
   */
  const hasCustomHandler = (component, action) => {
    return !!handlers[component]?.[action];
  };

  return {
    handlers,
    getHandler,
    executeHandler,
    hasCustomHandler
  };
};

export default ActionHandlersProvider;

