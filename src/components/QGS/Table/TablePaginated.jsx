import React, { useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { QgisConfigContext } from '../QgisConfigContext';
import { fetchFeatureCount, fetchFeatures, fetchFeatureById } from '../../../services/qgisWFSFetcher';
import { LoadingQGS } from '../../UI_QGS';
import { Pagination } from '../../UI';
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
 * Tabla paginada que carga los datos de forma perezosa (lazy) por página.
 */
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const TablePaginated = ({ layerName, defaultPageSize = 10, tableHeight = 360, onMinimizeDrawer }) => {
  const { config, t, notificationManager, qgsUrl, qgsProjectPath, token, language } =
    useContext(QgisConfigContext);
  
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
  const tableId = useMemo(() => `table-paginated-${layerName}`, [layerName]);
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

  const [page, setPage] = useState(persistentState.page ?? 0);
  const [rows, setRows] = useState([]);
  const [featuresData, setFeaturesData] = useState([]); // Guardar features completas con id
  // Inicializar selectedRows desde el estado persistente
  const [selectedRows, setSelectedRows] = useState(() => {
    const saved = persistentState.selectedRows;
    return saved && Array.isArray(saved) ? new Set(saved) : new Set();
  });
  const selectionLayerRef = useRef(null); // Capa de selección en el mapa
  const selectedFeaturesMapRef = useRef(new Map()); // Mapa de featureId -> layer para poder eliminar específicamente
  const [pageSize, setPageSize] = useState(
    persistentState.pageSize ?? (PAGE_SIZE_OPTIONS.includes(defaultPageSize) ? defaultPageSize : PAGE_SIZE_OPTIONS[0])
  );
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [totalFeatures, setTotalFeatures] = useState(null);
  const [hasMorePages, setHasMorePages] = useState(true);
  const [sortState, setSortState] = useState(persistentState.sortState || { field: null, direction: null });
  const [columnFilters, setColumnFilters] = useState(persistentState.columnFilters || {});
  const [filterPopover, setFilterPopover] = useState(null);
  const popoverRef = useRef(null);
  const scrollContainerRef = useRef(null);
  const savedScrollLeftRef = useRef(0);
  const savedScrollTopRef = useRef(0);
  
  // Hook para redimensionamiento de columnas (columns ya está definido arriba)
  const { getColumnWidth, handleMouseDown, resizing } = useColumnResize(tableId, columns, 50, 150);

  // Restaurar scroll horizontal y vertical después de que los datos se hayan renderizado
  useEffect(() => {
    if ((savedScrollLeftRef.current === 0 && savedScrollTopRef.current === 0) || loading || !scrollContainerRef.current) {
      return;
    }
    
    // Solo restaurar si rows tiene elementos (no está vacío)
    if (rows.length === 0) {
      return;
    }
    
    console.log('[TablePaginated] useEffect rows - Intentando restaurar scroll:', { 
      left: savedScrollLeftRef.current, 
      top: savedScrollTopRef.current 
    });
    
    // Usar requestAnimationFrame para asegurar que el DOM se haya actualizado
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          // Restaurar scroll horizontal
          if (savedScrollLeftRef.current > 0) {
            console.log('[TablePaginated] Restaurando scrollLeft a:', savedScrollLeftRef.current);
            scrollContainerRef.current.scrollLeft = savedScrollLeftRef.current;
          }
          
          // Restaurar scroll vertical
          if (savedScrollTopRef.current > 0) {
            console.log('[TablePaginated] Restaurando scrollTop a:', savedScrollTopRef.current);
            scrollContainerRef.current.scrollTop = savedScrollTopRef.current;
          }
          
          // Resetear los valores guardados después de restaurarlos
          savedScrollLeftRef.current = 0;
          savedScrollTopRef.current = 0;
        } else {
          console.warn('[TablePaginated] useEffect rows - scrollContainerRef.current es null');
        }
      });
    });
  }, [rows.length, loading]);

  // Persistir estado
  useEffect(() => {
    setTableState(tableId, {
      page,
      pageSize,
      sortState,
      columnFilters,
      selectedRows: Array.from(selectedRows) // Convertir Set a Array para guardar
    });
  }, [tableId, page, pageSize, sortState, columnFilters, selectedRows]);

  useEffect(() => {
    setPage(0);
    setRows([]);
    setHasMorePages(true);
    setError(null);
    const nextPageSize = PAGE_SIZE_OPTIONS.includes(defaultPageSize)
      ? defaultPageSize
      : PAGE_SIZE_OPTIONS[0];
    setPageSize(nextPageSize);
    setSortState({ field: null, direction: null });
    setColumnFilters({});
  }, [layerName, defaultPageSize]);

  useEffect(() => {
    if (!layer || !qgsUrl || !qgsProjectPath) {
      return;
    }
    let cancelled = false;
    const fieldsMap = (layer?.fields || []).reduce((acc, f) => {
      acc[f.name] = f;
      return acc;
    }, {});
    const cqlFilter = buildFilterQuery(columnFilters, fieldsMap);
    fetchFeatureCount(qgsUrl, qgsProjectPath, layerName, cqlFilter, token)
      .then((count) => {
        if (!cancelled) {
          setTotalFeatures(count);
        }
      })
      .catch((err) => {
        console.warn('[TablePaginated] No se pudo obtener el total de registros:', err);
        if (!cancelled) {
          setTotalFeatures(null);
        }
      });
    return () => {
      cancelled = true;
    };
  }, [layer, layerName, qgsUrl, qgsProjectPath, token, columnFilters]);

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
      console.error('[TablePaginated] Error al añadir feature al mapa:', error);
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

  const loadPage = useCallback(() => {
    if (!layer || !qgsUrl || !qgsProjectPath) {
      return;
    }
    const startIndex = page * pageSize;
    setLoading(true);
    setError(null);

    let cancelled = false;

    const sortOptions =
      sortState.field && sortState.direction
        ? { sortBy: sortState.field, sortDirection: sortState.direction.toUpperCase() }
        : undefined;

    const fieldsMap = (layer?.fields || []).reduce((acc, f) => {
      acc[f.name] = f;
      return acc;
    }, {});
    const cqlFilter = buildFilterQuery(columnFilters, fieldsMap);

        fetchFeatures(qgsUrl, qgsProjectPath, layerName, cqlFilter, startIndex, pageSize, token, sortOptions)
          .then((features) => {
            if (cancelled) {
              return;
            }
            const datosExtraidos = features.map((feature) => feature.properties || {});
            // Guardar features completas con id para la columna de acciones
            setFeaturesData(features);
            setRows(datosExtraidos);
            setHasMorePages(features.length === pageSize);
          })
      .catch((err) => {
        console.error('[TablePaginated] Error al cargar datos:', err);
        if (cancelled) {
          return;
        }
        setError(err.message);
        setHasMorePages(false);
        notificationManager?.addNotification?.({
          title: translate('ui.table.error'),
          text: translate('ui.table.errorLoadingData'),
          level: 'error'
        });
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [
    layer,
    layerName,
    page,
    pageSize,
    qgsUrl,
    qgsProjectPath,
    token,
    translate,
    notificationManager,
    sortState.field,
    sortState.direction,
    columnFilters
  ]);

  useEffect(() => {
    const cancel = loadPage();
    return () => {
      if (typeof cancel === 'function') {
        cancel();
      }
    };
  }, [loadPage]);

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

  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  };

  const handleSort = (field) => {
    // Guardar posición del scroll horizontal antes de ordenar
    if (scrollContainerRef.current) {
      savedScrollLeftRef.current = scrollContainerRef.current.scrollLeft;
      console.log('[TablePaginated] handleSort - Scroll horizontal guardado:', savedScrollLeftRef.current);
      console.log('[TablePaginated] handleSort - Contenedor existe:', !!scrollContainerRef.current);
      console.log('[TablePaginated] handleSort - scrollLeft actual:', scrollContainerRef.current.scrollLeft);
    } else {
      console.warn('[TablePaginated] handleSort - scrollContainerRef.current es null');
    }
    
    setPage(0);
    setRows([]);
    setHasMorePages(true);
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
    setColumnFilters((prev) => ({
      ...prev,
      [fieldName]: filter
    }));
    setPage(0);
  };

  const handleClearFilter = (fieldName) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
    setPage(0);
  };

  const handleClearAllFilters = () => {
    setColumnFilters({});
    setPage(0);
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

  const canGoPrevious = page > 0;
  const canGoNext = hasMorePages || (totalFeatures !== null && (page + 1) * pageSize < totalFeatures);
  
  // Calcular total de páginas para el componente Pagination
  const totalPages = totalFeatures !== null ? Math.ceil(totalFeatures / pageSize) : null;
  
  // Handler para cambio de página (Pagination usa 1-based, nosotros usamos 0-based)
  const handlePageChange = useCallback((newPage) => {
    // newPage viene en formato 1-based, convertir a 0-based
    setPage(newPage - 1);
  }, []);
  
  const handlePageSizeChange = (event) => {
    const nextSize = Number(event.target.value);
    if (!PAGE_SIZE_OPTIONS.includes(nextSize)) {
      return;
    }
    setPage(0);
    setRows([]);
    setHasMorePages(true);
    setPageSize(nextSize);
  };

  if (loading && rows.length === 0) {
    return <LoadingQGS />;
  }

  if (error && rows.length === 0) {
    return (
      <div className="table">
        <div>{translate('ui.table.error')}: {error}</div>
      </div>
    );
  }

  return (
    <div className="table">
      {columns.length === 0 ? (
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
                      {translate('ui.table.noData')}
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
                      featureId = feature?.properties?.id || feature?.properties?.fid || `${page}-${index}`;
                    }
                    return (
                      <tr key={`${page}-${featureId}-${index}`}>
                        <td 
                          className="table__actions-cell" 
                          style={{ 
                            width: `${calculateActionsColumnWidth(layer, null, null)}px`, 
                            minWidth: `${calculateActionsColumnWidth(layer, null, null)}px`, 
                            maxWidth: `${calculateActionsColumnWidth(layer, null, null)}px` 
                          }}
                        >
                          <TableActionsColumn
                            feature={row}
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
                              console.log('[TablePaginated] onAction recibido:', actionPayload);
                              // Refrescar datos después de acciones que modifican features
                              if (actionPayload.action === 'update' || actionPayload.action === 'delete') {
                                console.log('[TablePaginated] Recargando datos después de', actionPayload.action);
                                
                                // Guardar posición de scroll antes de recargar
                                if (scrollContainerRef.current) {
                                  savedScrollLeftRef.current = scrollContainerRef.current.scrollLeft;
                                  savedScrollTopRef.current = scrollContainerRef.current.scrollTop;
                                  console.log('[TablePaginated] Scroll guardado:', { 
                                    left: savedScrollLeftRef.current, 
                                    top: savedScrollTopRef.current 
                                  });
                                }
                                
                                // Si se borró una feature, volver a la primera página si estamos en una página que ya no tiene datos
                                // Por ahora, simplemente recargar la página actual
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
                                  const startIndex = page * pageSize;
                                  const features = await fetchFeatures(qgsUrl, qgsProjectPath, layerName, cqlFilter, startIndex, pageSize, token, sortOptions);
                                  const datosExtraidos = features.map(f => {
                                    const props = f.properties || {};
                                    return props;
                                  });
                                  setFeaturesData(features);
                                  setRows(datosExtraidos);
                                  setHasMorePages(features.length === pageSize);
                                  
                                  // Si la página actual está vacía y no es la primera, volver a la primera página
                                  if (features.length === 0 && page > 0) {
                                    console.log('[TablePaginated] Página vacía, volviendo a la primera página');
                                    setPage(0);
                                  }
                                } catch (err) {
                                  console.error('[TablePaginated] Error al recargar datos:', err);
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
          </div>

          <div className="table__footer">
            {totalPages !== null && totalPages > 0 && (
              <Pagination
                currentPage={page + 1} // Convertir de 0-based a 1-based
                totalPages={totalPages}
                onPageChange={handlePageChange}
                showFirstLast={true}
                showNumbers={true}
                maxVisiblePages={5}
                size="medium"
                lang={language || 'en'}
              />
            )}
            <div className="table__page-size">
              <label>
                {translate('ui.table.rowsPerPage')}
                <select
                  value={pageSize}
                  onChange={handlePageSizeChange}
                  disabled={loading}
                >
                  {PAGE_SIZE_OPTIONS.map((option) => (
                    <option key={option} value={option}>
                      {option}
                    </option>
                  ))}
                </select>
              </label>
            </div>
            <div className="table__hint">
              {loading
                ? translate('ui.table.loadingPage')
                : translate('ui.table.pageSizeSummary', { pageSize })}
            </div>
          </div>
          <div className="table__summary">
            {translate('ui.table.totalRecords', {
              count: totalFeatures ?? rows.length
            })}
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

TablePaginated.propTypes = {
  layerName: PropTypes.string.isRequired,
  defaultPageSize: PropTypes.number,
  tableHeight: PropTypes.number
};

export default TablePaginated;

