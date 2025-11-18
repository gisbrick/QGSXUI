import React, { useState, useRef, useContext, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { SearchInput } from '../../../UI';
import { useMap } from '../MapProvider';
import { QgisConfigContext } from '../../QgisConfigContext';
import { useDebounce } from '../../../UI/hooks';
import { resolveLocationFilters } from '../../../../config/geographicParameters';
import './CadastralRuralSearch.css';

/**
 * Componente de búsqueda de referencias catastrales rústicas por polígono y parcela
 * Usa el servicio del Catastro de España
 * URL: https://ovc.catastro.meh.es/
 */
const CadastralRuralSearch = () => {
  // Configuración: parámetros de búsqueda
  const SEARCH_DEBOUNCE_MS = 1000; // Tiempo de inactividad (ms) antes de realizar la búsqueda
  const MAX_RESULTS = 50; // Número máximo de resultados a mostrar al usuario
  
  // Endpoints Catastro
  const CATASTRO_DNPPP_URL = 'https://ovc.catastro.meh.es/OVCServWeb/OVCWcfCallejero/COVCCallejero.svc/json/Consulta_DNPPP';
  const CATASTRO_WFS_URL = 'http://ovc.catastro.meh.es/INSPIRE/wfsCP.aspx';
  
  const mapContext = useMap();
  const { mapInstance, setPendingExternalGeometry } = mapContext || {};
  const qgisContext = useContext(QgisConfigContext);
  const { t } = qgisContext || {};
  
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const [error, setError] = useState(null);
  const resultsRef = useRef(null);
  const markerRef = useRef(null);
  const geometryLayerRef = useRef(null);
  const isSearchingRef = useRef(false);
  const performSearchRef = useRef(null);
  const skipNextSearchRef = useRef(false);
  
  // Debounce para el valor de búsqueda
  const debouncedSearchValue = useDebounce(searchValue, SEARCH_DEBOUNCE_MS);
  
  const geometryTypeToMode = useCallback((geometry) => {
    if (!geometry?.type) return null;
    const type = geometry.type.toLowerCase();
    if (type === 'point' || type === 'multipoint') return 'point';
    if (type.includes('line')) return 'line';
    if (type.includes('polygon')) return 'polygon';
    return null;
  }, []);

  // Sincronizar ref con state
  useEffect(() => {
    isSearchingRef.current = isSearching;
  }, [isSearching]);
  
  const translate = typeof t === 'function' ? t : (key) => key;
  const language = qgisContext?.language || 'es';
  
  // Memoizar función de traducción
  const tr = useCallback((key, es, en) => {
    const v = translate(key);
    if (v && v !== key) return v;
    const lang = language.toLowerCase();
    return lang.startsWith('en') ? (en || es || key) : (es || en || key);
  }, [translate, language]);

  // Filtros de provincias/municipios parametrizados
  const configuredLocationFilters =
    qgisContext?.config?.cadastralRuralSearch?.locationFilters ||
    qgisContext?.config?.addressSearch?.locationFilters ||
    qgisContext?.config?.addressSearch?.locations ||
    qgisContext?.config?.addressSearch?.filters ||
    qgisContext?.config?.addressSearch?.municipalities ||
    null;

  const locationFilters = useMemo(
    () => resolveLocationFilters(configuredLocationFilters),
    [configuredLocationFilters]
  );

  const hasLocationFilters = useMemo(
    () =>
      Array.isArray(locationFilters) &&
      locationFilters.some((filter) => filter?.municipio || filter?.provincia),
    [locationFilters]
  );

  // Formatear y validar entrada con máscara polígono-parcela (ej: "123-456" o "123/456")
  const formatPolygonParcel = useCallback((value) => {
    // Eliminar todo excepto números y separadores comunes (-, /, espacio)
    let cleaned = value.replace(/[^\d\-\/\s]/g, '');
    
    // Si hay un separador, dividir en polígono y parcela
    const separator = cleaned.match(/[\-\/]/);
    if (separator) {
      const parts = cleaned.split(/[\-\/]/);
      const polygon = parts[0]?.replace(/\D/g, '').slice(0, 5) || '';
      const parcel = parts[1]?.replace(/\D/g, '').slice(0, 5) || '';
      return polygon + separator[0] + parcel;
    }
    
    // Si no hay separador, permitir solo números (será polígono)
    const numeric = cleaned.replace(/\D/g, '').slice(0, 5);
    return numeric;
  }, []);

  // Extraer polígono y parcela del valor formateado
  const parsePolygonParcel = useCallback((value) => {
    if (!value || !value.trim()) {
      return { polygon: '', parcel: '' };
    }
    
    const separator = value.match(/[\-\/]/);
    if (separator) {
      const parts = value.split(/[\-\/]/);
      return {
        polygon: parts[0]?.trim() || '',
        parcel: parts[1]?.trim() || ''
      };
    }
    
    // Si solo hay números, asumir que es polígono
    const numeric = value.replace(/\D/g, '');
    return {
      polygon: numeric,
      parcel: ''
    };
  }, []);

  // Parsear respuesta JSON del servicio del Catastro
  const parseCatastroResponse = useCallback((jsonData) => {
    try {
      const result = jsonData?.consulta_dnpppResult;
      if (!result || !result.bico || !result.bico.bi) {
        return [];
      }

      const bi = result.bico.bi;
      const ldt = bi.ldt || '';
      const idbi = bi.idbi || {};
      const rc = idbi.rc || {};
      const pc1 = rc.pc1 || '';
      const pc2 = rc.pc2 || '';
      
      // Construir referencia catastral concatenando pc1 + pc2
      const refCatastral = pc1 + pc2;

      if (!ldt || !refCatastral) {
        return [];
      }

      return [{
        id: refCatastral,
        type: 'Feature',
        properties: {
          ldt: ldt,
          refCatastral: refCatastral,
          pc1: pc1,
          pc2: pc2,
          displayText: ldt,
          rawData: bi
        }
      }];
    } catch (error) {
      console.error('[CadastralRuralSearch] Error parseando respuesta Catastro:', error);
      return [];
    }
  }, []);

  const fetchParcelsForCombo = useCallback(
    async (polygon, parcel, combo) => {
      // Extraer nombres de provincia y municipio (no códigos para esta request)
      // El nombre de provincia se extrae desde la configuración del municipio
      const provincia = 
        combo?.provincia ||
        combo?.metadata?.municipality?.provinceName ||
        combo?.metadata?.province?.cartoCiudadName ||
        combo?.metadata?.province?.name ||
        '';
      
      const municipio = 
        combo?.municipio ||
        combo?.metadata?.municipality?.cartoCiudadName ||
        combo?.metadata?.municipality?.name ||
        '';

      if (!provincia || !municipio) {
        return [];
      }

      const params = new URLSearchParams({
        Provincia: provincia,
        Municipio: municipio,
        Poligono: polygon || '',
        Parcela: parcel || ''
      });

      const requestUrl = `${CATASTRO_DNPPP_URL}?${params.toString()}`;

      try {
        const response = await fetch(requestUrl, {
          method: 'GET',
          mode: 'cors',
          headers: {
            Accept: 'application/json, text/javascript, */*; q=0.01'
          }
        });

        if (!response.ok) {
          const errorText = await response.text().catch(() => '');
          throw new Error(
            `Error Catastro DNPPP: ${response.status} ${response.statusText} ${errorText || ''}`
          );
        }

        const jsonData = await response.json();
        const parcels = parseCatastroResponse(jsonData);

        return parcels.map((feature) => ({
          ...feature,
          properties: {
            ...feature.properties,
            provincia: provincia,
            municipio: municipio
          }
        }));
      } catch (error) {
        console.error('[CadastralRuralSearch] Error en fetchParcelsForCombo:', error);
        return [];
      }
    },
    [parseCatastroResponse]
  );

  // Parsear GML a GeoJSON
  const parseGMLToGeoJSON = useCallback((gmlText) => {
    try {
      const parser = new DOMParser();
      const xmlDoc = parser.parseFromString(gmlText, 'text/xml');
      
      // Función auxiliar para parsear posList a coordenadas
      const parsePosList = (posListElement) => {
        if (!posListElement) return null;
        const coords = posListElement.textContent.trim().split(/\s+/).map(parseFloat);
        const ring = [];
        // En GML, las coordenadas vienen como "lat lon" (no "lon lat")
        for (let k = 0; k < coords.length; k += 2) {
          if (k + 1 < coords.length) {
            // GML usa lat,lon pero GeoJSON usa lon,lat - invertir
            ring.push([coords[k + 1], coords[k]]);
          }
        }
        return ring.length > 0 ? ring : null;
      };

      // Buscar gml:MultiSurface (estructura usada por el Catastro)
      const multiSurfaces = xmlDoc.getElementsByTagNameNS('http://www.opengis.net/gml/3.2', 'MultiSurface');
      
      if (multiSurfaces.length > 0) {
        const coordinates = [];
        for (let i = 0; i < multiSurfaces.length; i++) {
          const multiSurface = multiSurfaces[i];
          const surfaceMembers = multiSurface.getElementsByTagNameNS('http://www.opengis.net/gml/3.2', 'surfaceMember');
          
          for (let j = 0; j < surfaceMembers.length; j++) {
            const surfaceMember = surfaceMembers[j];
            const surfaces = surfaceMember.getElementsByTagNameNS('http://www.opengis.net/gml/3.2', 'Surface');
            
            for (let s = 0; s < surfaces.length; s++) {
              const surface = surfaces[s];
              const patches = surface.getElementsByTagNameNS('http://www.opengis.net/gml/3.2', 'patches')[0];
              
              if (patches) {
                const polygonPatches = patches.getElementsByTagNameNS('http://www.opengis.net/gml/3.2', 'PolygonPatch');
                
                for (let p = 0; p < polygonPatches.length; p++) {
                  const polygonPatch = polygonPatches[p];
                  const exterior = polygonPatch.getElementsByTagNameNS('http://www.opengis.net/gml/3.2', 'exterior')[0];
                  
                  if (exterior) {
                    const linearRing = exterior.getElementsByTagNameNS('http://www.opengis.net/gml/3.2', 'LinearRing')[0];
                    if (linearRing) {
                      const posList = linearRing.getElementsByTagNameNS('http://www.opengis.net/gml/3.2', 'posList')[0];
                      const ring = parsePosList(posList);
                      if (ring) {
                        coordinates.push([ring]);
                      }
                    }
                  }
                }
              }
            }
          }
        }
        
        if (coordinates.length > 0) {
          return {
            type: 'MultiPolygon',
            coordinates: coordinates
          };
        }
      }
      
      // Buscar gml:MultiPolygon (fallback)
      const multiPolygons = xmlDoc.getElementsByTagNameNS('http://www.opengis.net/gml/3.2', 'MultiPolygon');
      if (multiPolygons.length > 0) {
        const coordinates = [];
        for (let i = 0; i < multiPolygons.length; i++) {
          const multiPolygon = multiPolygons[i];
          const polygonMembers = multiPolygon.getElementsByTagNameNS('http://www.opengis.net/gml/3.2', 'polygonMember');
          for (let j = 0; j < polygonMembers.length; j++) {
            const polygon = polygonMembers[j].getElementsByTagNameNS('http://www.opengis.net/gml/3.2', 'Polygon')[0];
            if (polygon) {
              const exterior = polygon.getElementsByTagNameNS('http://www.opengis.net/gml/3.2', 'exterior')[0];
              if (exterior) {
                const linearRing = exterior.getElementsByTagNameNS('http://www.opengis.net/gml/3.2', 'LinearRing')[0];
                if (linearRing) {
                  const posList = linearRing.getElementsByTagNameNS('http://www.opengis.net/gml/3.2', 'posList')[0];
                  const ring = parsePosList(posList);
                  if (ring) {
                    coordinates.push([ring]);
                  }
                }
              }
            }
          }
        }
        if (coordinates.length > 0) {
          return {
            type: 'MultiPolygon',
            coordinates: coordinates
          };
        }
      }
      
      // Buscar gml:Polygon (fallback)
      const polygons = xmlDoc.getElementsByTagNameNS('http://www.opengis.net/gml/3.2', 'Polygon');
      if (polygons.length > 0) {
        const coordinates = [];
        for (let i = 0; i < polygons.length; i++) {
          const polygon = polygons[i];
          const exterior = polygon.getElementsByTagNameNS('http://www.opengis.net/gml/3.2', 'exterior')[0];
          if (exterior) {
            const linearRing = exterior.getElementsByTagNameNS('http://www.opengis.net/gml/3.2', 'LinearRing')[0];
            if (linearRing) {
              const posList = linearRing.getElementsByTagNameNS('http://www.opengis.net/gml/3.2', 'posList')[0];
              const ring = parsePosList(posList);
              if (ring) {
                coordinates.push([ring]);
              }
            }
          }
        }
        if (coordinates.length > 0) {
          return {
            type: 'Polygon',
            coordinates: coordinates[0]
          };
        }
      }
      
      return null;
    } catch (error) {
      console.error('[CadastralRuralSearch] Error parseando GML:', error);
      return null;
    }
  }, []);

  // Obtener geometría de la parcela usando WFS
  const fetchParcelGeometry = useCallback(async (refCatastral) => {
    if (!refCatastral) return null;

    const params = new URLSearchParams({
      service: 'wfs',
      version: '2',
      request: 'getfeature',
      STOREDQUERIE_ID: 'GetParcel',
      refcat: refCatastral,
      srsname: 'EPSG::4326'
    });

    const url = `${CATASTRO_WFS_URL}?${params.toString()}`;

    try {
      const response = await fetch(url, {
        method: 'GET',
        mode: 'cors',
        headers: {
          Accept: 'application/gml+xml, application/xml, text/xml, */*;q=0.01'
        }
      });

      if (!response.ok) {
        const errorText = await response.text().catch(() => '');
        throw new Error(
          `Error Catastro WFS: ${response.status} ${response.statusText} ${errorText || ''}`
        );
      }

      const gmlText = await response.text();
      const geometry = parseGMLToGeoJSON(gmlText);
      
      return geometry;
    } catch (error) {
      console.error('[CadastralRuralSearch] Error obteniendo geometría:', error);
      return null;
    }
  }, [parseGMLToGeoJSON]);

  const getLatLonFromGeometry = useCallback((geometry) => {
    if (!geometry) return null;
    const { type, coordinates } = geometry;

    if (type === 'Point' && Array.isArray(coordinates) && coordinates.length >= 2) {
      return { lon: parseFloat(coordinates[0]), lat: parseFloat(coordinates[1]) };
    }

    if ((type === 'LineString' || type === 'MultiPoint') && Array.isArray(coordinates) && coordinates.length) {
      const first = coordinates[0];
      if (Array.isArray(first) && first.length >= 2) {
        return { lon: parseFloat(first[0]), lat: parseFloat(first[1]) };
      }
    }

    if (type === 'Polygon' && Array.isArray(coordinates) && coordinates.length) {
      const firstRing = coordinates[0];
      if (Array.isArray(firstRing) && firstRing.length) {
        const first = firstRing[0];
        if (Array.isArray(first) && first.length >= 2) {
          return { lon: parseFloat(first[0]), lat: parseFloat(first[1]) };
        }
      }
    }

    return null;
  }, []);

  // Realizar búsqueda
  const performSearch = useCallback(async (searchValue) => {
    const { polygon, parcel } = parsePolygonParcel(searchValue);
    
    // Necesitamos al menos polígono y parcela para buscar
    if (!polygon || !polygon.trim() || !parcel || !parcel.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    // Evitar búsquedas simultáneas
    if (isSearchingRef.current) {
      return;
    }

    setIsSearching(true);
    
    try {
      // Usar filtros de ubicación si están disponibles (incluyendo los por defecto)
      // Si no hay filtros, hacer búsqueda sin filtros
      const combosToUse = Array.isArray(locationFilters) && locationFilters.length > 0 
        ? locationFilters 
        : [null];
      const parcelPromises = combosToUse.map((combo) =>
        fetchParcelsForCombo(polygon.trim(), parcel.trim(), combo).catch(() => [])
      );

      const comboResults = await Promise.all(parcelPromises);
      const allParcels = [];

      for (const list of comboResults) {
        for (const feature of list) {
          if (feature?.id) {
            allParcels.push(feature);
          }
        }
      }

      const parcels = allParcels.slice(0, MAX_RESULTS);
      
      if (parcels && parcels.length > 0) {
        setResults(parcels);
        setShowResults(true);
        setError(null);
      } else {
        setResults([]);
        setShowResults(true);
        setError(tr('ui.map.cadastralRuralSearch.notFound', 
          'No se encontró ninguna parcela con ese número de polígono y parcela', 
          'No parcel found with that polygon and parcel number'));
      }
    } catch (error) {
      console.error('[CadastralRuralSearch] Error en búsqueda:', error);
      setResults([]);
      setShowResults(false);
      setError(tr('ui.map.cadastralRuralSearch.searchError', 
        'Error al buscar la parcela', 
        'Error searching for parcel'));
    } finally {
      setIsSearching(false);
      isSearchingRef.current = false;
    }
  }, [fetchParcelsForCombo, hasLocationFilters, locationFilters, parsePolygonParcel]);

  // Almacenar función de búsqueda en ref para usarla en useEffect
  useEffect(() => {
    performSearchRef.current = performSearch;
  }, [performSearch]);

  // Realizar búsqueda cuando cambia el valor debounced
  useEffect(() => {
    if (debouncedSearchValue && debouncedSearchValue.trim().length > 0) {
      if (skipNextSearchRef.current) {
        skipNextSearchRef.current = false;
        return;
      }
      if (performSearchRef.current && !isSearchingRef.current) {
        performSearchRef.current(debouncedSearchValue);
      }
    } else {
      setResults([]);
      setShowResults(false);
      setError(null);
    }
  }, [debouncedSearchValue]);

  // Manejar selección de resultado
  const handleSelectResult = useCallback(
    async (result) => {
      if (!mapInstance || !result) return;

      const refCatastral = result?.properties?.refCatastral;
      const ldt = result?.properties?.ldt || '';

      if (!refCatastral) {
        console.error('[CadastralRuralSearch] No hay referencia catastral en el resultado');
        return;
      }

      const L = window.L;
      if (!L) return;

      if (markerRef.current) {
        mapInstance.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      if (geometryLayerRef.current) {
        mapInstance.removeLayer(geometryLayerRef.current);
        geometryLayerRef.current = null;
      }

      // Obtener geometría de la parcela
      try {
        const geometry = await fetchParcelGeometry(refCatastral);
        
        if (!geometry) {
          console.error('[CadastralRuralSearch] No se pudo obtener la geometría');
          return;
        }

        // Pintar geometría en el mapa
        try {
          geometryLayerRef.current = L.geoJSON(geometry, {
            style: () => ({
              color: '#ff5722',
              weight: 4,
              opacity: 0.9,
              fillColor: '#ff5722',
              fillOpacity: 0.2
            })
          }).addTo(mapInstance);

          // Construir contenido del popup
          let popupContent = `<div style="text-align: center;">`;
          popupContent += `<strong>${ldt}</strong>`;
          
          // Construir URL de catastro
          const refCatastralStr = String(refCatastral).trim();
          let RC1 = '';
          let RC2 = '';
          
          if (refCatastralStr.length >= 7) {
            RC1 = refCatastralStr.substring(0, 7);
            RC2 = refCatastralStr.substring(7);
          } else {
            RC1 = refCatastralStr;
            RC2 = '';
          }
          
          const catastroUrl = new URL('https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCListaBienes.aspx');
          catastroUrl.searchParams.set('RC1', RC1);
          catastroUrl.searchParams.set('RC2', RC2);
          catastroUrl.searchParams.set('RC3', '');
          catastroUrl.searchParams.set('RC4', '');
          catastroUrl.searchParams.set('esBice', '');
          catastroUrl.searchParams.set('RCBice1', '');
          catastroUrl.searchParams.set('RCBice2', '');
          catastroUrl.searchParams.set('DenoBice', '');
          catastroUrl.searchParams.set('pest', 'rc');
          catastroUrl.searchParams.set('final', '');
          catastroUrl.searchParams.set('RCCompleta', refCatastralStr);
          catastroUrl.searchParams.set('from', 'OVCBusqueda');
          catastroUrl.searchParams.set('tipoCarto', 'nuevo');
          catastroUrl.searchParams.set('ZV', 'NO');
          catastroUrl.searchParams.set('ZR', 'NO');
          catastroUrl.searchParams.set('anyoZV', '');
          catastroUrl.searchParams.set('strFechaVR', '');
          catastroUrl.searchParams.set('tematicos', '');
          catastroUrl.searchParams.set('anyotem', '');
          catastroUrl.searchParams.set('historica', '');
          
          const catastroLinkText = tr('ui.map.cadastralRuralSearch.catastroLink', 'Ver en Catastro', 'View in Cadastre');
          const encodedUrl = catastroUrl.toString().replace(/"/g, '&quot;');
          popupContent += `<br/><br/>`;
          popupContent += `<a href="${encodedUrl}" target="_blank" style="color: #1976d2; text-decoration: underline; cursor: pointer;">${catastroLinkText}</a>`;
          popupContent += '</div>';

          // Añadir popup a la geometría
          geometryLayerRef.current.eachLayer((layer) => {
            layer.bindPopup(popupContent);
          });

          // Hacer zoom a la geometría
          const bounds = geometryLayerRef.current.getBounds();
          if (bounds?.isValid && bounds.isValid()) {
            mapInstance.fitBounds(bounds, { padding: [50, 50] });
            // Abrir popup después de hacer zoom
            setTimeout(() => {
              geometryLayerRef.current.eachLayer((layer) => {
                layer.openPopup();
              });
            }, 500);
          } else {
            const fallback = getLatLonFromGeometry(geometry);
            if (fallback) {
              mapInstance.setView([fallback.lat, fallback.lon], 17, {
                animate: true,
                duration: 0.5
              });
            }
          }
        } catch (error) {
          console.error('[CadastralRuralSearch] Error pintando geometría:', error);
        }

        setShowResults(false);
        skipNextSearchRef.current = true;

        const resolvedMode = geometryTypeToMode(geometry) || 'polygon';
        if (setPendingExternalGeometry && resolvedMode) {
          setPendingExternalGeometry(geometry, resolvedMode);
        }
      } catch (error) {
        console.error('[CadastralRuralSearch] Error obteniendo geometría:', error);
      }
    },
    [
      fetchParcelGeometry,
      geometryTypeToMode,
      getLatLonFromGeometry,
      mapInstance,
      setPendingExternalGeometry,
      tr
    ]
  );

  // Manejar clic fuera del componente
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, []);

  useEffect(() => {
    return () => {
      if (markerRef.current && mapInstance) {
        mapInstance.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      if (geometryLayerRef.current && mapInstance) {
        mapInstance.removeLayer(geometryLayerRef.current);
        geometryLayerRef.current = null;
      }
    };
  }, [mapInstance]);

  const handleSearchChange = (e) => {
    skipNextSearchRef.current = false;
    const formatted = formatPolygonParcel(e.target.value);
    setSearchValue(formatted);
    setError(null);
  };

  const handleClear = () => {
    skipNextSearchRef.current = false;
    setSearchValue('');
    setResults([]);
    setShowResults(false);
    setError(null);
    if (markerRef.current && mapInstance) {
      mapInstance.removeLayer(markerRef.current);
      markerRef.current = null;
    }
    if (geometryLayerRef.current && mapInstance) {
      mapInstance.removeLayer(geometryLayerRef.current);
      geometryLayerRef.current = null;
    }
  };

  return (
    <div className="cadastral-rural-search" ref={resultsRef}>
      <SearchInput
        value={searchValue}
        onChange={handleSearchChange}
        placeholder={tr('ui.map.cadastralRuralSearch.placeholder', 'Polígono-Parcela (ej: 123-456)', 'Polygon-Parcel (e.g.: 123-456)')}
        disabled={isSearching}
        onClear={handleClear}
      />
      
      {error && searchValue.trim().length > 0 && (
        <div className="cadastral-rural-search-error">
          {error}
        </div>
      )}
      
      {isSearching && (
        <div className="cadastral-rural-search-loading">
          {tr('ui.common.searching', 'Buscando...', 'Searching...')}
        </div>
      )}
      
      {showResults && results.length > 0 && (
        <div className="cadastral-rural-search-results">
          {results.map((result) => {
            const ldt = result.properties.ldt || result.properties.displayText || 'Parcela';
            const provincia = result.properties.provincia || '';
            const municipio = result.properties.municipio || '';

            return (
              <div
                key={result.id}
                className="cadastral-rural-search-result"
                onClick={() => handleSelectResult(result)}
              >
                <div className="cadastral-rural-search-result-header">
                  <i className="cadastral-rural-search-result-icon fas fa-map-marked-alt" title={tr('ui.map.cadastralRuralSearch.parcelType', 'Parcela Rústica', 'Rural Parcel')} />
                  <div className="cadastral-rural-search-result-text">{ldt}</div>
                  <span className="cadastral-rural-search-result-type">
                    {tr('ui.map.cadastralRuralSearch.parcelLabel', 'Parcela', 'Parcel')}
                  </span>
                </div>
                {(municipio || provincia) && (
                  <div className="cadastral-rural-search-result-locality">
                    {municipio}
                    {provincia && `, ${provincia}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
    </div>
  );
};

CadastralRuralSearch.propTypes = {};

export default CadastralRuralSearch;

