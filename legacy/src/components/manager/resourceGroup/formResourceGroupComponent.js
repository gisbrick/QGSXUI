import { useEffect, useRef, useState } from "react";
import { UnitService } from "../../../service/unitService";
import { Button, Card, Checkbox, Col, DatePicker, Form, Input, Modal, Row, Space, Spin, Table, Tooltip, Upload } from "antd"
import i18next from "i18next";
import { CloseCircleTwoTone, DeleteOutlined, FileAddOutlined, SaveOutlined, SearchOutlined } from "@ant-design/icons";
import ReactDOM from 'react-dom/client';
import NotificationComponent from "../../utils/NotificationComponent";
import Search from "antd/es/transfer/search";
import SelectUsertComponent from "../user/selectUserComponent";
import { UnitUserService } from "../../../service/unitUserService";
import TextArea from "antd/es/input/TextArea";
import SelectUserComponent from "../user/selectUserComponent";
import { MediaGroupService } from "../../../service/mediaGroupService";

function FormResourceGroupComponent({ unit, item, loadData, setSelected }) {

    const [form] = Form.useForm();
    const [fieldsChanged, setFieldsChanged] = useState(false);

    const [userUnits, setUserUnits] = useState();

    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');

    const [selectUser, setSelectUser] = useState();
    const [excludeUserIds, setExcludeUserIds] = useState();

    const [properties, setProperties] = useState();

    const [saving, setSaving] = useState();

    const [showModalConfirmExit, setShowModalConfirmExit] = useState(false);

    const isNew = !item.uidResGrp


    const handleOkAndExit = () => {
        window.preventUnmountComponents = false
        //Cerramos la modal de confirmación
        setShowModalConfirmExit(false)

        form.validateFields().then((value) => {
            setSaving(true)
            if (isNew) {
                MediaGroupService.CREATE(unit.idUnt, properties).then((resp) => {
                    setSaving(false)
                    const messages = ReactDOM.createRoot(document.getElementById('messages'));
                    messages.render(
                        <NotificationComponent type="success" text="save"></NotificationComponent>
                    );
                    loadData()
                    //setFieldsChanged(false)
                    setSelected(null)
                }).catch(() => {
                    setSaving(false)
                })
            }
            else {
                MediaGroupService.UPDATE(unit.idUnt, properties).then((resp) => {
                    setSaving(false)
                    const messages = ReactDOM.createRoot(document.getElementById('messages'));
                    messages.render(
                        <NotificationComponent type="success" text="update"></NotificationComponent>
                    );
                    loadData()

                    setProperties({ ...resp })
                    form.setFieldsValue({ ...resp });

                    setFieldsChanged(false)
                    setSelected(null)
                }).catch(() => {
                    setSaving(false)
                })
            }

        }).catch((err) => {
            let errors = []
            for (let i in err.errorFields) {
                for (let n in err.errorFields[i].errors) {
                    errors.push(err.errorFields[i].errors[n])
                }
            }
            //Informamos dde que algunos valores no son válidos      
            const messages = ReactDOM.createRoot(document.getElementById('messages'));
            messages.render(
                <NotificationComponent type="error" text="invalidFields" description={errors.join('; ')}></NotificationComponent>
            );

        })
    }

    const handleConfirmCancel = () => {
        window.preventUnmountComponents = false
        setFieldsChanged(false)
        if (setSelected) setSelected(null);
    }

    useEffect(() => {
        window.preventUnmountComponents = fieldsChanged
    }, [fieldsChanged]);

    window.preventUnmountComponentFunction = () => {
        setShowModalConfirmExit(true);
    }

    useEffect(() => {
        setProperties({ ...item })
        form.setFieldsValue({ ...item });
    }, [])



    const handleOk = () => {
        form.validateFields().then((value) => {
            setSaving(true)
            if (isNew) {
                MediaGroupService.CREATE(unit.idUnt, properties).then((resp) => {
                    window.preventUnmountComponents = false
                    setSaving(false)
                    const messages = ReactDOM.createRoot(document.getElementById('messages'));
                    messages.render(
                        <NotificationComponent type="success" text="save"></NotificationComponent>
                    );
                    loadData()
                    //setFieldsChanged(false)
                    setSelected(null)
                }).catch(() => {
                    window.preventUnmountComponents = false
                    setSaving(false)
                })
            }
            else {
                MediaGroupService.UPDATE(unit.idUnt, properties).then((resp) => {
                    window.preventUnmountComponents = false
                    setSaving(false)
                    const messages = ReactDOM.createRoot(document.getElementById('messages'));
                    messages.render(
                        <NotificationComponent type="success" text="update"></NotificationComponent>
                    );
                    loadData()

                    setProperties({ ...resp })
                    form.setFieldsValue({ ...resp });

                    setFieldsChanged(false)
                    //setSelected(null)
                }).catch(() => {
                    window.preventUnmountComponents = false
                    setSaving(false)
                })
            }

        }).catch((err) => {
            let errors = []
            for (let i in err.errorFields) {
                for (let n in err.errorFields[i].errors) {
                    errors.push(err.errorFields[i].errors[n])
                }
            }
            //Informamos dde que algunos valores no son válidos      
            const messages = ReactDOM.createRoot(document.getElementById('messages'));
            messages.render(
                <NotificationComponent type="error" text="invalidFields" description={errors.join('; ')}></NotificationComponent>
            );

        })
    }


    return (
        <>
            <Row>
                <Col span={20} offset={2}>
                    <Card
                        size="small"
                        bordered={true}
                        style={{}}>

                        <Form
                            layout={"vertical"}
                            disabled={false} // De momento lo pongo siempre como editable... ya veremos como lo dejamos
                            onFieldsChange={(field, allFields) => {
                                //Actualizamos el valor, para que no haya que cambiar el foco del input para que se actualice
                                if (field.length > 0) properties[field[0].name[0]] = field[0].value;
                                setFieldsChanged(true);
                            }}
                            form={form}>

                            {<Form.Item style={{ marginleft: 'auto' }}>
                                <Row justify={"end"}>
                                    <Space>
                                        {fieldsChanged &&
                                            <Button type="primary" htmlType="submit" disabled={saving} onClick={handleOk}>
                                                <Space>
                                                    <SaveOutlined />
                                                    {!saving && i18next.t('common.actions.save.name')}
                                                    {saving && <>{i18next.t('common.actions.save.saving')} <Spin visible={saving}></Spin></>}
                                                </Space>
                                            </Button>
                                        }

                                        <Button htmlType="button" onClick={(e) => {
                                            if (fieldsChanged) {
                                                setShowModalConfirmExit(true);
                                                return false;
                                            }
                                            else {
                                                setSelected(null)
                                            }
                                        }}>
                                            <Space>
                                                <CloseCircleTwoTone />
                                                {i18next.t('common.actions.exit.name')}
                                            </Space>
                                        </Button>
                                    </Space>
                                </Row>
                            </Form.Item>}

                            <Form.Item
                                label={i18next.t('manager.mediagroup.resGrpName')}
                                name="resGrpName"
                                rules={[
                                    {
                                        required: true,
                                        message: i18next.t('common.msg.form.requiredField', { fieldName: i18next.t('manager.mediagroup.resGrpName') }),
                                    },
                                ]}
                            >
                                <Input />
                            </Form.Item>


                            <Form.Item
                                label={i18next.t('manager.mediagroup.description')}
                                name="description"
                                rules={[]}
                            >
                                <TextArea cols={3}></TextArea>
                            </Form.Item>

                            {<Form.Item
                                label={i18next.t('manager.mediagroup.uidResGrp')}
                                name="uidResGrp"
                                rules={[
                                    {
                                        message: i18next.t('common.msg.form.requiredField', { fieldName: i18next.t('manager.mediagroup.uidResGrp') }),
                                    },
                                ]}
                            >
                                <TextArea cols={3} disabled={!isNew}></TextArea>
                            </Form.Item>}

                        </Form>
                    </Card>
                </Col>
            </Row>

            <Modal title={i18next.t('common.msg.pendingSave.title')}
                okText={i18next.t('common.actions.yes.name')}
                cancelText={i18next.t('common.actions.no.name')}
                open={showModalConfirmExit} onOk={handleOkAndExit} onCancel={handleConfirmCancel}>
                <p>{i18next.t('common.msg.pendingSave.content')} </p>
            </Modal>
        </>
    );
}

export default FormResourceGroupComponent;