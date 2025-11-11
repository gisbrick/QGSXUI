import {Suspense} from "react"
import { Form, Input } from "antd";
import HtmlEditor from "../custom/htmlEditorComponent";
import TextArea from "antd/es/input/TextArea";

const InputText = ({ feature, properties, editable, field, alias, qgisLayer, valueChanged, getRules, letterSizeForm, letterTypeForm, letterColorForm }) => {
    let config = JSON.parse(field.editorWidgetSetup.config);
    //const values = resources.read()
    const render = () => {
        if (config.IsMultiline) {
            if (config.UseHtml) {
                return <HtmlEditor editable={editable} htmlValue={properties[field.name]} setHtmlValue={valueChanged}
                    style={{ background: "white", fontFamily: letterTypeForm, fontSize: letterSizeForm + "px", width: "100%" }} />
            }
            else {
                let arrayConstraints = field.constraints.constraintExpression.split(",")
                let showcount = false
                let maxlength = null
                let constraint = arrayConstraints.find((constraint) => constraint.startsWith("'{maxLength:"))
                if (constraint) { 
                    showcount = true
                    let value = constraint.replaceAll("'", "").replaceAll("}", "").replaceAll("{", "").split(":")[1].trim()
                    maxlength = value
                    
                }
                return <TextArea showCount={showcount} maxLength={maxlength} disabled={field.readOnly || !editable} rows={4} initialValue={properties[field.name]} onChange={(e) => valueChanged(e.target.value)} readOnly={field.readOnly || !editable}
                    style={{ background: "white", fontFamily: letterTypeForm, fontSize: letterSizeForm + "px", color: letterColorForm, width: "100%" }} />
            }
        }
        /*else if (config.UseLink) {
            if(properties[field.name] && properties[field.name]?.startsWith("https://") && !editable)
            return <a href={properties[field.name]} >{properties[field.name]}</a>
            else {
                return <Input initialValue={properties[field.name]} onChange={(e) => { valueChanged(e.target.value) }} readOnly={field.readOnly} />
            }
        }*/
        else {
            return <Input disabled={field.readOnly || !editable} initialValue={properties[field.name]} onChange={(e) => { valueChanged(e.target.value) }} readOnly={field.readOnly || !editable}
                style={{ background: "white", fontFamily: letterTypeForm, fontSize: letterSizeForm + "px", color: letterColorForm, width: "100%" }} />
        };
    }

    return (
        <>{
            <Suspense>
            <Form.Item name={field.name} label={<span className="reader" style={{ fontFamily: letterTypeForm, fontSize: letterSizeForm + "px", fontWeight:"bold"}}>{alias}</span>} initialValue={properties[field.name]} rules={getRules()}>
                {render()}
            </Form.Item>
            </Suspense>
        }
        </>
    )
}

export default InputText
