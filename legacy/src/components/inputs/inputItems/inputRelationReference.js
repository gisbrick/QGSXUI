import { useEffect, useState } from "react"
import { Button, Card, Empty, Form, Modal, Row, Space } from "antd";
import { useDispatch } from "react-redux";
import ListComponentPagedMobile from "../../list/listComponentPagedMobile";
import { BrowserView, MobileView } from "react-device-detect";
import ListComponentPaged from "../../list/listComponentPaged";
import i18next from "i18next";
import QgisTabComponent from "../../form/qgisTabComponent";
import { CloseCircleOutlined, SearchOutlined } from "@ant-design/icons";
import { QgisService } from "../../../service/qgisService";
import { getLayerFieldsByIndexes, getQgisLayerByLayerId } from "../../../utilities/mapUtils";
import { modifiedFeaturesRelation } from "../../../features/features/featuresSlice";
import LoadingComponent from "../../utils/LoadingComponent";

const InputRelationReference = ({ map, QGISPRJ, setFieldsChanged, form, feature, properties, editable, field, alias, qgisLayer, valueChanged, getRules, letterSizeForm, letterTypeForm, letterColorForm }) => {

    const config = JSON.parse(field.editorWidgetSetup.config);
    const [selectedFeature, setSelectedFeature] = useState()
    const [showSelectModal, setShowSelectModal] = useState()

    const [formRelationReference] = Form.useForm();

    const referencedLayer = getQgisLayerByLayerId(QGISPRJ, config.ReferencedLayerId)
    const referencingLayer = qgisLayer
    const relation = QGISPRJ.relations[config.Relation]
    const dispatch = useDispatch();

    const referencedFields = getLayerFieldsByIndexes(referencedLayer, JSON.parse(relation.referencedFields))
    const referencingFields = getLayerFieldsByIndexes(referencingLayer, JSON.parse(relation.referencingFields))

    const [loading, setLoading] = useState(false)

    let getRelationReferenceRules = (relationField) => {
        let rules = []
        const relationFieldAlias = relationField.alias ? relationField.alias : relationField.name;
        if (relationField.constraintNotNull) {
            rules.push({
                required: true,
                message: i18next.t('common.msg.form.requiredField', { fieldName: relationFieldAlias }),
            })
        }
        //Añadir otras

        return rules
    }


    const fieldsHasValues = (fields) => {
        if (!properties) return false
        let out = true;
        for (let i in fields) {
            if (out) {
                if (!properties[fields[i].name]) {
                    out = false
                }
            }
        }
        return out
    }

    const fieldsValues = (fields) => {
        let out = [];
        for (let i in fields) {
            out.push(properties[fields[i].name])
        }
        return out
    }

    const loadValue = () => {
        if (!fieldsHasValues(referencingFields)) {
            setSelectedFeature(null)
            return
        }
        let refereningFieldsValues = fieldsValues(referencingFields)
        let query = " 1=1 "
        let orderBy = " 1=1 "
        for (let i in referencedFields) {
            query = query + " AND " + referencedFields[i].name + " = '" + refereningFieldsValues[i] + "'"
        }
        if (!referencedLayer) return
        setSelectedFeature(null)
        setLoading(true)
        QgisService.GETFEATURES(map, referencedLayer.name, 1, 0, query, null, null, null)
            .then((data) => {
                if (data.features.length > 0) {
                    setSelectedFeature(data.features[0])
                }
                setLoading(false)
            })
            .catch(err => {
                setLoading(false)
                console.log("ERROR", err);
            })
    }

    useEffect(() => {
        loadValue();
    }, [properties])

    const setSelected = (f) => {
        setShowSelectModal(false)
        let out = [];
        for (let i in referencedFields) {
            out.push(f.properties[referencedFields[i].name])
        }
        setFieldsChanged(true)
        for (let i in referencingFields) {
            form.setFieldValue(referencingFields[i].name, out[i])
            properties[referencingFields[i].name] = out[i]
        }

        for (let key in f.properties) {
            formRelationReference.setFieldValue(key, f.properties[key])
        }
        dispatch(modifiedFeaturesRelation(f))
        loadValue()
        
    }

    const select = () => {
        setShowSelectModal(true)
    }

    const unlink = () => {
        valueChanged(null)
        setFieldsChanged(true)
        for (let i in referencingFields) {
            form.setFieldValue(referencingFields[i].name, null)
            properties[referencingFields[i].name] = null
        }

        loadValue()
    }

    const render = () => {


        let width = 500
        let qgisLayer = QGISPRJ.layers[referencedLayer.name]
        if (qgisLayer.customProperties.URBEGIS_MODAL_WIDTH && qgisLayer.customProperties.URBEGIS_MODAL_WIDTH > width) {
            width = qgisLayer.customProperties.URBEGIS_MODAL_WIDTH
        }


        return <>

            <Card
                size="small"
                bordered={true}
                style={{}}>
                    {loading && <LoadingComponent></LoadingComponent>}
                {!loading && <Form
                    layout={"vertical"}
                    disabled={true}
                    form={formRelationReference}>


                    {editable && <Form.Item style={{ marginleft: 'auto' }}>
                        <Row justify={"end"}>
                            <Space>
                                <Button htmlType="button" disabled={false} onClick={select}>
                                    <Space>
                                        <SearchOutlined />
                                        <div className="reader">{i18next.t('common.actions.select.name')}</div>
                                    </Space>

                                </Button>
                                {selectedFeature && <Button htmlType="button" disabled={false} onClick={unlink}>
                                    <Space>
                                        <CloseCircleOutlined />
                                        <div className="reader">{i18next.t('common.actions.unlink.name')}</div>
                                    </Space>

                                </Button>}
                            </Space>
                        </Row>
                    </Form.Item>}
                    {selectedFeature && referencedLayer.editFormConfig.tabs.map((tab, index) => {
                        return <>
                            <QgisTabComponent key={"QgisTabComponent" + index} QGISPRJ={QGISPRJ} map={map} setFieldsChanged={setFieldsChanged} form={null} editable={false} feature={selectedFeature} properties={selectedFeature.properties} qgisLayer={referencedLayer} mapView={null} reload={null} tab={tab} hideRelations={true}></QgisTabComponent>
                        </>
                    })}
                    {!selectedFeature && <Empty />}
                </Form>}
            </Card>

            <Modal title={<div className="reader">{i18next.t('common.actions.select.in', { 'in': alias })}</div>} width={width}
                open={showSelectModal} onCancel={(e) => setShowSelectModal(false)}>
                <BrowserView>
                    <ListComponentPaged map={map} layer={referencedLayer.name} setSelected={setSelected}></ListComponentPaged>
                </BrowserView>
                <MobileView>
                    <ListComponentPagedMobile map={map} layer={referencedLayer.name} setSelected={setSelected}></ListComponentPagedMobile>
                </MobileView>
            </Modal>
        </>
    }

    return (
        <>{
            <>
                <Form.Item name={field.name} label={<div className="reader" style={{fontWeight:"bold"}}>{alias}</div>} rules={getRules()}>
                    {render()}
                </Form.Item>
            </>
        }
        </>
    )
}

export default InputRelationReference