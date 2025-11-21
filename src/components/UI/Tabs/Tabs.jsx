import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import './Tabs.css';

const Tabs = ({ tabs, defaultActive = 0, onTabChange }) => {
  const [activeIndex, setActiveIndex] = useState(defaultActive);

  // Sincronizar activeIndex con defaultActive cuando cambie
  useEffect(() => {
    if (defaultActive !== activeIndex && defaultActive >= 0 && defaultActive < tabs.length) {
      setActiveIndex(defaultActive);
    }
  }, [defaultActive, tabs.length]);

  const handleTabClick = (index) => {    
    setActiveIndex(index);
    if (onTabChange) {
      onTabChange(index);
    }
  };

  return (
    <div className="tabs">
      <div className="tabs__list">
        {tabs.map((tab, index) => (
          <button
            key={index}
            className={`tabs__tab ${activeIndex === index ? 'tabs__tab--active' : ''}`}
            onClick={(e) => {
              e.preventDefault();
              handleTabClick(index);
            }}
          >
            {typeof tab.label === 'string' ? tab.label : tab.label}
          </button>
        ))}
      </div>
      
      <div className="tabs__content">
        {tabs[activeIndex] && tabs[activeIndex].content}
      </div>
    </div>
  );
};

Tabs.propTypes = {
  tabs: PropTypes.arrayOf(
    PropTypes.shape({
      label: PropTypes.oneOfType([PropTypes.string, PropTypes.node]).isRequired,
      content: PropTypes.node.isRequired,
    })
  ).isRequired,
  defaultActive: PropTypes.number,
  onTabChange: PropTypes.func,
};

export default Tabs;