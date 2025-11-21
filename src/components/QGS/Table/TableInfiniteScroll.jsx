import React, {
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState
} from 'react';
import PropTypes from 'prop-types';
import { QgisConfigContext } from '../QgisConfigContext';
import { fetchFeatureCount, fetchFeatures } from '../../../services/qgisWFSFetcher';
import { LoadingQGS } from '../../UI_QGS';
import './Table.css';
import ColumnFilterPopover from './filters/ColumnFilterPopover';
import { buildFilterQuery } from './filters/filterUtils';
import { getTableState, setTableState } from './tableStateStore';
import { useColumnResize } from './hooks/useColumnResize';

/**
 * Tabla con scroll infinito que carga los datos de forma lazy según se avanza.
 */
const TableInfiniteScroll = ({ layerName, chunkSize = 50, height = 360 }) => {
  const { config, t, notificationManager, qgsUrl, qgsProjectPath, token } =
    useContext(QgisConfigContext);
  const translate = typeof t === 'function' ? t : (key) => key;
  const tableId = useMemo(() => `table-infinite-${layerName}`, [layerName]);
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

  const [rows, setRows] = useState([]);
  const [hasMore, setHasMore] = useState(true);
  const [totalCount, setTotalCount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [initialLoaded, setInitialLoaded] = useState(false);
  const offsetRef = useRef(persistentState.offset ?? 0);
  const containerRef = useRef(null);
  const [sortState, setSortState] = useState(persistentState.sortState || { field: null, direction: null });
  const [columnFilters, setColumnFilters] = useState(persistentState.columnFilters || {});
  const [filterPopover, setFilterPopover] = useState(null);
  const popoverRef = useRef(null);
  const [scrollRestored, setScrollRestored] = useState(false);
  const savedScrollLeftRef = useRef(0);
  
  // Hook para redimensionamiento de columnas
  const { getColumnWidth, handleMouseDown, resizing } = useColumnResize(tableId, columns, 50, 150);

  // Persistir estado
  useEffect(() => {
    setTableState(tableId, {
      offset: offsetRef.current,
      scrollTop: containerRef.current ? containerRef.current.scrollTop : (persistentState.scrollTop || 0),
      sortState,
      columnFilters
    });
  }, [tableId, sortState, columnFilters, persistentState.scrollTop]);

  // Restaurar scroll al montar
  useEffect(() => {
    if (scrollRestored || !containerRef.current) return;
    const savedTop = persistentState.scrollTop;
    if (typeof savedTop === 'number') {
      containerRef.current.scrollTop = savedTop;
    }
    setScrollRestored(true);
  }, [scrollRestored, persistentState.scrollTop]);

  // Guardar scroll al desplazarse
  useEffect(() => {
    const container = containerRef.current;
    if (!container) return undefined;
    const handleScroll = () => {
      setTableState(tableId, { scrollTop: container.scrollTop });
    };
    container.addEventListener('scroll', handleScroll);
    return () => {
      container.removeEventListener('scroll', handleScroll);
      setTableState(tableId, { scrollTop: container.scrollTop });
    };
  }, [tableId]);

  useEffect(() => {
    setRows([]);
    setHasMore(true);
    setError(null);
    setInitialLoaded(false);
    offsetRef.current = 0;
    setTotalCount(null);
    setScrollRestored(false);
  }, [layerName, chunkSize, sortState.field, sortState.direction, columnFilters]);

  useEffect(() => {
    if (!layer || !qgsUrl || !qgsProjectPath) {
      return;
    }
    let cancelled = false;
    setLoading(true);
    const fieldsMap = (layer?.fields || []).reduce((acc, f) => {
      acc[f.name] = f;
      return acc;
    }, {});
    const cqlFilter = buildFilterQuery(columnFilters, fieldsMap);
    fetchFeatureCount(qgsUrl, qgsProjectPath, layerName, cqlFilter, token)
      .then((count) => {
        if (!cancelled) {
          setTotalCount(count);
          if (count === 0) {
            setInitialLoaded(true);
          }
        }
      })
      .catch((err) => {
        if (!cancelled) {
          console.error('[TableInfiniteScroll] Error al obtener total:', err);
          setError(err.message);
          notificationManager?.addNotification?.({
            title: translate('ui.table.error'),
            text: translate('ui.table.errorLoadingData'),
            level: 'error'
          });
        }
      })
      .finally(() => {
        if (!cancelled) {
          setLoading(false);
        }
      });

    return () => {
      cancelled = true;
    };
  }, [layer, layerName, qgsUrl, qgsProjectPath, token, translate, notificationManager, columnFilters]);

  const loadNextChunk = useCallback(async () => {
    if (!layer || !qgsUrl || !qgsProjectPath || !hasMore) {
      return;
    }
    setLoading(true);
    setError(null);
    const startIndex = offsetRef.current;
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

      const features = await fetchFeatures(
        qgsUrl,
        qgsProjectPath,
        layerName,
        cqlFilter,
        startIndex,
        chunkSize,
        token,
        sortOptions
      );
      const datosExtraidos = features.map((feature) => feature.properties || {});
      setRows((prev) => [...prev, ...datosExtraidos]);
      offsetRef.current = startIndex + features.length;
      if (features.length < chunkSize) {
        setHasMore(false);
      }
      setInitialLoaded(true);
    } catch (err) {
      console.error('[TableInfiniteScroll] Error al cargar datos:', err);
      setError(err.message);
      setHasMore(false);
      notificationManager?.addNotification?.({
        title: translate('ui.table.error'),
        text: translate('ui.table.errorLoadingData'),
        level: 'error'
      });
    } finally {
      setLoading(false);
    }
  }, [
    layer,
    layerName,
    chunkSize,
    qgsUrl,
    qgsProjectPath,
    token,
    translate,
    notificationManager,
    hasMore,
    sortState.field,
    sortState.direction,
    columnFilters
  ]);

  useEffect(() => {
    if (!layer || !qgsUrl || !qgsProjectPath) {
      return;
    }
    loadNextChunk();
  }, [layer, qgsUrl, qgsProjectPath, loadNextChunk]);

  const handleScroll = useCallback(() => {
    const container = containerRef.current;
    if (!container || loading || !hasMore) {
      return;
    }
    const threshold = 120;
    if (container.scrollTop + container.clientHeight >= container.scrollHeight - threshold) {
      loadNextChunk();
    }
  }, [loading, hasMore, loadNextChunk]);

  useEffect(() => {
    const container = containerRef.current;
    if (!container) {
      return undefined;
    }
    const onScroll = () => handleScroll();
    container.addEventListener('scroll', onScroll);
    return () => container.removeEventListener('scroll', onScroll);
  }, [handleScroll]);

  // Restaurar scroll horizontal después de que los datos se hayan renderizado
  // Solo restaurar cuando initialLoaded cambia a true (primera carga después de ordenar)
  useEffect(() => {
    if (savedScrollLeftRef.current === 0 || !initialLoaded || !containerRef.current) {
      return;
    }
    
    // Solo restaurar si rows tiene datos (no está vacío)
    if (rows.length === 0) {
      return;
    }
    
    console.log('[TableInfiniteScroll] useEffect initialLoaded - Intentando restaurar scroll horizontal:', savedScrollLeftRef.current);
    console.log('[TableInfiniteScroll] useEffect initialLoaded - rows.length:', rows.length);
    
    // Usar requestAnimationFrame para asegurar que el DOM se haya actualizado
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (containerRef.current) {
          console.log('[TableInfiniteScroll] useEffect initialLoaded - Restaurando scrollLeft a:', savedScrollLeftRef.current);
          console.log('[TableInfiniteScroll] useEffect initialLoaded - scrollLeft antes de restaurar:', containerRef.current.scrollLeft);
          containerRef.current.scrollLeft = savedScrollLeftRef.current;
          console.log('[TableInfiniteScroll] useEffect initialLoaded - scrollLeft después de restaurar:', containerRef.current.scrollLeft);
          
          // Verificar que se mantuvo después de un pequeño delay
          setTimeout(() => {
            if (containerRef.current) {
              console.log('[TableInfiniteScroll] useEffect initialLoaded - scrollLeft después de 100ms:', containerRef.current.scrollLeft);
            }
          }, 100);
          
          // Resetear el valor guardado después de restaurarlo
          savedScrollLeftRef.current = 0;
        } else {
          console.warn('[TableInfiniteScroll] useEffect initialLoaded - containerRef.current es null');
        }
      });
    });
  }, [initialLoaded, rows.length]);

  const handleSort = (field) => {
    // Guardar posición del scroll horizontal antes de ordenar
    if (containerRef.current) {
      savedScrollLeftRef.current = containerRef.current.scrollLeft;
      console.log('[TableInfiniteScroll] handleSort - Scroll horizontal guardado:', savedScrollLeftRef.current);
      console.log('[TableInfiniteScroll] handleSort - Contenedor existe:', !!containerRef.current);
      console.log('[TableInfiniteScroll] handleSort - scrollLeft actual:', containerRef.current.scrollLeft);
    } else {
      console.warn('[TableInfiniteScroll] handleSort - containerRef.current es null');
    }
    
    setRows([]);
    setHasMore(true);
    setInitialLoaded(false);
    setError(null);
    offsetRef.current = 0;
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
    const rect = event.currentTarget.getBoundingClientRect();
    setFilterPopover({
      field,
      position: {
        top: rect.bottom + window.scrollY,
        left: rect.left + window.scrollX
      }
    });
  };

  const handleApplyFilter = (fieldName, filter) => {
    setColumnFilters((prev) => ({
      ...prev,
      [fieldName]: filter
    }));
    setRows([]);
    setHasMore(true);
    setInitialLoaded(false);
    offsetRef.current = 0;
  };

  const handleClearFilter = (fieldName) => {
    setColumnFilters((prev) => {
      const next = { ...prev };
      delete next[fieldName];
      return next;
    });
    setRows([]);
    setHasMore(true);
    setInitialLoaded(false);
    offsetRef.current = 0;
  };

  const handleClearAllFilters = () => {
    setColumnFilters({});
    setRows([]);
    setHasMore(true);
    setInitialLoaded(false);
    offsetRef.current = 0;
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

  if (!initialLoaded && loading) {
    return <LoadingQGS />;
  }

  const formatValue = (value) => {
    if (value === null || value === undefined) {
      return '';
    }
    return String(value);
  };

  return (
    <div className="table">
      {columns.length === 0 ? (
        <div>{translate('ui.table.noData')}</div>
      ) : (
        <>
          <div
            ref={containerRef}
            className="table__scroll-container"
            style={{ maxHeight: height, overflowY: 'auto', overflowX: 'auto' }}
          >
            <table className="table__native">
              <thead>
                <tr>
                  {columns.map((column, colIndex) => {
                    const colWidth = getColumnWidth(colIndex, column.field, column.label);
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
                          className={`table__resize-handle${resizing.columnIndex === colIndex ? ' table__resize-handle--active' : ''}`}
                          onMouseDown={(e) => handleMouseDown(e, colIndex, colWidth)}
                          role="separator"
                          aria-orientation="vertical"
                          aria-label={translate('ui.table.resizeColumn', 'Redimensionar columna')}
                        />
                      </th>
                    );
                  })}
                </tr>
              </thead>
              <tbody>
                {rows.length === 0 ? (
                  <tr>
                    <td colSpan={columns.length} className="table__empty-cell">
                      {error ? translate('ui.table.error') : translate('ui.table.noData')}
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={`${layerName}-${index}`}>
                      {columns.map((column, colIndex) => {
                        const colWidth = getColumnWidth(colIndex, column.field, column.label);
                        return (
                          <td key={column.field} style={{ width: colWidth, minWidth: colWidth, maxWidth: colWidth }}>
                            {formatValue(row[column.field])}
                          </td>
                        );
                      })}
                    </tr>
                  ))
                )}
              </tbody>
            </table>
            {loading && (
              <div className="table__loading-inline">{translate('ui.table.loadingMore')}</div>
            )}
          </div>
          <div className="table__summary">
            {totalCount !== null
              ? translate('ui.table.totalRecords', { count: totalCount })
              : translate('ui.table.totalRecords', { count: rows.length })}
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
          {!hasMore && rows.length > 0 && (
            <div className="table__hint">{translate('ui.table.allDataLoaded')}</div>
          )}
          {error && (
            <div className="table__error">
              {translate('ui.table.error')}: {error}
            </div>
          )}
          {filterPopover?.field && filterPopover?.position && (
            <div
              ref={popoverRef}
              className="table__filter-popover"
              style={{
                position: 'absolute',
                top: filterPopover.position.top,
                left: filterPopover.position.left,
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

TableInfiniteScroll.propTypes = {
  layerName: PropTypes.string.isRequired,
  chunkSize: PropTypes.number,
  height: PropTypes.number
};

export default TableInfiniteScroll;

