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
import { getColumnSearchProps } from "../../../utilities/tableUtils";

function FormtUnitComponent({ item, loadData, setSelected }) {

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

    const isNew = !item.idUnt

    const handleOkAndExit = () => {
        window.preventUnmountComponents = false
        //Cerramos la modal de confirmación
        setShowModalConfirmExit(false)

        form.validateFields().then((value) => {
            setSaving(true)
            if (isNew) {
                UnitService.CREATE(properties).then((resp) => {
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
                UnitService.UPDATE(properties).then((resp) => {
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

    const getUserUnits = () => {
        if (item.idUnt) {
            UnitService.LISTUNITS(item.idUnt).then((resp) => {
                //Añadimos el valor del index
                //Comprobamos que los valores de la variable item estén actualziadas  
                item.unitUserList = []
                resp.map((unitUser, index) => {
                    unitUser.index = index;
                    item.unitUserList.push({
                        "idUntUsr": unitUser.idUntUsr,
                        "isManager": unitUser.isManager,
                        "permissionList": unitUser.permissionList
                    })

                })
                setUserUnits(resp)
            })
        }
        else {
            setUserUnits([])
        }

    }

    const onSelectUser = (user) => {
        setSelectUser(false)
        setExcludeUserIds(null);
        if (user) {
            UnitService.ADDUSER(item.idUnt, user).then((resp) => {
                let propertiesCopy = { ...properties }
                if (!propertiesCopy.unitUserList) propertiesCopy.unitUserList = []
                propertiesCopy.unitUserList.push({
                    "idUntUsr": resp.idUntUsr,
                    "isManager": resp.isManager,
                    "permissionList": []

                })
                setProperties(propertiesCopy)
                const messages = ReactDOM.createRoot(document.getElementById('messages'));
                messages.render(
                    <NotificationComponent type="success" text="add"></NotificationComponent>
                );
                getUserUnits();
            })
        }
    }

    useEffect(() => {
        window.preventUnmountComponents = fieldsChanged
    }, [fieldsChanged]);

    window.preventUnmountComponentFunction = () => {
        setShowModalConfirmExit(true);
    }

    useEffect(() => {
        getUserUnits();
        setProperties({ ...item })
        form.setFieldsValue({ ...item });
    }, [])

    const addUser = () => {
        setSelectUser(true)
        let exclude = []
        userUnits.map((userUnit) => {
            exclude.push(userUnit.idUsr)
        })
        setExcludeUserIds(exclude)
    }



    const handleOk = () => {
        form.validateFields().then((value) => {
            setSaving(true)
            if (isNew) {
                UnitService.CREATE(properties).then((resp) => {
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
                UnitService.UPDATE(properties).then((resp) => {
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

    const renderUnitUserListToolbar = (index) => {
        return <Space wrap>
            {/* BOTON BORRAR*/}
            {
                <Tooltip title={i18next.t('common.actions.delete.name')} key={"delete"}>
                    <Button size='middle' disabled={false} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                        onClick={(e) => {
                            UnitUserService.DELETE(userUnits[index].idUntUsr).then((resp) => {

                                let propertiesCopy = { ...properties }
                                let unitUserListCopy = []
                                propertiesCopy.unitUserList.map((unitUser) => {
                                    if (unitUser.idUntUsr != userUnits[index].idUntUsr) {
                                        unitUserListCopy.push(unitUser)
                                    }
                                })
                                propertiesCopy.unitUserList = unitUserListCopy
                                setProperties({ ...propertiesCopy })

                                const messages = ReactDOM.createRoot(document.getElementById('messages'));
                                messages.render(
                                    <NotificationComponent type="success" text="delete"></NotificationComponent>
                                );
                                getUserUnits()
                            })
                            window.mouseOverButton = false
                        }}
                        type={"default"} shape="circle">
                        <DeleteOutlined />
                    </Button>
                </Tooltip>
            }
        </Space>
    }


    const unitUserListColumns = [
        {
            title: '',
            dataIndex: 'index',
            key: 'index',
            render: (index) => renderUnitUserListToolbar(index)
        },
        {
            title: i18next.t('manager.user.usr'),
            dataIndex: 'usrName',
            key: 'usrName',
            sorter: (a, b) => {
                return a.usrName.localeCompare(b.usrName);
            },
            ...getColumnSearchProps('usrName', i18next.t('manager.user.usr'), setSearchText, setSearchedColumn)
        },
        /*{
            title: i18next.t('manager.unit.name'),
            dataIndex: 'unitName',
            key: 'unitName',
            sorter: (a, b) => {
                //SORTER STRING
                return a.unitName.localeCompare(b.unitName);
            },
            ...getColumnSearchProps('unitName', i18next.t('manager.unit.name'),  setSearchText, setSearchedColumn)
        }*/

        {
            title: i18next.t('manager.unit.isManager'),
            dataIndex: 'isManager',
            key: 'isManager',
            render: (value, record) => {
                return <Checkbox checked={value}
                    onChange={(e) => {
                        userUnits[record.index].isManager = e.target.checked
                        let propertiesCopy = { ...properties }
                        if (!propertiesCopy.unitUserList) propertiesCopy.unitUserList = []
                        propertiesCopy.unitUserList.map((unitUser) => {
                            if (unitUser.idUntUsr == record.idUntUsr) {
                                unitUser.isManager = e.target.checked
                            }
                        })
                        setProperties({ ...propertiesCopy })

                        setUserUnits([...userUnits])
                        setFieldsChanged(true)
                    }}></Checkbox> // just for decoration
            },
            sorter: (a, b) => {
                //SORTER BOOLEAN
                return a.isManager - b.isManager
            },
            filters: [
                {
                    text: i18next.t('common.value.yes'),
                    value: "true",
                },
                {
                    text: i18next.t('common.value.no'),
                    value: "false",
                }],
            onFilter: (value, record) => {
                let out = String(record.isManager) == value
                return out
            }
        }
    ]


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
                                            <Button type="primary" htmlType="submit" disabled={saving} onClick={handleOk} style={{width:"100px"}}>
                                                <Space>
                                                {<SaveOutlined />}
                                                {!saving && <div className="i">{i18next.t('common.actions.save.name')}</div>}
                                                </Space>

                                                {saving && <>{i18next.t('common.actions.save.saving')} <Spin visible={saving}></Spin></>}
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
                                            {<div className="reader">{i18next.t('common.actions.exit.name')}</div>}
                                            </Space>
                      
                                        </Button>
                                    </Space>
                                </Row>
                            </Form.Item>}

                            <Form.Item
                                label={<div className="reader">{i18next.t('manager.unit.name')}</div>}
                                name="unitName"
                                rules={[
                                    {
                                        required: true,
                                        message: i18next.t('common.msg.form.requiredField', { fieldName: i18next.t('manager.unit.name') }),
                                    },
                                ]}
                            >
                                <Input disabled={!isNew} />
                            </Form.Item>

                            <Form.Item
                                label={<div className="reader">{i18next.t('manager.unit.description')}</div>}
                                name="description"
                                rules={[
                                    {
                                        required: true,
                                        message: i18next.t('common.msg.form.requiredField', { fieldName: i18next.t('manager.unit.description') }),
                                    },
                                ]}
                            >
                                <Input />
                            </Form.Item>

                            <Form.Item
                                label={<div className="reader">{i18next.t('manager.unit.path')}</div>}
                                name="path"
                                rules={[
                                    {
                                        required: true,
                                        message: i18next.t('common.msg.form.requiredField', { fieldName: i18next.t('manager.unit.path') }),
                                    },
                                ]}
                            >
                                <TextArea cols={3}></TextArea>
                            </Form.Item>

                            {!isNew && <Card
                                size="small"
                                bordered={true}
                                title={i18next.t('manager.unit.users')}
                                style={{}}>
                                <Button type="primary" 
                                    disabled={false} onClick={(e) => addUser()}>
                                        <Space>
                                        <FileAddOutlined />
                                            {i18next.t('common.actions.add.name')}
                                        </Space>
                                    
                                </Button>
                                <Table columns={unitUserListColumns} dataSource={userUnits} />
                            </Card>}
                        </Form>
                    </Card>
                </Col>
            </Row>
            {selectUser && excludeUserIds && <SelectUserComponent onSelect={onSelectUser} excludeIds={excludeUserIds}></SelectUserComponent>}

            <Modal title={i18next.t('common.msg.pendingSave.title')}
                okText={i18next.t('common.actions.yes.name')}
                cancelText={i18next.t('common.actions.no.name')}
                open={showModalConfirmExit} onOk={handleOkAndExit} onCancel={handleConfirmCancel}>
                <p>{i18next.t('common.msg.pendingSave.content')} </p>
            </Modal>
        </>
    );
}

export default FormtUnitComponent;