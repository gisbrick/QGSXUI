import React, { useContext, useEffect } from 'react';
import './toolbar.css';
import { Button, Space } from 'antd';
import ToolLocate from './tools/toolLocalte';
import ToolRotate from './tools/toolRotate';
import ToolHome from './tools/toolHome';
import ToolMeasures from './tools/toolMeasures.jsx';
import ToolBaseMaps from './tools/toolBaseMaps.jsx';
import ToolFilter from './tools/toolFilter.jsx';
import ToolList from './tools/toolList.jsx';
import ToolStreetView from './tools/toolStreetView.jsx';
import { toolStreetViewOnMousedown, toolStreetViewOnMouseMove, toolStreetViewOnMouseUp } from '../../../utilities/leaflet_utilities.js';
import ToolLegend from './tools/toolLegend.jsx';
import { MapViewContext } from '../../../context/mapViewProvider.jsx';
import ToolLayers from './tools/toolLayers.jsx';
import {isMobile} from 'react-device-detect';
import ToolListPiezasDestacadas from './tools/toolListPiezasDestacadas.jsx';
import ToolMuseoVirtual from '../../museoVirtual/toolMuseoVirtual.jsx';
import ToolCatalogoPiezas from '../../catalogoPiezas/toolCatalogoPiezas.jsx';

const Toolbar = () => {
    const { mapView } = useContext(MapViewContext)
    let [selectedTool, setSelectedTool] = React.useState();

    //Con este objeto, ocultaremos los paneles de herramientas cuando se seleccione una herramienta
    let toolsPanes = {
        hide: () => {
            for (let key in toolsPanes.hidePanes) {
                if (toolsPanes.hidePanes[key]) {
                    toolsPanes.hidePanes[key](false);
                }
            }
        },
        hidePanes: {}
    }




    useEffect(() => {
        //console.log(mapView.getContainer().style.cursor)
        if (selectedTool) {
            mapView._container.style.cursor = "crosshair";
        } else {
            mapView._container.style.cursor = '';
        }

        //Si isMobile, movemos el zoom un poco más abajo
        if (isMobile) {
            const zoomControl = document.querySelector('.leaflet-control-zoom');
            if (zoomControl) {
                zoomControl.style.top = '30px';
            }
        }


    }, [selectedTool]);

    const activeTool = (tool) => {


        //Cada vez que cambiamos de herramienta, limpiamos la graphicslayer
        mapView.graphicsLayer.clearLayers();

        //Reseteamos eventos de ratón
        mapView.mousedown_event = null;
        mapView.mousemove_event = null;
        mapView.mouseup_event = null;
        mapView.click_event = null;


        if (mapView.tool_mousedown) mapView.off('mousedown', mapView.tool_mousedown);
        if (mapView.tool_mousemove) mapView.off('mousemove', mapView.tool_mousemove);
        if (mapView.tool_mouseup) mapView.off('mouseup', mapView.tool_mouseup);
        if (mapView.tool_click) mapView.off('click', mapView.tool_click);

        //Desactivamos herramienta de medición
        if (mapView.control_measures && mapView.control_measures._measureHandler) {
            mapView.control_measures._measureHandler._clearNotFinishedMeasurement();
            //mapView.control_measures._measureHandler._disableMeasure();

        }



        //Si hacemos click en la herramienta ya seleccionada, la deseleccionaos, sino la seleccionamos
        if (tool == selectedTool) {
            setSelectedTool(null);
            mapView.selectedTool = null;
            mapView._container.style.cursor = '';
            // Selecciona todos los elementos con la clase 'leaflet-interactive'
            const elementos = document.querySelectorAll('.leaflet-interactive');
            // Cambia el estilo de cada uno
            elementos.forEach(elemento => {
                elemento.style.cursor = 'pointer'; // Cambiar el cursor
            });
        }
        else {
            setSelectedTool(tool);
            mapView.selectedTool = tool;
            mapView._container.style.cursor = "crosshair";
            // Selecciona todos los elementos con la clase 'leaflet-interactive'
            const elementos = document.querySelectorAll('.leaflet-interactive');
            // Cambia el estilo de cada uno
            elementos.forEach(elemento => {
                elemento.style.cursor = 'crosshair'; // Cambiar el cursor
            });
            if (tool == "MEASURE_LINES") {
                mapView.control_measures._enableMeasureLine();
            }
            else if (tool == "MEASURE_AREAS") {
                mapView.control_measures._enableMeasureArea();
            }

            mapView.tool_mousedown = (e) => {
                if (window.mouseOverButton) return;
                mapView.mousedown_event = e;
                if (tool == "STREETVIEW" && !window.mouseOverButton) {
                    toolStreetViewOnMousedown(mapView, e);
                }
            }
            mapView.on('mousedown', mapView.tool_mousedown);


            mapView.tool_mousemove = (e) => {
                if (window.mouseOverButton) return;
                mapView.mousemove_event = e;
                if (tool == "STREETVIEW" && !window.mouseOverButton) {
                    toolStreetViewOnMouseMove(mapView, e);
                }
            };
            mapView.on('mousemove', mapView.tool_mousemove);



            mapView.tool_mouseup = (e) => {
                if (window.mouseOverButton) return;
                mapView.mouseup_event = e;
                if (tool == "STREETVIEW" && !window.mouseOverButton) {
                    toolStreetViewOnMouseUp(mapView, e);
                }
            };
            mapView.on('mouseup', mapView.tool_mouseup);

            mapView.tool_click = (e) => {
                if (window.mouseOverButton) return;
                mapView.click_event = e;

            }
            mapView.on('click', mapView.tool_click);
        }

    }

    //Con esto conseguimos acceder a la asignación de la herramienta desde el mapa, lo cual utilizaremos en lagunos plugins de Leaflet
    mapView.activeTool = activeTool;

    const locate = (active) => {
        if (!active) {
            mapView.control_location._map.off("locationfound", () => { }, mapView.control_location);
            mapView.control_location.stop();
        }
        else {
            mapView.control_location._map.on("locationfound", () => { }, mapView.control_location);
            mapView.control_location.start();
        }
    }

    const home = () => {
        mapView.fitBounds(mapView.initialExtent);
    }

    return (
        <>
            <Space className="toolbar" wrap align="start" style={isMobile?{top: "40px"}:{}}>
                <ToolLocate mapView={mapView} selectedTool={selectedTool} setSelectedTool={setSelectedTool} action={locate} toolsPanes={toolsPanes} />
                <ToolRotate mapView={mapView} selectedTool={selectedTool} setSelectedTool={setSelectedTool} action={null} toolsPanes={toolsPanes} />
                <ToolHome mapView={mapView} selectedTool={selectedTool} setSelectedTool={setSelectedTool} action={home} toolsPanes={toolsPanes} />
                <ToolMeasures mapView={mapView} selectedTool={selectedTool} setSelectedTool={setSelectedTool} action={activeTool} toolsPanes={toolsPanes} />
                <ToolBaseMaps mapView={mapView} selectedTool={selectedTool} setSelectedTool={setSelectedTool} action={null} toolsPanes={toolsPanes} />
                <ToolLayers mapView={mapView} selectedTool={selectedTool} setSelectedTool={setSelectedTool} action={null} toolsPanes={toolsPanes} />
                <ToolFilter mapView={mapView} selectedTool={selectedTool} setSelectedTool={setSelectedTool} action={null} toolsPanes={toolsPanes} />
                <ToolList selectedTool={selectedTool} setSelectedTool={setSelectedTool} action={null} toolsPanes={toolsPanes} />
                <ToolStreetView mapView={mapView} selectedTool={selectedTool} setSelectedTool={setSelectedTool} action={activeTool} toolsPanes={toolsPanes} />
                {/*<ToolListPiezasDestacadas></ToolListPiezasDestacadas>*/}
                <ToolMuseoVirtual></ToolMuseoVirtual>
                <ToolCatalogoPiezas/>
                {/*<ToolLegend mapView={mapView} selectedTool={selectedTool} setSelectedTool={setSelectedTool} action={null} toolsPanes={toolsPanes} />*/}
            </Space>
        </>
    );
};

export default Toolbar;