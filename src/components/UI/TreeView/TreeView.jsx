import React, { useState, useCallback, useMemo } from 'react';
import PropTypes from 'prop-types';
import { useUITranslation } from '../../../hooks/useTranslation';
import './TreeView.css';

const TreeNode = React.memo(({ 
  node, 
  onSelect, 
  selectedNode, 
  onToggle, 
  expandedNodes, 
  level = 0,
  onKeyDown,
  t
}) => {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expandedNodes.has(node.id);
  const isSelected = selectedNode === node.id;

  const handleToggle = useCallback((e) => {
    e.stopPropagation();
    if (hasChildren) {
      onToggle(node.id);
    }
  }, [hasChildren, onToggle, node.id]);

  const handleSelect = useCallback(() => {
    onSelect(node);
  }, [onSelect, node]);

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
        
        {node.icon && <span className="tree-node__icon" aria-hidden="true">{node.icon}</span>}
        <span className="tree-node__label">{node.label}</span>
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
  locale,
  translations
}) => {
  const [expandedNodes, setExpandedNodes] = useState(new Set(defaultExpandedNodes));
  const { t } = useUITranslation('ui.treeView', { locale, translations });

  const handleToggle = useCallback((nodeId) => {
    setExpandedNodes(prev => {
      const newExpanded = new Set(prev);
      if (newExpanded.has(nodeId)) {
        newExpanded.delete(nodeId);
      } else {
        newExpanded.add(nodeId);
      }
      return newExpanded;
    });
  }, []);

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
    children: PropTypes.array,
  })).isRequired,
  onSelect: PropTypes.func,
  selectedNode: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  defaultExpandedNodes: PropTypes.array,
  locale: PropTypes.string,
  translations: PropTypes.object,
};

TreeView.defaultProps = {
  onSelect: () => {},
  selectedNode: null,
  defaultExpandedNodes: [],
};

export default TreeView;