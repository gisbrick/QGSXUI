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
  const { mapInstance, config, qgsUrl, qgsProjectPath, notificationManager, t, startEditingGeometry } = useMap() || {};
  const qgisConfig = useContext(QgisConfigContext);
  const translate = typeof t === 'function' ? t : (key) => key;
  // Obtener el idioma del contexto QGIS
  const language = qgisConfig?.language || 'es';
  
  // Referencia para el popup y el root de React
  const popupRef = useRef(null);
  const reactRootRef = useRef(null);
  const ignoreNextMapClickRef = useRef(false);

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
      if (ignoreNextMapClickRef.current) {
        ignoreNextMapClickRef.current = false;
        return;
      }

      // Si hay un popup abierto, no hacer nada (permitir PAN del mapa)
      if (popupRef.current) {
        return;
      }
      
      if (!qgsUrl || !qgsProjectPath || !config) {
        return;
      }

      // Obtener las capas WMS visibles del mapa
      // Seguir la lógica del legacy: añadir todas las capas que están en wmsParams.layers y existen en config.layers
      // No filtrar por has_geometry o allowQuery aquí, ya que eso se hace en el servidor
      const visibleLayers = [];
      const versions = [];
      const styles = [];

      console.log('[InfoClick] Iniciando búsqueda de capas WMS');
      console.log('[InfoClick] Config layers disponibles:', Object.keys(config.layers || {}));

      // Recorrer todas las capas del mapa para encontrar las WMS
      map.eachLayer((layer) => {
        if (layer.wmsParams) {
          const layerNames = layer.wmsParams.layers ? layer.wmsParams.layers.split(',') : [];
          
          console.log('[InfoClick] Capa WMS encontrada, layers en wmsParams:', layerNames);
          
          // Añadir todas las capas que existen en el config (como en legacy)
          // Nota: Los nombres pueden tener diferencias de espacios (finales/iniciales) entre wmsParams y config
          layerNames.forEach((layerName) => {
            const trimmedName = layerName.trim();
            
            // Buscar la capa en el config, primero con el nombre exacto, luego normalizando espacios
            let qgisLayer = config.layers?.[trimmedName];
            let configLayerName = trimmedName;
            
            // Si no se encuentra con el nombre exacto, buscar normalizando espacios finales/iniciales
            if (!qgisLayer && config.layers) {
              // Buscar en todas las claves del config, comparando sin espacios finales/iniciales
              for (const key in config.layers) {
                if (key.trim() === trimmedName) {
                  qgisLayer = config.layers[key];
                  configLayerName = key; // Usar el nombre original del config
                  break;
                }
              }
            }
            
            const existsInConfig = !!qgisLayer;
            
            console.log(`[InfoClick] Procesando capa: "${trimmedName}"`, {
              existsInConfig,
              configLayerName: existsInConfig ? configLayerName : null,
              has_geometry: qgisLayer?.has_geometry,
              wkbType_name: qgisLayer?.wkbType_name,
              allowQuery: qgisLayer?.WFSCapabilities?.allowQuery,
              alreadyInList: visibleLayers.includes(configLayerName)
            });
            
            // Verificar solo que la capa exista en el config (como en legacy: layersSplit[i] in QGISPRJ.layers)
            // Usar el nombre original del config para mantener consistencia
            if (existsInConfig && !visibleLayers.includes(configLayerName)) {
              visibleLayers.push(configLayerName);
              console.log(`[InfoClick] ✓ Capa añadida: "${configLayerName}"`);
            } else if (!existsInConfig) {
              console.warn(`[InfoClick] ✗ Capa NO existe en config: "${trimmedName}"`);
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

      // Si no hay capas, no hacer nada
      console.log('[InfoClick] Capas finales para consulta GetFeatureInfo:', visibleLayers);
      if (visibleLayers.length === 0) {
        console.warn('[InfoClick] No hay capas para consultar');
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

      // Obtener filtros activos de las capas desde el config
      // Los filtros se actualizan cuando se aplican desde las tablas
      const activeFilters = [];
      visibleLayers.forEach((layerName) => {
        const qgisLayer = config.layers?.[layerName];
        if (qgisLayer?.filter && qgisLayer.filter.trim()) {
          // Remover "1=1 AND " del inicio del filtro si existe (como en getWMSFilters)
          let filter = qgisLayer.filter.replace(/^1=1\s+AND\s+/i, '');
          if (filter && filter.trim()) {
            activeFilters.push(`${layerName}: ${filter}`);
          }
        }
      });
      const filtersString = activeFilters.length > 0 ? activeFilters.join(';') : '';

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
        styles: styles[0] || '',
        filters: filtersString // Añadir filtros activos
      };
      
      console.log('[InfoClick] Parámetros de consulta GetFeatureInfo:', {
        layers: queryParams.layers,
        query_layers: queryParams.query_layers,
        version: queryParams.version,
        filters: queryParams.filters
      });

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
          // Handler para acciones de la toolbar del popup
          const handleToolbarAction = (payload) => {
            if (payload.action === 'editGeometry') {
              const { feature, layer } = payload;
              if (feature && layer && startEditingGeometry) {
                ignoreNextMapClickRef.current = true;
                // Cerrar el popup
                if (map && map.closePopup) {
                  map.closePopup();
                }
                // Iniciar la edición de la geometría
                startEditingGeometry(feature, layer);
                // Desactivar la herramienta de información para evitar nuevos clicks mientras se edita
                if (typeof onActiveChange === 'function') {
                  onActiveChange(false);
                }
              }
            }
          };

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
            token: qgisConfig?.token || null,
            notificationManager: notificationManager || qgisConfig?.notificationManager || null,
            language: language, // Pasar el idioma del contexto QGIS
            onToolbarAction: handleToolbarAction
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

