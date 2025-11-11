import { useEffect, useRef, useState } from "react";
import { UnitService } from "../../../service/unitService";
import { Button, Card, Checkbox, Col, DatePicker, Form, Input, Modal, Row, Select, Space, Spin, Table, Tooltip, Upload } from "antd"
import i18next from "i18next";
import { CloseCircleTwoTone, DeleteOutlined, FileAddOutlined, SaveOutlined, SearchOutlined, UploadOutlined } from "@ant-design/icons";
import ReactDOM from 'react-dom/client';
import NotificationComponent from "../../utils/NotificationComponent";
import Search from "antd/es/transfer/search";
import SelectUsertComponent from "../user/selectUserComponent";
import { UnitUserService } from "../../../service/unitUserService";
import TextArea from "antd/es/input/TextArea";
import SelectUserComponent from "../user/selectUserComponent";
import { MediaGroupService } from "../../../service/mediaGroupService";
import { PermissionsService } from "../../../service/permissionsService";
import { AppService } from "../../../service/appService";
import AppConfComponent from "./conf/appConfComponent";

function FormAppComponent({ unit, item, loadData, setSelected }) {

    const [form] = Form.useForm();
    const [fieldsChanged, setFieldsChanged] = useState(false);

    const [selectedFile, setSelectedFile] = useState();

    const [permissions, setPermissions] = useState();

    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');

    const [selectUser, setSelectUser] = useState();
    const [excludeUserIds, setExcludeUserIds] = useState();

    const [properties, setProperties] = useState();

    const [saving, setSaving] = useState();

    const [showModalConfirmExit, setShowModalConfirmExit] = useState(false);

    const isNew = !item.idUntApp

    const handleOkAndExit = () => {
        window.preventUnmountComponents = false
        //Cerramos la modal de confirmación
        setShowModalConfirmExit(false)

        form.validateFields().then(async (value) => {
            let saveProperties = { ...properties }
            saveProperties["config"] = JSON.stringify(properties.config);
            setSaving(true)
            if (isNew) {
                AppService.CREATE(unit.idUnt, saveProperties).then((resp) => {
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
                AppService.UPDATE(unit.idUnt, saveProperties).then((resp) => {
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


    const languages = [{
        value: null,
        label: ""
    }, {
        value: "en",
        label: "English (en)"
    }, {
        value: "es",
        label: "Español (es)"
    }]

    const loadValues = () => {
        PermissionsService.LISTBYUNIT(unit.idUnt).then((resp) => {
            let dataAux = [{
                value: null,
                label: ""
            }]
            resp.map((item, index) => {
                dataAux.push({
                    value: item,
                    label: item
                })
            })
            setPermissions(dataAux);
        })
    }


    useEffect(() => {
        window.preventUnmountComponents = fieldsChanged
    }, [fieldsChanged]);

    window.preventUnmountComponentFunction = () => {
        setShowModalConfirmExit(true);
    }

    useEffect(() => {
        if (item.config && (typeof item.config === 'string' || item.config instanceof String)) {
            item.config = JSON.parse(item.config)
        }
        if(item.isPublished == null || item.isPublished == "undefined" || item.isPublished == ""){
            item.isPublished = false
        }
        setProperties({ ...item })
        form.setFieldsValue({ ...item });
        loadValues();
    }, [])

    const dummyUploadRequest = ({ file, onSuccess }) => {
        setTimeout(() => {
            onSuccess("ok");
        }, 0);
    };

    const getFileList = () => {
        if (properties.thumbnail) {
            return [{
                uid: '-1',
                name: 'thumbnail.png',
                status: 'done',
                url: properties.thumbnail,
            }]
        }
        else {
            return []
        }

    }

    const uploadProps = {
        multiple: false,
        customRequest: dummyUploadRequest,
        onRemove: (file) => {
            setSelectedFile(null);
        },
        onChange: (info) => {

        },
        beforeUpload: async (file) => {
            setSelectedFile(file);
            setFieldsChanged(true);

            const image = await readAsDataURL(file)
            properties["thumbnail"] = image.data;
            setProperties({ ...properties })

            return true;


        },
        onRemove: () => {
            properties.thumbnail = null
            setProperties({ ...properties })
            setFieldsChanged(true)
        },
        fileList: properties ? getFileList() : [],
        accept: ".jpg,.png"
    };

    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());


    const handleOk = () => {
        form.validateFields().then(async (value) => {
            let saveProperties = { ...properties }
            saveProperties["config"] = JSON.stringify(properties.config);
            setSaving(true)
            if (isNew) {
                AppService.CREATE(unit.idUnt, saveProperties).then((resp) => {
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
                AppService.UPDATE(unit.idUnt, saveProperties).then((resp) => {
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

    const setConf = (config) => {
        setFieldsChanged(true);
        let propertiesCopy = { ...properties }
        propertiesCopy.config = [...config]
        setProperties(propertiesCopy)
    }

    function readAsDataURL(file) {
        return new Promise((resolve, reject) => {
            let fileReader = new FileReader();
            fileReader.onload = function () {
                return resolve({ data: fileReader.result, name: file.name, size: file.size, type: file.type });
            }
            fileReader.readAsDataURL(file);
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
                                                {!saving && <div className="i">{i18next.t('common.actions.save.name')}</div>}
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
                                                <div className="reader">{i18next.t('common.actions.exit.name')}</div>
                                            </Space>
                                            
                                        </Button>
                                    </Space>
                                </Row>
                            </Form.Item>}

                            <Form.Item
                                label={<div className="reader">{i18next.t('manager.app.appName')}</div>}
                                name="appName"
                                rules={[
                                    {
                                        required: true,
                                        message: i18next.t('common.msg.form.requiredField', { fieldName: i18next.t('manager.app.appName') }),
                                    },
                                ]}
                            >
                                <Input />
                            </Form.Item>


                            <Form.Item
                                label={<div className="reader">{i18next.t('manager.app.description')}</div>}
                                name="description"
                                rules={[]}
                            >
                                <TextArea cols={3}></TextArea>
                            </Form.Item>

                            {
                                <Form.Item
                                    label={<div className="reader">{i18next.t('manager.app.language')}</div>}
                                    name="lang"
                                    rules={[

                                    ]}
                                >
                                    <Select
                                        showSearch
                                        placeholder={i18next.t('manager.app.language')}
                                        optionFilterProp="children"
                                        onChange={(e) => {
                                            let copy = { ...properties }
                                            copy.language = e
                                            setProperties(copy)
                                            form.setFieldsValue(copy);
                                            setFieldsChanged(true);
                                        }}
                                        filterOption={filterOption}
                                        options={languages}
                                    />
                                </Form.Item>}

                            <Form.Item
                                name="isPublished"
                                rules={[]}
                            >
                                {properties && <Checkbox checked={properties.isPublished} disabled={false} onChange={(e) => {
                                    let copy = { ...properties }
                                    copy.isPublished = e.target.checked
                                    setProperties(copy)
                                }}>
                                    <div className="reader">{i18next.t('manager.app.isPublished')}</div>
                                </Checkbox>}
                            </Form.Item>


                            {<Form.Item
                                label={<div className="reader">{i18next.t('manager.app.prmName')}</div>}
                                name="prmName"
                                rules={[

                                ]}
                            >
                                {permissions && <Select
                                    showSearch
                                    placeholder={i18next.t('manager.app.prmName')}
                                    optionFilterProp="children"
                                    filterOption={filterOption}
                                    options={permissions}
                                />}
                            </Form.Item>}


                            {<Form.Item
                                label={<div className="reader">{i18next.t('manager.app.thumbnail')}</div>}
                                name="selectFile"
                                rules={[

                                ]}
                            >
                                <Upload {...uploadProps}>
                                    <Button>
                                        <Space>
                                            <UploadOutlined />
                                            <div className="reader">{i18next.t('manager.app.selectThumbnail')}</div>
                                        </Space>
                                        
                                        </Button>
                                </Upload>
                            </Form.Item>}

                        </Form>
                        {properties && <AppConfComponent unit={unit} config={properties.config} setConf={setConf} permissions={permissions}></AppConfComponent>}
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

export default FormAppComponent;