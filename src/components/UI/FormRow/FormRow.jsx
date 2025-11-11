import React from 'react';
import PropTypes from 'prop-types';
import './FormRow.css';

/**
 * Componente simple para representar una fila de campos en el formulario
 * Todos los campos se muestran en la misma línea horizontal
 */
const FormRow = ({ label, children, showLabel = true }) => {
  return (
    <div className="form-row">
      {showLabel && label && (
        <div className="form-row__label">
          {label}
        </div>
      )}
      <div className="form-row__fields">
        {children}
      </div>
    </div>
  );
};

FormRow.propTypes = {
  label: PropTypes.string,
  children: PropTypes.node,
  showLabel: PropTypes.bool
};

export default FormRow;
