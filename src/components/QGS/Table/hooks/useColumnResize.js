import { useState, useCallback, useRef, useEffect } from 'react';

/**
 * Hook para manejar el redimensionamiento de columnas en tablas
 * @param {string} tableId - ID único de la tabla para persistir anchos
 * @param {Array} columns - Array de columnas
 * @param {number} minWidth - Ancho mínimo de columna (default: 50)
 * @param {number} defaultWidth - Ancho por defecto si no hay persistido (default: 150)
 * @returns {Object} - Estado y funciones para redimensionar
 */
export const useColumnResize = (tableId, columns = [], minWidth = 50, defaultWidth = 150) => {
  const [columnWidths, setColumnWidths] = useState(() => {
    // Intentar cargar desde localStorage
    if (tableId) {
      try {
        const saved = localStorage.getItem(`table-column-widths-${tableId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          return parsed;
        }
      } catch (e) {
        console.warn('Error loading column widths:', e);
      }
    }
    return {};
  });

  const [resizing, setResizing] = useState({ columnIndex: null, startX: 0, startWidth: 0 });
  const tableRef = useRef(null);

  // Guardar anchos en localStorage
  useEffect(() => {
    if (tableId && Object.keys(columnWidths).length > 0) {
      try {
        localStorage.setItem(`table-column-widths-${tableId}`, JSON.stringify(columnWidths));
      } catch (e) {
        console.warn('Error saving column widths:', e);
      }
    }
  }, [tableId, columnWidths]);

  const handleMouseDown = useCallback((e, columnIndex, currentWidth) => {
    e.preventDefault();
    e.stopPropagation();
    setResizing({
      columnIndex,
      startX: e.clientX,
      startWidth: currentWidth
    });
  }, []);

  const handleMouseMove = useCallback((e) => {
    if (resizing.columnIndex === null) return;

    const deltaX = e.clientX - resizing.startX;
    const newWidth = Math.max(minWidth, resizing.startWidth + deltaX);

    setColumnWidths((prev) => ({
      ...prev,
      [resizing.columnIndex]: newWidth
    }));
  }, [resizing, minWidth]);

  const handleMouseUp = useCallback(() => {
    setResizing({ columnIndex: null, startX: 0, startWidth: 0 });
  }, []);

  // Event listeners globales para el drag
  useEffect(() => {
    if (resizing.columnIndex !== null) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = 'col-resize';
      document.body.style.userSelect = 'none';

      return () => {
        document.removeEventListener('mousemove', handleMouseMove);
        document.removeEventListener('mouseup', handleMouseUp);
        document.body.style.cursor = '';
        document.body.style.userSelect = '';
      };
    }
  }, [resizing.columnIndex, handleMouseMove, handleMouseUp]);

  const getColumnWidth = useCallback((columnIndex, fieldName, columnLabel) => {
    // Prioridad: 1) Ancho guardado, 2) Ancho calculado inteligente
    if (columnWidths[columnIndex] || columnWidths[fieldName]) {
      return columnWidths[columnIndex] ?? columnWidths[fieldName];
    }
    
    // Calcular ancho basado en el label (más preciso que el fieldName)
    const label = columnLabel || fieldName || '';
    const labelLength = label.length;
    
    // Ancho base: 
    // - 8px por carácter del label
    // - 40px para el icono de filtro (20px + padding)
    // - 30px para el icono de ordenación + spacing
    // - 40px de padding lateral (20px cada lado)
    // - 20px de margen de seguridad
    const calculatedWidth = Math.max(
      minWidth,
      (labelLength * 8) + 40 + 30 + 40 + 20
    );
    
    // Límites razonables: mínimo 120px, máximo 400px
    return Math.min(Math.max(calculatedWidth, 120), 400);
  }, [columnWidths, minWidth]);

  const resetColumnWidths = useCallback(() => {
    setColumnWidths({});
    if (tableId) {
      try {
        localStorage.removeItem(`table-column-widths-${tableId}`);
      } catch (e) {
        console.warn('Error clearing column widths:', e);
      }
    }
  }, [tableId]);

  return {
    columnWidths,
    resizing,
    getColumnWidth,
    handleMouseDown,
    resetColumnWidths,
    tableRef
  };
};

