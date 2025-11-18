import React, { useState, useMemo, useContext, useRef, useEffect, useCallback } from 'react';
import { createPortal } from 'react-dom';
import { useMap } from './MapProvider';
import { ToolbarQGS, FeatureAttributesDialog } from '../../UI_QGS';
import { Button } from '../../UI';
import Modal from '../../UI/Modal/Modal';
import { ZoomInBox, ZoomOut, ZoomToExtent, MeasureLine, MeasureArea, ShowLocation, InfoClick, BookmarksManager } from './MapTools';
import { QgisConfigContext } from '../QgisConfigContext';
import { ActionHandlersProvider } from '../../../contexts/ActionHandlersContext';
import { insertFeatureWithGeometry, fetchFeatureById } from '../../../services/qgisWFSFetcher';

/**
 * Componente de toolbar para el mapa
 * Proporciona herramientas de zoom, medición y edición
 */
const MapToolbar = () => {
  const mapContext = useMap() || {};
  const {
    mapInstance,
    initialBoundsRef,
    t,
    config,
    notificationManager,
    qgsUrl,
    qgsProjectPath,
    refreshWMSLayer,
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
    canGoBack,
    canGoForward,
    goBack,
    goForward,
    gpsLocation,
    gpsActive,
    setPendingExternalGeometry,
    startGpsTrackRecording,
    pauseGpsTrackRecording,
    resumeGpsTrackRecording,
    stopGpsTrackRecording,
    isGpsTrackRecording,
    isGpsTrackPaused,
    gpsTrackType,
    gpsTrackPoints
  } = mapContext;
  const qgisConfig = useContext(QgisConfigContext);
  const token = qgisConfig?.token || null;
  const uiLanguage = qgisConfig?.language || 'es';
  const translate = typeof t === 'function' ? t : (key) => key;
  const tr = useCallback(
    (key, es, en) => {
      const value = translate(key);
      if (value && value !== key) {
        return value;
      }
      const lang = (qgisConfig?.language || 'es').toLowerCase();
      return lang.startsWith('en') ? (en || es || key) : (es || en || key);
    },
    [translate, qgisConfig?.language]
  );
  const [boxZoomActive, setBoxZoomActive] = useState(false);
  const [zoomOutActive, setZoomOutActive] = useState(false);
  const [measureLineActive, setMeasureLineActive] = useState(false);
  const [measureAreaActive, setMeasureAreaActive] = useState(false);
  const [showLocationActive, setShowLocationActive] = useState(false);
  const [infoClickActive, setInfoClickActive] = useState(false);
  const [showEditHelp, setShowEditHelp] = useState(false);
  const [showBookmarks, setShowBookmarks] = useState(false);
  const [layerSelectionState, setLayerSelectionState] = useState(null);
  const [attributeDialogState, setAttributeDialogState] = useState(null);
  const pendingCancelRef = useRef(null);

  const notify = useCallback(
    (level, title, text) => {
      if (notificationManager?.addNotification) {
        notificationManager.addNotification({ title, text, level });
        return;
      }
      if (level === 'error') {
        console.error(title, text);
      } else {
        console.log(title, text);
      }
    },
    [notificationManager]
  );

  const { insertableLayersByMode, hasQueryableLayers } = useMemo(() => {
    const insertable = {
      point: [],
      line: [],
      polygon: []
    };
    let queryable = false;

    if (!config?.layers) {
      return { insertableLayersByMode: insertable, hasQueryableLayers: false };
    }

    Object.entries(config.layers).forEach(([layerName, layer]) => {
      const caps = layer.WFSCapabilities || {};
      if (caps.allowQuery) {
        queryable = true;
      }
      if (!caps.allowInsert) {
        return;
      }

      const typeReference = (layer.wkbType_name ||
        layer.geometryType ||
        layer.geometryTypeName ||
        layer.type ||
        '').toString().toUpperCase();

      const allowsMulti = Boolean(layer?.wkbType_name?.toLowerCase().includes('multi'));

      const label = layer.title || layer.displayName || layer.name || layerName;
      const entry = {
        name: layerName,
        label,
        layer,
        allowsMulti
      };

      const normalizedName = (layer.name || layerName || '').toString().toLowerCase();

      if (typeReference.includes('POINT') || normalizedName.includes('punto') || normalizedName.includes('point')) {
        insertable.point.push(entry);
      }
      if (
        typeReference.includes('LINE') ||
        typeReference.includes('CURVE') ||
        normalizedName.includes('linea') ||
        normalizedName.includes('line')
      ) {
        insertable.line.push(entry);
      }
      if (
        typeReference.includes('POLYGON') ||
        typeReference.includes('SURFACE') ||
        normalizedName.includes('poligono') ||
        normalizedName.includes('polygon')
      ) {
        insertable.polygon.push(entry);
      }
    });

    return {
      insertableLayersByMode: insertable,
      hasQueryableLayers: queryable
    };
  }, [config]);

  const getLayersForMode = useCallback(
    (mode, requireMulti = false) => {
      let candidates = [];
      if (mode === 'point') candidates = insertableLayersByMode.point;
      if (mode === 'line') candidates = insertableLayersByMode.line;
      if (mode === 'polygon') candidates = insertableLayersByMode.polygon;
      if (requireMulti) {
        return candidates.filter((layer) => layer.allowsMulti);
      }
      return candidates;
    },
    [insertableLayersByMode]
  );

  const handleLayerSelectionClose = useCallback(() => {
    setLayerSelectionState(null);
  }, []);

  const openAttributesDialog = useCallback((layerEntry, geometrySnapshot, mode) => {
    if (!layerEntry || !geometrySnapshot) return;
    setAttributeDialogState({
      layerName: layerEntry.name,
      layerLabel: layerEntry.label,
      layerConfig: layerEntry.layer,
      geometry: geometrySnapshot,
      drawMode: mode,
      key: Date.now(),
      feature: {
        id: `${layerEntry.name}.temp`,
        properties: {}
      }
    });
  }, []);

  const handleAttributeDialogClose = useCallback(() => {
    if (attributeDialogState?.savedFeature) {
      // Forzar refresco del mapa para evitar caches (igual que en el borrado)
      if (mapInstance) {
        try {
          // Actualizar el cache busting para forzar la recarga de tiles
          if (mapInstance.wmsLayer && mapInstance.wmsLayer.options) {
            mapInstance.wmsLayer.options.cacheBust = Date.now();
          }
          // Redibujar todos los tiles visibles
          if (mapInstance.wmsLayer && mapInstance.wmsLayer.redraw) {
            mapInstance.wmsLayer.redraw();
          }
          // Invalidar el tamaño del mapa para forzar actualización
          if (mapInstance.invalidateSize) {
            mapInstance.invalidateSize();
          }
        } catch (err) {
          console.warn('No se pudo forzar el refresco del mapa al cerrar el diálogo:', err);
        }
      }

      if (refreshWMSLayer) {
        try {
          refreshWMSLayer();
        } catch (err) {
          console.warn('No se pudo refrescar la capa WMS al cerrar el diálogo de atributos:', err);
        }
      }
    }
    setAttributeDialogState(null);
  }, [attributeDialogState, mapInstance, refreshWMSLayer]);

  const handleLayerSelect = useCallback((layerEntry) => {
    if (!layerSelectionState || !layerEntry) return;
    openAttributesDialog(layerEntry, layerSelectionState.geometry, layerSelectionState.drawMode);
    setLayerSelectionState(null);
  }, [layerSelectionState, openAttributesDialog]);

  const handleSaveDrawing = useCallback(() => {
    if (!finishDrawing || !drawMode) {
      return;
    }

    const geometry = finishDrawing();

    if (!geometry) {
      notify(
        'warning',
        tr('ui.map.draw.save.incomplete.title', 'Geometría incompleta', 'Incomplete geometry'),
        tr('ui.map.draw.save.incomplete.message', 'Dibuja una geometría válida antes de guardar.', 'Draw a valid geometry before saving.')
      );
      return;
    }

    const geometrySnapshot = JSON.parse(JSON.stringify(geometry));
    const geometryType = (geometrySnapshot?.type || '').toUpperCase();
    const requiresMulti = geometryType.startsWith('MULTI');
    const availableLayers = getLayersForMode(drawMode, requiresMulti);

    if (!availableLayers || availableLayers.length === 0) {
      const messageKey = requiresMulti
          ? 'ui.map.draw.save.noMultiLayers.message'
          : 'ui.map.draw.save.noLayers.message';
      notify(
        'warning',
        tr('ui.map.draw.save.noLayers.title', 'Sin capas configuradas', 'No configured layers'),
        tr(
          messageKey,
          requiresMulti
            ? 'No hay capas que admitan geometrías múltiples para este tipo.'
            : 'No hay capas que permitan insertar este tipo de geometría.',
          requiresMulti
            ? 'There are no layers that accept multi geometries for this type.'
            : 'There are no layers that allow inserting this geometry type.'
        )
      );
      return;
    }

    if (availableLayers.length === 1) {
      openAttributesDialog(availableLayers[0], geometrySnapshot, drawMode);
      return;
    }

    setLayerSelectionState({
      geometry: geometrySnapshot,
      drawMode,
      layers: availableLayers
    });
  }, [drawMode, finishDrawing, getLayersForMode, notify, openAttributesDialog]);

  const handleAttributeSave = useCallback(async (formValues) => {
    if (!attributeDialogState) {
      throw new Error('No hay geometría pendiente de guardar.');
    }

    if (!qgsUrl || !qgsProjectPath) {
      throw new Error('No se ha configurado la conexión con QGIS Server.');
    }

    const { layerName, geometry, layerConfig } = attributeDialogState;

    try {
      const result = await insertFeatureWithGeometry(
        qgsUrl,
        qgsProjectPath,
        layerName,
        geometry,
        formValues,
        token,
        layerConfig
      );

      notify(
        'success',
        tr('ui.map.draw.save.success.title', 'Geometría guardada', 'Geometry saved'),
        result?.fid
          ? tr('ui.map.draw.save.success.messageWithId', `Se ha creado el elemento ${result.fid}.`, `Feature ${result.fid} created.`)
          : tr('ui.map.draw.save.success.message', 'El elemento se ha guardado correctamente.', 'The feature was saved successfully.')
      );

      // Recargar la feature desde el servidor para obtener el ID real y todos los atributos actualizados
      let reloadedFeature = null;
      if (result?.fid && layerName) {
        try {
          reloadedFeature = await fetchFeatureById(
            qgsUrl,
            qgsProjectPath,
            layerName,
            result.fid,
            token
          );
        } catch (error) {
          console.warn('[MapToolbar] No se pudo recargar la feature después de guardar:', error);
          // Si falla la recarga, usar los datos que tenemos
          reloadedFeature = {
            id: result?.fid ? `${layerName}.${result.fid}` : null,
            properties: formValues
          };
        }
      }

      // Actualizar el estado del diálogo con la feature recargada (o con los datos disponibles si falló la recarga)
      setAttributeDialogState((prev) =>
        prev
          ? {
              ...prev,
              feature: reloadedFeature || {
                id: result?.fid ? `${prev.layerName}.${result.fid}` : prev.feature?.id || null,
                properties: reloadedFeature?.properties || formValues
              },
              savedFeature: reloadedFeature || {
                id: result?.fid ? `${prev.layerName}.${result.fid}` : prev.savedFeature?.id || prev.feature?.id || null,
                properties: reloadedFeature?.properties || formValues
              },
              geometry: geometry
            }
          : prev
      );

      if (cancelDrawing) {
        try {
          cancelDrawing();
        } catch (err) {
          console.warn('No se pudo limpiar la geometría temporal tras el guardado:', err);
        }
      }

      // Forzar refresco del mapa para evitar caches (igual que en el borrado)
      if (mapInstance) {
        try {
          // Actualizar el cache busting para forzar la recarga de tiles
          if (mapInstance.wmsLayer && mapInstance.wmsLayer.options) {
            mapInstance.wmsLayer.options.cacheBust = Date.now();
          }
          // Redibujar todos los tiles visibles
          if (mapInstance.wmsLayer && mapInstance.wmsLayer.redraw) {
            mapInstance.wmsLayer.redraw();
          }
          // Invalidar el tamaño del mapa para forzar actualización
          if (mapInstance.invalidateSize) {
            mapInstance.invalidateSize();
          }
        } catch (err) {
          console.warn('No se pudo forzar el refresco del mapa:', err);
        }
      }

      if (refreshWMSLayer) {
        try {
          refreshWMSLayer();
        } catch (err) {
          console.warn('No se pudo refrescar la capa WMS:', err);
        }
      }
      return result;
    } catch (error) {
      notify(
        'error',
        tr('ui.map.draw.save.error.title', 'Error al guardar', 'Error saving geometry'),
        error?.message || tr('ui.map.draw.save.error.message', 'No se pudo guardar la geometría.', 'The geometry could not be saved.')
      );
      throw error;
    }
  }, [attributeDialogState, cancelDrawing, notify, qgsProjectPath, qgsUrl, refreshWMSLayer, token, tr]);

  const attributeDialogHandlers = useMemo(() => {
    if (!attributeDialogState) {
      return null;
    }
    return {
      form: {
        onSave: handleAttributeSave
      }
    };
  }, [attributeDialogState, handleAttributeSave]);

  const attributeDialogFeature = useMemo(() => {
    if (!attributeDialogState) {
      return null;
    }
    if (attributeDialogState.feature) {
      return attributeDialogState.feature;
    }
    if (attributeDialogState.savedFeature) {
      return attributeDialogState.savedFeature;
    }
    return {
      id: null,
      properties: {}
    };
  }, [attributeDialogState]);

  // Detectar capacidades de añadir por tipo geométrico y capas disponibles
  const canAddPoint = insertableLayersByMode.point.length > 0;
  const canAddLine = insertableLayersByMode.line.length > 0;
  const canAddPolygon = insertableLayersByMode.polygon.length > 0;

  const hasEditableTools = canAddPoint || canAddLine || canAddPolygon;

  const deactivateAllTools = (except = null) => {
    if (except !== 'zoom-in-box') setBoxZoomActive(false);
    if (except !== 'zoom-out') setZoomOutActive(false);
    if (except !== 'measure') { setMeasureLineActive(false); setMeasureAreaActive(false); }
    // El GPS (show-location) nunca se desactiva automáticamente, solo manualmente por el usuario
    // if (except !== 'show-location') setShowLocationActive(false);
    if (except !== 'info-click') setInfoClickActive(false);
  };

  const clearPendingCancel = () => {
    if (pendingCancelRef.current) { clearTimeout(pendingCancelRef.current); pendingCancelRef.current = null; }
  };

  const handleToolChange = (toolKey) => {
    if (!toolKey) {
      deactivateAllTools();
      clearPendingCancel();
      pendingCancelRef.current = setTimeout(() => { if (cancelDrawing) cancelDrawing(); pendingCancelRef.current = null; }, 50);
      return;
    }
    clearPendingCancel();
    if (toolKey === 'draw-point') {
      deactivateAllTools();
      if (cancelDrawing) cancelDrawing();
      if (gpsActive && gpsLocation && setPendingExternalGeometry) {
        setPendingExternalGeometry(
          {
            type: 'Point',
            coordinates: [gpsLocation.lng, gpsLocation.lat]
          },
          'point'
        );
      }
      startDrawing && startDrawing('point');
    }
    else if (toolKey === 'draw-line') { deactivateAllTools(); if (cancelDrawing) cancelDrawing(); startDrawing && startDrawing('line'); }
    else if (toolKey === 'draw-polygon') { deactivateAllTools(); if (cancelDrawing) cancelDrawing(); startDrawing && startDrawing('polygon'); }
    else if (toolKey === 'measure-line') { setMeasureLineActive(true); setMeasureAreaActive(false); deactivateAllTools('measure'); if (cancelDrawing) cancelDrawing(); }
    else if (toolKey === 'measure-area') { setMeasureAreaActive(true); setMeasureLineActive(false); deactivateAllTools('measure'); if (cancelDrawing) cancelDrawing(); }
    else if (toolKey === 'zoom-in-box') { const s=!boxZoomActive; setBoxZoomActive(s); if (s) deactivateAllTools('zoom-in-box'); if (cancelDrawing) cancelDrawing(); }
    else if (toolKey === 'zoom-out') { const s=!zoomOutActive; setZoomOutActive(s); if (s) deactivateAllTools('zoom-out'); if (cancelDrawing) cancelDrawing(); }
    else if (toolKey === 'info-click') { const s=!infoClickActive; setInfoClickActive(s); if (s) deactivateAllTools('info-click'); if (cancelDrawing) cancelDrawing(); }
    // nav-back y nav-forward ahora son action tools, se manejan directamente con onClick, no necesitan handleToolChange
  };

  const handleZoomToExtent = () => { ZoomToExtent.handleZoomToExtent(mapInstance, initialBoundsRef); };

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
    // Navegación de extensiones (solo cuando funcional) - action tools que no deseleccionan la herramienta activa
    ...(canGoBack ? [{ key: 'nav-back', type: 'action', circular: true, icon: 'fas fa-arrow-left', title: tr('ui.map.navBack','Atrás','Back'), onClick: () => goBack && goBack() }] : []),
    ...(canGoForward ? [{ key: 'nav-forward', type: 'action', circular: true, icon: 'fas fa-arrow-right', title: tr('ui.map.navForward','Adelante','Forward'), onClick: () => goForward && goForward() }] : []),
    { key: 'bookmarks', type: 'action', circular: true, icon: 'fas fa-bookmark', title: tr('ui.map.bookmarks.title','Marcadores','Bookmarks'), onClick: () => setShowBookmarks(true) },
    { key: 'show-location', type: 'action', circular: true, icon: gpsActive ? 'fg-location-on' : 'fg-location', title: tr('ui.map.showLocation','Mostrar ubicación','Show my location'), onClick: () => {
      const newActive = !showLocationActive;
      setShowLocationActive(newActive);
      // Solo cancelar dibujo si se está activando el GPS, no al desactivarlo
      if (newActive && cancelDrawing) cancelDrawing();
    } },
    { key: 'info-click', type: 'tool', circular: true, icon: 'fg-poi-info', title: tr('ui.map.infoClick','Info en click','Info click'), disabled: !hasQueryableLayers },
    measureSelectItem
  ];

  if (canAddPoint) toolbarItems.push({ key: 'draw-point', type: 'tool', circular: true, icon: 'fg-point', title: tr('ui.map.drawPoint','Añadir punto','Add point') });
  if (canAddLine) toolbarItems.push({ key: 'draw-line', type: 'tool', circular: true, icon: 'fg-polyline', title: tr('ui.map.drawLine','Dibujar línea','Draw line') });
  if (canAddPolygon) toolbarItems.push({ key: 'draw-polygon', type: 'tool', circular: true, icon: 'fg-polygon', title: tr('ui.map.drawPolygon','Dibujar polígono','Draw polygon') });

  // Mostrar guardar/cancelar si ya hay geometría o no se está sketchando o si se dibuja agujero
  const canShowGpsTrackControls = gpsActive && (drawMode === 'line' || drawMode === 'polygon') && !isGpsTrackRecording;

  // Mostrar botones de track GPS cuando hay GPS activo y modo de dibujo de línea o polígono
  if (canShowGpsTrackControls && startGpsTrackRecording) {
    toolbarItems.push({
      key: 'gps-track-start',
      type: 'action',
      circular: true,
      icon: <i className="fa-solid fa-record-vinyl" style={{ color: '#d32f2f' }} />,
      title: tr('ui.map.startGpsTrack', 'Iniciar track GPS', 'Start GPS track'),
      disabled: !gpsLocation,
      onClick: () => gpsLocation && startGpsTrackRecording(drawMode)
    });
  }

  // Mostrar botones de pausar/reanudar y finalizar track GPS cuando se está grabando
  if (isGpsTrackRecording && gpsTrackType === drawMode) {
    // Botón de pausar/reanudar
    if (isGpsTrackPaused && resumeGpsTrackRecording) {
      toolbarItems.push({
        key: 'gps-track-resume',
        type: 'action',
        circular: true,
        icon: 'fas fa-play',
        title: tr('ui.map.resumeGpsTrack', 'Reanudar track GPS', 'Resume GPS track'),
        onClick: () => resumeGpsTrackRecording()
      });
    } else if (!isGpsTrackPaused && pauseGpsTrackRecording) {
      toolbarItems.push({
        key: 'gps-track-pause',
        type: 'action',
        circular: true,
        icon: 'fas fa-pause',
        title: tr('ui.map.pauseGpsTrack', 'Pausar track GPS', 'Pause GPS track'),
        onClick: () => pauseGpsTrackRecording()
      });
    }
    
    // Botón de finalizar
    if (stopGpsTrackRecording) {
      const minPoints = drawMode === 'polygon' ? 3 : 2;
      toolbarItems.push({
        key: 'gps-track-stop',
        type: 'action',
        circular: true,
        icon: 'fas fa-stop',
        title: tr('ui.map.stopGpsTrack', 'Finalizar track GPS', 'Stop GPS track'),
        disabled: gpsTrackPoints < minPoints,
        onClick: () => stopGpsTrackRecording()
      });
    }
  }

  if (drawMode && (hasGeometry || !isDrawing || isDrawingHole)) {
    if (drawMode === 'polygon') {
      toolbarItems.push({ key: 'poly-add-hole', type: 'action', circular: true, icon: 'fg-polygon-hole', title: tr('ui.map.addHole','Añadir agujero','Add hole'), onClick: () => setShowEditHelp(false) || (startHoleDrawing && startHoleDrawing()) });
      if (!isDrawingHole && (holeCount || 0) > 0) {
        toolbarItems.push({ key: 'poly-remove-hole', type: 'action', circular: true, icon: 'fas fa-minus-circle', title: tr('ui.map.removeHole','Eliminar agujero','Remove hole'), onClick: () => removeLastHole && removeLastHole() });
      }
    }
    toolbarItems.push({
      key: 'draw-save',
      type: 'action',
      circular: true,
      icon: 'fas fa-save',
      title: tr('ui.map.saveDrawing', 'Guardar dibujo', 'Save drawing'),
      onClick: handleSaveDrawing
    });
    toolbarItems.push({ key: 'draw-cancel', type: 'action', circular: true, icon: 'fas fa-times', title: tr('ui.map.cancelDrawing','Cancelar dibujo','Cancel drawing'), onClick: () => { cancelDrawing && cancelDrawing(); } });
  }

  // Botón de ayuda solo si hay herramientas editables
  if (hasEditableTools) {
    toolbarItems.push({ key: 'edit-help', type: 'action', circular: true, icon: 'fas fa-question-circle', title: tr('ui.map.editHelp','Ayuda de edición','Editing help'), onClick: () => setShowEditHelp(true) });
  }


  const selectedTool = boxZoomActive ? 'zoom-in-box' : (zoomOutActive ? 'zoom-out' : (infoClickActive ? 'info-click' : (drawMode ? `draw-${drawMode}` : ((measureLineActive || measureAreaActive) ? (measureLineActive ? 'measure-line' : 'measure-area') : null))));

  return (
    <div className="map-toolbar">
      <ZoomInBox active={boxZoomActive} onActiveChange={setBoxZoomActive} />
      <ZoomOut active={zoomOutActive} onActiveChange={setZoomOutActive} />
      <MeasureLine active={measureLineActive} onActiveChange={setMeasureLineActive} />
      <MeasureArea active={measureAreaActive} onActiveChange={setMeasureAreaActive} />
      <ShowLocation active={showLocationActive} onActiveChange={setShowLocationActive} />
      <InfoClick active={infoClickActive} onActiveChange={setInfoClickActive} />
      <ToolbarQGS items={toolbarItems} size="medium" selectedTool={selectedTool} onToolChange={handleToolChange} />

      {createPortal(
        <Modal
          isOpen={showEditHelp}
          onClose={() => setShowEditHelp(false)}
          size="medium"
          title={tr('ui.map.editHelp.title','Ayuda de edición','Editing help')}
        >
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
        </Modal>,
        document.body
      )}

      {layerSelectionState && (
        <Modal
          isOpen={true}
          onClose={handleLayerSelectionClose}
          title={tr('ui.map.draw.save.selectLayerTitle', 'Selecciona la capa', 'Select layer')}
          size="medium"
          lang={uiLanguage}
        >
          <div className="map-layer-selection-modal">
            <p>
              {tr(
                'ui.map.draw.save.selectLayerMessage',
                'Selecciona la capa donde quieres guardar la geometría recién dibujada.',
                'Choose the layer where you want to store the newly drawn geometry.'
              )}
            </p>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginTop: 12 }}>
              {layerSelectionState.layers.map((layer) => (
                <button
                  key={layer.name}
                  type="button"
                  onClick={() => handleLayerSelect(layer)}
                  style={{
                    padding: '10px 12px',
                    borderRadius: 8,
                    border: '1px solid #d1d5db',
                    background: '#fff',
                    textAlign: 'left',
                    cursor: 'pointer',
                    fontSize: 14
                  }}
                >
                  {layer.label}
                </button>
              ))}
            </div>
            <div style={{ marginTop: 16, textAlign: 'right' }}>
              <button
                type="button"
                onClick={handleLayerSelectionClose}
                className="qgs-form-button qgs-form-button--secondary"
              >
                {tr('ui.common.cancel', 'Cancelar', 'Cancel')}
              </button>
            </div>
          </div>
        </Modal>
      )}

      {attributeDialogState && attributeDialogFeature && (
        attributeDialogHandlers ? (
          <ActionHandlersProvider handlers={attributeDialogHandlers}>
            <FeatureAttributesDialog
              isOpen={true}
              onClose={handleAttributeDialogClose}
              layerName={attributeDialogState.layerName}
              feature={attributeDialogFeature}
              readOnly={false}
              language={uiLanguage}
            />
          </ActionHandlersProvider>
        ) : (
          <FeatureAttributesDialog
            isOpen={true}
            onClose={handleAttributeDialogClose}
            layerName={attributeDialogState.layerName}
            feature={attributeDialogFeature}
            readOnly={false}
            language={uiLanguage}
          />
        )
      )}

      <BookmarksManager isOpen={showBookmarks} onClose={() => setShowBookmarks(false)} />
    </div>
  );
};

export default MapToolbar;

