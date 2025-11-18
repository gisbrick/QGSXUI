import { Button, Drawer, Tooltip } from 'antd';
import React, { useEffect, useRef, useState } from 'react';
import 'font-gis/css/font-gis.css';
import { Tree } from 'antd';
import { ConfigMapContext } from '../../../../context/configMapProvider';
import { useContext } from 'react';
import SLDParser from "geostyler-sld-parser";
import LegendRenderer from 'geostyler-legend/dist/LegendRenderer/LegendRenderer';
//import LegendRenderer from "LegendRenderer";



const ToolLayers = ({ mapView, selectedTool, setSelectedTool, action }) => {
    //Iconos:
    //https://viglino.github.io/font-gis/

    const [showDrawer, setShowDrawer] = useState();
    const { config, setConfig, dataPath } = useContext(ConfigMapContext)

    const [layerItems, setLayerItems] = useState([]);

    useEffect(() => {
        if (config && config.layers) {
            let layers = [];
            // Crea los elementos del árbol a partir de la configuración
            config.layers.map((layer, i) => {
                let item = {
                    value: layer.name, // Nombre de la capa
                    title: <LayerSymbol layer={layer} dataPath={dataPath} />, // Nombre de la capa
                    checked: config.layers[i].visible,//layer.visible, //TODO Cambiar cuando lo añadamos al config
                    key: i, // ID de la capa             
                };
                layers.push(item);
            });
            setLayerItems(layers);
        }
    }, [config])

    const onCheck = (selectedKeys, info) => {


        let _layerItems = [...layerItems];
        _layerItems[info.node.key].checked = info.checked; // Cambia el estado de la capa seleccionada
        setLayerItems(_layerItems);


        let _config = { ...config };

        for (let i in _config.layers) {
            let layer = _config.layers[i];
            if (layer.name == info.node.value) {
                layer.visible = info.checked; // Cambia el estado de la capa seleccionada
            }
        }

        setConfig(_config); // Actualiza la configuración del mapa
    };


    return (
        <>
            <Tooltip title={"Capas"}>
                <Button type="primary" shape="circle" size='large'
                    onMouseOver={(e) => window.mouseOverButton = true}
                    onMouseOut={(e) => window.mouseOverButton = false}
                    onClick={() => setShowDrawer(true)}>
                    {<i className="fg-layers"></i>}
                </Button>
            </Tooltip>
            <Drawer
                title="Capas"
                placement="right"
                onMouseOver={(e) => window.mouseOverButton = true}
                onMouseOut={(e) => window.mouseOverButton = false}
                closable={true}
                onClose={() => setShowDrawer(false)}
                open={showDrawer}
                width={400}>
                <>
                    <Tree
                        checkable
                        showLine={false}
                        checkedKeys={layerItems.filter(item => item.checked).map(item => item.key)}
                        onCheck={onCheck}
                        treeData={layerItems}></Tree>
                </>
            </Drawer>
        </>
    );
};

export default ToolLayers;


const LayerSymbol = ({ layer, dataPath }) => {

    const [uid, setUid] = useState();
    const divRef = useRef(null); // Crear una referencia al div


    useEffect(() => {
        setUid(layer.name + Math.random().toString(36).substring(2, 15)); // Generar un ID único para el div
        getIconResponse();
    }, [])

    useEffect(() => {
        if (uid) {
            getIconResponse();
        }
    }, [uid])


    const getIconResponse = async () => {
        // Cargar el SLD
        const sldResponse = await fetch(`${dataPath}/${layer.sld}`);
        const sldData = await sldResponse.text();
        const parser = new SLDParser();

        const geostylerStyle = await parser.readStyle(sldData);

        //console.log("geostylerStyle", geostylerStyle);

        // Quitamos todos los nombres de las reglas
        geostylerStyle.output.rules.forEach(rule => {
            rule.name = rule.name.replace("Single symbol", "");// Cambia el nombre de la regla sumple
        });

        const renderer = new LegendRenderer({
            maxColumnWidth: 300,
            overflow: 'auto',
            styles: [geostylerStyle.output],
            size: [600, 300],
            querySelector: () => { }
        });

        renderer.render(document.getElementById(uid));
    }

    return (
        <>
            {uid && <div ref={divRef} id={uid}>
            </div>}
        </>

    )

}
