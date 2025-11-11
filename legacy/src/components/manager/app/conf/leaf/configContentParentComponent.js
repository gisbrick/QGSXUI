import { useEffect, useRef, useState } from "react";
import { Button, Card, Checkbox, Form, Input, Modal, Select, Space, Spin, Table, Tooltip } from "antd";
import i18next from "i18next";
import { CheckCircleOutlined, DeleteOutlined, EditOutlined, ExclamationCircleOutlined, FileAddOutlined, SearchOutlined, SelectOutlined } from "@ant-design/icons";
import ReactDOM from 'react-dom/client';
import Icon from "@ant-design/icons/lib/components/Icon";
import Search from "antd/es/transfer/search";
import { v4 as uuid } from 'uuid';



function ConfigContentParentComponent({unit, config, isNew, setSelect, saveParent, permissions }) {
    const [open, setOpen] = useState(true);

    const [form] = Form.useForm();
    const [fieldsChanged, setFieldsChanged] = useState(false);
    const [properties, setProperties] = useState();

    useEffect(() => {
        config.type = "PARENT"
        if (!config.key) config.key = uuid()
        if (!config.isLeaf) config.isLeaf = false
        if (!config.title) config.title = ""
        if (!config.children) config.children = []
        if (!config.showAsTab) config.showAsTab = false
        if (!config.columns) config.columns = 1
        
        setProperties({ ...config })
        form.setFieldsValue({ ...config });
    }, [])

    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

    return (
        <>
            <Modal
                title={<div className="reader">{i18next.t('manager.app.contentTree.configParent')}</div>}
                maskClosable={false}
                open={open}
                onOk={(e) => {
                    form.validateFields().then(async (value) => {
                        //properties.title = value.title
                        //properties.permission = value.permission
                        //config.showAsTab = value.showAsTab                       
                        saveParent({...properties})
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
                        label={<div className="reader">{i18next.t('manager.app.contentTree.parentText')}</div>}
                        name="title"
                        rules={[
                        ]}
                    >
                        <Input />
                    </Form.Item>

                    <Form.Item
                        label={<div className="reader">{i18next.t('manager.app.contentTree.columns')}</div>}
                        name="columns"
                        rules={[
                        ]}
                    >
                        <Input type="number" />
                    </Form.Item>

                    <Form.Item
                        label=""
                        name="showAsTab"
                        rules={[
                        ]}
                    >
                        {properties && <Checkbox checked={properties.showAsTab} disabled={false} onChange={(e) => {
                            let copy = {...properties}
                            copy.showAsTab = e.target.checked
                            setProperties(copy)
                        }}>
                            <div className="reader">{i18next.t('manager.app.contentTree.showAsTab')}</div>
                        </Checkbox>}
                    </Form.Item>
                </Form>

            </Modal>
        </>
    );
}

export default ConfigContentParentComponent;