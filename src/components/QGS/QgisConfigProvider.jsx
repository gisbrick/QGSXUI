import React from 'react';
import PropTypes from 'prop-types';
import { QgisConfigContext } from './QgisConfigContext';
import { useUITranslation } from '../../hooks/useTranslation';
import { LoadingQGS, NotificationsQGS } from '../UI_QGS';
import { fetchQgisConfig } from '../../services/qgisConfigFetcher';
import { useNotifications } from './hooks/useNotifications';
import { useQgisTranslations } from './hooks/useQgisTranslations';
import { useQgisRelations } from './hooks/useQgisRelations';



/**
 * Proveedor de contexto para la configuración de QGIS
 * 
 * Este componente proporciona la configuración del servidor QGIS, traducciones,
 * notificaciones y relaciones a todos los componentes hijos que lo consuman.
 * 
 * @param {Object} props - Propiedades del componente
 * @param {string} props.qgsUrl - URL del servicio QGIS Server
 * @param {string} props.qgsProjectPath - Ruta del archivo de proyecto QGIS (.qgs o .qgz)
 * @param {string} props.language - Código del idioma (ej: 'es', 'en', 'ca', 'fr')
 * @param {string} props.token - Token de autenticación opcional
 * @param {React.ReactNode} props.children - Componentes hijos que consumirán el contexto
 */
const QgisConfigProvider = ({ qgsUrl, qgsProjectPath, language, token, children }) => {
  // Estado de la configuración del proyecto QGIS
  const [config, setConfig] = React.useState(null);

  // Hook para gestionar traducciones
  const translations = useQgisTranslations(language);
  const { t } = useUITranslation(language, translations);

  // Hook para gestionar notificaciones
  const { notifications, notificationManager } = useNotifications();

  // Hook para cargar relaciones del proyecto
  const { relations, relationsLoaded } = useQgisRelations(config, qgsUrl, qgsProjectPath, token);


  /**
   * Valor del contexto que se proporciona a los componentes hijos
   * Se memoiza para evitar recreaciones innecesarias
   */
  const contextValue = React.useMemo(() => ({
    config,                    // Configuración del proyecto QGIS (UConfig)
    qgsUrl,                    // URL del servicio QGIS Server
    qgsProjectPath,            // Ruta del archivo de proyecto QGIS
    language,                  // Código del idioma actual
    relations,                 // Relaciones cargadas del proyecto QGIS
    token,                     // Token de autenticación (opcional)
    loading: false,            // Estado de carga (siempre false, se maneja con config)
    t,                         // Función de traducción
    translations,              // Objeto completo de traducciones
    notificationManager        // Manager de notificaciones
  }), [config, qgsUrl, qgsProjectPath, language, relations, token, t, translations, notificationManager]);

  /**
   * Efecto para cargar la configuración del proyecto QGIS al montar el componente
   */
  React.useEffect(() => {
    fetchQgisConfig(qgsUrl, qgsProjectPath, token)
      .then(config => {
        setConfig(config);
      })
      .catch(error => {
        console.error('Error al cargar configuración QGIS:', error);
        notificationManager.addNotification({
          title: t('ui.qgis.error'),
          text: t('ui.qgis.errorFetchingConfig'),
          level: 'error'
        });
      });
  }, [qgsUrl, qgsProjectPath, token, notificationManager, t]);




  return (
    <QgisConfigContext.Provider value={contextValue}>
      {/* Componente de notificaciones */}
      <NotificationsQGS
        notifications={notifications}
        removeNotification={notificationManager.removeNotification}
      />
      
      {/* Renderizar hijos solo cuando la configuración y relaciones estén cargadas */}
      {config && relationsLoaded && children}
      
      {/* Mostrar indicador de carga mientras se carga la configuración */}
      {!config && !relationsLoaded && qgsUrl && qgsProjectPath && (
        <LoadingQGS />
      )}
      
      {/* Mostrar error si faltan parámetros de configuración */}
      {!config && (!qgsUrl || !qgsProjectPath) && (
        <div style={{ padding: '20px', color: '#d32f2f', textAlign: 'center' }}>
          {t('ui.qgis.configurationNotDefined')}
        </div>
      )}
    </QgisConfigContext.Provider>
  );
};


QgisConfigProvider.propTypes = {
  qgsUrl: PropTypes.string.isRequired,        // URL del servicio QGIS Server
  qgsProjectPath: PropTypes.string.isRequired, // Ruta del archivo de proyecto QGIS
  language: PropTypes.string.isRequired,     // Código del idioma (ej: 'es', 'en', 'ca', 'fr')
  token: PropTypes.string,                    // Token de autenticación opcional
  children: PropTypes.node.isRequired         // Componentes hijos que consumirán el contexto
};

export default QgisConfigProvider;
