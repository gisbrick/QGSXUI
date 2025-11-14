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
  console.log('Headers:', headers);
  console.log('XML Body (string):');
  console.log(xmlString);
  console.log('XML Body length:', xmlString.length);
  console.log('XML Body type:', typeof xmlString);
  console.log('==============================');

  const response = await fetch(`${url}?${params.toString()}`, {
    method: 'POST',
    headers: headers,
    body: xmlString
  });

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



