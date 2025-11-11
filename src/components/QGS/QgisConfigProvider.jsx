import React from 'react';
import PropTypes from 'prop-types';
import { QgisConfigContext } from './QgisConfigContext';
import { useUITranslation } from '../../hooks/useTranslation';
import Spinner from '../UI/Spinner/Spinner';

// Importar traducciones
import enTranslations from '../../locales/en/translation.json';
import esTranslations from '../../locales/es/translation.json';
import { LoadingQGS, NotificationsQGS } from '../UI_QGS';
import { fetchQgisConfig } from '../../services/qgisConfigFetcher';
import { fetchAllFeatures } from '../../services/qgisWFSFetcher';



/**
 * Proveedor de contexto para la configuración de QGIS
 * Proporciona configuración del servidor QGIS para todos los componentes hijos
 */
const QgisConfigProvider = ({ qgsUrl, qgsProjectPath, language, token, children }) => {

  const [config, setConfig] = React.useState();

  // Obtener traducciones según el idioma
  const translations = language === 'es' ? esTranslations : enTranslations;
  const { t } = useUITranslation(language, translations);

  // Notificación manager
  const [notifications, setNotifications] = React.useState([]);

  const [relationsLoaded, setRelationsLoaded] = React.useState(false);
  const [relations, setRelations] = React.useState([]);

  // Método para añadir una notificación
  const addNotification = ({ title, text, level }) => {
    console.log("addNotification level:", level);
    console.log("addNotification title:", title);
    console.log("addNotification text:", text);
    let id = Date.now() + Math.random();
    setNotifications(prev => [
      ...prev,
      {
        id: id,
        title,
        text,
        level // 'info', 'warn', 'error'
      }
    ]);

    // Eliminar la notificación después de 5 segundos
    setTimeout(() => {
      removeNotification(id);
    }, 5000);
  };

  // Método para eliminar una notificación (opcional)
  const removeNotification = (id) => {
    setNotifications(prev => prev.filter(n => n.id !== id));
  };

  // Exponer el manager en el contexto
  let notificationManager = {
    addNotification,
    removeNotification,
    notifications
  };


  // Crear el valor del contexto con la configuración proporcionada
  const contextValue = {
    config, // UConfig
    qgsUrl, // URL del servicio QGIS
    qgsProjectPath, // Path de proyecto QGIS
    language, // Idioma ('en' o 'es')   
    relations, // Relaciones cargadas del proyecto QGIS
    loading: false, // Estado de carga
    t, // Función de traducción disponible para todos los componentes hijos
    translations, // Traducciones completas disponibles para casos especiales
    notificationManager // Manager de notificaciones
  };

  React.useEffect(() => {
    fetchQgisConfig(qgsUrl, qgsProjectPath, token)
      .then(config => {
        setConfig(config);
      })
      .catch(error => {
        notificationManager.addNotification({
          title: t('ui.qgis.error'),
          text: t('ui.qgis.errorFetchingConfig'),
          level: 'error'
        });
      });
  }, []);


  React.useEffect(() => {
    if (config) {
      const layersArray = Object.values(config.layers || {});
      const relationPromises = [];

      for (const relationName in config.relations || {}) {
        const relation = config.relations[relationName];

        // Asociamos las capas correctamente
        relation.referencedLayer = layersArray.find(
          layer => layer.id === relation.referencedLayerId
        );
        relation.referencingLayer = layersArray.find(
          layer => layer.id === relation.referencingLayerId
        );

        if (!relation.referencingLayer) {
          console.warn('No se encontró la capa referenciada:', relation.referencingLayerId);
          continue; // Salta esta relación si falta la capa
        }

        // Creamos la promesa del fetch
        const promise = fetchAllFeatures(
          qgsUrl,
          qgsProjectPath,
          relation.referencingLayer.name
        ).then(values => {
          relation.referencingLayerValues = values;
          return relation;
        });

        relationPromises.push(promise);
      }

      Promise.all(relationPromises).then(resolvedRelations => {
        setRelations(resolvedRelations);
        setRelationsLoaded(true);
      });
    }

  }, [config]);


  return (
    <QgisConfigContext.Provider value={contextValue}>
      {/* Renderizar el componente de notificaciones */}
      <NotificationsQGS
        notifications={notifications}
        removeNotification={removeNotification}
      />
      {/* Renderizar los hijos del proveedor */}
      {config && relationsLoaded && children}
      {/* Renderizar el componente de carga */}
      {!config && !relationsLoaded && qgsUrl && qgsProjectPath && (
        <LoadingQGS></LoadingQGS>
      )}
      {/* Renderizar el componente de error */}
      {!config && (!qgsUrl || !qgsProjectPath) && (
        <div style={{ padding: '20px', color: '#d32f2f', textAlign: 'center' }}>
          {t('ui.qgis.configurationNotDefined')}
        </div>
      )}
    </QgisConfigContext.Provider>
  );
};


QgisConfigProvider.propTypes = {
  qgsUrl: PropTypes.string.isRequired, // URL del servicio QGIS
  qgsProjectPath: PropTypes.string.isRequired, //Nombre de proyecto QGIS
  language: PropTypes.oneOf(['en', 'es']).isRequired, // Idioma ('en' o 'es')
  token: PropTypes.string, // Token opcional para autenticación
  children: PropTypes.node.isRequired, // Componentes hijos que usarán el contexto
};

export default QgisConfigProvider;
