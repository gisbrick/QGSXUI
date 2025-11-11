import { useState, useRef, useEffect } from "react";
import { ExclamationCircleOutlined, PrinterOutlined } from "@ant-design/icons";
import { Button, Card, Col, DatePicker, Form, Input, Modal, Row, Select, Space, Spin } from "antd";
import i18next from "i18next";
import ReactDOM from 'react-dom/client';
import { QgisService } from "../../service/qgisService";
import { ServicesConfig } from "../../service/servicesConfig";
import { store } from "../../app/store";
import DownloadComponent from "../utils/DownloadComponent";



function ReportComponent({ layoutName, map, qgislayerReport, endExport }) {
    //console.log("qgislayerReport", qgislayerReport)
    //console.log("endExport", endExport)

    const [QGISPRJ, setQGISPRJ] = useState();

    const formsRef = useRef(null);

    const outFormats = [{
        value: "pdf",
        label: "PDF"
    }]
    const [outFormat, seOutFormat] = useState();
    const [downloading, setDownloading] = useState()
    const [props, setProps] = useState();

    const handlePrint = (props, format) => {

        let printProps = {}

        printProps["SERVICE"] = "WMS"
        printProps["VERSION"] = "1.3.0"
        printProps["TEMPLATE"] = layoutName
        if (props) printProps["LAYOUT_ARGS"] = JSON.stringify(props).replaceAll("[", "*****123*****").replaceAll("]", "*****321*****").replaceAll("{", "*****456*****").replaceAll("}", "*****654*****") //Esto lo hacemos para poder pasar el JSON como parámetro del query en un GET. En el servicio lo volvemos a transformar
        printProps["FORMAT"] = format

        //SI venimmoms de tabla o formulario, y tenemos una selección de IDS de una capa, filtramos por esa selección
        if (qgislayerReport && qgislayerReport.selection && qgislayerReport.selection.length > 0) {//Si tenemos selección
            let ids = []
            for (let i in qgislayerReport.selection) {
                ids.push(qgislayerReport.selection[i].split(".")[1])
            }
            printProps["FILTER_IDS"] = ids.toString()
            printProps["FILTER_LAYERNAME"] = qgislayerReport.layerName
            printProps["FILTER_PKFIELD"] = qgislayerReport.layerPKField
        }
        else if (qgislayerReport && qgislayerReport.qgisLayer && qgislayerReport.qgisLayer.filter) {//Si no tenemos selección, y tenemos algún filtro aplicado          
            let filter = qgislayerReport.qgisLayer.filter.replaceAll("1=1 AND ", "")
            if (filter) {
                printProps["FILTER_LAYERNAME"] = qgislayerReport.layerName

                //El ILIKE no funciona en Geopackage, así que si tenemos ILIKE, construimos la consulta de otra manera
                if (filter.includes(" ILIKE ")) {
                    let aux = filter.split(" ILIKE ")
                    //upper("AREA") LIKE '%CULT%'
                    filter = "upper(" + aux[0] + ") LIKE " + aux[1].toUpperCase()
                }
                printProps["FILTER_QUERY"] = filter
            }
        }

        //console.log("printProps",printProps)
        //return

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

        let url = ServicesConfig.getBaseUrl() + "/qgis?REQUEST=GetPrintReport&MAPREPORT=" + map.map + "&UNIT=" + map.unit + "&PERMISSION=" + map.permission + encodeURI(urlParams)

        /*
        let urlInit = ServicesConfig.getBaseUrl() + "/qgis?REQUEST=GetPrintReport&MAPREPORT=" + map.map + "&UNIT=" + map.unit + "&PERMISSION=" + map.permission + encodeURI(urlParams)
        let urlStatus = ServicesConfig.getBaseUrl() + "/qgis?REQUEST=GetPrintReportStatus&FILENAME={FILENAME}&MAP=" + map.map + "&UNIT=" + map.unit + "&PERMISSION=" + map.permission
        let urlFile = ServicesConfig.getBaseUrl() + "/qgis?REQUEST=GetPrintReportFile&FILENAME={FILENAME}&MAP=" + map.map + "&UNIT=" + map.unit + "&PERMISSION=" + map.permission
        */

        //Sistema de descargas más integrado, que no es solo descargar el fichero
        //window.open(url, '_blank');
        const messages = ReactDOM.createRoot(document.getElementById('messages'));
        let d = new Date()
        messages.render(
            <DownloadComponent url={url} type={i18next.t('common.actions.download.report')} setDownloading={setDownloadingAux}
                starttime={d.getHours().toString().padStart(2, '0') + ":" + d.getMinutes().toString().padStart(2, '0') + ":" + d.getSeconds().toString().padStart(2, '0')}>
            </DownloadComponent>
        );

        if (endExport) endExport()

    }

    const setDownloadingAux = (value) => {
        console.log("setDownloadingAux", value)
        window.api[downloading] = value
        setDownloading(value)
    }

    useEffect(() => {

        QgisService.QGISPRJ(map)
            .then((data) => {
                setQGISPRJ(data);
                setProps(null)
                let layoutArgsName = "URBEGIS_LAYOUT_ARGS"
                if (data && data.variables && layoutArgsName in data.variables) {
                    let propsCopy = JSON.parse(data.variables[layoutArgsName]);
                    //Reseteamos valores que nos llegan
                    if (layoutName in propsCopy) {
                        for (let key in propsCopy[layoutName]) {
                            propsCopy[layoutName][key].value = null
                        }
                        setProps(propsCopy)
                    }

                }
                seOutFormat("pdf")

            })
            .catch(err => {
                console.log("ERROR", err);
            })


    }, [])


    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());


    const renderParam = (key, param) => {
        if (param.type == "text") {
            return <Input value={param.value} onChange={(e) => {
                let propsCopy = { ...props }
                propsCopy[layoutName][key].value = e.target.value
                setProps(propsCopy)
            }} />
        }
        else if (param.type == "date") {
            const dateFormat = 'DD/MM/YYYY';

            return <DatePicker value={param.value} format={dateFormat} onChange={(e) => {
                let propsCopy = { ...props }
                //console.log(e)
                propsCopy[layoutName][key].value = e
                setProps(propsCopy)
            }} />
        }
        else if (param.type == "value_map") {

            let options = []

            param.config.values.forEach(v => {
                let values = {}
                values["value"] = v.value
                values["label"] = v.description
                options.push(values)
            });
            return <Select
                defaultValue={param.value}
                style={{}}
                onChange={(e) => {
                    let propsCopy = { ...props }
                    propsCopy[layoutName][key].value = e
                    setProps(propsCopy)
                }}
                options={options}
            />
        }
        //TODO AÑADIR NUEVOS TIPOS DE INPUT PARA LAS EXPORTACIONES
        else {
            return <>TODO {param.type}</>
        }
    }

    const render = () => {
        return <Card
            size="small"
            bordered={true}
            title={layoutName}
            style={{ margin: "5px" }}>

            {QGISPRJ && <Form
                layout={"vertical"}
                disabled={false}>


                {props && Object.keys(props[layoutName]).map(function (key, index) {

                    let param = props[layoutName][key]
                    return <Form.Item key={"PeportyComponentForm.Item" + index}
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
                {/*
                <SelectLayout printLayouts={printLayouts} layout={layout} setLayout={setLayout} />
                {layout && <FormLayout QGISPRJ={QGISPRJ} layout={layout} handlePrint={handlePrint} downloading={downloading} />}
            */}
            </Form>}
            {!QGISPRJ && <Spin className="ant-spin-centered" />}
        </Card>
    }

    return (
        <>
            {render()}
        </>
    );
}

export default ReportComponent;
