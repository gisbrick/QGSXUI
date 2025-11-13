import React, { useEffect, useContext, useRef } from 'react';
import PropTypes from 'prop-types';
import { useMap } from '../MapProvider';
import { QgisConfigContext } from '../../QgisConfigContext';
import { fetchFeatureInfo } from '../../../../services/qgisWMSFetcher';
import { renderFeatureInfoPopup } from './FeatureInfoPopup';

/**
 * Herramienta para obtener información de features al hacer click en el mapa
 * Realiza peticiones WMS GetFeatureInfo a las capas consultables
 */
const InfoClick = ({ active, onActiveChange }) => {
  const { mapInstance, config, qgsUrl, qgsProjectPath, notificationManager, t } = useMap() || {};
  const qgisConfig = useContext(QgisConfigContext);
  const translate = typeof t === 'function' ? t : (key) => key;
  
  // Referencia para el popup y el root de React
  const popupRef = useRef(null);
  const reactRootRef = useRef(null);

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
      // Si hay un popup abierto, no hacer nada (permitir PAN del mapa)
      if (popupRef.current) {
        return;
      }
      
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
        
        console.log('InfoClick: GetFeatureInfo response', data);
        console.log('InfoClick: Features count', data.features?.length);
        console.log('InfoClick: Config available', !!config);
        console.log('InfoClick: Config layers', config?.layers ? Object.keys(config.layers) : 'no layers');
        
        if (data.features && data.features.length > 0) {
          console.log('InfoClick: Features to display', data.features);
          
          // Cerrar popup anterior si existe
          if (popupRef.current) {
            map.closePopup(popupRef.current);
            popupRef.current = null;
          }
          if (reactRootRef.current) {
            reactRootRef.current.unmount();
            reactRootRef.current = null;
          }

          // Crear contenedor para el popup con ancho mínimo
          const container = document.createElement('div');
          container.style.minWidth = '300px';
          container.style.width = 'auto';
          container.className = 'feature-info-popup-container';
          
          // Crear popup de Leaflet
          const popup = window.L.popup({
            minWidth: 300,
            maxWidth: 500,
            maxHeight: 400,
            className: 'feature-info-leaflet-popup'
          })
            .setLatLng(loc)
            .setContent(container)
            .openOn(map);

          popupRef.current = popup;

          // Listener para cuando se cierra el popup
          const handlePopupClose = () => {
            popupRef.current = null;
            if (reactRootRef.current) {
              reactRootRef.current.unmount();
              reactRootRef.current = null;
            }
            // Remover el listener después de cerrar
            map.off('popupclose', handlePopupClose);
          };
          
          map.on('popupclose', handlePopupClose);

          // Renderizar componente React en el contenedor
          // Pasar el config directamente para asegurar que esté disponible
          const root = renderFeatureInfoPopup(container, data.features, map, () => {
            if (popupRef.current) {
              map.closePopup(popupRef.current);
              popupRef.current = null;
            }
            if (reactRootRef.current) {
              reactRootRef.current.unmount();
              reactRootRef.current = null;
            }
          }, config, { 
            t: translate,
            qgsUrl: qgsUrl,
            qgsProjectPath: qgsProjectPath,
            token: qgisConfig?.token || null
          });
          
          reactRootRef.current = root;
          
          // Forzar actualización del layout del popup después de renderizar
          setTimeout(() => {
            if (popup && popup._updateLayout) {
              popup._updateLayout();
            }
          }, 0);
        } else {
          // No se encontraron features en el punto clickeado
          if (notificationManager && notificationManager.addInfo) {
            notificationManager.addInfo(
              translate('ui.map.infoClick'),
              translate('ui.map.noFeaturesFound')
            );
          }
        }
      } catch (error) {
        console.error('Error al obtener información de features:', error);
        if (notificationManager && notificationManager.addError) {
          notificationManager.addError(
            translate('ui.map.infoClickError'),
            error.message || translate('ui.map.infoClickError')
          );
        }
      }
    };

    // Añadir listener de click al mapa
    map.on('click', handleMapClick);

    // NO desactivar el arrastre del mapa - permitir PAN incluso con la herramienta activa
    // El popup abierto evitará que se hagan nuevas requests

    // Cleanup
    return () => {
      map.off('click', handleMapClick);
      map.dragging.enable();
      
      // Cerrar popup y limpiar React root
      if (popupRef.current) {
        map.closePopup(popupRef.current);
        popupRef.current = null;
      }
      if (reactRootRef.current) {
        reactRootRef.current.unmount();
        reactRootRef.current = null;
      }
      
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

