import React from 'react';
import PropTypes from 'prop-types';
import { MapProvider } from './MapProvider';
import MapContainer from './MapContainer';
import MapControls from './MapControls';
import './Map.css';

/**
 * Componente principal del mapa que integra MapProvider, MapContainer y MapControls
 * Este es el componente que se debe usar en la aplicación para mostrar un mapa completo
 * con controles y funcionalidad basada en Leaflet
 */
const Map = ({ 
  width = '100%', 
  height = '400px',
  showControls = true,
  controlsPosition = 'right',
  className = '',
  onMapReady = null,
  onMapClick = null,
  onMapMove = null,
  onFeatureSelect = null,
  ...mapProps 
}) => {
  const handleMapReady = (mapInstance) => {
    console.log('Mapa inicializado:', mapInstance);
    
    // Configurar eventos del mapa si se proporcionan
    if (mapInstance) {
      if (onMapClick) {
        mapInstance.on('click', onMapClick);
      }
      if (onMapMove) {
        mapInstance.on('moveend', onMapMove);
      }
      // El evento de selección de features se maneja a través del MapProvider
    }
    
    if (onMapReady) {
      onMapReady(mapInstance);
    }
  };

  return (
    <MapProvider>
      <div className={`map-example ${className}`}>
        <div className="map-layout">
          <div className="map-content">
            <MapContainer
              width={width}
              height={height}
              onMapReady={handleMapReady}
              {...mapProps}
            />
            {showControls && (
              <div className={`map-sidebar map-sidebar-${controlsPosition}`}>
                <MapControls />
              </div>
            )}
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
  /** Posición de los controles: 'left' o 'right' */
  controlsPosition: PropTypes.oneOf(['left', 'right']),
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
  /** Opciones adicionales para Leaflet */
  mapOptions: PropTypes.object
};

// Exportar también los componentes individuales para uso avanzado
export { MapProvider, MapContainer, MapControls };
export default Map;