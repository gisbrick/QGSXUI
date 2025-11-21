import React, { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';
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
  const pendingExternalGeometryRef = useRef(null);
  const pendingExternalModeRef = useRef(null);
  const [gpsLocation, setGpsLocation] = useState(null);
  const gpsLocationRef = useRef(null);
  const [gpsActive, setGpsActive] = useState(false);
  const gpsTrackRef = useRef({ active: false, type: null, points: [], paused: false });
  const [isGpsTrackRecording, setIsGpsTrackRecording] = useState(false);
  const [isGpsTrackPaused, setIsGpsTrackPaused] = useState(false);
  const [gpsTrackType, setGpsTrackType] = useState(null);
  const [gpsTrackPoints, setGpsTrackPoints] = useState(0);

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
  // Estado para saber si estamos editando una geometría existente (no creando una nueva)
  const [isEditingExistingGeometry, setIsEditingExistingGeometry] = useState(false);
  const isEditingExistingGeometryRef = useRef(false);
  const editingFeatureRef = useRef(null);
  const editingLayerConfigRef = useRef(null);
  const originalGeometryRef = useRef(null);
  const originalGeometryNormalizedRef = useRef(null);
  const [geometryHasChanges, setGeometryHasChanges] = useState(false);
  const geometryHasChangesRef = useRef(false);
  const editingMultiGeometriesRef = useRef(null);
  const editingActiveGeometryIndexRef = useRef(null);
  const [multiGeometryNavigation, setMultiGeometryNavigation] = useState({ total: 0, activeIndex: null });
  useEffect(() => { isEditingExistingGeometryRef.current = isEditingExistingGeometry; }, [isEditingExistingGeometry]);
  useEffect(() => { geometryHasChangesRef.current = geometryHasChanges; }, [geometryHasChanges]);
  useEffect(() => { isDrawingRef.current = isDrawing; }, [isDrawing]);
  useEffect(() => { drawModeRef.current = drawMode; }, [drawMode]);
  useEffect(() => { isDrawingHoleRef.current = isDrawingHole; }, [isDrawingHole]);
  useEffect(() => { hasGeometryRef.current = hasGeometry; }, [hasGeometry]);

  const roundCoordValue = (value) => {
    if (typeof value !== 'number') {
      return value;
    }
    const rounded = Number(value.toFixed(12));
    return Math.abs(rounded) < 1e-12 ? 0 : rounded;
  };

  const areCoordsEqual = (a, b) => {
    if (!Array.isArray(a) || !Array.isArray(b) || a.length !== b.length) {
      return false;
    }
    for (let i = 0; i < a.length; i += 1) {
      if (roundCoordValue(a[i]) !== roundCoordValue(b[i])) {
        return false;
      }
    }
    return true;
  };

  const normalizeLinearRing = (ring) => {
    if (!Array.isArray(ring) || ring.length === 0) {
      return [];
    }
    const normalized = ring.map((coord) => {
      if (!Array.isArray(coord)) return coord;
      return coord.map(roundCoordValue);
    });
    if (normalized.length >= 2) {
      const first = normalized[0];
      const last = normalized[normalized.length - 1];
      if (areCoordsEqual(first, last)) {
        normalized.pop();
      }
    }
    return normalized;
  };

  const normalizeCoordinates = (coords) => {
    if (!Array.isArray(coords)) {
      return coords;
    }
    if (coords.length === 0) {
      return [];
    }
    if (typeof coords[0] === 'number') {
      return coords.map(roundCoordValue);
    }
    return coords.map(normalizeCoordinates);
  };

  const normalizeGeometryForComparison = (geometry) => {
    if (!geometry || !geometry.type) {
      return null;
    }
    const type = geometry.type.toUpperCase();
    let normalizedCoords;
    if (type === 'POLYGON') {
      normalizedCoords = (geometry.coordinates || []).map(normalizeLinearRing);
    } else if (type === 'MULTIPOLYGON') {
      normalizedCoords = (geometry.coordinates || []).map((polygon) =>
        (polygon || []).map(normalizeLinearRing)
      );
    } else {
      normalizedCoords = normalizeCoordinates(geometry.coordinates || []);
    }
    return {
      type,
      coordinates: normalizedCoords
    };
  };

  const clonePointCoords = (point) => {
    if (!Array.isArray(point) || point.length < 2) {
      return null;
    }
    return [point[0], point[1]];
  };

  const resetEditingMultiStore = () => {
    editingMultiGeometriesRef.current = null;
    editingActiveGeometryIndexRef.current = null;
    setMultiGeometryNavigation({ total: 0, activeIndex: null });
  };

  const updateMultiNavigationState = () => {
    const total = Array.isArray(editingMultiGeometriesRef.current)
      ? editingMultiGeometriesRef.current.length
      : 0;
    const activeIndex = total > 0 ? (editingActiveGeometryIndexRef.current ?? 0) : null;
    setMultiGeometryNavigation({ total, activeIndex });
  };

  const serializeActiveGeometryForStore = () => {
    const mode = drawModeRef.current;
    if (!mode) return null;
    if (mode === 'point') {
      if (drawPointsRef.current.length >= 1) {
        return clonePointCoords(drawPointsRef.current[0]);
      }
      return null;
    }
    if (mode === 'line') {
      if (!drawPointsRef.current.length) {
        return null;
      }
      return drawPointsRef.current.map((pt) => clonePointCoords(pt)).filter(Boolean);
    }
    if (mode === 'polygon') {
      if (!drawPointsRef.current.length) {
        return null;
      }
      const rings = [];
      const outer = drawPointsRef.current.map((pt) => clonePointCoords(pt)).filter(Boolean);
      if (!outer.length) {
        return null;
      }
      rings.push(outer);
      if (Array.isArray(holesRef.current) && holesRef.current.length) {
        holesRef.current.forEach((ring) => {
          const normalizedRing = (ring || []).map((pt) => clonePointCoords(pt)).filter(Boolean);
          if (normalizedRing.length) {
            rings.push(normalizedRing);
          }
        });
      }
      return rings;
    }
    return null;
  };

  const commitActiveGeometryToEditingStore = () => {
    if (!Array.isArray(editingMultiGeometriesRef.current)) {
      return;
    }
    const index = editingActiveGeometryIndexRef.current;
    if (
      index === null ||
      index === undefined ||
      index < 0 ||
      index >= editingMultiGeometriesRef.current.length
    ) {
      return;
    }
    const serialized = serializeActiveGeometryForStore();
    if (serialized) {
      editingMultiGeometriesRef.current[index] = serialized;
    }
  };

  const normalizeGeometryPartsForMode = (mode, geometryType, coords) => {
    if (!coords) return [];
    const type = (geometryType || '').toUpperCase();
    if (mode === 'point') {
      if (type === 'POINT') {
        return coords.length >= 2 ? [[coords[0], coords[1]]] : [];
      }
      if (type === 'MULTIPOINT') {
        return (coords || []).map(([lng, lat]) => [lng, lat]);
      }
    } else if (mode === 'line') {
      if (type === 'LINESTRING') {
        return [coords.map(([lng, lat]) => [lng, lat])];
      }
      if (type === 'MULTILINESTRING') {
        return (coords || []).map((line) => line.map(([lng, lat]) => [lng, lat]));
      }
    } else if (mode === 'polygon') {
      if (type === 'POLYGON') {
        return [
          (coords || []).map((ring) => ring.map(([lng, lat]) => [lng, lat]))
        ];
      }
      if (type === 'MULTIPOLYGON') {
        return (coords || []).map((poly) =>
          (poly || []).map((ring) => ring.map(([lng, lat]) => [lng, lat]))
        );
      }
    }
    return [];
  };

  // Historial de navegación (centro/zoom)
  const viewHistoryRef = useRef([]);
  const viewIndexRef = useRef(-1);
  const [canGoBack, setCanGoBack] = useState(false);
  const [canGoForward, setCanGoForward] = useState(false);
  const isNavigatingRef = useRef(false);

  const qgisConfig = useContext(QgisConfigContext);
  const { config, t, notificationManager, qgsUrl, qgsProjectPath } = qgisConfig || {};

  // Inicializar filtros base cuando se carga el config por primera vez
  // Esto asegura que no se mantengan filtros de sesiones anteriores
  useEffect(() => {
    if (!config?.layers) {
      return;
    }

    // Inicializar los filtros base de todas las capas desde el config original
    // Solo si no se han inicializado antes (para evitar sobrescribir si ya hay filtros temporales)
    Object.keys(config.layers).forEach((layerName) => {
      if (!(layerName in layerBaseFiltersRef.current)) {
        const layer = config.layers[layerName];
        // Guardar el filtro original del config como filtro base
        layerBaseFiltersRef.current[layerName] = layer.filter || null;
        // Asegurarse de que el filtro de la capa sea el filtro base (limpiar filtros temporales)
        layer.filter = layerBaseFiltersRef.current[layerName];
      }
    });
  }, [config]); // Solo ejecutar cuando cambie el config

  const updateNavFlags = () => {
    const len = viewHistoryRef.current.length;
    const idx = viewIndexRef.current;
    setCanGoBack(idx > 0);
    setCanGoForward(idx >= 0 && idx < len - 1);
  };

  const pushViewToHistory = (center, zoom) => {
    const last = viewHistoryRef.current[viewIndexRef.current];
    const c = [center.lat, center.lng];
    if (last && last.zoom === zoom && Math.abs(last.center[0] - c[0]) < 1e-9 && Math.abs(last.center[1] - c[1]) < 1e-9) {
      return;
    }
    // si hemos navegado atrás y luego se mueve, truncar futuro
    if (viewIndexRef.current < viewHistoryRef.current.length - 1) {
      viewHistoryRef.current = viewHistoryRef.current.slice(0, viewIndexRef.current + 1);
    }
    viewHistoryRef.current.push({ center: c, zoom });
    viewIndexRef.current = viewHistoryRef.current.length - 1;
    updateNavFlags();
  };

  useEffect(() => {
    if (!mapInstance) return;
    const init = () => {
      try {
        const center = mapInstance.getCenter();
        const zoom = mapInstance.getZoom();
        if (viewHistoryRef.current.length === 0) {
          pushViewToHistory(center, zoom);
        }
      } catch (e) {}
    };
    init();
    const onMoveEnd = () => {
      if (isNavigatingRef.current) return; // no registrar durante navegación programática
      try { pushViewToHistory(mapInstance.getCenter(), mapInstance.getZoom()); } catch (e) {}
    };
    mapInstance.on('moveend', onMoveEnd);
    return () => { try { mapInstance.off('moveend', onMoveEnd); } catch (e) {} };
  }, [mapInstance]);

  const goBack = () => {
    if (!mapInstance) return;
    const idx = viewIndexRef.current;
    if (idx <= 0) return;
    isNavigatingRef.current = true;
    const target = viewHistoryRef.current[idx - 1];
    viewIndexRef.current = idx - 1;
    mapInstance.once('moveend', () => { isNavigatingRef.current = false; updateNavFlags(); });
    mapInstance.setView({ lat: target.center[0], lng: target.center[1] }, target.zoom, { animate: false });
    updateNavFlags();
  };

  const goForward = () => {
    if (!mapInstance) return;
    const idx = viewIndexRef.current;
    if (idx >= viewHistoryRef.current.length - 1) return;
    isNavigatingRef.current = true;
    const target = viewHistoryRef.current[idx + 1];
    viewIndexRef.current = idx + 1;
    mapInstance.once('moveend', () => { isNavigatingRef.current = false; updateNavFlags(); });
    mapInstance.setView({ lat: target.center[0], lng: target.center[1] }, target.zoom, { animate: false });
    updateNavFlags();
  };

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
      const overlayPane = mapInstance.getPane('overlayPane') || undefined;
      mapInstance.createPane(name, overlayPane);
      const paneEl = mapInstance.getPane(name);
      if (paneEl) {
        paneEl.style.zIndex = 700;
        paneEl.style.pointerEvents = 'auto';
      }
    } else {
      const paneEl = mapInstance.getPane(name);
      if (paneEl && !paneEl.style.pointerEvents) {
        paneEl.style.pointerEvents = 'auto';
      }
    }
    return vertexPaneNameRef.current;
  };

  const setVertexPaneInteractive = (enabled) => {
    try {
      const pane = getVertexPaneEl();
      if (pane) {
        pane.style.pointerEvents = enabled ? 'auto' : 'none';
      }
    } catch (e) {}
  };

  const clearEditHandles = () => {
    if (editHandlesLayerRef.current && mapInstance) {
      try {
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
    } catch (e) { console.warn('syncMultiLayer error', e); }
    if (isEditingExistingGeometryRef.current) {
      updateGeometryChangeFlag();
    }
  };

  const syncEditingStoreToLegacyMulti = (mode) => {
    if (!Array.isArray(editingMultiGeometriesRef.current)) {
      multiGeometriesRef.current = [];
      if (mode) {
        syncMultiLayer(mode);
      }
      return;
    }
    const activeIdx = editingActiveGeometryIndexRef.current ?? 0;
    const clones = [];
    editingMultiGeometriesRef.current.forEach((geometryEntry, idx) => {
      if (idx === activeIdx) {
        return;
      }
      if (mode === 'point') {
        const pt = clonePointCoords(geometryEntry);
        if (pt) {
          clones.push(pt);
        }
      } else if (mode === 'line') {
        const clonedLine = (geometryEntry || []).map((pt) => clonePointCoords(pt)).filter(Boolean);
        if (clonedLine.length) {
          clones.push(clonedLine);
        }
      } else if (mode === 'polygon') {
        const clonedPoly = (geometryEntry || []).map((ring) =>
          (ring || []).map((pt) => clonePointCoords(pt)).filter(Boolean)
        );
        if (clonedPoly.length) {
          clones.push(clonedPoly);
        }
      }
    });
    multiGeometriesRef.current = clones;
    if (mode) {
      syncMultiLayer(mode);
    }
  };

  const redrawFinalGeometry = () => {
    if (!drawLayerRef.current || !window.L) return;
    drawLayerRef.current.clearLayers();

    const mode = drawModeRef.current;
    try {
    } catch (e) {}

    // Solo dibujar la geometría activa en drawLayerRef; la multi se mantiene en multiLayerRef
    if (mode === 'point') {
      if (drawPointsRef.current.length >= 1) {
        const latlng = window.L.latLng(drawPointsRef.current[0][1], drawPointsRef.current[0][0]);
        const marker = window.L.circleMarker(latlng, { radius: 6, color: '#1976d2', weight: 2, fillColor: '#2196f3', fillOpacity: 0.7 });
        drawLayerRef.current.addLayer(marker);
      }
    } else if (mode === 'line') {
      const latlngs = drawPointsRef.current.map(([lng, lat]) => window.L.latLng(lat, lng));
      if (latlngs.length >= 2) {
        const line = window.L.polyline(latlngs, { color: '#1976d2', weight: 3, opacity: 1 });
        drawLayerRef.current.addLayer(line);
      }
    } else if (mode === 'polygon') {
      const outer = drawPointsRef.current.map(([lng, lat]) => window.L.latLng(lat, lng));
      const holes = (holesRef.current || []).map(ring => ring.map(([lng, lat]) => window.L.latLng(lat, lng)));
      if (outer.length >= 3) {
        const poly = window.L.polygon([outer, ...holes], { color: '#1976d2', weight: 2, fillColor: '#2196f3', fillOpacity: 0.3 });
        drawLayerRef.current.addLayer(poly);
      }
    }

    if (isEditingExistingGeometryRef.current) {
      updateGeometryChangeFlag();
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
    if (!mode) { return; }
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
      });
      handle.on('drag', (e) => {
        const p = e.latlng;
        drawPointsRef.current = [[p.lng, p.lat]];
        redrawFinalGeometry();
      });
      handle.on('dragend', (e) => {
        rebuildEditHandles(mode);
      });
      editHandlesLayerRef.current.addLayer(handle);
      countVertices += 1;
      return;
    }

    const buildRingHandles = (ringPoints, updateAtIndex, insertAtIndex, ringIsClosed, ringLabel) => {
      ringPoints.forEach(([lng, lat], index) => {
        const handle = window.L.marker([lat, lng], { draggable: true, icon: createDivIcon(), opacity: 1, riseOnHover: true, zIndexOffset: 10000, pane: vertexPane, autoPan: true });
        handle.on('dragstart', (e) => {
        });
        handle.on('drag', (e) => {
          const p = e.latlng;
          updateAtIndex(index, [p.lng, p.lat]);
          redrawFinalGeometry();
        });
        handle.on('dragend', (e) => {
          rebuildEditHandles(mode);
        });
        handle.on('click', (e) => {
          if (e.originalEvent && (e.originalEvent.altKey || e.originalEvent.metaKey)) {
            if (mode === 'line') {
              if (ringPoints.length <= 2) return;
            } else if (mode === 'polygon') {
              if (ringPoints.length <= 3) return;
            }
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
    };

    if (mode === 'line') {
      const updateAt = (i, pt) => { drawPointsRef.current[i] = pt; };
      const insertAt = (i, pt) => { drawPointsRef.current.splice(i, 0, pt); };
      buildRingHandles(drawPointsRef.current, updateAt, insertAt, false, 'LINE');
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
    }
  };

  const applyEditingGeometryAtIndex = (index) => {
    if (!Array.isArray(editingMultiGeometriesRef.current)) {
      return false;
    }
    const mode = drawModeRef.current;
    if (!mode) {
      return false;
    }
    const entry = editingMultiGeometriesRef.current[index];
    if (!entry) {
      return false;
    }

    if (mode === 'point') {
      const point = clonePointCoords(entry);
      if (!point) {
        return false;
      }
      drawPointsRef.current = [point];
      holesRef.current = [];
      setHoleCount(0);
    } else if (mode === 'line') {
      const points = (entry || []).map((pt) => clonePointCoords(pt)).filter(Boolean);
      drawPointsRef.current = points;
      holesRef.current = [];
      setHoleCount(0);
    } else if (mode === 'polygon') {
      const rings = (entry || []).map((ring) =>
        (ring || []).map((pt) => clonePointCoords(pt)).filter(Boolean)
      );
      const outer = rings[0] || [];
      const inner = rings.slice(1);
      drawPointsRef.current = outer;
      holesRef.current = inner;
      setHoleCount(inner.length);
    }

    editingActiveGeometryIndexRef.current = index;
    setHasGeometry(true);
    redrawFinalGeometry();
    rebuildEditHandles(mode);
    syncEditingStoreToLegacyMulti(mode);
    updateMultiNavigationState();
    return true;
  };

  const navigateEditingGeometry = (direction) => {
    if (
      !isEditingExistingGeometryRef.current ||
      !Array.isArray(editingMultiGeometriesRef.current) ||
      editingMultiGeometriesRef.current.length <= 1
    ) {
      return false;
    }
    const total = editingMultiGeometriesRef.current.length;
    commitActiveGeometryToEditingStore();
    let nextIndex = (editingActiveGeometryIndexRef.current ?? 0) + direction;
    if (nextIndex < 0) {
      nextIndex = total - 1;
    } else if (nextIndex >= total) {
      nextIndex = 0;
    }
    return applyEditingGeometryAtIndex(nextIndex);
  };

  const ensureDrawingLayers = () => {
    if (!mapInstance || !window.L) return;
    if (!multiLayerRef.current) {
      multiLayerRef.current = window.L.featureGroup([]).addTo(mapInstance);
    }
    if (!drawLayerRef.current) {
      drawLayerRef.current = window.L.featureGroup([]).addTo(mapInstance);
    }
    if (!previewLayerRef.current) {
      previewLayerRef.current = window.L.featureGroup([]).addTo(mapInstance);
    }
  };

  const setPendingExternalGeometry = (geometry, mode) => {
    pendingExternalGeometryRef.current = geometry || null;
    pendingExternalModeRef.current = mode || null;
  };

  const normalizeGeometryForMode = (geometry, mode) => {
    if (!geometry || !geometry.type) return null;
    const type = geometry.type.toLowerCase();
    const coords = geometry.coordinates;
    if (!coords) return null;

    const toLngLat = (coord) =>
      Array.isArray(coord) && coord.length >= 2 ? [parseFloat(coord[0]), parseFloat(coord[1])] : null;

    if (mode === 'point') {
      if (type === 'point') {
        const pt = toLngLat(coords);
        return pt ? { point: pt } : null;
      }
      if (type === 'multipoint' && Array.isArray(coords) && coords.length) {
        const pt = toLngLat(coords[0]);
        return pt ? { point: pt } : null;
      }
      if (type === 'linestring' && Array.isArray(coords) && coords.length) {
        const pt = toLngLat(coords[0]);
        return pt ? { point: pt } : null;
      }
      if (type === 'multilinestring' && Array.isArray(coords) && coords[0] && coords[0].length) {
        const pt = toLngLat(coords[0][0]);
        return pt ? { point: pt } : null;
      }
      if (type === 'polygon' && Array.isArray(coords) && coords[0] && coords[0].length) {
        const pt = toLngLat(coords[0][0]);
        return pt ? { point: pt } : null;
      }
      if (type === 'multipolygon' && Array.isArray(coords) && coords[0] && coords[0][0] && coords[0][0].length) {
        const pt = toLngLat(coords[0][0][0]);
        return pt ? { point: pt } : null;
      }
      return null;
    }

    if (mode === 'line') {
      let lineCoords = [];
      if (type === 'linestring' && Array.isArray(coords)) {
        lineCoords = coords.map(toLngLat).filter(Boolean);
      } else if (type === 'multilinestring' && Array.isArray(coords)) {
        coords.forEach((segment) => {
          if (Array.isArray(segment)) {
            segment.forEach((pt) => {
              const val = toLngLat(pt);
              if (val) lineCoords.push(val);
            });
          }
        });
      } else if (type === 'polygon' && Array.isArray(coords) && coords[0]) {
        lineCoords = coords[0].map(toLngLat).filter(Boolean);
      } else if (type === 'multipolygon' && Array.isArray(coords) && coords[0] && coords[0][0]) {
        lineCoords = coords[0][0].map(toLngLat).filter(Boolean);
      }
      return lineCoords.length >= 2 ? { line: lineCoords } : null;
    }

    if (mode === 'polygon') {
      let polygonRings = [];
      if (type === 'polygon' && Array.isArray(coords)) {
        polygonRings = coords;
      } else if (type === 'multipolygon' && Array.isArray(coords) && coords[0]) {
        polygonRings = coords[0];
      } else if (type === 'linestring' && Array.isArray(coords)) {
        polygonRings = [coords];
      }
      if (!polygonRings.length || !Array.isArray(polygonRings[0])) return null;
      const outer = polygonRings[0].map(toLngLat).filter(Boolean);
      if (outer.length < 3) return null;
      const holes = polygonRings.slice(1).map((ring) => ring.map(toLngLat).filter(Boolean));
      return { outer, holes };
    }

    return null;
  };

  const applyExternalGeometry = (geometry) => {
    if (!mapInstance || !window.L) return false;
    const mode = drawModeRef.current;
    if (!mode) return false;
    const normalized = normalizeGeometryForMode(geometry, mode);
    if (!normalized) return false;

    ensureDrawingLayers();
    setIsDrawing(false);
    isDrawingRef.current = false;
    setIsDrawingHole(false);
    isDrawingHoleRef.current = false;
    setHasGeometry(true);
    hasGeometryRef.current = true;
    holeTempRef.current = [];

    if (previewLayerRef.current) previewLayerRef.current.clearLayers();
    drawPointsRef.current = [];
    holesRef.current = [];
    setHoleCount(normalized.holes ? normalized.holes.length : 0);

    if (mode === 'point') {
      drawPointsRef.current = [normalized.point];
    } else if (mode === 'line') {
      drawPointsRef.current = normalized.line || [];
    } else if (mode === 'polygon') {
      drawPointsRef.current = normalized.outer || [];
      holesRef.current = normalized.holes || [];
    }

    redrawFinalGeometry();
    rebuildEditHandles(mode);
    return true;
  };

  const updateGpsLocation = (location) => {
    setGpsLocation(location);
    gpsLocationRef.current = location;
    if (gpsTrackRef.current.active && !gpsTrackRef.current.paused) {
      const point = [location.lng, location.lat];
      const points = gpsTrackRef.current.points;
      const last = points[points.length - 1];
      if (!last || Math.abs(last[0] - point[0]) > 1e-9 || Math.abs(last[1] - point[1]) > 1e-9) {
        points.push(point);
        setGpsTrackPoints(points.length);
        
        // Si hay un modo de dibujo activo, añadir el punto directamente al dibujo
        const mode = drawModeRef.current;
        if (mode === 'line' || mode === 'polygon') {
          ensureDrawingLayers();
          if (!isDrawingRef.current) {
            setIsDrawing(true);
            isDrawingRef.current = true;
          }
          drawPointsRef.current.push([...point]);
          redrawFinalGeometry();
        }
      }
    }
  };

  const setGpsActiveStatus = (status) => {
    setGpsActive(status);
    if (!status && gpsTrackRef.current.active) {
      gpsTrackRef.current = { active: false, type: null, points: [], paused: false };
      setIsGpsTrackRecording(false);
      setIsGpsTrackPaused(false);
      setGpsTrackType(null);
      setGpsTrackPoints(0);
    }
  };

  const startGpsTrackRecording = (type) => {
    if (!gpsActive) return false;
    const mode = drawModeRef.current;
    if (mode !== 'line' && mode !== 'polygon') return false;
    const normalized = mode === 'polygon' ? 'polygon' : 'line';
    gpsTrackRef.current = { active: true, type: normalized, points: [], paused: false };
    setIsGpsTrackRecording(true);
    setIsGpsTrackPaused(false);
    setGpsTrackType(normalized);
    setGpsTrackPoints(0);
    
    // Asegurar que las capas de dibujo estén inicializadas
    ensureDrawingLayers();
    if (!isDrawingRef.current) {
      setIsDrawing(true);
      isDrawingRef.current = true;
    }
    
    // Limpiar puntos anteriores si los hay
    drawPointsRef.current = [];
    
    // Añadir el primer punto si hay ubicación GPS disponible
    if (gpsLocationRef.current) {
      const firstPoint = [gpsLocationRef.current.lng, gpsLocationRef.current.lat];
      gpsTrackRef.current.points.push([...firstPoint]);
      setGpsTrackPoints(1);
      drawPointsRef.current.push([...firstPoint]);
      redrawFinalGeometry();
    }
    return true;
  };

  const pauseGpsTrackRecording = () => {
    if (!gpsTrackRef.current.active || gpsTrackRef.current.paused) return false;
    gpsTrackRef.current.paused = true;
    setIsGpsTrackPaused(true);
    return true;
  };

  const resumeGpsTrackRecording = () => {
    if (!gpsTrackRef.current.active || !gpsTrackRef.current.paused) return false;
    gpsTrackRef.current.paused = false;
    setIsGpsTrackPaused(false);
    return true;
  };

  const stopGpsTrackRecording = () => {
    if (!gpsTrackRef.current.active) return null;
    const { type, points } = gpsTrackRef.current;
    gpsTrackRef.current = { active: false, type: null, points: [], paused: false };
    setIsGpsTrackRecording(false);
    setIsGpsTrackPaused(false);
    setGpsTrackType(null);
    setGpsTrackPoints(0);

    // Validar que tenemos suficientes puntos
    if (type === 'line' && points.length < 2) {
      console.warn('[MapProvider] stopGpsTrackRecording: línea necesita al menos 2 puntos');
      drawPointsRef.current = [];
      setIsDrawing(false);
      isDrawingRef.current = false;
      if (previewLayerRef.current) previewLayerRef.current.clearLayers();
      return null;
    }
    if (type === 'polygon' && points.length < 3) {
      console.warn('[MapProvider] stopGpsTrackRecording: polígono necesita al menos 3 puntos');
      drawPointsRef.current = [];
      setIsDrawing(false);
      isDrawingRef.current = false;
      if (previewLayerRef.current) previewLayerRef.current.clearLayers();
      return null;
    }

    // Los puntos ya están en drawPointsRef.current, así que finalizamos el dibujo
    const mode = drawModeRef.current;
    if (mode === type) {
      setIsDrawing(false);
      isDrawingRef.current = false;
      setHasGeometry(true);
      hasGeometryRef.current = true;
      if (previewLayerRef.current) previewLayerRef.current.clearLayers();
      
      // Para polígonos, asegurar que el último punto cierra el anillo
      if (type === 'polygon' && drawPointsRef.current.length >= 3) {
        const first = drawPointsRef.current[0];
        const last = drawPointsRef.current[drawPointsRef.current.length - 1];
        if (first && last && (Math.abs(first[0] - last[0]) > 1e-9 || Math.abs(first[1] - last[1]) > 1e-9)) {
          // Ya está cerrado o se cerrará en el render
        }
      }
      
      redrawFinalGeometry();
      rebuildEditHandles(mode);
      
      // Construir geometría para retornar
      let geometry = null;
      if (type === 'line' && drawPointsRef.current.length >= 2) {
        geometry = { type: 'LineString', coordinates: [...drawPointsRef.current] };
      } else if (type === 'polygon' && drawPointsRef.current.length >= 3) {
        const ring = [...drawPointsRef.current];
        const first = ring[0];
        const last = ring[ring.length - 1];
        if (first && last && (Math.abs(first[0] - last[0]) > 1e-9 || Math.abs(first[1] - last[1]) > 1e-9)) {
          ring.push([...first]);
        }
        geometry = { type: 'Polygon', coordinates: [ring] };
      }
      return geometry;
    }

    return null;
  };

  // Iniciar dibujo
  const startDrawing = (mode) => {
    if (!mapInstance || !window.L) return;
    cancelDrawing();

    const pendingGeometry = pendingExternalGeometryRef.current;
    const pendingMode = pendingExternalModeRef.current;
    if (pendingGeometry && (!pendingMode || pendingMode === mode)) {
      pendingExternalGeometryRef.current = null;
      pendingExternalModeRef.current = null;
      setDrawMode(mode);
      drawModeRef.current = mode;
      const appliedPending = applyExternalGeometry(pendingGeometry);
      if (appliedPending) {
        return;
      }
    }
    setDrawMode(mode);
    drawModeRef.current = mode;
    setIsDrawing(true);
    setHasGeometry(false);
    hasGeometryRef.current = false;
    canDrawMultipleRef.current = checkCanDrawMultipleForMode(mode);
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
      container.classList.add('leaflet-drawing');
      container.style.setProperty('cursor', 'crosshair', 'important');
      // Permitir dragging del mapa durante el dibujo para poder navegar mientras se dibuja
      // if (mapInstance.dragging && mapInstance.dragging.enabled()) { mapInstance.dragging.disable(); }
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
          setIsDrawing(false);
          setHasGeometry(true);
          if (previewLayerRef.current) previewLayerRef.current.clearLayers();
          rebuildEditHandles('point');
          return true;
        }
      } else if (modeLocal === 'line' && drawPointsRef.current.length >= 2) {
        if (canDrawMultipleRef.current) {
          setIsDrawing(false);
          setHasGeometry(true);
          if (previewLayerRef.current) previewLayerRef.current.clearLayers();
          rebuildEditHandles('line');
          return true;
        }
      } else if (modeLocal === 'polygon' && drawPointsRef.current.length >= 3) {
        if (canDrawMultipleRef.current) {
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
      // Si estamos editando una geometría existente y la capa NO es multi, no permitir añadir más geometrías
      if (isEditingExistingGeometryRef.current && !canDrawMultipleRef.current) {
        return;
      }
      
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
        redrawFinalGeometry();
        return;
      }

      if (!isDrawingRef.current) return;
      if (isDrawingHoleRef.current) { return; }
      const latlng = e.latlng;
      if (mode === 'point') {
      } else {
      }
      if ((mode === 'line' || mode === 'polygon') && drawPointsRef.current.length > 0) {
        if (isCloseToLastPointPx(latlng)) {
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
  const buildCurrentGeometrySnapshot = () => {
    const mode = drawModeRef.current;
    if (!mode) {
      return null;
    }

    const hasEditingStore =
      isEditingExistingGeometryRef.current &&
      Array.isArray(editingMultiGeometriesRef.current) &&
      editingMultiGeometriesRef.current.length > 0;

    if (hasEditingStore) {
      commitActiveGeometryToEditingStore();
      if (mode === 'point') {
        const coords = editingMultiGeometriesRef.current
          .map((pt) => clonePointCoords(pt))
          .filter(Boolean);
        if (coords.length === 0) {
          return null;
        }
        if (coords.length === 1) {
          return { type: 'Point', coordinates: coords[0] };
        }
        return { type: 'MultiPoint', coordinates: coords };
      }

      if (mode === 'line') {
        const lines = editingMultiGeometriesRef.current
          .map((line) => (line || []).map((pt) => clonePointCoords(pt)).filter(Boolean))
          .filter((line) => line.length >= 2);
        if (lines.length === 0) {
          return null;
        }
        if (lines.length === 1) {
          return { type: 'LineString', coordinates: lines[0] };
        }
        return { type: 'MultiLineString', coordinates: lines };
      }

      if (mode === 'polygon') {
        const polys = editingMultiGeometriesRef.current
          .map((poly) =>
            (poly || []).map((ring) => {
              const normalizedRing = (ring || []).map((pt) => clonePointCoords(pt)).filter(Boolean);
              if (
                normalizedRing.length >= 2 &&
                !areCoordsEqual(normalizedRing[0], normalizedRing[normalizedRing.length - 1])
              ) {
                normalizedRing.push([...normalizedRing[0]]);
              }
              return normalizedRing;
            })
          )
          .filter((poly) => poly[0] && poly[0].length >= 4);

        if (polys.length === 0) {
          return null;
        }
        if (polys.length === 1) {
          return { type: 'Polygon', coordinates: polys[0] };
        }
        return { type: 'MultiPolygon', coordinates: polys };
      }
    }

    // Construir colecciones incluyendo la geometría activa si existe
    if (mode === 'point') {
      if ((multiGeometriesRef.current?.length || 0) > 0) {
        const coords = [...multiGeometriesRef.current];
        if (drawPointsRef.current.length >= 1) {
          coords.push(drawPointsRef.current[0]);
        }
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

  const finishDrawing = () => buildCurrentGeometrySnapshot();

  const updateGeometryChangeFlag = () => {
    if (!isEditingExistingGeometryRef.current) {
      return;
    }
    if (!originalGeometryNormalizedRef.current) {
      if (geometryHasChangesRef.current) {
        setGeometryHasChanges(false);
      }
      return;
    }
    const currentGeometry = buildCurrentGeometrySnapshot();
    if (!currentGeometry) {
      if (geometryHasChangesRef.current) {
        setGeometryHasChanges(false);
      }
      return;
    }
    const normalizedCurrent = normalizeGeometryForComparison(currentGeometry);
    const hasChanges = JSON.stringify(normalizedCurrent) !== JSON.stringify(originalGeometryNormalizedRef.current);
    if (hasChanges !== geometryHasChangesRef.current) {
      setGeometryHasChanges(hasChanges);
    }
  };

  const goToNextMultiGeometry = () => {
    const moved = navigateEditingGeometry(1);
    if (moved) {
      updateGeometryChangeFlag();
    }
    return moved;
  };

  const goToPreviousMultiGeometry = () => {
    const moved = navigateEditingGeometry(-1);
    if (moved) {
      updateGeometryChangeFlag();
    }
    return moved;
  };

  // Iniciar dibujo de agujero dentro de un polígono ya finalizado
  const startHoleDrawing = () => {
    if (!mapInstance || !window.L) return;
    const mode = drawModeRef.current;
    if (mode !== 'polygon') return;

    // Desregistrar handlers generales de dibujo para no interferir, guardándolos para restaurar después
    if (mapInstance.__drawHandlers) {
      mapInstance.__savedDrawHandlers = mapInstance.__drawHandlers;
      const { handleClick, handleDblClick, handleMouseMove } = mapInstance.__drawHandlers;
      try { mapInstance.off('click', handleClick); } catch (e) {}
      try { mapInstance.off('dblclick', handleDblClick); } catch (e) {}
      try { mapInstance.off('mousemove', handleMouseMove); } catch (e) {}
      delete mapInstance.__drawHandlers;
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
      container.classList.add('leaflet-drawing');
      container.style.setProperty('cursor', 'crosshair', 'important');
      // Permitir dragging del mapa durante el dibujo para poder navegar mientras se dibuja
      // if (mapInstance.dragging && mapInstance.dragging.enabled()) { mapInstance.dragging.disable(); }
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
        const polyPreview = window.L.polygon(latlngs, { color: '#f57c00', weight: 2, dashArray: '6,4', fillColor: '#2196f3', fillOpacity: 0.25, opacity: 0.9 });
        previewLayerRef.current.addLayer(polyPreview);
      }
    };

    const finalizeHole = () => {
      setIsDrawing(false);
      setIsDrawingHole(false);
      setHasGeometry(true);
      try {
        const container = mapInstance.getContainer();
        // Mantener modo dibujo: cursor crosshair (permitir dragging para poder navegar mientras se dibuja)
        container.style.setProperty('cursor', 'crosshair', 'important');
        // Permitir dragging del mapa durante el dibujo para poder navegar mientras se dibuja
        // if (mapInstance.dragging && mapInstance.dragging.enabled()) { mapInstance.dragging.disable(); }
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
      }
    };

    const handleClick = (e) => {
      if (!isDrawingRef.current || !isDrawingHoleRef.current) return;
      const latlng = e.latlng;
      if (holeTempRef.current.length > 0 && isCloseToLastPointPx(latlng)) {
        finalizeHole();
        return;
      }
      holeTempRef.current.push([latlng.lng, latlng.lat]);
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
  };

  // Cancelar dibujo y limpiar
  const cancelDrawing = () => {
    if (!mapInstance) return;
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
      container.classList.remove('leaflet-drawing');
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
    resetEditingMultiStore();
    setHoleCount(0);
    holeTempRef.current = [];
    // Limpiar estado de edición de geometría existente
    setIsEditingExistingGeometry(false);
    editingFeatureRef.current = null;
    editingLayerConfigRef.current = null;
    originalGeometryRef.current = null;
    originalGeometryNormalizedRef.current = null;
    if (geometryHasChangesRef.current) {
      setGeometryHasChanges(false);
    }
    if (previewLayerRef.current && mapInstance) { try { previewLayerRef.current.clearLayers(); if (mapInstance.hasLayer(previewLayerRef.current)) mapInstance.removeLayer(previewLayerRef.current); } catch (e) {} }
    if (editHandlesLayerRef.current && mapInstance) { try { editHandlesLayerRef.current.clearLayers(); if (mapInstance.hasLayer(editHandlesLayerRef.current)) mapInstance.removeLayer(editHandlesLayerRef.current); } catch (e) {} }
    if (drawLayerRef.current && mapInstance) { try { drawLayerRef.current.clearLayers(); if (mapInstance.hasLayer(drawLayerRef.current)) mapInstance.removeLayer(drawLayerRef.current); } catch (e) {} }
    if (multiLayerRef.current && mapInstance) { try { multiLayerRef.current.clearLayers(); if (mapInstance.hasLayer(multiLayerRef.current)) mapInstance.removeLayer(multiLayerRef.current); } catch (e) {} }
    previewLayerRef.current = null;
    editHandlesLayerRef.current = null;
    drawLayerRef.current = null;
    multiLayerRef.current = null;
  };

  // Función helper para obtener información de geometría de la capa (similar a la de qgisWFSFetcher)
  const getLayerGeometryInfo = (layerConfig) => {
    const rawType = (layerConfig?.wkbType_name ||
      layerConfig?.geometryType ||
      layerConfig?.geometryTypeName ||
      layerConfig?.type ||
      '').toString().toUpperCase();

    if (!rawType) {
      return { baseType: null, isMulti: false };
    }

    let typeToUse = rawType;
    if (rawType === 'LINEGEOMETRY' || rawType === 'GEOMETRY') {
      const layerName = (layerConfig?.name || '').toLowerCase();
      const wkbType = layerConfig?.wkbType;
      if (wkbType === 1 || layerName.includes('punto') || layerName.includes('point')) {
        typeToUse = 'POINT';
      } else if (wkbType === 2 || layerName.includes('linea') || layerName.includes('line')) {
        typeToUse = 'LINESTRING';
      } else if (wkbType === 3 || layerName.includes('poligono') || layerName.includes('polygon')) {
        typeToUse = 'POLYGON';
      }
    }

    const isPoint = typeToUse.includes('POINT');
    const isLine = typeToUse.includes('LINE');
    const isPolygon = typeToUse.includes('POLYGON');
    const baseType = isPoint ? 'POINT' : (isPolygon ? 'POLYGON' : (isLine ? 'LINESTRING' : null));
    const isMulti = typeToUse.includes('MULTI');
    return { baseType, isMulti };
  };

  // Iniciar edición de geometría existente
  const startEditingGeometry = (feature, layerConfig) => {
    if (!mapInstance || !window.L || !feature || !layerConfig) {
      console.warn('[MapProvider] startEditingGeometry: parámetros inválidos');
      return;
    }


    // Cancelar cualquier dibujo previo antes de preparar la nueva edición
    cancelDrawing();

    // Guardar referencia a la feature y capa que estamos editando
    editingFeatureRef.current = feature;
    editingLayerConfigRef.current = layerConfig;
    setIsEditingExistingGeometry(true);

    // Obtener la geometría de la feature
    const geometry = feature.geometry;
    if (!geometry || !geometry.type) {
      console.error('[MapProvider] startEditingGeometry: la feature no tiene geometría válida');
      return;
    }

    // Guardar la geometría original para comparar cambios
    originalGeometryRef.current = JSON.parse(JSON.stringify(geometry));
    originalGeometryNormalizedRef.current = normalizeGeometryForComparison(originalGeometryRef.current);
    setGeometryHasChanges(false);

    // Determinar el modo de dibujo según el tipo de geometría
    const geometryType = geometry.type.toUpperCase();
    let mode = null;
    if (geometryType.includes('POINT')) {
      mode = 'point';
    } else if (geometryType.includes('LINE')) {
      mode = 'line';
    } else if (geometryType.includes('POLYGON')) {
      mode = 'polygon';
    }

    if (!mode) {
      console.error('[MapProvider] startEditingGeometry: tipo de geometría no soportado', geometryType);
      return;
    }

    // Verificar si la capa admite múltiples geometrías
    const geometryInfo = getLayerGeometryInfo(layerConfig);
    canDrawMultipleRef.current = geometryInfo.isMulti;

    // Iniciar el modo de dibujo
    setDrawMode(mode);
    drawModeRef.current = mode;
    setIsDrawing(false); // No estamos dibujando, estamos editando
    setHasGeometry(true); // Ya tenemos geometría

    // Inicializar capas
    multiLayerRef.current = window.L.featureGroup([]).addTo(mapInstance);
    drawLayerRef.current = window.L.featureGroup([]).addTo(mapInstance);
    previewLayerRef.current = window.L.featureGroup([]).addTo(mapInstance);

    const coords = geometry.coordinates;
    const normalizedParts = normalizeGeometryPartsForMode(mode, geometryType, coords);
    if (normalizedParts.length === 0) {
      drawPointsRef.current = [];
      holesRef.current = [];
      multiGeometriesRef.current = [];
      setHoleCount(0);
      setHasGeometry(false);
    } else {
      editingMultiGeometriesRef.current = normalizedParts;
      applyEditingGeometryAtIndex(0);
    }

    // Configurar el cursor y el contenedor
    try {
      const container = mapInstance.getContainer();
      container.classList.add('leaflet-drawing');
      container.style.setProperty('cursor', 'crosshair', 'important');
      if (mapInstance.doubleClickZoom && mapInstance.doubleClickZoom.enabled()) {
        mapInstance.doubleClickZoom.disable();
      }
    } catch (e) {
      console.warn('[MapProvider] startEditingGeometry: error configurando cursor', e);
    }

    updateGeometryChangeFlag();
  };

  // Función para actualizar el filtro de una capa y refrescar el mapa
  // Usa una ref para almacenar el filtro base original de cada capa
  const layerBaseFiltersRef = useRef({});
  
  // Función para restaurar todos los filtros base de las capas
  const restoreAllLayerFilters = useCallback(() => {
    if (!config?.layers) {
      return;
    }
    
    // Restaurar el filtro base de todas las capas que tengan un filtro base guardado
    Object.keys(layerBaseFiltersRef.current).forEach((layerName) => {
      const layer = config.layers[layerName];
      if (layer) {
        layer.filter = layerBaseFiltersRef.current[layerName];
      }
    });
    
    // También restaurar filtros de capas que no estén en layerBaseFiltersRef pero que puedan tener filtros temporales
    // Esto asegura que todas las capas vuelvan a su estado original
    Object.keys(config.layers).forEach((layerName) => {
      const layer = config.layers[layerName];
      if (layer && !(layerName in layerBaseFiltersRef.current)) {
        // Si no está en layerBaseFiltersRef, significa que nunca se modificó desde el inicio
        // Pero por si acaso, restaurar desde el filtro base guardado inicialmente
        // (esto se hace en el useEffect de inicialización)
      }
    });
    
    // Limpiar la referencia de filtros base
    layerBaseFiltersRef.current = {};
    
    // Refrescar la capa WMS para aplicar los cambios
    if (refreshWMSLayer) {
      refreshWMSLayer();
    }
  }, [config, refreshWMSLayer]);
  
  const updateLayerFilter = useCallback((layerName, filterQuery) => {
    if (!config?.layers || !layerName) {
      return;
    }

    const layer = config.layers[layerName];
    if (!layer) {
      return;
    }

    // Guardar el filtro base original la primera vez que se accede a la capa
    // Solo si no se ha guardado antes (para evitar sobrescribir si ya hay un filtro temporal)
    if (!(layerName in layerBaseFiltersRef.current)) {
      // Si el filtro actual contiene " AND (" al final, es probable que sea un filtro temporal
      // En ese caso, intentar extraer el filtro base
      const currentFilter = layer.filter || null;
      if (currentFilter && currentFilter.includes(' AND (')) {
        // Extraer el filtro base (todo antes del último " AND (")
        const lastAndIndex = currentFilter.lastIndexOf(' AND (');
        if (lastAndIndex > 0) {
          layerBaseFiltersRef.current[layerName] = currentFilter.substring(0, lastAndIndex).trim() || null;
        } else {
          layerBaseFiltersRef.current[layerName] = null;
        }
      } else {
        // Si no parece un filtro temporal, guardar como está
        layerBaseFiltersRef.current[layerName] = currentFilter;
      }
    }

    const baseFilter = layerBaseFiltersRef.current[layerName];

    // Construir el nuevo filtro combinando el filtro base con el filtro de la tabla
    if (filterQuery && filterQuery.trim()) {
      if (baseFilter && baseFilter.trim()) {
        // Si hay filtro base, combinarlo con el filtro de la tabla
        layer.filter = `${baseFilter} AND (${filterQuery})`;
      } else {
        // Si no hay filtro base, usar solo el filtro de la tabla
        layer.filter = filterQuery;
      }
    } else {
      // Si no hay filtro de tabla, restaurar solo el filtro base
      layer.filter = baseFilter;
    }

    // Refrescar la capa WMS para aplicar el nuevo filtro
    if (refreshWMSLayer) {
      refreshWMSLayer();
    }
  }, [config, refreshWMSLayer]);

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
    updateLayerFilter,
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
    // navegación
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    applyExternalGeometry,
    setPendingExternalGeometry,
    gpsLocation,
    gpsActive,
    updateGpsLocation,
    setGpsActiveStatus,
    startGpsTrackRecording,
    pauseGpsTrackRecording,
    resumeGpsTrackRecording,
    stopGpsTrackRecording,
    isGpsTrackRecording,
    isGpsTrackPaused,
    gpsTrackType,
    gpsTrackPoints,
    // Edición de geometría existente
    startEditingGeometry,
    isEditingExistingGeometry,
    getEditingFeature: () => editingFeatureRef.current,
    getEditingLayerConfig: () => editingLayerConfigRef.current,
    geometryHasChanges,
    multiGeometryNavigation,
    goToNextMultiGeometry,
    goToPreviousMultiGeometry,
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