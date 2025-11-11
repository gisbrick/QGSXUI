import React from 'react';

/**
 * Contexto de React para la configuración QGIS
 * Proporciona acceso a la configuración del proyecto, datos de features,
 * y funciones de traducción a todos los componentes hijos que lo consuman
 */
export const QgisConfigContext = React.createContext({
  token: null, // Token de autenticación para el servicio QGIS
  qgsUrl: null, // URL del servicio QGIS
  qgsProjectPath: null, // Path de proyecto QGIS
  relations: [], // Relaciones dentro del proyecto QGIS
  language: null, // Idioma ('en' o 'es')
  config: null, // Configuración del proyecto QGIS
  loading: false, // Estado de carga
  t: () => '', // Función de traducción
  translations: null, // Traducciones completas
  notificationManager: null // Manager de notificaciones
});

