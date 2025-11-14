import React, { useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import Modal from '../../../UI/Modal/Modal';
import Form from '../../../QGS/Form/Form';
import { useForm } from '../../../QGS/Form/FormProvider';
import { QgisConfigContext } from '../../../QGS/QgisConfigContext';
import { useUITranslation } from '../../../../hooks/useTranslation';
import './FeatureAttributesDialog.css';

// Importar traducciones
import enTranslations from '../../../../locales/en/translation.json';
import esTranslations from '../../../../locales/es/translation.json';

/**
 * Componente para mostrar los atributos de una feature en modo lectura o edición
 * Se abre como un diálogo modal y muestra el layout del formulario
 */
const FeatureAttributesDialog = ({
  isOpen,
  onClose,
  layerName,
  feature,
  readOnly = true,
  language = 'es',
  // Props opcionales para cuando se renderiza fuera del contexto React
  config: configProp = null,
  qgsUrl: qgsUrlProp = null,
  qgsProjectPath: qgsProjectPathProp = null,
  token: tokenProp = null,
  t: tProp = null,
  notificationManager: notificationManagerProp = null,
  onSave = null // Callback cuando se guarda exitosamente (solo en modo edición)
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
      return readOnly ? 'Atributos' : 'Editar atributos';
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
    
    const baseTitle = readOnly ? 'Atributos' : 'Editar atributos';
    return `${baseTitle}${layerLabel ? ` - ${layerLabel}` : ''}${featureLabel ? ` - ${featureLabel}` : ''}`;
  }, [layerName, feature, featureId, config, readOnly]);

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

  // Ref para almacenar el elemento del footer de forma estable
  const footerActionsRef = React.useRef(null);
  const footerActionsKeyRef = React.useRef(null);
  const [footerActions, setFooterActions] = React.useState(null);
  
  // Callback ref estable para recibir el elemento del footer sin causar re-renders
  const setFooterActionsCallbackRef = React.useCallback((element, key) => {
    // Comparar por key en lugar de por referencia del objeto
    if (footerActionsKeyRef.current !== key) {
      footerActionsKeyRef.current = key;
      footerActionsRef.current = element;
      // Usar requestAnimationFrame para evitar actualizaciones síncronas
      requestAnimationFrame(() => {
        setFooterActions(element);
      });
    }
  }, []);

  // Función para renderizar los botones del formulario (solo en modo edición)
  // Esta función se ejecuta dentro del FormProvider
  // DEBE IR ANTES DE CUALQUIER RETURN para cumplir con las reglas de hooks
  const renderFormActions = React.useCallback(() => {
    if (readOnly) {
      return null;
    }

    const FormActionsComponent = () => {
      const {
        canSave,
        handleSave,
        handleCancel,
        values,
        context
      } = useForm();
      
      // Usar useRef para mantener una referencia a los valores actuales
      const valuesRef = React.useRef(values);
      
      // Actualizar la referencia cuando cambien los valores
      React.useEffect(() => {
        valuesRef.current = values;
      }, [values]);
      
      // Obtener la función de traducción directamente del contexto QGIS
      const qgisContext = useContext(QgisConfigContext);
      
      // Crear función de traducción con fallbacks apropiados
      // La función t del contexto no funciona correctamente (devuelve cadenas vacías),
      // así que accedemos directamente a las traducciones
      const translateFunction = React.useMemo(() => {
        // Función helper para buscar en las traducciones anidadas
        const getTranslation = (translations, key) => {
          if (!translations || !key) return key;
          
          const keys = key.split('.');
          let result = translations;
          
          for (const k of keys) {
            if (result && typeof result === 'object' && k in result) {
              result = result[k];
            } else {
              return key; // Devolver la clave original si no se encuentra
            }
          }
          
          if (typeof result === 'string' && result !== '') {
            return result;
          }
          
          return key;
        };
        
        // Prioridad: 1) traducciones directas del contexto, 2) función del closure, 3) función que devuelve la clave
        if (qgisContext.translations) {
          return (key) => {
            const value = getTranslation(qgisContext.translations, key);
            return value;
          };
        }
        if (typeof translate === 'function') {
          return (key) => {
            const value = translate(key);
            if (value && value !== '' && value !== null && value !== undefined && value !== key) {
              return value;
            }
            return key;
          };
        }
        // Fallback: devolver la clave directamente
        return (key) => key;
      }, [qgisContext.translations, translate]);
      
      const [isSaving, setIsSaving] = useState(false);
      
      const handleSubmit = React.useCallback(async (e) => {
        e.preventDefault();
        if (!canSave || isSaving) return;
        
        // Obtener los valores actuales del ref (que se actualiza con useEffect)
        const currentValues = valuesRef.current;
        
        setIsSaving(true);
        try {
          // Usar currentValues para asegurar que tenemos los valores más recientes
          await handleSave(currentValues, context);
          // Notificación de éxito se maneja en el handler
        } catch (error) {
          // Error ya manejado en el handler
          console.error('Error al guardar:', error);
        } finally {
          setIsSaving(false);
        }
      }, [canSave, isSaving, handleSave, context]);
      
      const handleCancelClick = React.useCallback(() => {
        // Primero cancelar el formulario (resetea valores)
        handleCancel();
        // Luego cerrar el diálogo
        if (onClose && typeof onClose === 'function') {
          onClose();
        }
      }, [handleCancel, onClose]);
      
      // Usar useRef para mantener referencias estables y evitar loops
      const handleSubmitRef = React.useRef(handleSubmit);
      const handleCancelClickRef = React.useRef(handleCancelClick);
      
      // Actualizar refs cuando cambien las funciones
      React.useEffect(() => {
        handleSubmitRef.current = handleSubmit;
        handleCancelClickRef.current = handleCancelClick;
      }, [handleSubmit, handleCancelClick]);
      
      // Memoizar el elemento de acciones basándose en canSave, isSaving y translateFunction
      const actionsElement = React.useMemo(() => {
        const saveKey = isSaving ? 'ui.common.saving' : 'ui.common.save';
        const cancelKey = 'ui.common.cancel';
        
        const saveText = translateFunction(saveKey);
        const cancelText = translateFunction(cancelKey);
        
        return (
          <div className="feature-attributes-dialog__footer-actions">
            <button 
              type="button"
              onClick={(e) => handleSubmitRef.current(e)}
              disabled={!canSave || isSaving}
              className="qgs-form-button qgs-form-button--primary"
            >
              {saveText || 'Guardar'}
            </button>
            <button 
              type="button" 
              onClick={() => handleCancelClickRef.current()}
              className="qgs-form-button qgs-form-button--secondary"
            >
              {cancelText || 'Cancelar'}
            </button>
          </div>
        );
      }, [canSave, isSaving, translateFunction]);
      
      // Usar el callback ref para pasar el elemento al padre
      // Usar una key única basada en canSave e isSaving para comparar
      const actionsKey = `${canSave}-${isSaving}`;
      
      // Usar useLayoutEffect solo cuando cambien canSave o isSaving
      // No incluir setFooterActionsCallbackRef en las dependencias porque es estable
      React.useLayoutEffect(() => {
        if (setFooterActionsCallbackRef) {
          setFooterActionsCallbackRef(actionsElement, actionsKey);
        }
        // eslint-disable-next-line react-hooks/exhaustive-deps
      }, [canSave, isSaving]);

      // No renderizar nada aquí, los botones se renderizan en el footer
      return null;
    };

    return <FormActionsComponent />;
  }, [readOnly, translate, setFooterActionsCallbackRef]);

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

  // Contenido del diálogo - usar el componente Form de QGS
  // SIEMPRE usar el Provider para asegurar que el Form tenga acceso al contexto
  const dialogContent = (
    <div className="feature-attributes-dialog__content">
      {qgisContext && qgisContext.config ? (
        // Si hay contexto con config, usar directamente el Form
        <Form 
          layerName={layerName} 
          featureId={featureId}
          readOnly={readOnly}
          onSave={onSave}
          hideActions={true}
          renderActions={renderFormActions}
        />
      ) : contextValue && contextValue.config ? (
        // Si no hay contexto pero tenemos contextValue válido con config, proporcionar uno temporal
        <QgisConfigContext.Provider value={contextValue}>
          <Form 
            layerName={layerName} 
            featureId={featureId}
            readOnly={readOnly}
            onSave={onSave}
            hideActions={true}
            renderActions={renderFormActions}
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

  // Footer del diálogo con los botones (solo en modo edición)
  const dialogFooter = !readOnly ? footerActions : null;

  // Renderizar el modal fuera del popup usando Portal
  return createPortal(
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={dialogTitle}
      size="large"
      lang={finalLanguage}
      className="feature-attributes-dialog"
      footer={dialogFooter}
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
  /** Si está en modo solo lectura (true) o edición (false) */
  readOnly: PropTypes.bool,
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
  notificationManager: PropTypes.object,
  /** Callback cuando se guarda exitosamente (solo en modo edición) */
  onSave: PropTypes.func
};

export default FeatureAttributesDialog;


