import React, { useContext, useEffect, useMemo, useState, useCallback, useRef } from 'react';
import PropTypes from 'prop-types';
import { QgisConfigContext } from '../QgisConfigContext';
import { fetchFeatureCount, fetchFeatures } from '../../../services/qgisWFSFetcher';
import { LoadingQGS } from '../../UI_QGS';
import { Pagination } from '../../UI';
import './Table.css';
import ColumnFilterPopover from './filters/ColumnFilterPopover';
import { buildFilterQuery } from './filters/filterUtils';
import { getTableState, setTableState } from './tableStateStore';
import { useColumnResize } from './hooks/useColumnResize';

/**
 * Tabla paginada que carga los datos de forma perezosa (lazy) por página.
 */
const PAGE_SIZE_OPTIONS = [10, 25, 50, 100];

const TablePaginated = ({ layerName, defaultPageSize = 10, tableHeight = 360 }) => {
  const { config, t, notificationManager, qgsUrl, qgsProjectPath, token, language } =
    useContext(QgisConfigContext);
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
  
  // Hook para redimensionamiento de columnas (columns ya está definido arriba)
  const { getColumnWidth, handleMouseDown, resizing } = useColumnResize(tableId, columns, 50, 150);

  // Restaurar scroll horizontal después de que los datos se hayan renderizado
  useEffect(() => {
    if (savedScrollLeftRef.current === 0 || loading || !scrollContainerRef.current) {
      return;
    }
    
    // Solo restaurar si rows tiene elementos (no está vacío)
    if (rows.length === 0) {
      return;
    }
    
    console.log('[TablePaginated] useEffect rows - Intentando restaurar scroll horizontal:', savedScrollLeftRef.current);
    console.log('[TablePaginated] useEffect rows - rows.length:', rows.length);
    
    // Usar requestAnimationFrame para asegurar que el DOM se haya actualizado
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        if (scrollContainerRef.current) {
          console.log('[TablePaginated] useEffect rows - Restaurando scrollLeft a:', savedScrollLeftRef.current);
          console.log('[TablePaginated] useEffect rows - scrollLeft antes de restaurar:', scrollContainerRef.current.scrollLeft);
          scrollContainerRef.current.scrollLeft = savedScrollLeftRef.current;
          console.log('[TablePaginated] useEffect rows - scrollLeft después de restaurar:', scrollContainerRef.current.scrollLeft);
          
          // Verificar que se mantuvo después de un pequeño delay
          setTimeout(() => {
            if (scrollContainerRef.current) {
              console.log('[TablePaginated] useEffect rows - scrollLeft después de 100ms:', scrollContainerRef.current.scrollLeft);
            }
          }, 100);
          
          // Resetear el valor guardado después de restaurarlo
          savedScrollLeftRef.current = 0;
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
      columnFilters
    });
  }, [tableId, page, pageSize, sortState, columnFilters]);

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
                      {translate('ui.table.noData')}
                    </td>
                  </tr>
                ) : (
                  rows.map((row, index) => (
                    <tr key={`${page}-${index}`}>
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

TablePaginated.propTypes = {
  layerName: PropTypes.string.isRequired,
  defaultPageSize: PropTypes.number,
  tableHeight: PropTypes.number
};

export default TablePaginated;

