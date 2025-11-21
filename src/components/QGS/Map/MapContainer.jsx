import React, { useEffect, useMemo, useRef, useState } from 'react';
import PropTypes from 'prop-types';
import { useMap } from './MapProvider';
import { fetchBaseLayers } from '../../../services/qgisConfigFetcher';
import {
  getVisibleLayersInChildren,
  getWMSFilters,
  getBaseLayers as getBaseLayersUtil,
  createBaseLayer,
  setView
} from '../../../utilities/mapUtilities';
import { resetTableState } from '../Table/tableStateStore';




/**
 * Componente contenedor del mapa Leaflet
 * Renderiza el mapa y maneja su inicialización
 * La configuración del mapa (center, zoom, bounds) se obtiene del JSON QGISPRJ
 */
const MapContainer = ({
  width = '100%',
  height = '400px',
  mapOptions = {},
  onMapReady = null,
  ...otherProps
}) => {
  // Normalizar width y height: convertir números a strings con 'px', mantener strings como están
  // Acepta: números (se convierten a 'px'), strings con unidades ('100%', '400px', '50vh', etc.)
  const normalizedWidth = useMemo(() => {
    if (typeof width === 'number') {
      return `${width}px`;
    }
    if (typeof width === 'string' && width.trim() !== '') {
      return width.trim();
    }
    return '100%'; // Valor por defecto
  }, [width]);

  const normalizedHeight = useMemo(() => {
    if (typeof height === 'number') {
      return `${height}px`;
    }
    if (typeof height === 'string' && height.trim() !== '') {
      return height.trim();
    }
    return '400px'; // Valor por defecto
  }, [height]);

  const mapRef = useRef(null);
  const mapContext = useMap();
  const {
    mapInstance: contextMapInstance,
    setMapInstance,
    mapInstanceRef,
    initialBoundsRef,
    config,
    t,
    notificationManager,
    qgsUrl,
    qgsProjectPath,
    setRefreshWMSLayer,
    restoreAllLayerFilters
  } = mapContext || {};

  const translate = typeof t === 'function' ? t : (key) => key;
  
  // Referencia para la función de refresh de la capa WMS
  const refreshWMSLayerRef = useRef(null);

  // Estado para las capas base WMTSLAYERS
  const [baseLayersConfig, setBaseLayersConfig] = useState(null);
  const [baseLayersLoading, setBaseLayersLoading] = useState(false);

  // Cargar capas base WMTSLAYERS
  useEffect(() => {
    if (!qgsUrl || !qgsProjectPath) {
      return;
    }

    setBaseLayersLoading(true);
    fetchBaseLayers(qgsUrl, qgsProjectPath, null)
      .then((data) => {
        if (data?.layers && Array.isArray(data.layers) && data.layers.length > 0) {
          setBaseLayersConfig(data);
        }
      })
      .catch((error) => {
        console.warn(
          translate('ui.map.errorLoadingBaseLayers'),
          error
        );
      })
      .finally(() => {
        setBaseLayersLoading(false);
      });
  }, [qgsUrl, qgsProjectPath, translate]);

  // Obtener capas visibles usando la lógica del legacy (excluyendo capas base de WMTSLAYERS)
  const visibleLayerNames = useMemo(() => {
    if (!config?.layerTree) {
      return [];
    }

    // El legacy recorre los children del layerTree, no el layerTree directamente
    // Si layerTree tiene children, usarlos; si no, usar el layerTree como si fuera un child
    const children = config.layerTree.children || (config.layerTree.nodeType ? [config.layerTree] : []);
    
    return getVisibleLayersInChildren(children, [], baseLayersConfig);
  }, [config, baseLayersConfig]);

  // Filtrar capas visibles para asegurar que existen en el config
  const allVisibleProjectLayers = useMemo(() => {
    if (!config?.layers || !Array.isArray(visibleLayerNames)) {
      return [];
    }

    // Retornar solo las capas visibles que existen en el config
    return visibleLayerNames.filter((layerName) => {
      return !!config.layers[layerName];
    });
  }, [config, visibleLayerNames]);
  
  // Obtener filtros WMS para las capas visibles (como en el legacy: getWMSFilters)
  const wmsFilters = useMemo(() => {
    if (!config || allVisibleProjectLayers.length === 0) {
      return '';
    }
    return getWMSFilters(config, allVisibleProjectLayers);
  }, [config, allVisibleProjectLayers]);

  // Calcular bounds del proyecto usando viewExtent (como en el legacy)
  // El viewExtent viene en grados (EPSG:4326) directamente, no necesita conversión
  const projectBounds = useMemo(() => {
    if (!config?.viewExtent) {
      return null;
    }

    const { xMinimum, xMaximum, yMinimum, yMaximum } = config.viewExtent;

    // En el legacy se usa directamente sin conversión
    // Leaflet usa [lat, lng] que es [y, x] en WGS84
    return window.L.latLngBounds([
      [parseFloat(yMaximum), parseFloat(xMinimum)],  // Esquina superior izquierda (norte-oeste)
      [parseFloat(yMinimum), parseFloat(xMaximum)]   // Esquina inferior derecha (sur-este)
    ]);
  }, [config]);

  // Calcular center del mapa desde projectBounds (solo si no hay viewExtent para inicialización)
  const mapCenter = useMemo(() => {
    if (projectBounds) {
      return projectBounds.getCenter();
    }
    // Valores por defecto si no hay config
    return [40.4168, -3.7038]; // Madrid por defecto
  }, [projectBounds]);

  // Calcular zoom inicial (se ajustará automáticamente con fitBounds)
  const mapZoom = useMemo(() => {
    // Zoom por defecto (como en el legacy: zoom: 9), se ajustará con fitBounds
    return 9;
  }, []);

  // Zoom mínimo y máximo (como en el legacy: minZoom: 0, maxZoom: 25)
  const minZoom = 0;
  const maxZoom = 25;

  const addedLayersRef = useRef({ base: null, overlays: [] });
  const mapInitializedRef = useRef(false);

  // Inicializar el mapa solo una vez (como en el legacy: initMapView se llama una vez)
  useEffect(() => {
    // Si ya hay una instancia del mapa en el contexto, usarla
    if (contextMapInstance) {
      if (onMapReady) {
        onMapReady(contextMapInstance);
      }
      return;
    }

    if (!mapRef.current) {
      return;
    }

    // Verificar si Leaflet está disponible
    if (typeof window === 'undefined' || !window.L) {
      return;
    }

    // Verificar que el contenedor no tenga ya un mapa
    if (mapRef.current._leaflet_id) {
      return;
    }

    try {
        // Opciones del mapa
        // Por defecto, Leaflet habilita dragging y scrollWheelZoom, pero lo hacemos explícito
        const options = {
          center: mapCenter,
          zoom: mapZoom,
          minZoom: minZoom,
          maxZoom: maxZoom,
          attributionControl: false,
          zoomControl: false,
          scrollWheelZoom: true,       // Habilitar zoom con scroll del ratón
          dragging: true,              // Habilitar PAN (arrastrar mapa) - por defecto está habilitado pero lo hacemos explícito
          doubleClickZoom: true,       // Habilitar zoom con doble clic
          boxZoom: true,               // Habilitar zoom con SHIFT + arrastrar
          keyboard: true,              // Habilitar navegación con teclado
          ...mapOptions
        };

      const map = window.L.map(mapRef.current, {
        ...options,
        crs: window.L.CRS.EPSG3857  // CRS por defecto de Leaflet (Web Mercator)
      });

      // Función helper para habilitar todos los handlers de interacción del mapa
      const enableMapInteractions = () => {
        if (!map) return;
        
        // Habilitar dragging (PAN)
        if (map.dragging && !map.dragging.enabled()) {
          map.dragging.enable();
        }
        
        // Habilitar scrollWheelZoom
        if (map.scrollWheelZoom && !map.scrollWheelZoom.enabled()) {
          map.scrollWheelZoom.enable();
        }
        
        // Habilitar doubleClickZoom
        if (map.doubleClickZoom && !map.doubleClickZoom.enabled()) {
          map.doubleClickZoom.enable();
        }
        
        // Habilitar boxZoom
        if (map.boxZoom && !map.boxZoom.enabled()) {
          map.boxZoom.enable();
        }
        
        // Habilitar keyboard
        if (map.keyboard && !map.keyboard.enabled()) {
          map.keyboard.enable();
        }
      };

      // Habilitar interacciones inmediatamente después de crear el mapa
      enableMapInteractions();

      // Usar whenReady para asegurarnos de que el mapa esté completamente inicializado
      map.whenReady(() => {
        enableMapInteractions();
      });

      // Forzar invalidación del tamaño después de un pequeño delay
      setTimeout(() => {
        if (map && map.invalidateSize) {
          map.invalidateSize();
        }
        // Asegurar que todas las interacciones estén habilitadas
        enableMapInteractions();
      }, 100);

      // Guardar en el contexto si está disponible
      if (setMapInstance) {
        setMapInstance(map);
      }
      if (mapInstanceRef) {
        mapInstanceRef.current = map;
      }
      // Exponer temporalmente el mapa para depuración manual
      if (typeof window !== 'undefined') {
        window.map = map;
      }

      if (onMapReady) {
        onMapReady(map);
      }
    } catch (error) {
      const message = translate('ui.map.errorInitializing');
      console.error(message, error);
      notificationManager?.addNotification?.({
        title: translate('ui.map.error'),
        text: message,
        level: 'error'
      });
    }

    // Cleanup
    return () => {
      // Limpiar el estado de todas las tablas (filtros, etc.) cuando se cierra el mapa
      resetTableState();
      
      // Restaurar todos los filtros base de las capas antes de desmontar el mapa
      if (restoreAllLayerFilters) {
        restoreAllLayerFilters();
      }
      
      const instance = contextMapInstance || (mapInstanceRef?.current);
      if (instance && instance.remove) {
        try {
          instance.remove();
        } catch (error) {
          console.error('Error al limpiar el mapa:', error);
        }
        if (setMapInstance) {
          setMapInstance(null);
        }
        if (mapInstanceRef) {
          mapInstanceRef.current = null;
        }
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []); // Solo ejecutar una vez al montar (inicialización del mapa)

  // Actualizar vista cuando cambie la configuración del proyecto (solo si el mapa ya está inicializado)
  // La vista se ajustará automáticamente cuando se carguen las capas

  useEffect(() => {
    const map = contextMapInstance || mapInstanceRef?.current;

    if (!map || !config || !qgsUrl || !qgsProjectPath || !window.L) {
      return;
    }

    // Limpiar capas anteriores
    if (addedLayersRef.current.base) {
      map.removeLayer(addedLayersRef.current.base);
    }
    addedLayersRef.current.overlays.forEach((layer) => {
      map.removeLayer(layer);
    });
    addedLayersRef.current = { base: null, overlays: [] };

    // Crear una única capa WMS con todas las capas visibles del proyecto
    // Replica la lógica del legacy: usa L.tileLayer.wms con todas las capas en el parámetro layers
    const createQgisWmsLayer = async (layerNames, filters = '') => {
      if (!layerNames || layerNames.length === 0) {
        return null;
      }

      // Construir URL base para QGIS Server
      // L.tileLayer.wms construye la URL añadiendo parámetros WMS estándar (SERVICE=WMS&REQUEST=GetMap&...)
      // Para QGIS Server, necesitamos incluir MAP como parámetro fijo en cada petición
      let baseUrl = qgsUrl;
      
      // Si layerNames es un array, unir con coma; si es string, usarlo directamente
      const layersParam = Array.isArray(layerNames) 
        ? layerNames.join(',') 
        : layerNames;
      
      console.log('[MapContainer] Creando capa WMS con layers:', {
        layerNames: Array.isArray(layerNames) ? layerNames : [layerNames],
        layersParam,
        filters
      });
      
      // Crear una clase personalizada que extienda L.TileLayer.WMS para incluir MAP y FILTER
      const QgisWMSLayer = window.L.TileLayer.WMS.extend({
        initialize: function(url, options) {
          window.L.TileLayer.WMS.prototype.initialize.call(this, url, options);
          this.options.qgsMap = qgsProjectPath;
          this.options.qgsFilter = filters || '';
          // Cache busting: usar timestamp para evitar caché del navegador
          this.options.cacheBust = options.cacheBust || Date.now();
        },
        
        getTileUrl: function(coords) {
          // Obtener la URL base de WMS (ya incluye SERVICE=WMS&REQUEST=GetMap&LAYERS=...&BBOX=...)
          let url = window.L.TileLayer.WMS.prototype.getTileUrl.call(this, coords);
          
          // Añadir parámetro MAP de QGIS Server (necesario para QGIS Server)
          const mapParam = `MAP=${encodeURIComponent(this.options.qgsMap)}`;
          // La URL ya tiene parámetros, así que siempre usamos &
          url += (url.includes('?') ? '&' : '?') + mapParam;
          
          // Añadir filtros si existen (formato: layerName: "filter"; layerName2: "filter2")
          if (this.options.qgsFilter) {
            url += `&FILTER=${encodeURIComponent(this.options.qgsFilter)}`;
          }
          
          // Añadir cache busting para evitar que el navegador use imágenes cacheadas
          // Usar el timestamp almacenado en las opciones
          url += `&_t=${this.options.cacheBust}`;
          
          return url;
        }
      });

      // Opciones de la capa WMS (similar al legacy)
      const wmsOptions = {
        layers: layersParam,
        format: 'image/png',
        transparent: true,
        uppercase: true,
        version: '1.3.0',
        styles: '', // Estilos vacíos para usar los estilos por defecto de cada capa
        maxZoom: 25,
        attribution: translate('ui.map.attribution') || ''
      };

      // Crear instancia de la capa personalizada
      // La URL base no debe incluir parámetros WMS, L.TileLayer.WMS los añadirá automáticamente
      return new QgisWMSLayer(baseUrl, wmsOptions);
    };

    // Función asíncrona para cargar capas (como en el legacy)
    const loadLayers = async () => {
      try {
        // Actualizar QGISPRJ y WMTSLAYERS en el mapa (como en el legacy: mapView.QGISPRJ = QGISPRJ)
        if (config) {
          map.QGISPRJ = config;
        }
        if (baseLayersConfig) {
          map.WMTSLAYERS = baseLayersConfig;
        }

        // Ajustar vista ANTES de cargar las capas (como en el legacy: setView(mapView, QGISPRJ.viewExtent))
        // Se llama después de guardar QGISPRJ pero antes de cargar capas
        // Solo ajustar la vista en la primera inicialización para evitar resetear el mapa cuando el usuario navega
        if (config?.viewExtent && !mapInitializedRef.current) {
          setView(map, config.viewExtent);
          mapInitializedRef.current = true;
          if (initialBoundsRef) {
            // Guardar bounds para el control de "home" (reset view)
            const bounds = window.L.latLngBounds([
              [parseFloat(config.viewExtent.yMaximum), parseFloat(config.viewExtent.xMinimum)],
              [parseFloat(config.viewExtent.yMinimum), parseFloat(config.viewExtent.xMaximum)]
            ]);
            initialBoundsRef.current = bounds;
          }
        } else if (config?.viewExtent && initialBoundsRef && !initialBoundsRef.current) {
          // Solo actualizar initialBoundsRef si no está establecido, sin cambiar la vista
          const bounds = window.L.latLngBounds([
            [parseFloat(config.viewExtent.yMaximum), parseFloat(config.viewExtent.xMinimum)],
            [parseFloat(config.viewExtent.yMinimum), parseFloat(config.viewExtent.xMaximum)]
          ]);
          initialBoundsRef.current = bounds;
        }

        // Cargar capas base de WMTSLAYERS (como en el legacy: getBaseLayers)
        let baseLayers = [];
        if (baseLayersConfig?.layers && baseLayersConfig.layers.length > 0) {
          baseLayers = await getBaseLayersUtil(baseLayersConfig);
        }

        // Si hay capas base, usar la primera como capa base del mapa (como en el legacy)
        if (baseLayers.length > 0 && baseLayers[0] != null) {
          const baseLayer = baseLayers[0];
          baseLayer.addTo(map);
          map.baseLayer = baseLayer;  // Como en el legacy: mapView.baseLayer = baseLayers[0]
          addedLayersRef.current.base = baseLayer;
        }

        // Crear capa WMS con todas las capas visibles del proyecto (como en el legacy: getWMSLayer)
        if (allVisibleProjectLayers.length > 0) {
          const wmsLayer = await createQgisWmsLayer(allVisibleProjectLayers, wmsFilters);
          if (wmsLayer) {
            wmsLayer.addTo(map);
            map.wmsLayer = wmsLayer;  // Como en el legacy: mapView.wmsLayer = wmsLayer
            
            // Si no hay capa base, usar la capa WMS como base
            if (!addedLayersRef.current.base) {
              addedLayersRef.current.base = wmsLayer;
            } else {
              // Si hay capa base, la WMS es overlay
              addedLayersRef.current.overlays = [wmsLayer];
            }
            
            // Crear función para refrescar la capa WMS (recrear con nuevas capas visibles)
            refreshWMSLayerRef.current = async () => {
              if (!map || !config || !qgsUrl || !qgsProjectPath) {
                return;
              }

              try {
                // Obtener las nuevas capas visibles
                const children = config.layerTree.children || (config.layerTree.nodeType ? [config.layerTree] : []);
                const newVisibleLayers = getVisibleLayersInChildren(children, [], baseLayersConfig);
                
                // Filtrar capas visibles que existen en el config
                const newVisibleProjectLayers = newVisibleLayers.filter((layerName) => {
                  return !!config.layers[layerName];
                });

                // Obtener nuevos filtros WMS
                const newWmsFilters = getWMSFilters(config, newVisibleProjectLayers);

                // Si no hay capas visibles, eliminar la capa WMS existente
                if (newVisibleProjectLayers.length === 0) {
                  if (map.wmsLayer) {
                    const oldLayer = map.wmsLayer;
                    map.removeLayer(oldLayer);
                    // Actualizar addedLayersRef
                    if (addedLayersRef.current.overlays.includes(oldLayer)) {
                      addedLayersRef.current.overlays = addedLayersRef.current.overlays.filter(l => l !== oldLayer);
                    }
                    if (addedLayersRef.current.base === oldLayer) {
                      addedLayersRef.current.base = null;
                    }
                    map.wmsLayer = null;
                  }
                  return;
                }

                // Si la capa WMS existe, eliminarla primero
                const oldWmsLayer = map.wmsLayer;
                if (oldWmsLayer) {
                  map.removeLayer(oldWmsLayer);
                  // Actualizar addedLayersRef
                  if (addedLayersRef.current.overlays.includes(oldWmsLayer)) {
                    addedLayersRef.current.overlays = addedLayersRef.current.overlays.filter(l => l !== oldWmsLayer);
                  }
                  if (addedLayersRef.current.base === oldWmsLayer) {
                    addedLayersRef.current.base = null;
                  }
                  map.wmsLayer = null;
                }

                // Crear nueva capa WMS con las capas visibles actualizadas
                const newWmsLayer = await createQgisWmsLayer(newVisibleProjectLayers, newWmsFilters);
                if (newWmsLayer) {
                  newWmsLayer.addTo(map);
                  map.wmsLayer = newWmsLayer;
                  
                  // Si no hay capa base, usar la capa WMS como base
                  if (!addedLayersRef.current.base) {
                    addedLayersRef.current.base = newWmsLayer;
                  } else {
                    // Si hay capa base, la WMS es overlay
                    addedLayersRef.current.overlays = [newWmsLayer];
                  }
                }
              } catch (error) {
                console.error('[MapContainer] refreshWMSLayer - Error al refrescar la capa WMS:', error);
              }
            };
          }
        }

        // Si no hay capas base ni capas WMS, usar OpenStreetMap como fallback
        if (!addedLayersRef.current.base) {
          const fallback = window.L.tileLayer(
            'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
            {
              attribution:
                translate('ui.map.attribution') || '© OpenStreetMap contributors',
              maxZoom: 19
            }
          );
          fallback.addTo(map);
          addedLayersRef.current.base = fallback;
        }

        // Asegurar que todas las interacciones estén habilitadas después de cargar las capas
        // Esto es importante porque después de cargar capas, el mapa puede necesitar reinicialización
        // Habilitar dragging (PAN)
        if (map.dragging && !map.dragging.enabled()) {
          map.dragging.enable();
        }
        
        // Habilitar scrollWheelZoom
        if (map.scrollWheelZoom && !map.scrollWheelZoom.enabled()) {
          map.scrollWheelZoom.enable();
        }
        
        // Habilitar doubleClickZoom
        if (map.doubleClickZoom && !map.doubleClickZoom.enabled()) {
          map.doubleClickZoom.enable();
        }
        
        // Habilitar boxZoom
        if (map.boxZoom && !map.boxZoom.enabled()) {
          map.boxZoom.enable();
        }
      } catch (error) {
        const message = translate('ui.map.errorLoadingLayers');
        console.error(message, error);
        notificationManager?.addNotification?.({
          title: translate('ui.map.error'),
          text: message,
          level: 'error'
        });
      }
    };

    // Cargar capas de forma asíncrona
    loadLayers();
  }, [
    baseLayersConfig,
    config,
    contextMapInstance,
    initialBoundsRef,
    mapInstanceRef,
    notificationManager,
    allVisibleProjectLayers,
    wmsFilters,
    projectBounds,
    qgsProjectPath,
    qgsUrl,
    translate
  ]);
  
  // Exponer la función de refresh a través del contexto
  useEffect(() => {
    if (setRefreshWMSLayer) {
      setRefreshWMSLayer(() => refreshWMSLayerRef.current);
    }
  }, [setRefreshWMSLayer]);

  return (
    <div
      ref={mapRef}
      className="leaflet-container"
      style={{
        width: normalizedWidth,
        height: normalizedHeight,
        minHeight: normalizedHeight,
        position: 'relative',
        zIndex: 0
      }}
      {...otherProps}
    />
  );
};

MapContainer.propTypes = {
  /** Ancho del contenedor del mapa (string o número) */
  width: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Alto del contenedor del mapa (string o número) */
  height: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  /** Opciones adicionales para Leaflet */
  mapOptions: PropTypes.object,
  /** Callback cuando el mapa está listo */
  onMapReady: PropTypes.func
};

export default MapContainer;

