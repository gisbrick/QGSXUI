import React, { useState } from 'react';
import PropTypes from 'prop-types';
import './Accordion.css';

const Accordion = ({ 
  items = [], 
  title, 
  children, 
  defaultOpen = false,
  expandedItems = [],
  onToggle,
  className = '',
  variant = 'default'
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [internalExpanded, setInternalExpanded] = useState(expandedItems);

  // Modo simple (retrocompatibilidad): solo title y children
  if (title && children) {
    const accordionClasses = [
      'accordion',
      variant !== 'default' && `accordion--${variant}`,
      className
    ].filter(Boolean).join(' ');

    return (
      <div className={accordionClasses}>
        <div className="accordion__item">
          <button
            className={`accordion__header ${isOpen ? 'accordion__header--active' : ''}`}
            onClick={() => setIsOpen(!isOpen)}
            aria-expanded={isOpen}
          >
            <span className="accordion__title">{title}</span>
            <span className={`accordion__icon ${isOpen ? 'accordion__icon--expanded' : ''}`}>
              {isOpen ? '−' : '+'}
            </span>
          </button>
          {isOpen && (
            <div className="accordion__content">
              {children}
            </div>
          )}
        </div>
      </div>
    );
  }

  // Modo avanzado: múltiples items
  const isExpanded = (index) => {
    if (onToggle) {
      return expandedItems.includes(index);
    }
    return internalExpanded.includes(index);
  };

  const toggleItem = (index) => {
    if (onToggle) {
      onToggle(index);
    } else {
      setInternalExpanded(prev => 
        prev.includes(index) 
          ? prev.filter(i => i !== index)
          : [...prev, index]
      );
    }
  };

  const accordionClasses = [
    'accordion',
    variant !== 'default' && `accordion--${variant}`,
    className
  ].filter(Boolean).join(' ');

  return (
    <div className={accordionClasses}>
      {items.map((item, index) => (
        <div key={index} className="accordion__item">
          <button
            className={`accordion__header ${isExpanded(index) ? 'accordion__header--active' : ''}`}
            onClick={() => toggleItem(index)}
            aria-expanded={isExpanded(index)}
          >
            <span className="accordion__title">{item.title}</span>
            <span className={`accordion__icon ${isExpanded(index) ? 'accordion__icon--expanded' : ''}`}>
              {isExpanded(index) ? '−' : '+'}
            </span>
          </button>
          {isExpanded(index) && (
            <div className="accordion__content">
              {item.content}
            </div>
          )}
        </div>
      ))}
    </div>
  );
};

Accordion.propTypes = {
  // Modo simple (retrocompatibilidad)
  title: PropTypes.string,
  children: PropTypes.node,
  defaultOpen: PropTypes.bool,
  
  // Modo avanzado
  items: PropTypes.arrayOf(PropTypes.shape({
    title: PropTypes.string.isRequired,
    content: PropTypes.node.isRequired
  })),
  expandedItems: PropTypes.arrayOf(PropTypes.number),
  onToggle: PropTypes.func,
  className: PropTypes.string,
  variant: PropTypes.oneOf(['default', 'flush', 'animated'])
};

export default Accordion;