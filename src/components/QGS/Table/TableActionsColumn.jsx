import React, { useState, useMemo, useContext } from 'react';
import PropTypes from 'prop-types';
import { FeatureAttributesDialog } from '../../UI_QGS';
import ConfirmDialog from '../../UI/ConfirmDialog/ConfirmDialog';
import { Button } from '../../UI';
import { deleteFeature, fetchFeatureById } from '../../../services/qgisWFSFetcher';
import { QgisConfigContext } from '../QgisConfigContext';
import './TableActionsColumn.css';

/**
 * Columna de acciones para las tablas
 * Incluye checkbox para selección y botones de acciones según las capacidades de la capa
 */
const TableActionsColumn = ({
  feature,
  featureId,
  layer,
  layerName,
  selected = false,
  onSelectChange,
  onAction,
  translate,
  qgsUrl,
  qgsProjectPath,
  token,
  notificationManager,
  mapInstance,
  startEditingGeometry,
  onMinimizeDrawer
}) => {
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [featureForDialog, setFeatureForDialog] = useState(null); // Feature completa para los diálogos
  
  // Obtener config y language del contexto QGIS
  const qgisContext = useContext(QgisConfigContext);
  const config = qgisContext?.config;
  const language = qgisContext?.language || 'es';
  
  // Obtener translate del contexto si no se pasa como prop
  const finalTranslate = translate || qgisContext?.t || ((key) => key);

  // Obtener capacidades de la capa
  const layerCapabilities = useMemo(() => layer?.WFSCapabilities || {}, [layer]);
  const canViewData = !!layerCapabilities.allowQuery;
  const canEditData = !!layerCapabilities.allowUpdate;
  const canEditGeometry = !!layerCapabilities.allowUpdate;
  const canDeleteData = !!layerCapabilities.allowDelete;
  const hasGeometry = !!layer?.has_geometry;

  // Calcular el número de botones visibles para determinar el ancho de la columna
  const visibleButtonsCount = useMemo(() => {
    let count = 0;
    if (canViewData) count++;
    if (canEditData) count++;
    // Editar geometría solo si hay mapInstance y startEditingGeometry
    if (canEditGeometry && mapInstance && startEditingGeometry) count++;
    if (hasGeometry && mapInstance) count++;
    if (canDeleteData) count++;
    return count;
  }, [canViewData, canEditData, canEditGeometry, hasGeometry, mapInstance, startEditingGeometry, canDeleteData]);

  // Calcular ancho de la columna: checkbox (20px) + gap (8px) + (botones * 28px) + (gaps entre botones * 4px) + padding (16px) + espacio extra (10px)
  const columnWidth = useMemo(() => {
    const checkboxWidth = 20;
    const checkboxGap = 8;
    const buttonWidth = 28; // Ancho de cada botón circular pequeño
    const buttonGap = 4; // Gap entre botones
    const padding = 16; // Padding total (8px a cada lado)
    const extraRightSpace = 10; // Espacio adicional a la derecha del último icono
    const buttonsWidth = visibleButtonsCount * buttonWidth;
    const gapsWidth = visibleButtonsCount > 0 ? (visibleButtonsCount - 1) * buttonGap : 0;
    return checkboxWidth + checkboxGap + buttonsWidth + gapsWidth + padding + extraRightSpace;
  }, [visibleButtonsCount]);

  const handleView = async () => {
    console.log('[TableActionsColumn] handleView - Inicio', { feature, featureId, layerName, hasQgsUrl: !!qgsUrl, hasQgsProjectPath: !!qgsProjectPath });
    
    // Si la feature no está disponible o no tiene estructura válida, obtenerla del servidor
    // IMPORTANTE: featureId puede ser 0, que es un valor válido, así que usar !== null && !== undefined
    const hasValidFeatureId = featureId !== null && featureId !== undefined && featureId !== '';
    
    if (!feature || !hasValidFeatureId) {
      console.log('[TableActionsColumn] handleView - Feature no disponible o featureId inválido, obteniendo del servidor');
      
      if (!qgsUrl || !qgsProjectPath || !layerName || !hasValidFeatureId) {
        console.error('[TableActionsColumn] handleView - Faltan datos necesarios', { qgsUrl: !!qgsUrl, qgsProjectPath: !!qgsProjectPath, layerName, featureId, hasValidFeatureId });
        if (notificationManager?.addNotification) {
          notificationManager.addNotification({
            title: finalTranslate('ui.map.viewError') || 'Error',
            text: finalTranslate('ui.map.viewErrorMessage') || 'Faltan datos necesarios para ver los atributos',
            level: 'error'
          });
        }
        return;
      }
      
      try {
        console.log('[TableActionsColumn] handleView - Obteniendo feature del servidor', { layerName, featureId });
        const featureToUse = await fetchFeatureById(qgsUrl, qgsProjectPath, layerName, featureId, token);
        console.log('[TableActionsColumn] handleView - Feature obtenida del servidor', { hasId: !!featureToUse?.id, hasGeometry: !!featureToUse?.geometry, hasProperties: !!featureToUse?.properties });
        
        // Guardar la feature para el diálogo
        setFeatureForDialog(featureToUse);
        setShowViewDialog(true);
      } catch (error) {
        console.error('[TableActionsColumn] handleView - Error al obtener feature:', error);
        if (notificationManager?.addNotification) {
          notificationManager.addNotification({
            title: finalTranslate('ui.map.viewError') || 'Error',
            text: error.message || finalTranslate('ui.map.viewErrorMessage') || 'No se pudo obtener la feature',
            level: 'error'
          });
        }
        return;
      }
    } else {
      // Usar la feature existente
      console.log('[TableActionsColumn] handleView - Usando feature existente', { hasId: !!feature?.id, hasGeometry: !!feature?.geometry, hasProperties: !!feature?.properties });
      
      // Si la feature solo tiene properties, construir la estructura GeoJSON completa
      let featureToUse = feature;
      if (feature.properties && !feature.id) {
        console.log('[TableActionsColumn] handleView - Construyendo estructura GeoJSON desde properties');
        featureToUse = {
          id: featureId,
          properties: feature.properties || feature,
          geometry: feature.geometry || null
        };
      }
      
      // Guardar la feature para el diálogo
      console.log('[TableActionsColumn] handleView - Abriendo diálogo con feature', { hasId: !!featureToUse?.id, hasProperties: !!featureToUse?.properties });
      setFeatureForDialog(featureToUse);
      setShowViewDialog(true);
    }
  };

  const handleEditAttributes = async () => {
    console.log('[TableActionsColumn] handleEditAttributes - Inicio', { feature, featureId, layerName, hasQgsUrl: !!qgsUrl, hasQgsProjectPath: !!qgsProjectPath });
    
    // Si la feature no está disponible o no tiene estructura válida, obtenerla del servidor
    // IMPORTANTE: featureId puede ser 0, que es un valor válido, así que usar !== null && !== undefined
    const hasValidFeatureId = featureId !== null && featureId !== undefined && featureId !== '';
    
    if (!feature || !hasValidFeatureId) {
      console.log('[TableActionsColumn] handleEditAttributes - Feature no disponible o featureId inválido, obteniendo del servidor');
      
      if (!qgsUrl || !qgsProjectPath || !layerName || !hasValidFeatureId) {
        console.error('[TableActionsColumn] handleEditAttributes - Faltan datos necesarios', { qgsUrl: !!qgsUrl, qgsProjectPath: !!qgsProjectPath, layerName, featureId, hasValidFeatureId });
        if (notificationManager?.addNotification) {
          notificationManager.addNotification({
            title: finalTranslate('ui.map.editError') || 'Error',
            text: finalTranslate('ui.map.editErrorMessage') || 'Faltan datos necesarios para editar los atributos',
            level: 'error'
          });
        }
        return;
      }
      
      try {
        console.log('[TableActionsColumn] handleEditAttributes - Obteniendo feature del servidor', { layerName, featureId });
        const featureToUse = await fetchFeatureById(qgsUrl, qgsProjectPath, layerName, featureId, token);
        console.log('[TableActionsColumn] handleEditAttributes - Feature obtenida del servidor', { hasId: !!featureToUse?.id, hasGeometry: !!featureToUse?.geometry, hasProperties: !!featureToUse?.properties });
        
        // Guardar la feature para el diálogo
        setFeatureForDialog(featureToUse);
        setShowEditDialog(true);
      } catch (error) {
        console.error('[TableActionsColumn] handleEditAttributes - Error al obtener feature:', error);
        if (notificationManager?.addNotification) {
          notificationManager.addNotification({
            title: finalTranslate('ui.map.editError') || 'Error',
            text: error.message || finalTranslate('ui.map.editErrorMessage') || 'No se pudo obtener la feature',
            level: 'error'
          });
        }
        return;
      }
    } else {
      // Usar la feature existente
      console.log('[TableActionsColumn] handleEditAttributes - Usando feature existente', { hasId: !!feature?.id, hasGeometry: !!feature?.geometry, hasProperties: !!feature?.properties });
      
      // Si la feature solo tiene properties, construir la estructura GeoJSON completa
      let featureToUse = feature;
      if (feature.properties && !feature.id) {
        console.log('[TableActionsColumn] handleEditAttributes - Construyendo estructura GeoJSON desde properties');
        featureToUse = {
          id: featureId,
          properties: feature.properties || feature,
          geometry: feature.geometry || null
        };
      }
      
      // Guardar la feature para el diálogo
      console.log('[TableActionsColumn] handleEditAttributes - Abriendo diálogo con feature', { hasId: !!featureToUse?.id, hasProperties: !!featureToUse?.properties });
      setFeatureForDialog(featureToUse);
      setShowEditDialog(true);
    }
  };

  const handleEditGeometry = async () => {
    console.log('[TableActionsColumn] handleEditGeometry - Inicio', { 
      hasMapInstance: !!mapInstance, 
      hasStartEditingGeometry: !!startEditingGeometry,
      hasQgsUrl: !!qgsUrl, 
      hasQgsProjectPath: !!qgsProjectPath, 
      layerName, 
      featureId,
      featureIdType: typeof featureId,
      hasLayer: !!layer
    });
    
    // Validar featureId: 0 es válido, pero null/undefined no
    const isValidFeatureId = featureId !== null && featureId !== undefined;
    
    if (!mapInstance || !startEditingGeometry || !qgsUrl || !qgsProjectPath || !layerName || !isValidFeatureId) {
      console.error('[TableActionsColumn] handleEditGeometry - Faltan datos necesarios', {
        mapInstance: !!mapInstance,
        startEditingGeometry: !!startEditingGeometry,
        qgsUrl: !!qgsUrl,
        qgsProjectPath: !!qgsProjectPath,
        layerName,
        featureId
      });
      
      if (notificationManager?.addNotification) {
        notificationManager.addNotification({
          title: finalTranslate('ui.map.editGeometryError') || 'Error',
          text: finalTranslate('ui.map.editGeometryErrorMessage') || 'Faltan datos necesarios para editar la geometría',
          level: 'error'
        });
      }
      return;
    }

    try {
      console.log('[TableActionsColumn] handleEditGeometry - Obteniendo feature del servidor', { layerName, featureId });
      // Obtener la geometría completa de la feature
      const fullFeature = await fetchFeatureById(qgsUrl, qgsProjectPath, layerName, featureId, token);
      console.log('[TableActionsColumn] handleEditGeometry - Feature obtenida', { 
        hasFeature: !!fullFeature, 
        hasGeometry: !!fullFeature?.geometry,
        hasId: !!fullFeature?.id,
        hasProperties: !!fullFeature?.properties
      });
      
      if (!fullFeature || !fullFeature.geometry) {
        console.error('[TableActionsColumn] handleEditGeometry - Feature sin geometría', { fullFeature });
        if (notificationManager?.addNotification) {
          notificationManager.addNotification({
            title: finalTranslate('ui.map.editGeometryError') || 'Error',
            text: finalTranslate('ui.map.editGeometryErrorMessage') || 'No se pudo obtener la geometría de la feature',
            level: 'error'
          });
        }
        return;
      }

      // Hacer zoom a la geometría
      try {
        console.log('[TableActionsColumn] handleEditGeometry - Haciendo zoom a la geometría');
        const geoJsonLayer = window.L.geoJSON(fullFeature);
        const bounds = geoJsonLayer.getBounds();
        if (bounds && bounds.isValid()) {
          mapInstance.fitBounds(bounds, { padding: [50, 50] });
          console.log('[TableActionsColumn] handleEditGeometry - Zoom realizado');
        } else {
          console.warn('[TableActionsColumn] handleEditGeometry - Bounds no válidos', { bounds });
        }
      } catch (zoomError) {
        console.warn('[TableActionsColumn] handleEditGeometry - Error al hacer zoom a la geometría:', zoomError);
        // Continuar aunque falle el zoom
      }

      // Minimizar el drawer si existe la función
      if (onMinimizeDrawer && typeof onMinimizeDrawer === 'function') {
        console.log('[TableActionsColumn] handleEditGeometry - Minimizando drawer');
        onMinimizeDrawer();
      } else {
        console.warn('[TableActionsColumn] handleEditGeometry - onMinimizeDrawer no disponible');
      }

      // Iniciar la edición de la geometría
      console.log('[TableActionsColumn] handleEditGeometry - Iniciando edición de geometría', { 
        hasFullFeature: !!fullFeature, 
        hasLayer: !!layer 
      });
      startEditingGeometry(fullFeature, layer);
      console.log('[TableActionsColumn] handleEditGeometry - Edición de geometría iniciada');

      // Notificar al handler externo si existe
      if (onAction && typeof onAction === 'function') {
        onAction({
          action: 'editGeometry',
          layer,
          layerName,
          feature: fullFeature,
          featureId
        });
      }
    } catch (error) {
      console.error('[TableActionsColumn] handleEditGeometry - Error:', error);
      if (notificationManager?.addNotification) {
        notificationManager.addNotification({
          title: finalTranslate('ui.map.editGeometryError') || 'Error',
          text: error.message || finalTranslate('ui.map.editGeometryErrorMessage') || 'Ha ocurrido un error al intentar editar la geometría',
          level: 'error'
        });
      }
    }
  };

  const handleDelete = () => {
    console.log('[TableActionsColumn] handleDelete - Inicio', { 
      feature, 
      featureId, 
      layerName, 
      hasQgsUrl: !!qgsUrl, 
      hasQgsProjectPath: !!qgsProjectPath,
      hasToken: !!token,
      hasNotificationManager: !!notificationManager
    });
    setShowDeleteDialog(true);
    console.log('[TableActionsColumn] handleDelete - showDeleteDialog establecido a true');
  };

  const handleConfirmDelete = async () => {
    console.log('[TableActionsColumn] handleConfirmDelete - Inicio', { 
      feature, 
      featureId, 
      layerName, 
      hasQgsUrl: !!qgsUrl, 
      hasQgsProjectPath: !!qgsProjectPath,
      hasToken: !!token
    });
    
    if (!qgsUrl || !qgsProjectPath) {
      console.error('[TableActionsColumn] handleConfirmDelete - Faltan qgsUrl o qgsProjectPath');
      // Mostrar error si faltan datos
      if (notificationManager?.addError) {
        notificationManager.addError(
          finalTranslate('ui.map.deleteError'),
          finalTranslate('ui.map.deleteErrorMessage') || 'Faltan datos necesarios para borrar la feature'
        );
      } else if (notificationManager?.addNotification) {
        notificationManager.addNotification({
          title: finalTranslate('ui.map.deleteError'),
          text: finalTranslate('ui.map.deleteErrorMessage') || 'Faltan datos necesarios para borrar la feature',
          level: 'error'
        });
      }
      return;
    }

    // Obtener la feature completa si no la tenemos
    let featureToDelete = feature;
    if (!featureToDelete || !featureToDelete.id) {
      if (!layerName || !featureId) {
        if (notificationManager?.addError) {
          notificationManager.addError(
            finalTranslate('ui.map.deleteError'),
            finalTranslate('ui.map.deleteErrorMessage') || 'Faltan datos necesarios para borrar la feature'
          );
        } else if (notificationManager?.addNotification) {
          notificationManager.addNotification({
            title: finalTranslate('ui.map.deleteError'),
            text: finalTranslate('ui.map.deleteErrorMessage') || 'Faltan datos necesarios para borrar la feature',
            level: 'error'
          });
        }
        return;
      }
      
      try {
        featureToDelete = await fetchFeatureById(qgsUrl, qgsProjectPath, layerName, featureId, token);
      } catch (error) {
        console.error('Error al obtener feature para borrar:', error);
        if (notificationManager?.addNotification) {
          notificationManager.addNotification({
            title: finalTranslate('ui.map.deleteError') || 'Error al borrar',
            text: error.message || finalTranslate('ui.map.deleteErrorMessage') || 'No se pudo obtener la feature',
            level: 'error'
          });
        }
        setIsDeleting(false);
        return;
      }
    }

    setIsDeleting(true);

    try {
      // Pasar la feature directamente a deleteFeature (como en el popup del mapa)
      await deleteFeature(qgsUrl, qgsProjectPath, featureToDelete, token);

      // Mostrar notificación de éxito
      if (notificationManager?.addSuccess) {
        notificationManager.addSuccess(
          finalTranslate('ui.map.deleteSuccess'),
          finalTranslate('ui.map.deleteSuccessMessage')
        );
      } else if (notificationManager?.addNotification) {
        notificationManager.addNotification({
          title: finalTranslate('ui.map.deleteSuccess'),
          text: finalTranslate('ui.map.deleteSuccessMessage'),
          level: 'success'
        });
      }

      // Refrescar la capa WMS para mostrar los cambios (si hay mapInstance)
      if (mapInstance && mapInstance.wmsLayer) {
        // Actualizar el cache busting para forzar la recarga de tiles
        if (mapInstance.wmsLayer.options) {
          mapInstance.wmsLayer.options.cacheBust = Date.now();
        }
        // Redibujar todos los tiles visibles
        if (mapInstance.wmsLayer.redraw) {
          mapInstance.wmsLayer.redraw();
        }
        // Invalidar el tamaño del mapa para forzar actualización
        if (mapInstance.invalidateSize) {
          mapInstance.invalidateSize();
        }
      }

      // Cerrar el diálogo
      setShowDeleteDialog(false);

      // Notificar al handler externo si existe
      if (onAction && typeof onAction === 'function') {
        onAction({
          action: 'delete',
          layer,
          layerName,
          feature: featureToDelete,
          featureId
        });
      }
    } catch (error) {
      console.error('Error al borrar feature:', error);
      
      // Obtener mensaje de error más descriptivo
      let errorMessage = finalTranslate('ui.map.deleteErrorMessage') || 'Ha ocurrido un error al intentar borrar la feature';
      
      if (error && error.message) {
        errorMessage = error.message;
      } else if (error && typeof error === 'string') {
        errorMessage = error;
      } else if (error) {
        errorMessage = String(error);
      }
      
      // Mostrar notificación de error usando el sistema de notificaciones
      if (notificationManager && notificationManager.addNotification) {
        notificationManager.addNotification({
          title: finalTranslate('ui.map.deleteError') || 'Error al borrar',
          text: errorMessage,
          level: 'error'
        });
      } else if (notificationManager && notificationManager.addError) {
        notificationManager.addError(
          finalTranslate('ui.map.deleteError') || 'Error al borrar',
          errorMessage
        );
      }
      
      // NO cerrar el diálogo si hay error
    } finally {
      setIsDeleting(false);
    }
  };

  const handleZoomToFeature = async () => {
    if (!mapInstance || !qgsUrl || !qgsProjectPath || !layerName || !featureId) {
      if (notificationManager?.addNotification) {
        notificationManager.addNotification({
          title: finalTranslate('ui.map.zoomToFeatureError') || 'Error',
          text: finalTranslate('ui.map.zoomToFeatureErrorMessage') || 'Faltan datos necesarios para hacer zoom a la feature',
          level: 'error'
        });
      }
      return;
    }

    try {
      // Obtener la geometría completa de la feature para hacer zoom
      const fullFeature = await fetchFeatureById(qgsUrl, qgsProjectPath, layerName, featureId, token);
      
      if (!fullFeature || !fullFeature.geometry) {
        if (notificationManager?.addNotification) {
          notificationManager.addNotification({
            title: finalTranslate('ui.map.zoomToFeatureError') || 'Error',
            text: finalTranslate('ui.map.zoomToFeatureErrorMessage') || 'No se pudo obtener la geometría de la feature',
            level: 'error'
          });
        }
        return;
      }

      // Hacer zoom a la geometría
      const geoJsonLayer = window.L.geoJSON(fullFeature);
      const bounds = geoJsonLayer.getBounds();
      if (bounds && bounds.isValid()) {
        mapInstance.fitBounds(bounds, { padding: [50, 50] });
        
        // Minimizar el drawer si está disponible
        if (onMinimizeDrawer && typeof onMinimizeDrawer === 'function') {
          onMinimizeDrawer();
        }
        
        // Notificar éxito si es necesario
        if (notificationManager?.addNotification) {
          notificationManager.addNotification({
            title: finalTranslate('ui.map.zoomToFeatureSuccess') || 'Zoom realizado',
            text: finalTranslate('ui.map.zoomToFeatureSuccessMessage') || 'Se ha hecho zoom a la feature',
            level: 'success'
          });
        }
      } else {
        throw new Error('Bounds no válidos');
      }

      // Notificar al handler externo si existe
      if (onAction && typeof onAction === 'function') {
        onAction({
          action: 'zoomToFeature',
          layer,
          layerName,
          feature: fullFeature,
          featureId
        });
      }
    } catch (error) {
      console.error('Error al hacer zoom a la feature:', error);
      if (notificationManager?.addNotification) {
        notificationManager.addNotification({
          title: finalTranslate('ui.map.zoomToFeatureError') || 'Error',
          text: error.message || finalTranslate('ui.map.zoomToFeatureErrorMessage') || 'Ha ocurrido un error al intentar hacer zoom a la feature',
          level: 'error'
        });
      }
    }
  };

  return (
    <>
      <div className="table-actions-column" style={{ width: `${columnWidth}px` }}>
        <input
          type="checkbox"
          checked={selected}
          onChange={(e) => {
            e.stopPropagation();
            if (onSelectChange) {
              onSelectChange(featureId, e.target.checked);
            }
          }}
          className="table-actions-column__checkbox"
          aria-label={finalTranslate('ui.table.selectRow')}
        />
        <div className="table-actions-column__buttons">
          {canViewData && (
            <Button
              type="button"
              size="small"
              circular={true}
              onClick={(e) => {
                e.stopPropagation();
                handleView();
              }}
              title={finalTranslate('ui.map.actions.viewData')}
              aria-label={finalTranslate('ui.map.actions.viewData')}
              icon={<i className="fas fa-eye" aria-hidden="true" />}
            />
          )}
          {canEditData && (
            <Button
              type="button"
              size="small"
              circular={true}
              onClick={(e) => {
                e.stopPropagation();
                handleEditAttributes();
              }}
              title={finalTranslate('ui.map.actions.editAttributes')}
              aria-label={finalTranslate('ui.map.actions.editAttributes')}
              icon={<i className="fg-layer-edit" aria-hidden="true" />}
            />
          )}
          {canEditGeometry && mapInstance && startEditingGeometry && (
            <Button
              type="button"
              size="small"
              circular={true}
              onClick={(e) => {
                e.stopPropagation();
                handleEditGeometry();
              }}
              title={finalTranslate('ui.map.actions.editGeometry')}
              aria-label={finalTranslate('ui.map.actions.editGeometry')}
              icon={<i className="fg-modify-poly" aria-hidden="true" />}
            />
          )}
          {hasGeometry && mapInstance && (
            <Button
              type="button"
              size="small"
              circular={true}
              onClick={(e) => {
                e.stopPropagation();
                handleZoomToFeature();
              }}
              title={finalTranslate('ui.map.actions.zoomToFeature') || 'Zoom a elemento'}
              aria-label={finalTranslate('ui.map.actions.zoomToFeature') || 'Zoom a elemento'}
              icon={<i className="fas fa-search-location" aria-hidden="true" />}
            />
          )}
          {canDeleteData && (
            <Button
              type="button"
              size="small"
              circular={true}
              onClick={(e) => {
                e.stopPropagation();
                console.log('[TableActionsColumn] Botón borrar clickeado');
                handleDelete();
              }}
              title={finalTranslate('ui.map.actions.deleteData')}
              aria-label={finalTranslate('ui.map.actions.deleteData')}
              icon={<i className="fas fa-trash" aria-hidden="true" />}
              className="table-actions-column__button--danger"
            />
          )}
        </div>
      </div>

      {/* Diálogo para ver atributos */}
      {featureForDialog && (
        <FeatureAttributesDialog
          isOpen={showViewDialog}
          onClose={() => {
            setShowViewDialog(false);
            setFeatureForDialog(null);
          }}
          layerName={layerName}
          feature={featureForDialog}
          readOnly={true}
          language={language}
          config={config}
          qgsUrl={qgsUrl}
          qgsProjectPath={qgsProjectPath}
          token={token}
          t={translate}
          notificationManager={notificationManager}
        />
      )}

      {/* Diálogo para editar atributos */}
      {featureForDialog && (
        <FeatureAttributesDialog
          isOpen={showEditDialog}
          onClose={() => {
            setShowEditDialog(false);
            setFeatureForDialog(null);
          }}
          layerName={layerName}
          feature={featureForDialog}
          readOnly={false}
          language={language}
          config={config}
          qgsUrl={qgsUrl}
          qgsProjectPath={qgsProjectPath}
          token={token}
          t={translate}
          notificationManager={notificationManager}
          onSave={async (savedData) => {
            // Recargar la feature desde el servidor para obtener los valores actualizados
            if (featureForDialog && featureForDialog.id && qgsUrl && qgsProjectPath) {
              try {
                const updatedFeature = await fetchFeatureById(
                  qgsUrl,
                  qgsProjectPath,
                  layerName,
                  featureForDialog.id,
                  token
                );
                // Notificar que se guardó para refrescar la tabla
                if (onAction && typeof onAction === 'function') {
                  onAction({
                    action: 'update',
                    layer,
                    layerName,
                    feature: updatedFeature,
                    featureId
                  });
                }
              } catch (error) {
                console.error('Error al recargar la feature después de guardar:', error);
                // Aún así notificar que se guardó
                if (onAction && typeof onAction === 'function') {
                  onAction({
                    action: 'update',
                    layer,
                    layerName,
                    feature: featureForDialog,
                    featureId
                  });
                }
              }
            } else {
              // Si no se puede recargar, notificar igualmente
              if (onAction && typeof onAction === 'function') {
                onAction({
                  action: 'update',
                  layer,
                  layerName,
                  feature: featureForDialog,
                  featureId
                });
              }
            }
            setShowEditDialog(false);
            setFeatureForDialog(null);
          }}
        />
      )}

      {/* Diálogo de confirmación para eliminar */}
      <ConfirmDialog
        open={showDeleteDialog}
        onCancel={() => {
          console.log('[TableActionsColumn] ConfirmDialog onCancel llamado');
          setShowDeleteDialog(false);
        }}
        onConfirm={() => {
          console.log('[TableActionsColumn] ConfirmDialog onConfirm llamado');
          handleConfirmDelete();
        }}
        title={finalTranslate('ui.map.deleteConfirmTitle')}
        message={finalTranslate('ui.map.deleteConfirmMessage')}
        cancelText={finalTranslate('ui.common.cancel')}
        variant="danger"
        loading={isDeleting}
        lang={language}
      />
    </>
  );
};

TableActionsColumn.propTypes = {
  feature: PropTypes.object.isRequired,
  featureId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
  layer: PropTypes.object,
  layerName: PropTypes.string.isRequired,
  selected: PropTypes.bool,
  onSelectChange: PropTypes.func,
  onAction: PropTypes.func,
  translate: PropTypes.func.isRequired,
  qgsUrl: PropTypes.string,
  qgsProjectPath: PropTypes.string,
  token: PropTypes.string,
  notificationManager: PropTypes.object,
  mapInstance: PropTypes.object,
  startEditingGeometry: PropTypes.func,
  onMinimizeDrawer: PropTypes.func
};

// Exportar también la función para calcular el ancho de la columna
export const calculateActionsColumnWidth = (layer, mapInstance, startEditingGeometry) => {
  const layerCapabilities = layer?.WFSCapabilities || {};
  const canViewData = !!layerCapabilities.allowQuery;
  const canEditData = !!layerCapabilities.allowUpdate;
  const canEditGeometry = !!layerCapabilities.allowUpdate;
  const canDeleteData = !!layerCapabilities.allowDelete;
  const hasGeometry = !!layer?.has_geometry;

  let visibleButtonsCount = 0;
  if (canViewData) visibleButtonsCount++;
  if (canEditData) visibleButtonsCount++;
  // Editar geometría solo si hay mapInstance y startEditingGeometry
  if (canEditGeometry && mapInstance && startEditingGeometry) visibleButtonsCount++;
  if (hasGeometry && mapInstance) visibleButtonsCount++;
  if (canDeleteData) visibleButtonsCount++;

  const checkboxWidth = 20;
  const checkboxGap = 8;
  const buttonWidth = 28; // Ancho de cada botón circular pequeño
  const buttonGap = 4; // Gap entre botones
  const padding = 16; // Padding total (8px a cada lado)
  const extraRightSpace = 10; // Espacio adicional a la derecha del último icono
  const buttonsWidth = visibleButtonsCount * buttonWidth;
  const gapsWidth = visibleButtonsCount > 0 ? (visibleButtonsCount - 1) * buttonGap : 0;
  return checkboxWidth + checkboxGap + buttonsWidth + gapsWidth + padding + extraRightSpace;
};

export default TableActionsColumn;

