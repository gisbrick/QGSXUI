import React, { useState, useEffect, useRef } from 'react';
import { useMap } from './MapProvider';
import { ToolbarQGS } from '../../UI_QGS';
import { Button } from '../../UI';

/**
 * Componente de toolbar para el mapa
 * Proporciona herramientas de zoom usando ToolbarQGS
 */
const MapToolbar = () => {
  const mapContext = useMap() || {};
  const { mapInstance, initialBoundsRef, t } = mapContext;
  const translate = typeof t === 'function' ? t : (key) => key;
  const [boxZoomActive, setBoxZoomActive] = useState(false);
  const [zoomOutActive, setZoomOutActive] = useState(false);
  const [measureActive, setMeasureActive] = useState(null); // 'line' o 'area'
  
  // Referencias para el modo box zoom
  const isDrawingRef = useRef(false);
  const startPointRef = useRef(null);
  const boxRectangleRef = useRef(null);
  
  // Referencia para el handler de medición
  const measureHandlerRef = useRef(null);

  // Manejar el modo box zoom cuando está activo
  useEffect(() => {
    if (!mapInstance || !boxZoomActive) {
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
    container.addEventListener('mousedown', handleMouseDown, true); // useCapture = true para capturar antes que otros handlers
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
  }, [mapInstance, boxZoomActive]);

  // Manejar el modo zoom out cuando está activo
  useEffect(() => {
    if (!mapInstance || !zoomOutActive) {
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
  }, [mapInstance, zoomOutActive]);

  // Manejar las herramientas de medición
  useEffect(() => {
    if (!mapInstance || !measureActive) {
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
        const model = measureActive === 'line' ? 'distance' : 'area';
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
          model: model,
          color: '#3388ff'
        });
        
        // Interceptar el método _finishMeasure para desactivar la herramienta cuando se complete la medición
        const originalFinishMeasure = measureHandlerRef.current._finishMeasure;
        measureHandlerRef.current._finishMeasure = function(event) {
          // Llamar al método original
          originalFinishMeasure.call(this, event);
          // Desactivar la herramienta de medición
          setMeasureActive(null);
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
  }, [mapInstance, measureActive, translate]);

  const handleToolChange = (toolKey) => {
    // Ignorar toolKeys de medición ya que se manejan en handleMeasureSelect
    if (toolKey === 'measure-line' || toolKey === 'measure-area') {
      return;
    }
    
    if (toolKey === 'zoom-in-box') {
      // Activar/desactivar modo box zoom
      const newState = !boxZoomActive;
      setBoxZoomActive(newState);
      // Desactivar otras herramientas si está activo
      if (newState) {
        if (zoomOutActive) {
          setZoomOutActive(false);
        }
        if (measureActive) {
          setMeasureActive(null);
        }
      }
    } else if (toolKey === 'zoom-out') {
      // Activar/desactivar modo zoom out
      const newState = !zoomOutActive;
      setZoomOutActive(newState);
      // Desactivar otras herramientas si está activo
      if (newState) {
        if (boxZoomActive) {
          setBoxZoomActive(false);
        }
        if (measureActive) {
          setMeasureActive(null);
        }
      }
    } else {
      // Desactivar todas las herramientas si se selecciona otra
      if (boxZoomActive) {
        setBoxZoomActive(false);
      }
      if (zoomOutActive) {
        setZoomOutActive(false);
      }
      if (measureActive) {
        setMeasureActive(null);
      }
    }
  };

  const handleMeasureSelect = (option, index) => {
    // Desactivar otras herramientas
    if (boxZoomActive) {
      setBoxZoomActive(false);
    }
    if (zoomOutActive) {
      setZoomOutActive(false);
    }
    
    // Activar la herramienta de medición seleccionada
    if (option && option.toolKey === 'measure-line') {
      // Si ya está activa, desactivarla
      setMeasureActive(measureActive === 'line' ? null : 'line');
    } else if (option && option.toolKey === 'measure-area') {
      // Si ya está activa, desactivarla
      setMeasureActive(measureActive === 'area' ? null : 'area');
    }
  };

  const handleZoomToExtent = () => {
    if (!mapInstance || !mapInstance.fitBounds) {
      return;
    }

    const bounds = initialBoundsRef?.current || mapInstance.getBounds();
    if (bounds && bounds.isValid()) {
      mapInstance.fitBounds(bounds, { padding: [20, 20] });
    }
  };

  const toolbarItems = [
    {
      key: 'zoom-in-box',
      type: 'tool',
      circular: true,
      icon: <i className="fg-zoom-in" />,
      title: translate('ui.map.zoomInBox') || 'Zoom a caja'
    },
    {
      key: 'zoom-out',
      type: 'tool',
      circular: true,
      icon: <i className="fg-zoom-out" />,
      title: translate('ui.map.zoomOut')
    },
    {
      key: 'zoom-extent',
      type: 'action',
      circular: true,
      icon: <i className="fg-extent" />,
      title: translate('ui.map.resetView'),
      onClick: handleZoomToExtent
    },
    {
      key: 'measure',
      type: 'selectButton',
      circular: true,
      icon: <i className="fg-measure" />,
      title: translate('ui.map.measurements') || 'Mediciones',
      placeholder: translate('ui.map.measurements') || 'Mediciones',
      options: [
        {
          key: 'measure-line',
          toolKey: 'measure-line',
          element: React.createElement(Button, {
            circular: true,
            size: 'small',
            icon: React.createElement('i', { className: 'fg-measure-line' }),
            title: translate('ui.map.measureLine') || 'Medir distancia',
            selected: measureActive === 'line'
          }, translate('ui.map.measureLine') || 'Medir distancia')
        },
        {
          key: 'measure-area',
          toolKey: 'measure-area',
          element: React.createElement(Button, {
            circular: true,
            size: 'small',
            icon: React.createElement('i', { className: 'fg-measure-area' }),
            title: translate('ui.map.measureArea') || 'Medir área',
            selected: measureActive === 'area'
          }, translate('ui.map.measureArea') || 'Medir área')
        }
      ],
      onSelect: handleMeasureSelect,
      selected: measureActive !== null
    }
  ];

  // Determinar qué herramienta está seleccionada
  const selectedTool = boxZoomActive ? 'zoom-in-box' : (zoomOutActive ? 'zoom-out' : null);

  return (
    <div className="map-toolbar">
      <ToolbarQGS 
        items={toolbarItems}
        size="medium"
        selectedTool={selectedTool}
        onToolChange={handleToolChange}
      />
    </div>
  );
};

export default MapToolbar;

