import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import Modal from '../../../UI/Modal/Modal';
import Form from '../../Form/Form';
import { QgisConfigContext } from '../../QgisConfigContext';
import { useUITranslation } from '../../../../hooks/useTranslation';
import { LoadingQGS } from '../../../UI_QGS';
import './FeatureAttributesDialog.css';

// Importar traducciones
import enTranslations from '../../../../locales/en/translation.json';
import esTranslations from '../../../../locales/es/translation.json';

/**
 * Componente para mostrar los atributos de una feature en modo lectura
 * Se abre como un diálogo modal y muestra el layout del formulario en modo solo lectura
 */
const FeatureAttributesDialog = ({
  isOpen,
  onClose,
  layerName,
  feature,
  language = 'es',
  // Props opcionales para cuando se renderiza fuera del contexto React
  config: configProp = null,
  qgsUrl: qgsUrlProp = null,
  qgsProjectPath: qgsProjectPathProp = null,
  token: tokenProp = null,
  t: tProp = null,
  notificationManager: notificationManagerProp = null
}) => {
  // TODOS LOS HOOKS DEBEN IR AL PRINCIPIO, ANTES DE CUALQUIER RETURN CONDICIONAL
  const qgisContext = useContext(QgisConfigContext);
  const contextT = qgisContext?.t || tProp;
  const contextLanguage = qgisContext?.language || language || 'es';
  const finalLanguage = language || contextLanguage;
  
  // Usar props si están disponibles, sino usar contexto
  const config = configProp || qgisContext?.config;
  const qgsUrl = qgsUrlProp || qgisContext?.qgsUrl;
  const qgsProjectPath = qgsProjectPathProp || qgisContext?.qgsProjectPath;
  const token = tokenProp || qgisContext?.token;
  const notificationManager = notificationManagerProp || qgisContext?.notificationManager;

  // Crear traducciones - DEBE IR ANTES DE CUALQUIER RETURN
  const translations = useMemo(() => 
    finalLanguage === 'es' ? esTranslations : enTranslations,
    [finalLanguage]
  );
  const { t: tempT } = useUITranslation(finalLanguage, translations);
  
  // Usar la función de traducción del contexto si está disponible, sino usar la temporal
  const finalT = contextT || tempT;

  // Extraer el featureId del feature.id (formato: "layerName.featureId")
  const featureId = React.useMemo(() => {
    if (!feature || !feature.id) {
      return null;
    }
    
    // El ID puede venir como "layerName.featureId" o solo el número
    const idParts = feature.id.toString().split('.');
    // Si tiene punto, tomar la segunda parte, sino tomar todo
    return idParts.length > 1 ? idParts[1] : idParts[0];
  }, [feature]);

  // Título del diálogo
  const dialogTitle = React.useMemo(() => {
    if (!layerName || !feature) {
      return 'Atributos';
    }
    
    // Intentar obtener el nombre de la capa desde el config
    const layer = config?.layers?.[layerName];
    const layerLabel = layer?.name || layerName;
    
    // Intentar obtener un identificador de la feature
    const featureLabel = feature.properties?.name || 
                        feature.properties?.nombre || 
                        feature.properties?.id || 
                        featureId || 
                        '';
    
    return `${layerLabel}${featureLabel ? ` - ${featureLabel}` : ''}`;
  }, [layerName, feature, featureId, config]);

  // Función de traducción
  const translate = React.useCallback(
    (key) => {
      if (typeof finalT === 'function') {
        const value = finalT(key);
        if (value !== undefined && value !== null && value !== '' && value !== key) {
          return value;
        }
      }
      return key;
    },
    [finalT]
  );

  // Crear contextValue - DEBE IR ANTES DE CUALQUIER RETURN
  const contextValue = useMemo(() => {
    if (!config) {
      return null;
    }
    return {
      config,
      qgsUrl,
      qgsProjectPath,
      language: finalLanguage,
      relations: [],
      token,
      loading: false,
      t: finalT,
      translations,
      notificationManager
    };
  }, [config, qgsUrl, qgsProjectPath, finalLanguage, token, finalT, translations, notificationManager]);


  // AHORA SÍ PODEMOS HACER RETURNS CONDICIONALES
  if (!isOpen) {
    return null;
  }

  // Validar que tenemos los datos necesarios
  if (!layerName || !feature || !featureId) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={translate('ui.map.attributes.title') || 'Atributos'}
        size="large"
        lang={finalLanguage}
      >
        <div className="feature-attributes-dialog__error">
          <p>{translate('ui.map.attributes.error.missingData') || 'Faltan datos necesarios para mostrar los atributos'}</p>
        </div>
      </Modal>
    );
  }

  // Si no hay config, no podemos mostrar el formulario
  if (!config) {
    return (
      <Modal
        isOpen={isOpen}
        onClose={onClose}
        title={translate('ui.map.attributes.title') || 'Atributos'}
        size="large"
        lang={finalLanguage}
      >
        <div className="feature-attributes-dialog__error">
          <p>{translate('ui.map.attributes.error.missingData') || 'Faltan datos necesarios para mostrar los atributos'}</p>
        </div>
      </Modal>
    );
  }

  // Contenido del diálogo - usar el componente Form de QGS en modo solo lectura
  // SIEMPRE usar el Provider para asegurar que el Form tenga acceso al contexto
  const dialogContent = (
    <div className="feature-attributes-dialog__content">
      {qgisContext && qgisContext.config ? (
        // Si hay contexto con config, usar directamente el Form en modo solo lectura
        <Form 
          layerName={layerName} 
          featureId={featureId}
          readOnly={true}
        />
      ) : contextValue && contextValue.config ? (
        // Si no hay contexto pero tenemos contextValue válido con config, proporcionar uno temporal
        <QgisConfigContext.Provider value={contextValue}>
          <Form 
            layerName={layerName} 
            featureId={featureId}
            readOnly={true}
          />
        </QgisConfigContext.Provider>
      ) : (
        // Si no hay config válido, mostrar error
        <div className="feature-attributes-dialog__error">
          <p>{translate('ui.map.attributes.error.missingData') || 'Faltan datos necesarios para mostrar los atributos'}</p>
        </div>
      )}
    </div>
  );

  // Renderizar el modal fuera del popup usando Portal
  return createPortal(
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={dialogTitle}
      size="large"
      lang={finalLanguage}
      className="feature-attributes-dialog"
    >
      {dialogContent}
    </Modal>,
    document.body
  );
};

FeatureAttributesDialog.propTypes = {
  /** Si el diálogo está abierto */
  isOpen: PropTypes.bool.isRequired,
  /** Función para cerrar el diálogo */
  onClose: PropTypes.func.isRequired,
  /** Nombre de la capa */
  layerName: PropTypes.string.isRequired,
  /** Feature a mostrar */
  feature: PropTypes.object.isRequired,
  /** Idioma para las traducciones */
  language: PropTypes.string,
  /** Configuración QGIS (opcional, se usa del contexto si no se proporciona) */
  config: PropTypes.object,
  /** URL del servicio QGIS (opcional, se usa del contexto si no se proporciona) */
  qgsUrl: PropTypes.string,
  /** Ruta del proyecto QGIS (opcional, se usa del contexto si no se proporciona) */
  qgsProjectPath: PropTypes.string,
  /** Token de autenticación (opcional, se usa del contexto si no se proporciona) */
  token: PropTypes.string,
  /** Función de traducción (opcional, se usa del contexto si no se proporciona) */
  t: PropTypes.func,
  /** Gestor de notificaciones (opcional, se usa del contexto si no se proporciona) */
  notificationManager: PropTypes.object
};

export default FeatureAttributesDialog;

