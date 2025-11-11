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



