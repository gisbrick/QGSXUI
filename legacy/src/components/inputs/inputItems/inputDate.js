import { Form, Input } from "antd";

const InputDate = ({ feature, properties, editable, field, alias, qgisLayer, valueChanged, getRules, letterSizeForm, letterTypeForm, letterColorForm }) => {
    let config = JSON.parse(field.editorWidgetSetup.config);
    const render = () => {
        return <Input disabled={field.readOnly || !editable} initialValue={properties[field.name]} onChange={(e) => valueChanged(e.target.value)} readOnly={field.readOnly || !editable}
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

export default InputDate