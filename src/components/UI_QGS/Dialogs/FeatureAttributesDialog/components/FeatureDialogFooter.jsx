import React from 'react';
import PropTypes from 'prop-types';

/**
 * Componente para el footer del diálogo con botones de acción
 * Renderiza los botones Guardar y Cancelar
 */
const FeatureDialogFooter = ({
  canSave,
  isSaving,
  isSaveLocked,
  onSave,
  onCancel,
  saveText,
  cancelText
}) => {
  if (!canSave && !isSaving) {
    return null;
  }
  
  return (
    <div className="feature-attributes-dialog__footer">
      <button
        type="button"
        onClick={onSave}
        disabled={!canSave || isSaving || isSaveLocked}
        className="qgs-form-button qgs-form-button--primary"
      >
        <i className="fas fa-floppy-disk" style={{ marginRight: '8px' }} />
        {saveText || 'Guardar'}
      </button>
      <button
        type="button"
        onClick={onCancel}
        className="qgs-form-button qgs-form-button--secondary"
      >
        <i className="fas fa-xmark" style={{ marginRight: '8px' }} />
        {cancelText || 'Cancelar'}
      </button>
    </div>
  );
};

FeatureDialogFooter.propTypes = {
  canSave: PropTypes.bool.isRequired,
  isSaving: PropTypes.bool,
  isSaveLocked: PropTypes.bool,
  onSave: PropTypes.func.isRequired,
  onCancel: PropTypes.func.isRequired,
  saveText: PropTypes.string,
  cancelText: PropTypes.string
};

export default FeatureDialogFooter;

