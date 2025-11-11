import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './Tabs.css';

const Tabs = ({ tabs, defaultActive = 0, onTabChange }) => {
  const [activeIndex, setActiveIndex] = useState(defaultActive);

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
            {tab.label}
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
      label: PropTypes.string.isRequired,
      content: PropTypes.node.isRequired,
    })
  ).isRequired,
  defaultActive: PropTypes.number,
  onTabChange: PropTypes.func,
};

export default Tabs;