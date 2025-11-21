import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import PropTypes from 'prop-types';
import { QgisConfigContext } from '../QgisConfigContext';
import { fetchFeatureCount, fetchFeatures, fetchFeatureById } from '../../../services/qgisWFSFetcher';
import { LoadingQGS } from '../../UI_QGS';
import './Table.css';
import ColumnFilterPopover from './filters/ColumnFilterPopover';
import { buildFilterQuery } from './filters/filterUtils';
import { getTableState, setTableState } from './tableStateStore';
import { useColumnResize } from './hooks/useColumnResize';
import TableActionsColumn, { calculateActionsColumnWidth } from './TableActionsColumn';

// Importar condicionalmente el contexto del mapa para evitar dependencias circulares
let useMap = null;
try {
  const mapProvider = require('../Map/MapProvider');
  useMap = mapProvider.useMap;
} catch (e) {
  // Si no está disponible, continuar sin él
}

/**
 * Tabla con scroll infinito que carga los datos de forma lazy según se avanza.
 */
const TableInfiniteScroll = ({ layerName, chunkSize = 50, height = 360, onFilterChange, onMinimizeDrawer, mapInstance: mapInstanceProp, startEditingGeometry: startEditingGeometryProp, isVisible = true }) => {
  const { config, t, notificationManager, qgsUrl, qgsProjectPath, token } =
    useContext(QgisConfigContext);
  
  // Obtener mapInstance y startEditingGeometry: primero de props, luego del contexto del mapa
  let mapInstance = mapInstanceProp || null;
  let startEditingGeometry = startEditingGeometryProp || null;
  
  // Si no vienen como props, intentar obtenerlos del contexto
  if (!mapInstance || !startEditingGeometry) {
    try {
      if (useMap) {
        const mapContext = useMap();
        mapInstance = mapInstance || mapContext?.mapInstance || null;
        startEditingGeometry = startEditingGeometry || mapContext?.startEditingGeometry || null;
        console.log('[TableInfiniteScroll] Contexto del mapa obtenido:', {
          hasMapInstance: !!mapInstance,
          hasStartEditingGeometry: !!startEditingGeometry,
          fromProps: { mapInstance: !!mapInstanceProp, startEditingGeometry: !!startEditingGeometryProp },
          mapContextKeys: mapContext ? Object.keys(mapContext) : []
        });
      } else {
        console.warn('[TableInfiniteScroll] useMap no está disponible');
      }
    } catch (e) {
      // Si no está disponible el contexto del mapa, continuar sin él
      console.warn('[TableInfiniteScroll] No se pudo obtener el contexto del mapa:', e);
    }
  }
  const translate = typeof t === 'function' ? t : (key) => key;
  const tableId = useMemo(() => `table-infinite-${layerName}`, [layerName]);
  const persistentState = useMemo(() => getTableState(tableId) || {}, [tableId]);

  const layer = config?.layers?.[layerName];

  const columns = useMemo(() => {
    if (!layer?.fields || !Array.isArray(layer.fields)) {
      return [];
    }
    return layer.fields.map((field) => ({
      field: field.name,
      label: field.alias || field.name
    }));
  }, [layer]);

  const [rows, setRows] = useState([]);
  const [featuresData, setFeaturesData] = useState([]); // Guardar features completas con id
  // Inicializar selectedRows desde el estado persistente
  const [selectedRows, setSelectedRows] = useState(() => {
    const saved = persistentState.selectedRows;
    return saved && Array.isArray(saved) ? new Set(saved) : new Set();
  });
  const [hasMore, setHasMore] = useState(true);
  const selectionLayerRef = useRef(null); // Capa de selección en el mapa
  const selectedFeaturesMapRef = useRef(new Map()); // Mapa de featureId -> layer para poder eliminar específicamente
  const [totalCount, setTotalCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const offsetRef = useRef(persistentState.offset ?? 0);
  const containerRef = useRef(null);
  const scrollListenerRef = useRef(null);
  const [sortState, setSortState] = useState(persistentState.sortState || { field: null, direction: null });
  const [columnFilters, setColumnFilters] = useState(persistentState.columnFilters || {});
  const [filterPopover, setFilterPopover] = useState(null);
  const popoverRef = useRef(null);
  const [scrollRestored, setScrollRestored] = useState(false);
  const savedScrollLeftRef = useRef(0);
  const savedScrollTopRef = useRef(0);
  
  // Hook para redimensionamiento de columnas
  const { getColumnWidth, handleMouseDown, resizing } = useColumnResize(tableId, columns, 50, 150);

  // Persistir estado
  useEffect(() => {
    setTableState(tableId, {
      offset: offsetRef.current,
      scrollTop: containerRef.current ? containerRef.current.scrollTop : (persistentState.scrollTop || 0),
      scrollLeft: containerRef.current ? containerRef.current.scrollLeft : (persistentState.scrollLeft || 0),
      sortState,
      columnFilters,
      selectedRows: Array.from(selectedRows) // Convertir Set a Array para guardar
    });
  }, [tableId, sortState, columnFilters, persistentState.scrollTop, persistentState.scrollLeft, selectedRows]);

  // Ref para rastrear el estado anterior de isVisible
  const prevIsVisibleRef = useRef(isVisible);
  
  // Guardar scroll continuamente mientras el drawer está visible
  // Esto asegura que siempre tenemos el scroll más reciente guardado
  useEffect(() => {
    if (!isVisible || !containerRef.current) return;
    
    // Guardar el scroll actual periódicamente mientras está visible
    const intervalId = setInterval(() => {
      if (containerRef.current && isVisible) {
        const currentScrollLeft = containerRef.current.scrollLeft;
        const currentScrollTop = containerRef.current.scrollTop;
        
        // Guardar siempre, incluso si es 0, para tener el estado actual
        setTableState(tableId, {
          scrollLeft: currentScrollLeft,
          scrollTop: currentScrollTop
        });
        
        // Solo loggear si hay scroll significativo para no llenar la consola
        if (currentScrollLeft > 10 || currentScrollTop > 10) {
          console.log('[TableInfiniteScroll] Scroll guardado periódicamente:', {
            left: currentScrollLeft,
            top: currentScrollTop,
            tableId
          });
        }
      }
    }, 300); // Guardar cada 300ms mientras está visible
    
    return () => clearInterval(intervalId);
  }, [isVisible, tableId]);

  // Guardar scroll cuando el drawer se minimiza (isVisible cambia de true a false)
  useEffect(() => {
    const wasVisible = prevIsVisibleRef.current;
    const isNowVisible = isVisible;
    prevIsVisibleRef.current = isVisible;
    
    // Verificar el estado de la capa de selección cuando cambia la visibilidad
    // Asegurar que la capa permanezca en el mapa incluso cuando se minimiza el drawer
    if (selectionLayerRef.current && mapInstance) {
      console.log('[TableInfiniteScroll] Cambio de visibilidad del drawer:', {
        wasVisible,
        isNowVisible,
        selectionLayerOnMap: mapInstance.hasLayer(selectionLayerRef.current),
        selectionLayerLayers: selectionLayerRef.current.getLayers().length,
        selectedRowsCount: selectedRows.size
      });

      // Si la capa de selección no está en el mapa, añadirla de nuevo
      // Esto asegura que las features seleccionadas permanezcan visibles
      if (!mapInstance.hasLayer(selectionLayerRef.current) && selectedRows.size > 0) {
        console.log('[TableInfiniteScroll] Restaurando capa de selección al mapa al cambiar visibilidad');
        selectionLayerRef.current.addTo(mapInstance);
        if (selectionLayerRef.current.bringToFront) {
          selectionLayerRef.current.bringToFront();
        }
      }
    }
    
    // Solo guardar cuando cambia de visible a no visible
    if (wasVisible && !isNowVisible) {
      console.log('[TableInfiniteScroll] Drawer se está minimizando, guardando scroll final...', {
        hasContainer: !!containerRef.current,
        containerScrollLeft: containerRef.current?.scrollLeft,
        containerScrollTop: containerRef.current?.scrollTop
      });
      
      // Guardar inmediatamente si el contenedor está disponible
      if (containerRef.current) {
        const currentScrollLeft = containerRef.current.scrollLeft;
        const currentScrollTop = containerRef.current.scrollTop;
        
        // Guardar siempre, incluso si es 0, para poder restaurar correctamente
        setTableState(tableId, {
          scrollLeft: currentScrollLeft,
          scrollTop: currentScrollTop
        });
        console.log('[TableInfiniteScroll] Scroll final guardado al minimizar drawer:', {
          left: currentScrollLeft,
          top: currentScrollTop,
          tableId
        });
      }
      
      // Resetear scrollRestored para permitir restauración cuando se vuelva a abrir
      setScrollRestored(false);
    }
  }, [isVisible, tableId]);

  // Restaurar scroll cuando el drawer se vuelve a abrir (isVisible cambia de false a true)
  useEffect(() => {
    if (!isVisible || rows.length === 0) {
      return;
    }
    
    // Si ya se restauró en esta sesión visible, no hacer nada
    if (scrollRestored) {
      return;
    }
    
    // Obtener el estado actualizado del store (puede haber cambiado desde que se montó)
    const currentState = getTableState(tableId) || {};
    const savedTop = currentState.scrollTop ?? persistentState.scrollTop ?? 0;
    const savedLeft = currentState.scrollLeft ?? persistentState.scrollLeft ?? 0;
    
    console.log('[TableInfiniteScroll] Intentando restaurar scroll al volver visible:', {
      top: savedTop,
      left: savedLeft,
      rowsLength: rows.length,
      scrollRestored,
      hasContainer: !!containerRef.current,
      currentStateFromStore: currentState,
      persistentState: { scrollTop: persistentState.scrollTop, scrollLeft: persistentState.scrollLeft },
      tableId
    });
    
    // Debug: mostrar todo el estado del store
    const fullState = getTableState(tableId);
    console.log('[TableInfiniteScroll] Estado completo del store para esta tabla:', fullState);
    console.log('[TableInfiniteScroll] Scroll actual del contenedor ANTES de restaurar:', {
      scrollLeft: containerRef.current?.scrollLeft,
      scrollTop: containerRef.current?.scrollTop
    });
    
    // Si no hay scroll guardado (ambos son 0 o undefined), marcar como restaurado y salir
    // Pero solo si realmente no hay scroll guardado (no si el usuario estaba en la parte superior)
    const hasStoredScroll = (currentState.scrollTop !== undefined && currentState.scrollTop !== null) ||
                            (currentState.scrollLeft !== undefined && currentState.scrollLeft !== null) ||
                            (persistentState.scrollTop !== undefined && persistentState.scrollTop !== null) ||
                            (persistentState.scrollLeft !== undefined && persistentState.scrollLeft !== null);
    
    if (!hasStoredScroll && savedTop === 0 && savedLeft === 0) {
      console.log('[TableInfiniteScroll] No hay scroll guardado en el store, marcando como restaurado');
      setScrollRestored(true);
      return;
    }
    
    // Usar requestAnimationFrame para asegurar que el DOM esté listo
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (!containerRef.current) {
          console.warn('[TableInfiniteScroll] containerRef.current es null al intentar restaurar scroll');
          return;
        }
        
        // Restaurar scroll vertical (solo si hay scroll guardado y es mayor que 0, o si hasStoredScroll es true)
        if (hasStoredScroll && typeof savedTop === 'number' && savedTop >= 0) {
          console.log('[TableInfiniteScroll] Restaurando scrollTop a:', savedTop);
          containerRef.current.scrollTop = savedTop;
        }
        // Restaurar scroll horizontal (solo si hay scroll guardado y es mayor que 0, o si hasStoredScroll es true)
        if (hasStoredScroll && typeof savedLeft === 'number' && savedLeft >= 0) {
          console.log('[TableInfiniteScroll] Restaurando scrollLeft a:', savedLeft);
          containerRef.current.scrollLeft = savedLeft;
        }
        
        console.log('[TableInfiniteScroll] Scroll restaurado, marcando scrollRestored = true');
        setScrollRestored(true);
      });
    });
  }, [isVisible, scrollRestored, persistentState.scrollTop, persistentState.scrollLeft, rows.length, tableId]);

  // Callback ref para registrar el listener cuando el contenedor esté disponible
  const containerRefCallback = useCallback((node) => {
    // Limpiar listener anterior si existe
    if (scrollListenerRef.current && containerRef.current) {
      containerRef.current.removeEventListener('scroll', scrollListenerRef.current);
      scrollListenerRef.current = null;
    }
    
    // Guardar referencia al nodo
    containerRef.current = node;
    
    // Si hay un nodo nuevo, registrar el listener
    if (node) {
      const handleScroll = () => {
        if (containerRef.current) {
          const currentScrollLeft = containerRef.current.scrollLeft;
          const currentScrollTop = containerRef.current.scrollTop;
          
          setTableState(tableId, { 
            scrollTop: currentScrollTop,
            scrollLeft: currentScrollLeft 
          });
        }
      };
      
      node.addEventListener('scroll', handleScroll, { passive: true });
      scrollListenerRef.current = handleScroll;
    }
  }, [tableId, isVisible]);
  
  // Limpiar listener al desmontar
  useEffect(() => {
    return () => {
      if (scrollListenerRef.current && containerRef.current) {
        containerRef.current.removeEventListener('scroll', scrollListenerRef.current);
        // Guardar posición final al desmontar
        if (containerRef.current) {
          setTableState(tableId, { 
            scrollTop: containerRef.current.scrollTop,
            scrollLeft: containerRef.current.scrollLeft 
          });
        }
        scrollListenerRef.current = null;
      }
    };
  }, [tableId]);

  // Almacenamiento global de capas de selección por tabla
  // Esto permite que las capas persistan incluso cuando el componente se desmonta
  const selectionLayersStore = useMemo(() => {
    if (typeof window !== 'undefined' && !window.__tableSelectionLayers) {
      window.__tableSelectionLayers = new Map();
    }
    return window.__tableSelectionLayers || new Map();
  }, []);

  // Crear y gestionar la capa de selección en el mapa
  // Esta capa debe permanecer en el mapa incluso cuando el drawer está minimizado
  useEffect(() => {
    if (!mapInstance || !window.L) {
      return;
    }

    // Obtener o crear la capa de selección para esta tabla desde el almacenamiento global
    let selectionLayer = selectionLayersStore.get(tableId);
    
    if (!selectionLayer) {
      // Crear nueva capa de selección
      selectionLayer = window.L.featureGroup([]);
      selectionLayer.addTo(mapInstance);
      // Asegurar que la capa de selección esté en el frente
      if (selectionLayer.bringToFront) {
        selectionLayer.bringToFront();
      }
      // Guardar en el almacenamiento global
      selectionLayersStore.set(tableId, selectionLayer);
      console.log('[TableInfiniteScroll] Capa de selección creada y guardada globalmente:', tableId);
    } else {
      // La capa ya existe, asegurar que esté en el mapa
      if (!mapInstance.hasLayer(selectionLayer)) {
        selectionLayer.addTo(mapInstance);
        // Asegurar que la capa de selección esté en el frente
        if (selectionLayer.bringToFront) {
          selectionLayer.bringToFront();
        }
        console.log('[TableInfiniteScroll] Capa de selección restaurada al mapa:', tableId);
      }
    }

    // Guardar referencia local
    selectionLayerRef.current = selectionLayer;

    // Restaurar las features seleccionadas si existen
    const storedSelectedRows = getTableState(tableId)?.selectedRows || [];
    if (storedSelectedRows.length > 0 && selectedFeaturesMapRef.current.size === 0) {
      // Restaurar referencias de features desde la capa existente
      storedSelectedRows.forEach(featureId => {
        // Verificar si la feature ya está en la capa
        const layers = selectionLayer.getLayers();
        // Intentar encontrar las capas correspondientes a esta feature
        // Esto es una aproximación - las capas pueden no tener referencia directa al featureId
        // Por eso usamos selectedFeaturesMapRef para rastrear
      });
    }

    // NO limpiar la selección cuando se minimiza el drawer o se desmonta el componente
    // La capa permanecerá en el mapa y en el almacenamiento global
    // Solo se limpiará explícitamente cuando se cierre la tabla (ver función cleanupSelectionLayer)
    return () => {
      // No hacer nada aquí - la capa debe persistir
      // Solo limpiar la referencia local, pero mantener la capa en el mapa y en el store
      console.log('[TableInfiniteScroll] Componente desmontado, pero capa de selección persiste:', tableId);
    };
  }, [mapInstance, tableId, selectionLayersStore]);

  // Función para añadir una feature al mapa como selección
  const addFeatureToMapSelection = async (featureId) => {
    if (!mapInstance || !qgsUrl || !qgsProjectPath || !layerName || !window.L) {
      return;
    }

    // Obtener la capa de selección desde el almacenamiento global o la referencia local
    let selectionLayer = selectionLayerRef.current || selectionLayersStore.get(tableId);

    // Verificar si la feature ya está en el mapa antes de añadirla
    if (selectedFeaturesMapRef.current.has(featureId)) {
      const existingLayers = selectedFeaturesMapRef.current.get(featureId);
      // Verificar que las capas existentes estén realmente en el mapa
      if (existingLayers && existingLayers.length > 0 && selectionLayer) {
        const allLayersExist = existingLayers.every(layer => 
          selectionLayer.hasLayer(layer)
        );
        if (allLayersExist) {
          // La feature ya está en el mapa, no hacer nada
          console.log('[TableInfiniteScroll] addFeatureToMapSelection - Feature ya existe en el mapa:', {
            featureId,
            layersCount: existingLayers.length,
            selectionLayerLayers: selectionLayer?.getLayers().length,
            isOnMap: mapInstance?.hasLayer(selectionLayer),
            isVisible
          });
          return;
        } else {
          // Las capas existen en la referencia pero no en el mapa, limpiarlas
          console.log('[TableInfiniteScroll] addFeatureToMapSelection - Limpiando capas huérfanas para:', featureId);
          existingLayers.forEach((layer) => {
            if (selectionLayer.hasLayer(layer)) {
              selectionLayer.removeLayer(layer);
            }
          });
          selectedFeaturesMapRef.current.delete(featureId);
        }
      }
    }

    try {
      // Si no existe la capa, crearla
      if (!selectionLayer) {
        // Crear nueva capa de selección
        selectionLayer = window.L.featureGroup([]);
        selectionLayer.addTo(mapInstance);
        selectionLayersStore.set(tableId, selectionLayer);
        selectionLayerRef.current = selectionLayer;
      } else if (!mapInstance.hasLayer(selectionLayer)) {
        // Si la capa existe pero no está en el mapa, añadirla de nuevo
        selectionLayer.addTo(mapInstance);
        selectionLayerRef.current = selectionLayer;
      } else {
        // Asegurar que la referencia local esté actualizada
        selectionLayerRef.current = selectionLayer;
      }

      // Obtener la geometría completa de la feature
      const fullFeature = await fetchFeatureById(qgsUrl, qgsProjectPath, layerName, featureId, token);
      
      if (!fullFeature || !fullFeature.geometry) {
        return;
      }

      // Estilo de resaltado para la feature seleccionada
      const highlightStyle = {
        color: '#3388ff',
        weight: 3,
        opacity: 1,
        fillColor: '#3388ff',
        fillOpacity: 0.3
      };

      // Crear la capa GeoJSON con el estilo de resaltado
      const geoJsonLayer = window.L.geoJSON(fullFeature, {
        style: highlightStyle,
        pointToLayer: (feature, latlng) => {
          // Para puntos, usar un círculo más grande
          return window.L.circleMarker(latlng, {
            radius: 8,
            fillColor: '#3388ff',
            color: '#3388ff',
            weight: 3,
            opacity: 1,
            fillOpacity: 0.5
          });
        }
      });

      // Añadir cada layer de la feature a la capa de selección y guardar referencia
      const layers = [];
      geoJsonLayer.eachLayer((layer) => {
        if (selectionLayer) {
          // Verificar que el layer no esté ya en la capa antes de añadirlo
          if (!selectionLayer.hasLayer(layer)) {
            selectionLayer.addLayer(layer);
            layers.push(layer);
            // Asegurar que cada layer esté en el frente
            if (layer.bringToFront) {
              layer.bringToFront();
            }
          } else {
            // El layer ya está en la capa, añadirlo a la lista de todos modos
            layers.push(layer);
          }
        }
      });

      // Asegurar que la capa de selección esté en el frente del mapa
      if (selectionLayer && selectionLayer.bringToFront) {
        selectionLayer.bringToFront();
      }

      // Guardar referencia para poder eliminar después
      selectedFeaturesMapRef.current.set(featureId, layers);
      
      console.log('[TableInfiniteScroll] addFeatureToMapSelection - Feature añadida:', {
        featureId,
        layersCount: layers.length,
        selectionLayerLayers: selectionLayer?.getLayers().length,
        isOnMap: mapInstance?.hasLayer(selectionLayer),
        isVisible,
        tableId
      });
    } catch (error) {
      console.error('[TableInfiniteScroll] Error al añadir feature al mapa:', error);
    }
  };

  // Función para eliminar una feature del mapa de selección
  const removeFeatureFromMapSelection = (featureId) => {
    const selectionLayer = selectionLayerRef.current || selectionLayersStore.get(tableId);
    if (!selectionLayer) {
      return;
    }

    const layers = selectedFeaturesMapRef.current.get(featureId);
    if (layers) {
      layers.forEach((layer) => {
        if (selectionLayer.hasLayer(layer)) {
          selectionLayer.removeLayer(layer);
        }
      });
      selectedFeaturesMapRef.current.delete(featureId);
    }
  };

  // Función para limpiar completamente la capa de selección
  // Esta función debe ser llamada explícitamente cuando se cierra la tabla
  const cleanupSelectionLayer = useCallback(() => {
    const selectionLayer = selectionLayersStore.get(tableId);
    if (selectionLayer) {
      selectionLayer.clearLayers();
      if (mapInstance && mapInstance.hasLayer(selectionLayer)) {
        mapInstance.removeLayer(selectionLayer);
      }
      selectionLayersStore.delete(tableId);
      console.log('[TableInfiniteScroll] Capa de selección limpiada completamente:', tableId);
    }
    selectedFeaturesMapRef.current.clear();
    selectionLayerRef.current = null;
  }, [tableId, mapInstance, selectionLayersStore]);

  // Exponer la función de limpieza mediante useEffect para que el componente padre pueda acceder
  useEffect(() => {
    // Guardar la función de limpieza en el almacenamiento global para que pueda ser llamada desde fuera
    if (typeof window !== 'undefined') {
      if (!window.__tableCleanupFunctions) {
        window.__tableCleanupFunctions = new Map();
      }
      window.__tableCleanupFunctions.set(tableId, cleanupSelectionLayer);
    }
    return () => {
      // Limpiar la referencia cuando el componente se desmonte completamente
      if (typeof window !== 'undefined' && window.__tableCleanupFunctions) {
        window.__tableCleanupFunctions.delete(tableId);
      }
    };
  }, [tableId, cleanupSelectionLayer]);

  // Restaurar selecciones en el mapa cuando hay selecciones guardadas
  // Esto debe ejecutarse independientemente de si el drawer está abierto o cerrado
  // Asegurar que las features seleccionadas permanezcan visibles incluso cuando se minimiza el drawer
  const hasRestoredSelectionsRef = useRef(false);
  useEffect(() => {
    if (!mapInstance || selectedRows.size === 0 || !qgsUrl || !qgsProjectPath || !layerName) {
      return;
    }

    // Obtener la capa de selección desde el almacenamiento global o usar la referencia local
    const selectionLayer = selectionLayerRef.current || selectionLayersStore.get(tableId);
    
    // Asegurar que la capa de selección existe y está en el mapa
    if (!selectionLayer) {
      // Si no existe, se creará en el otro useEffect
      return;
    }
    
    if (!mapInstance.hasLayer(selectionLayer)) {
      // Si la capa existe pero no está en el mapa, añadirla de nuevo
      selectionLayer.addTo(mapInstance);
      if (selectionLayer.bringToFront) {
        selectionLayer.bringToFront();
      }
      // Actualizar la referencia local
      selectionLayerRef.current = selectionLayer;
    }

    // Restaurar todas las selecciones guardadas en el mapa
    // Solo añadir las que no estén ya en el mapa correctamente
    const restoreSelections = async () => {
      for (const featureId of selectedRows) {
        // Verificar si ya está en el mapa y las capas están realmente presentes
        const existingLayers = selectedFeaturesMapRef.current.get(featureId);
        if (existingLayers && existingLayers.length > 0 && selectionLayer) {
          const allLayersExist = existingLayers.every(layer => 
            selectionLayer.hasLayer(layer)
          );
          if (!allLayersExist) {
            // Las capas no están todas presentes, restaurar la feature
            console.log('[TableInfiniteScroll] Restaurando feature que faltaba en el mapa:', featureId);
            await addFeatureToMapSelection(featureId);
          }
        } else {
          // No existe en el mapa, añadirla
          await addFeatureToMapSelection(featureId);
        }
      }
      hasRestoredSelectionsRef.current = true;
    };

    // Ejecutar inmediatamente si hay selecciones y la capa está creada
    if (selectionLayer) {
      restoreSelections();
    }
  }, [mapInstance, selectedRows.size, qgsUrl, qgsProjectPath, layerName, token, tableId, selectionLayersStore]);

  useEffect(() => {
    setRows([]);
    setHasMore(true);
    setError(null);
    setInitialLoaded(false);
    offsetRef.current = 0;
    setTotalCount(null);
    setScrollRestored(false);
  }, [layerName, chunkSize, sortState.field, sortState.direction, columnFilters]);

  useEffect(() => {
    if (!layer || !qgsUrl || !qgsProjectPath) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    const fieldsMap = (layer?.fields || []).reduce((acc, f) => {
      acc[f.name] = f;
      return acc;
    }, {});
    const cqlFilter = buildFilterQuery(columnFilters, fieldsMap);
    fetchFeatureCount(qgsUrl, qgsProjectPath, layerName, cqlFilter, token)
      .then((count) => {
        if (!cancelled) {
          setTotalCount(count);
          if (count === 0) {
            setInitialLoaded(true);
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[TableInfiniteScroll] Error al obtener total:', err);
          setError(err.message);
          notificationManager?.addNotification?.({
            title: translate('ui.table.error'),
            text: translate('ui.table.errorLoadingData'),
            level: 'error'
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [layer, layerName, qgsUrl, qgsProjectPath, token, translate, notificationManager, columnFilters]);

  const loadNextChunk = useCallback(async () => {
    if (!layer || !qgsUrl || !qgsProjectPath || !hasMore) {
      return;
    }
    setLoading(true);
    setError(null);
    const startIndex = offsetRef.current;
    try {
      const sortOptions =
        sortState.field && sortState.direction
          ? { sortBy: sortState.field, sortDirection: sortState.direction.toUpperCase() }
          : undefined;

      const fieldsMap = (layer?.fields || []).reduce((acc, f) => {
        acc[f.name] = f;
        return acc;
      }, {});
      const cqlFilter = buildFilterQuery(columnFilters, fieldsMap);

      const features = await fetchFeatures(
        qgsUrl,
        qgsProjectPath,
        layerName,
        cqlFilter,
        startIndex,
        chunkSize,
        token,
        sortOptions
      );
      const datosExtraidos = features.map((feature) => feature.properties || {});
      setRows((prev) => [...prev, ...datosExtraidos]);
      // Guardar las features completas (con id y geometry) para usar en TableActionsColumn
      setFeaturesData((prev) => [...prev, ...features]);
      offsetRef.current = startIndex + features.length;
      if (features.length < chunkSize) {
        setHasMore(false);
      }
      setInitialLoaded(true);
    } catch (err) {
      console.error('[TableInfiniteScroll] Error al cargar datos:', err);
      setError(err.message);
      setHasMore(false);
      notificationManager?.addNotification?.({
        title: translate('ui.table.error'),
        text: translate('ui.table.errorLoadingData'),
        level: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [
    layer,
    layerName,
    chunkSize,
    qgsUrl,
    qgsProjectPath,
    token,
    translate,
    notificationManager,
    hasMore,
    sortState.field,
    sortState.direction,
    columnFilters
  ]);

  useEffect(() => {
    if (!layer || !qgsUrl || !qgsProjectPath) {
      return;
    }
    loadNextChunk();
  }, [layer, qgsUrl, qgsProjectPath, loadNextChunk]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || loading || !hasMore) {
      return;
    }
    const threshold = 120;
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - threshold) {
      loadNextChunk();
    }
  }, [loading, hasMore, loadNextChunk]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }
    const onScroll = () => handleScroll();
    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, [handleScroll]);

  // Restaurar scroll horizontal y vertical después de que los datos se hayan renderizado
  // Solo restaurar cuando initialLoaded cambia a true (primera carga después de ordenar o refrescar)
  useEffect(() => {
    if (!initialLoaded || !containerRef.current) {
      return;
    }
    
    // Solo restaurar si rows tiene datos (no está vacío)
    if (rows.length === 0) {
      return;
    }
    
    // Obtener scroll guardado: primero de refs (para recargas inmediatas), luego de tableStateStore (para persistencia)
    const scrollLeftToRestore = savedScrollLeftRef.current > 0 
      ? savedScrollLeftRef.current 
      : (persistentState.scrollLeft || 0);
    const scrollTopToRestore = savedScrollTopRef.current > 0 
      ? savedScrollTopRef.current 
      : (persistentState.scrollTop || 0);
    
    // Si no hay scroll que restaurar, no hacer nada
    if (scrollLeftToRestore === 0 && scrollTopToRestore === 0) {
      return;
    }
    
    console.log('[TableInfiniteScroll] useEffect initialLoaded - Intentando restaurar scroll:', { 
      left: scrollLeftToRestore, 
      top: scrollTopToRestore,
      rowsLength: rows.length,
      fromRefs: { left: savedScrollLeftRef.current, top: savedScrollTopRef.current },
      fromStore: { left: persistentState.scrollLeft, top: persistentState.scrollTop }
    });
    
    // Usar requestAnimationFrame para asegurar que el DOM se haya actualizado
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (containerRef.current) {
          // Restaurar scroll horizontal
          if (scrollLeftToRestore > 0) {
            console.log('[TableInfiniteScroll] Restaurando scrollLeft a:', scrollLeftToRestore);
            containerRef.current.scrollLeft = scrollLeftToRestore;
          }
          
          // Restaurar scroll vertical
          if (scrollTopToRestore > 0) {
            console.log('[TableInfiniteScroll] Restaurando scrollTop a:', scrollTopToRestore);
            containerRef.current.scrollTop = scrollTopToRestore;
          }
          
          // Resetear los valores guardados en refs después de restaurarlos (pero mantener en tableStateStore)
          savedScrollLeftRef.current = 0;
          savedScrollTopRef.current = 0;
        } else {
          console.warn('[TableInfiniteScroll] useEffect initialLoaded - containerRef.current es null');
        }
      });
    });
  }, [initialLoaded, rows.length, persistentState.scrollLeft, persistentState.scrollTop]);

  const handleSort = (field) => {
    // Guardar posición del scroll horizontal antes de ordenar
    if (containerRef.current) {
      savedScrollLeftRef.current = containerRef.current.scrollLeft;
      console.log('[TableInfiniteScroll] handleSort - Scroll horizontal guardado:', savedScrollLeftRef.current);
      console.log('[TableInfiniteScroll] handleSort - Contenedor existe:', !!containerRef.current);
      console.log('[TableInfiniteScroll] handleSort - scrollLeft actual:', containerRef.current.scrollLeft);
    } else {
      console.warn('[TableInfiniteScroll] handleSort - containerRef.current es null');
    }
    
    setRows([]);
    setFeaturesData([]);
    setHasMore(true);
    setInitialLoaded(false);
    setError(null);
    offsetRef.current = 0;
    setSortState((prev) => {
      if (prev.field !== field) {
        return { field, direction: 'asc' };
      }
      if (prev.direction === 'asc') {
        return { field, direction: 'desc' };
      }
      return { field: null, direction: null };
    });
  };

  const handleFilterClick = (event, column) => {
    event.stopPropagation();
    event.preventDefault();
    const field = layer?.fields?.find((f) => f.name === column.field);
    if (!field) return;
    
    // Obtener la posición del botón relativa al contenedor de la tabla
    const buttonRect = event.currentTarget.getBoundingClientRect();
    const tableContainer = containerRef.current?.closest('.table');
    
    if (tableContainer) {
      const containerRect = tableContainer.getBoundingClientRect();
      // Calcular posición relativa al contenedor de la tabla (que tiene position: relative)
      setFilterPopover({
        field,
        position: {
          top: buttonRect.bottom - containerRect.top,
          left: buttonRect.left - containerRect.left
        }
      });
    } else {
      // Fallback: usar posición absoluta relativa al viewport
      const rect = event.currentTarget.getBoundingClientRect();
      setFilterPopover({
        field,
        position: {
          top: rect.bottom + window.scrollY,
          left: rect.left + window.scrollX
        }
      });
    }
  };

  const handleApplyFilter = (fieldName, filter) => {
    setColumnFilters((prev) => {
      const newFilters = {
        ...prev,
        [fieldName]: filter
      };
      
      // Notificar cambio de filtros al mapa si hay callback
      if (onFilterChange) {
        const fieldsMap = (layer?.fields || []).reduce((acc, f) => {
          acc[f.name] = f;
          return acc;
        }, {});
        const filterQuery = buildFilterQuery(newFilters, fieldsMap);
        onFilterChange(layerName, filterQuery);
      }
      
      return newFilters;
    });
    setRows([]);
    setFeaturesData([]);
    setHasMore(true);
    setInitialLoaded(false);
    offsetRef.current = 0;
  };

  const handleClearFilter = (fieldName) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      
      // Notificar cambio de filtros al mapa si hay callback
      if (onFilterChange) {
        const fieldsMap = (layer?.fields || []).reduce((acc, f) => {
          acc[f.name] = f;
          return acc;
        }, {});
        const filterQuery = buildFilterQuery(next, fieldsMap);
        onFilterChange(layerName, filterQuery);
      }
      
      return next;
    });
    setRows([]);
    setFeaturesData([]);
    setHasMore(true);
    setInitialLoaded(false);
    offsetRef.current = 0;
  };

  const handleClearAllFilters = () => {
    setColumnFilters({});
    
    // Notificar cambio de filtros al mapa si hay callback
    if (onFilterChange) {
      onFilterChange(layerName, '');
    }
    
    setRows([]);
    setFeaturesData([]);
    setHasMore(true);
    setInitialLoaded(false);
    offsetRef.current = 0;
  };

  const isFilterActive = (fieldName) => !!columnFilters[fieldName];

  useEffect(() => {
    if (!filterPopover) return undefined;
    const handleClick = (e) => {
      if (popoverRef.current && !popoverRef.current.contains(e.target)) {
        setFilterPopover(null);
      }
    };
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [filterPopover]);

  const renderSortIcon = (field) => {
    if (sortState.field !== field || !sortState.direction) {
      return <i className="fas fa-sort table__sort-icon" aria-hidden="true" />;
    }
    return sortState.direction === 'asc' ? (
      <i className="fas fa-sort-up table__sort-icon" aria-hidden="true" />
    ) : (
      <i className="fas fa-sort-down table__sort-icon" aria-hidden="true" />
    );
  };

  if (!config) {
    return <LoadingQGS />;
  }

  if (!layer) {
    return (
      <div>
        {translate('ui.table.error')}: {translate('ui.table.layerNotFound', { layerName })}
      </div>
    );
  }

  if (!initialLoaded && loading) {
    return <LoadingQGS />;
  }

  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  };

  return (
    <div className="table" style={height === '100%' ? { height: '100%', display: 'flex', flexDirection: 'column', overflow: 'hidden' } : {}}>
      {columns.length === 0 ? (
        <div>{translate('ui.table.noData')}</div>
      ) : (
        <>
          <div
            ref={containerRefCallback}
            className="table__scroll-container"
            style={{ 
              maxHeight: height === '100%' ? 'none' : height, 
              height: height === '100%' ? '100%' : undefined,
              flex: height === '100%' ? '1 1 auto' : undefined,
              minHeight: height === '100%' ? 0 : undefined,
              overflowY: 'auto', 
              overflowX: 'auto',
              display: 'flex',
              flexDirection: 'column'
            }}
          >
            <table className="table__native">
              <thead>
                <tr>
                  <th 
                    className="table__actions-header" 
                    style={{ 
                      width: `${calculateActionsColumnWidth(layer, mapInstance, startEditingGeometry)}px`, 
                      minWidth: `${calculateActionsColumnWidth(layer, mapInstance, startEditingGeometry)}px`, 
                      maxWidth: `${calculateActionsColumnWidth(layer, mapInstance, startEditingGeometry)}px` 
                    }}
                  >
                    {translate('ui.table.actions')}
                  </th>
                  {columns.map((column, colIndex) => {
                    // Ajustar índice para tener en cuenta la columna de acciones (índice 0)
                    const adjustedIndex = colIndex + 1;
                    const colWidth = getColumnWidth(adjustedIndex, column.field, column.label);
                    return (
                      <th
                        key={column.field}
                        className={`table__sortable table__header-cell${isFilterActive(column.field) ? ' table__sortable--filtered' : ''}`}
                        style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth }}
                        onClick={() => handleSort(column.field)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSort(column.field);
                          }
                        }}
                        aria-sort={
                          sortState.field === column.field
                            ? sortState.direction === 'asc'
                              ? 'ascending'
                              : 'descending'
                            : 'none'
                        }
                      >
                        <span className="table__sortable-content">
                          <span className="table__sortable-label">
                            <button
                              type="button"
                              className={`table__filter-button${isFilterActive(column.field) ? ' active' : ''}`}
                              onClick={(e) => handleFilterClick(e, column)}
                              aria-label={translate('ui.table.filter.open')}
                            >
                              <i className="fas fa-filter" aria-hidden="true" />
                            </button>
                            <span>{column.label}</span>
                          </span>
                          {renderSortIcon(column.field)}
                        </span>
                        <div
                          className={`table__resize-handle${resizing.columnIndex === adjustedIndex ? ' table__resize-handle--active' : ''}`}
                          onMouseDown={(e) => handleMouseDown(e, adjustedIndex, colWidth)}
                          role="separator"
                          aria-orientation="vertical"
                          aria-label={translate('ui.table.resizeColumn')}
                        />
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length + 1} className="table__empty-cell">
                      {error ? translate('ui.table.error') : translate('ui.table.noData')}
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => {
                    const feature = featuresData[index];
                    // El feature.id puede venir en formato "layerName.featureId" o solo "featureId"
                    let featureId = feature?.id;
                    if (featureId && typeof featureId === 'string' && featureId.includes('.')) {
                      // Si tiene formato "layerName.featureId", extraer solo el id
                      featureId = featureId.split('.').slice(1).join('.');
                    }
                    // Si no hay id, intentar obtenerlo de las propiedades o usar el índice
                    if (!featureId) {
                      featureId = feature?.properties?.id || feature?.properties?.fid || index;
                    }
                    return (
                      <tr key={`${layerName}-${featureId}-${index}`}>
                        <td 
                          className="table__actions-cell" 
                          style={{ 
                            width: `${calculateActionsColumnWidth(layer, mapInstance)}px`, 
                            minWidth: `${calculateActionsColumnWidth(layer, mapInstance)}px`, 
                            maxWidth: `${calculateActionsColumnWidth(layer, mapInstance)}px` 
                          }}
                        >
                          <TableActionsColumn
                            feature={feature} // Pasar la feature completa con id y geometry
                            featureId={featureId}
                            layer={layer}
                            layerName={layerName}
                            selected={selectedRows.has(featureId)}
                            onSelectChange={async (id, checked) => {
                              setSelectedRows(prev => {
                                const next = new Set(prev);
                                if (checked) {
                                  next.add(id);
                                } else {
                                  next.delete(id);
                                }
                                
                                // Guardar el estado de selección en tableStateStore
                                setTableState(tableId, {
                                  selectedRows: Array.from(next) // Convertir Set a Array para guardar
                                });
                                
                                return next;
                              });
                              
                              // Añadir/eliminar del mapa si hay mapInstance
                              if (mapInstance) {
                                if (checked) {
                                  await addFeatureToMapSelection(id);
                                } else {
                                  removeFeatureFromMapSelection(id);
                                }
                              }
                            }}
                            onAction={async (actionPayload) => {
                              console.log('[TableInfiniteScroll] onAction recibido:', actionPayload);
                              // Refrescar datos después de acciones que modifican features
                              if (actionPayload.action === 'update' || actionPayload.action === 'delete') {
                                console.log('[TableInfiniteScroll] Recargando datos después de', actionPayload.action);
                                
                                // Guardar posición de scroll antes de recargar (tanto en refs como en tableStateStore)
                                if (containerRef.current) {
                                  const currentScrollLeft = containerRef.current.scrollLeft;
                                  const currentScrollTop = containerRef.current.scrollTop;
                                  
                                  // Guardar en refs para restauración inmediata después de recargar
                                  savedScrollLeftRef.current = currentScrollLeft;
                                  savedScrollTopRef.current = currentScrollTop;
                                  
                                  // Guardar también en tableStateStore para persistencia
                                  setTableState(tableId, {
                                    scrollLeft: currentScrollLeft,
                                    scrollTop: currentScrollTop
                                  });
                                  
                                  console.log('[TableInfiniteScroll] Scroll guardado:', { 
                                    left: currentScrollLeft, 
                                    top: currentScrollTop 
                                  });
                                }
                                
                                // Limpiar datos y recargar desde el inicio
                                setRows([]);
                                setFeaturesData([]);
                                setHasMore(true);
                                offsetRef.current = 0;
                                setInitialLoaded(false);
                                setError(null);
                                
                                // Forzar recarga inmediata
                                try {
                                  await loadNextChunk();
                                } catch (err) {
                                  console.error('[TableInfiniteScroll] Error al recargar datos:', err);
                                }
                              }
                            }}
                            translate={translate}
                            qgsUrl={qgsUrl}
                            qgsProjectPath={qgsProjectPath}
                            token={token}
                            notificationManager={notificationManager}
                            mapInstance={mapInstance}
                            startEditingGeometry={startEditingGeometry}
                            onMinimizeDrawer={onMinimizeDrawer}
                          />
                        </td>
                        {columns.map((column, colIndex) => {
                          // Ajustar índice para tener en cuenta la columna de acciones (índice 0)
                          const adjustedIndex = colIndex + 1;
                          const colWidth = getColumnWidth(adjustedIndex, column.field, column.label);
                          return (
                            <td key={column.field} style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth }}>
                              {formatValue(row[column.field])}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
            {loading && (
              <div className="table__loading-inline">{translate('ui.table.loadingMore')}</div>
            )}
          </div>
          <div className="table__summary" style={height === '100%' ? { flexShrink: 0 } : {}}>
            {totalCount !== null
              ? translate('ui.table.totalRecords', { count: totalCount })
              : translate('ui.table.totalRecords', { count: rows.length })}
            {Object.keys(columnFilters).length > 0 && (
              <button
                type="button"
                onClick={handleClearAllFilters}
                className="table__clear-all-filters"
                style={{ marginLeft: '0.5rem', padding: '0.25rem 0.5rem', fontSize: '0.75rem' }}
              >
                {translate('ui.table.filter.clearAll')}
              </button>
            )}
          </div>
          {!hasMore && rows.length > 0 && (
            <div className="table__hint" style={height === '100%' ? { flexShrink: 0 } : {}}>{translate('ui.table.allDataLoaded')}</div>
          )}
          {error && (
            <div className="table__error" style={height === '100%' ? { flexShrink: 0 } : {}}>
              {translate('ui.table.error')}: {error}
            </div>
          )}
          {filterPopover?.field && filterPopover?.position && (
            <div
              ref={popoverRef}
              className="table__filter-popover"
              style={{
                position: 'absolute',
                top: `${filterPopover.position.top}px`,
                left: `${filterPopover.position.left}px`,
                zIndex: 2000
              }}
            >
              <ColumnFilterPopover
                field={filterPopover.field}
                currentFilter={columnFilters[filterPopover.field.name]}
                onApply={(filter) => handleApplyFilter(filterPopover.field.name, filter)}
                onClear={() => handleClearFilter(filterPopover.field.name)}
                onClose={() => setFilterPopover(null)}
                translate={translate}
                qgsUrl={qgsUrl}
                qgsProjectPath={qgsProjectPath}
                token={token}
              />
            </div>
          )}
        </>
      )}
    </div>
  );
};

TableInfiniteScroll.propTypes = {
  layerName: PropTypes.string.isRequired,
  chunkSize: PropTypes.number,
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  onFilterChange: PropTypes.func, // Callback: (layerName, filterQuery) => void
  onMinimizeDrawer: PropTypes.func,
  mapInstance: PropTypes.object,
  startEditingGeometry: PropTypes.func,
  isVisible: PropTypes.bool
};

export default TableInfiniteScroll;

