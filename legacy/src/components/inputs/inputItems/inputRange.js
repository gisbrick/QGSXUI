import { Form, Slider } from "antd";

const InputRange = ({ feature, properties, editable, field, alias, qgisLayer, valueChanged, getRules, letterSizeForm, letterTypeForm, letterColorForm }) => {
    let config = JSON.parse(field.editorWidgetSetup.config);
    const render = () => {
        return <Slider disabled={field.readOnly || !editable} defaultValue={properties[field.name]} onChange={(e) => valueChanged(e.target.value)}
            readOnly={field.readOnly || !editable} min={config.Min} max={config.Max} step={config.Step} />

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

export default InputRange
