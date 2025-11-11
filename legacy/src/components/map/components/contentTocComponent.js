import { useState, useEffect } from "react";
import i18next from "i18next";
import { Tree, Popover } from "antd";
import Icon from "@ant-design/icons/lib/components/Icon";
import { v4 as uuid } from 'uuid';

import LayerTreeItemComponent from "./layerTreeItemComponent";
import { getWMSLayer, layerIsBaseLayer } from "../../../utilities/mapUtils";
import ImageLegend from "./ImageLegend";


function ContentTocComponent({ QGISPRJ, WMTSLAYERS, LEGEND, map, mapView, setShowDrawerToc, showDrawerToc, letterSizeLegend, letterColorLegend, letterTypeLegend }) {

  const [treeData, setTreeData] = useState();
  const [defaultExpandedKeys, setDefaultExpandedKeys] = useState();
  const [defaultSelectedKeys, setDefaultSelectedKeys] = useState();
  const [defaultCheckedKeys, setDefaultCheckedKeys] = useState();

  let keyQGisLayers = {};


  const disablewkbTypeNames = ["NoGeometry"];

  useEffect(() => {
    //console.log("Proyecto QGIS", QGISPRJ)
    //console.log("layerTree", QGISPRJ.layerTree)
    //console.log(QGISPRJ.layerTree.children)
    initTreeData();
  }, [])


  const onSelect = (selectedKeys, info) => {
  };


  const onCheck = (checkedKeys, info) => {

    let node = info.node;
    /*
    console.log("onCheck info", info)
    console.log("onCheck node", node)
    console.log("onCheck checkedKeys", checkedKeys)
    console.log("onCheck keyQGisLayers", keyQGisLayers)
    console.log("onCheck treeData", treeData)

    treeData.forEach((item)=>{
      console.log("forEach item", item)
    });*/


    const refreshWMSLayer = async () => {
      if (mapView.wmsLayer) mapView.wmsLayer.remove();
      var wmsLayer = await getWMSLayer(mapView);
      if (wmsLayer) {
        wmsLayer.addTo(mapView);
        mapView.wmsLayer = wmsLayer;
      }
    }

    const iterateChildren = (node) => {
      if (node.children) {
        for (var i in node.children) {
          var subnode = node.children[i];
          subnode.qgisChild.isVisible = !subnode.checked;
          //subnode.qgisChild.isVisible = info.node.checked;
          //console.log(subnode.qgisChild)
          //console.log(node.checked)
          if (subnode.children) {
            iterateChildren(subnode);
          }
        }
      }
    }

    node.qgisChild.isVisible = !node.checked;

    if (node.children) {
      iterateChildren(node);
    }
    else {
      const evalParents = (qgisChild) => {
        if (qgisChild.parent
          && info.halfCheckedKeys.includes(node.qgisChild.parent.key)) {
          qgisChild.parent.qgisChild.isVisible = true;

          if (qgisChild.parent.children) {
            for (let i in qgisChild.parent.children) {
              let child = qgisChild.parent.children[i]
              if (info.halfCheckedKeys.includes(child.key)
                || checkedKeys.includes(child.key)) {
                child.qgisChild.isVisible = true;
              }
              else {
                child.qgisChild.isVisible = false;
              }
            }
          }

          evalParents(qgisChild.parent.qgisChild)
        }
      }
      evalParents(node.qgisChild)

    }



    refreshWMSLayer();

  };


  const initTreeData = () => {
    const treeDataBase = [];
    let expandedKeys = [];
    let selectedKeys = [];
    let checkedKeys = [];

    const addChild = (child, parent, expandedKeys, selectedKeys, checkedKeys) => {

      let uid = uuid();
      let node = {
        key: uid,
        qgisChild: child
      }

      keyQGisLayers[uid] = child;

      if (child.children) {
        node['title'] = <span style={{ fontFamily: letterTypeLegend, fontSize: letterSizeLegend + "px", color: letterColorLegend }}>{child.name}</span>;
      }
      else {
        //Si no tenemos la capa en la lista de capas del QGSPRJ, no la añadimos     
        if (!mapView.QGISPRJ.layers.hasOwnProperty(child.name)) {
          return
        }
        //Si tenemos la capa, pero se ha definido el parámetro URBEGIS_LAYER_CONFIG/hide_in_toc, no la añadimos
        if (mapView.QGISPRJ.layers[child.name]
          && mapView.QGISPRJ.layers[child.name].customProperties
          && mapView.QGISPRJ.layers[child.name].customProperties.URBEGIS_LAYER_CONFIG
        ) {
          let URBEGIS_LAYER_CONFIG = JSON.parse(mapView.QGISPRJ.layers[child.name].customProperties.URBEGIS_LAYER_CONFIG)
          if(URBEGIS_LAYER_CONFIG.hasOwnProperty("hide_in_toc") && URBEGIS_LAYER_CONFIG.hide_in_toc){
            return
          }
        }
        /*
        if (!mapView.QGISPRJ.layers.hasOwnProperty(child.name)) {
         return
       }*/

        //aquí se aplica la leyenda uniicono
        node['icon'] = (crearLeyendaIcono(child))
        let leyenda = renderLeyenda(child)
        node['title'] = (<LayerTreeItemComponent map={map} mapView={mapView} child={child} parent={parent} LEGEND={LEGEND} QGISPRJ={QGISPRJ} setShowDrawerToc={setShowDrawerToc} showDrawerToc={showDrawerToc} leyenda={leyenda} letterSizeLegend={letterSizeLegend} letterColorLegend={letterColorLegend} letterTypeLegend={letterTypeLegend}></LayerTreeItemComponent>);


      }


      const addNode = (child, uid, node, expandedKeys, selectedKeys, checkedKeys) => {
        if (child.isExpanded && typeof child.isExpanded != "boolean") {//Nos aseguramos que sea boleano
          child.isExpanded = child.isExpanded.toLowerCase() == 'true';
        }
        if (child.isExpanded) {
          expandedKeys.push(uid)
        }
        if (typeof child.isVisible != "boolean") {//Nos aseguramos que sea boleano
          child.isVisible = child.isVisible.toLowerCase() == 'true';
        }
        if (!node.children && child.isVisible) {//No comprobamos si está checqueado si tiene hijos, ya que en ese caso se gestiona solo
          checkedKeys.push(uid)
        }

        parent.push(node);
      }



      if ('children' in child) {
        node['children'] = [];
        for (var i in child.children) {
          child.children[i].parent = node;
          addChild(child.children[i], node['children'], expandedKeys, selectedKeys, checkedKeys);
        }
      }
      // si tiene hijos, solo añadimos si no está vacio
      if (node['children'] && node['children'].length > 0) {
        addNode(child, uid, node, expandedKeys, selectedKeys, checkedKeys)
      }
      //si no tiene hijos, es porque es una capa. Evaluamos si la añadimos o no en cada caso
      else {
        if (!layerIsBaseLayer(child.name, WMTSLAYERS)) { //No añadimos si es un mapa base
          let qgisLayer = QGISPRJ.layers[child.name];
          if (qgisLayer && qgisLayer.wkbType_name) { //Es una capa vectorial
            if (!disablewkbTypeNames.includes(qgisLayer.wkbType_name)) {//No añadimos si hemos deshabilitado este wkbType_name
              addNode(child, uid, node, expandedKeys, selectedKeys, checkedKeys)
            }
          }
          else { //En el resto de circunstancias, por ahora, añadimos la capa al arbol
            addNode(child, uid, node, expandedKeys, selectedKeys, checkedKeys)
          };
        }
      }
    }

    for (var i in QGISPRJ.layerTree.children) {
      addChild(QGISPRJ.layerTree.children[i], treeDataBase, expandedKeys, selectedKeys, checkedKeys);
    }

    //Revisamos de nuevo el arbol, y quitamos los padres que no tengan hijos
    const delIfEmpty = (array, node, expandedKeys, selectedKeys, checkedKeys) => {
      if (node.children && node.children.length == 0) {
        array = array.splice(array.indexOf(node), 1)
        if (expandedKeys.includes(node.key)) expandedKeys = expandedKeys.splice(expandedKeys.indexOf(node.key), 1)
        if (selectedKeys.includes(node.key)) selectedKeys = selectedKeys.splice(selectedKeys.indexOf(node.key), 1)
        if (checkedKeys.includes(node.key)) checkedKeys = checkedKeys.splice(checkedKeys.indexOf(node.key), 1)
      }
    }

    for (var i in treeDataBase) {
      let node = treeDataBase[i];
      if (node.children) {
        delIfEmpty(treeDataBase, node, expandedKeys, selectedKeys, checkedKeys)
      }
    }
    //console.log("treeDataBase", treeDataBase)
    setTreeData(treeDataBase);
    setDefaultExpandedKeys(expandedKeys);
    setDefaultSelectedKeys(selectedKeys);
    setDefaultCheckedKeys(checkedKeys);
  }

  /**
   * Función que identifica las leyendas con un simbolo. Single Symbol legend. y las crea
   * 
   * @param {*} child 
   * @returns 
   */
  const crearLeyendaIcono = (child) => {
    //console.log("child", child)
    //console.log("LEGEND", LEGEND)
    let icon = null;
    let leyenda = LEGEND.length > 0 ? LEGEND.find((layer) => layer.title == child.name) : null
    if (leyenda) {
      let base64Image = leyenda.icon
      let svgCode = "data:image/png;base64," + base64Image

      const IconSvg = () => (
        <svg
          width="1.5em"
          height="1.6em">
          <g>
            <image
              width="1.5em"
              height="1.5em"
              x="0"
              y="4"
              preserveAspectRatio="none"
              href={svgCode}
            />
          </g>
        </svg>
      );
      const IconLeyend = () => <Icon component={IconSvg} />;
      icon = <IconLeyend />;
    }
    return icon;
  }

  /**
 * Función que crea la leyenda categorizada con sus símbolos y etiquetas
 * 
 * @param {*} symbols 
 */
  const createCategorizedLegend = (symbols) => {
    let arrayLegend = []
    symbols.forEach(symbol => {
      let component = {}
      var uuid = Math.random().toString(36).slice(-6);
      let base64Image = symbol.icon
      let svgCode = "data:image/png;base64," + base64Image
      const IconSvg = () => (
        <svg
          width="1.5em"
          height="1.5em">
          <g>
            <image
              width="1.5em"
              height="1.5em"
              x="0"
              y="4"
              preserveAspectRatio="none"
              href={svgCode}
            />
          </g>
        </svg>
      );
      const IconLeyend = () => <Icon component={IconSvg} />;
      let icon = <IconLeyend />;
      component.key = uuid
      component.name = symbol.title
      component.icon = icon
      arrayLegend.push(component)
    })
    return arrayLegend
  }

  /**
* Función que retorna un popover que contiene la imagen de la leyenda
* @param {*} url 
*/
  const generarPopover = (url) => {
    const content = (
      <div onClick={() => window.open(url, "_blank")} style={{ cursor: "pointer" }}>
        <ImageLegend url={url}></ImageLegend>
      </div>
    );

    return (
      <Popover content={content}>
        <span>
          {i18next.t('common.tools.legend.name')}
        </span>
      </Popover>)
  }

  /**
   * Función que renderiza una leyenda para los elementos que tienen leyenda categorizada o un url de imagen de leyenda
   * 
   * @param {*} child 
   * @returns 
   */
  const renderLeyenda = (child) => {
    let leyenda = LEGEND.find((layer) => layer.title == child.name)
    if (leyenda?.symbols) {
      return createCategorizedLegend(leyenda.symbols)
    }
    else if (leyenda == undefined) {
      let urlLeyenda = QGISPRJ.layers[child.name]?.url
      if (urlLeyenda) {
        return generarPopover(urlLeyenda)
      }
    } else {
      return null;
    }
  }


  return (
    <>
      {treeData && <Tree
        checkable
        showIcon={true}
        defaultExpandedKeys={defaultExpandedKeys}
        defaultSelectedKeys={defaultSelectedKeys}
        defaultCheckedKeys={defaultCheckedKeys}
        onSelect={onSelect}
        onCheck={onCheck}
        treeData={treeData}
      />
      }
    </>
  );
}

export default ContentTocComponent;
