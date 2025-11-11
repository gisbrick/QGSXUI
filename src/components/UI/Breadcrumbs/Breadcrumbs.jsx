import React from 'react';
import PropTypes from 'prop-types';

const Breadcrumbs = ({ items = [] }) => (
  <nav style={{ padding: '8px 0' }}>
    {items.map((item, idx) => (
      <span key={idx}>
        {idx > 0 && <span style={{ margin: '0 8px' }}>/</span>}
        <span style={{ color: idx === items.length - 1 ? '#000' : '#666' }}>
          {item.label || item}
        </span>
      </span>
    ))}
  </nav>
);

Breadcrumbs.propTypes = {
  items: PropTypes.array
};

export default Breadcrumbs;