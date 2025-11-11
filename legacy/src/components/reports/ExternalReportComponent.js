import { useState, useRef, useEffect } from "react";
import { ExclamationCircleOutlined, PrinterOutlined } from "@ant-design/icons";
import { Button, Card, Col, DatePicker, Form, Input, Modal, Row, Select, Space, Spin } from "antd";
import i18next from "i18next";
import ReactDOM from 'react-dom/client';
import { QgisService } from "../../service/qgisService";
import { ServicesConfig } from "../../service/servicesConfig";
import { store } from "../../app/store";
import DownloadComponent from "../utils/DownloadComponent";
import dayjs from 'dayjs';
import { ExternalReportsService } from "../../service/externalReportsService";
import PostDownloadComponent from "../utils/PostDownloadComponent";
import { greaterEqualThanValue, smallerEqualThanValue } from "../../utilities/validator";



function ExternalReportComponent({ report, map, qgislayerReport, endExport }) {

    //console.log("qgislayerReport", qgislayerReport)
    //console.log("endExport", endExport)

    const [form] = Form.useForm();

    const [props, setProps] = useState(null);
    console.log("report", report, props)
    const outFormats = [{
        value: "pdf",
        label: "PDF"
    }, {
        value: "xml",
        label: "XML"
    }]
    const [outFormat, seOutFormat] = useState();
    const [downloading, setDownloading] = useState()
    useEffect(() => {
        var keys = report.value.split(":")
        ExternalReportsService.GET(keys[0], keys[1]).then((resp) => {
            report.description = resp.description;
            report.name = resp.name;
            report.config.inputs = resp.inputs;


            setProps(null)
            let propsCopy = {}
            console.log("report.config.inputs", report.config.inputs)
            for (var i in report.config.inputs) {
                let input = report.config.inputs[i]
                propsCopy[input.id] = {}
                let valueAux = null
                valueAux = input.value ? input.value : null
                console.log("valueAux", valueAux, input.value)
                propsCopy[input.id].value = valueAux
            }
            console.log("propsCopy", propsCopy)
            setProps(propsCopy)
            seOutFormat("pdf")

        })
        // returned function will be called on component unmount 
        return () => {
            setProps(null);
        }

    }, [report.value])

    const handleOk = (props, outFormat) => {
        //console.log("handleOk")
        form.validateFields().then((value) => {
            //console.log("values", value)
            handlePrint(props, outFormat)
        }).catch((err) => {
            let errors = []
            for (let i in err.errorFields) {
                for (let n in err.errorFields[i].errors) {
                    errors.push(err.errorFields[i].errors[n])
                }
            }

        })
    }

    const handlePrint = (props, outFormat) => {


        console.log("props", props)
        console.log("format", outFormat)
        let municipio = "base"
        /*
        Alfamen: https://app.urbegis:9091
        Alfajarín: https://app.urbegis:9092
        Longares: https://app.urbegis:9093
        Cariñena: https://app.urbegis:9094
        Almonacid: https://app.urbegis:9095 
        */
        if (window.location.href.includes(":9091")) municipio = "alfamen";
        if (window.location.href.includes(":9092")) municipio = "alfajarin";
        if (window.location.href.includes(":9093")) municipio = "longares";
        if (window.location.href.includes(":9094")) municipio = "carinena";
        if (window.location.href.includes(":9095")) municipio = "almonacid";
        if (window.location.href.includes(":9096")) municipio = "aguaron";
        if (window.location.href.includes(":9097")) municipio = "cosuenda";
        if (window.location.href.includes(":9098")) municipio = "laalmunia";

        var keys = report.value.split(":");

        let url = ServicesConfig.getBaseUrReports() + "/api/v1/" + keys[0] + "/" + keys[1] + "/" + municipio + "/" + outFormat;

        var data = {}
        for (let key in props) {
            data[key] = props[key].value;
        }

        const messages = ReactDOM.createRoot(document.getElementById('messages'));
        let d = new Date()
        messages.render(
            <PostDownloadComponent url={url} data={data} type={i18next.t('common.actions.download.report')} setDownloading={setDownloadingAux}
                starttime={d.getHours().toString().padStart(2, '0') + ":" + d.getMinutes().toString().padStart(2, '0') + ":" + d.getSeconds().toString().padStart(2, '0')}>
            </PostDownloadComponent>
        );

        if (endExport) endExport()
    }

    const setDownloadingAux = (value) => {
        window.api[downloading] = value
        setDownloading(value)
    }

    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

        /**
     * Función para obtener el valor Date de una fecha en String
     * 
     * @param {*} value 
     * @returns 
     */
        const getDateValue = (value) => {

            if (value != null) {
                if (typeof value === 'string' || value instanceof String) {
                    let out = dayjs(value)
                    return out
                }
                else {
                    //SI llegamos aquí, es porque ya tenemos convertido a dayjs la variable              
                    return value
                }
            }
            else {
                return null;
            }
        }
    
    const renderParam = (input) => {
        //TODO de momento se deja así, porque el parámetro prop en ocasiones vienen ya inicializado con los valores del componente anterior, y genera error si trata de leer una propiedad que 
        if (!props[input.id]) return <></>

        if (input.type == "text") {
            return <Input key={input.id} defaultValue={props[input.id].value} value={props[input.id].value}
            style={{ background: "white", color: "black"}}
            disabled={input.config.disabled}
            onChange={(e) => {
                let propsCopy = { ...props }
                propsCopy[input.id].value = e.target.value
                setProps(propsCopy)
            }} />
        }
        else if (input.type == "date") {
            const dateFormat = 'DD/MM/YYYY';
            return <DatePicker 
            defaultValue={getDateValue(props[input.id].value)}
            value={props[input.id].value}
            disabled={input.config.disabled}
            format={dateFormat}
            style={{ background: "white", color: "black"}}
            onChange={(e) => {
                let propsCopy = { ...props }
                propsCopy[input.id].value = e
                setProps(propsCopy)
            }} />
        }
        else if (input.type == "value_map") {

            let options = []

            input.config.values.forEach(v => {
                let values = {}
                values["value"] = v.value
                values["label"] = v.description
                options.push(values)
            });
            return <Select
                defaultValue={input.value}
                style={{}}
                onChange={(e) => {
                    let propsCopy = { ...props }
                    propsCopy[input.id].value = e
                    setProps(propsCopy)
                }}
                options={options}
            />
        }
        //TODO AÑADIR NUEVOS TIPOS DE INPUT PARA LAS EXPORTACIONES
        else {
            return <>TODO {input.type}</>
        }
    }

    let getRules = (item) => {
        let rules = []
        let itemConfig = item.config

        if (itemConfig.constraints) {
            const constraints = itemConfig.constraints
            if(constraints.required) {
                rules.push({
                    required: true,
                    message: i18next.t('common.msg.form.requiredField', { fieldName: item.label }),
                })
            }
            rules.push({
                validator: (rule, value, cb) => {
                    let validator = true;
                    if (!value && !constraints.constraintNotNull) {
                        cb()
                    } else {
                        if (constraints.greaterEqualThan) {
                            let itemFormName = constraints.greaterEqualThan
                            const comparedFieldName = report.config.inputs.find((item) => item.id == itemFormName).label
                            let valueAux = props[itemFormName]?.value
                            if (valueAux != null && value != null) {
                                if (!greaterEqualThanValue(value, valueAux)) {
                                    cb(i18next.t('common.msg.form.greaterEqualThanField', { fieldName: item.label, comparedFieldName }))
                                    validator = false
                                }
                            }
                        }
                        if (constraints.smallerEqualThan) {
                            let itemFormName = constraints.smallerEqualThan
                            const comparedFieldName = report.config.inputs.find((item) => item.id == itemFormName).label
                            let valueAux = props[itemFormName]?.value
                            if (valueAux != null && value != null) {
                                if (!smallerEqualThanValue(value, valueAux)) {
                                    cb(i18next.t('common.msg.form.smallerEqualThanField', { fieldName: item.label, comparedFieldName }))
                                    validator = false
                                }
                            }
                        }
                        if (validator) {
                            cb()
                        }
                    }
                }
            })
        }


        return rules
    }

    const render = () => {
        return <Card
            size="small"
            bordered={true}
            title={report.label}
            style={{ margin: "5px" }}>

            {<Form
                layout={"vertical"}
                disabled={false}
                form={form}>

                {props && report.config.inputs.map(function (input, index) {
                    console.log("input", input)
                    console.log("index", index)

                    return <Form.Item key={"ReportComponentForm.Item" + index}
                        name={input.label}
                        rules={getRules(input)}
                        label={input.label}>
                        {renderParam(input)}
                    </Form.Item>
                })}

                {/*props && Object.keys(props[layoutName]).map(function (key, index) {

                    let param = props[layoutName][key]
                    return <Form.Item key={"PeportyComponentForm.Item" + index}
                        label={param.label}>
                        {renderParam(key, param)}
                    </Form.Item>
                })*/}

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


                <Button type="primary" htmlType="submit" disabled={downloading} onClick={(e) => handleOk(props, outFormat)}>
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
        </Card>
    }

    return (
        <>
            {render()}
        </>
    );
}

export default ExternalReportComponent;
