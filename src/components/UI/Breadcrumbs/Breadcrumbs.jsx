import React from 'react';
import PropTypes from 'prop-types';
import './Breadcrumbs.css';

const Breadcrumbs = ({ items = [], separator = '/', className = '' }) => {
  const breadcrumbsClasses = [
    'breadcrumbs',
    className
  ].filter(Boolean).join(' ');

  return (
    <nav className={breadcrumbsClasses} aria-label="Breadcrumb">
      <ol className="breadcrumbs__list">
        {items.map((item, idx) => {
          const isLast = idx === items.length - 1;
          const label = typeof item === 'string' ? item : (item.label || item);
          const href = typeof item === 'object' && item.href ? item.href : null;

          return (
            <li key={idx} className={`breadcrumbs__item ${isLast ? 'breadcrumbs__item--active' : ''}`}>
              {idx > 0 && (
                <span className="breadcrumbs__separator" aria-hidden="true">
                  {separator}
                </span>
              )}
              {href && !isLast ? (
                <a href={href} className="breadcrumbs__link">
                  {label}
                </a>
              ) : (
                <span>{label}</span>
              )}
            </li>
          );
        })}
      </ol>
    </nav>
  );
};

Breadcrumbs.propTypes = {
  items: PropTypes.arrayOf(
    PropTypes.oneOfType([
      PropTypes.string,
      PropTypes.shape({
        label: PropTypes.string.isRequired,
        href: PropTypes.string
      })
    ])
  ).isRequired,
  separator: PropTypes.string,
  className: PropTypes.string
};

export default Breadcrumbs;