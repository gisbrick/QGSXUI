import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './Pagination.css';
import { loadTranslations } from '../../../utilities/traslations';
import { useTranslation } from '../../../hooks/useTranslation';


const Pagination = ({
  currentPage = 1,
  totalPages = 1,
  onPageChange,
  showFirstLast = true,
  showNumbers = true,
  maxVisiblePages = 5,
  size = 'medium',
  lang = 'en'
}) => {
  const [translations, setTranslations] = useState(null);

  // Cargar traducciones cuando cambie el idioma
  useEffect(() => {   
    const loadLang = async () => {
      const t = await loadTranslations(lang);
      setTranslations(t);
    };
    loadLang();
  }, [lang]);

  // Usar el hook de traducción
  const t = useTranslation(lang, translations);

  // Si las traducciones no están cargadas, mostrar loading o fallback
  if (!translations) {
    return (
      <div className={`pagination pagination--${size}`}>
        <span>{lang === 'en' ? 'Loading...' : 'Cargando...'}</span>
      </div>
    );
  }


  // Calcular qué páginas mostrar
  const getVisiblePages = () => {
    if (!showNumbers || totalPages <= maxVisiblePages) {
      return Array.from({ length: totalPages }, (_, i) => i + 1);
    }

    const half = Math.floor(maxVisiblePages / 2);
    let start = Math.max(1, currentPage - half);
    let end = Math.min(totalPages, start + maxVisiblePages - 1);

    if (end - start < maxVisiblePages - 1) {
      start = Math.max(1, end - maxVisiblePages + 1);
    }

    return Array.from({ length: end - start + 1 }, (_, i) => start + i);
  };

  const visiblePages = getVisiblePages();
  const hasPrevious = currentPage > 1;
  const hasNext = currentPage < totalPages;

  const handlePageChange = (page) => {
    if (page >= 1 && page <= totalPages && page !== currentPage) {
      onPageChange?.(page);
    }
  };

  if (totalPages <= 1) {
    return null; // No mostrar paginación si hay 1 página o menos
  }

  return (
    <div className={`pagination pagination--${size}`}>
      {/* Botón Primera página */}
      {showFirstLast && (
        <button
          className="pagination__btn pagination__btn--first"
          onClick={() => handlePageChange(1)}
          disabled={!hasPrevious}
          title={t('ui.pagination.first')}
        >
          <span className="pagination__icon">⟪</span>
        </button>
      )}

      {/* Botón Anterior */}
      <button
        className="pagination__btn pagination__btn--prev"
        onClick={() => handlePageChange(currentPage - 1)}
        disabled={!hasPrevious}
        title={t('ui.pagination.previous')}
      >
        <span className="pagination__icon">‹</span>
        <span className="pagination__text">{t('ui.pagination.previous')}</span>
      </button>

      {/* Números de página */}
      {showNumbers && (
        <div className="pagination__numbers">
          {/* Mostrar ... si hay páginas antes */}
          {visiblePages[0] > 1 && (
            <>
              <button
                className="pagination__btn pagination__btn--number"
                onClick={() => handlePageChange(1)}
              >
                1
              </button>
              {visiblePages[0] > 2 && (
                <span className="pagination__ellipsis">...</span>
              )}
            </>
          )}

          {/* Páginas visibles */}
          {visiblePages.map(page => (
            <button
              key={page}
              className={`pagination__btn pagination__btn--number ${page === currentPage ? 'pagination__btn--current' : ''
                }`}
              onClick={() => handlePageChange(page)}
            >
              {page}
            </button>
          ))}

          {/* Mostrar ... si hay páginas después */}
          {visiblePages[visiblePages.length - 1] < totalPages && (
            <>
              {visiblePages[visiblePages.length - 1] < totalPages - 1 && (
                <span className="pagination__ellipsis">...</span>
              )}
              <button
                className="pagination__btn pagination__btn--number"
                onClick={() => handlePageChange(totalPages)}
              >
                {totalPages}
              </button>
            </>
          )}
        </div>
      )}

      {/* Info de página actual (si no se muestran números) */}
      {!showNumbers && (
        <span className="pagination__info">
          {currentPage} {t('ui.common.of')} {totalPages}
        </span>
      )}

      {/* Botón Siguiente */}
      <button
        className="pagination__btn pagination__btn--next"
        onClick={() => handlePageChange(currentPage + 1)}
        disabled={!hasNext}
        title={t('ui.pagination.next')}
      >
        <span className="pagination__text">{t('ui.pagination.next')}</span>
        <span className="pagination__icon">›</span>
      </button>

      {/* Botón Última página */}
      {showFirstLast && (
        <button
          className="pagination__btn pagination__btn--last"
          onClick={() => handlePageChange(totalPages)}
          disabled={!hasNext}
          title={t('ui.pagination.last')}
        >
          <span className="pagination__icon">⟫</span>
        </button>
      )}
    </div>
  );
};

Pagination.propTypes = {
  currentPage: PropTypes.number,
  totalPages: PropTypes.number,
  onPageChange: PropTypes.func,
  showFirstLast: PropTypes.bool,
  showNumbers: PropTypes.bool,
  maxVisiblePages: PropTypes.number,
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  lang: PropTypes.string // Cualquier string para soportar futuros idiomas
};

export default Pagination;