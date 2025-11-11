import React, { useState } from 'react';
import PropTypes from 'prop-types';

const Accordion = ({ 
  items = [], 
  title, 
  children, 
  defaultOpen = false,
  expandedItems = [],
  onToggle
}) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  const [internalExpanded, setInternalExpanded] = useState(expandedItems);

  // Modo simple (retrocompatibilidad): solo title y children
  if (title && children) {
    return (
      <div style={{ 
        border: '1px solid #ddd', 
        borderRadius: '4px', 
        marginBottom: '8px',
        width: '100%'
      }}>
        <div 
          style={{
            padding: '12px',
            backgroundColor: '#f5f5f5',
            cursor: 'pointer',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center'
          }}
          onClick={() => setIsOpen(!isOpen)}
        >
          <span>{title}</span>
          <span>{isOpen ? '−' : '+'}</span>
        </div>
        {isOpen && (
          <div style={{ padding: '12px' }}>
            {children}
          </div>
        )}
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

  return (
    <div style={{ 
      border: '1px solid #ddd', 
      borderRadius: '4px',
      width: '100%'
    }}>
      {items.map((item, index) => (
        <div key={index} style={{ borderBottom: index < items.length - 1 ? '1px solid #eee' : 'none' }}>
          <div 
            style={{
              padding: '12px',
              backgroundColor: '#f5f5f5',
              cursor: 'pointer',
              display: 'flex',
              justifyContent: 'space-between',
              alignItems: 'center'
            }}
            onClick={() => toggleItem(index)}
          >
            <span>{item.title}</span>
            <span>{isExpanded(index) ? '−' : '+'}</span>
          </div>
          {isExpanded(index) && (
            <div style={{ padding: '12px' }}>
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
  onToggle: PropTypes.func
};

export default Accordion;