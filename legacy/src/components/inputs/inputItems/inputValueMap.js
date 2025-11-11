import { ConfigProvider, Form, Select } from "antd";

const InputValueMap = ({ setFieldsChanged, form, feature, properties, editable, field, alias, qgisLayer, valueChanged, getRules, letterSizeForm, letterTypeForm, letterColorForm }) => {

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
                    value={form.getFieldValue(field.name)}
                    onChange={(e) => {
                        valueChanged(e)
                        setFieldsChanged(true)
                        form.setFieldValue(field.name, e)
                    }}
                    filterOption={filterOption}
                    options={values}
                    style={{ width: "100%" }}
                />
            </ConfigProvider>

        </>
    }

    return (
        <>{
            <Form.Item name={field.name} label={<span className="reader" style={{ fontFamily: letterTypeForm, fontSize: letterSizeForm + "px", fontWeight:"bold" }}>{alias}</span>} rules={getRules()}>
                {render()}
            </Form.Item>
        }
        </>
    )
}

export default InputValueMap