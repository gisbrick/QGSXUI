import React, { useContext, useMemo } from 'react';
import PropTypes from 'prop-types';
import './FormFieldQGS.css';
import { QgisConfigContext } from '../../QGS';
import { useForm } from '../../QGS/Form/FormProvider';
import { TextControl } from '../../UI_QGS_Form';
import { NumberControl } from '../../UI_QGS_Form';
import { CheckboxControl } from '../../UI_QGS_Form';
import { ValueMapControl } from '../../UI_QGS_Form';
import { BaseControl } from '../../UI_QGS_Form';

/**
 * Utilidades para detectar tipos de campos
 */
const getIntegerTypes = () => ['INT', 'LONG', 'INTEGER', 'INTEGER64'];
const getFloatTypes = () => ['REAL', 'FLOAT', 'DOUBLE', 'NUMERIC'];
const getDateTypes = () => ['DATE', 'TIME'];
const getBooleanTypes = () => ['BOOL', 'BIT', 'BOOLEAN'];

const fieldIs = (field, types) => {
  if (!field || !field.typeName) return false;
  const typeNameUpper = field.typeName.toUpperCase();
  return types.some(type => typeNameUpper.includes(type));
};

/**
 * Componente para renderizar campos de formulario QGIS según su tipo
 */
const FormFieldQGS = ({ layerName, featureId, field_idx, field_name }) => {
  const { config, t } = useContext(QgisConfigContext);
  const formContext = useForm();

  // Verificar que hay configuración disponible y que estamos dentro de un FormProvider
  if (!config) {
    return <div>{t?.('ui.qgis.loading') || 'Cargando...'}</div>;
  }

  if (!formContext) {
    return (
      <div className="form-field-qgs form-field-qgs--error">
        <p>FormFieldQGS debe estar dentro de un FormProvider</p>
      </div>
    );
  }

  const { layer, values, errors, readOnly, setValue, validateField } = formContext;

  // Verificar que hay capa disponible
  if (!layer) {
    return <div>{t?.('ui.qgis.loading') || 'Cargando...'}</div>;
  }

  // Buscar el campo en la configuración de la capa
  const field = useMemo(() => {
    if (!layer.fields || !Array.isArray(layer.fields)) return null;
    
    // Buscar por índice primero
    if (field_idx !== undefined && field_idx !== null) {
      const fieldByIndex = layer.fields.find(f => f.index === field_idx);
      if (fieldByIndex) return fieldByIndex;
    }
    
    // Buscar por nombre
    if (field_name) {
      return layer.fields.find(f => f.name === field_name);
    }
    
    return null;
  }, [layer.fields, field_idx, field_name]);

  if (!field) {
    return (
      <div className="form-field-qgs form-field-qgs--error">
        <p>Campo no encontrado: {field_name || field_idx}</p>
      </div>
    );
  }

  // Obtener configuración del widget
  const widgetConfig = useMemo(() => {
    if (!field.editorWidgetSetup || !field.editorWidgetSetup.config) {
      return {};
    }
    try {
      return JSON.parse(field.editorWidgetSetup.config);
    } catch (e) {
      console.warn('Error parsing widget config:', e);
      return {};
    }
  }, [field.editorWidgetSetup]);

  const widgetType = field.editorWidgetSetup?.type || '';
  const fieldValue = values?.[field.name] ?? null;
  const fieldError = errors?.[field.name];
  const fieldAlias = field.alias || field.name;
  const isRequired = field.constraintNotNull || false;
  const isDisabled = readOnly || field.readOnly || false;

  // Handler para cambios de valor
  const handleChange = (newValue) => {
    setValue(field.name, newValue);
    validateField(field.name, newValue);
  };

  // Función para formatear valores según el tipo (para modo lectura)
  const formatValueForDisplay = useMemo(() => {
    return (value) => {
      if (value === null || value === undefined || value === '') {
        return '-';
      }

      // Boolean/CheckBox
      if (widgetType === 'CheckBox' || fieldIs(field, getBooleanTypes())) {
        const boolValue = value === 1 || value === true || value === '1' || value === 'true';
        return boolValue ? (t?.('ui.common.yes') || 'Sí') : (t?.('ui.common.no') || 'No');
      }

      // ValueMap - mostrar el label en lugar del value
      if (widgetType === 'ValueMap' && widgetConfig.map) {
        const option = widgetConfig.map.find(item => {
          const [label, val] = Object.entries(item)[0];
          return String(val) === String(value);
        });
        if (option) {
          return Object.keys(option)[0]; // Retornar el label
        }
      }

      // DateTime/Date/Time
      if (widgetType === 'DateTime' || fieldIs(field, getDateTypes())) {
        try {
          const date = new Date(value);
          if (!isNaN(date.getTime())) {
            const displayFormat = widgetConfig?.display_format || 'YYYY-MM-DD';
            const isTimeOnly = displayFormat === 'HH:mm:ss' || displayFormat === 'HH:mm';
            const isDateOnly = field.typeName && field.typeName.toUpperCase().includes('DATE') && 
                               !field.typeName.toUpperCase().includes('TIME');
            
            if (isTimeOnly) {
              return date.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' });
            } else if (isDateOnly) {
              return date.toLocaleDateString('es-ES');
            } else {
              return date.toLocaleString('es-ES');
            }
          }
        } catch (e) {
          // Si falla el parseo, devolver el valor original
        }
      }

      // Números - formatear con separadores de miles si es necesario
      if (fieldIs(field, getIntegerTypes()) || fieldIs(field, getFloatTypes())) {
        const numValue = Number(value);
        if (!isNaN(numValue)) {
          if (fieldIs(field, getFloatTypes())) {
            const precision = field.precision ? Number(field.precision) : 2;
            return numValue.toFixed(precision);
          }
          return numValue.toLocaleString('es-ES');
        }
      }

      // Por defecto, devolver el valor como string
      return String(value);
    };
  }, [widgetType, widgetConfig, field, t]);

  // Si el campo está oculto, no renderizar nada
  if (widgetType === 'Hidden') {
    return null;
  }

  // Si está en modo lectura, mostrar solo el valor formateado
  if (readOnly) {
    const displayValue = formatValueForDisplay(fieldValue);
    return (
      <div className="form-field-qgs form-field-qgs--readonly">
        <BaseControl
          label={fieldAlias}
          required={isRequired}
          disabled={true}
        >
          <div className="form-field-qgs__value">
            {displayValue}
          </div>
        </BaseControl>
      </div>
    );
  }

  // Renderizar según el tipo de widget (modo escritura)
  let control = null;

  // 1. TextEdit (texto simple o multilínea)
  if (widgetType === 'TextEdit' || widgetType === '') {
    const isMultiline = widgetConfig.IsMultiline || false;
    const useHtml = widgetConfig.UseHtml || false;

    if (isMultiline && !useHtml) {
      // Textarea
      control = (
        <BaseControl
          label={fieldAlias}
          required={isRequired}
          error={fieldError}
          disabled={isDisabled}
        >
          <textarea
            className="form-field-qgs__textarea"
            value={fieldValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            disabled={isDisabled}
            rows={4}
            maxLength={widgetConfig.MaxLength || undefined}
          />
        </BaseControl>
      );
    } else {
      // Input de texto simple
      control = (
        <TextControl
          label={fieldAlias}
          value={fieldValue || ''}
          onChange={(e) => handleChange(e.target.value)}
          disabled={isDisabled}
          error={fieldError}
          type="text"
          maxLength={widgetConfig.MaxLength || undefined}
          required={isRequired}
        />
      );
    }
  }
  // 2. CheckBox
  else if (widgetType === 'CheckBox') {
    const checked = fieldValue === 1 || fieldValue === true || fieldValue === '1';
    control = (
      <CheckboxControl
        label={fieldAlias}
        checked={checked}
        onChange={(e) => handleChange(e.target.checked ? 1 : 0)}
        disabled={isDisabled}
      />
    );
  }
  // 3. ValueMap (select con opciones predefinidas)
  else if (widgetType === 'ValueMap') {
    const options = useMemo(() => {
      const opts = [];
      
      // Si no es obligatorio, añadir opción vacía
      if (!isRequired) {
        opts.push({ value: '', label: '' });
      }

      // Procesar el mapa de valores
      if (widgetConfig.map && Array.isArray(widgetConfig.map)) {
        widgetConfig.map.forEach(item => {
          const [label, value] = Object.entries(item)[0];
          opts.push({ value: String(value), label });
        });
      }

      return opts;
    }, [widgetConfig.map, isRequired]);

    control = (
      <ValueMapControl
        label={fieldAlias}
        value={fieldValue !== null && fieldValue !== undefined ? String(fieldValue) : ''}
        onChange={(e) => {
          const val = e.target.value;
          handleChange(val === '' ? null : val);
        }}
        options={options}
        disabled={isDisabled}
        error={fieldError}
        required={isRequired}
      />
    );
  }
  // 4. Range (slider)
  else if (widgetType === 'Range') {
    const min = widgetConfig.Min !== undefined ? Number(widgetConfig.Min) : 0;
    const max = widgetConfig.Max !== undefined ? Number(widgetConfig.Max) : 100;
    const step = widgetConfig.Step !== undefined ? Number(widgetConfig.Step) : 1;
    const currentValue = fieldValue !== null && fieldValue !== undefined ? Number(fieldValue) : min;

    control = (
      <BaseControl
        label={fieldAlias}
        required={isRequired}
        error={fieldError}
        disabled={isDisabled}
      >
        <div className="form-field-qgs__range">
          <input
            type="range"
            min={min}
            max={max}
            step={step}
            value={currentValue}
            onChange={(e) => handleChange(Number(e.target.value))}
            disabled={isDisabled}
            className="form-field-qgs__range-input"
          />
          <span className="form-field-qgs__range-value">{currentValue}</span>
        </div>
      </BaseControl>
    );
  }
  // 5. DateTime
  else if (widgetType === 'DateTime') {
    const displayFormat = widgetConfig.display_format || 'YYYY-MM-DD';
    const isTimeOnly = displayFormat === 'HH:mm:ss' || displayFormat === 'HH:mm';
    const isDateOnly = field.typeName && field.typeName.toUpperCase().includes('DATE') && 
                       !field.typeName.toUpperCase().includes('TIME');

    // Formatear valor para input date/datetime-local
    const formatValueForInput = (value) => {
      if (!value) return '';
      if (typeof value === 'string') {
        // Si es solo hora, no podemos usar input date
        if (isTimeOnly) return value;
        // Convertir formato QGIS a formato HTML5
        const date = new Date(value);
        if (isNaN(date.getTime())) return '';
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        if (isDateOnly) {
          return `${year}-${month}-${day}`;
        }
        const hours = String(date.getHours()).padStart(2, '0');
        const minutes = String(date.getMinutes()).padStart(2, '0');
        return `${year}-${month}-${day}T${hours}:${minutes}`;
      }
      return value;
    };

    if (isTimeOnly) {
      control = (
        <BaseControl
          label={fieldAlias}
          required={isRequired}
          error={fieldError}
          disabled={isDisabled}
        >
          <input
            type="time"
            value={formatValueForInput(fieldValue)}
            onChange={(e) => handleChange(e.target.value)}
            disabled={isDisabled}
            className="form-field-qgs__time-input"
          />
        </BaseControl>
      );
    } else {
      // Usar input datetime-local o date según corresponda
      const inputType = isDateOnly ? 'date' : 'datetime-local';
      control = (
        <BaseControl
          label={fieldAlias}
          required={isRequired}
          error={fieldError}
          disabled={isDisabled}
        >
          <input
            type={inputType}
            value={formatValueForInput(fieldValue)}
            onChange={(e) => handleChange(e.target.value)}
            disabled={isDisabled}
            className="form-field-qgs__date-input"
          />
        </BaseControl>
      );
    }
  }
  // 6. Integer (solo si no es Range)
  else if (fieldIs(field, getIntegerTypes())) {
    control = (
      <NumberControl
        label={fieldAlias}
        value={fieldValue !== null && fieldValue !== undefined ? Number(fieldValue) : ''}
        onChange={(e) => {
          const val = e.target.value;
          handleChange(val === '' ? null : Number(val));
        }}
        disabled={isDisabled}
        error={fieldError}
        min={Number.MIN_SAFE_INTEGER}
        max={Number.MAX_SAFE_INTEGER}
        step={1}
        required={isRequired}
      />
    );
  }
  // 7. Float/Decimal
  else if (fieldIs(field, getFloatTypes())) {
    const precision = field.precision ? Number(field.precision) : 2;
    control = (
      <NumberControl
        label={fieldAlias}
        value={fieldValue !== null && fieldValue !== undefined ? Number(fieldValue) : ''}
        onChange={(e) => {
          const val = e.target.value;
          handleChange(val === '' ? null : Number(val));
        }}
        disabled={isDisabled}
        error={fieldError}
        step={Math.pow(10, -precision)}
        required={isRequired}
      />
    );
  }
  // 8. Boolean (por tipo de campo)
  else if (fieldIs(field, getBooleanTypes())) {
    const checked = fieldValue === 1 || fieldValue === true || fieldValue === '1' || fieldValue === 'true';
    control = (
      <CheckboxControl
        label={fieldAlias}
        checked={checked}
        onChange={(e) => handleChange(e.target.checked ? 1 : 0)}
        disabled={isDisabled}
      />
    );
  }
  // 9. ValueRelation y RelationReference (TODO: implementar más adelante)
  else if (widgetType === 'ValueRelation' || widgetType === 'RelationReference') {
    control = (
      <BaseControl
        label={fieldAlias}
        required={isRequired}
        error={fieldError}
        disabled={isDisabled}
      >
        <div className="form-field-qgs__relation">
          <p className="form-field-qgs__relation-note">
            {t?.('ui.qgis.field.relationNotImplemented') || 'Relación no implementada aún'}
          </p>
          <TextControl
            value={fieldValue || ''}
            onChange={(e) => handleChange(e.target.value)}
            disabled={isDisabled}
            error={fieldError}
          />
        </div>
      </BaseControl>
    );
  }
  // 10. Por defecto: texto
  else {
    control = (
      <TextControl
        label={fieldAlias}
        value={fieldValue || ''}
        onChange={(e) => handleChange(e.target.value)}
        disabled={isDisabled}
        error={fieldError}
        type="text"
        required={isRequired}
      />
    );
  }

  return (
    <div className="form-field-qgs">
      {control}
    </div>
  );
};

FormFieldQGS.propTypes = {
  layerName: PropTypes.string.isRequired,
  featureId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  field_idx: PropTypes.number,
  field_name: PropTypes.string,
};

export default FormFieldQGS;
