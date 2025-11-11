import React, { useState, useEffect } from 'react';
import PropTypes from 'prop-types';
import { Button, Select, Switch, SelectButton } from '../../UI';
import './ToolbarQGS.css';

const ToolbarQGS = ({ 
  items = [], 
  size = 'medium', 
  selectedTool = null, 
  onToolChange = () => {} 
}) => {
  const [internalSelectedTool, setInternalSelectedTool] = useState(selectedTool);

  // Sincronizar el estado interno con la prop externa
  useEffect(() => {
    setInternalSelectedTool(selectedTool);
  }, [selectedTool]);

  const handleToolSelect = (toolKey) => {
    // Si la herramienta ya está seleccionada, la deseleccionamos
    const newSelectedTool = internalSelectedTool === toolKey ? null : toolKey;
    setInternalSelectedTool(newSelectedTool);
    onToolChange(newSelectedTool);
  };

  const renderItem = (item) => {
    const { key, type = 'action', ...itemProps } = item;

    try {
      switch (type) {
        case 'action':
          return (
            <Button
              key={key}
              size={size}
              circular={itemProps.circular || false}
              onClick={itemProps.onClick || (() => {})}
              disabled={itemProps.disabled || false}
              icon={itemProps.icon}
              title={itemProps.title}
            >
              {itemProps.label}
            </Button>
          );

        case 'tool':
          return (
            <Button
              key={key}
              size={size}
              circular={itemProps.circular || false}
              selected={internalSelectedTool === key}
              onClick={() => handleToolSelect(key)}
              disabled={itemProps.disabled || false}
              icon={itemProps.icon}
              title={itemProps.title}
            >
              {itemProps.label}
            </Button>
          );

        case 'select':
          return (
            <Select
              key={key}
              size={size}
              options={itemProps.options || []}
              value={itemProps.value}
              onChange={itemProps.onChange || (() => {})}
              disabled={itemProps.disabled || false}
              placeholder={itemProps.placeholder}
            />
          );

        case 'switch':
          return (
            <Switch
              key={key}
              size={size}
              checked={itemProps.checked || false}
              onChange={itemProps.onChange || (() => {})}
              disabled={itemProps.disabled || false}
              label={itemProps.label}
              labelPosition={itemProps.labelPosition || 'right'}
            />
          );

        case 'selectButton':
          return (
            <SelectButton
              key={key}
              size={size}
              icon={itemProps.icon}
              placeholder={itemProps.placeholder}
              disabled={itemProps.disabled || false}
              circular={itemProps.circular || false}
              selected={itemProps.selected || false}
              gridColumns={itemProps.gridColumns || 1}
              options={itemProps.options?.map((option, index) => ({
                ...option,
                render: () => {
                  // Si la opción tiene toolKey, clonamos el elemento y le pasamos la prop selected
                  if (option.toolKey && React.isValidElement(option.element)) {
                    return React.cloneElement(option.element, {
                      selected: internalSelectedTool === option.toolKey,
                      size: size // Pasar el tamaño de la toolbar a los elementos internos también
                    });
                  }
                  return option.element;
                }
              }))}
              onSelect={(option, index) => {
                // Si la opción tiene toolKey, manejar la selección de herramienta
                if (option.toolKey) {
                  handleToolSelect(option.toolKey);
                }
                // Llamar al callback personalizado si existe
                if (itemProps.onSelect) {
                  itemProps.onSelect(option, index);
                }
              }}
              title={itemProps.title}
            >
              {itemProps.label || itemProps.placeholder || 'Seleccionar...'}
            </SelectButton>
          );

        default:
          // Fallback para compatibilidad hacia atrás
          return (
            <Button
              key={key}
              size={size}
              onClick={itemProps.onClick || (() => {})}
              disabled={itemProps.disabled || false}
            >
              {itemProps.label || 'Button'}
            </Button>
          );
      }
    } catch (error) {
      console.warn('Error rendering toolbar item:', key, error);
      return null;
    }
  };

  return (
    <div className={`toolbar-qgs toolbar-qgs--${size}`}>
      {items.filter(item => item && item.key).map(renderItem)}
    </div>
  );
};

ToolbarQGS.propTypes = {
  items: PropTypes.arrayOf(PropTypes.shape({
    key: PropTypes.string.isRequired,
    type: PropTypes.oneOf(['action', 'tool', 'select', 'switch', 'selectButton']),
    label: PropTypes.string,
    onClick: PropTypes.func,
    disabled: PropTypes.bool,
    icon: PropTypes.string,
    title: PropTypes.string,
    circular: PropTypes.bool,
    options: PropTypes.array,
    value: PropTypes.any,
    onChange: PropTypes.func,
    placeholder: PropTypes.string,
    checked: PropTypes.bool,
    labelPosition: PropTypes.oneOf(['left', 'right'])
  })),
  size: PropTypes.oneOf(['small', 'medium', 'large']),
  selectedTool: PropTypes.string,
  onToolChange: PropTypes.func
};

ToolbarQGS.defaultProps = {
  items: [],
  size: 'medium',
  selectedTool: null,
  onToolChange: () => {}
};

export default ToolbarQGS;