import { useState, useRef, useEffect } from "react";
import { ExclamationCircleOutlined, PrinterOutlined } from "@ant-design/icons";
import { Button, Card, Col, DatePicker, Form, Input, Modal, Row, Select, Space, Spin } from "antd";
import i18next from "i18next";
import { getVisibleLayersInChildren, getWMSFilters } from "../../../../utilities/mapUtils";
import { QgisService } from "../../../../service/qgisService";
import { ServicesConfig } from "../../../../service/servicesConfig";
import DownloadComponent from "../../../utils/DownloadComponent";
import ReactDOM from 'react-dom/client';
import { store } from "../../../../app/store";


function ReportsComponentModal({ printLayouts, map, QGISPRJ, WMTSLAYERS, mapView, visible, setVisible }) {

    const formsRef = useRef(null);

    const [layout, setLayout] = useState()

    const [downloading, setDownloading] = useState()

    const handlePrint = (props, format) => {
        const state = store.getState();
        let urlComposer = ServicesConfig.getBaseUrl() + "/qgis?SERVICE=WMS&REQUEST=GetProjectSettings&MAP=" + map.map + "&UNIT=" + map.unit + "&PERMISSION=" + map.permission + (state.user.logged ? "&TOKEN=" + state.user.token : "")

        fetch(urlComposer).then(response => response.text())
            .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
            .then(data => {
                let composerTemplates = data.getElementsByTagName("ComposerTemplate")
                for (var i in composerTemplates) {
                    if (composerTemplates[i].hasAttribute && composerTemplates[i].hasAttribute("name") && composerTemplates[i].getAttribute("name") == layout.name) {
                        let composerMaps = composerTemplates[i].getElementsByTagName("ComposerMap")
                        let composerMapsValues = {}
                        for (let n in composerMaps) {
                            if (composerMaps[n].hasAttribute && composerMaps[n].hasAttribute("itemName")) {
                                let itemName = composerMaps[n].getAttribute("itemName")
                                let name = composerMaps[n].getAttribute("name")
                                let height = composerMaps[n].getAttribute("height")
                                let width = composerMaps[n].getAttribute("width")
                                composerMapsValues[itemName] = {
                                    itemName: itemName,
                                    name: name,
                                    height: height,
                                    width: width,
                                }
                            }
                        }
                        handlePrintComposer(props, format, composerMapsValues)
                    }

                }
            });

    }

    const handlePrintComposer = (props, format, composerMapsValues) => {


        //http://localhost/qgis/qgis_mapserv.fcgi.exe?CRS=EPSG:4326&SERVICE=WMS&REQUEST=GetPrint&MAP=C:\OSGeo4W\server\resources\unit01\test3.qgz&FORMAT=jpg&TEMPLATE=tabla&map0:EXTENT=-180,-90,180,90&map0:LAYERS=Poligono&map0:ROTATION=45

        //https://docs.qgis.org/3.28/es/docs/server_manual/services/wms.html#wms-getprint

        let printProps = {}

        let visibleLayers = [mapView.baseLayer.WMTSLAYER.name]
        let dynamicLayers = getVisibleLayersInChildren(QGISPRJ.layerTree.children, [], WMTSLAYERS)
        for (let i in dynamicLayers) {
            visibleLayers.push(dynamicLayers[i])
        }

        let mapElementName = "";
        let width = 0;
        let height = 0;
        //Recuperamos el nombre del mapa  dinámico (siempre cogemos el primero que encontramos, y no por su nombre, sino por el índice)
        let index = 0
        for (let key in composerMapsValues) {
            for (let i in layout.items) {
                if (key == layout.items[i].displayName && layout.items[i].classType == "QgsLayoutItemMap") {
                    if (layout.items[i].layers.length > 0) {
                        printProps[composerMapsValues[key].name + ":EXTENT"] = layout.items[i].extent.xMinimum + "," + layout.items[i].extent.yMinimum + "," + layout.items[i].extent.xMaximum + "," + layout.items[i].extent.yMaximum
                        let layers = []
                        for (let n in layout.items[i].layers) {
                            layers.push(layout.items[i].layers[n].name)
                        }
                        printProps[composerMapsValues[key].name + ":LAYERS"] = layers.toString()
                    }
                    else {
                        mapElementName = composerMapsValues[key].name
                        width = layout.items[i].sizeWithUnits.width
                        height = layout.items[i].sizeWithUnits.height
                    }
                }
            }
        }

        //mapElementName = "map1"
        //ponemos las capas y extensión por defecto de los mapas que no son dinámicos
        /*
        for (let i in layout.items) {
            if (layout.items[i].displayName != mapElementName && layout.items[i].classType == "QgsLayoutItemMap") {
                
                printProps["map" + layout.items[i].index  + ":EXTENT"] = layout.items[i].extent.xMinimum + "," + layout.items[i].extent.yMinimum + "," + layout.items[i].extent.xMaximum + "," + layout.items[i].extent.yMaximum
                
                let layers = []
                for(let n in layout.items[i].layers){
                    layers.push(layout.items[i].layers[n].name)
                }
                printProps["map" + layout.items[i].index + ":LAYERS"] = layers.toString()
                printProps["map" + layout.items[i].index + ":ROTATION"] = 0
            }
        }
        */
        printProps["CRS"] = "EPSG:3857" //TODO Sacar de un properties o del proyecto... habría que reproyectar el extensión del mapa
        printProps["SERVICE"] = "WMS"
        printProps["VERSION"] = "1.3.0"
        printProps["TEMPLATE"] = layout.name
        if (props) printProps["LAYOUT_ARGS"] = JSON.stringify(props).replaceAll("[", "*****123*****").replaceAll("]", "*****321*****").replaceAll("{", "*****456*****").replaceAll("}", "*****654*****") //Esto lo hacemos para poder pasar el JSON como parámetro del query en un GET. En el servicio lo volvemos a transformar
        printProps["LAYERS"] = visibleLayers.toString()
        printProps["FORMAT"] = format


        printProps["FILTER"] = getWMSFilters(QGISPRJ, visibleLayers)


        printProps[mapElementName + ":LAYERS"] = visibleLayers.toString()


        let rotation = mapView._bearing
        //Pasamos la rotación a grados
        if (rotation) {
            rotation = (rotation * 180.0) / Math.PI
        }
        printProps[mapElementName + ":ROTATION"] = rotation


        var centerLatLng = mapView.getCenter(); // get map center
        var centerXY = window.L.Projection.SphericalMercator.project(centerLatLng);        //mapView.project(centerLatLng, mapView.getZoom() )

        var _northEastXY = window.L.Projection.SphericalMercator.project(mapView.getBounds()._northEast);//mapView.project(mapView.getBounds()._northEast, mapView.getZoom())
        var _southWestXY = window.L.Projection.SphericalMercator.project(mapView.getBounds()._southWest);//mapView.project(mapView.getBounds()._southWest, mapView.getZoom())

        var widthMapUnits = _northEastXY.x - _southWestXY.x;
        var heightMapUnits = _northEastXY.y - _southWestXY.y;

        var printMapHeight = height * widthMapUnits / width



        var minx = centerXY.x - (widthMapUnits / 2)
        var miny = centerXY.y - (printMapHeight / 2)
        var maxx = centerXY.x + (widthMapUnits / 2)
        var maxy = centerXY.y + (printMapHeight / 2)

        //printProps[mapElementName + ":EXTENT"] = mapView.getBounds()._southWest.lng + "," + mapView.getBounds()._southWest.lat + "," + mapView.getBounds()._northEast.lng + "," + mapView.getBounds()._northEast.lat//-180,-90,180,90
        printProps[mapElementName + ":EXTENT"] = minx + "," + miny + "," + maxx + "," + maxy//-180,-90,180,90


        var pointC = mapView.latLngToContainerPoint(centerLatLng); // convert to containerpoint (pixels)
        var pointX = [pointC.x + 1, pointC.y]; // add one pixel to x
        var pointY = [pointC.x, pointC.y + 1]; // add one pixel to y

        // convert containerpoints to latlng's
        var latLngC = mapView.containerPointToLatLng(pointC);
        var latLngX = mapView.containerPointToLatLng(pointX);
        var latLngY = mapView.containerPointToLatLng(pointY);

        var distanceX = latLngC.distanceTo(latLngX); // calculate distance between c and x (latitude)
        var distanceY = latLngC.distanceTo(latLngY); // calculate distance between c and y (longitude)

        //TODO esto hay que revisarlo, ya que no funciona bien el cálculo
        //printProps[mapElementName + ":GRID_INTERVAL_X"] = distanceX/4
        //printProps[mapElementName + ":GRID_INTERVAL_Y"] = distanceY/4


        //Añadimos el token si el usuario está logueado
        const state = store.getState();
        if (state.user.logged) {
            printProps["TOKEN"] = state.user.token
        }

        //metresPerPixel = 40075016.686 * Math.abs(Math.cos(mapView.getCenter().lat * Math.PI/180)) / Math.pow(2, mapView.getZoom()+8);

        let urlParams = "";
        for (let key in printProps) {
            urlParams = urlParams + "&" + key + "=" + printProps[key]
        }

        let url = ServicesConfig.getBaseUrl() + "/qgis?REQUEST=GetPrint&MAP=" + map.map + "&UNIT=" + map.unit + "&PERMISSION=" + map.permission + encodeURI(urlParams) //"&"+ new URLSearchParams(printProps).toString()
        console.log(url)
        /*
         const messages = ReactDOM.createRoot(document.getElementById('messages'));
         messages.render(
           <DownloadComponent url={url}></DownloadComponent>
         );*/

        //Hay un problema, la primera request falla tras cambiar extension, así que hago la request 2 veces   FUNCIONA  
        //window.open(url, '_blank');
        /*
        setDownloading(true)
        fetch(url).then(() => {
            setDownloading(false)
            window.open(url, '_blank');
        })*/

        //Informamos dde que algunos valores no son válidos      
        const messages = ReactDOM.createRoot(document.getElementById('messages'));
        let d = new Date()
        console.log("actuaaaa")
        messages.render(
            <DownloadComponent url={url} type={i18next.t('common.actions.download.map')} format={format}
                starttime={d.getHours().toString().padStart(2, '0') + ":" + d.getMinutes().toString().padStart(2, '0') + ":" + d.getSeconds().toString().padStart(2, '0')}>
            </DownloadComponent>
        );


    }



    const handleCancel = () => {
        if (formsRef.current) {
            formsRef.current.imperativeHandleCancel()
        }
        setVisible(false);
    }

    const render = () => {
        return <Modal
            title={i18next.t('common.tools.print.layout.name')}
            maskClosable={false}
            open={visible}
            footer={null}
            onCancel={handleCancel}>

            <Row>
                <Col span={22} offset={1}>
                    <Card
                        size="small"
                        bordered={true}
                        style={{}}>

                        <Form
                            layout={"vertical"}
                            disabled={false}>

                            <SelectLayout printLayouts={printLayouts} layout={layout} setLayout={setLayout} />
                            {layout && <FormLayout QGISPRJ={QGISPRJ} layout={layout} handlePrint={handlePrint} downloading={downloading} />}
                        </Form>
                    </Card>
                </Col>
            </Row>

        </Modal>
    }

    return (
        <>
            {render()}
        </>
    );
}

export default ReportsComponentModal;

function SelectLayout({ printLayouts, layout, setLayout }) {

    const [options, setOptions] = useState();
    const [value, setValue] = useState();

    useEffect(() => {
        let dataAux = [{
            value: null,
            label: ""
        }]

        printLayouts.map((item, index) => {
            dataAux.push({
                value: index,
                label: item.name
            })
        })
        if (printLayouts.length == 1) {
            setValue(0)
            setLayout(printLayouts[0])
        }
        setOptions(dataAux);
    }, [])


    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

    return (<>{options && <Form.Item
        label={i18next.t('common.tools.print.layout.select')}
        rules={[]}>
        <Select
            showSearch
            placeholder={i18next.t('common.tools.print.layout.select')}
            optionFilterProp="children"
            value={value}
            onChange={(e) => {
                if (e == null) {
                    setLayout(null)
                }
                else {
                    setLayout(printLayouts[e])
                }
                setValue(e)
            }}
            filterOption={filterOption}
            options={options}
        />

    </Form.Item>}</>)
}

function FormLayout({ QGISPRJ, layout, handlePrint, downloading }) {

    const [props, setProps] = useState();
    const [outFormat, seOutFormat] = useState();

    const outFormats = [{
        value: "pdf",
        label: "PDF"
    },
    {
        value: "png",
        label: "PNG"
    },
    {
        value: "jpeg",
        label: "JPEG"
    }]

    useEffect(() => {
        setProps(null)
        let layoutArgsName = "URBEGIS_LAYOUT_ARGS"
        if (QGISPRJ && QGISPRJ.variables && layoutArgsName in QGISPRJ.variables) {
            let propsCopy = JSON.parse(QGISPRJ.variables[layoutArgsName]);
            //Reseteamos valores que nos llegan
            if (layout.name in propsCopy) {
                for (let key in propsCopy[layout.name]) {
                    propsCopy[layout.name][key].value = null
                }
                setProps(propsCopy)
            }

        }
        seOutFormat("pdf")
    }, [layout])

    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

    const renderParam = (key, param) => {        
        if (param.type == "text") {
            return <Input value={param.value} onChange={(e) => {
                let propsCopy = { ...props }
                propsCopy[layout.name][key].value = e.target.value
                setProps(propsCopy)
            }} />
        }
        else if (param.type == "date") {           
            return <DatePicker value={param.value} onChange={(e) => {
                let propsCopy = { ...props }
                propsCopy[layout.name][key].value = e.target.value
                setProps(propsCopy)
            }} />
        }
        //TODO AÑADIR NUEVOS TIPOS DE INPUT PARA LAS IMPRESIONES
        else {
            return <>TODO {param.type}</>
        }
    }

    return (<>

        {props && Object.keys(props[layout.name]).map(function (key, index) {

            let param = props[layout.name][key]
            return <Form.Item key={"SelectLayoutForm.Item" + index}
                label={param.label}>
                {renderParam(key, param)}
            </Form.Item>
        })}

        <Form.Item
            label={i18next.t('common.tools.print.layout.outFormat')}
            rules={[]}>
            <Select
                showSearch
                optionFilterProp="children"
                value={outFormat}
                onChange={(e) => {
                    seOutFormat(e)
                }}
                filterOption={filterOption}
                options={outFormats}
            />

        </Form.Item>



        <Button type="primary" htmlType="submit" disabled={downloading} onClick={(e) => handlePrint(props, outFormat)}>
            <Space>
                <PrinterOutlined />
                {downloading ? <><Spin></Spin> {i18next.t('common.tools.print.printing')}</> : i18next.t('common.tools.print.layout.print')}
            </Space>
        </Button>
    </>)
}
