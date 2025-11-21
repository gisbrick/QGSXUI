import React, { useContext, useState, useEffect, useMemo, useRef, useCallback } from 'react';
import PropTypes from 'prop-types';
import { QgisConfigContext } from '../QgisConfigContext';
import QgisConfigProvider from '../QgisConfigProvider';
import { fetchFeatures, fetchFeatureById } from '../../../services/qgisWFSFetcher';
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
 * Componente de tabla para mostrar datos de features de QGIS
 * Muestra registros de una capa específica del proyecto QGIS
 */
const Table = ({ layerName, maxRows = 10, tableHeight = 360, onMinimizeDrawer }) => {
  // Obtener configuración QGIS y función de traducción del contexto
  const { config, t, notificationManager, qgsUrl, qgsProjectPath, token } = useContext(QgisConfigContext);
  
  // Obtener mapInstance y startEditingGeometry del contexto del mapa si está disponible
  let mapInstance = null;
  let startEditingGeometry = null;
  if (useMap) {
    try {
      const mapContext = useMap();
      mapInstance = mapContext?.mapInstance || null;
      startEditingGeometry = mapContext?.startEditingGeometry || null;
    } catch (e) {
      // Si no está disponible el contexto del mapa, continuar sin él
      console.warn('No se pudo obtener el contexto del mapa:', e);
    }
  }
  const translate = typeof t === 'function' ? t : (key) => key;
  const tableId = useMemo(() => `table-${layerName}`, [layerName]);
  const persistentState = useMemo(() => getTableState(tableId) || {}, [tableId]);

  // Hooks deben ir siempre al principio, antes de cualquier return condicional
  const [datos, setDatos] = useState([]);
  const [featuresData, setFeaturesData] = useState([]); // Guardar features completas con id
  // Inicializar selectedRows desde el estado persistente
  const [selectedRows, setSelectedRows] = useState(() => {
    const saved = persistentState.selectedRows;
    return saved && Array.isArray(saved) ? new Set(saved) : new Set();
  });
  const selectionLayerRef = useRef(null); // Capa de selección en el mapa
  const selectedFeaturesMapRef = useRef(new Map()); // Mapa de featureId -> layer para poder eliminar específicamente
  const [sortState, setSortState] = useState(persistentState.sortState || { field: null, direction: null });
  const [columnFilters, setColumnFilters] = useState(persistentState.columnFilters || {});
  const [filterPopover, setFilterPopover] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const scrollContainerRef = useRef(null);
  const popoverRef = useRef(null);
  const [scrollRestored, setScrollRestored] = useState(false);
  const savedScrollLeftRef = useRef(0);
  const savedScrollTopRef = useRef(0);
  
  // Obtener la capa del config (si existe)
  const layer = config?.layers?.[layerName];

  // Obtener campos de la capa (usar alias si existe, sino name)
  const columnas = useMemo(() => {
    if (!layer?.fields || !Array.isArray(layer.fields)) {
      return [];
    }
    return layer.fields.map(field => ({
      field: field.name,
      label: field.alias || field.name
    }));
  }, [layer]);
  
  // Hook para redimensionamiento de columnas (debe ir después de columnas)
  const { getColumnWidth, handleMouseDown, resizing } = useColumnResize(tableId, columnas, 50, 150);

  // persistir estado básico
  useEffect(() => {
    setTableState(tableId, {
      sortState,
      columnFilters,
      scrollTop: scrollContainerRef.current ? scrollContainerRef.current.scrollTop : (persistentState.scrollTop || 0),
      selectedRows: Array.from(selectedRows) // Convertir Set a Array para guardar
    });
  }, [tableId, sortState, columnFilters, persistentState.scrollTop, selectedRows]);

  // restaurar scroll al montar
  useEffect(() => {
    if (scrollRestored) {
      return;
    }
    const container = scrollContainerRef.current;
    if (container && typeof persistentState.scrollTop === 'number') {
      container.scrollTop = persistentState.scrollTop;
    }
    setScrollRestored(true);
  }, [scrollRestored, persistentState.scrollTop]);

  // Crear y gestionar la capa de selección en el mapa
  useEffect(() => {
    if (!mapInstance || !window.L) {
      return;
    }

    // Crear la capa gráfica si no existe
    if (!selectionLayerRef.current) {
      selectionLayerRef.current = window.L.featureGroup([]);
      selectionLayerRef.current.addTo(mapInstance);
      // Asegurar que la capa de selección esté en el frente
      if (selectionLayerRef.current.bringToFront) {
        selectionLayerRef.current.bringToFront();
      }
    }

    // NO limpiar la selección cuando se minimiza el drawer
    // Solo se limpiará cuando el componente se desmonte completamente (cuando se cierra la tabla)
    return () => {
      // Solo limpiar cuando el componente se desmonta completamente
      // Esto ocurre cuando se cierra la tabla, no cuando se minimiza el drawer
      if (selectionLayerRef.current) {
        selectionLayerRef.current.clearLayers();
        if (mapInstance && mapInstance.hasLayer(selectionLayerRef.current)) {
          mapInstance.removeLayer(selectionLayerRef.current);
        }
        selectionLayerRef.current = null;
      }
      selectedFeaturesMapRef.current.clear();
    };
  }, [mapInstance]);

  // Función para añadir una feature al mapa como selección
  const addFeatureToMapSelection = async (featureId) => {
    if (!mapInstance || !qgsUrl || !qgsProjectPath || !layerName || !window.L) {
      return;
    }

    try {
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
        if (selectionLayerRef.current) {
          selectionLayerRef.current.addLayer(layer);
          layers.push(layer);
          // Asegurar que cada layer esté en el frente
          if (layer.bringToFront) {
            layer.bringToFront();
          }
        }
      });

      // Asegurar que la capa de selección esté en el frente del mapa
      if (selectionLayerRef.current && selectionLayerRef.current.bringToFront) {
        selectionLayerRef.current.bringToFront();
      }

      // Guardar referencia para poder eliminar después
      selectedFeaturesMapRef.current.set(featureId, layers);
    } catch (error) {
      console.error('[Table] Error al añadir feature al mapa:', error);
    }
  };

  // Función para eliminar una feature del mapa de selección
  const removeFeatureFromMapSelection = (featureId) => {
    if (!selectionLayerRef.current) {
      return;
    }

    const layers = selectedFeaturesMapRef.current.get(featureId);
    if (layers) {
      layers.forEach((layer) => {
        if (selectionLayerRef.current.hasLayer(layer)) {
          selectionLayerRef.current.removeLayer(layer);
        }
      });
      selectedFeaturesMapRef.current.delete(featureId);
    }
  };

  // Restaurar selecciones en el mapa cuando hay selecciones guardadas
  // Esto debe ejecutarse independientemente de si el drawer está abierto o cerrado
  useEffect(() => {
    if (!mapInstance || selectedRows.size === 0 || !qgsUrl || !qgsProjectPath || !layerName) {
      return;
    }

    // Restaurar todas las selecciones guardadas en el mapa
    // Solo añadir las que no estén ya en el mapa
    const restoreSelections = async () => {
      for (const featureId of selectedRows) {
        // Verificar si ya está en el mapa
        if (!selectedFeaturesMapRef.current.has(featureId)) {
          await addFeatureToMapSelection(featureId);
        }
      }
    };

    // Ejecutar inmediatamente si hay selecciones y la capa está creada
    if (selectionLayerRef.current) {
      restoreSelections();
    }
  }, [mapInstance, selectedRows.size, qgsUrl, qgsProjectPath, layerName, token]);

  // escuchar scroll para guardar
  useEffect(() => {
    const container = scrollContainerRef.current;
    if (!container) {
      return undefined;
    }
    const handleScroll = () => {
      setTableState(tableId, { scrollTop: container.scrollTop });
    };
    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      setTableState(tableId, { scrollTop: container.scrollTop });
    };
  }, [tableId]);

  // Restaurar scroll horizontal y vertical después de que los datos se hayan renderizado
  useEffect(() => {
    if ((savedScrollLeftRef.current === 0 && savedScrollTopRef.current === 0) || loading || !scrollContainerRef.current) {
      return;
    }
    
    // Solo restaurar si datos tiene elementos (no está vacío)
    if (datos.length === 0) {
      return;
    }
    
    console.log('[Table] useEffect datos - Intentando restaurar scroll:', { 
      left: savedScrollLeftRef.current, 
      top: savedScrollTopRef.current,
      datosLength: datos.length 
    });
    
    // Usar requestAnimationFrame para asegurar que el DOM se haya actualizado
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          // Restaurar scroll horizontal
          if (savedScrollLeftRef.current > 0) {
            console.log('[Table] Restaurando scrollLeft a:', savedScrollLeftRef.current);
            scrollContainerRef.current.scrollLeft = savedScrollLeftRef.current;
          }
          
          // Restaurar scroll vertical
          if (savedScrollTopRef.current > 0) {
            console.log('[Table] Restaurando scrollTop a:', savedScrollTopRef.current);
            scrollContainerRef.current.scrollTop = savedScrollTopRef.current;
          }
          
          // Resetear los valores guardados después de restaurarlos
          savedScrollLeftRef.current = 0;
          savedScrollTopRef.current = 0;
        } else {
          console.warn('[Table] useEffect datos - scrollContainerRef.current es null');
        }
      });
    });
  }, [datos.length, loading]);

  // Cargar datos desde QGIS Server
  useEffect(() => {
    if (!qgsUrl || !qgsProjectPath || !layerName || !layer) {
      if (layer) {
        setLoading(false);
      }
      return;
    }

    setLoading(true);
    setError(null);

    const sortOptions =
      sortState.field && sortState.direction
        ? { sortBy: sortState.field, sortDirection: sortState.direction.toUpperCase() }
        : undefined;

    const fieldsMap = (layer?.fields || []).reduce((acc, f) => {
      acc[f.name] = f;
      return acc;
    }, {});
    const cqlFilter = buildFilterQuery(columnFilters, fieldsMap);

    fetchFeatures(qgsUrl, qgsProjectPath, layerName, cqlFilter, 0, maxRows, token, sortOptions)
      .then(features => {
        // Extraer las propiedades de cada feature
        const datosExtraidos = features.map(feature => {
          const props = feature.properties || {};
          return props;
        });
        // Guardar features completas con id para la columna de acciones
        setFeaturesData(features);
        setDatos(datosExtraidos);
        setLoading(false);
      })
      .catch(err => {
        console.error('Error al cargar datos de la tabla:', err);
        setError(err.message);
        setLoading(false);
        notificationManager?.addNotification?.({
          title: translate('ui.table.error'),
          text: translate('ui.table.errorLoadingData'),
          level: 'error'
        });
      });
  }, [
    qgsUrl,
    qgsProjectPath,
    layerName,
    maxRows,
    token,
    translate,
    notificationManager,
    layer,
    sortState.field,
    sortState.direction,
    columnFilters
  ]);

  // Verificar que hay configuración disponible (después de los hooks)
  if (!config) {
    return <LoadingQGS />;
  }

  // Verificar que la capa existe
  if (!layer) {
    return <div>{translate('ui.table.error')}: {translate('ui.table.layerNotFound', { layerName })}</div>;
  }

  /**
   * Formatea el valor de una celda según su tipo
   */
  const formatearValor = (valor) => {
    if (valor === null || valor === undefined) {
      return '';
    }
    // No traducir valores, solo mostrarlos tal cual vienen del servidor
    return String(valor);
  };

  const handleFilterClick = useCallback((event, field) => {
    event.stopPropagation();
    
    // Obtener la posición del botón relativa al contenedor de la tabla
    const buttonRect = event.currentTarget.getBoundingClientRect();
    const tableContainer = scrollContainerRef.current?.closest('.table') || event.currentTarget.closest('.table');
    
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
  }, []);

  useEffect(() => {
    if (!filterPopover) {
      return undefined;
    }
    const handleClickOutside = (event) => {
      if (popoverRef.current && !popoverRef.current.contains(event.target)) {
        setFilterPopover(null);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [filterPopover]);

  const handleApplyFilter = (fieldName, filter) => {
    setDatos([]);
    setError(null);
    setColumnFilters((prev) => {
      const next = { ...prev, [fieldName]: filter };
      setTableState(tableId, { columnFilters: next });
      return next;
    });
  };

  const handleClearFilter = (fieldName) => {
    setDatos([]);
    setError(null);
    setColumnFilters((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      setTableState(tableId, { columnFilters: next });
      return next;
    });
  };

  const handleClearAllFilters = () => {
    if (Object.keys(columnFilters).length === 0) {
      return;
    }
    setDatos([]);
    setError(null);
    setColumnFilters({});
    setTableState(tableId, { columnFilters: {} });
    setFilterPopover(null);
  };

  const isFilterActive = (fieldName) => !!columnFilters[fieldName];

  const handleSort = (field) => {
    // Guardar posición del scroll horizontal antes de ordenar
    if (scrollContainerRef.current) {
      savedScrollLeftRef.current = scrollContainerRef.current.scrollLeft;
      console.log('[Table] handleSort - Scroll horizontal guardado:', savedScrollLeftRef.current);
      console.log('[Table] handleSort - Contenedor existe:', !!scrollContainerRef.current);
      console.log('[Table] handleSort - scrollLeft actual:', scrollContainerRef.current.scrollLeft);
    } else {
      console.warn('[Table] handleSort - scrollContainerRef.current es null');
    }
    
    setDatos([]);
    setError(null);
    setLoading(true);
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

  if (loading) {
    return <LoadingQGS />;
  }

  if (error) {
    return <div>{translate('ui.table.error')}: {error}</div>;
  }

  const renderFilterPopover = () => {
    if (!filterPopover?.field || !filterPopover?.position) {
      return null;
    }
    return (
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
          currentFilter={columnFilters[filterPopover.field.field]}
          onApply={(filter) => handleApplyFilter(filterPopover.field.field, filter)}
          onClear={() => handleClearFilter(filterPopover.field.field)}
          onClose={() => setFilterPopover(null)}
          translate={translate}
          qgsUrl={qgsUrl}
          qgsProjectPath={qgsProjectPath}
          token={token}
        />
      </div>
    );
  };

  return (
    <div className="table">
      {columnas.length === 0 ? (
        <div>{translate('ui.table.noData')}</div>
      ) : (
        <>
          <div
            ref={scrollContainerRef}
            className="table__scroll-container"
            style={{ maxHeight: tableHeight, overflowY: 'auto', overflowX: 'auto' }}
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
                  {columnas.map((columna, colIndex) => {
                    // Ajustar índice para tener en cuenta la columna de acciones (índice 0)
                    const adjustedIndex = colIndex + 1;
                    const colWidth = getColumnWidth(adjustedIndex, columna.field, columna.label);
                    return (
                      <th
                        key={columna.field}
                        className={`table__sortable table__header-cell${isFilterActive(columna.field) ? ' table__sortable--filtered' : ''}`}
                        style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth }}
                        onClick={() => handleSort(columna.field)}
                        role="button"
                        tabIndex={0}
                        onKeyDown={(e) => {
                          if (e.key === 'Enter' || e.key === ' ') {
                            e.preventDefault();
                            handleSort(columna.field);
                          }
                        }}
                        aria-sort={
                          sortState.field === columna.field
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
                              className={`table__filter-button${isFilterActive(columna.field) ? ' active' : ''}`}
                              onClick={(e) => handleFilterClick(e, columna)}
                              aria-label={translate('ui.table.filter.open')}
                            >
                              <i className="fas fa-filter" aria-hidden="true" />
                            </button>
                            <span>{columna.label}</span>
                          </span>
                          {renderSortIcon(columna.field)}
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
                {datos.length === 0 ? (
                  <tr>
                    <td colSpan={columnas.length + 1} className="table__empty-cell">
                      {translate('ui.table.noData')}
                    </td>
                  </tr>
                ) : (
                  datos.map((fila, index) => {
                    const feature = featuresData[index];
                    const featureId = feature?.id || feature?.properties?.id || index;
                    return (
                      <tr key={`${layerName}-${featureId}-${index}`}>
                        <td 
                          className="table__actions-cell" 
                          style={{ 
                            width: `${calculateActionsColumnWidth(layer, null, null)}px`, 
                            minWidth: `${calculateActionsColumnWidth(layer, null, null)}px`, 
                            maxWidth: `${calculateActionsColumnWidth(layer, null, null)}px` 
                          }}
                        >
                          <TableActionsColumn
                            feature={fila}
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
                              console.log('[Table] onAction recibido:', actionPayload);
                              // Refrescar datos después de acciones que modifican features
                              if (actionPayload.action === 'update' || actionPayload.action === 'delete') {
                                console.log('[Table] Recargando datos después de', actionPayload.action);
                                
                                // Guardar posición de scroll antes de recargar
                                if (scrollContainerRef.current) {
                                  savedScrollLeftRef.current = scrollContainerRef.current.scrollLeft;
                                  savedScrollTopRef.current = scrollContainerRef.current.scrollTop;
                                  console.log('[Table] Scroll guardado:', { 
                                    left: savedScrollLeftRef.current, 
                                    top: savedScrollTopRef.current 
                                  });
                                }
                                
                                setLoading(true);
                                setError(null);
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
                                  const features = await fetchFeatures(qgsUrl, qgsProjectPath, layerName, cqlFilter, 0, maxRows, token, sortOptions);
                                  const datosExtraidos = features.map(f => {
                                    const props = f.properties || {};
                                    return props;
                                  });
                                  setFeaturesData(features);
                                  setDatos(datosExtraidos);
                                } catch (err) {
                                  console.error('[Table] Error al recargar datos:', err);
                                  setError(err.message);
                                  notificationManager?.addNotification?.({
                                    title: translate('ui.table.error'),
                                    text: err.message || translate('ui.table.errorLoadingData'),
                                    level: 'error'
                                  });
                                } finally {
                                  setLoading(false);
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
                        {columnas.map((columna, colIndex) => {
                          // Ajustar índice para tener en cuenta la columna de acciones (índice 0)
                          const adjustedIndex = colIndex + 1;
                          const colWidth = getColumnWidth(adjustedIndex, columna.field, columna.label);
                          return (
                            <td key={columna.field} style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth }}>
                              {formatearValor(fila[columna.field])}
                            </td>
                          );
                        })}
                      </tr>
                    );
                  })
                )}
              </tbody>
            </table>
          </div>
          <div className="table__footer table__footer--compact">
            <div className="table__summary">
              {translate('ui.table.totalRecords', { count: datos.length })}
            </div>
            {Object.keys(columnFilters).length > 0 && (
              <button type="button" className="table__clear-filters" onClick={handleClearAllFilters}>
                {translate('ui.table.filter.clearAll')}
              </button>
            )}
          </div>
          {renderFilterPopover()}
        </>
      )}
    </div>
  );
};

Table.propTypes = {
  layerName: PropTypes.string.isRequired,
  maxRows: PropTypes.number,
  tableHeight: PropTypes.number
};

export { QgisConfigProvider };
export default Table;