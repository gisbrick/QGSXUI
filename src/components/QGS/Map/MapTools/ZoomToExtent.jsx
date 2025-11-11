import React from 'react';
import { useMap } from '../MapProvider';

/**
 * Herramienta de zoom a extensión
 * Restablece la vista del mapa a la extensión inicial
 */
const ZoomToExtent = () => {
  const { mapInstance, initialBoundsRef } = useMap() || {};

  const handleZoomToExtent = () => {
    if (!mapInstance || !mapInstance.fitBounds) {
      return;
    }

    const bounds = initialBoundsRef?.current || mapInstance.getBounds();
    if (bounds && bounds.isValid()) {
      mapInstance.fitBounds(bounds, { padding: [20, 20] });
    }
  };

  return null;
};

ZoomToExtent.handleZoomToExtent = (mapInstance, initialBoundsRef) => {
  if (!mapInstance || !mapInstance.fitBounds) {
    return;
  }

  const bounds = initialBoundsRef?.current || mapInstance.getBounds();
  if (bounds && bounds.isValid()) {
    mapInstance.fitBounds(bounds, { padding: [20, 20] });
  }
};

export default ZoomToExtent;

