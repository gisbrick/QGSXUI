import React, { createContext, useContext, useEffect, useState, useRef } from 'react';
import { QgisConfigContext } from '../QgisConfigContext';

// Creamos un contexto para compartir estado entre componentes
const MapContext = createContext(null);

export const MapProvider = ({ layerName, featureId, children }) => {
  const mapInstanceRef = useRef(null);
  const initialBoundsRef = useRef(null);
  const [mapInstance, setMapInstance] = useState(null);
  const [refreshWMSLayer, setRefreshWMSLayer] = useState(null);

  // Capas para dibujo: multi (acumuladas) y activa (sketch o geometría activa)
  const multiLayerRef = useRef(null);
  const drawLayerRef = useRef(null);
  const previewLayerRef = useRef(null);
  const editHandlesLayerRef = useRef(null);

  const drawPointsRef = useRef([]);
  const holesRef = useRef([]);
  const holeTempRef = useRef([]);
  const multiGeometriesRef = useRef([]);
  const [holeCount, setHoleCount] = useState(0);
  const [drawMode, setDrawMode] = useState(null);
  const drawModeRef = useRef(null);
  const [isDrawing, setIsDrawing] = useState(false);
  const isDrawingRef = useRef(false);
  const [hasGeometry, setHasGeometry] = useState(false);
  const hasGeometryRef = useRef(false);
  const [isDrawingHole, setIsDrawingHole] = useState(false);
  const isDrawingHoleRef = useRef(false);
  const canDrawMultipleRef = useRef(false);
  const vertexPaneNameRef = useRef('qgs-vertex-pane');
  useEffect(() => { isDrawingRef.current = isDrawing; }, [isDrawing]);
  useEffect(() => { drawModeRef.current = drawMode; }, [drawMode]);
  useEffect(() => { isDrawingHoleRef.current = isDrawingHole; }, [isDrawingHole]);
  useEffect(() => { hasGeometryRef.current = hasGeometry; }, [hasGeometry]);

  const qgisConfig = useContext(QgisConfigContext);
  const { config, t, notificationManager, qgsUrl, qgsProjectPath } = qgisConfig || {};

  const checkCanDrawMultipleForMode = (mode) => {
    try {
      const layers = config?.layers ? Object.values(config.layers) : [];
      if (!layers || layers.length === 0) return false;
      const want = (mode || '').toLowerCase();
      const matches = (wkb) => {
        if (!wkb) return false;
        const W = wkb.toLowerCase();
        if (want === 'point') return W.includes('multipoint');
        if (want === 'line') return W.includes('multilinestring');
        if (want === 'polygon') return W.includes('multipolygon');
        return false;
      };
      for (const layer of layers) {
        const wkb = layer?.wkbType_name || layer?.wkbTypeName || layer?.wkbType;
        if (matches(String(wkb || ''))) return true;
      }
    } catch (e) {}
    return false;
  };

  const getVertexPaneEl = () => {
    if (!mapInstance) return null;
    return mapInstance.getPane(vertexPaneNameRef.current);
  };

  const ensureVertexPane = () => {
    if (!mapInstance || !mapInstance.createPane) return;
    const name = vertexPaneNameRef.current;
    const exists = !!mapInstance.getPane(name);
    if (!exists) {
      console.log('[MapProvider] Creando pane de vértices:', name);
      mapInstance.createPane(name);
      const paneEl = mapInstance.getPane(name);
      if (paneEl) {
        paneEl.style.zIndex = 700;
        paneEl.style.pointerEvents = 'auto';
        console.log('[MapProvider] Pane creado:', { name, zIndex: paneEl.style.zIndex });
      } else {
        console.warn('[MapProvider] No se pudo obtener el elemento del pane tras crearlo:', name);
      }
    } else {
      const paneEl = mapInstance.getPane(name);
      console.log('[MapProvider] Pane de vértices ya existe:', { name, zIndex: paneEl?.style?.zIndex });
    }
    return vertexPaneNameRef.current;
  };

  const setVertexPaneInteractive = (enabled) => {
    try {
      const pane = getVertexPaneEl();
      if (pane) {
        pane.style.pointerEvents = enabled ? 'auto' : 'none';
        console.log('[MapProvider] vertex pane pointer-events =', pane.style.pointerEvents);
      }
    } catch (e) {}
  };

  const clearEditHandles = () => {
    if (editHandlesLayerRef.current && mapInstance) {
      try {
        console.log('[MapProvider] clearEditHandles: limpiando capa de manejadores');
        editHandlesLayerRef.current.clearLayers();
        if (mapInstance.hasLayer(editHandlesLayerRef.current)) mapInstance.removeLayer(editHandlesLayerRef.current);
      } catch (e) { console.warn('[MapProvider] clearEditHandles error:', e); }
    }
    editHandlesLayerRef.current = null;
  };

  const syncMultiLayer = (mode) => {
    if (!mapInstance || !window.L) return;
    if (!multiLayerRef.current) {
      multiLayerRef.current = window.L.featureGroup([]).addTo(mapInstance);
    }
    try {
      multiLayerRef.current.clearLayers();
      const multi = multiGeometriesRef.current || [];
      if (mode === 'point') {
        multi.forEach((coord, idx) => {
          const latlng = window.L.latLng(coord[1], coord[0]);
          const marker = window.L.circleMarker(latlng, { radius: 5, color: '#1565c0', weight: 2, fillColor: '#64b5f6', fillOpacity: 0.8 });
          multiLayerRef.current.addLayer(marker);
        });
      } else if (mode === 'line') {
        multi.forEach((lineCoords) => {
          const latlngs = lineCoords.map(([lng, lat]) => window.L.latLng(lat, lng));
          const line = window.L.polyline(latlngs, { color: '#1565c0', weight: 3, opacity: 0.9 });
          multiLayerRef.current.addLayer(line);
        });
      } else if (mode === 'polygon') {
        multi.forEach((rings) => {
          const latlngRings = rings.map(ring => ring.map(([lng, lat]) => window.L.latLng(lat, lng)));
          const poly = window.L.polygon(latlngRings, { color: '#1565c0', weight: 2, fillColor: '#64b5f6', fillOpacity: 0.25 });
          multiLayerRef.current.addLayer(poly);
        });
      }
      console.log('[MapProvider] syncMultiLayer', { mode, count: multi.length });
    } catch (e) { console.warn('syncMultiLayer error', e); }
  };

  const redrawFinalGeometry = () => {
    if (!drawLayerRef.current || !window.L) return;
    drawLayerRef.current.clearLayers();

    const mode = drawModeRef.current;
    try {
      console.log('[MapProvider] redrawFinalGeometry()', {
        mode,
        multiCount: multiGeometriesRef.current?.length || 0,
        activePoints: drawPointsRef.current?.length || 0,
        holes: holesRef.current?.length || 0
      });
    } catch (e) {}

    // Solo dibujar la geometría activa en drawLayerRef; la multi se mantiene en multiLayerRef
    if (mode === 'point') {
      if (drawPointsRef.current.length >= 1) {
        const latlng = window.L.latLng(drawPointsRef.current[0][1], drawPointsRef.current[0][0]);
        const marker = window.L.circleMarker(latlng, { radius: 6, color: '#1976d2', weight: 2, fillColor: '#2196f3', fillOpacity: 0.7 });
        drawLayerRef.current.addLayer(marker);
        console.log('[MapProvider] redraw active point', { coord: drawPointsRef.current[0] });
      }
      return;
    }

    if (mode === 'line') {
      const latlngs = drawPointsRef.current.map(([lng, lat]) => window.L.latLng(lat, lng));
      if (latlngs.length >= 2) {
        const line = window.L.polyline(latlngs, { color: '#1976d2', weight: 3, opacity: 1 });
        drawLayerRef.current.addLayer(line);
        console.log('[MapProvider] redraw active line', { vertices: drawPointsRef.current.length });
      }
      return;
    }

    if (mode === 'polygon') {
      const outer = drawPointsRef.current.map(([lng, lat]) => window.L.latLng(lat, lng));
      const holes = (holesRef.current || []).map(ring => ring.map(([lng, lat]) => window.L.latLng(lat, lng)));
      if (outer.length >= 3) {
        const poly = window.L.polygon([outer, ...holes], { color: '#1976d2', weight: 2, fillColor: '#2196f3', fillOpacity: 0.3 });
        drawLayerRef.current.addLayer(poly);
        console.log('[MapProvider] redraw active polygon', { outer: outer.length, holes: holesRef.current?.length || 0 });
      }
    }
  };

  const createDivIcon = (colorBorder = '#ff9800', colorFill = '#ffc107') => {
    return window.L.divIcon({
      className: '',
      html: `<div style=\"width:12px;height:12px;border:2px solid ${colorBorder};background:${colorFill};border-radius:50%; box-shadow: 0 0 0 1px rgba(0,0,0,0.15);\"></div>`,
      iconSize: [12, 12],
      iconAnchor: [6, 6]
    });
  };

  const rebuildEditHandles = (overrideMode = null) => {
    if (!mapInstance || !window.L) return;
    const mode = overrideMode || drawModeRef.current;
    if (!mode) { console.log('[MapProvider] rebuildEditHandles: drawMode null, omitiendo'); return; }
    console.log('[MapProvider] rebuildEditHandles: INICIO', { drawMode: mode, puntos: drawPointsRef.current.length, holes: holesRef.current?.length || 0 });
    clearEditHandles();
    ensureVertexPane();
    editHandlesLayerRef.current = window.L.featureGroup([]).addTo(mapInstance);

    const vertexPane = vertexPaneNameRef.current;
    let countVertices = 0;
    let countMidpoints = 0;

    if (mode === 'point' && drawPointsRef.current.length >= 1) {
      const latlng = window.L.latLng(drawPointsRef.current[0][1], drawPointsRef.current[0][0]);
      const handle = window.L.marker(latlng, { draggable: true, icon: createDivIcon('#1976d2', '#64b5f6'), opacity: 1, riseOnHover: true, zIndexOffset: 10000, pane: vertexPane, autoPan: true });
      handle.on('dragstart', (e) => {
        console.log('[MapProvider] dragstart punto', { from: e.target.getLatLng() });
      });
      handle.on('drag', (e) => {
        const p = e.latlng;
        drawPointsRef.current = [[p.lng, p.lat]];
        redrawFinalGeometry();
        console.log('[MapProvider] drag punto', { to: p });
      });
      handle.on('dragend', (e) => {
        console.log('[MapProvider] dragend punto', { end: e.target.getLatLng() });
        rebuildEditHandles(mode);
      });
      editHandlesLayerRef.current.addLayer(handle);
      countVertices += 1;
      console.log('[MapProvider] rebuildEditHandles: punto -> 1 handler');
      return;
    }

    const buildRingHandles = (ringPoints, updateAtIndex, insertAtIndex, ringIsClosed, ringLabel) => {
      ringPoints.forEach(([lng, lat], index) => {
        const handle = window.L.marker([lat, lng], { draggable: true, icon: createDivIcon(), opacity: 1, riseOnHover: true, zIndexOffset: 10000, pane: vertexPane, autoPan: true });
        handle.on('dragstart', (e) => {
          console.log('[MapProvider] dragstart vértice', { ring: ringLabel, index, from: e.target.getLatLng() });
        });
        handle.on('drag', (e) => {
          const p = e.latlng;
          updateAtIndex(index, [p.lng, p.lat]);
          redrawFinalGeometry();
          console.log('[MapProvider] drag vértice', { ring: ringLabel, index, to: p });
        });
        handle.on('dragend', (e) => {
          console.log('[MapProvider] dragend vértice', { ring: ringLabel, index, end: e.target.getLatLng() });
          rebuildEditHandles(mode);
        });
        handle.on('click', (e) => {
          if (e.originalEvent && (e.originalEvent.altKey || e.originalEvent.metaKey)) {
            if (mode === 'line') {
              if (ringPoints.length <= 2) return;
            } else if (mode === 'polygon') {
              if (ringPoints.length <= 3) return;
            }
            console.log('[MapProvider] eliminar vértice (Alt/Meta)', { ring: ringLabel, index });
            ringPoints.splice(index, 1);
            redrawFinalGeometry();
            rebuildEditHandles(mode);
          }
        });
        handle.on('contextmenu', (e) => {
          try { e.originalEvent.preventDefault(); e.originalEvent.stopPropagation(); } catch (err) {}
          if (mode === 'line') {
            if (ringPoints.length <= 2) return;
          } else if (mode === 'polygon') {
            if (ringPoints.length <= 3) return;
          }
          console.log('[MapProvider] eliminar vértice (clic derecho)', { ring: ringLabel, index });
          ringPoints.splice(index, 1);
          redrawFinalGeometry();
          rebuildEditHandles(mode);
        });
        editHandlesLayerRef.current.addLayer(handle);
        countVertices += 1;
      });

      const addMidHandle = (a, b, idx) => {
        const midLat = (a[1] + b[1]) / 2;
        const midLng = (a[0] + b[0]) / 2;
        const mid = window.L.marker([midLat, midLng], { draggable: false, icon: createDivIcon('#03a9f4', '#b3e5fc'), opacity: 1, zIndexOffset: 9000, pane: vertexPane });
        // Inserción + arrastre inmediato en mousedown
        mid.on('mousedown', (e) => {
          try { e.originalEvent.preventDefault(); e.originalEvent.stopPropagation(); } catch (err) {}
          console.log('[MapProvider] midpoint mousedown -> insertar y arrastrar', { ring: ringLabel, insertIndex: idx });
          insertAtIndex(idx, [midLng, midLat]);
          redrawFinalGeometry();
          // Convertir este midpoint en vértice arrastrable inmediatamente
          mid.setIcon(createDivIcon());
          mid.options.draggable = true;
          if (mid.dragging && mid.dragging.enable) mid.dragging.enable();
          // Enlazar handlers de vértice para el nuevo índice
          let currentIndex = idx;
          mid.off('click');
          mid.on('drag', (ev) => {
            const p = ev.latlng;
            updateAtIndex(currentIndex, [p.lng, p.lat]);
            redrawFinalGeometry();
          });
          mid.on('dragend', (ev) => {
            console.log('[MapProvider] dragend nuevo vértice desde midpoint', { ring: ringLabel, index: currentIndex, end: ev.target.getLatLng() });
            rebuildEditHandles(mode);
          });
          mid.on('contextmenu', (ev) => {
            try { ev.originalEvent.preventDefault(); ev.originalEvent.stopPropagation(); } catch (err) {}
            // eliminar inmediatamente el vértice recién insertado
            if (mode === 'line') {
              if (ringPoints.length <= 2) return;
            } else if (mode === 'polygon') {
              if (ringPoints.length <= 3) return;
            }
            console.log('[MapProvider] eliminar vértice (clic derecho) generado por midpoint', { ring: ringLabel, index: currentIndex });
            ringPoints.splice(currentIndex, 1);
            redrawFinalGeometry();
            rebuildEditHandles(mode);
          });
          // Iniciar el arrastre programáticamente
          if (mid.dragging && mid.dragging._draggable && e.originalEvent) {
            try { mid.dragging._draggable._onDown(e.originalEvent); } catch (err) { console.warn('No se pudo iniciar drag programático', err); }
          }
        });
        // Click normal (por compatibilidad): insertar sin arrastre
        mid.on('click', () => {
          console.log('[MapProvider] insertar vértice intermedio (click)', { ring: ringLabel, insertIndex: idx });
          insertAtIndex(idx, [midLng, midLat]);
          redrawFinalGeometry();
          rebuildEditHandles(mode);
        });
        editHandlesLayerRef.current.addLayer(mid);
        countMidpoints += 1;
      };

      for (let i = 0; i < ringPoints.length - 1; i++) {
        addMidHandle(ringPoints[i], ringPoints[i + 1], i + 1);
      }
      if (ringIsClosed && ringPoints.length > 2) {
        addMidHandle(ringPoints[ringPoints.length - 1], ringPoints[0], ringPoints.length);
      }
      console.log(`[MapProvider] ${ringLabel}: vertices=${ringPoints.length}, midpoints=${ringIsClosed ? ringPoints.length : Math.max(0, ringPoints.length - 1)}`);
    };

    if (mode === 'line') {
      const updateAt = (i, pt) => { drawPointsRef.current[i] = pt; };
      const insertAt = (i, pt) => { drawPointsRef.current.splice(i, 0, pt); };
      buildRingHandles(drawPointsRef.current, updateAt, insertAt, false, 'LINE');
      console.log('[MapProvider] rebuildEditHandles FIN (LINE):', { countVertices, countMidpoints, pane: vertexPane });
      return;
    }

    if (mode === 'polygon') {
      const updateOuterAt = (i, pt) => { drawPointsRef.current[i] = pt; };
      const insertOuterAt = (i, pt) => { drawPointsRef.current.splice(i, 0, pt); };
      buildRingHandles(drawPointsRef.current, updateOuterAt, insertOuterAt, true, 'POLY-OUTER');
      (holesRef.current || []).forEach((ring, ringIdx) => {
        const updateHoleAt = (i, pt) => { holesRef.current[ringIdx][i] = pt; };
        const insertHoleAt = (i, pt) => { holesRef.current[ringIdx].splice(i, 0, pt); };
        buildRingHandles(ring, updateHoleAt, insertHoleAt, true, `POLY-HOLE-${ringIdx}`);
      });
      console.log('[MapProvider] rebuildEditHandles FIN (POLY):', { countVertices, countMidpoints, pane: vertexPane, holes: holesRef.current?.length || 0 });
    }
  };

  // Iniciar dibujo
  const startDrawing = (mode) => {
    if (!mapInstance || !window.L) return;
    console.log('[MapProvider] startDrawing()', { mode });
    cancelDrawing();
    setDrawMode(mode);
    drawModeRef.current = mode;
    setIsDrawing(true);
    setHasGeometry(false);
    hasGeometryRef.current = false;
    canDrawMultipleRef.current = checkCanDrawMultipleForMode(mode);
    console.log('[MapProvider] canDrawMultiple:', canDrawMultipleRef.current);
    // Inicializar capas
    multiLayerRef.current = window.L.featureGroup([]).addTo(mapInstance);
    drawLayerRef.current = window.L.featureGroup([]).addTo(mapInstance);
    previewLayerRef.current = window.L.featureGroup([]).addTo(mapInstance);
    drawPointsRef.current = [];
    holesRef.current = [];
    multiGeometriesRef.current = [];
    setHoleCount(0);
    clearEditHandles();
    try {
      const container = mapInstance.getContainer();
      container.style.setProperty('cursor', 'crosshair', 'important');
      if (mapInstance.dragging && mapInstance.dragging.enabled()) { mapInstance.dragging.disable(); }
      if (mapInstance.doubleClickZoom && mapInstance.doubleClickZoom.enabled()) { mapInstance.doubleClickZoom.disable(); }
      setTimeout(() => { container.style.setProperty('cursor', 'crosshair', 'important'); }, 0);
    } catch (e) {}

    const isCloseToLastPointPx = (latlng) => {
      const pts = drawPointsRef.current;
      if (!pts || pts.length === 0) return false;
      const last = pts[pts.length - 1];
      try {
        const p1 = mapInstance.latLngToContainerPoint(window.L.latLng(last[1], last[0]));
        const p2 = mapInstance.latLngToContainerPoint(latlng);
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < 3;
      } catch (e) { return false; }
    };

    const finalizeCurrentSketch = () => {
      const modeLocal = mode;
      if (modeLocal === 'point' && drawPointsRef.current.length >= 1) {
        if (canDrawMultipleRef.current) {
          console.log('[MapProvider] finalizeCurrentSketch(point) multi, keep active for edit', { coord: drawPointsRef.current[0] });
          setIsDrawing(false);
          setHasGeometry(true);
          if (previewLayerRef.current) previewLayerRef.current.clearLayers();
          rebuildEditHandles('point');
          return true;
        }
      } else if (modeLocal === 'line' && drawPointsRef.current.length >= 2) {
        if (canDrawMultipleRef.current) {
          console.log('[MapProvider] finalizeCurrentSketch(line) multi, keep active for edit', { vertices: drawPointsRef.current.length });
          setIsDrawing(false);
          setHasGeometry(true);
          if (previewLayerRef.current) previewLayerRef.current.clearLayers();
          rebuildEditHandles('line');
          return true;
        }
      } else if (modeLocal === 'polygon' && drawPointsRef.current.length >= 3) {
        if (canDrawMultipleRef.current) {
          console.log('[MapProvider] finalizeCurrentSketch(polygon) multi, keep active for edit', { outer: drawPointsRef.current.length, holes: holesRef.current?.length || 0 });
          setIsDrawing(false);
          setHasGeometry(true);
          if (previewLayerRef.current) previewLayerRef.current.clearLayers();
          rebuildEditHandles('polygon');
          return true;
        }
      }
      return false;
    };

    const handleClick = (e) => {
      // Si estamos en modo multi pero no estamos sketchando, este click inicia nueva geometría
      if (!isDrawingRef.current && canDrawMultipleRef.current && drawModeRef.current) {
        if (isDrawingHoleRef.current) return;
        // Antes de comenzar nuevo sketch, acumular la geometría activa actual si existe
        if (drawModeRef.current === 'polygon' && drawPointsRef.current.length >= 3) {
          const rings = [[...drawPointsRef.current]];
          if ((holesRef.current || []).length > 0) { rings.push(...holesRef.current.map(r => [...r])); }
          multiGeometriesRef.current.push(rings);
          syncMultiLayer('polygon');
          drawPointsRef.current = [];
          holesRef.current = [];
          setHoleCount(0);
        } else if (drawModeRef.current === 'line' && drawPointsRef.current.length >= 2) {
          multiGeometriesRef.current.push([...drawPointsRef.current]);
          syncMultiLayer('line');
          drawPointsRef.current = [];
        } else if (drawModeRef.current === 'point' && drawPointsRef.current.length >= 1) {
          multiGeometriesRef.current.push(drawPointsRef.current[0]);
          syncMultiLayer('point');
          drawPointsRef.current = [];
        }
        const latlng = e.latlng;
        setIsDrawing(true);
        drawPointsRef.current = [[latlng.lng, latlng.lat]];
        console.log('[MapProvider] start new sketch (multi)', { first: drawPointsRef.current[0] });
        redrawFinalGeometry();
        return;
      }

      if (!isDrawingRef.current) return;
      if (isDrawingHoleRef.current) { return; }
      const latlng = e.latlng;
      if (mode === 'point') {
        console.log('[MapProvider] click en dibujo (point)', { currentActive: drawPointsRef.current?.length || 0, multiCount: multiGeometriesRef.current?.length || 0 });
      } else {
        console.log('[MapProvider] click en dibujo', { mode, latlng, puntos: drawPointsRef.current.length });
      }
      if ((mode === 'line' || mode === 'polygon') && drawPointsRef.current.length > 0) {
        if (isCloseToLastPointPx(latlng)) {
          console.log('[MapProvider] click cerca del último punto (<3px): finalizar');
          if (!finalizeCurrentSketch()) {
            setIsDrawing(false);
            setHasGeometry(true);
            if (previewLayerRef.current) previewLayerRef.current.clearLayers();
            rebuildEditHandles(mode);
          }
          return;
        }
      }
      drawPointsRef.current.push([latlng.lng, latlng.lat]);
      if (mode === 'point') {
        // dibujar solo activo
        redrawFinalGeometry();
        if (!finalizeCurrentSketch()) {
          setIsDrawing(false);
          setHasGeometry(true);
          rebuildEditHandles(mode);
        }
      } else { redrawFinalGeometry(); }
    };

    const handleMouseMove = (e) => {
      if (!isDrawingRef.current) return;
      if (isDrawingHoleRef.current) { return; }
      if (mode !== 'line' && mode !== 'polygon') return;
      const current = e.latlng;
      const latlngs = drawPointsRef.current.map(([lng, lat]) => window.L.latLng(lat, lng));
      if (latlngs.length === 0) return;
      const latlngsWithCursor = [...latlngs, current];
      if (previewLayerRef.current) {
        previewLayerRef.current.clearLayers();
        if (mode === 'line') {
          const previewLine = window.L.polyline(latlngsWithCursor, { color: '#1976d2', weight: 2, dashArray: '6,4', opacity: 0.9 });
          previewLayerRef.current.addLayer(previewLine);
        } else if (mode === 'polygon') {
          const previewPoly = window.L.polygon(latlngsWithCursor, { color: '#1976d2', weight: 2, dashArray: '6,4', fillColor: '#2196f3', fillOpacity: 0.2 });
          previewLayerRef.current.addLayer(previewPoly);
        }
      }
    };

    const handleDblClick = () => {
      if (!isDrawingRef.current) return;
      if (isDrawingHoleRef.current) { return; }
      if (mode === 'line' || mode === 'polygon') {
        console.log('[MapProvider] dblclick: finalizar');
        if (!finalizeCurrentSketch()) {
          setIsDrawing(false);
          setHasGeometry(true);
          if (previewLayerRef.current) previewLayerRef.current.clearLayers();
          rebuildEditHandles(mode);
        }
      }
    };

    mapInstance.__drawHandlers = { handleClick, handleDblClick, handleMouseMove };
    mapInstance.on('click', handleClick);
    mapInstance.on('dblclick', handleDblClick);
    mapInstance.on('mousemove', handleMouseMove);
  };

  const redrawSketch = (mode) => {
    if (!drawLayerRef.current || !window.L) return;
    // redibuja acumuladas + actual
    redrawFinalGeometry();
  };

  // Finalizar y obtener GeoJSON (incluyendo holes y Multi*)
  const finishDrawing = () => {
    const mode = drawModeRef.current;
    // Construir colecciones incluyendo la geometría activa si existe
    if (mode === 'point') {
      if ((multiGeometriesRef.current?.length || 0) > 0) {
        const coords = [...multiGeometriesRef.current];
        if (drawPointsRef.current.length >= 1) {
          coords.push(drawPointsRef.current[0]);
        }
        console.log('[MapProvider] finishDrawing MultiPoint', { count: coords.length });
        return { type: 'MultiPoint', coordinates: coords };
      }
      if (drawPointsRef.current.length >= 1) return { type: 'Point', coordinates: drawPointsRef.current[0] };
      return null;
    }

    if (mode === 'line') {
      if ((multiGeometriesRef.current?.length || 0) > 0) {
        const lines = [...multiGeometriesRef.current];
        if (drawPointsRef.current.length >= 2) {
          lines.push([...drawPointsRef.current]);
        }
        console.log('[MapProvider] finishDrawing MultiLineString', { count: lines.length });
        return { type: 'MultiLineString', coordinates: lines };
      }
      if (drawPointsRef.current.length >= 2) return { type: 'LineString', coordinates: [...drawPointsRef.current] };
      return null;
    }

    if (mode === 'polygon') {
      if ((multiGeometriesRef.current?.length || 0) > 0) {
        const polys = multiGeometriesRef.current.map(rings => rings.map(r => [...r, r[0]]));
        if (drawPointsRef.current.length >= 3) {
          const activeRings = [[...drawPointsRef.current]];
          if ((holesRef.current || []).length > 0) {
            activeRings.push(...holesRef.current.map(r => [...r]));
          }
          polys.push(activeRings.map(r => [...r, r[0]]));
        }
        console.log('[MapProvider] finishDrawing MultiPolygon', { count: polys.length });
        return { type: 'MultiPolygon', coordinates: polys };
      }
      if (drawPointsRef.current.length >= 3) {
        const rings = [
          [...drawPointsRef.current, drawPointsRef.current[0]],
          ...(holesRef.current || []).map(r => [...r, r[0]])
        ];
        return { type: 'Polygon', coordinates: rings };
      }
      return null;
    }
    return null;
  };

  // Iniciar dibujo de agujero dentro de un polígono ya finalizado
  const startHoleDrawing = () => {
    if (!mapInstance || !window.L) return;
    const mode = drawModeRef.current;
    if (mode !== 'polygon') return;
    console.log('[MapProvider] startHoleDrawing()', { drawMode: mode, isDrawingHole: true });

    // Desregistrar handlers generales de dibujo para no interferir, guardándolos para restaurar después
    if (mapInstance.__drawHandlers) {
      mapInstance.__savedDrawHandlers = mapInstance.__drawHandlers;
      const { handleClick, handleDblClick, handleMouseMove } = mapInstance.__drawHandlers;
      try { mapInstance.off('click', handleClick); } catch (e) {}
      try { mapInstance.off('dblclick', handleDblClick); } catch (e) {}
      try { mapInstance.off('mousemove', handleMouseMove); } catch (e) {}
      delete mapInstance.__drawHandlers;
      console.log('[MapProvider] draw handlers desregistrados durante agujero (guardados para restaurar)');
    }

    setIsDrawing(true);
    setIsDrawingHole(true);
    holeTempRef.current = [];
    // Desactivar interacción con manejadores existentes para que no se muevan
    setVertexPaneInteractive(false);
    if (editHandlesLayerRef.current && mapInstance) {
      try { if (mapInstance.hasLayer(editHandlesLayerRef.current)) mapInstance.removeLayer(editHandlesLayerRef.current); } catch (e) {}
    }
    if (!previewLayerRef.current) {
      previewLayerRef.current = window.L.featureGroup([]).addTo(mapInstance);
    }
    try {
      const container = mapInstance.getContainer();
      container.style.setProperty('cursor', 'crosshair', 'important');
      if (mapInstance.dragging && mapInstance.dragging.enabled()) { mapInstance.dragging.disable(); }
      if (mapInstance.doubleClickZoom && mapInstance.doubleClickZoom.enabled()) { mapInstance.doubleClickZoom.disable(); }
      setTimeout(() => { container.style.setProperty('cursor', 'crosshair', 'important'); }, 0);
    } catch (e) {}

    const isCloseToLastPointPx = (latlng) => {
      const pts = holeTempRef.current;
      if (!pts || pts.length === 0) return false;
      const last = pts[pts.length - 1];
      try {
        const p1 = mapInstance.latLngToContainerPoint(window.L.latLng(last[1], last[0]));
        const p2 = mapInstance.latLngToContainerPoint(latlng);
        const dx = p2.x - p1.x;
        const dy = p2.y - p1.y;
        const dist = Math.sqrt(dx * dx + dy * dy);
        return dist < 3;
      } catch (e) { return false; }
    };

    const drawHolePreview = (withCursorLatLng = null) => {
      if (!previewLayerRef.current) return;
      previewLayerRef.current.clearLayers();
      const outer = drawPointsRef.current.map(([lng, lat]) => window.L.latLng(lat, lng));
      const existingHoles = (holesRef.current || []).map(r => r.map(([lng, lat]) => window.L.latLng(lat, lng)));
      const tempHole = holeTempRef.current.map(([lng, lat]) => window.L.latLng(lat, lng));
      const rings = withCursorLatLng ? [...tempHole, withCursorLatLng] : tempHole;
      if (outer.length >= 3 && rings.length >= 1) {
        const latlngs = [outer, ...existingHoles, rings];
        console.log('[MapProvider] preview hole latlngs sizes', { outer: outer.length, holes: existingHoles.length, temp: rings.length });
        const polyPreview = window.L.polygon(latlngs, { color: '#f57c00', weight: 2, dashArray: '6,4', fillColor: '#2196f3', fillOpacity: 0.25, opacity: 0.9 });
        previewLayerRef.current.addLayer(polyPreview);
      }
    };

    const finalizeHole = () => {
      console.log('[MapProvider] finalizeHole()', { vertices: holeTempRef.current.length });
      setIsDrawing(false);
      setIsDrawingHole(false);
      setHasGeometry(true);
      try {
        const container = mapInstance.getContainer();
        // Mantener modo dibujo: cursor crosshair y dragging desactivado para arrancar nuevo polígono si procede
        container.style.setProperty('cursor', 'crosshair', 'important');
        if (mapInstance.dragging && mapInstance.dragging.enabled()) { mapInstance.dragging.disable(); }
        if (mapInstance.doubleClickZoom && mapInstance.doubleClickZoom.enabled()) { mapInstance.doubleClickZoom.disable(); }
      } catch (e) {}
      if (previewLayerRef.current) previewLayerRef.current.clearLayers();
      if (holeTempRef.current.length >= 3) {
        holesRef.current.push([...holeTempRef.current]);
        setHoleCount(holesRef.current.length);
        holeTempRef.current = [];
        redrawFinalGeometry();
      } else {
        console.warn('[MapProvider] finalizeHole: agujero descartado por tener menos de 3 puntos');
      }
      // Reactivar interacción y reconstruir manejadores
      setVertexPaneInteractive(true);
      rebuildEditHandles('polygon');
      // Retirar listeners temporales de agujero
      if (mapInstance.__holeHandlers) {
        const { handleClick, handleMouseMove, handleDblClick } = mapInstance.__holeHandlers;
        try { mapInstance.off('click', handleClick); } catch (e) {}
        try { mapInstance.off('mousemove', handleMouseMove); } catch (e) {}
        try { mapInstance.off('dblclick', handleDblClick); } catch (e) {}
        delete mapInstance.__holeHandlers;
      }
      // Restaurar handlers generales de dibujo para que el siguiente clic inicie nuevo polígono si es multi
      if (mapInstance.__savedDrawHandlers) {
        const { handleClick, handleDblClick, handleMouseMove } = mapInstance.__savedDrawHandlers;
        mapInstance.__drawHandlers = mapInstance.__savedDrawHandlers;
        delete mapInstance.__savedDrawHandlers;
        try { mapInstance.on('click', handleClick); } catch (e) {}
        try { mapInstance.on('dblclick', handleDblClick); } catch (e) {}
        try { mapInstance.on('mousemove', handleMouseMove); } catch (e) {}
        console.log('[MapProvider] draw handlers restaurados tras agujero');
      }
    };

    const handleClick = (e) => {
      if (!isDrawingRef.current || !isDrawingHoleRef.current) return;
      const latlng = e.latlng;
      if (holeTempRef.current.length > 0 && isCloseToLastPointPx(latlng)) {
        console.log('[MapProvider] finish hole (close by proximity)');
        finalizeHole();
        return;
      }
      holeTempRef.current.push([latlng.lng, latlng.lat]);
      console.log('[MapProvider] hole click add point', { count: holeTempRef.current.length });
      drawHolePreview(null);
    };

    const handleMouseMove = (e) => {
      if (!isDrawingRef.current || !isDrawingHoleRef.current) return;
      const current = e.latlng;
      const currentLL = window.L.latLng(current.lat, current.lng);
      if (holeTempRef.current.length === 0) return;
      drawHolePreview(currentLL);
    };

    const handleDblClick = () => {
      if (!isDrawingRef.current || !isDrawingHoleRef.current) return;
      console.log('[MapProvider] finish hole (dblclick)');
      finalizeHole();
    };

    mapInstance.__holeHandlers = { handleClick, handleMouseMove, handleDblClick };
    mapInstance.on('click', handleClick);
    mapInstance.on('mousemove', handleMouseMove);
    mapInstance.on('dblclick', handleDblClick);
  };

  // Eliminar último agujero
  const removeLastHole = () => {
    if (drawModeRef.current !== 'polygon') return;
    if (!holesRef.current || holesRef.current.length === 0) return;
    holesRef.current.pop();
    setHoleCount(holesRef.current.length);
    redrawFinalGeometry();
    rebuildEditHandles('polygon');
    console.log('[MapProvider] removeLastHole -> holes:', holesRef.current.length);
  };

  // Cancelar dibujo y limpiar
  const cancelDrawing = () => {
    if (!mapInstance) return;
    console.log('[MapProvider] cancelDrawing()');
    if (mapInstance.__drawHandlers) {
      const { handleClick, handleDblClick, handleMouseMove } = mapInstance.__drawHandlers;
      try { mapInstance.off('click', handleClick); } catch (e) {}
      try { mapInstance.off('dblclick', handleDblClick); } catch (e) {}
      try { mapInstance.off('mousemove', handleMouseMove); } catch (e) {}
      delete mapInstance.__drawHandlers;
    }
    if (mapInstance.__holeHandlers) {
      const { handleClick, handleMouseMove, handleDblClick } = mapInstance.__holeHandlers;
      try { mapInstance.off('click', handleClick); } catch (e) {}
      try { mapInstance.off('mousemove', handleMouseMove); } catch (e) {}
      try { mapInstance.off('dblclick', handleDblClick); } catch (e) {}
      delete mapInstance.__holeHandlers;
    }
    try {
      const container = mapInstance.getContainer();
      container.style.removeProperty('cursor');
      if (mapInstance.dragging && !mapInstance.dragging.enabled()) { mapInstance.dragging.enable(); }
      if (mapInstance.doubleClickZoom && !mapInstance.doubleClickZoom.enabled()) { mapInstance.doubleClickZoom.enable(); }
    } catch (e) {}
    try { const pane = mapInstance.getPane('qgs-vertex-pane'); if (pane) pane.style.pointerEvents = 'auto'; } catch (e) {}

    setIsDrawing(false);
    setIsDrawingHole(false);
    setHasGeometry(false);
    setDrawMode(null);
    drawModeRef.current = null;
    drawPointsRef.current = [];
    holesRef.current = [];
    multiGeometriesRef.current = [];
    setHoleCount(0);
    holeTempRef.current = [];
    if (previewLayerRef.current && mapInstance) { try { previewLayerRef.current.clearLayers(); if (mapInstance.hasLayer(previewLayerRef.current)) mapInstance.removeLayer(previewLayerRef.current); } catch (e) {} }
    if (editHandlesLayerRef.current && mapInstance) { try { editHandlesLayerRef.current.clearLayers(); if (mapInstance.hasLayer(editHandlesLayerRef.current)) mapInstance.removeLayer(editHandlesLayerRef.current); } catch (e) {} }
    if (drawLayerRef.current && mapInstance) { try { drawLayerRef.current.clearLayers(); if (mapInstance.hasLayer(drawLayerRef.current)) mapInstance.removeLayer(drawLayerRef.current); } catch (e) {} }
    if (multiLayerRef.current && mapInstance) { try { multiLayerRef.current.clearLayers(); if (mapInstance.hasLayer(multiLayerRef.current)) mapInstance.removeLayer(multiLayerRef.current); } catch (e) {} }
    previewLayerRef.current = null;
    editHandlesLayerRef.current = null;
    drawLayerRef.current = null;
    multiLayerRef.current = null;
  };

  const value = {
    mapInstance,
    setMapInstance,
    mapInstanceRef,
    initialBoundsRef,
    layerName,
    featureId,
    config,
    t,
    notificationManager,
    qgsUrl,
    qgsProjectPath,
    refreshWMSLayer,
    setRefreshWMSLayer,
    startDrawing,
    startHoleDrawing,
    finishDrawing,
    cancelDrawing,
    removeLastHole,
    isDrawing,
    isDrawingHole,
    drawMode,
    holeCount,
    hasGeometry,
  };

  return (
    <MapContext.Provider value={value}>
      {children}
    </MapContext.Provider>
  );
};

export const useMap = () => {
  const context = useContext(MapContext);
  if (!context) {
    console.warn('useMap debe usarse dentro de un MapProvider');
    return {};
  }
  return context;
};

export default MapProvider;