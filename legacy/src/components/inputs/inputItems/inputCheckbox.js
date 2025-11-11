import { useState} from "react"
import { Checkbox, Form } from "antd";

const InputCheckbox = ({ setFieldsChanged, form, feature, properties, editable, field, alias, qgisLayer, valueChanged, getRules, letterSizeForm, letterTypeForm, letterColorForm }) => {
    const [cambio, setCambio] = useState(false)
    let config = JSON.parse(field.editorWidgetSetup.config);
    const render = () => {
        return <>
            <Checkbox disabled={field.readOnly || !editable} checked={cambio/*form.getFieldValue(field.name) ? cambio : form.getFieldValue(field.name) == 1*/} defaultChecked={properties[field.name] == 1} onChange={(e) => {
                valueChanged(e.target.checked ? 1 : 0)
                setFieldsChanged(true)
                setCambio(e.target.checked)
            }}
                readOnly={field.readOnly} />
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

export default InputCheckbox