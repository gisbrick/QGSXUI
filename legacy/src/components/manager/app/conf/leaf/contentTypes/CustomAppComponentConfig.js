import { useEffect, useRef, useState } from "react";
import { Button, Card, Input, Form, Modal, Space, Spin, Table, Tooltip, Select } from "antd";
import i18next from "i18next";
import { CheckCircleOutlined, DeleteOutlined, EditOutlined, ExclamationCircleOutlined, FileAddOutlined, SearchOutlined, SelectOutlined } from "@ant-design/icons";
import ReactDOM from 'react-dom/client';
import Icon from "@ant-design/icons/lib/components/Icon";
import Search from "antd/es/transfer/search";
import { v4 as uuid } from 'uuid';
import components_config from '../../../../../customappcomponents/config.json';

function CustomAppComponentConfig({ QGISPRJ, saveProperty, unit, config, properties, setProperties, permissions }) {

    console.log("components_config", components_config)

    const [groups, setGroups] = useState();
    const [components, setComponents] = useState();
    const [component_config, setComponent_config] = useState();

    useEffect(() => {
        loadGroups()
        setComponent_config({ group: null, component: null, config: {} })
    }, [])

    const loadGroups = () => {
        let _groups = []

        for (let key in components_config) {
            _groups.push({
                value: key,
                label: i18next.t('custom_app_component.' + key + ".label")
            })
        }
        setGroups(_groups)
    }

    const loadComponents = (group) => {
        let _components = []
        let _group = components_config[group]

        for (let key in _group) {
            _components.push({
                value: key,
                label: i18next.t('custom_app_component.' + group + "." + key + ".label")
            })
        }
        setComponents(_components)
    }

    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

    return (
        <>
            {<Form.Item
                label={<div className="reader">{i18next.t('manager.app.contentTree.custom_app_component')}</div>}
                name="layout"
                rules={[

                ]}
            >
                {groups && <Select
                    showSearch
                    placeholder={i18next.t('manager.app.contentTree.selectGroup')}
                    optionFilterProp="children"
                    onChange={(e) => {
                        let _component_config = { ...component_config }
                        _component_config.group = e;
                        saveProperty("custom_app_component", _component_config)
                        setComponent_config(_component_config)
                        loadComponents(e)
                        
                    }}
                    filterOption={filterOption}
                    options={groups}
                />}

                {components && <Select
                    showSearch
                    placeholder={i18next.t('manager.app.contentTree.selectComponent')}
                    optionFilterProp="children"
                    onChange={(e) => {
                        let _component_config = { ...component_config }
                        _component_config.component = e;
                        saveProperty("custom_app_component", _component_config)
                        setComponent_config(_component_config)             
                    }}
                    filterOption={filterOption}
                    options={components}
                />}

            </Form.Item>}
        </>
    );
}

export default CustomAppComponentConfig;