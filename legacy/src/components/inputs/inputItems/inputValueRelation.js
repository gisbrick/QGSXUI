import { useEffect, useState } from "react"
import { ConfigProvider, Form, Select } from "antd";
import { QgisService } from "../../../service/qgisService";

const InputValueRelation = ({ map, setFieldsChanged, form, feature, properties, editable, field, alias, qgisLayer, valueChanged, getRules, letterSizeForm, letterTypeForm, letterColorForm }) => {
    const config = JSON.parse(field.editorWidgetSetup.config);

    const [values, setValues] = useState([])
    const [value, setValue] = useState()
    const [key, setKey] = useState()

    const loadValues = async () => {
        //console.log("ejecuta loadValues")
        let orderBy = config.OrderByValue ? config.LayerName : null
        let orderType = orderBy ? "ASC" : null
        setValues([])
        let newValues = []
        setKey(properties[field.name])
        //console.log("key", properties[field.name])
        await QgisService.GETFEATURES(map, config.LayerName, 10000, 0, config.FilterExpression, null, orderBy, orderType)
            .then((data) => {
                newValues.push({
                    value: null,
                    label: ""
                })
                for (var i in data.features) {
                    let feature = data.features[i];
                    newValues.push({
                        value: feature.properties[config.Key],
                        label: feature.properties[config.Value]
                    })
                    if (properties[field.name] == feature.properties[config.Key]) setValue(feature.properties[config.Value])
                }
                setValues(newValues)
            })
            .catch(err => {
                console.log("ERROR", err);
            })
        //console.log("newValues", newValues)
        return newValues
    }

    useEffect(() => {
        loadValues();
    }, [properties])

    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());


    const render = () => {
        if (!(field.name in properties)) properties[field.name] = ""

        //console.log("render function",properties[field.name], field.name, values)
        return <>
            {values.length > 0 &&
                <ConfigProvider
                    theme={{
                        components: {
                            Select: {
                                fontSize: letterSizeForm + "px",
                                fontFamily: letterTypeForm,
                                colorTextDisabled: letterColorForm,
                                colorBgContainerDisabled: "white"
                            },
                        },
                    }}
                >
                    <Select
                        showSearch
                        disabled={field.readOnly || !editable}
                        placeholder={""}
                        optionFilterProp="children"
                        defaultValue={properties[field.name]}
                        onChange={(e) => {
                            valueChanged(e)
                            setFieldsChanged(true)
                            form.setFieldValue(field.name, e)
                        }}
                        filterOption={filterOption}
                        options={values}
                        style={{ width: "100%" }}
                    />
                </ConfigProvider>}
        </>
    }

    return (
        <>{
            <Form.Item name={field.name} label={<span className="reader" style={{ fontFamily: letterTypeForm, fontSize: letterSizeForm + "px", fontWeight:"bold" }}>{alias}</span>} rules={getRules()}>
                {values.length > 0 && render()}
            </Form.Item>
        }
        </>
    )
}

export default InputValueRelation
