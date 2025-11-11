import { useEffect, useRef, useState } from "react";
import { Button, Card, Input, Form, Modal, Space, Spin, Table, Tooltip, Select } from "antd";
import i18next from "i18next";
import { CheckCircleOutlined, DeleteOutlined, EditOutlined, ExclamationCircleOutlined, FileAddOutlined, SearchOutlined, SelectOutlined } from "@ant-design/icons";
import ReactDOM from 'react-dom/client';
import Icon from "@ant-design/icons/lib/components/Icon";
import Search from "antd/es/transfer/search";
import { v4 as uuid } from 'uuid';
import LeafContentComponent from "./leaf/leafContentComponent";

function ConfigLeafComponent({unit, config, isNew, setSelect, saveLeaf, permissions }) {
    const [open, setOpen] = useState(true);

    const [form] = Form.useForm();
    const [fieldsChanged, setFieldsChanged] = useState(false);
    const [properties, setProperties] = useState();

    useEffect(() => {
        config.type = "LEAF"
        if (!config.key) config.key = uuid()
        if (!config.isLeaf) config.isLeaf = true
        if (!config.title) config.title = ""
        if (!config.permission) config.permission = ""
        if (!config.content) config.content = []
        setProperties({ ...config })
        form.setFieldsValue({ ...config });
    }, [])

    const filterOption = (input, option) =>
    (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

    return (
        <>
            <Modal
                title={<div className="reader">{i18next.t('manager.app.appTree.configLeaf')}</div>}
                maskClosable={false}
                open={open}
                onOk={(e) => {
                    form.validateFields().then(async (value) => {                        
                        config.title = value.title
                        config.permission = value.permission
                        config.content = properties.content
                        saveLeaf(config)
                    })                    
                }}
                onCancel={(e) => setSelect(null)}>

                <Form
                    layout={"vertical"}
                    disabled={false} // De momento lo pongo siempre como editable... ya veremos como lo dejamos
                    onFieldsChange={(field, allFields) => {
                        //Actualizamos el valor, para que no haya que cambiar el foco del input para que se actualice
                        if (field.length > 0) properties[field[0].name[0]] = field[0].value;
                        setFieldsChanged(true);
                    }}
                    form={form}>


                    <Form.Item
                        label={<div className="reader">{i18next.t('manager.app.appTree.treeText')}</div>}
                        name="title"
                        rules={[
                            {
                                required: true,
                                message: i18next.t('common.msg.form.requiredField', { fieldName: i18next.t('manager.app.appTree.treeText') }),
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>

                    {<Form.Item
                        label={<div className="reader">{i18next.t('manager.app.prmName')}</div>}
                        name="permission"
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
                </Form>

                {properties && <LeafContentComponent unit={unit} permissions={permissions} config={properties.content} setConf={(config)=>{
                    let copy = {...properties}
                    copy.content = config
                    setProperties(copy)
                }}></LeafContentComponent>}

            </Modal>
        </>
    );
}

export default ConfigLeafComponent;