import { ConfigProvider, DatePicker, Form, TimePicker } from "antd";
import { useEffect, useState } from "react"
import dayjs from 'dayjs';
import customParseFormat from 'dayjs/plugin/customParseFormat';

dayjs.extend(customParseFormat);


const InputDateTime = ({ setFieldsChanged, form, feature, properties, editable, field, alias, qgisLayer, valueChanged, getRules, letterSizeForm, letterTypeForm, letterColorForm }) => {
    let config = JSON.parse(field.editorWidgetSetup.config);
    const dateFormat = 'YYYY-MM-DD'
    const timeFormat = 'HH:mm:ss'

    let displayFormat = config.display_format;

    let [datetime, setDateTime] = useState();
    let [initialized, setInitialized] = useState();


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

    const getDateTextValue = (d) => {
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

    const getTimeTextValue = (d) => {
        /*
         let month = (d.getMonth() + 1).toString().padStart(2, '0')
         let day = d.getDate().toString().padStart(2, '0')
         let year = d.getFullYear().toString().padStart(4, '0')*/
        let month = "01"
        let day = "01"
        let year = "1970"
        let hours = d.getHours().toString().padStart(2, '0')
        let minutes = d.getMinutes().toString().padStart(2, '0')
        let secconds = d.getSeconds().toString().padStart(2, '0')
        let out = year + "-" + month + "-" + day + " " + hours + ":" + minutes + ":" + secconds
        return out
    }

    const updateDate = (d) => {
        if (d) {
            d = getDateTextValue(d.toDate())
            setDateTime(getDateValue(d))
        }
        else {
            setDateTime(null)
        }

        valueChanged(d)
        form.setFieldValue(field.name, d)
        setFieldsChanged(true)

    }

    const updateTime = (d) => {
        if (d) {
            d = getTimeTextValue(d.toDate())
            setDateTime(getDateValue(d))
        }
        else {
            setDateTime(null)
        }
        valueChanged(d.split(" ")[1])
        form.setFieldValue(field.name, d.split(" ")[1])
        setFieldsChanged(true)
        /*
        if (d) {
            d = getTimeTextValue(d.toDate())
            setDateTime(d)
        }
        else {
            setDateTime(null)
        }

        valueChanged(d.split(" ")[1])
        form.setFieldValue(field.name, d.split(" ")[1])
        setFieldsChanged(true)
        */
    }


    useEffect(() => {
        if (displayFormat == timeFormat) {
            //Si es hora
            if (field.name in properties && properties[field.name]) {
                setDateTime(getDateValue("1970-01-01 " + properties[field.name]))
            }
        }
        else {
            //Si es fecha
            setDateTime(getDateValue(properties[field.name]))
        }

        setInitialized(true)
    }, [properties])

    const render = () => {

        if (displayFormat == timeFormat) {
            //Renderizmos solo selector de horas
            return <>
                <ConfigProvider
                    theme={{
                        components: {
                            TimePicker: {
                                fontSize: letterSizeForm + "px",
                                fontFamily: letterTypeForm,
                                colorTextDisabled: letterColorForm,
                                colorBgContainerDisabled: "white"
                            },
                        },
                    }}
                >
                    <TimePicker disabled={field.readOnly || !editable} disabledTime={false} format={'HH:mm:ss'} value={datetime} style={{ padding: "4px", width: "100%" }}
                        onChange={(e) => {
                            updateTime(e)
                        }} />
                </ConfigProvider>

            </>
        }
        else {
            //Renderizmos sselector de fecha... y el de hora solo si es necesario
            return <>
                <ConfigProvider
                    theme={{
                        components: {
                            DatePicker: {
                                fontSize: letterSizeForm + "px",
                                fontFamily: letterTypeForm,
                                colorTextDisabled: letterColorForm,
                                colorTextPlaceholder: letterColorForm,
                                colorBgContainerDisabled: "white"
                            },
                        },
                    }}
                >
                    {initialized &&
                        <DatePicker disabled={field.readOnly || !editable} style={{ padding: "4px", width: "100%" }} disabledTime={false} format={'DD/MM/YYYY'} value={datetime} placeholder=""
                            onChange={(e) => {
                                updateDate(e)
                            }} />}
                </ConfigProvider>

                <ConfigProvider
                    theme={{
                        components: {
                            TimePicker: {
                                fontSize: letterSizeForm + "px",
                                fontFamily: letterTypeForm,
                                colorTextDisabled: letterColorForm,
                                colorBgContainerDisabled: "white"
                            },
                        },
                    }}
                >
                    {initialized && field.typeName.toUpperCase().includes("TIME") && <TimePicker disabled={field.readOnly || !editable} disabledTime={false} format={'HH:mm:ss'} value={datetime} placeholder="" style={{ padding: "4px", width: "100%" }}
                        onChange={(e) => {
                            updateDate(e)
                        }} />}
                </ConfigProvider>
            </>
        }

    }

    return (
        <>{
            <Form.Item name={field.name} label={<span className="reader" style={{ fontFamily: letterTypeForm, fontSize: letterSizeForm + "px", fontWeight:"bold" }}>{alias}</span>}
                getValueProps={(i) => ({ value: getDateValue(i) })}
                initialValue={getDateValue(properties[field.name])} rules={getRules()}>
                {render()}
            </Form.Item>
        }
        </>
    )
}

export default InputDateTime