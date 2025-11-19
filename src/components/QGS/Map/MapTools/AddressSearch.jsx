import React, { useState, useRef, useContext, useCallback, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { SearchInput } from '../../../UI';
import { useMap } from '../MapProvider';
import { QgisConfigContext } from '../../QgisConfigContext';
import { useDebounce } from '../../../UI/hooks';
import { resolveLocationFilters } from '../../../../config/geographicParameters';
import './AddressSearch.css';

const normalizeCodeValue = (value) => {
  if (value === null || value === undefined) return null;
  const normalized = String(value).trim();
  return normalized.length ? normalized : null;
};

const addCodeVariant = (set, value, padLength) => {
  const normalized = normalizeCodeValue(value);
  if (!normalized) return;
  set.add(normalized);
  if (padLength && normalized.length < padLength) {
    set.add(normalized.padStart(padLength, '0'));
  }
};

const buildCombinedCode = (provinceCode, municipalityCode, provinceLength = 0, municipalityLength = 0) => {
  const normalizedProvince = normalizeCodeValue(provinceCode);
  const normalizedMunicipality = normalizeCodeValue(municipalityCode);
  if (!normalizedProvince || !normalizedMunicipality) return null;
  const paddedProvince =
    provinceLength && normalizedProvince.length < provinceLength
      ? normalizedProvince.padStart(provinceLength, '0')
      : normalizedProvince;
  const paddedMunicipality =
    municipalityLength && normalizedMunicipality.length < municipalityLength
      ? normalizedMunicipality.padStart(municipalityLength, '0')
      : normalizedMunicipality;
  return `${paddedProvince}${paddedMunicipality}`;
};

const buildComboCodeFilters = (combo) => {
  if (!combo || !combo.metadata) {
    return {
      provinceCodes: [],
      municipalityCodes: []
    };
  }

  const provinceCodes = new Set();
  const municipalityCodes = new Set();
  const municipalityMeta = combo.metadata?.municipality;
  const provinceMeta = combo.metadata?.province;

  if (municipalityMeta) {
    addCodeVariant(provinceCodes, municipalityMeta.provinceCatastroCode, 2);
    addCodeVariant(provinceCodes, municipalityMeta.provinceIneCode, 2);
    addCodeVariant(municipalityCodes, municipalityMeta.catastroCode, 3);
    addCodeVariant(municipalityCodes, municipalityMeta.ineCode, 3);

    const combinedIne = buildCombinedCode(
      municipalityMeta.provinceIneCode,
      municipalityMeta.ineCode,
      2,
      3
    );
    if (combinedIne) {
      addCodeVariant(municipalityCodes, combinedIne);
    }

    const combinedCatastro = buildCombinedCode(
      municipalityMeta.provinceCatastroCode,
      municipalityMeta.catastroCode,
      2,
      3
    );
    if (combinedCatastro) {
      addCodeVariant(municipalityCodes, combinedCatastro);
    }
  }

  if (provinceMeta) {
    addCodeVariant(provinceCodes, provinceMeta.catastroCode, 2);
    addCodeVariant(provinceCodes, provinceMeta.ineCode, 2);
  }

  return {
    provinceCodes: Array.from(provinceCodes),
    municipalityCodes: Array.from(municipalityCodes)
  };
};

const collectCandidateCodes = (feature) => {
  const provinceCodes = new Set();
  const municipalityCodes = new Set();
  const properties = feature?.properties || {};
  const candidateInfo = properties.candidateInfo || {};

  const provinceSources = [
    properties.provinceCode,
    properties.province_code,
    properties.provinceINECode,
    properties.provinciaCode,
    candidateInfo.provinceCode,
    candidateInfo.province_code,
    candidateInfo.provinciaCode
  ];

  provinceSources.forEach((value) => addCodeVariant(provinceCodes, value, 2));

  const municipalitySources = [
    properties.municipalityCode,
    properties.municipality_code,
    properties.muniCode,
    properties.municipioCode,
    properties.municipalityIneCode,
    candidateInfo.municipalityCode,
    candidateInfo.muniCode,
    candidateInfo.municipioCode
  ];

  municipalitySources.forEach((value) => addCodeVariant(municipalityCodes, value, 3));

  // Añadir variantes con los últimos 3 dígitos para códigos compuestos
  const municipalityCodesArray = Array.from(municipalityCodes);
  municipalityCodesArray.forEach((code) => {
    if (code.length > 3) {
      municipalityCodes.add(code.slice(-3));
    }
  });

  return {
    provinceCodes: Array.from(provinceCodes),
    municipalityCodes: Array.from(municipalityCodes)
  };
};

const normalizeName = (value) => {
  if (!value) return '';
  return String(value).trim().toLowerCase();
};

const matchesComboByName = (feature, combo) => {
  if (!combo) return true;
  const properties = feature?.properties || {};
  const candidateProvinceName = normalizeName(
    properties.province || properties.provincia || properties.provinceName
  );
  const candidateMunicipalityName = normalizeName(
    properties.locality || properties.localidad || properties.municipality || properties.muni
  );
  const comboProvinceName = normalizeName(
    combo.provincia ||
      combo.metadata?.province?.cartoCiudadName ||
      combo.metadata?.province?.name
  );
  const comboMunicipalityName = normalizeName(
    combo.municipio ||
      combo.metadata?.municipality?.cartoCiudadName ||
      combo.metadata?.municipality?.name
  );

  const provinceMatches = !comboProvinceName || candidateProvinceName === comboProvinceName;
  const municipalityMatches =
    !comboMunicipalityName || candidateMunicipalityName === comboMunicipalityName;

  return provinceMatches && municipalityMatches;
};

const featureMatchesCombo = (feature, combo, comboCodeFilters) => {
  if (!combo) return true;
  const filters = comboCodeFilters || { provinceCodes: [], municipalityCodes: [] };
  const expectedProvinceCodes = filters.provinceCodes || [];
  const expectedMunicipalityCodes = filters.municipalityCodes || [];
  const hasExpectedCodes =
    expectedProvinceCodes.length > 0 || expectedMunicipalityCodes.length > 0;

  const candidateCodes = collectCandidateCodes(feature);
  const candidateProvinceCodes = candidateCodes.provinceCodes;
  const candidateMunicipalityCodes = candidateCodes.municipalityCodes;
  const hasCandidateCodes =
    candidateProvinceCodes.length > 0 || candidateMunicipalityCodes.length > 0;

  if (hasExpectedCodes && hasCandidateCodes) {
    const provinceMatches =
      expectedProvinceCodes.length === 0 ||
      candidateProvinceCodes.some((code) => expectedProvinceCodes.includes(code));
    const municipalityMatches =
      expectedMunicipalityCodes.length === 0 ||
      candidateMunicipalityCodes.some((code) => expectedMunicipalityCodes.includes(code));

    if (!provinceMatches || !municipalityMatches) {
      // Resultado descartado por no coincidir códigos
    }

    return provinceMatches && municipalityMatches;
  }

  const matchesByName = matchesComboByName(feature, combo);

  return matchesByName;
};

const extractCandidateMunicipalityCode = (feature) => {
  const properties = feature?.properties || {};
  const candidateInfo = properties.candidateInfo || {};
  return (
    normalizeCodeValue(candidateInfo.municipalityCode) ||
    normalizeCodeValue(candidateInfo.muniCode) ||
    normalizeCodeValue(properties.municipalityCode) ||
    normalizeCodeValue(properties.muniCode)
  );
};

/**
 * Componente de búsqueda de direcciones usando el servicio REST Geocoder de CartoCiudad
 * Servicio del IGN (Instituto Geográfico Nacional) de España
 * URL: https://www.cartociudad.es/geocoder/api/geocoder/
 */
const AddressSearch = () => {
  // Configuración: parámetros de búsqueda
  const MIN_SEARCH_LENGTH = 3; // Número mínimo de caracteres para realizar la búsqueda
  const SEARCH_DEBOUNCE_MS = 1000; // Tiempo de inactividad (ms) antes de realizar la búsqueda
  const MAX_RESULTS = 10; // Número máximo de resultados a mostrar al usuario
  const MAX_CANDIDATES_REQUEST = 20; // Límite para la petición a CartoCiudad
  const ALLOWED_TYPES = ['callejero', 'portal'];
  
  // Endpoints CartoCiudad
  const CARTOCIUDAD_CANDIDATES_URL = 'https://www.cartociudad.es/geocoder/api/geocoder/candidates';
  const CARTOCIUDAD_FIND_URL = 'https://www.cartociudad.es/geocoder/api/geocoder/find';
  
  const mapContext = useMap();
  const { mapInstance, setPendingExternalGeometry } = mapContext || {};
  const qgisContext = useContext(QgisConfigContext);
  const { t } = qgisContext || {};
  
  const [searchValue, setSearchValue] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const resultsRef = useRef(null);
  const markerRef = useRef(null);
  const geometryLayerRef = useRef(null);
  const isSearchingRef = useRef(false);
  const performSearchRef = useRef(null);
  const skipNextSearchRef = useRef(false);
  
  const debouncedSearchValue = useDebounce(searchValue, SEARCH_DEBOUNCE_MS);
  const candidateTypeToMode = useCallback((type) => {
    if (!type) return null;
    const value = String(type).toLowerCase();
    if (value === 'portal' || value === 'portalero') return 'point';
    if (value === 'callejero' || value === 'toponimo' || value === 'vial') return 'line';
    if (value === 'parcela' || value === 'edificio') return 'polygon';
    return null;
  }, []);

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

  const allowedMunicipalityCatastroCodes = useMemo(() => {
    const codes = new Set();
    if (Array.isArray(locationFilters)) {
      locationFilters.forEach((filter) => {
        const catastroCode = normalizeCodeValue(
          filter?.metadata?.municipality?.catastroCode ||
            filter?.metadata?.municipio?.catastroCode ||
            filter?.metadata?.municipality?.catastro_code
        );
        if (catastroCode) {
          codes.add(catastroCode);
        }
      });
    }
    return codes;
  }, [locationFilters]);

  const filterByConfiguredMunicipalities = useCallback(
    (features) => {
      if (!features || !features.length) return [];
      if (!allowedMunicipalityCatastroCodes || allowedMunicipalityCatastroCodes.size === 0) {
        return features;
      }

      return features.filter((feature) => {
        const candidateMunicipalityCode = extractCandidateMunicipalityCode(feature);
        if (!candidateMunicipalityCode) {
          return false;
        }

        const matches = Array.from(allowedMunicipalityCatastroCodes).some((catastroCode) =>
          candidateMunicipalityCode.includes(catastroCode)
        );


        return matches;
      });
    },
    [allowedMunicipalityCatastroCodes]
  );

  // Parsear respuesta JSON del servicio CartoCiudad
  const parseCartoCiudadResponse = useCallback((jsonData) => {
    try {
      // El servicio puede devolver un array directamente o un objeto con una propiedad
      let candidates = [];
      
      if (Array.isArray(jsonData)) {
        candidates = jsonData;
      } else if (jsonData && typeof jsonData === 'object') {
        // Buscar array de candidatos en diferentes propiedades posibles
        candidates = jsonData.candidates || jsonData.results || jsonData.data || [];
      }
      
      if (!candidates || candidates.length === 0) {
        return [];
      }
      
      const addresses = [];
      
      for (let i = 0; i < candidates.length; i++) {
        const candidate = candidates[i];
        try {
          // Extraer información del candidato
          // La estructura puede variar, intentamos diferentes campos comunes
          const address = candidate.address || candidate.direccion || candidate.formatted_address || '';
          const street = candidate.street || candidate.via || candidate.thoroughfare || '';
          const number = candidate.number || candidate.numero || candidate.portal || '';
          const locality = candidate.locality || candidate.localidad || candidate.municipality || '';
          const province = candidate.province || candidate.provincia || '';
          const postalCode = candidate.postalCode || candidate.codigo_postal || candidate.postcode || '';
          const refCatastral = candidate.refCatastral || candidate.refcatastral || candidate.referenciaCatastral || null;

          const provinceCode =
            candidate.provinceCode ||
            candidate.province_code ||
            candidate.codigoProvincia ||
            candidate.codProvincia ||
            candidate.codprovincia ||
            candidate.cod_provincia ||
            null;

          const municipalityCode =
            candidate.muniCode ||
            candidate.municipalityCode ||
            candidate.municipality_code ||
            candidate.codigoMunicipio ||
            candidate.codMunicipio ||
            candidate.codmunicipio ||
            candidate.cod_municipio ||
            null;
          
          // Coordenadas (pueden estar en diferentes formatos)
          let lon = null;
          let lat = null;
          
          if (candidate.lon !== undefined && candidate.lat !== undefined) {
            lon = parseFloat(candidate.lon);
            lat = parseFloat(candidate.lat);
          } else if (candidate.longitude !== undefined && candidate.latitude !== undefined) {
            lon = parseFloat(candidate.longitude);
            lat = parseFloat(candidate.latitude);
          } else if (candidate.geometry && candidate.geometry.coordinates) {
            // GeoJSON format: [lon, lat]
            lon = parseFloat(candidate.geometry.coordinates[0]);
            lat = parseFloat(candidate.geometry.coordinates[1]);
          } else if (candidate.geometry && candidate.geometry.location) {
            lon = parseFloat(candidate.geometry.location.lng || candidate.geometry.location.lon);
            lat = parseFloat(candidate.geometry.location.lat);
          }
          
          // Construir texto de visualización
          const displayParts = [];
          if (street) displayParts.push(street);
          if (number) displayParts.push(number);
          if (locality) displayParts.push(locality);
          if (province) displayParts.push(province);
          
          const displayText = displayParts.length > 0
            ? displayParts.join(', ') 
            : address || `${lon}, ${lat}`;
          
          // Crear feature GeoJSON
          const candidateType = (candidate.type || candidate.tipo || 'callejero').toLowerCase();
          const feature = {
            id: candidate.id || `address_${addresses.length}`,
            type: 'Feature',
            geometry: {
              type: 'Point',
              coordinates:
                lon !== null && lat !== null && !Number.isNaN(lon) && !Number.isNaN(lat)
                  ? [lon, lat]
                  : null
            },
            properties: {
              address: address || displayText,
              street: street,
              number: number,
              locality: locality,
              province: province,
              postalCode: postalCode,
              displayText: displayText,
              refCatastral: refCatastral,
              provinceCode: provinceCode ? String(provinceCode) : null,
              municipalityCode: municipalityCode ? String(municipalityCode) : null,
              // Mantener compatibilidad con estructura anterior
              via: street,
              portal: number,
              localId: candidate.id || `address_${addresses.length}`,
              candidateInfo: {
                id: candidate.id,
                type: candidateType || 'callejero',
                portal: candidate.portal || candidate.numero || candidate.number || '',
                provinceCode: provinceCode ? String(provinceCode) : null,
                municipalityCode: municipalityCode ? String(municipalityCode) : null
              }
            }
          };
          
          addresses.push(feature);
        } catch (parseError) {
          console.error('[AddressSearch] Error parseando candidato:', parseError);
          console.error('[AddressSearch] Stack:', parseError.stack);
        }
      }
      return addresses;
    } catch (error) {
      console.error('[AddressSearch] Error parseando respuesta CartoCiudad:', error);
      throw error;
    }
  }, []);

  const fetchCandidatesForCombo = useCallback(
    async (term, combo) => {
      // Extraer nombres de provincia y municipio desde los metadatos
      // El nombre de provincia se extrae desde la configuración del municipio
      const nombreMunicipio = 
        combo?.municipio ||
        combo?.metadata?.municipality?.cartoCiudadName ||
        combo?.metadata?.municipality?.name ||
        null;
      
      const nombreProvincia = 
        combo?.provincia ||
        combo?.metadata?.municipality?.provinceName ||
        combo?.metadata?.province?.cartoCiudadName ||
        combo?.metadata?.province?.name ||
        null;

      // Construir término de búsqueda concatenando: term, provincia, municipio
      let searchTerm = term.toUpperCase();
      /*
      if (nombreProvincia && nombreMunicipio) {
        searchTerm = `${term}, ${nombreMunicipio}, ${nombreProvincia}`;
      } else if (nombreProvincia) {
        searchTerm = `${term}, ${nombreProvincia}`; // No se incluye la provincia en la búsqueda
      } */
      if (nombreMunicipio) {
        searchTerm = `${term}, ${nombreMunicipio}`;
      }

      const params = new URLSearchParams({
        q: searchTerm,
        limit: MAX_CANDIDATES_REQUEST.toString()
      });

      const requestUrl = `${CARTOCIUDAD_CANDIDATES_URL}?${params.toString()}`;

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
          `Error CartoCiudad candidatos: ${response.status} ${response.statusText} ${errorText || ''}`
        );
      }

      const jsonData = await response.json();
      const parsedAddresses = parseCartoCiudadResponse(jsonData);
      const addresses = filterByConfiguredMunicipalities(parsedAddresses);
      const comboCodeFilters = buildComboCodeFilters(combo);

      return addresses
        .filter((feature) =>
          ALLOWED_TYPES.includes((feature.properties?.candidateInfo?.type || '').toLowerCase())
        )
        .filter((feature) => featureMatchesCombo(feature, combo, comboCodeFilters))
        .map((feature) => ({
          ...feature,
          properties: {
            ...feature.properties,
            candidateInfo: {
              id: feature.properties?.candidateInfo?.id || feature.id,
              type: (feature.properties?.candidateInfo?.type || '').toLowerCase(),
              portal:
                feature.properties?.candidateInfo?.portal || feature.properties?.portal || '',
              provinceCode:
                feature.properties?.candidateInfo?.provinceCode ||
                feature.properties?.provinceCode ||
                null,
              municipalityCode:
                feature.properties?.candidateInfo?.municipalityCode ||
                feature.properties?.municipalityCode ||
                null
            },
            filtroMunicipio: combo?.municipio || null,
            filtroProvincia: combo?.provincia || null
          }
        }));
    },
    [parseCartoCiudadResponse]
  );

  const fetchCandidateGeometry = useCallback(async (candidateInfo = {}) => {
    if (!candidateInfo?.id) return null;

    const params = new URLSearchParams({
      id: candidateInfo.id,
      type: candidateInfo.type || 'callejero',
      outputformat: 'geojson'
    });

    if (candidateInfo.portal) {
      params.append('portal', candidateInfo.portal);
    }

    const url = `${CARTOCIUDAD_FIND_URL}?${params.toString()}`;

    const response = await fetch(url, {
      method: 'GET',
      mode: 'cors',
      headers: {
        Accept: 'application/geo+json, application/json, */*;q=0.01'
      }
    });

    if (!response.ok) {
      const errorText = await response.text().catch(() => '');
      throw new Error(
        `Error CartoCiudad find: ${response.status} ${response.statusText} ${errorText || ''}`
      );
    }

    const geojson = await response.json();
    if (!geojson) return null;

    if (geojson.type === 'Feature') return geojson;
    if (geojson.type === 'FeatureCollection' && geojson.features?.length) {
      return geojson.features[0];
    }

    return null;
  }, []);

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

  // Realizar búsqueda en servicio CartoCiudad
  const performSearch = useCallback(async (value) => {
    if (!value || !value.trim()) {
      setResults([]);
      setShowResults(false);
      return;
    }

    // No realizar búsqueda si no se han escrito al menos MIN_SEARCH_LENGTH caracteres
    const trimmedValue = value.trim();
    if (trimmedValue.length < MIN_SEARCH_LENGTH) {
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
      
      // Log para depuración - verificar qué filtros se están usando
      console.log('[AddressSearch] Filtros de ubicación a usar:', {
        locationFiltersCount: locationFilters?.length || 0,
        combosToUseCount: combosToUse.length,
        combosToUse: combosToUse.map(c => c ? {
          municipio: c.municipio,
          provincia: c.provincia,
          metadata: c.metadata ? {
            municipality: c.metadata.municipality ? {
              catastroCode: c.metadata.municipality.catastroCode,
              ineCode: c.metadata.municipality.ineCode,
              provinceCatastroCode: c.metadata.municipality.provinceCatastroCode,
              provinceIneCode: c.metadata.municipality.provinceIneCode
            } : null,
            province: c.metadata.province ? {
              catastroCode: c.metadata.province.catastroCode,
              ineCode: c.metadata.province.ineCode
            } : null
          } : null
        } : null)
      });
      
      const candidatePromises = combosToUse.map((combo) =>
        fetchCandidatesForCombo(trimmedValue, combo).catch(() => [])
      );

      const comboResults = await Promise.all(candidatePromises);
      const dedupMap = new Map();

      for (const list of comboResults) {
        for (const feature of list) {
          if (!feature?.id) continue;
          if (!dedupMap.has(feature.id)) {
            dedupMap.set(feature.id, feature);
          }
          if (dedupMap.size >= MAX_RESULTS) break;
        }
        if (dedupMap.size >= MAX_RESULTS) break;
      }

      const addresses = Array.from(dedupMap.values()).slice(0, MAX_RESULTS);
      
      if (addresses && addresses.length > 0) {
        setResults(addresses);
        setShowResults(true);
      } else {
        setResults([]);
        setShowResults(true);
      }
    } catch (error) {
      setResults([]);
      setShowResults(false);
    } finally {
      setIsSearching(false);
      isSearchingRef.current = false;
    }
  }, [fetchCandidatesForCombo, hasLocationFilters, locationFilters, tr]);

  // Almacenar función de búsqueda en ref para usarla en useEffect
  useEffect(() => {
    performSearchRef.current = performSearch;
  }, [performSearch]);

  // Realizar búsqueda cuando cambia el valor debounced
  useEffect(() => {
    if (debouncedSearchValue && debouncedSearchValue.trim().length >= MIN_SEARCH_LENGTH) {
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
    }
  }, [debouncedSearchValue]);

  // Manejar selección de resultado
  const handleSelectResult = useCallback(
    async (result) => {
      if (!mapInstance || !result) return;

      let targetFeature = result;
      const candidateInfo = result?.properties?.candidateInfo;

      if (candidateInfo?.id) {
        try {
          const detailedFeature = await fetchCandidateGeometry(candidateInfo);
          if (detailedFeature?.geometry) {
            const detailedProps = detailedFeature.properties || {};
            targetFeature = {
              ...result,
              geometry: detailedFeature.geometry,
              properties: {
                ...result.properties,
                // Preservar refCatastral de la respuesta detallada si existe
                refCatastral: detailedProps.refCatastral || detailedProps.refcatastral || detailedProps.referenciaCatastral || result.properties.refCatastral || null,
                detailedProperties: detailedProps
              }
            };
          }
        } catch (error) {
          console.error('[AddressSearch] Error obteniendo geometría detallada:', error);
        }
      }

      const geometry = targetFeature.geometry || result.geometry;

      if (!geometry) {
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

      const isPointGeometry =
        geometry.type === 'Point' &&
        Array.isArray(geometry.coordinates) &&
        geometry.coordinates.length >= 2 &&
        !Number.isNaN(geometry.coordinates[0]) &&
        !Number.isNaN(geometry.coordinates[1]);

      if (isPointGeometry) {
        const [lon, lat] = geometry.coordinates;

        mapInstance.setView([lat, lon], 18, {
          animate: true,
          duration: 0.5
        });

        markerRef.current = L.marker([lat, lon], {
          icon: L.icon({
            iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
            iconSize: [25, 41],
            iconAnchor: [12, 41],
            popupAnchor: [1, -34]
          })
        }).addTo(mapInstance);

        // Construir contenido del popup
        const addressText = targetFeature.properties.address || targetFeature.properties.displayText || 'Dirección encontrada';
        const refCatastral = targetFeature.properties.refCatastral || targetFeature.properties.detailedProperties?.refCatastral;
        let popupContent = `<div style="text-align: center;"><strong>${addressText}</strong>`;
        
        if (refCatastral) {
          // Extraer RC1 (primeras 7 cifras) y RC2 (resto) del refCatastral
          const refCatastralStr = String(refCatastral).trim();
          let RC1 = '';
          let RC2 = '';
          
          if (refCatastralStr.length >= 7) {
            RC1 = refCatastralStr.substring(0, 7);
            RC2 = refCatastralStr.substring(7);
          } else {
            // Si tiene menos de 7 caracteres, usar todo como RC1
            RC1 = refCatastralStr;
            RC2 = '';
          }
          
          // Construir URL de catastro con los parámetros requeridos
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
          
          const catastroLinkText = tr('ui.map.addressSearch.catastroLink', 'Ver en Catastro', 'View in Cadastre');
          const encodedUrl = catastroUrl.toString().replace(/"/g, '&quot;');
          popupContent += `<br/><br/>`;
          popupContent += `<a href="${encodedUrl}" target="_blank" style="color: #1976d2; text-decoration: underline; cursor: pointer;">${catastroLinkText}</a>`;
        }
        
        popupContent += '</div>';

        markerRef.current
          .bindPopup(popupContent)
          .openPopup();
      } else {
        try {
          geometryLayerRef.current = L.geoJSON(geometry, {
            style: () => ({
              color: '#ff5722',
              weight: 4,
              opacity: 0.9
            })
          }).addTo(mapInstance);

          const bounds = geometryLayerRef.current.getBounds();
          if (bounds?.isValid && bounds.isValid()) {
            mapInstance.fitBounds(bounds, { padding: [50, 50] });
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
          const fallback = getLatLonFromGeometry(geometry);
          if (fallback) {
            mapInstance.setView([fallback.lat, fallback.lon], 17, {
              animate: true,
              duration: 0.5
            });
          }
        }
      }

      setShowResults(false);
      skipNextSearchRef.current = true;
      setSearchValue(result.properties.address || result.properties.displayText || '');

      const resolvedMode =
        geometryTypeToMode(geometry) || candidateTypeToMode(result?.properties?.candidateInfo?.type);
      if (setPendingExternalGeometry && resolvedMode) {
        setPendingExternalGeometry(geometry, resolvedMode);
      }
    },
    [
      candidateTypeToMode,
      fetchCandidateGeometry,
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

  return (
    <div className="address-search" ref={resultsRef}>
      <SearchInput
        value={searchValue}
        onChange={(e) => {
          skipNextSearchRef.current = false;
          setSearchValue(e.target.value);
        }}
        placeholder={tr('ui.map.addressSearch.placeholder', 'Buscar dirección...', 'Search address...')}
        disabled={isSearching}
        onClear={() => {
          skipNextSearchRef.current = false;
          setSearchValue('');
          setResults([]);
          setShowResults(false);
          if (markerRef.current && mapInstance) {
            mapInstance.removeLayer(markerRef.current);
            markerRef.current = null;
          }
          if (geometryLayerRef.current && mapInstance) {
            mapInstance.removeLayer(geometryLayerRef.current);
            geometryLayerRef.current = null;
          }
        }}
      />
      
      {isSearching && (
        <div className="address-search-loading">
          {tr('ui.common.searching', 'Buscando...', 'Searching...')}
        </div>
      )}
      
      {showResults && results.length > 0 && (
        <div className="address-search-results">
          {results.map((result) => {
            const resultType = (result.properties?.candidateInfo?.type || '').toLowerCase();
            const isPortal = resultType === 'portal';
            const iconClass = isPortal ? 'fas fa-map-marker-alt' : 'fas fa-road';
            const iconTitle = isPortal
              ? tr('ui.map.addressSearch.portalType', 'Portal (dirección postal)', 'Postal address')
              : tr('ui.map.addressSearch.streetType', 'Callejero', 'Street');

            const primaryText =
              result.properties.address ||
              result.properties.displayText ||
              [result.properties.street, result.properties.number, result.properties.locality]
                .filter(Boolean)
                .join(', ') ||
              'Dirección';

            return (
              <div
                key={result.id}
                className="address-search-result"
                onClick={() => handleSelectResult(result)}
              >
                <div className="address-search-result-header">
                  <i className={`address-search-result-icon ${iconClass}`} title={iconTitle} />
                  <div className="address-search-result-text">{primaryText}</div>
                  <span className="address-search-result-type">
                    {isPortal
                      ? tr('ui.map.addressSearch.portalLabel', 'Portal', 'Portal')
                      : tr('ui.map.addressSearch.streetLabel', 'Callejero', 'Street')}
                  </span>
                </div>
                {result.properties.locality && (
                  <div className="address-search-result-locality">
                    {result.properties.locality}
                    {result.properties.province && `, ${result.properties.province}`}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
      
      {showResults && results.length === 0 && !isSearching && (
        <div className="address-search-no-results">
          {tr('ui.map.addressSearch.noResults', 'Sin resultados', 'No results')}
        </div>
      )}
    </div>
  );
};

AddressSearch.propTypes = {};

export default AddressSearch;
