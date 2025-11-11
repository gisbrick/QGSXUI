import { useEffect, useRef, useState } from "react";
import { Button, Card, Form, Input, Modal, Select, Space, Spin, Table, Tooltip } from "antd";
import i18next from "i18next";
import { CheckCircleOutlined, DeleteOutlined, EditOutlined, ExclamationCircleOutlined, FileAddOutlined, SearchOutlined, SelectOutlined } from "@ant-design/icons";
import ReactDOM from 'react-dom/client';
import Icon from "@ant-design/icons/lib/components/Icon";
import Search from "antd/es/transfer/search";
import { v4 as uuid } from 'uuid';



function ConfigParentComponent({unit, config, isNew, setSelect, saveParent, permissions}) {
   
    const [open, setOpen] = useState(true);

    const [form] = Form.useForm();
    const [fieldsChanged, setFieldsChanged] = useState(false);
    const [properties, setProperties] = useState();

    useEffect(() => {
        config.type = "PARENT"
        if (!config.key) config.key = uuid()
        if (!config.isLeaf) config.isLeaf = false
        if (!config.title) config.title = ""
        if (!config.permission) config.permission = ""
        if (!config.children) config.children = []
        setProperties({ ...config })
        form.setFieldsValue({ ...config });
    }, [])

    const filterOption = (input, option) =>
    (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

    return (
        <>
            <Modal
                title={i18next.t('manager.app.appTree.configParent')}
                maskClosable={false}
                open={open}
                onOk={(e) => {
                    form.validateFields().then(async (value) => {
                        config.title = value.title
                        config.permission = value.permission
                        saveParent(config)
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
                        label={i18next.t('manager.app.appTree.parentText')}
                        name="title"
                        rules={[
                            {
                                required: true,
                                message: i18next.t('common.msg.form.requiredField', { fieldName: i18next.t('manager.app.appTree.parentText') }),
                            },
                        ]}
                    >
                        <Input />
                    </Form.Item>

                    {<Form.Item
                        label={i18next.t('manager.app.prmName')}
                        name="permission"
                        rules={[
                            {
                                message: i18next.t('common.msg.form.requiredField', { fieldName: i18next.t('manager.app.prmName') }),
                            },
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

            </Modal>
        </>
    );
}

export default ConfigParentComponent;