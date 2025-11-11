import { Form, InputNumber } from "antd";

const InputInteger = ({ feature, properties, editable, field, alias, qgisLayer, valueChanged, getRules, letterSizeForm, letterTypeForm, letterColorForm }) => {
    let config = JSON.parse(field.editorWidgetSetup.config);
    const render = () => {
        return <InputNumber disabled={field.readOnly || !editable} initialValue={properties[field.name]} onChange={(e) => {
            valueChanged(e)
        }}
            readOnly={field.readOnly} min={Number.MIN_SAFE_INTEGER} max={Number.MAX_SAFE_INTEGER} precision={0} step={1}
            style={{ background: "white", width: "100%", fontFamily: letterTypeForm, fontSize: letterSizeForm + "px", color: letterColorForm }} />
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

export default InputInteger