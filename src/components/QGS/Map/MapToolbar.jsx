import React, { useState, useMemo, useContext, useRef, useEffect } from 'react';
import { useMap } from './MapProvider';
import { ToolbarQGS } from '../../UI_QGS';
import { Button } from '../../UI';
import { ZoomInBox, ZoomOut, ZoomToExtent, MeasureLine, MeasureArea, ShowLocation, InfoClick } from './MapTools';
import { QgisConfigContext } from '../QgisConfigContext';

/**
 * Componente de toolbar para el mapa
 * Proporciona herramientas de zoom, medición y edición
 */
const MapToolbar = () => {
  const mapContext = useMap() || {};
  const { mapInstance, initialBoundsRef, t, config, startDrawing, startHoleDrawing, finishDrawing, clearCurrentSketch, cancelDrawing, removeLastHole, isDrawing, isDrawingHole, drawMode, holeCount, hasGeometry } = mapContext;
  const qgisConfig = useContext(QgisConfigContext);
  const translate = typeof t === 'function' ? t : (key) => key;
  const [boxZoomActive, setBoxZoomActive] = useState(false);
  const [zoomOutActive, setZoomOutActive] = useState(false);
  const [measureLineActive, setMeasureLineActive] = useState(false);
  const [measureAreaActive, setMeasureAreaActive] = useState(false);
  const [showLocationActive, setShowLocationActive] = useState(false);
  const [infoClickActive, setInfoClickActive] = useState(false);
  const [showEditHelp, setShowEditHelp] = useState(false);
  const pendingCancelRef = useRef(null);

  useEffect(() => {
    console.log('[MapToolbar] estado', { drawMode, isDrawing, isDrawingHole, holeCount, hasGeometry, measureLineActive, measureAreaActive });
  }, [drawMode, isDrawing, isDrawingHole, holeCount, hasGeometry, measureLineActive, measureAreaActive]);

  // Detectar capacidades de añadir por tipo geométrico
  const { canAddPoint, canAddLine, canAddPolygon, hasQueryableLayers } = useMemo(() => {
    const result = { canAddPoint: false, canAddLine: false, canAddPolygon: false, hasQueryableLayers: false };
    if (!config?.layers) return result;
    Object.values(config.layers).forEach(layer => {
      const caps = layer.WFSCapabilities || {};
      const canInsert = !!caps.allowInsert;
      const canQuery = !!caps.allowQuery;
      if (canQuery) result.hasQueryableLayers = true;
      if (!canInsert) return;
      const typeName = (layer.geometryType || layer.geometryTypeName || layer.type || '').toString().toUpperCase();
      if (typeName.includes('POINT')) result.canAddPoint = true;
      if (typeName.includes('LINE')) result.canAddLine = true;
      if (typeName.includes('POLYGON')) result.canAddPolygon = true;
      if (!typeName) {
        const name = (layer.name || '').toString().toLowerCase();
        if (name.includes('punto') || name.includes('point')) result.canAddPoint = true;
        if (name.includes('linea') || name.includes('line')) result.canAddLine = true;
        if (name.includes('poligono') || name.includes('polygon')) result.canAddPolygon = true;
      }
    });
    return result;
  }, [config]);

  const hasEditableTools = canAddPoint || canAddLine || canAddPolygon;

  const deactivateAllTools = (except = null) => {
    if (except !== 'zoom-in-box') setBoxZoomActive(false);
    if (except !== 'zoom-out') setZoomOutActive(false);
    if (except !== 'measure') { setMeasureLineActive(false); setMeasureAreaActive(false); }
    if (except !== 'show-location') setShowLocationActive(false);
    if (except !== 'info-click') setInfoClickActive(false);
  };

  const clearPendingCancel = () => {
    if (pendingCancelRef.current) { clearTimeout(pendingCancelRef.current); pendingCancelRef.current = null; }
  };

  const handleToolChange = (toolKey) => {
    console.log('[MapToolbar] onToolChange', { toolKey, drawMode, isDrawing, isDrawingHole, infoClickActive });
    if (!toolKey) {
      deactivateAllTools();
      clearPendingCancel();
      pendingCancelRef.current = setTimeout(() => { if (cancelDrawing) cancelDrawing(); pendingCancelRef.current = null; }, 50);
      return;
    }
    clearPendingCancel();
    if (toolKey === 'draw-point') { deactivateAllTools(); if (cancelDrawing) cancelDrawing(); startDrawing && startDrawing('point'); }
    else if (toolKey === 'draw-line') { deactivateAllTools(); if (cancelDrawing) cancelDrawing(); startDrawing && startDrawing('line'); }
    else if (toolKey === 'draw-polygon') { deactivateAllTools(); if (cancelDrawing) cancelDrawing(); startDrawing && startDrawing('polygon'); }
    else if (toolKey === 'measure-line') { setMeasureLineActive(true); setMeasureAreaActive(false); deactivateAllTools('measure'); if (cancelDrawing) cancelDrawing(); }
    else if (toolKey === 'measure-area') { setMeasureAreaActive(true); setMeasureLineActive(false); deactivateAllTools('measure'); if (cancelDrawing) cancelDrawing(); }
    else if (toolKey === 'zoom-in-box') { const s=!boxZoomActive; setBoxZoomActive(s); if (s) deactivateAllTools('zoom-in-box'); if (cancelDrawing) cancelDrawing(); }
    else if (toolKey === 'zoom-out') { const s=!zoomOutActive; setZoomOutActive(s); if (s) deactivateAllTools('zoom-out'); if (cancelDrawing) cancelDrawing(); }
    else if (toolKey === 'show-location') { const s=!showLocationActive; setShowLocationActive(s); if (s) deactivateAllTools('show-location'); if (cancelDrawing) cancelDrawing(); }
    else if (toolKey === 'info-click') { const s=!infoClickActive; setInfoClickActive(s); if (s) deactivateAllTools('info-click'); if (cancelDrawing) cancelDrawing(); }
  };

  const handleZoomToExtent = () => { ZoomToExtent.handleZoomToExtent(mapInstance, initialBoundsRef); };

  const tr = (key, es, en) => { const v = translate(key); if (v && v !== key) return v; const lang=(qgisConfig?.language||'es').toLowerCase(); return lang.startsWith('en')?(en||es||key):(es||en||key); };

  const measureSelectItem = {
    key: 'measure-select',
    type: 'selectButton',
    circular: false,
    icon: 'fg-measure',
    title: tr('ui.map.measurements','Mediciones','Measurements'),
    hideLabel: true,
    options: [
      {
        key: 'measure-line',
        toolKey: 'measure-line',
        element: (
          <Button size="small" circular icon={<i className="fg-measure-line" />} title={tr('ui.map.measureLine','Medir distancia','Measure distance')} />
        )
      },
      {
        key: 'measure-area',
        toolKey: 'measure-area',
        element: (
          <Button size="small" circular icon={<i className="fg-measure-area" />} title={tr('ui.map.measureArea','Medir área','Measure area')} />
        )
      }
    ]
  };

  const toolbarItems = [
    { key: 'zoom-in-box', type: 'tool', circular: true, icon: 'fg-zoom-in', title: tr('ui.map.zoomInBox','Zoom a caja','Box zoom') },
    { key: 'zoom-out', type: 'tool', circular: true, icon: 'fg-zoom-out', title: tr('ui.map.zoomOut','Alejar','Zoom out') },
    { key: 'zoom-extent', type: 'action', circular: true, icon: 'fg-extent', title: tr('ui.map.resetView','Vista completa','Full extent'), onClick: handleZoomToExtent },
    { key: 'show-location', type: 'tool', circular: true, icon: 'fg-location', title: tr('ui.map.showLocation','Mostrar ubicación','Show my location') },
    { key: 'info-click', type: 'tool', circular: true, icon: 'fg-poi-info', title: tr('ui.map.infoClick','Info en click','Info click'), disabled: !hasQueryableLayers },
    measureSelectItem
  ];

  if (canAddPoint) toolbarItems.push({ key: 'draw-point', type: 'tool', circular: true, icon: 'fg-point', title: tr('ui.map.drawPoint','Añadir punto','Add point') });
  if (canAddLine) toolbarItems.push({ key: 'draw-line', type: 'tool', circular: true, icon: 'fg-polyline', title: tr('ui.map.drawLine','Dibujar línea','Draw line') });
  if (canAddPolygon) toolbarItems.push({ key: 'draw-polygon', type: 'tool', circular: true, icon: 'fg-polygon', title: tr('ui.map.drawPolygon','Dibujar polígono','Draw polygon') });

  // Mostrar guardar/cancelar si ya hay geometría o no se está sketchando o si se dibuja agujero
  if (drawMode && (hasGeometry || !isDrawing || isDrawingHole)) {
    if (drawMode === 'polygon') {
      toolbarItems.push({ key: 'poly-add-hole', type: 'action', circular: true, icon: 'fg-polygon-hole', title: tr('ui.map.addHole','Añadir agujero','Add hole'), onClick: () => setShowEditHelp(false) || (startHoleDrawing && startHoleDrawing()) });
      if (!isDrawingHole && (holeCount || 0) > 0) {
        toolbarItems.push({ key: 'poly-remove-hole', type: 'action', circular: true, icon: 'fas fa-minus-circle', title: tr('ui.map.removeHole','Eliminar agujero','Remove hole'), onClick: () => removeLastHole && removeLastHole() });
      }
    }
    toolbarItems.push({ key: 'draw-save', type: 'action', circular: true, icon: 'fas fa-save', title: tr('ui.map.saveDrawing','Guardar dibujo','Save drawing'), onClick: () => {
      const geom = finishDrawing && finishDrawing();
      console.log('[MapToolbar] Guardar dibujo', { drawMode, isDrawing, isDrawingHole, holeCount, hasGeometry, geom });
    }});
    toolbarItems.push({ key: 'draw-cancel', type: 'action', circular: true, icon: 'fas fa-times', title: tr('ui.map.cancelDrawing','Cancelar dibujo','Cancel drawing'), onClick: () => { console.log('[MapToolbar] Cancelar dibujo'); cancelDrawing && cancelDrawing(); } });
  }

  // Botón de ayuda solo si hay herramientas editables
  if (hasEditableTools) {
    toolbarItems.push({ key: 'edit-help', type: 'action', circular: true, icon: 'fas fa-question-circle', title: tr('ui.map.editHelp','Ayuda de edición','Editing help'), onClick: () => setShowEditHelp(true) });
  }

  const selectedTool = boxZoomActive ? 'zoom-in-box' : (zoomOutActive ? 'zoom-out' : (showLocationActive ? 'show-location' : (infoClickActive ? 'info-click' : (drawMode ? `draw-${drawMode}` : ((measureLineActive || measureAreaActive) ? (measureLineActive ? 'measure-line' : 'measure-area') : null)))));

  return (
    <div className="map-toolbar">
      <ZoomInBox active={boxZoomActive} onActiveChange={setBoxZoomActive} />
      <ZoomOut active={zoomOutActive} onActiveChange={setZoomOutActive} />
      <MeasureLine active={measureLineActive} onActiveChange={setMeasureLineActive} />
      <MeasureArea active={measureAreaActive} onActiveChange={setMeasureAreaActive} />
      <ShowLocation active={showLocationActive} onActiveChange={setShowLocationActive} />
      <InfoClick active={infoClickActive} onActiveChange={setInfoClickActive} />
      <ToolbarQGS items={toolbarItems} size="medium" selectedTool={selectedTool} onToolChange={handleToolChange} />

      {showEditHelp && (
        <div style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 10000 }} onClick={() => setShowEditHelp(false)}>
          <div style={{ maxWidth: 520, width: '90%', background: '#fff', borderRadius: 8, padding: 16, margin: '10vh auto', boxShadow: '0 8px 24px rgba(0,0,0,0.2)' }} onClick={(e) => e.stopPropagation()}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 8 }}>
              <h3 style={{ margin: 0 }}>{tr('ui.map.editHelp.title','Ayuda de edición','Editing help')}</h3>
              <button onClick={() => setShowEditHelp(false)} style={{ background: 'transparent', border: 'none', fontSize: 18, cursor: 'pointer' }}>×</button>
            </div>
            <div style={{ fontSize: 14, lineHeight: 1.5 }}>
              <p><b>{tr('ui.map.editHelp.basic','Flujo básico','Basic flow')}</b></p>
              <ul style={{ paddingLeft: 18 }}>
                <li>{tr('ui.map.editHelp.basic1','Selecciona la herramienta de dibujar (punto/línea/polígono).','Select the draw tool (point/line/polygon).')}</li>
                <li>{tr('ui.map.editHelp.basic2','Finaliza con doble clic o haciendo clic a menos de 3 px del último vértice.','Finish with double click or clicking less than 3 px from the last vertex.')}</li>
                <li>{tr('ui.map.editHelp.basic3','Tras finalizar, podrás Guardar o Cancelar. Si hay capas multi, podrás iniciar otra geometría con el siguiente clic.','After finishing you can Save or Cancel. If there are multi layers, you can start another geometry with the next click.')}</li>
              </ul>
              <p><b>{tr('ui.map.editHelp.vertices','Edición de vértices','Vertex editing')}</b></p>
              <ul style={{ paddingLeft: 18 }}>
                <li>{tr('ui.map.editHelp.vertices1','Arrastra los vértices para moverlos.','Drag vertices to move them.')}</li>
                <li>{tr('ui.map.editHelp.vertices2','Haz clic en los puntos intermedios para insertar vértices; mantén pulsado para insertar y arrastrar en un solo gesto.','Click on midpoints to insert vertices; hold to insert and drag in a single gesture.')}</li>
                <li>{tr('ui.map.editHelp.vertices3','Para borrar un vértice: Alt+clic o clic derecho sobre el vértice (líneas ≥ 2, polígonos ≥ 3).','To delete a vertex: Alt+click or right click on the vertex (lines ≥ 2, polygons ≥ 3).')}</li>
              </ul>
              <p><b>{tr('ui.map.editHelp.holes','Agujeros (polígonos)','Holes (polygons)')}</b></p>
              <ul style={{ paddingLeft: 18 }}>
                <li>{tr('ui.map.editHelp.holes1','Pulsa Añadir agujero y dibuja el anillo interior; finaliza con doble clic o cierre por proximidad.','Click Add hole and draw the inner ring; finish with double click or close by proximity.')}</li>
                <li>{tr('ui.map.editHelp.holes2','Durante el agujero, los vértices del contorno no se mueven.','During the hole, the outer contour vertices do not move.')}</li>
                <li>{tr('ui.map.editHelp.holes3','Puedes eliminar el último agujero con Eliminar agujero.','You can remove the last hole with Remove hole.')}</li>
              </ul>
              <p><b>{tr('ui.map.editHelp.save','Guardado y atributos','Saving and attributes')}</b></p>
              <ul style={{ paddingLeft: 18 }}>
                <li>{tr('ui.map.editHelp.save1','Al pulsar Guardar, se abrirá un diálogo para cumplimentar los atributos asociados a la geometría antes de enviarla al servidor.','When pressing Save, a dialog will open to fill the attributes associated with the geometry before sending to the server.')}</li>
              </ul>
            </div>
            <div style={{ marginTop: 12, textAlign: 'right' }}>
              <button onClick={() => setShowEditHelp(false)} style={{ padding: '6px 12px', borderRadius: 4, border: '1px solid #ddd', background: '#f7f7f7', cursor: 'pointer' }}>{tr('ui.common.close','Cerrar','Close')}</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default MapToolbar;

