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
  feature: featureProp = null, // Feature opcional para nuevas features con geometría
  qgsUrl,
  qgsProjectPath,
  token,
  t,
  notificationManager
}) => {
  const [layer, setLayer] = useState(null);
  // Si hay featureProp, usarla como estado inicial (para nuevas features con geometría)
  const [feature, setFeature] = useState(featureProp);
  // isNewFeature se calcula dinámicamente basándose en featureId y feature.id
  // Si la feature tiene un ID, no es nueva (modo update)
  const [isNewFeature, setIsNewFeature] = useState(() => {
    // Estado inicial: si no hay featureId o la feature no tiene ID, es nueva
    return !featureId || (featureProp && !featureProp.id);
  });

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
      // Detectar si es un ID temporal (para nuevas features)
      const isTemporaryId = featureId && (
        featureId.toString().toLowerCase() === 'temp' ||
        featureId.toString().endsWith('.temp') ||
        featureId.toString().includes('.temp.')
      );

      if (featureId && !isTemporaryId) {
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
        // Si no hay featureId o es temporal, verificar si la feature tiene un ID
        // Si la feature tiene un ID (después de un insert exitoso), no es nueva
        console.log('[useFormFeature] useEffect - Sin featureId válido, verificando feature', {
          hasFeature: !!feature,
          featureId: feature?.id,
          isTemporaryId,
          propFeatureId: featureId
        });
        
        if (feature && feature.id) {
          // Verificar si el ID es temporal
          const featureIdIsTemporary = feature.id.toString().toLowerCase().includes('temp') ||
                                      feature.id.toString().endsWith('.temp') ||
                                      feature.id.toString().includes('.temp.');
          
          if (featureIdIsTemporary) {
            // El ID es temporal, es una feature nueva (modo insert)
            console.log('[useFormFeature] useEffect - Feature tiene ID temporal, modo INSERT', {
              featureId: feature.id
            });
            setIsNewFeature(true);
          } else {
            // La feature tiene un ID real, no es nueva (modo update)
            console.log('[useFormFeature] useEffect - Feature tiene ID real, modo UPDATE', {
              featureId: feature.id
            });
            setIsNewFeature(false);
          }
        } else if (!feature || isTemporaryId) {
          // No hay feature o es temporal sin ID, es una feature nueva
          // PERO: si hay featureProp con geometría, preservarla
          console.log('[useFormFeature] useEffect - Sin feature o temporal, modo INSERT', {
            hasFeatureProp: !!featureProp,
            hasGeometry: !!(featureProp?.geometry)
          });
          if (featureProp && featureProp.geometry) {
            // Preservar la feature con geometría para nuevas features
            setFeature(featureProp);
          } else {
            setFeature(null);
          }
          setIsNewFeature(true);
        }
      }
    }
  }, [layerName, featureId, qgsUrl, qgsProjectPath, token, config, feature, notificationManager, t, featureProp]);

  // Efecto adicional: actualizar feature cuando cambia featureProp (para nuevas features con geometría)
  useEffect(() => {
    // Si hay featureProp y es una nueva feature (sin ID o con ID temporal), actualizar la feature
    if (featureProp) {
      const isTemporaryId = featureId && (
        featureId.toString().toLowerCase() === 'temp' ||
        featureId.toString().endsWith('.temp') ||
        featureId.toString().includes('.temp.')
      );
      
      // Si no hay feature actual, o si featureProp tiene geometría y la feature actual no, actualizar
      const shouldUpdate = !feature || 
                          (featureProp.geometry && !feature.geometry) ||
                          (isTemporaryId && featureProp.geometry);
      
      if (shouldUpdate) {
        console.log('[useFormFeature] useEffect - Actualizando feature desde featureProp', {
          hasGeometry: !!(featureProp?.geometry),
          hasId: !!(featureProp?.id),
          currentFeatureId: feature?.id,
          isTemporaryId
        });
        setFeature(featureProp);
        // Si no tiene ID o el ID es temporal, es nueva
        if (!featureProp.id) {
          setIsNewFeature(true);
        } else {
          // Verificar si el ID es temporal
          const featureIdIsTemporary = featureProp.id.toString().toLowerCase().includes('temp') ||
                                      featureProp.id.toString().endsWith('.temp') ||
                                      featureProp.id.toString().includes('.temp.');
          setIsNewFeature(featureIdIsTemporary);
        }
      }
    }
  }, [featureProp, featureId]);

  // Efecto adicional: si la feature tiene un ID, no es nueva (modo update)
  // Esto es importante después de un insert exitoso, cuando la feature pasa de no tener ID a tenerlo
  useEffect(() => {
    const hasFeature = !!feature;
    const hasFeatureId = !!(feature?.id);
    const hasPropFeatureId = !!featureId;
    
    console.log('[useFormFeature] useEffect - feature/id change', {
      hasFeature,
      featureId: feature?.id,
      propFeatureId: featureId,
      currentIsNewFeature: isNewFeature,
      shouldBeNew: !hasFeatureId && !hasPropFeatureId
    });
    
    if (hasFeatureId) {
      // Verificar si el ID es temporal
      const featureIdIsTemporary = feature.id.toString().toLowerCase().includes('temp') ||
                                  feature.id.toString().endsWith('.temp') ||
                                  feature.id.toString().includes('.temp.');
      
      if (featureIdIsTemporary) {
        // El ID es temporal, es una feature nueva (modo insert)
        if (!isNewFeature) {
          console.log('[useFormFeature] useEffect - Feature tiene ID temporal, cambiando a modo INSERT', {
            featureId: feature.id
          });
          setIsNewFeature(true);
        }
      } else {
        // La feature tiene un ID real, no es nueva (modo update)
        if (isNewFeature) {
          console.log('[useFormFeature] useEffect - Feature tiene ID real, cambiando a modo UPDATE', {
            featureId: feature.id
          });
          setIsNewFeature(false);
        }
      }
    } else if (!hasPropFeatureId && !hasFeature) {
      // Si no hay featureId ni feature, es nueva (modo insert)
      if (!isNewFeature) {
        console.log('[useFormFeature] useEffect - No hay featureId ni feature, modo INSERT');
        setIsNewFeature(true);
      }
    }
  }, [feature, featureId]);

  return {
    layer,
    feature,
    isNewFeature,
    setFeature
  };
};

