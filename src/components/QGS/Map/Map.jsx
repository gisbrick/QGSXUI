import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { MapProvider, useMap } from './MapProvider';
import MapContainer from './MapContainer';
import MapControls from './MapControls';
import MapToolbar from './MapToolbar';
import MapSearchContainer from './MapSearchContainer';
import './Map.css';

/**
 * Componente interno que maneja los eventos del mapa
 */
const MapEventHandlers = ({ onMapClick, onMapMove, onFeatureSelect }) => {
  const { mapInstance } = useMap() || {};
  const handlersRef = useRef({ onMapClick, onMapMove, onFeatureSelect });

  // Actualizar referencias cuando cambien los callbacks
  useEffect(() => {
    handlersRef.current = { onMapClick, onMapMove, onFeatureSelect };
  }, [onMapClick, onMapMove, onFeatureSelect]);

  // Registrar eventos del mapa
  useEffect(() => {
    if (!mapInstance) {
      return;
    }

    // Handler para click en el mapa
    const handleMapClick = (e) => {
      if (handlersRef.current.onMapClick) {
        handlersRef.current.onMapClick(e);
      }
    };

    // Handler para movimiento del mapa
    const handleMapMove = (e) => {
      if (handlersRef.current.onMapMove) {
        handlersRef.current.onMapMove(e);
      }
    };

    // Handler para selección de features (GetFeatureInfo)
    const handleFeatureSelect = (e) => {
      if (handlersRef.current.onFeatureSelect) {
        // Intentar obtener información de la feature desde el evento
        // Esto puede requerir una llamada GetFeatureInfo a QGIS Server
        const featureInfo = e.layer?.feature || e.target?.feature || null;
        handlersRef.current.onFeatureSelect({
          latlng: e.latlng,
          layerPoint: e.layerPoint,
          containerPoint: e.containerPoint,
          feature: featureInfo,
          originalEvent: e
        });
      }
    };

    // Registrar eventos
    mapInstance.on('click', handleMapClick);
    mapInstance.on('moveend', handleMapMove);
    
    // Para feature selection, necesitamos escuchar clicks en las capas WMS
    // Esto se puede hacer interceptando los eventos de las capas
    // Por ahora, registramos un evento personalizado que se puede disparar desde las capas
    mapInstance.on('featureclick', handleFeatureSelect);

    // Cleanup: remover listeners
    return () => {
      mapInstance.off('click', handleMapClick);
      mapInstance.off('moveend', handleMapMove);
      mapInstance.off('featureclick', handleFeatureSelect);
    };
  }, [mapInstance]);

  return null;
};

MapEventHandlers.propTypes = {
  onMapClick: PropTypes.func,
  onMapMove: PropTypes.func,
  onFeatureSelect: PropTypes.func
};

/**
 * Componente principal del mapa que integra MapProvider, MapContainer y MapControls
 * Este es el componente que se debe usar en la aplicación para mostrar un mapa completo
 * con controles y funcionalidad basada en Leaflet
 */
const Map = ({ 
  width = '100%', 
  height = '400px',
  showControls = true,
  className = '',
  onMapReady = null,
  onMapClick = null,
  onMapMove = null,
  onFeatureSelect = null,
  customSearchers = [],
  toolsConfig = null,
  ...mapProps 
}) => {
  const handleMapReady = (mapInstance) => {
    if (onMapReady) {
      onMapReady(mapInstance);
    }
  };

  // Normalizar width y height para aplicar al contenedor principal
  const containerStyle = React.useMemo(() => {
    const normalizedWidth = typeof width === 'number' ? `${width}px` : (width || '100%');
    const normalizedHeight = typeof height === 'number' ? `${height}px` : (height || '400px');
    
    return {
      width: normalizedWidth,
      height: normalizedHeight
    };
  }, [width, height]);

  return (
    <MapProvider>
      <div className={`map-example ${className}`} style={containerStyle}>
        <div className="map-layout">
          <div className="map-content">
            <MapContainer
              width={width}
              height={height}
              onMapReady={handleMapReady}
              {...mapProps}
            />
            <MapEventHandlers 
              onMapClick={onMapClick}
              onMapMove={onMapMove}
              onFeatureSelect={onFeatureSelect}
            />
            {showControls && (
              <div className="map-sidebar map-sidebar-left">
                <MapControls />
              </div>
            )}
            <MapSearchContainer 
              customSearchers={customSearchers} 
              toolsConfig={toolsConfig}
            />
            <div className={`map-toolbar-container${showControls ? '' : ' no-controls'}`}>
              <MapToolbar toolsConfig={toolsConfig} />
            </div>
          </div>
        </div>
      </div>
    </MapProvider>
  );
};

Map.propTypes = {
  /** Ancho del contenedor del mapa (string o número) */
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Alto del contenedor del mapa (string o número) */
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Mostrar controles del mapa */
  showControls: PropTypes.bool,
  /** Clase CSS adicional */
  className: PropTypes.string,
  /** Callback cuando el mapa está listo */
  onMapReady: PropTypes.func,
  /** Callback cuando se hace clic en el mapa */
  onMapClick: PropTypes.func,
  /** Callback cuando se mueve el mapa */
  onMapMove: PropTypes.func,
  /** Callback cuando se selecciona una feature */
  onFeatureSelect: PropTypes.func,
  /** Array de buscadores personalizados. Cada buscador debe tener:
   * - id: string (opcional)
   * - component: ReactNode (componente React a renderizar)
   * - render: function (función que retorna un componente React, alternativa a component)
   */
  customSearchers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      component: PropTypes.node,
      render: PropTypes.func
    })
  ),
  /** Configuración de herramientas y buscadores visibles. Formato:
   * {
   *   toolbar: {
   *     'zoom-in-box': true/false,
   *     'zoom-out': true/false,
   *     'zoom-extent': true/false,
   *     'nav-back': true/false,
   *     'nav-forward': true/false,
   *     'bookmarks': true/false,
   *     'show-location': true/false,
   *     'info-click': true/false,
   *     'measure-line': true/false,
   *     'measure-area': true/false,
   *     'draw-point': true/false,
   *     'draw-line': true/false,
   *     'draw-polygon': true/false,
   *     'table-of-contents': true/false,
   *     // ... otras herramientas
   *   },
   *   searchers: {
   *     'address': true/false,
   *     'rural': true/false,
   *     'reference': true/false
   *   }
   * }
   * Si una herramienta o buscador no está en la configuración, se muestra por defecto.
   * Si está en false, se oculta.
   */
  toolsConfig: PropTypes.shape({
    toolbar: PropTypes.objectOf(PropTypes.bool),
    searchers: PropTypes.objectOf(PropTypes.bool)
  }),
  /** Opciones adicionales para Leaflet */
  mapOptions: PropTypes.object
};

// Exportar también los componentes individuales para uso avanzado
export { MapProvider, MapContainer, MapControls };
export default Map;