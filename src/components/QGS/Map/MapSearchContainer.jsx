import React, { useState, useRef, useEffect, useMemo } from 'react';
import PropTypes from 'prop-types';
import { AddressSearch, CadastralRuralSearch, CadastralReferenceSearch } from './MapTools';
import './MapSearchContainer.css';

/**
 * Contenedor para componentes de búsqueda del mapa
 * Se posiciona en la parte superior derecha del mapa
 * Agrupa los buscadores en un desplegable si hay más de uno
 */
const MapSearchContainer = ({ children, customSearchers = [], toolsConfig = null }) => {
  const [isExpanded, setIsExpanded] = useState(false);
  const dropdownRef = useRef(null);

  // Lista de buscadores disponibles
  const searchComponents = useMemo(() => {
    const components = [];
    const searchersConfig = toolsConfig?.searchers || {};
    
    // Añadir buscadores personalizados si se proporcionan
    if (Array.isArray(customSearchers) && customSearchers.length > 0) {
      customSearchers.forEach((searcher, index) => {
        if (searcher && (searcher.component || searcher.render)) {
          const searcherId = searcher.id || `custom-${index}`;
          // Verificar si el buscador personalizado está habilitado (por defecto true si no está en la config)
          const isEnabled = searchersConfig[searcherId] !== false;
          if (isEnabled) {
            const component = searcher.component || (typeof searcher.render === 'function' ? searcher.render() : null);
            if (component) {
              components.push({ 
                id: searcherId, 
                component: React.cloneElement(component, { key: searcherId })
              });
            }
          }
        }
      });
    }
    
    // Añadir buscadores por defecto si no se proporcionan personalizados o si se permite
    // Verificar la configuración para cada buscador por defecto
    if (customSearchers.length === 0) {
      if (searchersConfig.address !== false) {
        components.push({ id: 'address', component: <AddressSearch key="address" /> });
      }
      if (searchersConfig.rural !== false) {
        components.push({ id: 'rural', component: <CadastralRuralSearch key="rural" /> });
      }
      if (searchersConfig.reference !== false) {
        components.push({ id: 'reference', component: <CadastralReferenceSearch key="reference" /> });
      }
    }
    
    return components;
  }, [customSearchers, toolsConfig]);

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
    <div className={`map-search-container ${hasMultipleSearchers && !isExpanded ? 'map-search-container--collapsed' : ''}`}>
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
  children: PropTypes.node,
  /** Array de buscadores personalizados. Cada buscador debe tener:
   * - id: string (opcional, se genera automáticamente si no se proporciona)
   * - component: ReactNode (componente React a renderizar)
   * - render: function (función que retorna un componente React, alternativa a component)
   */
  customSearchers: PropTypes.arrayOf(
    PropTypes.shape({
      id: PropTypes.string,
      component: PropTypes.node,
      render: PropTypes.func
    })
  ),
  /** Configuración de herramientas y buscadores visibles */
  toolsConfig: PropTypes.shape({
    toolbar: PropTypes.objectOf(PropTypes.bool),
    searchers: PropTypes.objectOf(PropTypes.bool)
  })
};

export default MapSearchContainer;

