import React from 'react';
import { useMap } from './MapProvider';

/**
 * Componente de controles del mapa
 * Proporciona controles para interactuar con el mapa
 */
const MapControls = () => {
  const mapContext = useMap() || {};
  const { mapInstance, initialBoundsRef, t } = mapContext;
  const translate = typeof t === 'function' ? t : (key) => key;

  const handleZoomIn = () => {
    if (mapInstance && mapInstance.zoomIn) {
      mapInstance.zoomIn();
    }
  };

  const handleZoomOut = () => {
    if (mapInstance && mapInstance.zoomOut) {
      mapInstance.zoomOut();
    }
  };

  const handleFitBounds = () => {
    if (!mapInstance || !mapInstance.fitBounds) {
      return;
    }

    const bounds = initialBoundsRef?.current || mapInstance.getBounds();
    if (bounds && bounds.isValid()) {
      mapInstance.fitBounds(bounds, { padding: [20, 20] });
    }
  };

  return (
    <div className="map-controls leaflet-bar">
      <div className="map-controls-group">
        <button
          type="button"
          className="map-control-button"
          onClick={handleZoomIn}
          title={translate('ui.map.zoomIn')}
          aria-label={translate('ui.map.zoomIn')}
        >
          <i className="fg-zoom-in" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="map-control-button"
          onClick={handleZoomOut}
          title={translate('ui.map.zoomOut')}
          aria-label={translate('ui.map.zoomOut')}
        >
          <i className="fg-zoom-out" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="map-control-button"
          onClick={handleFitBounds}
          title={translate('ui.map.resetView')}
          aria-label={translate('ui.map.resetView')}
        >
          <i className="fg-extent" aria-hidden="true" />
        </button>
      </div>
    </div>
  );
};

export default MapControls;

