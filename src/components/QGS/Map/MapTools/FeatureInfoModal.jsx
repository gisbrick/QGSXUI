import React, { useState, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import Modal from '../../../UI/Modal/Modal';
import MapTipViewer from './MapTipViewer';
import { QgisConfigContext } from '../../QgisConfigContext';
import './FeatureInfoModal.css';

/**
 * Componente modal para mostrar los resultados de GetFeatureInfo
 * Agrupa las features por capa y permite navegar entre capas y features
 */
const FeatureInfoModal = ({ isOpen, onClose, features, map }) => {
  const { config, t } = React.useContext(QgisConfigContext) || {};
  const translate = typeof t === 'function' ? t : (key) => key;

  // Agrupar features por capa
  const layersWithFeatures = useMemo(() => {
    if (!features || !config) return [];

    const grouped = {};
    
    features.forEach(feature => {
      // El ID de la feature tiene formato "layerName.featureId"
      const featureIdArr = feature.id?.split('.') || [];
      const layerName = featureIdArr[0];
      
      if (layerName && config.layers?.[layerName]) {
        if (!grouped[layerName]) {
          grouped[layerName] = {
            layer: config.layers[layerName],
            layerName: layerName,
            features: []
          };
        }
        grouped[layerName].features.push(feature);
      }
    });

    return Object.values(grouped);
  }, [features, config]);

  // Estado para la capa y feature seleccionadas
  const [selectedLayerIndex, setSelectedLayerIndex] = useState(0);
  const [selectedFeatureIndex, setSelectedFeatureIndex] = useState(0);

  // Resetear selección cuando cambian las capas
  useEffect(() => {
    if (layersWithFeatures.length > 0) {
      setSelectedLayerIndex(0);
      setSelectedFeatureIndex(0);
    }
  }, [layersWithFeatures.length]);

  const selectedLayer = layersWithFeatures[selectedLayerIndex];
  const selectedFeature = selectedLayer?.features[selectedFeatureIndex];

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

  if (!isOpen || layersWithFeatures.length === 0) {
    return null;
  }

  const hasMultipleLayers = layersWithFeatures.length > 1;
  const hasMultipleFeatures = selectedLayer?.features.length > 1;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={translate('ui.map.featureInfo') || 'Información de Features'}
      size="large"
      className="feature-info-modal"
    >
      <div className="feature-info-content">
        {/* Navegación de capas */}
        {hasMultipleLayers && (
          <div className="feature-info-layer-nav">
            <button
              className="feature-info-nav-button"
              onClick={handlePreviousLayer}
              disabled={selectedLayerIndex === 0}
              aria-label={translate('ui.map.previousLayer') || 'Capa anterior'}
            >
              ‹
            </button>
            <div className="feature-info-layer-info">
              <span className="feature-info-layer-name">
                {selectedLayer?.layerName || ''}
              </span>
              <span className="feature-info-layer-count">
                ({selectedLayerIndex + 1} / {layersWithFeatures.length})
              </span>
            </div>
            <button
              className="feature-info-nav-button"
              onClick={handleNextLayer}
              disabled={selectedLayerIndex === layersWithFeatures.length - 1}
              aria-label={translate('ui.map.nextLayer') || 'Capa siguiente'}
            >
              ›
            </button>
          </div>
        )}

        {/* Información de la capa si no hay múltiples capas */}
        {!hasMultipleLayers && selectedLayer && (
          <div className="feature-info-layer-info-single">
            <span className="feature-info-layer-name">
              {selectedLayer.layerName}
            </span>
          </div>
        )}

        {/* Navegación de features */}
        {hasMultipleFeatures && (
          <div className="feature-info-feature-nav">
            <button
              className="feature-info-nav-button"
              onClick={handlePreviousFeature}
              disabled={selectedFeatureIndex === 0}
              aria-label={translate('ui.map.previousFeature') || 'Feature anterior'}
            >
              ‹
            </button>
            <div className="feature-info-feature-info">
              <span>
                {translate('ui.map.feature') || 'Feature'} {selectedFeatureIndex + 1} / {selectedLayer.features.length}
              </span>
            </div>
            <button
              className="feature-info-nav-button"
              onClick={handleNextFeature}
              disabled={selectedFeatureIndex === selectedLayer.features.length - 1}
              aria-label={translate('ui.map.nextFeature') || 'Feature siguiente'}
            >
              ›
            </button>
          </div>
        )}

        {/* Contenido: MapTipTemplate o información básica */}
        {selectedFeature && selectedLayer && (
          <div className="feature-info-body">
            {selectedLayer.layer.mapTipTemplate && selectedLayer.layer.mapTipTemplate.trim() !== '' ? (
              <MapTipViewer
                layer={selectedLayer.layer}
                feature={selectedFeature}
                map={map}
              />
            ) : (
              <div className="feature-info-no-template">
                <div className="feature-info-properties">
                  <h4>{translate('ui.map.featureProperties') || 'Propiedades de la feature'}</h4>
                  <table className="feature-info-properties-table">
                    <tbody>
                      {Object.entries(selectedFeature.properties || {}).map(([key, value]) => (
                        <tr key={key}>
                          <td className="feature-info-property-key">{key}</td>
                          <td className="feature-info-property-value">
                            {value !== null && value !== undefined ? String(value) : '-'}
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
          <div className="feature-info-layers-list">
            <h5>{translate('ui.map.availableLayers') || 'Capas disponibles'}</h5>
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
      </div>
    </Modal>
  );
};

FeatureInfoModal.propTypes = {
  isOpen: PropTypes.bool.isRequired,
  onClose: PropTypes.func.isRequired,
  features: PropTypes.arrayOf(PropTypes.object),
  map: PropTypes.object
};

export default FeatureInfoModal;

