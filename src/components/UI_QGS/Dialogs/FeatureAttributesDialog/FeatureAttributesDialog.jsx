import React, { useContext, useMemo, useState } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import Modal from '../../../UI/Modal/Modal';
import Form from '../../../QGS/Form/Form';
import { useForm } from '../../../QGS/Form/FormProvider';
import { QgisConfigContext } from '../../../QGS/QgisConfigContext';
import { useUITranslation } from '../../../../hooks/useTranslation';
import UnsavedChangesDialog from '../../../UI/UnsavedChangesDialog/UnsavedChangesDialog';
import './FeatureAttributesDialog.css';

// Importar traducciones base
import enTranslations from '../../../../locales/en/translation.json';
import esTranslations from '../../../../locales/es/translation.json';
import { getTranslationsSync } from '../../../../utilities/translationsLoader';
import { normalizeLanguage } from '../../../../config/languages';

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
  onSave = null, // Callback cuando se guarda exitosamente (solo en modo edición)
  onFormValuesChange = null
}) => {
  // TODOS LOS HOOKS DEBEN IR AL PRINCIPIO, ANTES DE CUALQUIER RETURN CONDICIONAL
  const qgisContext = useContext(QgisConfigContext);
  const contextT = qgisContext?.t || tProp;
  // CRÍTICO: Usar SOLO el idioma del contexto QGIS, ignorar la prop language
  // La prop language puede estar desactualizada, pero el contexto siempre tiene el idioma correcto del mapa
  // Usar useMemo para que se actualice cuando cambie el idioma en el contexto
  const finalLanguage = useMemo(() => {
    // Priorizar siempre el contexto sobre la prop, porque el contexto se actualiza cuando cambia el idioma del mapa
    const lang = qgisContext?.language || language || 'es';
    return lang;
  }, [qgisContext?.language, language]);
  
  // Usar props si están disponibles, sino usar contexto
  const config = configProp || qgisContext?.config;
  const qgsUrl = qgsUrlProp || qgisContext?.qgsUrl;
  const qgsProjectPath = qgsProjectPathProp || qgisContext?.qgsProjectPath;
  const token = tokenProp || qgisContext?.token;
  const notificationManager = notificationManagerProp || qgisContext?.notificationManager;

  // Crear traducciones - DEBE IR ANTES DE CUALQUIER RETURN
  // Reaccionar a cambios en el idioma del contexto
  // IMPORTANTE: Usar el idioma del contexto QGIS directamente, no finalLanguage que puede estar desactualizado
  const translations = useMemo(() => {
    // Priorizar el idioma del contexto QGIS sobre finalLanguage
    const langToUse = normalizeLanguage(qgisContext?.language || finalLanguage || 'es');
    const availableTranslations = { es: esTranslations, en: enTranslations };
    const trans = getTranslationsSync(langToUse, availableTranslations);
    return trans;
  }, [finalLanguage, qgisContext?.language]);
  const { t: tempT } = useUITranslation(finalLanguage, translations);
  
  // Usar la función de traducción del contexto si está disponible, sino usar la temporal
  // Priorizar siempre la función del contexto para que use el idioma correcto
  // Usar useMemo para que se actualice cuando cambie el idioma o la función de traducción
  const finalT = useMemo(() => {
    return contextT || tempT;
  }, [contextT, tempT, finalLanguage]);

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

  // Función de traducción - debe reaccionar a cambios en el idioma
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
    [finalT] // Reaccionar a cambios en la función de traducción (que ya incluye el idioma)
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
  
  // Estado para controlar el diálogo de cambios sin guardar
  const [showUnsavedChangesDialog, setShowUnsavedChangesDialog] = useState(false);
  const [pendingClose, setPendingClose] = useState(false);
  
  // Referencia para acceder al estado isDirty del formulario
  const isDirtyRef = React.useRef(false);
  
  // Referencias para acceder a las funciones del formulario
  const handleSaveRef = React.useRef(null);
  const valuesRef = React.useRef({});
  const contextRef = React.useRef(null);
  const onFormValuesChangeRef = React.useRef(onFormValuesChange);
  React.useEffect(() => {
    onFormValuesChangeRef.current = onFormValuesChange;
  }, [onFormValuesChange]);
  
  // Referencias para las funciones de control del diálogo de cambios sin guardar
  const showUnsavedDialogRef = React.useRef(null);
  const setPendingCloseRef = React.useRef(null);
  
  // Actualizar las referencias cuando cambien los estados usando useEffect
  React.useEffect(() => {
    showUnsavedDialogRef.current = setShowUnsavedChangesDialog;
    setPendingCloseRef.current = setPendingClose;
  }, []);
  
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
  
  // Callback para actualizar el estado isDirty desde el formulario
  const setIsDirtyCallback = React.useCallback((isDirty) => {
    isDirtyRef.current = isDirty;
  }, []);
  
  // Callback para actualizar las referencias del formulario
  const setFormRefsCallback = React.useCallback((handleSave, values, context) => {
    handleSaveRef.current = handleSave;
    valuesRef.current = values;
    contextRef.current = context;
    if (onFormValuesChangeRef.current) {
      onFormValuesChangeRef.current(values);
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
        isDirty,
        context
      } = useForm();
      
      // Actualizar la referencia isDirty cuando cambie
      React.useEffect(() => {
        setIsDirtyCallback(isDirty);
      }, [isDirty, setIsDirtyCallback]);
      
      const formValuesRef = React.useRef(values);
      
      React.useEffect(() => {
        formValuesRef.current = values;
        if (setFormRefsCallback && handleSave && context) {
          setFormRefsCallback(handleSave, values, context);
        }
      }, [values, handleSave, context, setFormRefsCallback]);
      
      // Obtener la función de traducción directamente del contexto QGIS
      // Usar el contexto del componente padre (FeatureAttributesDialog) que ya tiene acceso a finalLanguage
      const innerQgisContext = useContext(QgisConfigContext);
      
      // Crear función de traducción con fallbacks apropiados
      // Función de traducción que prioriza el contexto QGIS y reacciona a cambios de idioma
      // Usar finalLanguage del closure del componente padre para asegurar que reacciona a cambios
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
        
        // Prioridad: 1) traducciones directas del contexto (usando el idioma correcto), 2) función t del contexto, 3) función del closure, 4) función que devuelve la clave
        // Usar el contexto interno primero, luego el del closure
        const contextToUse = innerQgisContext || qgisContext;
        
        // Obtener las traducciones correctas según el idioma del contexto
        // Esto es crítico porque las traducciones deben corresponder al idioma actual del mapa
        const contextLanguage = contextToUse?.language || finalLanguage || 'es';
        const availableTranslations = { es: esTranslations, en: enTranslations };
        const contextTranslations = getTranslationsSync(contextLanguage, availableTranslations);
        
        return (key) => {
          // PRIORIDAD 1: Usar las traducciones correctas según el idioma del contexto
          // Esto asegura que siempre usemos el idioma correcto, incluso si el contexto tiene traducciones desactualizadas
          const directValue = getTranslation(contextTranslations, key);
          if (directValue && directValue !== key) {
            return directValue;
          }
          
          // PRIORIDAD 2: Intentar con las traducciones del contexto (pueden estar desactualizadas)
          if (contextToUse?.translations) {
            const value = getTranslation(contextToUse.translations, key);
            if (value && value !== key) {
              return value;
            }
          }
          
          // PRIORIDAD 3: Intentar con la función t del contexto
          if (contextToUse?.t && typeof contextToUse.t === 'function') {
            const value = contextToUse.t(key);
            if (value && value !== '' && value !== null && value !== undefined && value !== key) {
              return value;
            }
          }
          
          // PRIORIDAD 4: Intentar con la función translate del closure
          if (typeof translate === 'function') {
            const value = translate(key);
            if (value && value !== '' && value !== null && value !== undefined && value !== key) {
              return value;
            }
          }
          
          // Fallback: devolver la clave directamente
          return key;
        };
      }, [innerQgisContext?.translations, innerQgisContext?.t, innerQgisContext?.language, qgisContext?.translations, qgisContext?.t, qgisContext?.language, translate, finalLanguage, esTranslations, enTranslations]);
      
      const [isSaving, setIsSaving] = useState(false);
      const [isSaveLocked, setIsSaveLocked] = useState(false);
      
      // Desbloquear el guardado cuando se detecten cambios nuevos
      React.useEffect(() => {
        if (isSaveLocked && isDirty) {
          setIsSaveLocked(false);
        }
      }, [isSaveLocked, isDirty]);
      
      const handleSubmit = React.useCallback(async (e) => {
        e.preventDefault();
        console.log('[FeatureAttributesDialog] handleSubmit - INICIO', {
          canSave,
          isSaving,
          isSaveLocked,
          valuesKeys: Object.keys(values || {}),
          context
        });
        
        if (!canSave || isSaving || isSaveLocked) {
          console.log('[FeatureAttributesDialog] handleSubmit - BLOQUEADO', {
            canSave,
            isSaving,
            isSaveLocked
          });
          return;
        }
        
        setIsSaving(true);
        try {
          console.log('[FeatureAttributesDialog] handleSubmit - Llamando handleSave', {
            values,
            context
          });
          // CRÍTICO: Usar values directamente, no formValuesRef.current
          // formValuesRef.current puede estar desactualizado
          await handleSave(values, context);
          console.log('[FeatureAttributesDialog] handleSubmit - handleSave completado');
          // Notificación de éxito se maneja en el handler
          // Bloquear el botón hasta que haya nuevos cambios
          setIsSaveLocked(true);
        } catch (error) {
          // Error ya manejado en el handler
          console.error('[FeatureAttributesDialog] handleSubmit - Error al guardar:', error);
        } finally {
          setIsSaving(false);
        }
      }, [canSave, isSaving, isSaveLocked, handleSave, context, values]);
      
      const handleCancelClick = React.useCallback(() => {
        // Verificar si hay cambios pendientes antes de cerrar
        if (isDirty) {
          // Hay cambios pendientes, mostrar diálogo de confirmación
          if (showUnsavedDialogRef.current) {
            showUnsavedDialogRef.current(true);
          }
          if (setPendingCloseRef.current) {
            setPendingCloseRef.current(true);
          }
        } else {
          // No hay cambios, cerrar directamente
          handleCancel();
          if (onClose && typeof onClose === 'function') {
            onClose();
          }
        }
      }, [handleCancel, onClose, isDirty]);
      
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
        const cancelKey = 'ui.common.exit';
        const saveText = translateFunction(saveKey);
        const cancelText = translateFunction(cancelKey);
        
        return (
          <div className="feature-attributes-dialog__footer-actions">
            <button 
              type="button"
              onClick={(e) => {
                console.log('[FeatureAttributesDialog] Botón Guardar - CLICK', {
                  canSave,
                  isSaving,
                  isSaveLocked,
                  handleSubmitRef: !!handleSubmitRef.current
                });
                handleSubmitRef.current(e);
              }}
              disabled={!canSave || isSaving || isSaveLocked}
              className="qgs-form-button qgs-form-button--primary"
            >
              <i className="fas fa-floppy-disk" style={{ marginRight: '8px' }} />
              {saveText || saveKey}
            </button>
            <button 
              type="button" 
              onClick={() => handleCancelClickRef.current()}
              className="qgs-form-button qgs-form-button--secondary"
            >
              <i className="fas fa-xmark" style={{ marginRight: '8px' }} />
              {cancelText || cancelKey}
            </button>
          </div>
        );
      }, [canSave, isSaving, isSaveLocked, translateFunction, finalLanguage]);
      
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
      }, [canSave, isSaving, isSaveLocked]);

      // No renderizar nada aquí, los botones se renderizan en el footer
      return null;
    };

    return <FormActionsComponent />;
  }, [readOnly, translate, setFooterActionsCallbackRef, finalLanguage, qgisContext?.language, qgisContext?.t, qgisContext?.translations]);

  // Footer del diálogo con los botones (solo en modo edición)
  const dialogFooter = !readOnly ? footerActions : null;
  
  // Función para manejar el cierre del Modal (desde la X)
  const handleModalClose = React.useCallback(() => {
    // Si no está en modo edición, cerrar directamente
    if (readOnly) {
      if (onClose && typeof onClose === 'function') {
        onClose();
      }
      return;
    }
    
    // Verificar si hay cambios pendientes
    if (isDirtyRef.current) {
      // Hay cambios pendientes, mostrar diálogo de confirmación
      setShowUnsavedChangesDialog(true);
      setPendingClose(true);
    } else {
      // No hay cambios, cerrar directamente
      if (onClose && typeof onClose === 'function') {
        onClose();
      }
    }
  }, [onClose, readOnly]);
  
  // Handler para guardar desde el diálogo de cambios sin guardar
  const handleUnsavedSave = React.useCallback(async () => {
    setShowUnsavedChangesDialog(false);
    
    // Si tenemos acceso a handleSave, guardar y luego cerrar
    if (handleSaveRef.current && valuesRef.current && contextRef.current) {
      try {
        await handleSaveRef.current(valuesRef.current, contextRef.current);
        // Después de guardar exitosamente, cerrar el diálogo
        if (pendingClose) {
          setPendingClose(false);
          if (onClose && typeof onClose === 'function') {
            onClose();
          }
        }
      } catch (error) {
        // Error ya manejado en el handler, solo no cerramos el diálogo
        console.error('Error al guardar desde diálogo de cambios sin guardar:', error);
      }
    } else {
      // Si no tenemos acceso, simplemente cerrar el diálogo de confirmación
      // El usuario puede usar el botón Guardar del formulario
      setPendingClose(false);
    }
  }, [onClose, pendingClose]);
  
  // Handler para salir sin guardar desde el diálogo de cambios sin guardar
  const handleUnsavedExit = React.useCallback(() => {
    setShowUnsavedChangesDialog(false);
    // Si había un cierre pendiente, ejecutarlo ahora
    if (pendingClose) {
      setPendingClose(false);
      if (onClose && typeof onClose === 'function') {
        onClose();
      }
    }
  }, [onClose, pendingClose]);

  // AHORA SÍ PODEMOS HACER RETURNS CONDICIONALES
  if (!isOpen) {
    return null;
  }

  // Validar que tenemos los datos necesarios
  if (!layerName || !feature) {
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
          feature={feature} // Pasar la feature completa para que incluya la geometría
          readOnly={readOnly}
          onSave={onSave}
          hideActions={true}
          renderActions={renderFormActions}
          onValuesChange={(values) => {
            if (onFormValuesChangeRef.current) {
              onFormValuesChangeRef.current(values || {});
            }
          }}
        />
      ) : contextValue && contextValue.config ? (
        // Si no hay contexto pero tenemos contextValue válido con config, proporcionar uno temporal
        <QgisConfigContext.Provider value={contextValue}>
          <Form 
            layerName={layerName} 
            featureId={featureId}
            feature={feature} // Pasar la feature completa para que incluya la geometría
            readOnly={readOnly}
            onSave={onSave}
            hideActions={true}
            renderActions={renderFormActions}
            onValuesChange={(values) => {
              if (onFormValuesChangeRef.current) {
                onFormValuesChangeRef.current(values || {});
              }
            }}
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
    <>
      <Modal
        isOpen={isOpen}
        onClose={handleModalClose}
        title={dialogTitle}
        size="large"
        lang={finalLanguage}
        className="feature-attributes-dialog"
        footer={dialogFooter}
      >
        {dialogContent}
      </Modal>
      {!readOnly && (
        <UnsavedChangesDialog
          open={showUnsavedChangesDialog}
          onSave={handleUnsavedSave}
          onExit={handleUnsavedExit}
          lang={finalLanguage}
          loading={false}
        />
      )}
    </>,
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
  onSave: PropTypes.func,
  /** Callback opcional para observar cambios en los valores del formulario */
  onFormValuesChange: PropTypes.func,
};

export default FeatureAttributesDialog;


