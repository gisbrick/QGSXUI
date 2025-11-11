import { useEffect, useRef, useState } from "react";
import { Button, Space, Tooltip } from "antd";
import Icon from '@ant-design/icons';
import i18next from "i18next";

import { ReactComponent as information_icon } from '../../../../assets/esri/information-32.svg'
import { ReactComponent as cadastral_information_icon } from '../../../../assets/esri/cadastral-information-32.svg'
import { QgisService } from "../../../../service/qgisService";
import FormsComponentModal from "../../../form/formsComponentModal";
import { getWMSLayer } from "../../../../utilities/mapUtils";




function InfoToolbarComponent({ map, QGISPRJ, WMTSLAYERS, mapView, selectedTool, setSeletedTool, onSelectToolChange, editarAspectoCursor,
    tourOpen, setTourOpen, tourSteps, setTourSteps, setLoading}) {


    const [queryLayers, setQueryLayers] = useState()
    const [showSpanisCadastralInfo, setShowSpanisCadastralInfo] = useState()
    const [showModal, setShowModal] = useState()
    const [showInfoSheet, setShowInfoSheet] = useState(true)
    const [features, setFeatures] = useState()
    const [html, setHtml] = useState()

    //Referencias de elementos que luego utilizaremos en tour de ayuda
    const refButtonInfo = useRef(null);

    let reload = () => {
        refreshWMSLayer();
    }

    const refreshWMSLayer = async () => {
        if (mapView && mapView.wmsLayer) {
            //mapView.wmsLayer.wmsParams.random =  Math.random() //Con esto evitamos que el navegador cachee las imágenes
            setTimeout(async function () {
                mapView.wmsLayer.remove();
                var wmsLayer = await getWMSLayer(mapView);
                wmsLayer.addTo(mapView);
                mapView.wmsLayer = wmsLayer;
            }, 100);



        }

    }

    let infoQuery = (e) => {

        var _layers = mapView._layers,
            layers = [],
            versions = [],
            styles = [];

        for (var x in _layers) {
            var _layer = _layers[x];

            if (_layer.wmsParams) {
                let layersSplit = _layer.wmsParams.layers.split(",")
                for (let i in layersSplit) {
                    if (layersSplit[i] in QGISPRJ.layers) {
                        layers.push(layersSplit[i]);
                    }
                }


                versions.push(_layer.wmsParams.version);
                styles.push(_layer.wmsParams.styles);
            }
        }
        let loc = e.latlng,
            xy = e.containerPoint, // xy = this.latLngToContainerPoint(loc,this.getZoom())
            size = mapView.getSize(),
            bounds = mapView.getBounds(),
            crs = mapView.options.crs,
            sw = crs.project(bounds.getSouthWest()),
            ne = crs.project(bounds.getNorthEast()),
            obj = {
                service: "WMS", // WMS (default)
                version: versions[0],
                request: "GetFeatureInfo",
                layers: layers,
                styles: styles[0],
                // bbox: bounds.toBBoxString(), // works only with EPSG4326, but not with EPSG3857
                bbox: sw.x + "," + sw.y + "," + ne.x + "," + ne.y, // works with both EPSG4326, EPSG3857
                width: size.x,
                height: size.y,
                query_layers: layers,
                info_format: "application/json", // text/plain (default), application/json for JSON (CORS enabled servers), text/javascript for JSONP (JSONP enabled servers)
                feature_count: 5 // 1 (default)
                //exceptions: 'application/json', // application/vnd.ogc.se_xml (default)
                // format_options: 'callback: parseResponse' // callback: parseResponse (default), use only with JSONP enabled servers, when you want to change the callback name
            };
        if (parseFloat(obj.version) >= 1.3) {
            obj.crs = crs.code;
            obj.i = parseInt(xy.x);
            obj.j = parseInt(xy.y);
        } else {
            obj.srs = crs.code;
            obj.x = parseInt(xy.x);
            obj.y = parseInt(xy.y);
        }
        setLoading(true)
        QgisService.WMSFEATUREINFO(map, obj)
            .then((data) => {
                setLoading(false)
                setShowModal(true)
                setFeatures(data.features)

            })
            .catch(err => {
                setLoading(false)
                console.log("ERROR", err);
            });


    }


    let infoCadastralQuery = (e) => {      
        let loc = e.latlng;
        var url = "https://www1.sedecatastro.gob.es/CYCBienInmueble/OVCListaBienes.aspx?origen=Carto&huso=4326&x="+loc.lng+"&y="+loc.lat;
        window.open(url);
        //console.log("loc", loc)
    }

    //EVENTOS DE EDICION
    let initQueryEvents = () => {
        mapView.on('click', function (e) {
            if (mapView.selectedTool == "info" && !window.mouseOverButton) {
                infoQuery(e);
            }
            if (mapView.selectedTool == "cadastral_info" && !window.mouseOverButton) {
                infoCadastralQuery(e);
            }
            /*    
            var popLocation= e.latlng;
            var popup = L.popup()
            .setLatLng(popLocation)
            .setContent('<p>Hello world!<br />This is a nice popup.</p>')
            .openOn(map);     
            */
        });
    }

     //Evaluamos si tenemos que enseñar el botón de info que enlaza con catastro
     let hasShowSpanisCadastralInfo = () => {       

        if (QGISPRJ.hasOwnProperty("variables") && QGISPRJ["variables"].hasOwnProperty("URBEGIS_TOOLS")) {
            var obj = JSON.parse(QGISPRJ["variables"]["URBEGIS_TOOLS"])
            if (obj.hasOwnProperty("SPANISH_CADASTRAL_INFO") 
                && obj["SPANISH_CADASTRAL_INFO"].hasOwnProperty("PERMISSIONS")) {
                setShowSpanisCadastralInfo(obj["SPANISH_CADASTRAL_INFO"]["PERMISSIONS"])
            }
        }

    }

    //Evaluamos las capas consultables del proyecto
    let hasQueryLayers = () => {
        let queryLayersAux = []

        Object.keys(QGISPRJ.layers).forEach(function (key) {
            let layer = QGISPRJ.layers[key]
            if (layer.has_geometry && layer.WFSCapabilities.allowQuery) {
                layer.name = key;
                queryLayersAux.push(layer);
            }

        })

        setQueryLayers(queryLayersAux);
    }

    let setSeletedToolAux = (type) => {
        onSelectToolChange();
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
        }
    }

    const getToolStyle = (tool) => {
        if (tool == selectedTool) return "primary";
        else return "default";
    }

    //Este método carga los pasos de ayuda, dependiendo de las herrmientas que estén visibles (revisar para ellos las condiciones de visibilidad de los botones de cada herramienta)
    const loadHelpSteps = () => {
        let steps = [];

        if (queryLayers && queryLayers.length > 0) {
            steps.push({
                title: i18next.t('common.tools.help.map.info.button.title'),
                description: i18next.t('common.tools.help.map.info.button.description'),
                //placement: 'top',
                target: () => refButtonInfo.current,
            })
        }

        setTourSteps(steps)
    }

    useEffect(() => {
        hasShowSpanisCadastralInfo();
        hasQueryLayers();
        initQueryEvents(); 
    }, [])

    useEffect(() => {      
        loadHelpSteps()
        if(queryLayers && queryLayers.length > 0) {
            setSeletedToolAux("info");
        }
    }, [queryLayers])

    return (
        <>
            <Space wrap align="start">
                {/* BOTON TOOL INFOE, solo si tenemos LAYERS*/}

                <Space direction="horizontal" align="start">
                    {queryLayers && queryLayers.length > 0 &&
                        <Tooltip title={i18next.t('common.tools.info.name')} key={"info"}>
                            <Button ref={refButtonInfo} size='large' onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                                onClick={(e) => {
                                    setSeletedToolAux("info");
                                    e.stopPropagation();
                                    window.mouseOverButton = false
                                }}
                                type={getToolStyle("info")} shape="circle">
                                <Icon component={information_icon} />
                            </Button>
                        </Tooltip>
                    }
                     {showSpanisCadastralInfo &&
                        <Tooltip title={i18next.t('common.tools.cadastral_info.name')} key={"cadastral_info"}>
                            <Button ref={refButtonInfo} size='large' onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                                onClick={(e) => {
                                    setSeletedToolAux("cadastral_info");
                                    e.stopPropagation();
                                    window.mouseOverButton = false
                                }}
                                type={getToolStyle("cadastral_info")} shape="circle">
                                <Icon component={cadastral_information_icon} />
                            </Button>
                        </Tooltip>
                    }

                </Space>
            </Space>
            {showModal &&
                <FormsComponentModal map={map} QGISPRJ={QGISPRJ} editable={false} features={features} mapView={mapView} reload={reload}
                    visible={showModal} setVisible={setShowModal} showInfoSheet={showInfoSheet} setShowInfoSheet={setShowInfoSheet} setLoading={setLoading}/>

            }
        </>
    )
}


export default InfoToolbarComponent;