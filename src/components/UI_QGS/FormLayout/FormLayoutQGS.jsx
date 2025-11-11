import React, { useContext } from 'react';
import PropTypes from 'prop-types';
import Tabs from '../../UI/Tabs/Tabs';
import Accordion from '../../UI/Accordion/Accordion';
import FormRow from '../../UI/FormRow/FormRow';
import { QgisConfigContext } from '../../QGS';
import './FormLayoutQGS.css';
import FormFieldQGS from '../FormField/FormFieldQGS';
import { useForm } from '../../QGS/Form/FormProvider';

/**
 * Componente para renderizar el layout de formulario basado en la configuración QGIS
 * Interpreta la configuración editFormConfig de una capa QGIS
 */
const FormLayoutQGS = ({ layerName, featureId }) => {
  // Obtener configuración QGIS y función de traducción del contexto
  const { t, token, notificationManager } = useContext(QgisConfigContext);

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
    canSave
  } = useForm();

  // Verificar que hay configuración disponible
  if (!config) {
    return <div>{t('ui.qgis.loading')}</div>;
  }



  if (!layer || !layer.editFormConfig) {
    return (
      <div className="form-layout-qgs form-layout-qgs--error">
        <p>No se encontró configuración de formulario para la capa: {layerName}</p>
      </div>
    );
  }

  const { editFormConfig } = layer;

  // Si no hay tabs, mostrar mensaje
  if (!editFormConfig.tabs || editFormConfig.tabs.length === 0) {
    return (
      <div className="form-layout-qgs form-layout-qgs--empty">
        <p>No se encontraron pestañas en la configuración del formulario</p>
      </div>
    );
  }

  // Renderizar un campo individual
  const renderField = (field) => {
    if (field.classType === 'QgsAttributeEditorField') {
      return (
        <div key={`field-${field.idx}`} className="form-field">
          <FormFieldQGS
            layerName={layerName}
            featureId={featureId}
            field_idx={field.idx}
            field_name={field.name}
          />
        </div>
      );
    }
    return null;
  };

  // Renderizar un contenedor (puede ser tab, groupbox o row)
  const renderContainer = (container, isTab = false) => {
    // Intentar múltiples formas de obtener el columnCount
    const columnCount = parseInt(container.columnCount || container.ColumnCount || container.columns || container.Columns || 1);
    const { children = [], isGroupBox, name, showLabel = true, type } = container;

    // Debug: mostrar información del contenedor
    console.log('Renderizando contenedor:', {
      name,
      isGroupBox,
      type,
      columnCount,
      containerProps: Object.keys(container),
      childrenCount: children.length,
      children: children.map(c => ({ type: c.classType, name: c.name, idx: c.idx }))
    });

    // Renderizar hijos del contenedor
    const renderChildren = (isRowType = false) => {
      const fields = [];
      const subContainers = [];

      // Separar campos de subcontenedores
      children.forEach(child => {
        if (child.classType === 'QgsAttributeEditorField') {
          fields.push(renderField(child));
        } else if (child.classType === 'QgsAttributeEditorContainer') {
          subContainers.push(renderContainer(child));
        }
      });

      console.log('Campos encontrados:', fields.length, 'Columnas configuradas:', columnCount, 'Es Row:', isRowType);

      // Si es un Row (type === "2"), todos los campos van en una sola fila
      if (isRowType || type === "2") {
        console.log('Renderizando como Row: todos los campos en una fila');
        return (
          <div className="form-container__content">
            {fields.length > 0 && (
              <FormRow key="row-all" showLabel={false}>
                {fields}
              </FormRow>
            )}
            {subContainers}
          </div>
        );
      }

      // Para otros tipos de contenedores, organizar campos en filas según columnCount
      const fieldRows = [];
      for (let i = 0; i < fields.length; i += columnCount) {
        const rowFields = fields.slice(i, i + columnCount);
        console.log(`Fila ${Math.floor(i / columnCount)}: ${rowFields.length} campos de ${columnCount} columnas máximas`);
        fieldRows.push(
          <FormRow key={`row-${i}`} showLabel={false}>
            {rowFields}
          </FormRow>
        );
      }

      return (
        <div className="form-container__content">
          {fieldRows}
          {subContainers}
        </div>
      );
    };

    // Si es un GroupBox, usar Accordion
    if (isGroupBox === "true") {
      return (
        <div key={`groupbox-${name}`} className="form-groupbox">
          <Accordion
            title={name}
            defaultOpen={true}
          >
            {renderChildren(false)} {/* GroupBox maneja columnas normalmente */}
          </Accordion>
        </div>
      );
    }

    // Si es un Tab, renderizar el contenido directamente (será manejado por Tabs)
    if (isTab) {
      return renderChildren(false);
    }

    // Si es una fila simple (type === "2"), usar FormRow especial
    if (type === "2") {
      return (
        <div key={`container-row-${name}`} className={`form-container-row ${!showLabel || !name ? 'form-container-row--no-label' : ''}`}>
          {showLabel && name && <h4 className="form-container-row__label">{name}</h4>}
          {renderChildren(true)} {/* Row ignora columnas y pone todo en una fila */}
        </div>
      );
    }

    // Para otros tipos de contenedores
    return (
      <div key={`container-${name}`} className="form-container">
        {showLabel && <h4 className="form-container__label">{name}</h4>}
        {renderChildren(false)}
      </div>
    );
  };

  // Preparar las pestañas para el componente Tabs
  const tabsData = editFormConfig.tabs.map((tab, index) => ({
    label: tab.name || `Pestaña ${index + 1}`,
    content: renderContainer(tab, true)
  }));

  return (
    <div className="form-layout-qgs">

      <div className="form-layout-qgs__content">
        <Tabs
          tabs={tabsData}
          defaultActive={0}
        />
      </div>
    </div>
  );
};

FormLayoutQGS.propTypes = {
  layerName: PropTypes.string.isRequired, // ID de la capa (key en layers)
  featureId: PropTypes.oneOfType([PropTypes.string, PropTypes.number]) // ID de la feature (opcional)
};

export default FormLayoutQGS;