import { useEffect, useRef, useState } from "react";
import ReactDOM from 'react-dom/client';
import { Button, Modal, Space, Spin, Tooltip } from "antd";
import Icon, { PlusOutlined } from '@ant-design/icons';
import i18next from "i18next";

import { ReactComponent as pinTear_icon } from '../../../../assets/esri/pin-tear-32.svg'
import { ReactComponent as line_icon } from '../../../../assets/esri/line-32.svg'
import { ReactComponent as polygonVertices_icon } from '../../../../assets/esri/polygon-vertices-32.svg'
import { ReactComponent as checkSquare_icon } from '../../../../assets/esri/check-square-32.svg'
import { ReactComponent as save_icon } from '../../../../assets/esri/save-32.svg'

import FormComponentModal from "../../../form/formComponentModal";
import { drawSelectionFeature } from "../../../../utilities/mapDrawUtils";
import { getLastProperties, getWMSLayer } from "../../../../utilities/mapUtils";
import { QgisService } from "../../../../service/qgisService";
import NotificationComponent from "../../../utils/NotificationComponent";



function EditToolbarComponent({ map, QGISPRJ, mapView, selectedTool, setSeletedTool, onSelectToolChange, editarAspectoCursor,
    tourOpen, setTourOpen, tourSteps, setTourSteps, setLoading }) {

    const [drawPoints, setDrawPoints] = useState()
    const [drawPointsActive, setDrawPointsActive] = useState()
    const [drawLines, setDrawLines] = useState()
    const [drawLinesActive, setDrawLinesActive] = useState()
    const [drawPolygons, setDrawPolygons] = useState()
    const [drawPolygonsActive, setDrawPolygonsActive] = useState()
    const [saveEnabled, setSaveEnabled] = useState()
    const [finishEnabled, setFinishEnabled] = useState()

    const [qgisLayer, setQgisLayer] = useState()
    const [feature, setFeature] = useState()

    const [editLayers, setEditaLayers] = useState({
        point: [],
        line: [],
        polygon: []
    })

     //Referencias de elementos que luego utilizaremos en tour de ayuda
    const refButtonDrawPoint = useRef(null);
    const refButtonDrawLine = useRef(null);
    const refButtonDrawPolygon = useRef(null);

    //FUNCIONES DE EDICION
    let initEditMapFunctions = () => {
        mapView.editFeatureGeometry = (featureAux, qgisLayerAux) => {

            setQgisLayer({ ...qgisLayerAux })
            setFeature({ ...featureAux })

            //mapView._container.style.cursor = "crosshair";

            //Habilitamos la herramienta
            if (qgisLayerAux.wkbType_name.toUpperCase().includes("POINT")) {
                mapView.selectedTool = "draw_points";
            }
            if (qgisLayerAux.wkbType_name.toUpperCase().includes("LINE")) {
                mapView.selectedTool = "draw_lines";
            }
            if (qgisLayerAux.wkbType_name.toUpperCase().includes("POLYGON")) {
                mapView.selectedTool = "draw_polygons";
            }
            setSeletedTool(mapView.selectedTool);

            if (!mapView.editGraphicsLayer) {
                mapView.editGraphicsLayer = window.L.featureGroup([]);
                mapView.addLayer(mapView.editGraphicsLayer);
            }
            else {
                let layers = mapView.editGraphicsLayer.getLayers()
                for (let i in layers) {
                    mapView.editGraphicsLayer.removeLayer(layers[i])
                }
            }

            drawSelectionFeature(mapView, mapView.editGraphicsLayer, featureAux, "editGraphicsLayer", {}, qgisLayerAux)

            mapView.editGeometry = mapView.editGraphicsLayer.getLayers()[0]


            let layers = mapView.editGraphicsLayer.getLayers()
            for (let i in layers) {
                layers[i].enableEdit();
            }


        }


    }

    let draw_lines_EnoughtVertex = () => {
        let out = false;
        if (mapView.editGeometry.getLatLngs && mapView.editGeometry.getLatLngs().length > 1) {
            out = true
        }
        if (!out && mapView.editGeometry.getLatLngs && mapView.editGeometry.getLatLngs().length > 0
            && mapView.editGeometry.getLatLngs()[0].length && mapView.editGeometry.getLatLngs()[0].length > 1) {
            out = true
        }
        return out
    }

    let draw_polygons_EnoughtVertex = () => {
        let out = false;
        if (mapView.editGeometry.getLatLngs && mapView.editGeometry.getLatLngs()[0].length > 2) {
            out = true
        }
        return out
    }

    //EVENTOS DE EDICION

    let initEditEvents = () => {

        mapView.on('editable:vertex:deleted', (e) => {
            //console.log('editable:vertex:deleted ' + mapView.selectedTool)
            if (mapView.selectedTool == 'draw_lines' && draw_lines_EnoughtVertex()) {
                if (!mapView.editGraphicsLayer || !mapView.editGraphicsLayer.getLayers() || mapView.editGraphicsLayer.getLayers().length == 0) {
                    setFinishEnabled(true)
                }
            }
            if (mapView.selectedTool == 'draw_polygons' && draw_polygons_EnoughtVertex()) {
                if (!mapView.editGraphicsLayer || !mapView.editGraphicsLayer.getLayers() || mapView.editGraphicsLayer.getLayers().length == 0) {
                    setFinishEnabled(true)
                }
            }
            if (mapView.selectedTool == 'draw_lines' && draw_lines_EnoughtVertex()) {
                if (mapView.editGraphicsLayer && mapView.editGraphicsLayer.getLayers().length > 0) {
                    setSaveEnabled(true)
                }
            }
            if (mapView.selectedTool == 'draw_polygons' && draw_polygons_EnoughtVertex()) {
                if (mapView.editGraphicsLayer && mapView.editGraphicsLayer.getLayers().length > 0) {
                    setSaveEnabled(true)
                }
            }
        });
        mapView.on('editable:vertex:new', (e) => {
            //console.log('editable:vertex:new ' + mapView.selectedTool)
            if (mapView.selectedTool == 'draw_lines' && draw_lines_EnoughtVertex()) {
                if (!mapView.editGraphicsLayer || !mapView.editGraphicsLayer.getLayers() || mapView.editGraphicsLayer.getLayers().length == 0) setFinishEnabled(true)
            }
            if (mapView.selectedTool == 'draw_polygons' && draw_polygons_EnoughtVertex()) {
                if (!mapView.editGraphicsLayer || !mapView.editGraphicsLayer.getLayers() || mapView.editGraphicsLayer.getLayers().length == 0) setFinishEnabled(true)
            }
            if (mapView.selectedTool == 'draw_lines' && draw_lines_EnoughtVertex()) {
                if (mapView.editGraphicsLayer && mapView.editGraphicsLayer.getLayers().length > 0) setSaveEnabled(true)
            }
            if (mapView.selectedTool == 'draw_polygons' && draw_polygons_EnoughtVertex()) {
                if (mapView.editGraphicsLayer && mapView.editGraphicsLayer.getLayers().length > 0) setSaveEnabled(true)
            }
        });
        mapView.on('editable:drawing:commit', (e) => {
            //console.log('editable:drawing:commit ' + mapView.selectedTool)
            setSaveEnabled(true)
            setFinishEnabled(false)
        });

        mapView.on('editable:vertex:drag', (e) => {
            //console.log('editable:vertex:drag ' + mapView.selectedTool)
            if (mapView.selectedTool == 'draw_lines' && draw_lines_EnoughtVertex()) {
                if (!mapView.editGraphicsLayer || !mapView.editGraphicsLayer.getLayers() || mapView.editGraphicsLayer.getLayers().length == 0) {
                    setFinishEnabled(true)
                }
            }
            if (mapView.selectedTool == 'draw_polygons' && draw_polygons_EnoughtVertex()) {
                if (!mapView.editGraphicsLayer || !mapView.editGraphicsLayer.getLayers() || mapView.editGraphicsLayer.getLayers().length == 0) {
                    setFinishEnabled(true)
                }
            }
            if (mapView.selectedTool == 'draw_lines' && draw_lines_EnoughtVertex()) {
                if (mapView.editGraphicsLayer && mapView.editGraphicsLayer.getLayers().length > 0) {
                    setSaveEnabled(true)
                }
            }
            if (mapView.selectedTool == 'draw_polygons' && draw_polygons_EnoughtVertex()) {
                if (mapView.editGraphicsLayer && mapView.editGraphicsLayer.getLayers().length > 0) {
                    setSaveEnabled(true)
                }
            }
            /*
            if (mapView.editGeometry && mapView.editGeometry.getLatLngs) {
                console.log('getLatLngs', mapView.editGeometry.getLatLngs())
            }
            if (mapView.selectedTool == 'draw_lines' && mapView.editGeometry.getLatLngs && mapView.editGeometry.getLatLngs().length > 1) {
                if (mapView.editGraphicsLayer && mapView.editGraphicsLayer.getLayers() > 0) setSaveEnabled(true)
            }
            if (mapView.selectedTool == 'draw_polygons' && mapView.editGeometry.getLatLngs && mapView.editGeometry.getLatLngs()[0].length > 2) {
                if (mapView.editGraphicsLayer && mapView.editGraphicsLayer.getLayers().length > 0) setSaveEnabled(true)
            }*/
        });

        mapView.on('editable:dragend', (e) => {
            //console.log('editable:dragend ' + mapView.selectedTool)
            setSaveEnabled(true);
        });



    }


    //Evaluamos si en el proyecto podemos añadir los diferentes tipos de geomnetrías, e identificamos las capas editables por tipo de geometría
    let hasEditors = () => {
        let editLayersAux = {
            point: [],
            line: [],
            polygon: []
        }

        Object.keys(QGISPRJ.layers).forEach(function (key) {
            let layer = QGISPRJ.layers[key]
            if (layer.has_geometry && layer.WFSCapabilities.allowInsert) {
                layer.name = key;
                if (layer.wkbType_name.toUpperCase().includes("POINT")) {
                    setDrawPoints(true)
                    editLayersAux.point.push(layer);
                }
                if (layer.wkbType_name.toUpperCase().includes("LINE")) {
                    setDrawLines(true)
                    editLayersAux.line.push(layer);
                }
                if (layer.wkbType_name.toUpperCase().includes("POLYGON")) {
                    setDrawPolygons(true)
                    editLayersAux.polygon.push(layer);
                }
            }

        })

        setEditaLayers(editLayersAux);
    }

    let setSeletedToolAux = (type) => {

        setQgisLayer(null)
        onSelectToolChange();

        setSaveEnabled(false);
        setFinishEnabled(false);
        editarAspectoCursor(mapView, type, selectedTool)
        if (type == selectedTool) {
            //estamos deseleccionando herramienta, por lo que ponemos el cursor a default
            //mapView._container.style.cursor = "grab";
            mapView.selectedTool = null;
            setSeletedTool(null);
        }
        else {
            //estamos seleccionando herramienta de edición, por lo que ponemos el cursor en modo crosshair
            //mapView._container.style.cursor = "crosshair";
            mapView.selectedTool = type;
            setSeletedTool(type);

            //Habilitamos para dibujar geometría
            if (type == "draw_points") {
                mapView.editGeometry = mapView.editTools.startMarker();
            }
            if (type == "draw_lines") {
                mapView.editGeometry = mapView.editTools.startPolyline();
            }
            if (type == "draw_polygons") {
                mapView.editGeometry = mapView.editTools.startPolygon();
            }
        }
    }

    let deactivateEditors = () => {
        setDrawPointsActive(false);
        setDrawLinesActive(false);
        setDrawPolygonsActive(false);
    }

    const getToolStyle = (tool) => {
        if (tool == selectedTool) return "primary";
        else return "default";
    }

     //Este método carga los pasos de ayuda, dependiendo de las herrmientas que estén visibles (revisar para ellos las condiciones de visibilidad de los botones de cada herramienta)
     const loadHelpSteps = () => {
        let steps = [];

        if (drawPoints) {
            steps.push({
                title: i18next.t('common.tools.help.map.edition.points.button.title'),
                description: i18next.t('common.tools.help.map.edition.points.description'),
                //placement: 'top',
                target: () => refButtonDrawPoint.current,
            })
        }
        if (drawLines) {
            steps.push({
                title: i18next.t('common.tools.help.map.edition.lines.button.title'),
                description: i18next.t('common.tools.help.map.edition.lines.description'),
                //placement: 'top',
                target: () => refButtonDrawLine.current,
            })
        }
        if (drawPolygons) {
            steps.push({
                title: i18next.t('common.tools.help.map.edition.polygons.button.title'),
                description: i18next.t('common.tools.help.map.edition.polygons.description'),
                //placement: 'top',
                target: () => refButtonDrawPolygon.current,
            })
        }

        setTourSteps(steps)
    }

    useEffect(() => {
        hasEditors();
        initEditEvents();
        initEditMapFunctions();
    }, [])

    useEffect(() => {
        loadHelpSteps()
    }, [drawPoints, drawLines, drawPolygons])

   
    return (
        <Space wrap align="end">
            {/* BOTON TOOL MAPAS BASE, solo si tenemos más de 1 mapa base*/}

            {drawPoints && <Space direction="vertical" align="end">

                <Tooltip title={i18next.t('common.tools.edit.points.draw')} key={"draw_points"}>
                    <Button ref={refButtonDrawPoint} size='large' onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                        onClick={(e) => {
                            setSeletedToolAux("draw_points");
                            e.stopPropagation();
                            window.mouseOverButton = false
                        }}
                        type={getToolStyle("draw_points")} shape="circle">
                        <Icon component={pinTear_icon} />
                    </Button>
                </Tooltip>


                <EditTools map={map} tool={'draw_points'} QGISPRJ={QGISPRJ} mapView={mapView} selectedTool={selectedTool}
                    editLayers={editLayers} qgisLayer={qgisLayer} feature={feature}
                    setSeletedTool={setSeletedTool} saveEnabled={saveEnabled} setSaveEnabled={setSaveEnabled} finishEnabled={finishEnabled} setFinishEnabled={setFinishEnabled} />


            </Space>}
            {drawLines && <Space direction="vertical" align="center">

                <Tooltip title={i18next.t('common.tools.edit.lines.draw')} key={"draw_lines"}>
                    <Button ref={refButtonDrawLine} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                        size='large' onClick={(e) => {
                            setSeletedToolAux("draw_lines");
                            e.stopPropagation();
                            window.mouseOverButton = false
                        }}
                        type={getToolStyle("draw_lines")} shape="circle">
                        <Icon component={line_icon} />
                    </Button>
                </Tooltip>

                <EditTools map={map} tool={'draw_lines'} QGISPRJ={QGISPRJ} mapView={mapView} selectedTool={selectedTool}
                    editLayers={editLayers} qgisLayer={qgisLayer} feature={feature}
                    setSeletedTool={setSeletedTool} saveEnabled={saveEnabled} 
                    setSaveEnabled={setSaveEnabled} finishEnabled={finishEnabled} 
                    setFinishEnabled={setFinishEnabled} setLoading={setLoading}/>
            </Space>}
            {drawPolygons && <Space direction="vertical" align="end">

                <Tooltip title={i18next.t('common.tools.edit.polygons.draw')} key={"draw_polygons"}>
                    <Button ref={refButtonDrawPolygon} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                        size='large' onClick={(e) => {
                            setSeletedToolAux("draw_polygons");
                            e.stopPropagation();
                            window.mouseOverButton = false
                        }}
                        type={getToolStyle("draw_polygons")} shape="circle">
                        <Icon component={polygonVertices_icon} />
                    </Button>
                </Tooltip>

                <EditTools map={map} tool={'draw_polygons'} QGISPRJ={QGISPRJ} mapView={mapView} selectedTool={selectedTool}
                    editLayers={editLayers} qgisLayer={qgisLayer} feature={feature}
                    setSeletedTool={setSeletedTool} saveEnabled={saveEnabled} setSaveEnabled={setSaveEnabled} 
                    finishEnabled={finishEnabled} setFinishEnabled={setFinishEnabled} setLoading={setLoading}/>
            </Space>}
        </Space>
    )
}

export default EditToolbarComponent;


function EditTools({ map, tool, QGISPRJ, mapView, selectedTool, setSeletedTool, saveEnabled, setSaveEnabled, finishEnabled, setFinishEnabled, editLayers, qgisLayer, feature, setLoading }) {

    const [showSave, setShowSave] = useState()
    const [layers, setLayers] = useState()
    const [saving, setSaving] = useState();

    const refreshWMSLayer = async () => {
        if (mapView.wmsLayer) {
            //mapView.wmsLayer.wmsParams.random =  Math.random() //Con esto evitamos que el navegador cachee las imágenes
            setTimeout(async function () {
                mapView.wmsLayer.remove();
                var wmsLayer = await getWMSLayer(mapView);
                wmsLayer.addTo(mapView);
                mapView.wmsLayer = wmsLayer;
            }, 100);
        }
    }

    let reload = () => {
        //Deshabilitamos la geometría actual, que ya hemos guardado, y preparamos para seguir dibujando
        //Removemos el gráfico en edición si existe
        if (mapView.editGeometry) mapView.editGeometry.remove()
        //mapView._container.style.cursor = "grab";
        mapView.selectedTool = null;
        mapView.editGeometry = null;
        setSaveEnabled(false);
        setFinishEnabled(false);

        if (mapView.editGraphicsLayer) {
            let layers = mapView.editGraphicsLayer.getLayers()
            for (let i in layers) {
                mapView.editGraphicsLayer.removeLayer(layers[i])
            }
        }


        //Refrescamos el mapa
        refreshWMSLayer();


    }

    let getUpdateGeometry = () => {
        if (!mapView || !mapView.editGraphicsLayer || mapView.editGraphicsLayer.getLayers().length == 0) return null;
        let out = {
            "type": qgisLayer.wkbType_name,
            "coordinates": getUpdateCoordinates()
        }
        return out;
    }

    let getUpdateCoordinates = () => {
        if (mapView.editGraphicsLayer.getLayers()[0].getLatLng) {
            let latLng = mapView.editGraphicsLayer.getLayers()[0].getLatLng();
            return [latLng.lat, latLng.lng]
        }
        if (mapView.editGraphicsLayer.getLayers()[0].getLatLngs) {
            return mapView.editGraphicsLayer.getLayers()[0].getLatLngs();
        }
    }

    let save = () => {
        if (!qgisLayer) {
            if (tool == "draw_points") setLayers(editLayers["point"])
            if (tool == "draw_lines") setLayers(editLayers["line"])
            if (tool == "draw_polygons") setLayers(editLayers["polygon"])
            setShowSave(true)
        }
        else {
            //Guardamos una geometría existente
            setSaving(true)
            QgisService.UPDATEGEOMETRY(map, qgisLayer, feature, getUpdateGeometry())
                .then((data) => {
                    setSaving(false);
                    //Informamos de que se han actualizado corréctamente los datos
                    const messages = ReactDOM.createRoot(document.getElementById('messages'));
                    messages.render(
                        <NotificationComponent type="success" text="update"></NotificationComponent>
                    );

                    reload();

                    //Ponemos de nuevo en selección la herramienta de información, ya que es la que tenía originalmente seleccionada el usuario
                    setSeletedTool("info");
                    mapView.selectedTool = "info"
                    //mapView._container.style.cursor = "crosshair";
                    window.mouseOverButton = false


                }).catch(err => {
                    console.log("ERROR", err);
                    setSaving(false);
                });
        }


    }

    return (
        <>
            {
                selectedTool == tool && (finishEnabled || saveEnabled) && <Space direction="vertical">
                    {finishEnabled && <Tooltip title={i18next.t('common.tools.edit.finishGeom')} key={"finish"}>
                        <Button size='large' onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                            onClick={(e) => {
                                //TODO como parece que no funciona el stopPropagation, borramos el último vértice que se añade al hacer click en el botón. Revisar porque no funciona
                                mapView.editGeometry.editor.pop()

                                e.stopPropagation();
                                mapView.editTools.commitDrawing();
                                setFinishEnabled(false);
                                setSaveEnabled(true);
                                window.mouseOverButton = false
                            }}
                            type={'default'} shape="circle">
                            <Icon component={checkSquare_icon} />
                        </Button>
                    </Tooltip>
                    }
                    {saveEnabled && <Tooltip title={i18next.t('common.tools.edit.saveGeom')} key={"save"}>
                        <Button size='large' disabled={saving} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                            onClick={(e) => {
                                //e.stopPropagation();
                                save();
                                window.mouseOverButton = false
                            }}
                            type={'default'} shape="circle">
                            {!saving && <Icon component={save_icon} />}
                            {saving && <Spin />}


                        </Button>
                    </Tooltip>}
                </Space>
            }
            {showSave &&
                <SelectLayer map={map} tool={tool} QGISPRJ={QGISPRJ} mapView={mapView} selectedTool={selectedTool} editLayers={editLayers}
                    setSeletedTool={setSeletedTool} saveEnabled={saveEnabled} setSaveEnabled={setSaveEnabled} finishEnabled={finishEnabled} setFinishEnabled={setFinishEnabled}
                    layers={layers} setShowSave={setShowSave} setLoading={setLoading}/>
            }
        </>
    )

}

function SelectLayer({ map, tool, QGISPRJ, mapView, selectedTool, setSeletedTool, saveEnabled, setSaveEnabled, finishEnabled, setFinishEnabled, editLayers, layers, setShowSave, setLoading }) {

    const [layer, setLayer] = useState()

    useEffect(() => {
        if (layers.length == 1) setLayer(layers[0])
    }, [layers])


    let reload = () => {
        //Deshabilitamos la geometría actual, que ya hemos guardado, y preparamos para seguir dibujando
        //Removemos el gráfico en edición si existe
        if (mapView.editGeometry) mapView.editGeometry.remove()
        mapView.editGeometry = null;
        setSaveEnabled(false);
        setFinishEnabled(false);

        //Habilitamos para dibujar geometría
        if (tool == "draw_points") {
            mapView.editGeometry = mapView.editTools.startMarker();
        }
        if (tool == "draw_lines") {
            mapView.editGeometry = mapView.editTools.startPolyline();
        }
        if (tool == "draw_polygons") {
            mapView.editGeometry = mapView.editTools.startPolygon();
        }

    }

    return (
        <>
            {!layer && layers && layers.length > 1 &&
                <Modal title={i18next.t('common.tools.edit.selectTargetLayer')} footer={[]} open={true} onCancel={(e) => setShowSave(false)}>
                    <Space wrap direction="vertical" style={{
                        width: '100%',
                    }}>
                        {layers.map((ly, index) => {
                            return <Button key={"ButtonselectTargetLayer" + index} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                                type="dashed"
                                onClick={() => {
                                    setLayer(ly)
                                    window.mouseOverButton = false
                                }}
                                style={{
                                    width: '100%',
                                }}
                            >
                                <Space>
                                    <PlusOutlined />
                                    {ly.name.replaceAll("_", " ")}
                                </Space>

                            </Button>
                        })}
                    </Space>
                </Modal>}
            {/*//TODO De momento mantenemos siempre las propiedades del último insert
                 //TODO Habría que evolucionarlo para mantenerlas solo si se ha configurado así en el campo de QGIS */}
            {layer && < FormComponentModal QGISPRJ={QGISPRJ} map={map} editable={true}
                feature={{ name: layer.name, properties: getLastProperties(layer) }}
                layer={layer.name} qgisLayer={layer} mapView={mapView} reload={reload} 
                setVisible={setShowSave} setLoading={setLoading}/>
            }
        </>)
}
