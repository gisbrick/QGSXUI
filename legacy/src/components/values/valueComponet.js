import { useState } from "react";
import { Card, Checkbox, Empty, Form, Popover, Typography } from "antd";

import { getLayerFieldsByIndexes, getQgisLayerByLayerId } from "../../utilities/mapUtils";
import i18next from "i18next";
import { EyeOutlined } from "@ant-design/icons";
import { QgisService } from "../../service/qgisService";
import QgisTabComponent from "../form/qgisTabComponent";
import HtmlEditor from "../inputs/custom/htmlEditorComponent";
import { getBooleanTypes, getDateTypes, getFloatTypes, getIntegerTypes } from "../../utilities/valueUtils";
const { Text } = Typography;


const ValueComponet = ({ map, fieldsValueRelations, feature, field, QGISPRJ, qgisLayer }) => {

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

    let renderValue = () => {
        if (field.editorWidgetSetup.type) {

            if (field.editorWidgetSetup.type == "ValueMap") {
                return <ValueMap feature={feature} field={field} QGISPRJ={QGISPRJ} qgisLayer={qgisLayer} />
            }
            else if (field.editorWidgetSetup.type == "ValueRelation") {
                return <ValueRelation fieldsValueRelations={fieldsValueRelations} feature={feature} field={field} QGISPRJ={QGISPRJ} qgisLayer={qgisLayer} />
            }
            else if (field.editorWidgetSetup.type == "RelationReference") {
                return <ValueRelationReference map={map} feature={feature} field={field} QGISPRJ={QGISPRJ} qgisLayer={qgisLayer} />
            }
            else {
                if (fieldIs(field, integerTypes)) {
                    return <ValueInteger feature={feature} field={field} QGISPRJ={QGISPRJ} qgisLayer={qgisLayer} />
                }
                else if (fieldIs(field, floatTypes)) {
                    return <ValueFloat feature={feature} field={field} QGISPRJ={QGISPRJ} qgisLayer={qgisLayer} />
                }
                else if (fieldIs(field, dateTypes)) {
                    return <ValueDate feature={feature} field={field} QGISPRJ={QGISPRJ} qgisLayer={qgisLayer} />
                }
                else if (fieldIs(field, booleanTypes)) {
                    return <ValueBoolean feature={feature} field={field} QGISPRJ={QGISPRJ} qgisLayer={qgisLayer} />
                }
                else {
                    return <ValueDefault feature={feature} field={field} QGISPRJ={QGISPRJ} qgisLayer={qgisLayer} />
                }
            }
        }
        else {
            if (fieldIs(field, integerTypes)) {
                return <ValueInteger feature={feature} field={field} QGISPRJ={QGISPRJ} qgisLayer={qgisLayer} />
            }
            else if (fieldIs(field, floatTypes)) {
                return <ValueFloat feature={feature} field={field} QGISPRJ={QGISPRJ} qgisLayer={qgisLayer} />
            }
            else if (fieldIs(field, dateTypes)) {
                return <ValueDate feature={feature} field={field} QGISPRJ={QGISPRJ} qgisLayer={qgisLayer} />
            }
            else if (fieldIs(field, booleanTypes)) {
                return <ValueBoolean feature={feature} field={field} QGISPRJ={QGISPRJ} qgisLayer={qgisLayer} />
            }
            else {
                return <ValueDefault feature={feature} field={field} QGISPRJ={QGISPRJ} qgisLayer={qgisLayer} />
            }
        }

    }

    return (
        renderValue()
    )
};

export default ValueComponet;

const ValueRelationReference = ({ map, fieldsValueRelations, feature, field, QGISPRJ, qgisLayer }) => {

    const [content, setContent] = useState();
    const [formRelationReference] = Form.useForm();

    const alias = field.alias ? field.alias : field.name;

    const config = JSON.parse(field.editorWidgetSetup.config);

    const referencedLayer = getQgisLayerByLayerId(QGISPRJ, config.ReferencedLayerId)
    const referencingLayer = qgisLayer
    const relation = QGISPRJ.relations[config.Relation]

    const referencedFields = getLayerFieldsByIndexes(referencedLayer, JSON.parse(relation.referencedFields))
    const referencingFields = getLayerFieldsByIndexes(referencingLayer, JSON.parse(relation.referencingFields))

    const fieldsHasValues = (fields) => {
        if (!feature.properties) return false
        let out = true;
        for (let i in fields) {
            if (out) {
                if (!feature.properties[fields[i].name]) {
                    out = false
                }
            }
        }
        return out
    }

    const fieldsValues = (fields) => {
        let out = [];
        for (let i in fields) {
            out.push(feature.properties[fields[i].name])
        }
        return out
    }

    let getContent = async () => {
        if (!fieldsHasValues(referencingFields)) {
            return <Empty />
        }
        let refereningFieldsValues = fieldsValues(referencingFields)
        let query = " 1=1 "
        for (let i in referencedFields) {
            query = query + " AND " + referencedFields[i].name + " = '" + refereningFieldsValues[i] + "'"
        }

        if (!referencedLayer) return <Empty />

        let selectedFeature = await QgisService.GETFEATURES(map, referencedLayer.name, 1, 0, query, null, null, null)
            .then((data) => {
                if (data.features.length > 0) {
                    return data.features[0]
                }
                else {
                    return null
                }
            })
            .catch(err => {
                console.log("ERROR", err);
            })

        if (selectedFeature) {

            for (let key in selectedFeature.properties) {
                formRelationReference.setFieldValue(key, selectedFeature.properties[key])
            }
            console.log("selectedFeature", selectedFeature)
            console.log("referencedLayer", referencedLayer)
            setContent(<Card
                size="small"
                bordered={true}
                style={{}}>
                <Form
                    layout={"vertical"}
                    disabled={true}
                    form={formRelationReference}>
                    {selectedFeature && referencedLayer.editFormConfig.tabs.map((tab, index) => {
                        return <>
                            <div>
                                <QgisTabComponent key={"QgisTabComponent" + index} QGISPRJ={QGISPRJ} map={map} form={null} editable={false} feature={selectedFeature} properties={selectedFeature.properties} qgisLayer={referencedLayer} mapView={null} reload={null} tab={tab} hideRelations={true}></QgisTabComponent>
                            </div>
                        </>
                    })}
                    {!selectedFeature && <Empty />}
                </Form>
            </Card>)
        }
        else {
            setContent(<Empty />)
        }

    }

    return (
        <Popover content={content} placement="right" title={alias} onMouseEnter={getContent}
            overlayStyle={{
                width: "30vw",
                maxHeight: "30vw",
                overflow: "auto"
            }}>
            <Text type="success" style={{ "cursor": "pointer" }}><EyeOutlined /> {i18next.t('common.actions.view.name')}</Text>
        </Popover>
    )
}

const ValueRelation = ({ fieldsValueRelations, feature, field, QGISPRJ, qgisLayer }) => {
    
    let value = feature.properties[field.name] + ""
    let alias = ""

    if (fieldsValueRelations && field && fieldsValueRelations[field.name]) {
        let keys = Object.keys(fieldsValueRelations[field.name])
        if (keys.indexOf(value) >= 0) {
            alias = fieldsValueRelations[field.name][value]
        }
    }
    return (
        <>{alias}</>
    )
}

const ValueMap = ({ feature, field, QGISPRJ, qgisLayer }) => {

    const config = JSON.parse(field.editorWidgetSetup.config);
    let value = feature.properties[field.name]
    let alias = ""

    for (var i in config.map) {
        let obj = config.map[i]
        let [label] = Object.keys(obj)
        if (obj[label] == value) {
            alias = label
        }
    }


    return (
        <>{alias}</>
    )
}

const ValueDefault = ({ feature, field, QGISPRJ, qgisLayer }) => {
    let value = feature.properties[field.name]
    let config = JSON.parse(field.editorWidgetSetup.config)
    if (config.IsMultiline) {
        if (config.UseHtml) {
            return <Popover content={<div style={{ width: '300px' }}><HtmlEditor editable={false} htmlValue={value} /></div>} placement="right" width={500}>
                <Text type="success" style={{ "cursor": "pointer" }}><EyeOutlined /> {i18next.t('common.actions.view.name')}</Text>
            </Popover>
        }
        else {
            return <Popover content={<div style={{ width: '300px' }}>{value}</div>} placement="right" width={500}>
                <Text type="success" style={{ "cursor": "pointer" }}><EyeOutlined /> {i18next.t('common.actions.view.name')}</Text>
            </Popover>
        }
    }

    return (
        <>{value}</>
    )
}

const ValueInteger = ({ feature, field, QGISPRJ, qgisLayer }) => {
    let num = feature.properties[field.name] != null ? feature.properties[field.name].toLocaleString("de-DE") : ""
    return (
        <div style={{ "with": "100%", "textAlign": "right" }}>{num}</div>
    )
}

const ValueBoolean = ({ feature, field, QGISPRJ, qgisLayer }) => {
    return (
        <div style={{ "with": "100%", "textAlign": "right" }}>
            <Checkbox disabled={true} checked={feature.properties[field.name]}></Checkbox>
        </div>
    )
}

const ValueDate = ({ feature, field, QGISPRJ, qgisLayer }) => {
    let valueDate = ""
    if (feature.properties[field.name]) {
        let d = new Date(feature.properties[field.name])
        if (field.editorWidgetSetup && field.editorWidgetSetup.config) {
            let config = JSON.parse(field.editorWidgetSetup.config)
            if (config.field_format) {
                let month = (d.getMonth() + 1).toString().padStart(2, '0')
                let day = d.getDate().toString().padStart(2, '0')
                let year = d.getFullYear().toString().padStart(4, '0')
                let hours = d.getHours().toString().padStart(2, '0')
                let minutes = d.getMinutes().toString().padStart(2, '0')
                let secconds = d.getSeconds().toString().padStart(2, '0')
                valueDate = config.field_format.replace("dd", day).replace("MM", month).replace("yyyy", year).replace("HH", hours).replace("mm", minutes).replace("ss", secconds)
            }
        }
        if (!valueDate) {
            valueDate = d.toLocaleString()
        }
            
    }
    return (
        <div style={{ "with": "100%", "textAlign": "right" }}>{valueDate}</div>
    )
}

const ValueFloat = ({ feature, field, QGISPRJ, qgisLayer }) => {
    let valueFloat = !feature.properties[field.name] ? "" : feature.properties[field.name].toLocaleString("de-DE") //TODO Ver si podemos recuperar de algún sitio la precisón, para poder 
    return (
        <div style={{ "with": "100%", "textAlign": "right" }}>{valueFloat}</div>
    )
}