import React, { useEffect } from 'react';
import PropTypes from 'prop-types';
import { useMap } from '../MapProvider';

/**
 * Herramienta de zoom out
 * Permite hacer clic en el mapa para hacer zoom out centrando en el punto del clic
 */
const ZoomOut = ({ active, onActiveChange }) => {
  const { mapInstance } = useMap() || {};

  useEffect(() => {
    if (!mapInstance || !active) {
      return;
    }

    const map = mapInstance;
    const container = map.getContainer();
    if (!container) return;

    // Cambiar cursor
    container.style.cursor = 'crosshair';

    // Deshabilitar dragging cuando el modo zoom out está activo
    if (map.dragging && map.dragging.enabled()) {
      map.dragging.disable();
    }

    const handleClick = (e) => {
      // Prevenir el comportamiento por defecto
      if (e.originalEvent) {
        e.originalEvent.preventDefault();
        e.originalEvent.stopPropagation();
      }

      const latlng = e.latlng;
      if (!latlng) return;

      // Hacer zoom out centrando en el punto del click
      if (map.setView && map.getZoom) {
        const currentZoom = map.getZoom();
        const newZoom = Math.max(map.getMinZoom() || 0, currentZoom - 1);
        // Centrar en el punto del click y hacer zoom out
        map.setView(latlng, newZoom, {
          animate: true,
          duration: 0.25
        });
      }
    };

    // Usar eventos de Leaflet
    map.on('click', handleClick);

    // Cleanup
    return () => {
      map.off('click', handleClick);
      
      // Restaurar cursor
      container.style.cursor = '';
      
      // Rehabilitar dragging
      if (map.dragging && !map.dragging.enabled()) {
        map.dragging.enable();
      }
    };
  }, [mapInstance, active]);

  return null;
};

ZoomOut.propTypes = {
  active: PropTypes.bool,
  onActiveChange: PropTypes.func
};

export default ZoomOut;

