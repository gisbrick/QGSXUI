import React, { useState } from 'react';
import { useMap } from './MapProvider';
import { ToolbarQGS } from '../../UI_QGS';
import { Button } from '../../UI';
import { ZoomInBox, ZoomOut, ZoomToExtent, MeasureLine, MeasureArea, ShowLocation } from './MapTools';

/**
 * Componente de toolbar para el mapa
 * Proporciona herramientas de zoom y medición usando ToolbarQGS
 */
const MapToolbar = () => {
  const mapContext = useMap() || {};
  const { mapInstance, initialBoundsRef, t } = mapContext;
  const translate = typeof t === 'function' ? t : (key) => key;
  const [boxZoomActive, setBoxZoomActive] = useState(false);
  const [zoomOutActive, setZoomOutActive] = useState(false);
  const [measureLineActive, setMeasureLineActive] = useState(false);
  const [measureAreaActive, setMeasureAreaActive] = useState(false);
  const [showLocationActive, setShowLocationActive] = useState(false);


  // Función para desactivar todas las herramientas excepto la especificada
  const deactivateAllTools = (except = null) => {
    if (except !== 'zoom-in-box') setBoxZoomActive(false);
    if (except !== 'zoom-out') setZoomOutActive(false);
    if (except !== 'measure-line') setMeasureLineActive(false);
    if (except !== 'measure-area') setMeasureAreaActive(false);
    if (except !== 'show-location') setShowLocationActive(false);
  };

  const handleToolChange = (toolKey) => {
    // Ignorar toolKeys de medición ya que se manejan en handleMeasureSelect
    if (toolKey === 'measure-line' || toolKey === 'measure-area') {
      return;
    }
    
    if (toolKey === 'zoom-in-box') {
      // Activar/desactivar modo box zoom
      const newState = !boxZoomActive;
      setBoxZoomActive(newState);
      if (newState) {
        deactivateAllTools('zoom-in-box');
      }
    } else if (toolKey === 'zoom-out') {
      // Activar/desactivar modo zoom out
      const newState = !zoomOutActive;
      setZoomOutActive(newState);
      if (newState) {
        deactivateAllTools('zoom-out');
      }
    } else if (toolKey === 'show-location') {
      // Activar/desactivar mostrar ubicación
      const newState = !showLocationActive;
      setShowLocationActive(newState);
      if (newState) {
        deactivateAllTools('show-location');
      }
    } else {
      // Desactivar todas las herramientas
      deactivateAllTools();
    }
  };

  const handleMeasureSelect = (option) => {
    if (option && option.toolKey === 'measure-line') {
      const newState = !measureLineActive;
      setMeasureLineActive(newState);
      if (newState) {
        deactivateAllTools('measure-line');
      }
    } else if (option && option.toolKey === 'measure-area') {
      const newState = !measureAreaActive;
      setMeasureAreaActive(newState);
      if (newState) {
        deactivateAllTools('measure-area');
      }
    }
  };

  const handleZoomToExtent = () => {
    ZoomToExtent.handleZoomToExtent(mapInstance, initialBoundsRef);
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
      key: 'show-location',
      type: 'tool',
      circular: true,
      icon: <i className="fg-location" />,
      title: translate('ui.map.showLocation') || 'Mostrar mi ubicación'
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
            selected: measureLineActive
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
            selected: measureAreaActive
          }, translate('ui.map.measureArea') || 'Medir área')
        }
      ],
      onSelect: handleMeasureSelect,
      selected: measureLineActive || measureAreaActive
    }
  ];

  // Determinar qué herramienta está seleccionada
  const selectedTool = boxZoomActive ? 'zoom-in-box' : (zoomOutActive ? 'zoom-out' : (showLocationActive ? 'show-location' : null));

  return (
    <div className="map-toolbar">
      {/* Renderizar las herramientas como componentes */}
      <ZoomInBox active={boxZoomActive} onActiveChange={setBoxZoomActive} />
      <ZoomOut active={zoomOutActive} onActiveChange={setZoomOutActive} />
      <MeasureLine active={measureLineActive} onActiveChange={setMeasureLineActive} />
      <MeasureArea active={measureAreaActive} onActiveChange={setMeasureAreaActive} />
      <ShowLocation active={showLocationActive} onActiveChange={setShowLocationActive} />
      
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

