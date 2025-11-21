import React, { useState, useEffect, useMemo, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { createRoot } from 'react-dom/client';
import MapTipViewer from './MapTipViewer';
import { QgisConfigContext } from '../../QgisConfigContext';
import { fetchFeatureById, deleteFeature } from '../../../../services/qgisWFSFetcher';
import ConfirmDialog from '../../../UI/ConfirmDialog/ConfirmDialog';
import { FeatureAttributesDialog } from '../../../UI_QGS';
import './FeatureInfoPopup.css';

const normalizeFeatureId = (id) => {
  if (id === null || id === undefined) return '';
  return id.toString().replace(/\s+/g, '_');
};

/**
 * Componente para mostrar los resultados de GetFeatureInfo dentro de un Popup de Leaflet
 * Agrupa las features por capa y permite navegar entre capas y features
 */
const FeatureInfoPopup = ({ 
  features, 
  map, 
  onClose, 
  config: configProp, 
  onToolbarAction = null, 
  t: propTranslate,
  qgsUrl: qgsUrlProp = null,
  qgsProjectPath: qgsProjectPathProp = null,
  token: tokenProp = null,
  notificationManager: notificationManagerProp = null,
  language: languageProp = null // Prop para el idioma (cuando se renderiza fuera del contexto)
}) => {
  const qgisContext = React.useContext(QgisConfigContext);
  const contextConfig = qgisContext?.config;
  const contextT = qgisContext?.t;
  // Usar notificationManager de prop primero, luego del contexto
  const notificationManager = notificationManagerProp || qgisContext?.notificationManager;
  // CRÍTICO: Priorizar la prop language sobre el contexto, porque cuando se renderiza con createRoot
  // el contexto puede no estar disponible o tener el idioma incorrecto
  // La prop language viene directamente de InfoClick que tiene acceso al contexto correcto
  const language = languageProp || qgisContext?.language || 'es';

  const translate = React.useCallback(
    (key) => {
      if (typeof propTranslate === 'function') {
        const value = propTranslate(key);
        if (value !== undefined && value !== null && value !== '' && value !== key) {
          return value;
        }
      }
      if (typeof contextT === 'function') {
        const value = contextT(key);
        if (value !== undefined && value !== null && value !== '' && value !== key) {
          return value;
        }
      }
      return key;
    },
    [propTranslate, contextT]
  );
  
  // Usar config pasado como prop o del contexto
  const config = configProp || contextConfig;

  // Estado local para mantener las features actualizadas
  const [updatedFeatures, setUpdatedFeatures] = useState(features);
  const updatedFeaturesRef = useRef(updatedFeatures);
  useEffect(() => {
    updatedFeaturesRef.current = updatedFeatures;
  }, [updatedFeatures]);
  
  // Actualizar el estado local cuando cambien las features del prop
  React.useEffect(() => {
    setUpdatedFeatures(features);
  }, [features]);

  // Agrupar features por capa
  const layersWithFeatures = useMemo(() => {
    if (!updatedFeatures || !config) {
      return [];
    }

    const grouped = {};
    
    updatedFeatures.forEach(feature => {
      
      // El ID de la feature tiene formato "layerName.featureId" o puede ser solo el nombre de la capa
      let layerName = null;
      
      if (feature.id) {
        const featureIdArr = feature.id.split('.');
        layerName = featureIdArr[0];
      } else if (feature.typeName) {
        // Algunas respuestas pueden tener typeName directamente
        layerName = feature.typeName;
      }
      
      // Normalizar el nombre de la capa (reemplazar espacios por guiones bajos, etc.)
      if (layerName) {
        // Intentar encontrar la capa en el config
        // Primero intentar con el nombre exacto
        let qgisLayer = config.layers?.[layerName];
        
        // Si no se encuentra, intentar normalizando (espacios a guiones bajos)
        if (!qgisLayer) {
          const normalizedName = layerName.replace(/\s+/g, '_');
          qgisLayer = config.layers?.[normalizedName];
          if (qgisLayer) {
            layerName = normalizedName;
          }
        }
        
        // Si aún no se encuentra, buscar por coincidencia parcial
        if (!qgisLayer) {
          const configLayerNames = Object.keys(config.layers || {});
          const matchingLayer = configLayerNames.find(name => {
            const normalizedConfigName = name.replace(/\s+/g, '_');
            const normalizedFeatureName = layerName.replace(/\s+/g, '_');
            return normalizedConfigName === normalizedFeatureName || 
                   name === layerName || 
                   normalizedConfigName === layerName ||
                   name === normalizedFeatureName;
          });
          
          if (matchingLayer) {
            qgisLayer = config.layers[matchingLayer];
            layerName = matchingLayer;
          }
        }
        
        if (qgisLayer) {
          if (!grouped[layerName]) {
            grouped[layerName] = {
              layer: qgisLayer,
              layerName: layerName,
              features: []
            };
          }
          grouped[layerName].features.push(feature);
          console.log('FeatureInfoPopup: Added feature to layer', layerName);
        } else {
          console.warn('FeatureInfoPopup: Layer not found in config', layerName, 'Available layers:', Object.keys(config.layers || {}));
        }
      } else {
        console.warn('FeatureInfoPopup: Feature has no id or typeName', feature);
      }
    });

    const result = Object.values(grouped);
    return result;
  }, [updatedFeatures, config]);

  // Estado para la capa y feature seleccionadas
  const [selectedLayerIndex, setSelectedLayerIndex] = useState(0);
  const [selectedFeatureIndex, setSelectedFeatureIndex] = useState(0);
  const [showDeleteDialog, setShowDeleteDialog] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [showAttributesDialog, setShowAttributesDialog] = useState(false);
  const [showEditDialog, setShowEditDialog] = useState(false);
  // Key para forzar re-render cuando se actualizan las features
  const [featuresUpdateKey, setFeaturesUpdateKey] = useState(0);

  // Referencia a la capa gráfica de selección
  const selectionLayerRef = React.useRef(null);

  // Resetear selección cuando cambian las capas
  useEffect(() => {
    if (layersWithFeatures.length > 0) {
      setSelectedLayerIndex(0);
      setSelectedFeatureIndex(0);
    }
  }, [layersWithFeatures.length]);

  const selectedLayer = layersWithFeatures[selectedLayerIndex];
  const selectedFeature = selectedLayer?.features[selectedFeatureIndex];

  // Estado para la feature con geometría completa
  const [featureWithGeometry, setFeatureWithGeometry] = useState(null);
  // Usar props si están disponibles, sino intentar desde el contexto
  const qgsUrl = qgsUrlProp || qgisContext?.qgsUrl;
  const qgsProjectPath = qgsProjectPathProp || qgisContext?.qgsProjectPath;
  const token = tokenProp || qgisContext?.token;

  const applyUpdatedFeatureData = useCallback((updatedFeatureData) => {
    if (!updatedFeatureData) {
      return;
    }

    const normalizedUpdatedId = normalizeFeatureId(updatedFeatureData.id);

    setUpdatedFeatures((prevFeatures) => {
      if (!prevFeatures) return prevFeatures;
      return prevFeatures.map((f) => {
        const normalizedFId = normalizeFeatureId(f.id);
        if (normalizedFId === normalizedUpdatedId) {
          return {
            ...f,
            properties: updatedFeatureData.properties,
            geometry: updatedFeatureData.geometry || f.geometry
          };
        }
        return f;
      });
    });

    setFeatureWithGeometry((prevFeature) => {
      if (prevFeature && normalizeFeatureId(prevFeature.id) === normalizedUpdatedId) {
        return updatedFeatureData;
      }
      return prevFeature;
    });

    setFeaturesUpdateKey((prev) => prev + 1);
  }, [setUpdatedFeatures, setFeatureWithGeometry, setFeaturesUpdateKey]);

  // Obtener la geometría completa de la feature si no la tiene
  useEffect(() => {
    if (!selectedFeature || !selectedLayer) {
      setFeatureWithGeometry(null);
      return;
    }

    if (!qgsUrl || !qgsProjectPath) {
      setFeatureWithGeometry(null);
      return;
    }

    // Verificar si la feature ya tiene geometría
    const hasGeometry = selectedFeature.geometry && 
                        selectedFeature.geometry.coordinates && 
                        selectedFeature.geometry.coordinates.length > 0;

    if (hasGeometry) {
      // Si ya tiene geometría, usarla directamente
      setFeatureWithGeometry(selectedFeature);
    } else if (selectedFeature.id) {
      // Si no tiene geometría pero tiene ID, obtenerla mediante WFS GetFeature
      const fetchGeometry = async () => {
        try {
          const fullFeature = await fetchFeatureById(
            qgsUrl,
            qgsProjectPath,
            selectedLayer.layerName,
            selectedFeature.id,
            token
          );
          
          setFeatureWithGeometry(fullFeature);
        } catch (error) {
          console.error('Error obteniendo geometría de la feature:', error);
          setFeatureWithGeometry(null);
        }
      };

      fetchGeometry();
    } else {
      setFeatureWithGeometry(null);
    }
  }, [selectedFeature, selectedLayer, qgsUrl, qgsProjectPath, token]);

  // Crear y gestionar la capa gráfica de selección
  useEffect(() => {
    if (!map || !window.L) {
      return;
    }

    // Crear la capa gráfica si no existe
    if (!selectionLayerRef.current) {
      selectionLayerRef.current = window.L.featureGroup([]);
      selectionLayerRef.current.addTo(map);
    }

    const selectionLayer = selectionLayerRef.current;

    // Limpiar la capa anterior
    selectionLayer.clearLayers();

    // Si hay una feature con geometría, dibujarla
    if (featureWithGeometry && featureWithGeometry.geometry) {
      const hasGeometry = featureWithGeometry.geometry.coordinates && 
                          featureWithGeometry.geometry.coordinates.length > 0;

      if (hasGeometry) {
        try {
          // Estilo de resaltado para la feature seleccionada
          const highlightStyle = {
            color: '#3388ff',
            weight: 3,
            opacity: 1,
            fillColor: '#3388ff',
            fillOpacity: 0.3
          };

          // Crear la capa GeoJSON con el estilo de resaltado
          const geoJsonLayer = window.L.geoJSON(featureWithGeometry, {
            style: highlightStyle,
            pointToLayer: (feature, latlng) => {
              // Para puntos, usar un círculo más grande
              return window.L.circleMarker(latlng, {
                radius: 8,
                fillColor: '#3388ff',
                color: '#3388ff',
                weight: 3,
                opacity: 1,
                fillOpacity: 0.5
              });
            }
          });

          // Añadir la feature a la capa de selección
          geoJsonLayer.eachLayer((layer) => {
            selectionLayer.addLayer(layer);
          });
        } catch (error) {
          console.error('Error al dibujar feature seleccionada:', error);
        }
      }
    }

    // NO hacer cleanup aquí porque queremos mantener la capa mientras el popup esté abierto
    // El cleanup se hará cuando se cierre el popup
  }, [featureWithGeometry, map]);

  // Función para limpiar la capa de selección
  const cleanupSelectionLayer = React.useCallback(() => {
    if (selectionLayerRef.current && map) {
      try {
        selectionLayerRef.current.clearLayers();
        if (map.hasLayer(selectionLayerRef.current)) {
          map.removeLayer(selectionLayerRef.current);
        }
        selectionLayerRef.current = null;
      } catch (error) {
        console.error('Error al limpiar capa de selección:', error);
      }
    }
  }, [map]);

  // Limpiar la capa cuando se cierre el popup desde Leaflet
  useEffect(() => {
    if (!map) return;

    const handlePopupClose = () => {
      cleanupSelectionLayer();
    };

    map.on('popupclose', handlePopupClose);

    return () => {
      map.off('popupclose', handlePopupClose);
      cleanupSelectionLayer();
    };
  }, [map, cleanupSelectionLayer]);
  const layerCapabilities = useMemo(() => selectedLayer?.layer?.WFSCapabilities || {}, [selectedLayer]);
  const canViewData = !!layerCapabilities.allowQuery;
  const canEditData = !!layerCapabilities.allowUpdate;
  const canEditGeometry = !!layerCapabilities.allowUpdate;
  const canDeleteData = !!layerCapabilities.allowDelete;
  const hasToolbarActions = canViewData || canEditData || canEditGeometry || canDeleteData;
  const handleToolbarAction = (action) => {
    if (!selectedLayer || !selectedFeature) {
      return;
    }

    // Si es una acción de borrado, mostrar el diálogo de confirmación
    if (action === 'delete') {
      setShowDeleteDialog(true);
      return;
    }

    // Si es una acción de ver atributos, abrir el diálogo de atributos
    if (action === 'view') {
      setShowAttributesDialog(true);
      return;
    }

    // Si es una acción de editar atributos, abrir el diálogo de edición
    if (action === 'editAttributes') {
      setShowEditDialog(true);
      return;
    }

    // Si es una acción de editar geometría, cerrar el popup y pasar la acción al handler
    if (action === 'editGeometry') {
      // Cerrar el popup
      if (map && map.closePopup) {
        map.closePopup();
      }
      if (onClose) {
        onClose();
      }
    }

    const payload = {
      action,
      layer: selectedLayer.layer,
      layerName: selectedLayer.layerName,
      layerIndex: selectedLayerIndex,
      feature: featureWithGeometry || selectedFeature, // Usar featureWithGeometry si está disponible (tiene geometría completa)
      featureIndex: selectedFeatureIndex,
      map
    };

    if (typeof onToolbarAction === 'function') {
      onToolbarAction(payload);
    } else {
      console.warn('FeatureInfoPopup toolbar action triggered but no handler provided', payload);
    }
  };

  // Función para confirmar el borrado
  const handleConfirmDelete = async () => {
    if (!selectedFeature || !qgsUrl || !qgsProjectPath) {
      // Mostrar error si faltan datos
      if (notificationManager?.addError) {
        notificationManager.addError(
          translate('ui.map.deleteError'),
          translate('ui.map.deleteErrorMessage') || 'Faltan datos necesarios para borrar la feature'
        );
      }
      return;
    }

    setIsDeleting(true);

    try {
      await deleteFeature(qgsUrl, qgsProjectPath, selectedFeature, token);
      
      // Mostrar notificación de éxito
      if (notificationManager?.addSuccess) {
        notificationManager.addSuccess(
          translate('ui.map.deleteSuccess'),
          translate('ui.map.deleteSuccessMessage')
        );
      } else {
        console.warn('notificationManager.addSuccess no disponible');
      }

      // Refrescar la capa WMS para mostrar los cambios
      // Primero intentar refrescar directamente desde la capa del mapa
      if (map && map.wmsLayer) {
        // Actualizar el cache busting para forzar la recarga de tiles
        if (map.wmsLayer.options) {
          map.wmsLayer.options.cacheBust = Date.now();
        }
        // Redibujar todos los tiles visibles
        if (map.wmsLayer.redraw) {
          map.wmsLayer.redraw();
        }
        // Invalidar el tamaño del mapa para forzar actualización
        if (map.invalidateSize) {
          map.invalidateSize();
        }
      }

      // Cerrar el diálogo
      setShowDeleteDialog(false);

      // Cerrar el popup
      if (map && map.closePopup) {
        map.closePopup();
      }
      if (onClose) {
        onClose();
      }

      // Notificar al handler externo si existe
      if (typeof onToolbarAction === 'function') {
        onToolbarAction({
          action: 'delete',
          layer: selectedLayer.layer,
          layerName: selectedLayer.layerName,
          layerIndex: selectedLayerIndex,
          feature: selectedFeature,
          featureIndex: selectedFeatureIndex,
          map,
          deleted: true
        });
      }
    } catch (error) {
      console.error('Error al borrar feature:', error);
      
      // Obtener mensaje de error más descriptivo
      let errorMessage = translate('ui.map.deleteErrorMessage') || 'Ha ocurrido un error al intentar borrar la feature';
      
      if (error && error.message) {
        errorMessage = error.message;
      } else if (error && typeof error === 'string') {
        errorMessage = error;
      } else if (error) {
        errorMessage = String(error);
      }
      
      // Mostrar notificación de error usando el sistema de notificaciones
      // Siempre usar addNotification que es el método base que funciona con Message
      if (notificationManager && notificationManager.addNotification) {
        notificationManager.addNotification({
          title: translate('ui.map.deleteError') || 'Error al borrar',
          text: errorMessage,
          level: 'error'
        });
      } else if (notificationManager && notificationManager.addError) {
        // Si addError está disponible, usarlo
        notificationManager.addError(
          translate('ui.map.deleteError') || 'Error al borrar',
          errorMessage
        );
      } else {
        console.error('notificationManager no disponible o sin métodos:', notificationManager);
      }
      
      // NO cerrar el diálogo si hay error, para que el usuario pueda ver el mensaje
      // El diálogo se cerrará cuando el usuario cancele o intente de nuevo
    } finally {
      setIsDeleting(false);
    }
  };

  // Función para cancelar el borrado
  const handleCancelDelete = () => {
    setShowDeleteDialog(false);
  };


  // Navegación entre capas
  const handlePreviousLayer = () => {
    if (selectedLayerIndex > 0) {
      setSelectedLayerIndex(selectedLayerIndex - 1);
      setSelectedFeatureIndex(0);
    }
  };

  const handleNextLayer = () => {
    if (selectedLayerIndex < layersWithFeatures.length - 1) {
      setSelectedLayerIndex(selectedLayerIndex + 1);
      setSelectedFeatureIndex(0);
    }
  };

  // Navegación entre features de la misma capa
  const handlePreviousFeature = () => {
    if (selectedFeatureIndex > 0) {
      setSelectedFeatureIndex(selectedFeatureIndex - 1);
    }
  };

  const handleNextFeature = () => {
    if (selectedFeatureIndex < selectedLayer.features.length - 1) {
      setSelectedFeatureIndex(selectedFeatureIndex + 1);
    }
  };

  if (layersWithFeatures.length === 0) {
    return (
      <div className="feature-info-popup-empty">
        {translate('ui.map.noFeaturesFound')}
      </div>
    );
  }

  const hasMultipleLayers = layersWithFeatures.length > 1;
  const hasMultipleFeatures = selectedLayer?.features.length > 1;

  useEffect(() => {
    const handleExternalFeatureUpdate = async (event) => {
      const detail = event?.detail || {};
      const { featureId: updatedFeatureId, layerName: updatedLayerName } = detail;
      const providedFeatureData = detail?.featureData || detail?.feature || null;

      if (!updatedFeatureId || !updatedLayerName) {
        return;
      }

      if (!qgsUrl || !qgsProjectPath) {
        return;
      }

      const normalizedUpdatedId = normalizeFeatureId(updatedFeatureId);
      const hasFeature =
        (updatedFeaturesRef.current || []).some(
          (f) => normalizeFeatureId(f.id) === normalizedUpdatedId
        );

      if (!hasFeature) {
        return;
      }

      if (providedFeatureData) {
        applyUpdatedFeatureData(providedFeatureData);
        return;
      }

      try {
        const refreshedFeature = await fetchFeatureById(
          qgsUrl,
          qgsProjectPath,
          updatedLayerName,
          updatedFeatureId,
          token
        );

        applyUpdatedFeatureData(refreshedFeature);
      } catch (error) {
        console.error('FeatureInfoPopup: Error al refrescar feature tras actualización externa:', error);
      }
    };

    window.addEventListener('qgs-feature-updated', handleExternalFeatureUpdate);
    return () => {
      window.removeEventListener('qgs-feature-updated', handleExternalFeatureUpdate);
    };
  }, [qgsUrl, qgsProjectPath, token, applyUpdatedFeatureData]);

  return (
    <div className="feature-info-popup">
      {/* Navegación de capas */}
      {hasMultipleLayers && (
        <div className="feature-info-popup-layer-nav">
          <button
            className="feature-info-popup-nav-button"
            onClick={handlePreviousLayer}
            disabled={selectedLayerIndex === 0}
            aria-label={translate('ui.map.previousLayer')}
            type="button"
          >
            ‹
          </button>
          <div className="feature-info-popup-layer-info">
            <span className="feature-info-popup-layer-name">
              {selectedLayer?.layerName || ''}
            </span>
            <span className="feature-info-popup-layer-count">
              ({selectedLayerIndex + 1} / {layersWithFeatures.length})
            </span>
          </div>
          <button
            className="feature-info-popup-nav-button"
            onClick={handleNextLayer}
            disabled={selectedLayerIndex === layersWithFeatures.length - 1}
            aria-label={translate('ui.map.nextLayer')}
            type="button"
          >
            ›
          </button>
        </div>
      )}

      {/* Información de la capa si no hay múltiples capas */}
      {!hasMultipleLayers && selectedLayer && (
        <div className="feature-info-popup-layer-info-single">
          <span className="feature-info-popup-layer-name">
            {selectedLayer.layerName}
          </span>
        </div>
      )}

      {(hasToolbarActions || hasMultipleFeatures) && (
        <div
          className="feature-info-popup-toolbar"
          role="toolbar"
          aria-label={translate('ui.map.layerActions')}
        >
          <div className="feature-info-popup-toolbar-actions">
            {canViewData && (
              <button
                type="button"
                className="feature-info-popup-toolbar-button"
                onClick={() => handleToolbarAction('view')}
                title={translate('ui.map.actions.viewData')}
                aria-label={translate('ui.map.actions.viewData')}
                disabled={!selectedFeature}
              >
                <i className="fas fa-eye" aria-hidden="true" />
              </button>
            )}
            {canEditData && (
              <button
                type="button"
                className="feature-info-popup-toolbar-button"
                onClick={() => handleToolbarAction('editAttributes')}
                title={translate('ui.map.actions.editAttributes')}
                aria-label={translate('ui.map.actions.editAttributes')}
                disabled={!selectedFeature}
              >
                <i className="fg-layer-edit" aria-hidden="true" />
              </button>
            )}
            {canEditGeometry && (
              <button
                type="button"
                className="feature-info-popup-toolbar-button"
                onClick={() => handleToolbarAction('editGeometry')}
                title={translate('ui.map.actions.editGeometry')}
                aria-label={translate('ui.map.actions.editGeometry')}
                disabled={!selectedFeature}
              >
                <i className="fg-modify-poly" aria-hidden="true" />
              </button>
            )}
            {canDeleteData && (
              <button
                type="button"
                className="feature-info-popup-toolbar-button feature-info-popup-toolbar-button--danger"
                onClick={() => handleToolbarAction('delete')}
                title={translate('ui.map.actions.deleteData')}
                aria-label={translate('ui.map.actions.deleteData')}
                disabled={!selectedFeature}
              >
                <i className="fas fa-trash" aria-hidden="true" />
              </button>
            )}
          </div>

          {/* Navegación de features a la derecha de la toolbar */}
          {hasMultipleFeatures && (
            <div className="feature-info-popup-feature-nav">
              <button
                className="feature-info-popup-nav-button"
                onClick={handlePreviousFeature}
                disabled={selectedFeatureIndex === 0}
                aria-label={translate('ui.map.previousFeature')}
                type="button"
              >
                ‹
              </button>
              <div className="feature-info-popup-feature-info">
                <span>
                  {translate('ui.map.feature')} {selectedFeatureIndex + 1} / {selectedLayer.features.length}
                </span>
              </div>
              <button
                className="feature-info-popup-nav-button"
                onClick={handleNextFeature}
                disabled={selectedFeatureIndex === selectedLayer.features.length - 1}
                aria-label={translate('ui.map.nextFeature')}
                type="button"
              >
                ›
              </button>
            </div>
          )}
        </div>
      )}

      {/* Contenido: MapTipTemplate o información básica */}
      {selectedFeature && selectedLayer && (
        <div className="feature-info-popup-body" key={`feature-${selectedFeature.id}-${featuresUpdateKey}`}>
          {selectedLayer.layer.mapTipTemplate && selectedLayer.layer.mapTipTemplate.trim() !== '' ? (
            <MapTipViewer
              key={`maptip-${selectedFeature.id}-${featuresUpdateKey}`}
              layer={selectedLayer.layer}
              feature={selectedFeature}
              map={map}
              t={translate}
            />
          ) : (
            <div className="feature-info-popup-no-template">
              <div className="feature-info-popup-properties">
                <h4>{translate('ui.map.featureProperties')}</h4>
                <table className="feature-info-popup-properties-table">
                  <tbody>
                    {Object.entries(selectedFeature.properties || {}).map(([key, value]) => (
                      <tr key={key}>
                        <td className="feature-info-popup-property-key">{key}</td>
                        <td className="feature-info-popup-property-value">
                          {value !== null && value !== undefined ? String(value) : (translate('ui.common.empty') || '')}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Lista de capas disponibles (sidebar opcional) */}
      {hasMultipleLayers && (
        <div className="feature-info-popup-layers-list">
          <h5>{translate('ui.map.availableLayers')}</h5>
          <ul>
            {layersWithFeatures.map((layerData, index) => (
              <li
                key={layerData.layerName}
                className={index === selectedLayerIndex ? 'active' : ''}
                onClick={() => {
                  setSelectedLayerIndex(index);
                  setSelectedFeatureIndex(0);
                }}
              >
                {layerData.layerName} ({layerData.features.length})
              </li>
            ))}
          </ul>
        </div>
      )}

      {/* Diálogo de confirmación de borrado - se renderiza fuera del popup usando Portal */}
      <ConfirmDialog
        open={showDeleteDialog}
        title={translate('ui.map.deleteConfirmTitle')}
        message={translate('ui.map.deleteConfirmMessage')}
        cancelText={translate('ui.common.cancel')}
        onConfirm={handleConfirmDelete}
        onCancel={handleCancelDelete}
        loading={isDeleting}
        variant="danger"
        lang={language}
      />
      
      {/* Diálogo de atributos (modo lectura) */}
      {selectedLayer && selectedFeature && (
        <FeatureAttributesDialog
          isOpen={showAttributesDialog}
          onClose={() => setShowAttributesDialog(false)}
          layerName={selectedLayer.layerName}
          feature={selectedFeature}
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

      {/* Diálogo de edición de atributos */}
      {selectedLayer && selectedFeature && (
        <FeatureAttributesDialog
          isOpen={showEditDialog}
          onClose={() => setShowEditDialog(false)}
          layerName={selectedLayer.layerName}
          feature={selectedFeature}
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
            if (selectedFeature && selectedFeature.id && qgsUrl && qgsProjectPath) {
              try {
                const updatedFeature = await fetchFeatureById(
                  qgsUrl,
                  qgsProjectPath,
                  selectedLayer.layerName,
                  selectedFeature.id,
                  token
                );
                applyUpdatedFeatureData(updatedFeature);
              } catch (error) {
                console.error('Error al recargar la feature después de guardar:', error);
              }
            }
            
            // Refrescar la capa WMS para mostrar los cambios en el mapa
            if (map && map.wmsLayer) {
              // Actualizar el cache busting para forzar la recarga de tiles
              if (map.wmsLayer.options) {
                map.wmsLayer.options.cacheBust = Date.now();
              }
              // Redibujar todos los tiles visibles
              if (map.wmsLayer.redraw) {
                map.wmsLayer.redraw();
              }
              // Invalidar el tamaño del mapa para forzar actualización
              if (map.invalidateSize) {
                map.invalidateSize();
              }
            }
            
            // NO cerrar el diálogo - el usuario puede seguir editando
          }}
        />
      )}
    </div>
  );
};

FeatureInfoPopup.propTypes = {
  features: PropTypes.arrayOf(PropTypes.object),
  map: PropTypes.object,
  onClose: PropTypes.func,
  config: PropTypes.object,
  onToolbarAction: PropTypes.func,
  t: PropTypes.func,
  qgsUrl: PropTypes.string,
  qgsProjectPath: PropTypes.string,
  token: PropTypes.string,
  notificationManager: PropTypes.object
};

/**
 * Función helper para renderizar el componente en un contenedor del popup de Leaflet
 */
export const renderFeatureInfoPopup = (container, features, map, onClose, config = null, options = {}) => {
  const { 
    onToolbarAction = null, 
    t: translate = null,
    qgsUrl = null,
    qgsProjectPath = null,
    token = null,
    notificationManager = null,
    language = 'es' // Idioma del contexto QGIS
  } = options || {};
  const root = createRoot(container);
  root.render(
    <FeatureInfoPopup
      features={features}
      map={map}
      onClose={onClose}
      config={config}
      onToolbarAction={onToolbarAction}
      t={translate}
      qgsUrl={qgsUrl}
      qgsProjectPath={qgsProjectPath}
      token={token}
      notificationManager={notificationManager}
      language={language} // Pasar el idioma al componente
    />
  );
  return root;
};

export default FeatureInfoPopup;

