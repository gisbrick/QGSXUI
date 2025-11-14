/**
 * Servicio para realizar peticiones WMS GetFeatureInfo a QGIS Server
 */

/**
 * Realiza una petición GetFeatureInfo a QGIS Server
 * @param {string} qgsUrl - URL del servicio QGIS
 * @param {string} qgsProjectPath - Ruta del proyecto QGIS
 * @param {Object} queryParams - Parámetros de la consulta GetFeatureInfo
 * @param {string} token - Token opcional para autenticación
 * @returns {Promise<Object>} Respuesta JSON con las features encontradas
 */
export async function fetchFeatureInfo(qgsUrl, qgsProjectPath, queryParams, token = null) {
  const url = qgsUrl;
  const params = new URLSearchParams({
    SERVICE: 'WMS',
    VERSION: queryParams.version || '1.3.0',
    REQUEST: 'GetFeatureInfo',
    MAP: qgsProjectPath,
    LAYERS: Array.isArray(queryParams.layers) ? queryParams.layers.join(',') : queryParams.layers,
    QUERY_LAYERS: Array.isArray(queryParams.query_layers) ? queryParams.query_layers.join(',') : queryParams.query_layers,
    INFO_FORMAT: queryParams.info_format || 'application/json',
    FEATURE_COUNT: queryParams.feature_count || 5,
    BBOX: queryParams.bbox,
    WIDTH: queryParams.width,
    HEIGHT: queryParams.height,
    ...(token ? { TOKEN: token } : {})
  });

  // Parámetros según la versión de WMS
  if (parseFloat(queryParams.version || '1.3.0') >= 1.3) {
    params.set('CRS', queryParams.crs || 'EPSG:3857');
    params.set('I', queryParams.i);
    params.set('J', queryParams.j);
  } else {
    params.set('SRS', queryParams.srs || 'EPSG:3857');
    params.set('X', queryParams.x);
    params.set('Y', queryParams.y);
  }

  // Añadir estilos si están disponibles
  if (queryParams.styles) {
    params.set('STYLES', Array.isArray(queryParams.styles) ? queryParams.styles.join(',') : queryParams.styles);
  }

  const response = await fetch(`${url}?${params.toString()}`);
  
  if (!response.ok) {
    const text = await response.text();
    throw new Error(`HTTP error: ${response.status} ${response.statusText}. ${text}`);
  }

  const data = await response.json();
  
  if (!data.features) {
    // Si no hay features, retornar un objeto con array vacío
    return { features: [] };
  }

  return data;
}






