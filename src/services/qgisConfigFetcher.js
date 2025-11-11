// Servicio que obtiene la configuración del proyecto QGIS desde QGIS Server
export async function fetchQgisConfig(qgsUrl, qgsProjectPath, token) {
  let projectUrl = `${qgsUrl}?SERVICE=WMS&REQUEST=GetCapabilities&MAP=${encodeURIComponent(qgsProjectPath)}&SERVICE=QGISPRJ`;
  if (token) {
    projectUrl += `&TOKEN=${token}`;
  }
  const resp = await fetch(projectUrl);
  if (!resp.ok) {   
    throw new Error('Error fetching QGIS config');
  }
  return resp.json();
}

// Servicio que obtiene la lista de capas base (WMTS/WMS) del proyecto QGIS
export async function fetchBaseLayers(qgsUrl, qgsProjectPath, token) {
  let baseLayersUrl = `${qgsUrl}?SERVICE=WMTSLAYERS&MAP=${encodeURIComponent(qgsProjectPath)}`;
  if (token) {
    baseLayersUrl += `&TOKEN=${token}`;
  }
  const resp = await fetch(baseLayersUrl);
  if (!resp.ok) {   
    throw new Error('Error fetching base layers');
  }
  return resp.json();
}


