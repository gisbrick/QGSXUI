import React, { useContext, useState } from 'react';
import PropTypes from 'prop-types';
import TextControl from '../../UI_QGS_Form/TextControl/TextControl';
import CheckboxControl from '../../UI_QGS_Form/CheckboxControl/CheckboxControl';
import ValueMapControl from '../../UI_QGS_Form/ValueMapControl/ValueMapControl';
import { QgisConfigContext } from '../QgisConfigContext';
import QgisConfigProvider from '../QgisConfigProvider';
import { FormProvider, useForm } from './FormProvider';
import './Form.css';
import { FormLayoutQGS, LoadingQGS } from '../../UI_QGS';

/**
 * Componente de formulario dinámico para edición de features de QGIS
 * Genera campos de formulario basados en la configuración del proyecto QGIS
 */
const Form = ({ layerName, featureId, readOnly = false, onSave = null, hideActions = false, renderActions = null }) => {
  // Obtener configuración QGIS y función de traducción del contexto
  const { config, t, notificationManager } = useContext(QgisConfigContext);
  
  // Verificar que hay configuración disponible
  if (!config) {
    return <LoadingQGS />;
  }

  return (
    <FormProvider layerName={layerName} featureId={featureId} readOnly={readOnly} onSave={onSave}>
      <Form_ layerName={layerName} featureId={featureId} hideActions={hideActions} />
      {renderActions && renderActions()}
    </FormProvider>

  );
};

Form.propTypes = {
  layerName: PropTypes.string.isRequired,
  featureId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  readOnly: PropTypes.bool,
  onSave: PropTypes.func,
  hideActions: PropTypes.bool,
  renderActions: PropTypes.func
};

export { QgisConfigProvider };
export default Form;


const Form_ = ({layerName, featureId, hideActions = false }) => {

  const { t } = useContext(QgisConfigContext);
  const {
    layer,
    isNewFeature,
    feature,
    config,
    values,
    errors,
    readOnly,
    setValue,
    validateField,
    isValid,
    isDirty,
    canSave,
    handleSave,
    handleCancel,
    context
  } = useForm();

  const [isSaving, setIsSaving] = useState(false);
  const translate = typeof t === 'function' ? t : (key) => key;

  const onSubmit = async (e) => {
    e.preventDefault();
    if (!canSave || isSaving) return;

    setIsSaving(true);
    try {
      await handleSave(values, context);
      // Notificación de éxito se maneja en el handler
    } catch (error) {
      // Error ya manejado en el handler
      console.error('Error al guardar:', error);
    } finally {
      setIsSaving(false);
    }
  };

  const onCancel = () => {
    handleCancel();
  };

  return (
    <form onSubmit={onSubmit} className="qgs-form">    
      {layer && <FormLayoutQGS layerName={layerName} featureId={featureId} />}
      {/* Iteramos por cada campo definido en la configuración */}
      {/*layer && layer.fields.map(field => (
        <div key={field.name}>
          <label>{field.label}</label>
          <input
            type={field.type}
            value={values[field.name] || ''}
            readOnly={readOnly}
            onChange={e => {
              const rawValue = e.target.value;

              // Convertimos a número si el tipo lo requiere
              const value = field.type === 'number' ? +rawValue : rawValue;

              // Actualizamos el valor y validamos
              setValue(field.name, value);
              validateField(field.name, value);
            }}
          />
          {<>Mostrar mensaje de error si existe </>}
          {errors[field.name] && (
            <span style={{ color: 'red' }}>{errors[field.name]}</span>
          )}
        </div>
      ))
        */}

      {/* Botones de acción - solo mostrar si no está en modo solo lectura y no se ocultan */}
      {!readOnly && !hideActions ? (
        <div className="qgs-form-actions">
          <button 
            type="submit" 
            disabled={!canSave || isSaving}
            className="qgs-form-button qgs-form-button--primary"
          >
            {isSaving ? translate('ui.common.saving') : translate('ui.common.save')}
          </button>
          <button 
            type="button" 
            onClick={onCancel}
            className="qgs-form-button qgs-form-button--secondary"
          >
            {translate('ui.common.cancel')}
          </button>
        </div>
      ) : null}
    </form>
  )
}