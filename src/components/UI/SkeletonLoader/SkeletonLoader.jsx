import React from 'react';
import PropTypes from 'prop-types';

const SkeletonLoader = ({ width = '100%', height = '20px', count = 1 }) => (
  <div>
    {Array.from({ length: count }, (_, i) => (
      <div 
        key={i}
        style={{
          width,
          height,
          backgroundColor: '#f0f0f0',
          borderRadius: '4px',
          margin: '4px 0',
          animation: 'pulse 1.5s ease-in-out infinite'
        }}
      />
    ))}
    <style>{`
      @keyframes pulse {
        0%, 100% { opacity: 1; }
        50% { opacity: 0.5; }
      }
    `}</style>
  </div>
);

SkeletonLoader.propTypes = {
  width: PropTypes.string,
  height: PropTypes.string,
  count: PropTypes.number
};

export default SkeletonLoader;