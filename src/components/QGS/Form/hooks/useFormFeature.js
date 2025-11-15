import { useState, useEffect } from 'react';
import { fetchFeatureById } from '../../../../services/qgisWFSFetcher';

/**
 * Hook para gestionar la carga y estado de la feature del formulario
 * 
 * @param {Object} params - Parámetros del hook
 * @param {Object} params.config - Configuración del proyecto QGIS
 * @param {string} params.layerName - Nombre de la capa
 * @param {string|number} params.featureId - ID de la feature (opcional, null para nueva feature)
 * @param {string} params.qgsUrl - URL del servicio QGIS
 * @param {string} params.qgsProjectPath - Ruta del proyecto QGIS
 * @param {string} params.token - Token de autenticación
 * @param {Function} params.t - Función de traducción
 * @param {Object} params.notificationManager - Manager de notificaciones
 * @returns {Object} Estado de la feature y la capa
 */
export const useFormFeature = ({
  config,
  layerName,
  featureId,
  qgsUrl,
  qgsProjectPath,
  token,
  t,
  notificationManager
}) => {
  const [layer, setLayer] = useState(null);
  const [feature, setFeature] = useState(null);
  const [isNewFeature, setIsNewFeature] = useState(false);

  /**
   * Efecto para cargar la capa y la feature cuando cambian los parámetros
   */
  useEffect(() => {
    // Verificar que config existe antes de usarlo
    if (!config || !config.layers) {
      console.warn('FormProvider: config o config.layers no está disponible');
      setLayer(null);
      return;
    }

    // Buscar la capa que coincide con layerName en config.layers
    const foundLayer = Object.entries(config.layers).find(
      ([key]) => key === layerName
    )?.[1];
    
    setLayer(foundLayer);

    if (foundLayer) {
      if (featureId) {
        // Solo cargar la feature si no está ya cargada o si cambió el featureId
        // Esto evita resetear los valores cuando el usuario está editando
        const currentFeatureId = feature?.id ? feature.id.split('.')[1] : null;
        const newFeatureId = featureId.toString();
        
        if (currentFeatureId !== newFeatureId) {
          // Recuperar la feature desde el servicio o usando fetchFeatureById directamente
          const fetchFeature = async () => {
            try {
              let loadedFeature;
              
              // Si la capa tiene un servicio con getFeature, usarlo
              if (foundLayer.service && typeof foundLayer.service.getFeature === 'function') {
                loadedFeature = await foundLayer.service.getFeature(featureId);
              } else if (qgsUrl && qgsProjectPath) {
                // Si no hay servicio, usar fetchFeatureById directamente
                loadedFeature = await fetchFeatureById(
                  qgsUrl, 
                  qgsProjectPath, 
                  layerName, 
                  featureId, 
                  token
                );
              } else {
                throw new Error('No hay servicio disponible ni parámetros QGIS para obtener la feature');
              }
              
              setFeature(loadedFeature);
              setIsNewFeature(false);
              
              // Retornar la feature para que pueda ser usada por el componente
              return loadedFeature;
            } catch (error) {
              console.error('Error obteniendo feature:', error);
              if (notificationManager?.addNotification) {
                notificationManager.addNotification({
                  title: t('ui.qgis.error.retrievingFeature.title') || 'Error',
                  text: t('ui.qgis.error.retrievingFeature.message') || error.message || 'Error al obtener la feature',
                  level: 'error'
                });
              }
              throw error;
            }
          };
          
          fetchFeature();
        }
      } else {
        // Si no hay featureId, es una feature nueva
        if (!feature) {
          setFeature(null);
          setIsNewFeature(true);
        }
      }
    }
  }, [layerName, featureId, qgsUrl, qgsProjectPath, token, config, feature, notificationManager, t]);

  return {
    layer,
    feature,
    isNewFeature,
    setFeature
  };
};

