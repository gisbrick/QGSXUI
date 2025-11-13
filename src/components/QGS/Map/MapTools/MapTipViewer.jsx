import React, { useEffect, useState } from 'react';
import PropTypes from 'prop-types';
import { QgisConfigContext } from '../../QgisConfigContext';
import { fetchAllFeatures } from '../../../../services/qgisWFSFetcher';

/**
 * Componente para renderizar el mapTipTemplate de una capa
 * Similar a FormViewComponent del legacy pero simplificado para solo mostrar mapTip
 */
const MapTipViewer = ({ layer, feature, map, t: propTranslate = null }) => {
  const context = React.useContext(QgisConfigContext) || {};
  const { config, qgsUrl, qgsProjectPath, token, t: contextT } = context;

  const translate = React.useCallback(
    (key) => {
      if (typeof propTranslate === 'function') {
        const value = propTranslate(key);
        if (value !== undefined && value !== null && value !== '' && value !== key) {
          return value;
        }
      }
      if (typeof contextT === 'function') {
        const value = contextT(key);
        if (value !== undefined && value !== null && value !== '' && value !== key) {
          return value;
        }
      }
      return key;
    },
    [propTranslate, contextT]
  );
  
  const [htmlParsed, setHtmlParsed] = useState(null);
  const [loading, setLoading] = useState(true);

  // Tipos de campos numéricos
  const integerTypes = ['Integer', 'Integer64', 'SmallInteger'];
  const floatTypes = ['Real', 'Double'];

  /**
   * Obtiene features de tablas relacionadas (ValueRelation)
   */
  const getFeaturesFromTables = async (field) => {
    if (field.editorWidgetSetup?.type === 'ValueRelation') {
      try {
        const config = typeof field.editorWidgetSetup.config === 'string' 
          ? JSON.parse(field.editorWidgetSetup.config) 
          : field.editorWidgetSetup.config;
        const { LayerName: layerName } = config;
        if (layerName && qgsUrl && qgsProjectPath) {
          return await fetchAllFeatures(qgsUrl, qgsProjectPath, layerName, '', 500, token);
        }
      } catch (error) {
        console.error('Error al obtener features de tabla relacionada:', error);
      }
    }
    return null;
  };

  /**
   * Obtiene valores de features relacionadas
   */
  const getValuesFromTableFeatures = (field, element, valorAux) => {
    if (!element?.features) return valorAux;
    try {
      const config = typeof field.editorWidgetSetup.config === 'string'
        ? JSON.parse(field.editorWidgetSetup.config)
        : field.editorWidgetSetup.config;
      const { Key: key, Value: value } = config;
      const foundFeature = element.features.find((f) => f.properties[key] == valorAux);
      return foundFeature ? foundFeature.properties[value] : valorAux;
    } catch (error) {
      console.error('Error al obtener valor de feature relacionada:', error);
      return valorAux;
    }
  };

  /**
   * Verifica si un campo es de un tipo específico
   */
  const fieldIs = (field, types) => {
    if (!field?.typeName) return false;
    return types.some(type => field.typeName.toUpperCase().includes(type.toUpperCase()));
  };

  /**
   * Formatea una fecha según la configuración del campo
   */
  const formatDate = (field, theValue) => {
    if (!theValue) return '';
    try {
      const config = typeof field.editorWidgetSetup?.config === 'string'
        ? JSON.parse(field.editorWidgetSetup.config)
        : field.editorWidgetSetup?.config;
      const timeFormat = 'HH:mm:ss';
      const displayFormat = config?.display_format;

      if (displayFormat === timeFormat) {
        // Es hora
        const date = new Date('1970-01-01T' + theValue);
        if (!isNaN(date.getTime())) {
          const hours = date.getHours().toString().padStart(2, '0');
          const minutes = date.getMinutes().toString().padStart(2, '0');
          const seconds = date.getSeconds().toString().padStart(2, '0');
          return `${hours}:${minutes}:${seconds}`;
        }
        return theValue;
      } else {
        // Es fecha
        const date = new Date(theValue);
        if (!isNaN(date.getTime())) {
          const day = date.getDate().toString().padStart(2, '0');
          const month = (date.getMonth() + 1).toString().padStart(2, '0');
          const year = date.getFullYear();
          return `${day}/${month}/${year}`;
        }
        return theValue;
      }
    } catch (error) {
      console.error('Error al formatear fecha:', error);
      return theValue;
    }
  };

  /**
   * Construye el HTML reemplazando los placeholders [%"campo"%] con los valores
   */
  const buildHTML = async (qgisLayer, feature, rawHtml) => {
    if (!rawHtml || !qgisLayer || !feature) return '';
    
    let htmlAux = rawHtml;
    const regex = /\[%(.*?)\%]/g;
    const matches = rawHtml.match(regex);

    if (!matches) {
      return htmlAux;
    }

    // Preparar feature con aliases
    const featureAux = { ...feature };
    if (qgisLayer.fields) {
      qgisLayer.fields.forEach(field => {
        if (field.alias && field.alias !== '') {
          featureAux.properties[field.alias] = featureAux.properties[field.name];
        }
      });
    }

    // Obtener todas las features relacionadas en paralelo
    const promises = matches.map(match => {
      const fieldRegex = /\"(.*?)\"/g;
      const fieldMatch = fieldRegex.exec(match);
      if (!fieldMatch) return null;
      
      const fieldId = fieldMatch[1];
      const field = qgisLayer.fields?.find(f => f.name === fieldId);
      return field ? getFeaturesFromTables(field) : null;
    });

    const resultados = await Promise.all(promises);

    // Reemplazar cada match con su valor
    matches.forEach((match, index) => {
      const fieldRegex = /\"(.*?)\"/g;
      const fieldMatch = fieldRegex.exec(match);
      if (!fieldMatch) return;

      const fieldId = fieldMatch[1];
      const field = qgisLayer.fields?.find(f => f.name === fieldId);
      if (!field) {
        htmlAux = htmlAux.replace(match, '');
        return;
      }

      const item = field.alias && field.alias !== '' ? field.alias : field.name;
      let valorAux = featureAux.properties[item];

      // Si hay feature relacionada, obtener el valor
      const element = resultados[index];
      if (element) {
        valorAux = getValuesFromTableFeatures(field, element, valorAux);
      }

      if (!valorAux && valorAux !== 0) {
        htmlAux = htmlAux.replace(match, '');
      } else {
        // Formatear según el tipo
        if (field.editorWidgetSetup?.type === 'DateTime') {
          valorAux = formatDate(field, valorAux);
        } else if (fieldIs(field, integerTypes) || fieldIs(field, floatTypes)) {
          valorAux = typeof valorAux === 'number' ? valorAux.toLocaleString('es-ES') : valorAux;
        }
        htmlAux = htmlAux.replace(match, String(valorAux));
      }
    });

    return htmlAux;
  };

  /**
   * Convierte HTML a componentes React
   */
  const parseHTMLToReact = (htmlString) => {
    if (!htmlString) return null;

    const tempElement = document.createElement('div');
    tempElement.innerHTML = htmlString;
    const children = Array.from(tempElement.childNodes);

    const parseNode = (node) => {
      if (node.nodeType === Node.ELEMENT_NODE) {
        const { tagName, attributes } = node;
        return React.createElement(
          tagName.toLowerCase(),
          Object.fromEntries(Array.from(attributes).map(attr => [attr.name, attr.value])),
          ...(node.childNodes ? Array.from(node.childNodes).map(parseNode) : [])
        );
      } else if (node.nodeType === Node.TEXT_NODE) {
        if (/\S/.test(node.textContent)) {
          if (node.textContent.toLowerCase() === 'null') {
            return null;
          }
          return node.textContent;
        }
        return null;
      }
      return null;
    };

    const reactChildren = children.map(parseNode).filter(Boolean);
    return React.createElement(React.Fragment, null, ...reactChildren);
  };

  /**
   * Monta el componente
   */
  const mount = async () => {
    setLoading(true);
    setHtmlParsed(null);

    if (!layer || !feature || !layer.mapTipTemplate) {
      setHtmlParsed(
        <div style={{ textAlign: 'center', padding: '20px' }}>
          {translate('ui.map.noMapTipTemplate')}
        </div>
      );
      setLoading(false);
      return;
    }

    try {
      const parsedHTML = await buildHTML(layer, feature, layer.mapTipTemplate);
      const reactComponent = parseHTMLToReact(parsedHTML);
      setHtmlParsed(reactComponent);
    } catch (error) {
      console.error('Error al procesar mapTipTemplate:', error);
      setHtmlParsed(
        <div style={{ textAlign: 'center', padding: '20px', color: '#d32f2f' }}>
          {translate('ui.map.errorProcessingMapTip')}
        </div>
      );
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    mount();
  }, [feature, layer]);

  if (loading) {
    return <div style={{ textAlign: 'center', padding: '20px' }}>
      {translate('ui.common.loading')}
    </div>;
  }

  return (
    <div className="map-tip-viewer" style={{ padding: '10px' }}>
      {htmlParsed}
    </div>
  );
};

MapTipViewer.propTypes = {
  layer: PropTypes.object.isRequired,
  feature: PropTypes.object.isRequired,
  map: PropTypes.object,
  t: PropTypes.func
};

export default MapTipViewer;

