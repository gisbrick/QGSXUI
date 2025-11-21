import React, { useState, useCallback, useMemo, useRef, useEffect, useContext } from 'react';
import PropTypes from 'prop-types';
import { createPortal } from 'react-dom';
import { Button } from '../../../UI';
import { Tabs } from '../../../UI';
import Drawer from '../../../UI/Drawer/Drawer';
import TableInfiniteScroll from '../../Table/TableInfiniteScroll';
import { useMap } from '../MapProvider';
import { clearTableState } from '../../Table/tableStateStore';
import './OpenTablesManager.css';

/**
 * Componente que gestiona las tablas abiertas desde la tabla de contenidos
 * Muestra un botón en la parte inferior izquierda y un drawer con tabs
 */
const OpenTablesManager = ({ onShowTable }) => {
  const [openTables, setOpenTables] = useState([]); // Array de { layerName, id }
  const [activeTabIndex, setActiveTabIndex] = useState(0);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);
  
  // Obtener función para actualizar filtros del mapa y funciones de edición
  const mapContext = useMap();
  const { updateLayerFilter, mapInstance, startEditingGeometry } = mapContext || {};
  
  // Usar ref para mantener referencia estable a la función
  const handleShowTableRef = useRef(null);

  // Generar ID único para cada tabla
  const generateTableId = useCallback((layerName) => {
    return `table_${layerName}_${Date.now()}`;
  }, []);

  // Manejar apertura de tabla
  const handleShowTable = useCallback((layerName) => {
    // Validar que layerName no sea null o undefined
    if (!layerName) {
      console.warn('[OpenTablesManager] handleShowTable: layerName is null or undefined');
      return;
    }

    // Usar el estado actual de openTables mediante función de actualización
    setOpenTables(currentTables => {
      // Verificar si la tabla ya está abierta
      const existingIndex = currentTables.findIndex(t => t && t.layerName === layerName);
      
      if (existingIndex >= 0) {
        // Si ya está abierta, mostrar el drawer y seleccionar su tab
        setActiveTabIndex(existingIndex);
        setIsDrawerOpen(true);
        return currentTables; // No cambiar el estado
      } else {
        // Si no está abierta, añadirla
        const newTable = {
          id: generateTableId(layerName),
          layerName
        };
        const newTables = [...currentTables, newTable];
        setActiveTabIndex(newTables.length - 1);
        setIsDrawerOpen(true);
        return newTables;
      }
    });
  }, [generateTableId]);

  // Mantener referencia actualizada
  handleShowTableRef.current = handleShowTable;

  // Exponer la función al componente padre mediante callback
  // Usar un wrapper estable que siempre apunta a la función actual
  useEffect(() => {
    if (onShowTable) {
      // Crear una función wrapper estable que siempre use la referencia actual
      const stableHandler = (layerName) => {
        if (handleShowTableRef.current) {
          handleShowTableRef.current(layerName);
        }
      };
      onShowTable(stableHandler);
    }
  }, [onShowTable]); // Solo dependemos de onShowTable, no de handleShowTable

  // Manejar cierre de tab
  const handleCloseTab = useCallback((e, index) => {
    e.stopPropagation();
    
    // Obtener el layerName de la tab que se va a cerrar
    const tableToClose = openTables[index];
    const layerNameToClose = tableToClose?.layerName;
    
    const newTables = openTables.filter((_, i) => i !== index);
    setOpenTables(newTables);
    
    // Limpiar el estado de la tabla (filtros, etc.) cuando se cierra la pestaña
    if (layerNameToClose) {
      const tableId = `table-infinite-${layerNameToClose}`;
      clearTableState(tableId);
      
      // Limpiar la capa de selección del mapa cuando se cierra la tabla
      if (typeof window !== 'undefined' && window.__tableCleanupFunctions) {
        const cleanupFunction = window.__tableCleanupFunctions.get(tableId);
        if (cleanupFunction && typeof cleanupFunction === 'function') {
          console.log('[OpenTablesManager] Limpiando capa de selección para tabla cerrada:', tableId);
          cleanupFunction();
        }
      }
      
      // También limpiar desde el almacenamiento global de capas si existe
      if (typeof window !== 'undefined' && window.__tableSelectionLayers) {
        const selectionLayer = window.__tableSelectionLayers.get(tableId);
        if (selectionLayer && mapInstance) {
          selectionLayer.clearLayers();
          if (mapInstance.hasLayer(selectionLayer)) {
            mapInstance.removeLayer(selectionLayer);
          }
          window.__tableSelectionLayers.delete(tableId);
          console.log('[OpenTablesManager] Capa de selección eliminada del almacenamiento global:', tableId);
        }
      }
      
      // Restaurar el filtro base de la capa cuando se cierra la tab
      if (updateLayerFilter) {
        updateLayerFilter(layerNameToClose, '');
      }
    }
    
    // Ajustar el índice activo si es necesario
    if (newTables.length === 0) {
      setIsDrawerOpen(false);
      setActiveTabIndex(0);
    } else {
      // Si se cierra la tab activa, seleccionar la última tab disponible
      if (activeTabIndex === index) {
        // Si era la última tab, seleccionar la nueva última
        setActiveTabIndex(newTables.length - 1);
      } else if (activeTabIndex > index) {
        // Si la tab cerrada estaba antes de la activa, ajustar el índice
        setActiveTabIndex(activeTabIndex - 1);
      }
      // Si la tab cerrada estaba después de la activa, no cambiar el índice
    }
  }, [openTables, activeTabIndex, updateLayerFilter, mapInstance]);

  // Manejar cambio de tab
  const handleTabChange = useCallback((index) => {
    setActiveTabIndex(index);
  }, []);

  // Construir tabs para el TabView
  const tabs = useMemo(() => {
    return openTables
      .filter(table => table && table.layerName && typeof table.layerName === 'string') // Filtrar tablas sin layerName válido
      .map((table) => {
        // Encontrar el índice real en openTables
        const actualIndex = openTables.findIndex(t => t && t.id === table.id);
        const displayName = table.layerName.replace(/_/g, ' ');
        
        return {
          label: (
            <div className="open-tables-manager__tab-label">
              <span className="open-tables-manager__tab-name">
                {displayName}
              </span>
              <span
                className="open-tables-manager__tab-close"
                onClick={(e) => {
                  e.stopPropagation();
                  handleCloseTab(e, actualIndex);
                }}
                role="button"
                tabIndex={0}
                aria-label="Cerrar tabla"
                title="Cerrar tabla"
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault();
                    e.stopPropagation();
                    handleCloseTab(e, actualIndex);
                  }
                }}
              >
                <i className="fas fa-times" aria-hidden="true" />
              </span>
            </div>
          ),
          content: (
            <div className="open-tables-manager__table-container">
              <TableInfiniteScroll 
                key={table.id} // Usar key estable para mantener el estado del componente
                layerName={table.layerName}
                height="100%"
                onFilterChange={updateLayerFilter}
                onMinimizeDrawer={() => setIsDrawerOpen(false)}
                mapInstance={mapInstance}
                startEditingGeometry={startEditingGeometry}
                isVisible={isDrawerOpen && activeTabIndex === actualIndex}
              />
            </div>
          )
        };
      });
  }, [openTables, handleCloseTab, updateLayerFilter, mapInstance, startEditingGeometry]);

  // Si no hay tablas abiertas, no mostrar nada
  if (openTables.length === 0) {
    return null;
  }

  return (
    <>
      {/* Botón "Tablas abiertas" en la parte inferior izquierda */}
      {createPortal(
        <div className={`open-tables-manager__button-container ${isDrawerOpen ? 'drawer-open' : ''}`}>
          <Button
            type="button"
            variant="primary"
            onClick={() => setIsDrawerOpen(!isDrawerOpen)}
            className="open-tables-manager__toggle-button"
            title="Tablas abiertas"
            aria-label="Tablas abiertas"
          >
            <i className="fas fa-table" aria-hidden="true" />
            <span className="open-tables-manager__button-text">
              Tablas abiertas ({openTables.length})
            </span>
          </Button>
        </div>,
        document.body
      )}

      {/* Drawer con tabs - renderizado fuera del mapa en document.body */}
      {createPortal(
        <Drawer
          isOpen={isDrawerOpen}
          onClose={() => setIsDrawerOpen(false)}
          position="bottom"
          width="80vh"
          title={null}
          showCloseButton={false}
          allowBackdropInteraction={false}
          showOverlay={true}
        >
          <div className="open-tables-manager__drawer-content">
          {tabs.length > 0 && (
            <Tabs
              key={`tabs-${openTables.length}-${activeTabIndex}`} // Forzar re-render cuando cambien las tabs o el índice activo
              tabs={tabs}
              defaultActive={activeTabIndex}
              onTabChange={handleTabChange}
            />
          )}
          </div>
        </Drawer>,
        document.body
      )}
    </>
  );
};

OpenTablesManager.propTypes = {
  onShowTable: PropTypes.func, // Callback para exponer handleShowTable al padre
};

export default OpenTablesManager;

