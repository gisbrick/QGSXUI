// Utilidades para el manejo de mapas QGIS

/**
 * Establece la vista del mapa usando viewExtent del proyecto QGIS
 * Replica la lógica del legacy: usa las coordenadas directamente sin conversión
 * @param {object} map - Instancia del mapa Leaflet
 * @param {object} viewExtent - Extensión de la vista del proyecto (xMinimum, xMaximum, yMinimum, yMaximum)
 */
export function setView(map, viewExtent) {
  if (!map || !viewExtent) {
    return;
  }

  // En el legacy se usa directamente sin conversión
  // viewExtent viene en grados (EPSG:4326) aunque el CRS del proyecto sea otro
  // Leaflet usa [lat, lng] que es [y, x] en WGS84
  var mapBounds = window.L.latLngBounds([
    [viewExtent.yMaximum, viewExtent.xMinimum],  // Esquina superior izquierda (norte-oeste)
    [viewExtent.yMinimum, viewExtent.xMaximum]   // Esquina inferior derecha (sur-este)
  ]);

  // Guardar estado de las interacciones antes de fitBounds
  const wasDraggingEnabled = map.dragging && map.dragging.enabled();
  const wasScrollWheelZoomEnabled = map.scrollWheelZoom && map.scrollWheelZoom.enabled();

  // Aplicar fitBounds sin animación para evitar que se deshabiliten las interacciones
  map.fitBounds(mapBounds, { animate: false, padding: [20, 20] });

  // Asegurar que las interacciones estén habilitadas después de fitBounds
  // fitBounds puede deshabilitar temporalmente las interacciones durante la animación
  if (map.dragging && !map.dragging.enabled() && wasDraggingEnabled) {
    map.dragging.enable();
  }
  if (map.scrollWheelZoom && !map.scrollWheelZoom.enabled() && wasScrollWheelZoomEnabled) {
    map.scrollWheelZoom.enable();
  }
}

/**
 * Verifica si una capa es una capa base (está en WMTSLAYERS)
 * @param {string} layerName - Nombre de la capa
 * @param {object} WMTSLAYERS - Configuración de capas base WMTSLAYERS
 * @returns {boolean} - true si es capa base, false en caso contrario
 */
export function layerIsBaseLayer(layerName, WMTSLAYERS) {
  if (!WMTSLAYERS?.layers || !Array.isArray(WMTSLAYERS.layers)) {
    return false;
  }
  
  for (let i = 0; i < WMTSLAYERS.layers.length; i++) {
    if (WMTSLAYERS.layers[i].name === layerName) {
      return true;
    }
  }
  return false;
}

/**
 * Obtiene las capas visibles recorriendo recursivamente los children del layerTree
 * Excluye las capas que son base layers de WMTSLAYERS
 * @param {array} children - Array de children del layerTree
 * @param {array} visibleLayers - Array acumulativo de capas visibles (se pasa por referencia)
 * @param {object} WMTSLAYERS - Configuración de capas base WMTSLAYERS (puede ser null)
 * @returns {array} - Array de nombres de capas visibles
 */
export function getVisibleLayersInChildren(children, visibleLayers = [], WMTSLAYERS = null) {
  if (!children || !Array.isArray(children)) {
    return visibleLayers;
  }

  // Invertir el array para mantener el orden correcto (último primero, como en el legacy)
  let childrenAux = children.slice().reverse();
  
  for (let i = 0; i < childrenAux.length; i++) {
    let child = childrenAux[i];
    
    // Convertir isVisible a booleano si es string (como en el legacy)
    if (typeof child.isVisible !== 'boolean') {
      child.isVisible = child.isVisible === true || child.isVisible === 'true' || child.isVisible === 1;
    }
    
    // Si tiene children y es visible, recorrer recursivamente
    if (child.children && Array.isArray(child.children) && child.children.length > 0 && child.isVisible) {
      getVisibleLayersInChildren(child.children, visibleLayers, WMTSLAYERS);
    } else {
      // Si es visible y es una capa (nodeType === '1'), añadirla si no es capa base
      if (child.isVisible && child.nodeType === '1' && child.name) {
        // Excluir si es capa base de WMTSLAYERS (como en el legacy: layerIsBaseLayer)
        if (!WMTSLAYERS || !layerIsBaseLayer(child.name, WMTSLAYERS)) {
          visibleLayers.push(child.name);
        }
      }
    }
  }
  
  return visibleLayers;
}

/**
 * Obtiene los filtros WMS configurados en las capas QGIS
 * Formato: layerName: "filter"; layerName2: "filter2"
 * @param {object} QGISPRJ - Configuración del proyecto QGIS
 * @param {array} layers - Array de nombres de capas
 * @returns {string} - String con los filtros formateados
 */
export function getWMSFilters(QGISPRJ, layers) {
  if (!QGISPRJ?.layers || !Array.isArray(layers)) {
    return '';
  }

  let filters = [];
  
  for (let i = 0; i < layers.length; i++) {
    let layerName = layers[i];
    if (layerName in QGISPRJ.layers) {
      let qgslayer = QGISPRJ.layers[layerName];
      if (qgslayer.filter) {
        // Remover "1=1 AND " del inicio del filtro si existe
        let filter = qgslayer.filter.replace(/^1=1\s+AND\s+/i, '');
        if (filter) {
          filters.push(`${layerName}: ${filter}`);
        }
      }
    }
  }
  
  return filters.join(';');
}

/**
 * Crea una capa base XYZ
 * @param {object} WMTSLAYER - Configuración de la capa base
 * @returns {object} - Capa Leaflet XYZ
 */
export function createBaseLayerXYZ(WMTSLAYER) {
  if (!WMTSLAYER?.source?.url) {
    return null;
  }
  
  try {
    let url = decodeURIComponent(WMTSLAYER.source.url);
    return window.L.tileLayer(url, {
      maxZoom: WMTSLAYER.zmax || 18,
      attribution: WMTSLAYER.attribution || ''
    });
  } catch (error) {
    console.error('Error creating XYZ base layer:', error);
    return null;
  }
}

/**
 * Crea una capa base WMS
 * @param {object} WMTSLAYER - Configuración de la capa base
 * @returns {object} - Capa Leaflet WMS
 */
export function createBaseLayerWMS(WMTSLAYER) {
  if (!WMTSLAYER?.source?.url || !WMTSLAYER?.source?.layers) {
    return null;
  }
  
  try {
    let url = decodeURIComponent(WMTSLAYER.source.url);
    return window.L.tileLayer.wms(url, {
      maxZoom: WMTSLAYER.zmax || 18,
      layers: WMTSLAYER.source.layers,
      format: WMTSLAYER.source.format || 'image/png',
      continuousWorld: true,
      attribution: WMTSLAYER.attribution || ''
    });
  } catch (error) {
    console.error('Error creating WMS base layer:', error);
    return null;
  }
}

/**
 * Crea una capa base WMTS
 * @param {object} WMTSLAYER - Configuración de la capa base
 * @returns {Promise<object>} - Promise que resuelve a una capa Leaflet WMTS
 */
export async function createBaseLayerWMTS(WMTSLAYER) {
  if (!WMTSLAYER?.source?.url || !WMTSLAYER?.source?.tileMatrixSet) {
    return null;
  }

  try {
    let url = decodeURIComponent(WMTSLAYER.source.url);
    let baseUrl = url.split('?')[0];
    
    // Verificar si el plugin WMTS está disponible
    if (window.L && window.L.TileLayer && window.L.TileLayer.WMTS) {
      // Usar el plugin WMTS de Leaflet si está disponible
      return window.L.tileLayer.wmts(baseUrl, {
        layers: WMTSLAYER.source.layers,
        styles: WMTSLAYER.source.styles || '',
        tilematrixSet: WMTSLAYER.source.tileMatrixSet,
        format: WMTSLAYER.source.format || 'image/jpeg',
        attribution: WMTSLAYER.attribution || '',
        maxZoom: WMTSLAYER.zmax || 18
      });
    } else {
      // Fallback: intentar obtener GetCapabilities para WMTS (código complejo del legacy)
      // Por simplicidad, usamos WMS como fallback
      console.warn('WMTS plugin not available, using WMS fallback');
      return createBaseLayerWMS(WMTSLAYER);
    }
  } catch (error) {
    console.error('Error creating WMTS base layer:', error);
    return null;
  }
}

/**
 * Crea una capa base según su tipo (XYZ, WMTS, o WMS)
 * @param {object} WMTSLAYER - Configuración de la capa base
 * @returns {Promise<object>} - Promise que resuelve a una capa Leaflet
 */
export async function createBaseLayer(WMTSLAYER) {
  if (!WMTSLAYER?.source) {
    return null;
  }

  // Verificar tipo XYZ
  if (WMTSLAYER.source.type && WMTSLAYER.source.type.toUpperCase() === 'XYZ') {
    return createBaseLayerXYZ(WMTSLAYER);
  }
  
  // Verificar tipo WMTS (tiene tileMatrixSet)
  if (WMTSLAYER.source.tileMatrixSet) {
    return await createBaseLayerWMTS(WMTSLAYER);
  }
  
  // Por defecto, tratar como WMS
  return createBaseLayerWMS(WMTSLAYER);
}

/**
 * Obtiene todas las capas base disponibles
 * @param {object} WMTSLAYERS - Configuración de capas base WMTSLAYERS
 * @returns {Promise<array>} - Promise que resuelve a un array de capas base
 */
export async function getBaseLayers(WMTSLAYERS) {
  if (!WMTSLAYERS?.layers || !Array.isArray(WMTSLAYERS.layers) || WMTSLAYERS.layers.length === 0) {
    return [];
  }

  let baseLayers = [];
  
  for (let i = 0; i < WMTSLAYERS.layers.length; i++) {
    let WMTSLAYER = WMTSLAYERS.layers[i];
    let baseLayer = await createBaseLayer(WMTSLAYER);
    if (baseLayer != null) {
      baseLayer.WMTSLAYER = WMTSLAYER;
      baseLayers.push(baseLayer);
    }
  }
  
  return baseLayers;
}
