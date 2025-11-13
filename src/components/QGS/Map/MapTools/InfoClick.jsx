import React, { useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { useMap } from '../MapProvider';
import { QgisConfigContext } from '../../QgisConfigContext';
import { fetchFeatureInfo } from '../../../../services/qgisWMSFetcher';

/**
 * Herramienta para obtener información de features al hacer click en el mapa
 * Realiza peticiones WMS GetFeatureInfo a las capas consultables
 */
const InfoClick = ({ active, onActiveChange }) => {
  const { mapInstance, config, qgsUrl, qgsProjectPath, notificationManager, t } = useMap() || {};
  const qgisConfig = useContext(QgisConfigContext);
  const translate = typeof t === 'function' ? t : (key) => key;

  useEffect(() => {
    if (!mapInstance || !active) {
      return;
    }

    const map = mapInstance;
    const container = map.getContainer();
    if (!container) return;

    // Cambiar cursor a pointer (cursor de información)
    container.style.cursor = 'help';

    // Función para realizar la consulta GetFeatureInfo
    const handleMapClick = async (e) => {
      if (!qgsUrl || !qgsProjectPath || !config) {
        return;
      }

      // Obtener las capas WMS visibles del mapa
      const visibleLayers = [];
      const versions = [];
      const styles = [];

      // Recorrer todas las capas del mapa para encontrar las WMS
      map.eachLayer((layer) => {
        if (layer.wmsParams) {
          const layerNames = layer.wmsParams.layers ? layer.wmsParams.layers.split(',') : [];
          
          // Verificar que las capas existan en el config y tengan allowQuery
          layerNames.forEach((layerName) => {
            const trimmedName = layerName.trim();
            const qgisLayer = config.layers?.[trimmedName];
            
            if (qgisLayer && 
                qgisLayer.has_geometry && 
                qgisLayer.WFSCapabilities?.allowQuery) {
              if (!visibleLayers.includes(trimmedName)) {
                visibleLayers.push(trimmedName);
              }
            }
          });

          if (layer.wmsParams.version && !versions.includes(layer.wmsParams.version)) {
            versions.push(layer.wmsParams.version);
          }
          if (layer.wmsParams.styles && !styles.includes(layer.wmsParams.styles)) {
            styles.push(layer.wmsParams.styles);
          }
        }
      });

      // Si no hay capas consultables, no hacer nada
      if (visibleLayers.length === 0) {
        return;
      }

      // Obtener información del evento de click
      const loc = e.latlng;
      const xy = map.latLngToContainerPoint(loc);
      const size = map.getSize();
      const bounds = map.getBounds();
      const crs = map.options.crs;
      const sw = crs.project(bounds.getSouthWest());
      const ne = crs.project(bounds.getNorthEast());

      // Construir parámetros de la consulta
      const version = versions[0] || '1.3.0';
      const queryParams = {
        service: 'WMS',
        version: version,
        request: 'GetFeatureInfo',
        layers: visibleLayers,
        query_layers: visibleLayers,
        info_format: 'application/json',
        feature_count: 5,
        bbox: `${sw.x},${sw.y},${ne.x},${ne.y}`,
        width: size.x,
        height: size.y,
        styles: styles[0] || ''
      };

      // Añadir parámetros según la versión de WMS
      if (parseFloat(version) >= 1.3) {
        queryParams.crs = crs.code;
        queryParams.i = parseInt(xy.x);
        queryParams.j = parseInt(xy.y);
      } else {
        queryParams.srs = crs.code;
        queryParams.x = parseInt(xy.x);
        queryParams.y = parseInt(xy.y);
      }

      try {
        // Obtener token del contexto si está disponible
        const token = qgisConfig?.token || null;
        
        const data = await fetchFeatureInfo(qgsUrl, qgsProjectPath, queryParams, token);
        
        if (data.features && data.features.length > 0) {
          // Mostrar las features encontradas
          // Por ahora solo mostramos en consola, luego se puede mostrar en un modal
          console.log('Features encontradas:', data.features);
          
          // TODO: Mostrar las features en un modal o panel lateral
          // Por ahora, desactivamos la herramienta después de la consulta
          if (onActiveChange) {
            onActiveChange(false);
          }
        } else {
          // No se encontraron features en el punto clickeado
          if (notificationManager && notificationManager.addInfo) {
            notificationManager.addInfo(
              translate('ui.map.infoClick') || 'Información',
              translate('ui.map.noFeaturesFound') || 'No se encontraron features en este punto'
            );
          }
        }
      } catch (error) {
        console.error('Error al obtener información de features:', error);
        if (notificationManager && notificationManager.addError) {
          notificationManager.addError(
            translate('ui.map.infoClickError') || 'Error',
            error.message || translate('ui.map.infoClickError') || 'Error al obtener información'
          );
        }
      }
    };

    // Añadir listener de click al mapa
    map.on('click', handleMapClick);

    // Desactivar el arrastre del mapa cuando la herramienta está activa
    map.dragging.disable();

    // Cleanup
    return () => {
      map.off('click', handleMapClick);
      map.dragging.enable();
      
      // Restaurar cursor
      if (container) {
        container.style.cursor = '';
      }
    };
  }, [mapInstance, active, config, qgsUrl, qgsProjectPath, notificationManager, translate, onActiveChange, qgisConfig]);

  return null;
};

InfoClick.propTypes = {
  active: PropTypes.bool,
  onActiveChange: PropTypes.func
};

export default InfoClick;

