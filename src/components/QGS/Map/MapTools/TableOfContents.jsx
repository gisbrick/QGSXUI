import React, { useState, useMemo, useCallback, useEffect, useRef } from 'react';
import PropTypes from 'prop-types';
import { useMap } from '../MapProvider';
import { QgisConfigContext } from '../../QgisConfigContext';
import TreeView from '../../../UI/TreeView/TreeView';
import { Button } from '../../../UI';
import { layerIsBaseLayer } from '../../../../utilities/mapUtilities';
import { fetchLegend } from '../../../../services/qgisConfigFetcher';
import './TableOfContents.css';

/**
 * Componente principal de Tabla de Contenidos
 * Muestra el árbol de capas con checkboxes para controlar la visibilidad
 */
const TableOfContents = ({ onShowTable }) => {
  const mapContext = useMap();
  const configContext = React.useContext(QgisConfigContext);

  const {
    config,
    refreshWMSLayer,
    t,
    qgsUrl,
    qgsProjectPath,
    token
  } = mapContext || configContext || {};


  const translate = typeof t === 'function' ? t : (key, defaultEs, defaultEn) => defaultEs || key;

  // Obtener baseLayersConfig del mapa si está disponible
  const baseLayersConfig = mapContext?.mapInstance?.WMTSLAYERS || null;

  // Estado para las leyendas
  const [legendData, setLegendData] = useState(null);
  const [legendLoading, setLegendLoading] = useState(false);

  // Construir el árbol de datos desde layerTree
  const { treeData, expandedKeys, checkedKeys } = useMemo(() => {
    if (!config?.layerTree) {
      return { treeData: [], expandedKeys: [], checkedKeys: [] };
    }

    const disablewkbTypeNames = ['NoGeometry'];
    const expanded = [];
    const checked = [];

    const addChild = (child, parentNode = null, path = []) => {
      // Generar un ID estable basado en el path completo del nodo
      // Esto asegura que el mismo nodo siempre tenga el mismo ID
      const nodePath = [...path, child.name || 'group'].join('|');
      const uid = `toc_${nodePath}`;
      
      if (child.children && Array.isArray(child.children) && child.children.length > 0) {
        // Es un grupo
        const childrenNodes = [];
        
        child.children.forEach(subChild => {
          const subNode = addChild(subChild, { id: uid }, [...path, child.name || 'group']);
          if (subNode) {
            childrenNodes.push(subNode);
          }
        });

        // Solo añadir el grupo si tiene hijos válidos
        if (childrenNodes.length === 0) {
          return null;
        }

        // Estado expandido
        if (typeof child.isExpanded !== 'boolean') {
          child.isExpanded = child.isExpanded === true || child.isExpanded === 'true' || child.isExpanded === 1;
        }
        if (child.isExpanded) {
          expanded.push(uid);
        }

        // Determinar estado del checkbox del grupo basándose en sus hijos
        // Primero, contar cuántos hijos están marcados/visibles
        let checkedCount = 0;
        childrenNodes.forEach(subNode => {
          // Si es un grupo hijo, verificar si tiene al menos un hijo visible
          // (usar isVisible del qgisChild, que se establece durante la construcción recursiva)
          if (subNode.children && subNode.children.length > 0) {
            const childIsVisible = subNode.qgisChild?.isVisible === true || 
                                   subNode.qgisChild?.isVisible === 'true' || 
                                   subNode.qgisChild?.isVisible === 1;
            if (childIsVisible) {
              checkedCount++;
            }
          } else {
            // Si es una capa, verificar su estado checked
            if (subNode.checked) {
              checkedCount++;
            }
          }
        });

        const isChecked = checkedCount === childrenNodes.length && childrenNodes.length > 0;
        const isIndeterminate = checkedCount > 0 && checkedCount < childrenNodes.length;
        // Un grupo debe estar visible si tiene AL MENOS UN hijo visible
        const isVisible = checkedCount > 0;

        // Si el grupo está completamente marcado, añadirlo a checked
        if (isChecked) {
          checked.push(uid);
        }

        // Actualizar isVisible en el qgisChild del grupo
        if (child.isVisible !== isVisible) {
          child.isVisible = isVisible;
        }

        return {
          id: uid,
          qgisChild: child,
          label: child.name || '',
          icon: null,
          actions: null,
          children: childrenNodes,
          checked: isChecked,
          indeterminate: isIndeterminate
        };
      } else {
        // Es una capa
        if (!config.layers || !config.layers[child.name]) {
          return null;
        }

        const qgisLayer = config.layers[child.name];

        // Filtrar: no capas base, no tablas alfanuméricas (NoGeometry)
        if (baseLayersConfig && layerIsBaseLayer(child.name, baseLayersConfig)) {
          return null;
        }

        // Solo capas vectoriales o WMS (no tablas alfanuméricas)
        if (qgisLayer.wkbType_name && disablewkbTypeNames.includes(qgisLayer.wkbType_name)) {
          return null;
        }

        // Verificar si es vectorial o WMS
        const isVector = qgisLayer.classType === 'QgsVectorLayer' && 
                        qgisLayer.wkbType_name && 
                        !disablewkbTypeNames.includes(qgisLayer.wkbType_name);
        const isWMS = qgisLayer.providerType === 'wms' || qgisLayer.classType === 'QgsRasterLayer';

        if (!isVector && !isWMS) {
          return null;
        }

        // Icono de leyenda
        // Solo mostrar icono si es leyenda simple (no categorizada, graduada, etc.)
        // Prioridad: 1) LEGEND con icon base64, 2) qgisLayer.url
        let icon = null;
        
        // Buscar leyenda en LEGEND
        const legendItem = legendData?.find((layer) => layer.title === child.name);
        
        // Verificar si tiene símbolos categorizados (incluye graduados, reglas, etc.)
        const hasCategorizedSymbols = legendItem && 
          legendItem.symbols && 
          Array.isArray(legendItem.symbols) && 
          legendItem.symbols.length > 0;
        
        // Si tiene símbolos categorizados, NO mostrar icono junto al nombre (se mostrarán en el desplegable)
        if (!hasCategorizedSymbols) {
          if (legendItem && legendItem.icon) {
            // Leyenda simple con icon
            const base64Image = legendItem.icon;
            const svgCode = `data:image/png;base64,${base64Image}`;
            icon = (
              <svg
                width="20"
                height="20"
                className="table-of-contents__legend-icon"
                style={{ flexShrink: 0 }}
              >
                <image
                  width="20"
                  height="20"
                  x="0"
                  y="0"
                  preserveAspectRatio="xMidYMid meet"
                  href={svgCode}
                />
              </svg>
            );
          } else if (qgisLayer.url) {
            // Fallback: usar qgisLayer.url si no hay leyenda en LEGEND
            icon = (
              <img 
                src={qgisLayer.url} 
                alt={child.name}
                className="table-of-contents__legend-icon"
                onError={() => {}}
              />
            );
          }
        }

        // Acciones (botón Ver tabla)
        let actions = null;
        if (isVector && qgisLayer.WFSCapabilities?.allowQuery) {
          actions = (
            <Button
              type="button"
              size="small"
              variant="ghost"
              onClick={(e) => {
                e.stopPropagation();
                if (onShowTable) {
                  onShowTable(child.name);
                }
              }}
              title={translate('ui.map.tableOfContents.showTable', 'Ver tabla', 'Show table')}
              aria-label={translate('ui.map.tableOfContents.showTable', 'Ver tabla', 'Show table')}
            >
              <i className="fas fa-table" aria-hidden="true" />
            </Button>
          );
        }

        // Estado de visibilidad
        if (typeof child.isVisible !== 'boolean') {
          child.isVisible = child.isVisible === true || child.isVisible === 'true' || child.isVisible === 1;
        }

        if (child.isVisible) {
          checked.push(uid);
        }

        // Si hay símbolos categorizados, añadirlos como children
        let legendChildren = [];
        if (legendItem && legendItem.symbols && Array.isArray(legendItem.symbols) && legendItem.symbols.length > 0) {
          // Expandir automáticamente la capa si tiene símbolos categorizados
          expanded.push(uid);
          
          legendChildren = legendItem.symbols.map((symbol, index) => {
            const symbolUid = `${uid}_symbol_${index}`;
            let symbolIcon = null;
            
            if (symbol.icon) {
              const base64Image = symbol.icon;
              const svgCode = `data:image/png;base64,${base64Image}`;
              symbolIcon = (
                <svg
                  width="16"
                  height="16"
                  className="table-of-contents__legend-icon"
                  style={{ flexShrink: 0 }}
                >
                  <image
                    width="16"
                    height="16"
                    x="0"
                    y="0"
                    preserveAspectRatio="xMidYMid meet"
                    href={svgCode}
                  />
                </svg>
              );
            }
            
            return {
              id: symbolUid,
              qgisChild: null, // Los símbolos no son capas QGIS
              label: symbol.title || '',
              icon: symbolIcon,
              actions: null,
              children: [],
              checked: false,
              isLegendSymbol: true // Marca para identificar que es un símbolo de leyenda
            };
          });
        }

        return {
          id: uid,
          qgisChild: child,
          label: child.name.replace(/_/g, ' '),
          icon: icon,
          actions: actions,
          children: legendChildren,
          checked: child.isVisible
        };
      }
    };

    const treeDataBase = [];
    const children = config.layerTree.children || (config.layerTree.nodeType ? [config.layerTree] : []);
    
    children.forEach(child => {
      const node = addChild(child, null, []);
      if (node) {
        treeDataBase.push(node);
      }
    });

    // Limpiar grupos vacíos recursivamente
    const cleanEmptyGroups = (nodes) => {
      return nodes.filter(node => {
        if (node.children && node.children.length > 0) {
          node.children = cleanEmptyGroups(node.children);
          return node.children.length > 0;
        }
        return true;
      });
    };

    const cleanedTree = cleanEmptyGroups(treeDataBase);

    return {
      treeData: cleanedTree,
      expandedKeys: expanded,
      checkedKeys: checked
    };
  }, [config, baseLayersConfig, legendData, qgsUrl, qgsProjectPath, token, translate, onShowTable]);

  const [expandedNodes, setExpandedNodes] = useState(new Set(expandedKeys || []));
  const [checkedNodes, setCheckedNodes] = useState(new Set(checkedKeys || []));
  
  // Estado para forzar re-render cuando cambien las propiedades de los nodos
  const [treeDataVersion, setTreeDataVersion] = useState(0);

  // Referencia para saber si es la primera vez que se monta el componente
  const isInitialMountRef = useRef(true);

  // Cargar leyendas cuando cambie la configuración
  useEffect(() => {
    if (!config?.layers || !qgsUrl || !qgsProjectPath) {
      return;
    }

    // Obtener todos los nombres de capas del proyecto
    const layerNames = Object.keys(config.layers);
    if (layerNames.length === 0) {
      return;
    }

    setLegendLoading(true);
    fetchLegend(qgsUrl, qgsProjectPath, layerNames, token)
      .then((data) => {
        if (data?.nodes && Array.isArray(data.nodes)) {
          setLegendData(data.nodes);
        }
      })
      .catch((error) => {
        console.warn('[TableOfContents] Error al cargar leyendas:', error);
        // No mostrar error al usuario, simplemente no mostrar leyendas
      })
      .finally(() => {
        setLegendLoading(false);
      });
  }, [config, qgsUrl, qgsProjectPath, token]);

  // Función para forzar actualización del árbol
  const forceTreeUpdate = useCallback(() => {
    setTreeDataVersion(prev => prev + 1);
  }, []);

  // Sincronizar solo la primera vez cuando cambie treeData
  // Después, mantener el estado del usuario (expandedNodes y checkedNodes)
  useEffect(() => {
    if (isInitialMountRef.current) {
      if (expandedKeys && expandedKeys.length > 0) {
        setExpandedNodes(new Set(expandedKeys));
      }
      if (checkedKeys && checkedKeys.length > 0) {
        setCheckedNodes(new Set(checkedKeys));
      }
      isInitialMountRef.current = false;
    }
    // Después de la primera vez, NO sobrescribir expandedNodes ni checkedNodes
    // El usuario puede haber cambiado el estado de expansión manualmente
    // y checkedNodes se actualiza en handleCheck
  }, [expandedKeys, checkedKeys]);

  // Función helper para encontrar un nodo en el árbol por su ID
  const findNodeById = useCallback((nodes, targetId) => {
    for (const node of nodes) {
      if (node.id === targetId) {
        return node;
      }
      if (node.children && node.children.length > 0) {
        const found = findNodeById(node.children, targetId);
        if (found) return found;
      }
    }
    return null;
  }, []);

  // Función helper para obtener todos los nodos descendientes recursivamente
  const getAllDescendants = useCallback((node) => {
    const descendants = [];
    if (node.children && node.children.length > 0) {
      node.children.forEach(child => {
        descendants.push(child);
        // Recursivamente obtener los descendientes de los hijos
        const childDescendants = getAllDescendants(child);
        descendants.push(...childDescendants);
      });
    }
    return descendants;
  }, []);

  // Función helper para encontrar todos los padres de un nodo
  const findParents = useCallback((nodes, targetId, parents = []) => {
    for (const node of nodes) {
      if (node.id === targetId) {
        return parents;
      }
      if (node.children && node.children.length > 0) {
        const found = findParents(node.children, targetId, [...parents, node]);
        if (found !== null) return found;
      }
    }
    return null;
  }, []);

  // Función helper para recalcular el estado de un grupo basándose en sus hijos
  const recalculateGroupState = useCallback((groupNode, checkedNodesSet) => {
    if (!groupNode.children || groupNode.children.length === 0) {
      return;
    }

    // Primero recalcular el estado de todos los grupos hijos recursivamente
    groupNode.children.forEach(child => {
      if (child.children && child.children.length > 0) {
        recalculateGroupState(child, checkedNodesSet);
      }
    });

    // Contar cuántos hijos están marcados (después de recalcular grupos hijos)
    let checkedCount = 0;
    groupNode.children.forEach(child => {
      // Si es un grupo hijo, verificar si tiene al menos un hijo visible
      // (usar isVisible del qgisChild, que se actualiza en recalculateGroupState)
      if (child.children && child.children.length > 0) {
        // Un grupo hijo se cuenta como "visible" si tiene isVisible: true
        // (lo cual significa que tiene al menos un hijo visible)
        const childIsVisible = child.qgisChild?.isVisible === true || 
                                child.qgisChild?.isVisible === 'true' || 
                                child.qgisChild?.isVisible === 1;
        if (childIsVisible) {
          checkedCount++;
        }
      } else {
        // Si es una capa, verificar si está en checkedNodesSet
        if (checkedNodesSet.has(child.id)) {
          checkedCount++;
        }
      }
    });

    const totalChildren = groupNode.children.length;
    const isChecked = checkedCount === totalChildren;
    const isIndeterminate = checkedCount > 0 && checkedCount < totalChildren;
    // Un grupo debe estar visible si tiene AL MENOS UN hijo visible
    // Esto permite que getVisibleLayersInChildren pueda recorrer sus hijos y encontrar las capas visibles
    const isVisible = checkedCount > 0;

    // Actualizar las propiedades del nodo
    groupNode.checked = isChecked;
    groupNode.indeterminate = isIndeterminate;

    // Actualizar el estado en checkedNodes
    if (isChecked) {
      checkedNodesSet.add(groupNode.id);
    } else {
      checkedNodesSet.delete(groupNode.id);
    }

    // Actualizar isVisible en el qgisChild del grupo (los grupos también tienen qgisChild)
    // IMPORTANTE: Un grupo debe estar visible si tiene al menos un hijo visible,
    // no solo si todos están visibles. Esto permite que getVisibleLayersInChildren
    // pueda recorrer sus hijos y encontrar las capas visibles.
    if (groupNode.qgisChild) {
      groupNode.qgisChild.isVisible = isVisible;
    }
  }, []);

  // Manejar cambio de checkbox
  const handleCheck = useCallback((nodeId, checked, node) => {
    // Buscar el nodo completo en la estructura del árbol
    const fullNode = findNodeById(treeData, nodeId);
    if (!fullNode) {
      console.warn(`[TableOfContents] No se encontró el nodo con ID: ${nodeId}`);
      return;
    }

    setCheckedNodes(prev => {
      const newChecked = new Set(prev);
      
      // Actualizar el nodo actual
      if (checked) {
        newChecked.add(nodeId);
      } else {
        newChecked.delete(nodeId);
      }

      // Actualizar isVisible en el qgisChild del nodo actual
      if (fullNode.qgisChild) {
        fullNode.qgisChild.isVisible = checked;
      }

      // Obtener todos los descendientes recursivamente
      const allDescendants = getAllDescendants(fullNode);
      
      // Actualizar todos los descendientes
      allDescendants.forEach(descendant => {
        if (checked) {
          newChecked.add(descendant.id);
        } else {
          newChecked.delete(descendant.id);
        }
        
        // Actualizar isVisible en el qgisChild de cada descendiente
        if (descendant.qgisChild) {
          descendant.qgisChild.isVisible = checked;
        }
      });

      // Si el nodo actual es un grupo, primero recalcular el estado de todos sus grupos hijos
      // (esto asegura que los grupos hijos tengan su estado correcto antes de recalcular el grupo padre)
      if (fullNode.children && fullNode.children.length > 0) {
        // Recalcular recursivamente todos los grupos hijos
        const recalculateAllChildGroups = (node) => {
          if (node.children && node.children.length > 0) {
            node.children.forEach(child => {
              if (child.children && child.children.length > 0) {
                recalculateGroupState(child, newChecked);
                recalculateAllChildGroups(child);
              }
            });
          }
        };
        recalculateAllChildGroups(fullNode);
        
        // Ahora recalcular el estado del grupo actual
        recalculateGroupState(fullNode, newChecked);
      }

      // SIEMPRE recalcular el estado de todos los grupos padres (incluso si el nodo actual es una capa)
      // Esto es crucial para que los grupos se actualicen correctamente cuando cambia una capa dentro de ellos
      const parents = findParents(treeData, nodeId);
      if (parents && parents.length > 0) {
        // Primero recalcular todos los grupos hijos de cada padre recursivamente
        parents.forEach(parent => {
          const recalculateAllChildGroups = (node) => {
            if (node.children && node.children.length > 0) {
              node.children.forEach(child => {
                if (child.children && child.children.length > 0) {
                  recalculateGroupState(child, newChecked);
                  recalculateAllChildGroups(child);
                }
              });
            }
          };
          recalculateAllChildGroups(parent);
        });
        // Luego recalcular desde el padre más cercano hasta el más lejano
        parents.reverse().forEach(parent => {
          recalculateGroupState(parent, newChecked);
        });
      }

      return newChecked;
    });

    // Forzar re-render del árbol después de actualizar el estado
    // para que se reflejen los cambios en indeterminate y checked de los grupos
    setTimeout(() => {
      forceTreeUpdate();
    }, 0);

    // Refrescar la capa WMS después de un pequeño delay para agrupar cambios
    if (refreshWMSLayer) {
      setTimeout(() => {
        refreshWMSLayer();
      }, 100);
    }
  }, [treeData, findNodeById, getAllDescendants, findParents, recalculateGroupState, refreshWMSLayer, forceTreeUpdate]);

  if (!config || !treeData || treeData.length === 0) {
    return (
      <div className="table-of-contents__empty">
        {translate('ui.map.tableOfContents.noLayers', 'No hay capas disponibles', 'No layers available')}
      </div>
    );
  }

  // Manejar cambio de expansión/colapso
  const handleToggle = useCallback((nodeId, isExpanded, allExpandedNodes) => {
    setExpandedNodes(new Set(allExpandedNodes));
  }, []);

  return (
    <div className="table-of-contents">
      <TreeView
        key={treeDataVersion} // Forzar re-render cuando cambien las propiedades de los nodos
        data={treeData}
        checkable={true}
        defaultExpandedNodes={Array.from(expandedNodes)}
        defaultCheckedNodes={Array.from(checkedNodes)}
        onCheck={handleCheck}
        onToggle={handleToggle}
        locale={configContext?.language || 'es'}
      />
    </div>
  );
};

TableOfContents.propTypes = {
  onShowTable: PropTypes.func,
};

export default TableOfContents;
