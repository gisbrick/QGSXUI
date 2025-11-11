import { Form, InputNumber } from "antd";

const InputFloat = ({ feature, properties, editable, field, alias, qgisLayer, valueChanged, getRules, letterSizeForm, letterTypeForm, letterColorForm }) => {
    let config = JSON.parse(field.editorWidgetSetup.config);
    const render = () => {
        return <InputNumber disabled={field.readOnly || !editable} initialValue={properties[field.name]} onChange={(e) => valueChanged(e)}
            readOnly={field.readOnly || !editable} precision={2} decimalSeparator={","}
            style={{ background: "white", width: "100%", fontFamily: letterTypeForm, fontSize: letterSizeForm + "px", color: letterColorForm }} /> //TODO Sacar precisión de properties
    }

    return (
        <>{
            <Form.Item name={field.name} label={<span className="reader" style={{ fontFamily: letterTypeForm, fontSize: letterSizeForm + "px", fontWeight:"bold" }}>{alias}</span>} initialValue={properties[field.name]} rules={getRules()}>
                {render()}
            </Form.Item>
        }
        </>
    )
}

export default InputFloat