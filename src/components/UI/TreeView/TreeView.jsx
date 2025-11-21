import React, { useState, useCallback, useMemo, useEffect } from 'react';
import PropTypes from 'prop-types';
import { useUITranslation } from '../../../hooks/useTranslation';
import './TreeView.css';

const TreeNode = React.memo(({ 
  node, 
  onSelect, 
  selectedNode, 
  onToggle, 
  expandedNodes, 
  checkedNodes,
  onCheck,
  checkable = false,
  level = 0,
  onKeyDown,
  t
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedNode === node.id;
  const isChecked = checkedNodes.has(node.id);
  const isIndeterminate = node.indeterminate || false;

  const handleToggle = useCallback((e) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggle(node.id);
    }
  }, [hasChildren, onToggle, node.id]);

  const handleSelect = useCallback(() => {
    onSelect(node);
  }, [onSelect, node]);

  const handleCheck = useCallback((e) => {
    e.stopPropagation();
    if (checkable && onCheck) {
      onCheck(node.id, !isChecked, node);
    }
  }, [checkable, onCheck, node.id, isChecked, node]);

  const handleKeyDown = useCallback((e) => {
    onKeyDown(e, node, hasChildren, isExpanded);
  }, [onKeyDown, node, hasChildren, isExpanded]);

  return (
    <div className="tree-node" role="treeitem" aria-expanded={hasChildren ? isExpanded : undefined}>
      <div 
        className={`tree-node__content ${isSelected ? 'tree-node__content--selected' : ''}`}
        style={{ paddingLeft: `${level * 20 + 8}px` }}
        onClick={handleSelect}
        onKeyDown={handleKeyDown}
        tabIndex={isSelected ? 0 : -1}
        role="button"
        aria-selected={isSelected}
        aria-level={level + 1}
        data-node-id={node.id}
      >
        {hasChildren && (
          <button 
            className={`tree-node__toggle ${isExpanded ? 'tree-node__toggle--expanded' : ''}`}
            onClick={handleToggle}
            aria-label={isExpanded ? `Collapse ${node.label}` : `Expand ${node.label}`}
            tabIndex={-1}
          >
            ▶
          </button>
        )}
        {!hasChildren && <span className="tree-node__spacer" />}
        
        {checkable && !node.isLegendSymbol && (
          <input
            type="checkbox"
            className="tree-node__checkbox"
            checked={isChecked}
            onChange={handleCheck}
            onClick={(e) => e.stopPropagation()}
            ref={(el) => {
              if (el) {
                el.indeterminate = isIndeterminate;
              }
            }}
            tabIndex={-1}
            aria-label={`${isChecked ? 'Uncheck' : 'Check'} ${node.label}`}
          />
        )}
        
        {node.icon && <span className="tree-node__icon" aria-hidden="true">{node.icon}</span>}
        <span className="tree-node__label">{node.label}</span>
        {node.actions && <span className="tree-node__actions">{node.actions}</span>}
      </div>
      
      {hasChildren && isExpanded && (
        <div className="tree-node__children" role="group">
          {node.children.map(child => (
            <TreeNode
              key={child.id}
              node={child}
              onSelect={onSelect}
              selectedNode={selectedNode}
              onToggle={onToggle}
              expandedNodes={expandedNodes}
              checkedNodes={checkedNodes}
              onCheck={onCheck}
              checkable={checkable}
              level={level + 1}
              onKeyDown={onKeyDown}
              t={t}
            />
          ))}
        </div>
      )}
    </div>
  );
});

TreeNode.displayName = 'TreeNode';

const TreeView = ({ 
  data, 
  onSelect, 
  selectedNode, 
  defaultExpandedNodes = [],
  defaultCheckedNodes = [],
  checkable = false,
  onCheck,
  onToggle: onToggleProp,
  locale,
  translations
}) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set(defaultExpandedNodes));
  const [checkedNodes, setCheckedNodes] = useState(new Set(defaultCheckedNodes));
  const { t } = useUITranslation('ui.treeView', { locale, translations });

  // Sincronizar checkedNodes cuando cambien los datos o defaultCheckedNodes
  useEffect(() => {
    if (defaultCheckedNodes.length > 0) {
      setCheckedNodes(new Set(defaultCheckedNodes));
    }
  }, [defaultCheckedNodes]);

  // Sincronizar expandedNodes cuando cambien defaultExpandedNodes (solo si no hay callback onToggle)
  useEffect(() => {
    if (!onToggleProp && defaultExpandedNodes.length > 0) {
      setExpandedNodes(new Set(defaultExpandedNodes));
    }
  }, [defaultExpandedNodes, onToggleProp]);

  const handleToggle = useCallback((nodeId) => {
    const newExpanded = new Set(expandedNodes);
    if (newExpanded.has(nodeId)) {
      newExpanded.delete(nodeId);
    } else {
      newExpanded.add(nodeId);
    }
    
    // Actualizar el estado interno siempre
    setExpandedNodes(newExpanded);
    
    // Si hay un callback, notificar al componente padre
    if (onToggleProp) {
      onToggleProp(nodeId, newExpanded.has(nodeId), Array.from(newExpanded));
    }
  }, [expandedNodes, onToggleProp]);

  const handleCheck = useCallback((nodeId, checked, node) => {
    setCheckedNodes(prev => {
      const newChecked = new Set(prev);
      if (checked) {
        newChecked.add(nodeId);
      } else {
        newChecked.delete(nodeId);
      }
      
      // Si tiene hijos, actualizar también los hijos
      if (node.children && node.children.length > 0) {
        const updateChildren = (children) => {
          children.forEach(child => {
            if (checked) {
              newChecked.add(child.id);
            } else {
              newChecked.delete(child.id);
            }
            if (child.children && child.children.length > 0) {
              updateChildren(child.children);
            }
          });
        };
        updateChildren(node.children);
      }
      
      return newChecked;
    });
    
    if (onCheck) {
      onCheck(nodeId, checked, node);
    }
  }, [onCheck]);

  const flattenNodes = useCallback((nodes, level = 0) => {
    let result = [];
    nodes.forEach(node => {
      result.push({ ...node, level });
      if (node.children && expandedNodes.has(node.id)) {
        result = result.concat(flattenNodes(node.children, level + 1));
      }
    });
    return result;
  }, [expandedNodes]);

  const flatNodes = useMemo(() => flattenNodes(data), [data, flattenNodes]);

  const handleKeyDown = useCallback((e, node, hasChildren, isExpanded) => {
    const currentIndex = flatNodes.findIndex(n => n.id === node.id);
    let nextIndex = currentIndex;

    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault();
        nextIndex = Math.min(currentIndex + 1, flatNodes.length - 1);
        break;
      case 'ArrowUp':
        e.preventDefault();
        nextIndex = Math.max(currentIndex - 1, 0);
        break;
      case 'ArrowRight':
        e.preventDefault();
        if (hasChildren && !isExpanded) {
          handleToggle(node.id);
        } else if (hasChildren && isExpanded) {
          nextIndex = Math.min(currentIndex + 1, flatNodes.length - 1);
        }
        break;
      case 'ArrowLeft':
        e.preventDefault();
        if (hasChildren && isExpanded) {
          handleToggle(node.id);
        } else if (node.level > 0) {
          // Find parent
          for (let i = currentIndex - 1; i >= 0; i--) {
            if (flatNodes[i].level < node.level) {
              nextIndex = i;
              break;
            }
          }
        }
        break;
      case 'Enter':
      case ' ':
        e.preventDefault();
        onSelect(node);
        break;
      default:
        return;
    }

    if (nextIndex !== currentIndex) {
      const nextNode = flatNodes[nextIndex];
      const nextElement = document.querySelector(`[data-node-id="${nextNode.id}"]`);
      if (nextElement) {
        nextElement.focus();
      }
    }
  }, [flatNodes, handleToggle, onSelect]);

  return (
    <div className="tree-view" role="tree" aria-label="Tree view">
      {data.map(node => (
        <TreeNode
          key={node.id}
          node={node}
          onSelect={onSelect}
          selectedNode={selectedNode}
          onToggle={handleToggle}
          expandedNodes={expandedNodes}
          checkedNodes={checkedNodes}
          onCheck={handleCheck}
          checkable={checkable}
          onKeyDown={handleKeyDown}
          t={t}
        />
      ))}
    </div>
  );
};

TreeView.propTypes = {
  data: PropTypes.arrayOf(PropTypes.shape({
    id: PropTypes.oneOfType([PropTypes.string, PropTypes.number]).isRequired,
    label: PropTypes.string.isRequired,
    icon: PropTypes.node,
    actions: PropTypes.node,
    children: PropTypes.array,
    indeterminate: PropTypes.bool,
  })).isRequired,
  onSelect: PropTypes.func,
  selectedNode: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  defaultExpandedNodes: PropTypes.array,
  defaultCheckedNodes: PropTypes.array,
  checkable: PropTypes.bool,
  onCheck: PropTypes.func,
  onToggle: PropTypes.func,
  locale: PropTypes.string,
  translations: PropTypes.object,
};

TreeView.defaultProps = {
  onSelect: () => {},
  selectedNode: null,
  defaultExpandedNodes: [],
  defaultCheckedNodes: [],
  checkable: false,
  onCheck: null,
};

export default TreeView;
