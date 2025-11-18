import React, { useState, useRef, useContext, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { SearchInput } from '../../../UI';
import { useMap } from '../MapProvider';
import { QgisConfigContext } from '../../QgisConfigContext';
import { useDebounce } from '../../../UI/hooks';
import './CadastralReferenceSearch.css';

/**
 * Componente de búsqueda por referencia catastral completa
 * Usa el servicio WFS del Catastro de España
 * URL: http://ovc.catastro.meh.es/INSPIRE/wfsCP.aspx
 */
const CadastralReferenceSearch = () => {
  // Configuración: parámetros de búsqueda
  const SEARCH_DEBOUNCE_MS = 1000; // Tiempo de inactividad (ms) antes de realizar la búsqueda
  const REF_CATASTRAL_LENGTH = 14; // Longitud exacta de la referencia catastral
  
  // Endpoints Catastro
  const CATASTRO_WFS_URL = 'http://ovc.catastro.meh.es/INSPIRE/wfsCP.aspx';
  
  const mapContext = useMap();
  const { mapInstance, setPendingExternalGeometry } = mapContext || {};
  const qgisContext = useContext(QgisConfigContext);
  const { t } = qgisContext || {};
  
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [error, setError] = useState(null);
  const resultsRef = useRef(null);
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

  // Validar y formatear referencia catastral (solo alfanuméricos, máximo 14 caracteres)
  const formatCadastralReference = useCallback((value) => {
    // Eliminar espacios y caracteres especiales, mantener solo alfanuméricos
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '').toUpperCase();
    // Limitar a 14 caracteres
    return cleaned.slice(0, REF_CATASTRAL_LENGTH);
  }, []);

  // Validar que la referencia catastral tenga exactamente 14 caracteres
  const isValidCadastralReference = useCallback((value) => {
    if (!value || typeof value !== 'string') return false;
    const cleaned = value.replace(/[^A-Za-z0-9]/g, '');
    return cleaned.length === REF_CATASTRAL_LENGTH;
  }, []);

  // Parsear GML a GeoJSON (reutilizar lógica de CadastralRuralSearch)
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
      console.error('[CadastralReferenceSearch] Error parseando GML:', error);
      return null;
    }
  }, []);

  // Obtener geometría de la parcela usando WFS con referencia catastral
  const fetchParcelByReference = useCallback(async (refCatastral) => {
    if (!refCatastral || !isValidCadastralReference(refCatastral)) {
      return null;
    }

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
      console.error('[CadastralReferenceSearch] Error obteniendo geometría:', error);
      throw error;
    }
  }, [parseGMLToGeoJSON, isValidCadastralReference]);

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

    if (type === 'MultiPolygon' && Array.isArray(coordinates) && coordinates.length) {
      const firstPolygon = coordinates[0];
      if (Array.isArray(firstPolygon) && firstPolygon.length) {
        const firstRing = firstPolygon[0];
        if (Array.isArray(firstRing) && firstRing.length) {
          const first = firstRing[0];
          if (Array.isArray(first) && first.length >= 2) {
            return { lon: parseFloat(first[0]), lat: parseFloat(first[1]) };
          }
        }
      }
    }

    return null;
  }, []);

  // Realizar búsqueda
  const performSearch = useCallback(async (refCatastral) => {
    // Validar que tenga exactamente 14 caracteres
    if (!isValidCadastralReference(refCatastral)) {
      setError(tr('ui.map.cadastralReferenceSearch.invalidLength', 
        `La referencia catastral debe tener exactamente ${REF_CATASTRAL_LENGTH} caracteres`, 
        `Cadastral reference must be exactly ${REF_CATASTRAL_LENGTH} characters`));
      return;
    }

    // Evitar búsquedas simultáneas
    if (isSearchingRef.current) {
      return;
    }

    setIsSearching(true);
    setError(null);
    
    try {
      const geometry = await fetchParcelByReference(refCatastral);
      
      if (!geometry) {
        setError(tr('ui.map.cadastralReferenceSearch.notFound', 
          'No se encontró ninguna parcela con esa referencia catastral', 
          'No parcel found with that cadastral reference'));
        return;
      }

      // Pintar geometría en el mapa
      const L = window.L;
      if (!L || !mapInstance) return;

      if (geometryLayerRef.current) {
        mapInstance.removeLayer(geometryLayerRef.current);
        geometryLayerRef.current = null;
      }

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
      popupContent += `<strong>${tr('ui.map.cadastralReferenceSearch.reference', 'Referencia Catastral', 'Cadastral Reference')}</strong><br/>`;
      popupContent += `<strong>${refCatastral}</strong>`;
      
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
      
      const catastroLinkText = tr('ui.map.cadastralReferenceSearch.catastroLink', 'Ver en Catastro', 'View in Cadastre');
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

      skipNextSearchRef.current = true;

      const resolvedMode = geometryTypeToMode(geometry) || 'polygon';
      if (setPendingExternalGeometry && resolvedMode) {
        setPendingExternalGeometry(geometry, resolvedMode);
      }
    } catch (error) {
      console.error('[CadastralReferenceSearch] Error en búsqueda:', error);
      setError(tr('ui.map.cadastralReferenceSearch.searchError', 
        'Error al buscar la referencia catastral', 
        'Error searching for cadastral reference'));
    } finally {
      setIsSearching(false);
      isSearchingRef.current = false;
    }
  }, [fetchParcelByReference, geometryTypeToMode, getLatLonFromGeometry, isValidCadastralReference, mapInstance, setPendingExternalGeometry, tr]);

  // Almacenar función de búsqueda en ref para usarla en useEffect
  useEffect(() => {
    performSearchRef.current = performSearch;
  }, [performSearch]);

  // Realizar búsqueda cuando cambia el valor debounced y es válido
  useEffect(() => {
    if (debouncedSearchValue && isValidCadastralReference(debouncedSearchValue)) {
      if (skipNextSearchRef.current) {
        skipNextSearchRef.current = false;
        return;
      }
      if (performSearchRef.current && !isSearchingRef.current) {
        performSearchRef.current(debouncedSearchValue);
      }
    } else if (debouncedSearchValue && debouncedSearchValue.trim().length > 0) {
      // Si hay valor pero no es válido, mostrar error solo si tiene caracteres
      const cleaned = debouncedSearchValue.replace(/[^A-Za-z0-9]/g, '');
      if (cleaned.length > 0 && cleaned.length !== REF_CATASTRAL_LENGTH) {
        setError(tr('ui.map.cadastralReferenceSearch.invalidLength', 
          `La referencia catastral debe tener exactamente ${REF_CATASTRAL_LENGTH} caracteres`, 
          `Cadastral reference must be exactly ${REF_CATASTRAL_LENGTH} characters`));
      } else {
        setError(null);
      }
    } else {
      setError(null);
    }
  }, [debouncedSearchValue, isValidCadastralReference, performSearch]);

  useEffect(() => {
    return () => {
      if (geometryLayerRef.current && mapInstance) {
        mapInstance.removeLayer(geometryLayerRef.current);
        geometryLayerRef.current = null;
      }
    };
  }, [mapInstance]);

  const handleSearchChange = (e) => {
    skipNextSearchRef.current = false;
    const formatted = formatCadastralReference(e.target.value);
    setSearchValue(formatted);
    setError(null);
  };

  const handleClear = () => {
    skipNextSearchRef.current = false;
    setSearchValue('');
    setError(null);
    if (geometryLayerRef.current && mapInstance) {
      mapInstance.removeLayer(geometryLayerRef.current);
      geometryLayerRef.current = null;
    }
  };

  const isValid = isValidCadastralReference(searchValue);
  const showError = error && searchValue.trim().length > 0;

  return (
    <div className="cadastral-reference-search" ref={resultsRef}>
      <SearchInput
        value={searchValue}
        onChange={handleSearchChange}
        placeholder={tr('ui.map.cadastralReferenceSearch.placeholder', 
          'Referencia Catastral (14 caracteres)', 
          'Cadastral Reference (14 characters)')}
        disabled={isSearching}
        onClear={handleClear}
        maxLength={REF_CATASTRAL_LENGTH}
      />
      
      {showError && (
        <div className="cadastral-reference-search-error">
          {error}
        </div>
      )}
      
      {isSearching && (
        <div className="cadastral-reference-search-loading">
          {tr('ui.common.searching', 'Buscando...', 'Searching...')}
        </div>
      )}
      
      {!isValid && searchValue.trim().length > 0 && !showError && (
        <div className="cadastral-reference-search-hint">
          {tr('ui.map.cadastralReferenceSearch.hint', 
            `${REF_CATASTRAL_LENGTH - searchValue.replace(/[^A-Za-z0-9]/g, '').length} caracteres restantes`, 
            `${REF_CATASTRAL_LENGTH - searchValue.replace(/[^A-Za-z0-9]/g, '').length} characters remaining`)}
        </div>
      )}
    </div>
  );
};

CadastralReferenceSearch.propTypes = {};

export default CadastralReferenceSearch;

