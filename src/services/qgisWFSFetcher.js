// Servicio que obtiene el número de registros de una capa
export async function fetchFeatureCount(qgsUrl, qgsProjectPath, layerName, filter = '', token = null) {
  layerName = layerName.replace(/\s+/g, '_'); // Reemplazar espacios por guiones bajos
  const url = qgsUrl;
  const params = new URLSearchParams({
    SERVICE: 'WFS',
    VERSION: '1.1.0',
    REQUEST: 'GetFeature',
    TYPENAME: layerName,
    resultType: 'hits',
    MAP: qgsProjectPath,
    // Incluir token solo si está disponible
    ...(token ? { TOKEN: token } : {})
  });

  if (filter) {
    params.set('CQL_FILTER', filter);
  }

  const response = await fetch(`${url}?${params.toString()}`);
  const text = await response.text();
  
  if (!response.ok) {
    // Intentar parsear el error como XML si es posible
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      const rootName = xmlDoc.documentElement.nodeName;
      if (rootName === 'ServiceExceptionReport') {
        const exceptionText = xmlDoc.querySelector('ServiceException')?.textContent || 'Unknown server error';
        throw new Error(`QGIS Server returned a ServiceException: ${exceptionText}`);
      }
    } catch (parseError) {
      // Si no se puede parsear como XML, usar el error HTTP
    }
    throw new Error(`HTTP error: ${response.status} ${response.statusText}. URL: ${url}?${params.toString()}`);
  }

  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, 'text/xml');

  // Detect WFS ServiceException
  const rootName = xmlDoc.documentElement.nodeName;
  if (rootName === 'ServiceExceptionReport') {
    const exceptionText = xmlDoc.querySelector('ServiceException')?.textContent || 'Unknown server error';
    throw new Error(`QGIS Server returned a ServiceException: ${exceptionText}`);
  }

  const count = xmlDoc.documentElement.getAttribute('numberOfFeatures');
  if (count === null) {
    throw new Error('Missing numberOfFeatures attribute in XML response');
  }

  console.log(`Total features in ${layerName} with filter: ${count}`);
  return parseInt(count, 10);
}

// Servicio que obtiene features con paginación desde QGIS Server
export async function fetchFeatures(qgsUrl, qgsProjectPath, layerName, filter = '', startIndex = 0, pageSize = 100, token = null) {
  layerName = layerName.replace(/\s+/g, '_'); // Reemplazar espacios por guiones bajos
  const url = qgsUrl;
  const params = new URLSearchParams({
    SERVICE: 'WFS',
    VERSION: '1.1.0',
    REQUEST: 'GetFeature',
    TYPENAME: layerName,
    outputFormat: 'application/json',
    MAP: qgsProjectPath,
    maxFeatures: pageSize,
    startIndex: startIndex,
     // Incluir token solo si está disponible
    ...(token ? { TOKEN: token } : {})
  });

  if (filter) {
    params.set('CQL_FILTER', filter);
  }

  const response = await fetch(`${url}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.features) {
    throw new Error('Missing features in JSON response');
  }

  console.log(`Fetched ${data.features.length} features from ${layerName}`);
  return data.features;
}

// Servicio que obtiene todas las features de una capa con paginación
export async function fetchAllFeatures(qgsUrl, qgsProjectPath, layerName, filter = '', pageSize = 500, token = null) {
  layerName = layerName.replace(/\s+/g, '_'); // Reemplazar espacios por guiones bajos
  // Primero obtenemos el total de features con el conteo
  const totalCount = await fetchFeatureCount(qgsUrl, qgsProjectPath, layerName, filter, token);

  // Si no hay features, retornar un array vacío
  if (totalCount === 0) {
    return [];
  }


  // Si el total es menor que el tamaño de página, no hay paginación
  if (totalCount <= pageSize) {
    return await fetchFeatures(qgsUrl, qgsProjectPath, layerName, filter, 0, totalCount, token);
  }

  
  const allFeatures = [];
  for (let startIndex = 0; startIndex < totalCount; startIndex += pageSize) {
    const url = qgsUrl;
    const params = new URLSearchParams({
      SERVICE: 'WFS',
      VERSION: '1.1.0',
      REQUEST: 'GetFeature',
      TYPENAME: layerName,
      outputFormat: 'application/json',
      MAP: qgsProjectPath,
      maxFeatures: pageSize,
      startIndex: startIndex,
       // Incluir token solo si está disponible
    ...(token ? { TOKEN: token } : {})
    });

    if (filter) {
      params.set('CQL_FILTER', filter);
    }

    const response = await fetch(`${url}?${params.toString()}`);
    if (!response.ok) {
      throw new Error(`HTTP error while fetching page: ${response.status} ${response.statusText}`);
    }

    const data = await response.json();
    if (!data.features) {
      throw new Error('Missing features in JSON response');
    }

    allFeatures.push(...data.features);
  }

  console.log(`Fetched ${allFeatures.length} features from ${layerName}`);
  return allFeatures;
}

// Servicio que obtiene una feature específica por su ID mediante WFS GetFeature
export async function fetchFeatureById(qgsUrl, qgsProjectPath, layerName, featureId, token = null) {
  layerName = layerName.replace(/\s+/g, '_'); // Reemplazar espacios por guiones bajos
  // Normalizar el featureId (puede venir como "layerName.featureId" o solo "featureId")
  const normalizedFeatureId = featureId.includes('.') ? featureId : `${layerName}.${featureId}`;
  
  const url = qgsUrl;
  const params = new URLSearchParams({
    SERVICE: 'WFS',
    VERSION: '1.1.0',
    REQUEST: 'GetFeature',
    TYPENAME: layerName,
    FEATUREID: normalizedFeatureId.replace(/\s+/g, '_'), // Reemplazar espacios por guiones bajos en el ID
    outputFormat: 'application/json',
    MAP: qgsProjectPath,
    ...(token ? { TOKEN: token } : {})
  });

  const response = await fetch(`${url}?${params.toString()}`);
  if (!response.ok) {
    throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
  }

  const data = await response.json();

  if (!data.features || data.features.length === 0) {
    throw new Error('Feature not found in response');
  }

  return data.features[0]; // Retornar la primera (y única) feature
}

/**
 * Genera el XML para una transacción WFS de borrado de feature
 * @param {Object} feature - Feature a borrar (debe tener un id en formato "layerName.featureId")
 * @returns {string} XML de la transacción WFS
 */
function getDeleteXML(feature) {
  const featureIdArr = feature.id.split(".");
  const TYPENAME = featureIdArr[0].replace(/\s+/g, "_");
  const FID = featureIdArr[1];
  // Usar FID completo (TYPENAME.FID) como en el ejemplo del usuario
  const FULL_FID = `${TYPENAME}.${FID}`;

  return `<?xml version="1.0" encoding="UTF-8"?>
<wfs:Transaction service="WFS" version="1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ogc="http://www.opengis.net/ogc" xmlns="http://www.opengis.net/wfs" updateSequence="0" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-capabilities.xsd" xmlns:gml="http://www.opengis.net/gml"  xmlns:ows="http://www.opengis.net/ows">
   <wfs:Delete typeName="${TYPENAME}">
       <ogc:Filter>
           <ogc:FeatureId fid="${FULL_FID}"/>
       </ogc:Filter>
   </wfs:Delete>
</wfs:Transaction>`;
}

/**
 * Borra una feature mediante WFS Transaction
 * @param {string} qgsUrl - URL del servidor QGIS
 * @param {string} qgsProjectPath - Ruta del proyecto QGIS
 * @param {Object} feature - Feature a borrar (debe tener un id en formato "layerName.featureId")
 * @param {string} token - Token de autenticación (opcional)
 * @returns {Promise<Response>} Respuesta de la petición
 */
export async function deleteFeature(qgsUrl, qgsProjectPath, feature, token = null) {
  if (!feature || !feature.id) {
    throw new Error('Feature must have an id property');
  }

  const featureIdArr = feature.id.split(".");
  if (featureIdArr.length !== 2) {
    throw new Error('Feature id must be in format "layerName.featureId"');
  }

  const TYPENAME = featureIdArr[0].replace(/\s+/g, "_");
  const url = qgsUrl;
  const params = new URLSearchParams({
    SERVICE: 'WFS',
    VERSION: '1.1.0',
    REQUEST: 'Transaction',
    OPERATION: 'Delete',
    MAP: qgsProjectPath,
    TYPENAME: TYPENAME,
    ...(token ? { TOKEN: token } : {})
  });

  const deleteXML = getDeleteXML(feature);

  // Asegurar que el XML es un string válido
  const xmlString = String(deleteXML).trim();

  // Headers según el ejemplo de prueba: Content-Type: text/xml (sin charset) y Accept
  const headers = {
    'Content-Type': 'text/xml',
    'Accept': 'application/xml, text/xml, */*'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Log para debug - mostrar el XML antes de enviar
  console.log('=== DELETE FEATURE REQUEST ===');
  console.log('URL:', `${url}?${params.toString()}`);
  console.log('Full URL:', `${url}?${params.toString()}`);
  console.log('Headers:', headers);
  console.log('Headers keys:', Object.keys(headers));
  console.log('Headers values:', Object.values(headers));
  console.log('XML Body (string):');
  console.log(xmlString);
  console.log('XML Body length:', xmlString.length);
  console.log('XML Body type:', typeof xmlString);
  console.log('Method: POST');
  console.log('==============================');

  // Intentar la petición con manejo de errores detallado
  let response;
  try {
    console.log('Iniciando fetch DELETE...');
    response = await fetch(`${url}?${params.toString()}`, {
      method: 'POST',
      headers: headers,
      body: xmlString
    });
    console.log('Fetch DELETE completado. Status:', response.status, response.statusText);
    console.log('Response headers:', [...response.headers.entries()]);
  } catch (fetchError) {
    console.error('=== ERROR EN FETCH DELETE ===');
    console.error('Error type:', fetchError.constructor.name);
    console.error('Error message:', fetchError.message);
    console.error('Error stack:', fetchError.stack);
    console.error('URL intentada:', `${url}?${params.toString()}`);
    console.error('Headers enviados:', headers);
    console.error('Body type:', typeof xmlString);
    console.error('Body length:', xmlString.length);
    throw fetchError;
  }

  if (!response.ok) {
    const text = await response.text();
    // Intentar parsear el error como XML si es posible
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(text, 'text/xml');
      const rootName = xmlDoc.documentElement.nodeName;
      if (rootName === 'ServiceExceptionReport') {
        const exceptionText = xmlDoc.querySelector('ServiceException')?.textContent || 'Unknown server error';
        throw new Error(`QGIS Server returned a ServiceException: ${exceptionText}`);
      }
      // Si es una respuesta de transacción, verificar si hay errores
      if (rootName === 'wfs:TransactionResponse') {
        const exceptionReport = xmlDoc.querySelector('ServiceExceptionReport');
        if (exceptionReport) {
          const exceptionText = exceptionReport.querySelector('ServiceException')?.textContent || 'Unknown server error';
          throw new Error(`QGIS Server returned a ServiceException: ${exceptionText}`);
        }
      }
    } catch (parseError) {
      // Si no se puede parsear como XML, usar el error HTTP
    }
    throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
  }

  const text = await response.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(text, 'text/xml');

  // Verificar si hay errores en la respuesta
  const exceptionReport = xmlDoc.querySelector('ServiceExceptionReport');
  if (exceptionReport) {
    const exceptionText = exceptionReport.querySelector('ServiceException')?.textContent || 'Unknown server error';
    throw new Error(`QGIS Server returned a ServiceException: ${exceptionText}`);
  }

  // Verificar que la transacción fue exitosa
  // El servidor puede devolver diferentes formatos:
  // - WFS_TransactionResponse (con guión bajo, versión 1.0.0)
  // - wfs:TransactionResponse (con namespace, versión 1.0.0)
  // - TransactionResponse (sin namespace, versión 1.1.0)
  const rootName = xmlDoc.documentElement.nodeName;
  const isTransactionResponse = rootName === 'WFS_TransactionResponse' || 
                                 rootName === 'wfs:TransactionResponse' || 
                                 rootName === 'TransactionResponse' ||
                                 rootName.includes('TransactionResponse');

  if (!isTransactionResponse) {
    console.error('Unexpected response format:', rootName);
    console.error('Response XML:', text);
    throw new Error(`Invalid transaction response from server. Expected TransactionResponse, got: ${rootName}`);
  }

  // Verificar el estado de éxito
  // Para WFS 1.0.0: buscar <SUCCESS/> dentro de <Status> o <TransactionResult>
  // Para WFS 1.1.0: buscar <totalDeleted> o verificar que no hay errores en <TransactionResults>
  const successElement = xmlDoc.querySelector('SUCCESS, Status > SUCCESS, TransactionResult SUCCESS, TransactionResult > Status > SUCCESS');
  const totalDeleted = xmlDoc.querySelector('totalDeleted');
  const transactionResults = xmlDoc.querySelector('TransactionResults');
  
  // Si hay un elemento SUCCESS, la transacción fue exitosa
  if (successElement) {
    return response;
  }

  // Si hay totalDeleted y es mayor que 0, fue exitoso
  if (totalDeleted && parseInt(totalDeleted.textContent) > 0) {
    return response;
  }

  // Si hay TransactionResults, verificar si hay mensajes de error
  if (transactionResults) {
    const actionElements = transactionResults.querySelectorAll('Action');
    const errorMessages = [];
    actionElements.forEach(action => {
      const message = action.querySelector('Message');
      if (message) {
        errorMessages.push(message.textContent);
      }
    });
    
    if (errorMessages.length > 0) {
      throw new Error(`Transaction failed: ${errorMessages.join('; ')}`);
    }
  }

  // Si llegamos aquí y no hay errores explícitos, considerar exitoso
  // (algunos servidores pueden devolver éxito sin elementos SUCCESS)
  return response;
}

/**
 * Escapa caracteres especiales en XML
 * @param {any} value - Valor a escapar
 * @returns {string} Valor escapado
 */
function escapeString(value) {
  if (value == null || value === undefined) {
    return '';
  }
  
  const str = String(value);
  if (str.replaceAll) {
    return str.replaceAll('&', '&amp;')
              .replaceAll('<', '&lt;')
              .replaceAll('>', '&gt;')
              .replaceAll('"', '&quot;')
              .replaceAll("'", '&#039;');
  } else {
    return str
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;')
      .replace(/"/g, '&quot;')
      .replace(/'/g, '&#039;');
  }
}

/**
 * Verifica si un valor está vacío
 * @param {any} val - Valor a verificar
 * @returns {boolean} true si está vacío
 */
function isEmpty(val) {
  return (val === undefined || val == null || val === '' || (typeof val === 'string' && val.length <= 0));
}

/**
 * Genera el XML de propiedades para una actualización WFS
 * @param {Object} properties - Propiedades a actualizar
 * @returns {string} XML de propiedades
 */
function getFeaturePropertiesAsXml(properties) {
  let out = '';
  if (properties) {
    for (let key in properties) {
      const NAME = key;
      let VALUE = '';
      const propertyValue = properties[key];
      let xml = `<wfs:Property><wfs:Name>${NAME}</wfs:Name>`;
      if (!isEmpty(propertyValue)) {
        VALUE = escapeString(propertyValue);
        xml = xml.concat(`<wfs:Value>${VALUE}</wfs:Value>`);
      }
      xml = xml.concat('</wfs:Property>');
      out = out.concat(xml);
    }
  }
  return out;
}

/**
 * Genera el XML para una transacción WFS de actualización de feature
 * @param {Object} feature - Feature a actualizar (debe tener un id en formato "layerName.featureId")
 * @param {Object} properties - Propiedades a actualizar
 * @returns {string} XML de la transacción WFS
 */
function getUpdateXML(feature, properties) {
  const featureIdArr = feature.id.split('.');
  const TYPENAME = featureIdArr[0].replace(/\s+/g, '_');
  const FID = featureIdArr[1];
  
  const PROPERTIES = getFeaturePropertiesAsXml(properties);
  
  return `<?xml version="1.0" encoding="UTF-8"?>
<wfs:Transaction service="WFS" version="1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ogc="http://www.opengis.net/ogc" xmlns="http://www.opengis.net/wfs" updateSequence="0" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-capabilities.xsd" xmlns:gml="http://www.opengis.net/gml"  xmlns:ows="http://www.opengis.net/ows">
   <wfs:Update typeName="${TYPENAME}">${PROPERTIES}<ogc:Filter><ogc:FeatureId fid="${FID}"/></ogc:Filter></wfs:Update>
</wfs:Transaction>`;
}

/**
 * Actualiza una feature mediante WFS Transaction (solo atributos, sin geometría)
 * @param {string} qgsUrl - URL del servidor QGIS
 * @param {string} qgsProjectPath - Ruta del proyecto QGIS
 * @param {Object} feature - Feature a actualizar (debe tener un id en formato "layerName.featureId")
 * @param {Object} properties - Propiedades a actualizar
 * @param {string} token - Token de autenticación (opcional)
 * @returns {Promise<Response>} Respuesta de la petición
 */
export async function updateFeature(qgsUrl, qgsProjectPath, feature, properties, token = null) {
  if (!feature || !feature.id) {
    throw new Error('Feature must have an id property');
  }

  const featureIdArr = feature.id.split('.');
  if (featureIdArr.length !== 2) {
    throw new Error('Feature id must be in format "layerName.featureId"');
  }

  if (!properties || typeof properties !== 'object') {
    throw new Error('Properties must be an object');
  }

  const TYPENAME = featureIdArr[0].replace(/\s+/g, '_');
  const url = qgsUrl;
  const params = new URLSearchParams({
    SERVICE: 'WFS',
    VERSION: '1.1.0',
    REQUEST: 'Transaction',
    OPERATION: 'Update',
    MAP: qgsProjectPath,
    TYPENAME: TYPENAME,
    ...(token ? { TOKEN: token } : {})
  });

  const updateXML = getUpdateXML(feature, properties);

  // Asegurar que el XML es un string válido
  const xmlString = String(updateXML).trim();

  // Headers según el legacy: Content-Type: text/xml
  const headers = {
    'Content-Type': 'text/xml',
    'Accept': 'application/xml, text/xml, */*'
  };
  
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  // Log para debug
  console.log('=== UPDATE FEATURE REQUEST ===');
  console.log('URL:', `${url}?${params.toString()}`);
  console.log('Full URL:', `${url}?${params.toString()}`);
  console.log('Headers:', headers);
  console.log('XML Body length:', xmlString.length);
  console.log('Method: POST (usando XMLHttpRequest como legacy)');
  console.log('==============================');

  // Usar XMLHttpRequest como en el legacy (unfetch usa XMLHttpRequest internamente)
  // Esto puede evitar el preflight OPTIONS en algunos casos
  return new Promise((resolve, reject) => {
    const xhr = new XMLHttpRequest();
    const fullUrl = `${url}?${params.toString()}`;
    
    xhr.open('POST', fullUrl);
    
    // Añadir headers
    Object.keys(headers).forEach(key => {
      xhr.setRequestHeader(key, headers[key]);
    });
    
    xhr.onload = () => {
      console.log('XMLHttpRequest UPDATE completado. Status:', xhr.status, xhr.statusText);
      
      if (xhr.status >= 200 && xhr.status < 300) {
        // Crear un objeto Response-like para mantener compatibilidad
        const response = new Response(xhr.responseText, {
          status: xhr.status,
          statusText: xhr.statusText,
          headers: new Headers()
        });
        resolve(response);
      } else {
        const error = new Error(`HTTP error: ${xhr.status} ${xhr.statusText}`);
        error.response = {
          status: xhr.status,
          statusText: xhr.statusText,
          text: () => Promise.resolve(xhr.responseText)
        };
        reject(error);
      }
    };
    
    xhr.onerror = () => {
      console.error('XMLHttpRequest UPDATE error');
      reject(new Error('XMLHttpRequest failed'));
    };
    
    xhr.send(xmlString);
  }).then(response => {
    // Continuar con el procesamiento de la respuesta como antes
    if (!response.ok) {
      return response.text().then(text => {
        // Intentar parsear el error como XML si es posible
        try {
          const parser = new DOMParser();
          const xmlDoc = parser.parseFromString(text, 'text/xml');
          
          // Verificar si hay errores en el XML
          const serviceException = xmlDoc.querySelector('ServiceException');
          if (serviceException) {
            const errorMessage = serviceException.textContent || 'Unknown server error';
            throw new Error(`QGIS Server error: ${errorMessage}`);
          }
        } catch (parseError) {
          // Si no se puede parsear como XML, lanzar error genérico
          throw new Error(`Server error: ${text}`);
        }
        throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
      });
    }
    return response;
  }).then(async response => {
    // Parsear la respuesta XML
    const text = await response.text();
    const parser = new DOMParser();
    const xmlDoc = parser.parseFromString(text, 'text/xml');

    // Verificar si hay errores en la respuesta
    const exceptionReport = xmlDoc.querySelector('ServiceExceptionReport');
    if (exceptionReport) {
      const exceptionText = exceptionReport.querySelector('ServiceException')?.textContent || 'Unknown server error';
      throw new Error(`QGIS Server returned a ServiceException: ${exceptionText}`);
    }

    // Verificar que la transacción fue exitosa
    const rootName = xmlDoc.documentElement.nodeName;
    const isTransactionResponse = rootName === 'WFS_TransactionResponse' || 
                                   rootName === 'wfs:TransactionResponse' || 
                                   rootName === 'TransactionResponse' ||
                                   rootName.includes('TransactionResponse');

    if (!isTransactionResponse) {
      console.error('Unexpected response format:', rootName);
      console.error('Response XML:', text);
      throw new Error(`Invalid transaction response from server. Expected TransactionResponse, got: ${rootName}`);
    }

    // Verificar el estado de éxito
    const successElement = xmlDoc.querySelector('SUCCESS, Status > SUCCESS, TransactionResult SUCCESS, TransactionResult > Status > SUCCESS');
    const totalUpdated = xmlDoc.querySelector('totalUpdated');
    const transactionResults = xmlDoc.querySelector('TransactionResults');
    
    // Si hay un elemento SUCCESS, la transacción fue exitosa
    if (successElement) {
      return response;
    }


    // Si hay totalUpdated y es mayor que 0, fue exitoso
    if (totalUpdated && parseInt(totalUpdated.textContent) > 0) {
      return response;
    }

    // Si hay TransactionResults, verificar si hay mensajes de error
    if (transactionResults) {
      const actionElements = transactionResults.querySelectorAll('Action');
      const errorMessages = [];
      actionElements.forEach(action => {
        const message = action.querySelector('Message');
        if (message) {
          errorMessages.push(message.textContent);
        }
      });
      
      if (errorMessages.length > 0) {
        throw new Error(`Transaction failed: ${errorMessages.join('; ')}`);
      }
    }

    // Si llegamos aquí y no hay errores explícitos, considerar exitoso
    return response;
  });
}

const DEFAULT_SOURCE_CRS = 'EPSG:4326';

function normalizeAuthId(authId) {
  if (!authId || typeof authId !== 'string') {
    return null;
  }
  return authId.trim().toUpperCase();
}

function buildSrsName(authId = DEFAULT_SOURCE_CRS) {
  const normalized = normalizeAuthId(authId) || DEFAULT_SOURCE_CRS;
  if (normalized === 'CRS:84') {
    return 'http://www.opengis.net/def/crs/CRS/0/84';
  }
  const [authority, code] = normalized.split(':');
  if (!authority || !code) {
    return 'http://www.opengis.net/def/crs/EPSG/0/4326';
  }
  return `http://www.opengis.net/def/crs/${authority}/0/${code}`;
}

function formatCoordinatePair(coord, axisOrder = 'lonlat') {
  if (!Array.isArray(coord) || coord.length < 2) {
    return '';
  }
  const [lng, lat] = coord;
  if (axisOrder === 'latlon') {
    return `${lat},${lng}`;
  }
  return `${lng},${lat}`;
}

const GEOMETRY_BASE_TYPES = [
  // Priorizar coincidencias exactas o más específicas primero
  { matcher: (value) => value === 'POINT' || value === 'MULTIPOINT' || (value.includes('POINT') && !value.includes('LINE') && !value.includes('POLYGON')), type: 'POINT' },
  { matcher: (value) => value === 'POLYGON' || value === 'MULTIPOLYGON' || (value.includes('POLYGON') && !value.includes('POINT') && !value.includes('LINE')), type: 'POLYGON' },
  { matcher: (value) => value === 'LINESTRING' || value === 'MULTILINESTRING' || value.includes('LINE') || value.includes('CURVE'), type: 'LINESTRING' },
  { matcher: (value) => value.includes('SURFACE'), type: 'POLYGON' }
];

function cloneGeometry(geometry) {
  return JSON.parse(JSON.stringify(geometry));
}

function getLayerGeometryInfo(layerConfig) {
  // Priorizar wkbType_name original, luego otros campos
  // Si wkbType_name es "LineGeometry" pero debería ser "Point", 
  // intentar detectar el tipo correcto basándose en otros indicadores
  const rawType = (layerConfig?.wkbType_name ||
    layerConfig?.geometryType ||
    layerConfig?.geometryTypeName ||
    layerConfig?.type ||
    '').toString().toUpperCase();

  if (!rawType) {
    return { baseType: null, isMulti: false };
  }

  // Si el tipo es "LineGeometry" (genérico), intentar detectar el tipo real
  // basándose en el nombre de la capa o en el wkbType numérico
  let typeToUse = rawType;
  if (rawType === 'LINEGEOMETRY' || rawType === 'GEOMETRY') {
    // Intentar inferir el tipo desde el nombre de la capa o wkbType
    const layerName = (layerConfig?.name || '').toLowerCase();
    const wkbType = layerConfig?.wkbType;
    
    // wkbType: 1=Point, 2=LineString, 3=Polygon, etc.
    if (wkbType === 1 || layerName.includes('punto') || layerName.includes('point')) {
      typeToUse = 'POINT';
    } else if (wkbType === 2 || layerName.includes('linea') || layerName.includes('line')) {
      typeToUse = 'LINESTRING';
    } else if (wkbType === 3 || layerName.includes('poligono') || layerName.includes('polygon')) {
      typeToUse = 'POLYGON';
    }
  }

  const base = GEOMETRY_BASE_TYPES.find(entry => entry.matcher(typeToUse));
  const baseType = base ? base.type : null;
  const isMulti = typeToUse.includes('MULTI') || rawType.includes('MULTI');
  return { baseType, isMulti };
}

function wrapGeometryInMulti(geometry) {
  if (!geometry) return geometry;
  const type = geometry.type;
  if (!type) return geometry;
  if (type.startsWith('Multi')) return geometry;
  if (type === 'Point') {
    return { type: 'MultiPoint', coordinates: [geometry.coordinates] };
  }
  if (type === 'LineString') {
    return { type: 'MultiLineString', coordinates: [geometry.coordinates] };
  }
  if (type === 'Polygon') {
    return { type: 'MultiPolygon', coordinates: [geometry.coordinates] };
  }
  return geometry;
}

function unwrapMultiGeometry(geometry) {
  if (!geometry || !geometry.type || !geometry.type.startsWith('Multi')) {
    return geometry;
  }

  const { coordinates } = geometry;
  if (!Array.isArray(coordinates) || coordinates.length !== 1) {
    throw new Error('La capa espera geometrías simples, pero se ha dibujado una geometría múltiple.');
  }

  const innerCoords = coordinates[0];
  if (geometry.type === 'MultiPoint') {
    return { type: 'Point', coordinates: innerCoords };
  }
  if (geometry.type === 'MultiLineString') {
    return { type: 'LineString', coordinates: innerCoords };
  }
  if (geometry.type === 'MultiPolygon') {
    return { type: 'Polygon', coordinates: innerCoords };
  }
  return geometry;
}

function ensureRingClosed(ring) {
  if (!Array.isArray(ring) || ring.length === 0) {
    return ring || [];
  }
  const first = ring[0];
  const last = ring[ring.length - 1];
  if (!first || !last) return ring;
  if (Math.abs(first[0] - last[0]) < 1e-12 && Math.abs(first[1] - last[1]) < 1e-12) {
    return ring;
  }
  return [...ring, [...first]];
}

function coordsToCoordinateString(coords, close = false, axisOrder = 'lonlat') {
  if (!Array.isArray(coords)) return '';
  const processed = close ? ensureRingClosed(coords) : coords;
  return processed.map((coord) => formatCoordinatePair(coord, axisOrder)).join(' ');
}

function polygonToGml(rings, srsName, axisOrder) {
  if (!Array.isArray(rings) || rings.length === 0) {
    throw new Error('La geometría de polígono no contiene anillos válidos.');
  }
  const [outer, ...inners] = rings;
  
  // Asegurar que outer es un array de coordenadas [x, y]
  if (!Array.isArray(outer) || outer.length === 0) {
    throw new Error('El anillo exterior del polígono no es válido.');
  }
  
  // Validar estructura: outer debe ser un array de coordenadas [[x,y], [x,y], ...]
  if (outer.length > 0 && !Array.isArray(outer[0])) {
    throw new Error('El anillo exterior del polígono no tiene la estructura de coordenadas correcta.');
  }
  
  // Validar que cada coordenada tiene 2 elementos [x, y] o [lng, lat]
  if (outer.length > 0 && (!Array.isArray(outer[0]) || outer[0].length < 2)) {
    throw new Error('Las coordenadas del anillo exterior no son válidas.');
  }
  
  // Formatear coordenadas del anillo exterior con el axisOrder correcto
  const outerCoords = coordsToCoordinateString(outer, true, axisOrder);
  
  let gml = `<gml:Polygon srsName="${srsName}">`;
  gml += `<gml:outerBoundaryIs><gml:LinearRing><gml:coordinates decimal="." cs="," ts=" ">${outerCoords}</gml:coordinates></gml:LinearRing></gml:outerBoundaryIs>`;
  inners.forEach(hole => {
    if (Array.isArray(hole) && hole.length > 0 && Array.isArray(hole[0]) && hole[0].length >= 2) {
      const holeCoords = coordsToCoordinateString(hole, true, axisOrder);
      gml += `<gml:innerBoundaryIs><gml:LinearRing><gml:coordinates decimal="." cs="," ts=" ">${holeCoords}</gml:coordinates></gml:LinearRing></gml:innerBoundaryIs>`;
    }
  });
  gml += '</gml:Polygon>';
  return gml;
}

function geometryToGml(geometry, options = {}) {
  if (!geometry || !geometry.type) {
    throw new Error('No se ha proporcionado una geometría válida.');
  }
  const { srsName = buildSrsName(DEFAULT_SOURCE_CRS), axisOrder = 'lonlat' } = options;
  const type = geometry.type.toUpperCase();
  if (type === 'POINT') {
    const coord = geometry.coordinates;
    return `<gml:Point srsName="${srsName}"><gml:coordinates decimal="." cs="," ts=" ">${formatCoordinatePair(coord, axisOrder)}</gml:coordinates></gml:Point>`;
  }
  if (type === 'MULTIPOINT') {
    const parts = (geometry.coordinates || []).map(coord =>
      `<gml:pointMember><gml:Point srsName="${srsName}"><gml:coordinates decimal="." cs="," ts=" ">${formatCoordinatePair(coord, axisOrder)}</gml:coordinates></gml:Point></gml:pointMember>`
    ).join('');
    return `<gml:MultiPoint srsName="${srsName}">${parts}</gml:MultiPoint>`;
  }
  if (type === 'LINESTRING') {
    return `<gml:LineString srsName="${srsName}"><gml:coordinates decimal="." cs="," ts=" ">${coordsToCoordinateString(geometry.coordinates, false, axisOrder)}</gml:coordinates></gml:LineString>`;
  }
  if (type === 'MULTILINESTRING') {
    const members = (geometry.coordinates || []).map(line =>
      `<gml:lineStringMember><gml:LineString srsName="${srsName}"><gml:coordinates decimal="." cs="," ts=" ">${coordsToCoordinateString(line, false, axisOrder)}</gml:coordinates></gml:LineString></gml:lineStringMember>`
    ).join('');
    return `<gml:MultiLineString srsName="${srsName}">${members}</gml:MultiLineString>`;
  }
  if (type === 'POLYGON') {
    return polygonToGml(geometry.coordinates || [], srsName, axisOrder);
  }
  if (type === 'MULTIPOLYGON') {
    // MultiPolygon: coordinates es un array de polígonos
    // Cada polígono es un array de rings: [[ring1], [ring2], ...]
    // Cada ring es un array de coordenadas: [[x,y], [x,y], ...]
    // IMPORTANTE: Para MultiPolygon, necesitamos invertir el axisOrder
    // Si axisOrder es 'latlon', usamos 'lonlat' y viceversa
    const invertedAxisOrder = axisOrder === 'latlon' ? 'lonlat' : 'latlon';
    const members = (geometry.coordinates || []).map((poly) => {
      // Validar que poly es un array de rings
      if (!Array.isArray(poly) || poly.length === 0) {
        return '';
      }
      // Validar que el primer elemento es un ring (array de coordenadas)
      if (!Array.isArray(poly[0]) || poly[0].length === 0 || !Array.isArray(poly[0][0])) {
        return '';
      }
      return `<gml:polygonMember>${polygonToGml(poly, srsName, invertedAxisOrder)}</gml:polygonMember>`;
    }).filter(m => m !== '').join('');
    return `<gml:MultiPolygon srsName="${srsName}">${members}</gml:MultiPolygon>`;
  }
  throw new Error(`Tipo de geometría no soportado: ${geometry.type}`);
}

function buildInsertPropertiesXml(properties) {
  if (!properties || typeof properties !== 'object') {
    return '';
  }
  let xml = '';
  Object.entries(properties).forEach(([key, value]) => {
    if (value === undefined || value === null) {
      return;
    }
    const safeKey = key.replace(/\s+/g, '_');
    const escapedValue = escapeString(value);
    if (escapedValue === '') {
      xml += `<qgs:${safeKey}/>`;
    } else {
      xml += `<qgs:${safeKey}>${escapedValue}</qgs:${safeKey}>`;
    }
  });
  return xml;
}

function buildInsertTransactionXml(layerName, geometryGml, propertiesXml) {
  const safeLayerName = layerName.replace(/\s+/g, '_');
  return `<?xml version="1.0" encoding="UTF-8"?>
<wfs:Transaction service="WFS" version="1.0.0" xmlns:wfs="http://www.opengis.net/wfs" xmlns:xsi="http://www.w3.org/2001/XMLSchema-instance" xmlns:ogc="http://www.opengis.net/ogc" xmlns="http://www.opengis.net/wfs" updateSequence="0" xmlns:xlink="http://www.w3.org/1999/xlink" xsi:schemaLocation="http://www.opengis.net/wfs http://schemas.opengis.net/wfs/1.0.0/WFS-capabilities.xsd" xmlns:gml="http://www.opengis.net/gml" xmlns:ows="http://www.opengis.net/ows" xmlns:qgs="http://www.qgis.org/gml">
  <wfs:Insert idgen="GenerateNew">
    <qgs:${safeLayerName}>
      <qgs:geometry>${geometryGml}</qgs:geometry>
      ${propertiesXml}
    </qgs:${safeLayerName}>
  </wfs:Insert>
</wfs:Transaction>`;
}

export async function insertFeatureWithGeometry(
  qgsUrl,
  qgsProjectPath,
  layerName,
  geometry,
  properties = {},
  token = null,
  layerConfig = null
) {
  if (!qgsUrl || !qgsProjectPath) {
    throw new Error('No se han configurado los parámetros de conexión con QGIS Server.');
  }
  if (!layerName) {
    throw new Error('Debe especificarse una capa para insertar la geometría.');
  }
  if (!geometry) {
    throw new Error('No hay geometría para guardar.');
  }

  const geometrySnapshot = cloneGeometry(geometry);
  const { baseType, isMulti } = getLayerGeometryInfo(layerConfig);
  let normalizedGeometry = geometrySnapshot;

  if (isMulti) {
    normalizedGeometry = wrapGeometryInMulti(normalizedGeometry);
  } else if (normalizedGeometry?.type && normalizedGeometry.type.toUpperCase().startsWith('MULTI')) {
    normalizedGeometry = unwrapMultiGeometry(normalizedGeometry);
  }

  // Validar que el tipo de geometría coincida con el esperado por la capa
  // Solo validamos si podemos determinar con certeza el tipo de la capa
  // Si no hay tipo claro, confiamos en que el toolbar ya filtró las capas correctas
  if (baseType && normalizedGeometry?.type) {
    const geometryTypeUpper = normalizedGeometry.type.toUpperCase();
    const baseTypeUpper = baseType.toUpperCase();
    
    // Mapeo de tipos base a tipos de geometría permitidos
    const allowedTypes = {
      'POINT': ['POINT', 'MULTIPOINT'],
      'LINESTRING': ['LINESTRING', 'MULTILINESTRING'],
      'POLYGON': ['POLYGON', 'MULTIPOLYGON']
    };
    
    const allowed = allowedTypes[baseTypeUpper];
    if (allowed && !allowed.includes(geometryTypeUpper)) {
      // Si la validación falla, pero no tenemos certeza del tipo de capa (por ejemplo, si el rawType
      // contiene palabras ambiguas), permitimos la inserción ya que el toolbar ya filtró las capas
      const rawType = (layerConfig?.wkbType_name ||
        layerConfig?.geometryType ||
        layerConfig?.geometryTypeName ||
        layerConfig?.type ||
        '').toString().toUpperCase();
      
      // Si el rawType es ambiguo o no coincide claramente con el baseType detectado,
      // confiamos en que el toolbar filtró correctamente y permitimos la inserción
      const isAmbiguous = rawType && (
        (baseTypeUpper === 'LINESTRING' && (rawType.includes('POINT') || !rawType.includes('LINE'))) ||
        (baseTypeUpper === 'POINT' && rawType.includes('LINE')) ||
        (baseTypeUpper === 'POLYGON' && (rawType.includes('POINT') || rawType.includes('LINE')))
      );
      
      if (!isAmbiguous) {
        throw new Error(`La capa espera geometrías de tipo ${baseType}, pero se ha proporcionado ${normalizedGeometry.type}.`);
      }
      // Si es ambiguo, permitimos la inserción (el toolbar ya validó que la capa es compatible)
    }
  }

  // Siempre enviamos en EPSG:4326 tal como se dibuja en el mapa (Leaflet)
  // WFS 1.1 + EPSG:4326 requiere orden lat,lon en el GML
  const targetSrsName = buildSrsName(DEFAULT_SOURCE_CRS);
  const targetAxisOrder = 'latlon';

  const geometryGml = geometryToGml(normalizedGeometry, { srsName: targetSrsName, axisOrder: targetAxisOrder });
  const propertiesXml = buildInsertPropertiesXml(properties);
  const xml = buildInsertTransactionXml(layerName, geometryGml, propertiesXml);

  const params = new URLSearchParams({
    SERVICE: 'WFS',
    VERSION: '1.1.0',
    REQUEST: 'Transaction',
    MAP: qgsProjectPath,
    ...(token ? { TOKEN: token } : {})
  });

  const headers = {
    'Content-Type': 'text/xml',
    'Accept': 'application/xml, text/xml, */*'
  };
  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const response = await fetch(`${qgsUrl}?${params.toString()}`, {
    method: 'POST',
    headers,
    body: xml
  });

  const responseText = await response.text();
  const parser = new DOMParser();
  const xmlDoc = parser.parseFromString(responseText, 'text/xml');

  if (!response.ok) {
    const exceptionReport = xmlDoc.querySelector('ServiceException, ServiceExceptionReport ServiceException');
    if (exceptionReport) {
      throw new Error(exceptionReport.textContent || 'Error desconocido del servidor WFS');
    }
    throw new Error(`HTTP error: ${response.status} ${response.statusText}`);
  }

  const exceptionReport = xmlDoc.querySelector('ServiceException, ServiceExceptionReport ServiceException');
  if (exceptionReport) {
    throw new Error(exceptionReport.textContent || 'Error en la transacción WFS.');
  }

  const insertedFeature = xmlDoc.querySelector('ogc\\:FeatureId, FeatureId, wfs\\:FeatureId');
  const fid = insertedFeature?.getAttribute('fid') || insertedFeature?.getAttribute('gml:id') || null;

  return {
    fid,
    rawResponse: responseText
  };
}
