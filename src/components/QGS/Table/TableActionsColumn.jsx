import React, { useState, useMemo } from 'react';
import PropTypes from 'prop-types';
import { FeatureAttributesDialog } from '../../UI_QGS';
import ConfirmDialog from '../../UI/ConfirmDialog/ConfirmDialog';
import { Button } from '../../UI';
import { deleteFeature } from '../../../services/qgisWFSFetcher';
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
  mapInstance
}) => {
  const [showViewDialog, setShowViewDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

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
    if (canEditGeometry) count++;
    if (hasGeometry && mapInstance) count++;
    if (canDeleteData) count++;
    return count;
  }, [canViewData, canEditData, canEditGeometry, hasGeometry, mapInstance, canDeleteData]);

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

  const handleView = () => {
    setShowViewDialog(true);
  };

  const handleEditAttributes = () => {
    setShowEditDialog(true);
  };

  const handleEditGeometry = () => {
    if (onAction && typeof onAction === 'function') {
      onAction({
        action: 'editGeometry',
        layer,
        layerName,
        feature,
        featureId,
        map: mapInstance
      });
    }
  };

  const handleDelete = () => {
    setShowDeleteDialog(true);
  };

  const handleConfirmDelete = async () => {
    if (!feature || !featureId || !qgsUrl || !qgsProjectPath || !layerName) {
      if (notificationManager?.addNotification) {
        notificationManager.addNotification({
          title: translate('ui.map.deleteError'),
          text: translate('ui.map.deleteErrorMessage') || 'Faltan datos necesarios para borrar la feature',
          level: 'error'
        });
      }
      return;
    }

    setIsDeleting(true);

    try {
      // Construir feature con id en formato "layerName.featureId" para deleteFeature
      const normalizedLayerName = layerName.replace(/\s+/g, '_');
      const fullFeatureId = `${normalizedLayerName}.${featureId}`;
      const featureToDelete = {
        id: fullFeatureId,
        properties: feature
      };

      await deleteFeature(qgsUrl, qgsProjectPath, featureToDelete, token);

      // Mostrar notificación de éxito
      if (notificationManager?.addNotification) {
        notificationManager.addNotification({
          title: translate('ui.map.deleteSuccess'),
          text: translate('ui.map.deleteSuccessMessage'),
          level: 'success'
        });
      }

      // Cerrar el diálogo
      setShowDeleteDialog(false);

      // Notificar al handler externo si existe
      if (onAction && typeof onAction === 'function') {
        onAction({
          action: 'delete',
          layer,
          layerName,
          feature,
          featureId
        });
      }
    } catch (error) {
      console.error('Error al eliminar feature:', error);
      if (notificationManager?.addNotification) {
        notificationManager.addNotification({
          title: translate('ui.map.deleteError'),
          text: error.message || translate('ui.map.deleteErrorMessage'),
          level: 'error'
        });
      }
    } finally {
      setIsDeleting(false);
    }
  };

  const handleZoomToFeature = () => {
    if (onAction && typeof onAction === 'function' && mapInstance) {
      onAction({
        action: 'zoomToFeature',
        layer,
        layerName,
        feature,
        featureId,
        map: mapInstance
      });
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
          aria-label={translate('ui.table.selectRow')}
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
              title={translate('ui.map.actions.viewData')}
              aria-label={translate('ui.map.actions.viewData')}
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
              title={translate('ui.map.actions.editAttributes')}
              aria-label={translate('ui.map.actions.editAttributes')}
              icon={<i className="fg-layer-edit" aria-hidden="true" />}
            />
          )}
          {canEditGeometry && (
            <Button
              type="button"
              size="small"
              circular={true}
              onClick={(e) => {
                e.stopPropagation();
                handleEditGeometry();
              }}
              title={translate('ui.map.actions.editGeometry')}
              aria-label={translate('ui.map.actions.editGeometry')}
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
              title={translate('ui.map.actions.zoomToFeature') || 'Zoom a elemento'}
              aria-label={translate('ui.map.actions.zoomToFeature') || 'Zoom a elemento'}
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
                handleDelete();
              }}
              title={translate('ui.map.actions.deleteData')}
              aria-label={translate('ui.map.actions.deleteData')}
              icon={<i className="fas fa-trash" aria-hidden="true" />}
              className="table-actions-column__button--danger"
            />
          )}
        </div>
      </div>

      {/* Diálogo para ver atributos */}
      {showViewDialog && (
        <FeatureAttributesDialog
          layerName={layerName}
          featureId={featureId}
          readOnly={true}
          onClose={() => setShowViewDialog(false)}
        />
      )}

      {/* Diálogo para editar atributos */}
      {showEditDialog && (
        <FeatureAttributesDialog
          layerName={layerName}
          featureId={featureId}
          readOnly={false}
          onClose={() => setShowEditDialog(false)}
          onSave={() => {
            setShowEditDialog(false);
            // Notificar que se guardó para refrescar la tabla
            if (onAction && typeof onAction === 'function') {
              onAction({
                action: 'update',
                layer,
                layerName,
                feature,
                featureId
              });
            }
          }}
        />
      )}

      {/* Diálogo de confirmación para eliminar */}
      {showDeleteDialog && (
        <ConfirmDialog
          isOpen={showDeleteDialog}
          onClose={() => setShowDeleteDialog(false)}
          onConfirm={handleConfirmDelete}
          title={translate('ui.map.deleteConfirmTitle') || 'Confirmar eliminación'}
          message={translate('ui.map.deleteConfirmMessage') || '¿Está seguro de que desea eliminar este elemento?'}
          confirmText={translate('ui.map.deleteConfirm') || 'Eliminar'}
          cancelText={translate('ui.map.deleteCancel') || 'Cancelar'}
          variant="danger"
          isLoading={isDeleting}
        />
      )}
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
  mapInstance: PropTypes.object
};

// Exportar también la función para calcular el ancho de la columna
export const calculateActionsColumnWidth = (layer, mapInstance) => {
  const layerCapabilities = layer?.WFSCapabilities || {};
  const canViewData = !!layerCapabilities.allowQuery;
  const canEditData = !!layerCapabilities.allowUpdate;
  const canEditGeometry = !!layerCapabilities.allowUpdate;
  const canDeleteData = !!layerCapabilities.allowDelete;
  const hasGeometry = !!layer?.has_geometry;

  let visibleButtonsCount = 0;
  if (canViewData) visibleButtonsCount++;
  if (canEditData) visibleButtonsCount++;
  if (canEditGeometry) visibleButtonsCount++;
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

