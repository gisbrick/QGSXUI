import React, { useState, useRef, useCallback, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useUITranslation } from '../../../hooks/useTranslation';
import './SplitPane.css';

const SplitPane = ({ 
  direction = 'horizontal', 
  initialSize = '50%', 
  minSize = 100,
  maxSize,
  onResize,
  children,
  className = '',
  disabled = false,
  locale,
  translations,
  ...props 
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [size, setSize] = useState(initialSize);
  const splitPaneRef = useRef(null);
  const startPosRef = useRef(0);
  const startSizeRef = useRef(0);
  const { t } = useUITranslation('ui.splitPane', { locale, translations });

  const isHorizontal = direction === 'horizontal';

  const handleMouseMove = useCallback((e) => {
    if (!isDragging) return;
    
    const currentPos = isHorizontal ? e.clientX : e.clientY;
    const diff = currentPos - startPosRef.current;
    const newSize = Math.max(minSize, startSizeRef.current + diff);
    
    const rect = splitPaneRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    const containerSize = isHorizontal ? rect.width : rect.height;
    const clampedSize = maxSize ? Math.min(newSize, maxSize) : Math.min(newSize, containerSize - minSize);
    
    setSize(clampedSize);
    
    if (onResize) {
      onResize(clampedSize);
    }
  }, [isDragging, minSize, maxSize, isHorizontal, onResize]);

  const handleMouseUp = useCallback(() => {
    setIsDragging(false);
  }, []);

  // Effect to manage global mouse events
  useEffect(() => {
    if (isDragging) {
      document.addEventListener('mousemove', handleMouseMove);
      document.addEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = isHorizontal ? 'col-resize' : 'row-resize';
      document.body.style.userSelect = 'none';
    } else {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    }

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };
  }, [isDragging, handleMouseMove, handleMouseUp, isHorizontal]);

  const handleMouseDown = useCallback((e) => {
    if (disabled) return;
    
    e.preventDefault();
    
    const rect = splitPaneRef.current?.getBoundingClientRect();
    if (!rect) return;
    
    startPosRef.current = isHorizontal ? e.clientX : e.clientY;
    
    // Convert percentage to pixels if needed
    let currentSize = size;
    if (typeof size === 'string' && size.endsWith('%')) {
      const percentage = parseFloat(size) / 100;
      currentSize = isHorizontal ? rect.width * percentage : rect.height * percentage;
    }
    startSizeRef.current = currentSize;
    
    setIsDragging(true);
  }, [disabled, size, isHorizontal]);

  const handleKeyDown = useCallback((e) => {
    if (disabled) return;
    
    const step = 10;
    let newSize = typeof size === 'number' ? size : parseFloat(size);
    
    switch (e.key) {
      case 'ArrowLeft':
      case 'ArrowUp':
        e.preventDefault();
        newSize = Math.max(minSize, newSize - step);
        break;
      case 'ArrowRight':
      case 'ArrowDown':
        e.preventDefault();
        newSize = maxSize ? Math.min(maxSize, newSize + step) : newSize + step;
        break;
      default:
        return;
    }
    
    setSize(newSize);
    if (onResize) {
      onResize(newSize);
    }
  }, [disabled, size, minSize, maxSize, onResize]);

  const paneStyle = {
    [isHorizontal ? 'width' : 'height']: typeof size === 'string' ? size : `${size}px`,
  };

  const childrenArray = React.Children.toArray(children);
  const firstPane = childrenArray[0];
  const secondPane = childrenArray[1];

  return (
    <div 
      ref={splitPaneRef}
      className={`split-pane split-pane--${direction} ${isDragging ? 'split-pane--dragging' : ''} ${className}`}
      {...props}
    >
      <div className="split-pane__pane split-pane__pane--first" style={paneStyle}>
        {firstPane}
      </div>
      
      <div 
        className={`split-pane__divider split-pane__divider--${direction} ${disabled ? 'split-pane__divider--disabled' : ''}`}
        onMouseDown={handleMouseDown}
        onKeyDown={handleKeyDown}
        role="separator"
        aria-orientation={isHorizontal ? 'vertical' : 'horizontal'}
        aria-label={`Resize ${direction} split pane`}
        tabIndex={disabled ? -1 : 0}
      >
        <div className="split-pane__divider-handle" />
      </div>
      
      <div className="split-pane__pane split-pane__pane--second">
        {secondPane}
      </div>
    </div>
  );
};

SplitPane.propTypes = {
  direction: PropTypes.oneOf(['horizontal', 'vertical']),
  initialSize: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  minSize: PropTypes.number,
  maxSize: PropTypes.number,
  onResize: PropTypes.func,
  children: PropTypes.node.isRequired,
  className: PropTypes.string,
  disabled: PropTypes.bool,
  locale: PropTypes.string,
  translations: PropTypes.object,
};

export default SplitPane;