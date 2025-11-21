import React, { useState, useRef, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useMap } from '../MapProvider';
import { SearchInput } from '../../../UI';
import { Button } from '../../../UI';
import './CustomSearchExample.css';

/**
 * Ejemplo de buscador personalizado
 * Este componente demuestra cómo crear un buscador personalizado que:
 * - Llama a una función externa para buscar
 * - Añade un marcador con popup al mapa cuando encuentra un resultado
 */
const CustomSearchExample = ({ 
  onSearch, 
  placeholder = 'Buscar ubicación...',
  searchLabel = 'Buscar',
  icon = 'fa-search',
  resultLabel = 'resultado',
  resultLabelPlural = 'resultados'
}) => {
  const { mapInstance } = useMap() || {};
  const [searchValue, setSearchValue] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [results, setResults] = useState([]);
  const [showResults, setShowResults] = useState(false);
  const markerRef = useRef(null);
  const resultsRef = useRef(null);

  // Limpiar marcador al desmontar
  useEffect(() => {
    return () => {
      if (markerRef.current && mapInstance) {
        mapInstance.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    };
  }, [mapInstance]);

  // Función para añadir un marcador al mapa
  const addMarkerToMap = useCallback((lat, lon, title, popupContent) => {
    if (!mapInstance || !window.L) {
      return;
    }

    // Eliminar marcador anterior si existe
    if (markerRef.current) {
      mapInstance.removeLayer(markerRef.current);
      markerRef.current = null;
    }

    // Crear nuevo marcador
    markerRef.current = window.L.marker([lat, lon], {
      icon: window.L.icon({
        iconUrl: 'https://unpkg.com/leaflet@1.7.1/dist/images/marker-icon.png',
        iconSize: [25, 41],
        iconAnchor: [12, 41],
        popupAnchor: [1, -34]
      })
    }).addTo(mapInstance);

    // Añadir popup al marcador
    if (popupContent) {
      markerRef.current
        .bindPopup(popupContent)
        .openPopup();
    } else if (title) {
      markerRef.current
        .bindPopup(title)
        .openPopup();
    }

    // Centrar el mapa en el marcador
    mapInstance.setView([lat, lon], 15, {
      animate: true,
      duration: 0.5
    });
  }, [mapInstance]);

  // Manejar selección de resultado
  const handleSelectResult = useCallback((result) => {
    if (!result || !result.lat || !result.lon) {
      return;
    }

    // Añadir marcador al mapa
    const popupContent = result.popupContent || result.title || searchValue;
    addMarkerToMap(result.lat, result.lon, result.title || searchValue, popupContent);
    
    // Ocultar lista de resultados
    setShowResults(false);
    setResults([]);
  }, [addMarkerToMap, searchValue]);

  // Manejar búsqueda
  const handleSearch = useCallback(async (value) => {
    if (!value || !value.trim()) {
      setError(null);
      setResults([]);
      setShowResults(false);
      // Limpiar marcador si se borra la búsqueda
      if (markerRef.current && mapInstance) {
        mapInstance.removeLayer(markerRef.current);
        markerRef.current = null;
      }
      return;
    }

    if (!onSearch || typeof onSearch !== 'function') {
      setError('Función de búsqueda no proporcionada');
      return;
    }

    setLoading(true);
    setError(null);
    setShowResults(false);

    try {
      // Llamar a la función externa de búsqueda
      const searchResult = await onSearch(value.trim());

      // Verificar si es un array (múltiples resultados) o un objeto único
      const resultsArray = Array.isArray(searchResult) ? searchResult : (searchResult ? [searchResult] : []);

      if (resultsArray.length === 0) {
        setError('No se encontraron resultados');
        setResults([]);
        setShowResults(false);
        // Limpiar marcador si no hay resultados
        if (markerRef.current && mapInstance) {
          mapInstance.removeLayer(markerRef.current);
          markerRef.current = null;
        }
      } else if (resultsArray.length === 1) {
        // Si hay un solo resultado, seleccionarlo automáticamente
        handleSelectResult(resultsArray[0]);
        setResults([]);
        setShowResults(false);
      } else {
        // Si hay múltiples resultados, mostrarlos en una lista
        setResults(resultsArray);
        setShowResults(true);
      }
    } catch (err) {
      console.error('[CustomSearchExample] Error en búsqueda:', err);
      setError(err.message || 'Error al realizar la búsqueda');
      setResults([]);
      setShowResults(false);
      // Limpiar marcador en caso de error
      if (markerRef.current && mapInstance) {
        mapInstance.removeLayer(markerRef.current);
        markerRef.current = null;
      }
    } finally {
      setLoading(false);
    }
  }, [onSearch, handleSelectResult, mapInstance]);

  // Manejar clic fuera del componente para cerrar la lista de resultados
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (resultsRef.current && !resultsRef.current.contains(event.target)) {
        setShowResults(false);
      }
    };

    if (showResults) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [showResults]);

  const handleKeyPress = (e) => {
    if (e.key === 'Enter') {
      handleSearch(searchValue);
    }
  };

  return (
    <div className="custom-search-example" ref={resultsRef}>
      <div className="custom-search-example__input-wrapper">
        <SearchInput
          value={searchValue}
          onChange={(e) => setSearchValue(e.target.value)}
          onKeyPress={handleKeyPress}
          placeholder={placeholder}
          disabled={loading}
          onClear={() => {
            setSearchValue('');
            setResults([]);
            setShowResults(false);
            setError(null);
            if (markerRef.current && mapInstance) {
              mapInstance.removeLayer(markerRef.current);
              markerRef.current = null;
            }
          }}
        />
        <Button
          type="button"
          variant="primary"
          onClick={() => handleSearch(searchValue)}
          disabled={loading || !searchValue.trim()}
          className="custom-search-example__button"
        >
          {loading ? (
            <i className="fas fa-spinner fa-spin" aria-hidden="true" />
          ) : (
            <i className={`fas ${icon}`} aria-hidden="true" />
          )}
          {searchLabel && <span className="custom-search-example__button-label">{searchLabel}</span>}
        </Button>
      </div>
      
      {loading && (
        <div className="custom-search-example__loading">
          Buscando...
        </div>
      )}
      
      {showResults && results.length > 0 && (
        <div className="custom-search-example__results">
          <div className="custom-search-example__results-header">
            {results.length} {results.length === 1 ? resultLabel : resultLabelPlural} encontrado{results.length > 1 ? 's' : ''}
          </div>
          {results.map((result, index) => (
            <div
              key={result.id || index}
              className="custom-search-example__result"
              onClick={() => handleSelectResult(result)}
              role="button"
              tabIndex={0}
              onKeyPress={(e) => {
                if (e.key === 'Enter' || e.key === ' ') {
                  e.preventDefault();
                  handleSelectResult(result);
                }
              }}
            >
              <div className="custom-search-example__result-content">
                <i className="fas fa-map-marker-alt custom-search-example__result-icon" />
                <div className="custom-search-example__result-text">
                  <div className="custom-search-example__result-title">
                    {result.title || result.name || `Ubicación ${index + 1}`}
                  </div>
                  {result.description && (
                    <div className="custom-search-example__result-description">
                      {result.description}
                    </div>
                  )}
                  {result.coordinates && (
                    <div className="custom-search-example__result-coordinates">
                      {result.coordinates}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      
      {showResults && results.length === 0 && !loading && (
        <div className="custom-search-example__no-results">
          No se encontraron resultados
        </div>
      )}
      
      {error && (
        <div className="custom-search-example__error" role="alert">
          {error}
        </div>
      )}
    </div>
  );
};

CustomSearchExample.propTypes = {
  /** Función externa que realiza la búsqueda. Debe retornar una Promise que resuelve con:
   * - Un objeto único: { lat: number, lon: number, title?: string, popupContent?: string, ... }
   * - Un array de objetos: [{ lat: number, lon: number, title?: string, ... }, ...]
   * Si retorna un array, se mostrará una lista para que el usuario seleccione.
   * Si retorna un objeto único, se seleccionará automáticamente.
   */
  onSearch: PropTypes.func.isRequired,
  /** Placeholder del input de búsqueda */
  placeholder: PropTypes.string,
  /** Etiqueta del botón de búsqueda */
  searchLabel: PropTypes.string,
  /** Icono Font Awesome para el botón de búsqueda */
  icon: PropTypes.string,
  /** Etiqueta singular para el contador de resultados */
  resultLabel: PropTypes.string,
  /** Etiqueta plural para el contador de resultados */
  resultLabelPlural: PropTypes.string
};

export default CustomSearchExample;

