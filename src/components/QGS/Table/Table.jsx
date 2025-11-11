import React, { useContext, useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { QgisConfigContext } from '../QgisConfigContext';
import QgisConfigProvider from '../QgisConfigProvider';
import { fetchFeatures } from '../../../services/qgisWFSFetcher';
import './Table.css';

/**
 * Componente de tabla para mostrar datos de features de QGIS
 * Muestra registros de una capa específica del proyecto QGIS
 */
const Table = ({ layerName, maxRows = 10 }) => {
  // Obtener configuración QGIS y función de traducción del contexto
  const { config, t, notificationManager, qgsUrl, qgsProjectPath, token } = useContext(QgisConfigContext);
  const translate = typeof t === 'function' ? t : (key) => key;

  // Hooks deben ir siempre al principio, antes de cualquier return condicional
  const [datos, setDatos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Obtener la capa del config (si existe)
  const layer = config?.layers?.[layerName];

  // Obtener campos de la capa (usar alias si existe, sino name)
  const columnas = React.useMemo(() => {
    if (!layer?.fields || !Array.isArray(layer.fields)) {
      return [];
    }
    return layer.fields.map(field => ({
      field: field.name,
      label: field.alias || field.name
    }));
  }, [layer]);

  // Cargar datos desde QGIS Server
  useEffect(() => {
    if (!qgsUrl || !qgsProjectPath || !layerName || !layer) {
      if (layer) {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);

    fetchFeatures(qgsUrl, qgsProjectPath, layerName, '', 0, maxRows, token)
      .then(features => {
        // Extraer las propiedades de cada feature
        const datosExtraidos = features.map(feature => {
          const props = feature.properties || {};
          return props;
        });
        setDatos(datosExtraidos);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al cargar datos de la tabla:', err);
        setError(err.message);
        setLoading(false);
        notificationManager?.addNotification?.({
          title: translate('ui.table.error'),
          text: translate('ui.table.errorLoadingData'),
          level: 'error'
        });
      });
  }, [qgsUrl, qgsProjectPath, layerName, maxRows, token, translate, notificationManager, layer]);

  // Verificar que hay configuración disponible (después de los hooks)
  if (!config) {
    return <div>{translate('ui.qgis.loading')}</div>;
  }

  // Verificar que la capa existe
  if (!layer) {
    return <div>{translate('ui.table.error')}: {translate('ui.table.layerNotFound', { layerName })}</div>;
  }

  /**
   * Formatea el valor de una celda según su tipo
   */
  const formatearValor = (valor, campo) => {
    if (valor === null || valor === undefined) {
      return '';
    }
    // No traducir valores, solo mostrarlos tal cual vienen del servidor
    return String(valor);
  };

  if (loading) {
    return <div>{translate('ui.table.loading')}</div>;
  }

  if (error) {
    return <div>{translate('ui.table.error')}: {error}</div>;
  }

  return (
    <div className="table">     
      {/* Tabla de datos */}
      {columnas.length === 0 ? (
        <div>{translate('ui.table.noData')}</div>
      ) : (
        <>
          <table style={{ width: '100%', borderCollapse: 'collapse', border: '1px solid #ddd' }}>
            <thead>
              <tr style={{ backgroundColor: '#f5f5f5' }}>
                {columnas.map(columna => (
                  <th 
                    key={columna.field}
                    style={{ 
                      padding: '8px', 
                      textAlign: 'left', 
                      border: '1px solid #ddd',
                      fontWeight: 'bold'
                    }}
                  >
                    {columna.label}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {datos.length === 0 ? (
                <tr>
                  <td colSpan={columnas.length} style={{ padding: '20px', textAlign: 'center' }}>
                    {translate('ui.table.noData')}
                  </td>
                </tr>
              ) : (
                datos.map((fila, index) => (
                  <tr key={index} style={{ backgroundColor: index % 2 === 0 ? '#fff' : '#f9f9f9' }}>
                    {columnas.map(columna => (
                      <td 
                        key={columna.field}
                        style={{ 
                          padding: '8px', 
                          border: '1px solid #ddd',
                          fontSize: '14px'
                        }}
                      >
                        {formatearValor(fila[columna.field], columna.field)}
                      </td>
                    ))}
                  </tr>
                ))
              )}
            </tbody>
          </table>

          {/* Información adicional - Solo traducir el texto estático */}
          <div style={{ marginTop: '10px', fontSize: '12px', color: '#666' }}>
            {translate('ui.table.showingRecords', { count: datos.length, layerName: layerName })}
          </div>
        </>
      )}
    </div>
  );
};

Table.propTypes = {
  layerName: PropTypes.string.isRequired,
  maxRows: PropTypes.number
};

export { QgisConfigProvider };
export default Table;