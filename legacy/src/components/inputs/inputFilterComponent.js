import { useEffect, useState } from "react";
import customParseFormat from 'dayjs/plugin/customParseFormat';
import { Button, Card, Checkbox, Col, DatePicker, Empty, Form, Input, InputNumber, Modal, Row, Select, Slider, Space, TimePicker } from "antd";
import dayjs from 'dayjs';
import TextArea from "antd/es/input/TextArea";
import RichTextEditor from "react-rte";
import HtmlEditor from "./custom/htmlEditorComponent";
import i18next from "i18next";
import { QgisService } from "../../service/qgisService";
import QgisTabComponent from "../form/qgisTabComponent";
import { CheckCircleOutlined, CloseCircleOutlined, CloseCircleTwoTone, SearchOutlined } from "@ant-design/icons";
import { getBooleanTypes, getDateTypes, getFloatTypes, getIntegerTypes } from "../../utilities/valueUtils";
dayjs.extend(customParseFormat);


const InputFilterComponet = ({ QGISPRJ, qgisLayer, map, field, setValue }) => {


    const alias = field.alias ? field.alias : field.name;

    let integerTypes = getIntegerTypes()
    let floatTypes = getFloatTypes()
    let dateTypes = getDateTypes()
    let booleanTypes = getBooleanTypes()


    const fieldIs = (field, types) => {
        let out = false;
        for (let i in types) {
            if (!out && field.typeName.toUpperCase().includes(types[i])) out = true
        }
        return out;
    }



    let renderInput = () => {

        if (field) {           
            if (field.editorWidgetSetup.type == "Range") {
                return <InputRange field={field} alias={alias} qgisLayer={qgisLayer} setValue={setValue} />
            }
            else if (field.editorWidgetSetup.type == "DateTime") {
                return <InputDateTime field={field} alias={alias} qgisLayer={qgisLayer} setValue={setValue} />
            }
            else if (field.editorWidgetSetup.type == "CheckBox") {
                return <InputCheckbox field={field} alias={alias} qgisLayer={qgisLayer} setValue={setValue} />
            }
            else if (field.editorWidgetSetup.type == "ValueMap") {
                return <InputValueMap field={field} alias={alias} qgisLayer={qgisLayer} setValue={setValue} />
            }
            else if (field.editorWidgetSetup.type == "ValueRelation") {
                return <InputValueRelation map={map} field={field} alias={alias} qgisLayer={qgisLayer} setValue={setValue} />
            }


            //TODO Añadir otros wisgets de input
            else {
                if (fieldIs(field, integerTypes)) {
                    return <InputInteger field={field} alias={alias} qgisLayer={qgisLayer} setValue={setValue} />
                }
                else if (fieldIs(field, floatTypes)) {
                    return <InputFloat field={field} alias={alias} qgisLayer={qgisLayer} setValue={setValue} />
                }


                //TODO Añadir otros tipos de input
                else {
                    return <InputText field={field} alias={alias} qgisLayer={qgisLayer} setValue={setValue} />
                }

            }
        }
        else {
            return <></>
        }

    }



    return (
        renderInput()

    )
};

export default InputFilterComponet;


const InputValueRelation = ({ map, field, alias, qgisLayer, setValue }) => {
    
    const config = JSON.parse(field.editorWidgetSetup.config);

    const [values, setValues] = useState()
    const [key, setKey] = useState()

    const loadValues = () => {
        let orderBy = config.OrderByValue ? config.LayerName : null
        let orderType = orderBy ? "ASC" : null
        setValues([])

        QgisService.GETFEATURES(map, config.LayerName, 10000, 0, config.FilterExpression, null, orderBy, orderType)
            .then((data) => {
                let newValues = []
                newValues.push({
                    value: null,
                    label: ""
                })
                for (var i in data.features) {
                    let feature = data.features[i];
                    newValues.push({
                        value: '' + feature.properties[config.Key],
                        label: feature.properties[config.Value]
                    })
                }

                setValues(newValues)
            })
            .catch(err => {
                console.log("ERROR", err);
            })
    }

    useEffect(() => {
        loadValues();
    }, [field])

    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());


    const render = () => {
        return <>
            {values && <Select
                style={{ width: "100%" }}
                showSearch
                placeholder={""}
                optionFilterProp="children"
                defaultValue={''}
                onChange={(e) => {
                    setValue(e)
                }}
                filterOption={filterOption}
                options={values}
            />}
        </>
    }

    return (
        <>{
            render()
        }
        </>
    )
}

const InputValueMap = ({ field, alias, qgisLayer, setValue }) => {

    const config = JSON.parse(field.editorWidgetSetup.config);

    const values = []

    if (!field.constraintNotNull) {
        values.push({
            value: null,
            label: ""
        })
    }

    for (var i in config.map) {
        let obj = config.map[i]
        let [label] = Object.keys(obj)
        values.push({
            value: obj[label],
            label: label
        })
    }

    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());


    const render = () => {
        return <>
            <Select
                style={{ width: "100%" }}
                showSearch
                placeholder={""}
                optionFilterProp="children"
                onChange={(e) => {
                    setValue(e)
                }}
                filterOption={filterOption}
                options={values}
            />
        </>
    }

    return (
        <>{
            render()
        }
        </>
    )
}

const InputCheckbox = ({ field, alias, qgisLayer, setValue }) => {
    let config = JSON.parse(field.editorWidgetSetup.config);

    const render = () => {
        return <>
            <Checkbox onChange={(e) => {
                setValue(e.target.checked ? 1 : 0)

            }}
                readOnly={field.readOnly} />
        </>
    }

    return (
        <>{
            render()
        }
        </>
    )
}

const InputDateTime = ({ field, alias, qgisLayer, setValue }) => {
    let config = JSON.parse(field.editorWidgetSetup.config);
    const dateFormat = 'YYYY-MM-DD'
    const timeFormat = 'HH:mm:ss'

    let [datetime, setDateTime] = useState();
    let [initialized, setInitialized] = useState();


    const getDateValue = (value) => {
        if (value != null) {
            if (typeof value === 'string' || value instanceof String) {
                return dayjs(value)
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

    const getTextValue = (d) => {
        let month = (d.getMonth() + 1).toString().padStart(2, '0')
        let day = d.getDate().toString().padStart(2, '0')
        let year = d.getFullYear().toString().padStart(4, '0')
        let hours = d.getHours().toString().padStart(2, '0')
        let minutes = d.getMinutes().toString().padStart(2, '0')
        let secconds = d.getSeconds().toString().padStart(2, '0')
        let out = year + "-" + month + "-" + day

        if (field.typeName.toUpperCase().includes("TIME")) {
            out = out + " " + hours + ":" + minutes + ":" + secconds
        }
        return out
    }

    const update = (d) => {
        if (d) {
            d = getTextValue(d.toDate())
            setDateTime(getDateValue(d))
        }
        else {
            setDateTime(null)
        }

        setValue(d)


    }


    useEffect(() => {
        setInitialized(true)
    }, [])

    const render = () => {
        return <>
            {initialized &&
                <DatePicker disabledTime={false} format={'DD/MM/YYYY'} value={datetime}
                    onChange={(e) => {
                        update(e)
                    }} />}
            {initialized && field.typeName.toUpperCase().includes("TIME") && <TimePicker disabledTime={false} format={'HH:mm:ss'} value={datetime}
                onChange={(e) => {
                    update(e)
                }} />}
        </>

    }

    return (
        <>{
            render()
        }
        </>
    )
}


const InputRange = ({ field, alias, qgisLayer, setValue }) => {
    let config = JSON.parse(field.editorWidgetSetup.config);
    const render = () => {
        return <Slider onChange={(e) => setValue(e.target.value)}
            readOnly={field.readOnly} min={config.Min} max={config.Max} step={config.Step} />

    }

    return (
        <>{
            render()
        }
        </>
    )
}

const InputText = ({ field, alias, qgisLayer, setValue }) => {

    const render = () => {
        return <Input onChange={(e) => {
            setValue(e.target.value)
        }} />
    }

    return (
        <>{
            render()
        }
        </>
    )
}

const InputInteger = ({ field, alias, qgisLayer, setValue }) => {
    let config = JSON.parse(field.editorWidgetSetup.config);
    const render = () => {
        return <InputNumber onChange={(e) => {
            setValue(e)
        }}
            readOnly={field.readOnly} min={Number.MIN_SAFE_INTEGER} max={Number.MAX_SAFE_INTEGER} precision={0} step={1} />
    }

    return (
        render()
    )
}

const InputFloat = ({ field, alias, qgisLayer, setValue }) => {
    let config = JSON.parse(field.editorWidgetSetup.config);
    const render = () => {
        return <InputNumber onChange={(e) => {
            setValue(e)
        }}
            precision={2} decimalSeparator={","} /> //TODO Sacar precisión de properties
    }

    return (
        <>{
            render()
        }
        </>
    )
}
