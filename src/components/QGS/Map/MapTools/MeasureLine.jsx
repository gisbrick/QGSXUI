import React, { useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useMap } from '../MapProvider';

/**
 * Herramienta de medición de línea/distancia
 * Permite medir distancias en el mapa
 */
const MeasureLine = ({ active, onActiveChange }) => {
  const { mapInstance, t } = useMap() || {};
  const measureHandlerRef = useRef(null);
  const translate = typeof t === 'function' ? t : (key) => key;

  useEffect(() => {
    if (!mapInstance || !active) {
      // Si no hay herramienta de medición activa, limpiar
      if (measureHandlerRef.current) {
        try {
          measureHandlerRef.current.disable();
          measureHandlerRef.current._disableMeasure();
        } catch (e) {
          // Ignorar errores si ya está deshabilitado
        }
        measureHandlerRef.current = null;
      }
      return;
    }

    const map = mapInstance;
    const container = map.getContainer();
    if (!container) return;

    // Cambiar cursor
    container.style.cursor = 'crosshair';

    // Deshabilitar dragging cuando el modo medición está activo
    if (map.dragging && map.dragging.enabled()) {
      map.dragging.disable();
    }

    // Cargar plugin de medición si no está disponible
    const loadMeasurePlugin = () => {
      return new Promise((resolve) => {
        if (window.L?.MeasureAction) {
          resolve(true);
          return;
        }

        let measureScript = document.querySelector('script[data-measure-plugin]');
        
        if (!measureScript) {
          measureScript = document.createElement('script');
          measureScript.setAttribute('data-measure-plugin', 'true');
          measureScript.async = false;
          measureScript.src = '/leaflet/leaflet.measure.js';
          
          measureScript.onload = () => {
            // Cargar CSS
            let measureCSS = document.querySelector('link[data-measure-css]');
            if (!measureCSS) {
              measureCSS = document.createElement('link');
              measureCSS.setAttribute('data-measure-css', 'true');
              measureCSS.rel = 'stylesheet';
              measureCSS.href = '/leaflet/leaflet.measure.css';
              document.head.appendChild(measureCSS);
            }
            resolve(true);
          };
          
          measureScript.onerror = () => {
            console.warn('No se pudo cargar el plugin de medición.');
            resolve(false);
          };
          
          document.head.appendChild(measureScript);
        } else {
          resolve(window.L?.MeasureAction ? true : false);
        }
      });
    };

    // Configurar traducciones para el plugin de medición
    if (window.L) {
      // Asegurar que L.Measure existe
      if (!window.L.Measure) {
        window.L.Measure = {};
      }
      window.L.Measure = {
        linearMeasurement: translate('ui.map.measureLine') || 'Medir distancia',
        areaMeasurement: translate('ui.map.measureArea') || 'Medir área',
        start: translate('ui.map.measureStart') || 'Inicio',
        meter: translate('ui.map.measureMeter') || 'm',
        meterDecimals: 0,
        kilometer: translate('ui.map.measureKilometer') || 'km',
        kilometerDecimals: 2,
        squareMeter: translate('ui.map.measureSquareMeter') || 'm²',
        squareMeterDecimals: 0,
        squareKilometers: translate('ui.map.measureSquareKilometer') || 'km²',
        squareKilometersDecimals: 2
      };
    }

    // Cargar plugin y crear handler de medición
    loadMeasurePlugin().then((loaded) => {
      if (loaded && window.L && window.L.MeasureAction) {
        // Limpiar handler anterior si existe
        if (measureHandlerRef.current) {
          try {
            measureHandlerRef.current.disable();
            measureHandlerRef.current._disableMeasure();
          } catch (e) {
            // Ignorar errores
          }
        }
        measureHandlerRef.current = new window.L.MeasureAction(map, {
          model: 'distance',
          color: '#3388ff'
        });
        
        // Interceptar el método _finishMeasure para desactivar la herramienta cuando se complete la medición
        const originalFinishMeasure = measureHandlerRef.current._finishMeasure;
        measureHandlerRef.current._finishMeasure = function(event) {
          // Llamar al método original
          originalFinishMeasure.call(this, event);
          // Desactivar la herramienta de medición
          if (onActiveChange) {
            onActiveChange(false);
          }
        };
        
        measureHandlerRef.current.enable();
      }
    });

    // Cleanup
    return () => {
      // Restaurar cursor
      container.style.cursor = '';
      
      // Rehabilitar dragging
      if (map.dragging && !map.dragging.enabled()) {
        map.dragging.enable();
      }
      
      // Deshabilitar medición
      if (measureHandlerRef.current) {
        try {
          measureHandlerRef.current.disable();
          measureHandlerRef.current._disableMeasure();
        } catch (e) {
          // Ignorar errores
        }
        measureHandlerRef.current = null;
      }
    };
  }, [mapInstance, active, translate, onActiveChange]);

  return null;
};

MeasureLine.propTypes = {
  active: PropTypes.bool,
  onActiveChange: PropTypes.func
};

export default MeasureLine;

