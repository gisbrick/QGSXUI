import React, { useState, useRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { AddressSearch, CadastralRuralSearch, CadastralReferenceSearch } from './MapTools';
import './MapSearchContainer.css';

/**
 * Contenedor para componentes de búsqueda del mapa
 * Se posiciona en la parte superior derecha del mapa
 * Agrupa los buscadores en un desplegable si hay más de uno
 */
const MapSearchContainer = ({ children }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef(null);

  // Lista de buscadores disponibles
  const searchComponents = useMemo(() => {
    const components = [];
    // TODO: En el futuro, estos se habilitarán/deshabilitarán por configuración
    components.push({ id: 'address', component: <AddressSearch key="address" /> });
    components.push({ id: 'rural', component: <CadastralRuralSearch key="rural" /> });
    components.push({ id: 'reference', component: <CadastralReferenceSearch key="reference" /> });
    return components;
  }, []);

  const hasMultipleSearchers = searchComponents.length > 1;

  // Cerrar el desplegable cuando se hace clic fuera
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsExpanded(false);
      }
    };

    if (isExpanded) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isExpanded]);

  const toggleDropdown = () => {
    setIsExpanded(!isExpanded);
  };

  return (
    <div className="map-search-container">
      {hasMultipleSearchers ? (
        <div className="map-search-dropdown" ref={dropdownRef}>
          <button
            type="button"
            className={`map-search-dropdown__toggle ${isExpanded ? 'map-search-dropdown__toggle--expanded' : ''}`}
            onClick={toggleDropdown}
            aria-label={isExpanded ? 'Cerrar buscadores' : 'Abrir buscadores'}
            aria-expanded={isExpanded}
          >
            <i className="fas fa-search map-search-dropdown__icon" />
          </button>
          <div className={`map-search-dropdown__content ${isExpanded ? 'map-search-dropdown__content--expanded' : ''}`}>
            {searchComponents.map(({ component }) => component)}
            {children}
          </div>
        </div>
      ) : (
        <div className="map-search-container__content">
          {searchComponents.map(({ component }) => component)}
          {children}
        </div>
      )}
    </div>
  );
};

MapSearchContainer.propTypes = {
  /** Componentes de búsqueda a renderizar dentro del contenedor */
  children: PropTypes.node
};

export default MapSearchContainer;

