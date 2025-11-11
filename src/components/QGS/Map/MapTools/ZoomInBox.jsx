import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useMap } from '../MapProvider';

/**
 * Herramienta de zoom a caja
 * Permite dibujar un rectángulo en el mapa para hacer zoom a esa área
 */
const ZoomInBox = ({ active, onActiveChange }) => {
  const { mapInstance } = useMap() || {};
  const isDrawingRef = useRef(false);
  const startPointRef = useRef(null);
  const boxRectangleRef = useRef(null);

  useEffect(() => {
    if (!mapInstance || !active) {
      return;
    }

    const map = mapInstance;
    const container = map.getContainer();
    if (!container) return;

    // Cambiar cursor
    container.style.cursor = 'crosshair';

    // Deshabilitar dragging cuando el modo box zoom está activo
    if (map.dragging && map.dragging.enabled()) {
      map.dragging.disable();
    }

    const handleMouseDown = (e) => {
      // Solo procesar clic izquierdo
      if (e.button !== 0) return;
      
      // Prevenir el comportamiento por defecto del mapa (dragging)
      e.preventDefault();
      e.stopPropagation();

      // Convertir coordenadas del contenedor a lat/lng
      const containerPoint = window.L.point(e.clientX - container.getBoundingClientRect().left, e.clientY - container.getBoundingClientRect().top);
      const latlng = map.containerPointToLatLng(containerPoint);
      
      if (!latlng) return;
      
      isDrawingRef.current = true;
      startPointRef.current = latlng;

      // Crear rectángulo temporal
      if (window.L && window.L.rectangle) {
        const bounds = window.L.latLngBounds([latlng, latlng]);
        boxRectangleRef.current = window.L.rectangle(bounds, {
          color: '#3388ff',
          weight: 2,
          fillColor: '#3388ff',
          fillOpacity: 0.2,
          dashArray: '5, 5'
        }).addTo(map);
      }
    };

    const handleMouseMove = (e) => {
      if (!isDrawingRef.current || !startPointRef.current) return;

      // Convertir coordenadas del contenedor a lat/lng
      const containerPoint = window.L.point(e.clientX - container.getBoundingClientRect().left, e.clientY - container.getBoundingClientRect().top);
      const latlng = map.containerPointToLatLng(containerPoint);
      
      if (!latlng) return;
      
      // Actualizar el rectángulo
      if (boxRectangleRef.current) {
        const bounds = window.L.latLngBounds([startPointRef.current, latlng]);
        boxRectangleRef.current.setBounds(bounds);
      }
    };

    const handleMouseUp = (e) => {
      if (!isDrawingRef.current || !startPointRef.current) return;

      // Convertir coordenadas del contenedor a lat/lng
      const containerPoint = window.L.point(e.clientX - container.getBoundingClientRect().left, e.clientY - container.getBoundingClientRect().top);
      const latlng = map.containerPointToLatLng(containerPoint);
      
      if (!latlng) {
        // Si no hay latlng, limpiar y salir
        if (boxRectangleRef.current) {
          map.removeLayer(boxRectangleRef.current);
          boxRectangleRef.current = null;
        }
        isDrawingRef.current = false;
        startPointRef.current = null;
        return;
      }
      
      // Calcular bounds y hacer zoom
      const bounds = window.L.latLngBounds([startPointRef.current, latlng]);
      
      // Solo hacer zoom si el área es suficientemente grande
      if (bounds.isValid() && bounds.getNorth() !== bounds.getSouth() && bounds.getEast() !== bounds.getWest()) {
        map.fitBounds(bounds, { padding: [20, 20] });
      }

      // Limpiar
      if (boxRectangleRef.current) {
        map.removeLayer(boxRectangleRef.current);
        boxRectangleRef.current = null;
      }
      
      isDrawingRef.current = false;
      startPointRef.current = null;
    };

    // Usar eventos del DOM directamente en el contenedor
    container.addEventListener('mousedown', handleMouseDown, true);
    container.addEventListener('mousemove', handleMouseMove, true);
    container.addEventListener('mouseup', handleMouseUp, true);
    
    // También prevenir el box zoom nativo de Leaflet (SHIFT + arrastrar) cuando nuestro modo está activo
    if (map.boxZoom && map.boxZoom.enabled()) {
      map.boxZoom.disable();
    }

    // Cleanup
    return () => {
      container.removeEventListener('mousedown', handleMouseDown, true);
      container.removeEventListener('mousemove', handleMouseMove, true);
      container.removeEventListener('mouseup', handleMouseUp, true);
      
      // Restaurar cursor
      container.style.cursor = '';
      
      // Rehabilitar dragging
      if (map.dragging && !map.dragging.enabled()) {
        map.dragging.enable();
      }
      
      // Rehabilitar box zoom nativo si estaba deshabilitado
      if (map.boxZoom && !map.boxZoom.enabled()) {
        map.boxZoom.enable();
      }
      
      // Limpiar rectángulo si existe
      if (boxRectangleRef.current) {
        map.removeLayer(boxRectangleRef.current);
        boxRectangleRef.current = null;
      }
      
      isDrawingRef.current = false;
      startPointRef.current = null;
    };
  }, [mapInstance, active]);

  return null;
};

ZoomInBox.propTypes = {
  active: PropTypes.bool,
  onActiveChange: PropTypes.func
};

export default ZoomInBox;

