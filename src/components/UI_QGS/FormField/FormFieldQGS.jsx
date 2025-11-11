import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import './FormFieldQGS.css';
import { QgisConfigContext } from '../../QGS';

const FormFieldQGS = ({layerName, featureId, field_idx, field_name}) => {

  // Obtener configuración QGIS y función de traducción del contexto
    const { config, t, notificationManager } = useContext(QgisConfigContext);
    
    // Verificar que hay configuración disponible
    if (!config) {
      return <div>{t('ui.qgis.loading')}</div>;
    }


  return (
  <div className="form-field-qgs">
      TODO FormFieldQGS {field_idx} {field_name}
  </div>
  );
};

FormFieldQGS.propTypes = {
  layerName: PropTypes.string.isRequired, // ID de la capa (key en layers)
  featureId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]), // ID de la feature (opcional)
  field_idx: PropTypes.number, // Índice del campo en el formulario
  field_name: PropTypes.string, // Nombre del campo en el formulario
};  

export default FormFieldQGS;