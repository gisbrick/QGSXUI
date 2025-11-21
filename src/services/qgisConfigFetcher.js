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

// Servicio que obtiene las leyendas de las capas del proyecto QGIS
// Similar a legacy: QgisService.LEGEND
export async function fetchLegend(qgsUrl, qgsProjectPath, layerNames, token) {
  if (!layerNames || layerNames.length === 0) {
    return { nodes: [] };
  }

  // Unir los nombres de capas con comas
  const layersParam = Array.isArray(layerNames) ? layerNames.join(',') : layerNames;
  
  let legendUrl = `${qgsUrl}?SERVICE=WMS&REQUEST=GetLegendGraphic&FORMAT=application/json&version=1.1.1&srs=EPSG:3857&layers=${encodeURIComponent(layersParam)}&width=1256&styles=&MAP=${encodeURIComponent(qgsProjectPath)}`;
  if (token) {
    legendUrl += `&TOKEN=${token}`;
  }
  
  const resp = await fetch(legendUrl);
  if (!resp.ok) {
    throw new Error('Error fetching legend');
  }
  return resp.json();
}


