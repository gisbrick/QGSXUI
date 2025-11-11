import { useEffect, useRef, useState } from "react";
import { Button, Card, Input, Form, Modal, Space, Table, Tooltip, Select } from "antd";
import i18next from "i18next";
import { CheckCircleOutlined, DeleteOutlined, EditOutlined, ExclamationCircleOutlined, FileAddOutlined, SearchOutlined, SelectOutlined } from "@ant-design/icons";
import ReactDOM from 'react-dom/client';
import Icon from "@ant-design/icons/lib/components/Icon";
import Search from "antd/es/transfer/search";
import { v4 as uuid } from 'uuid';

function TableConfig({ QGISPRJ, saveProperty, unit, config, properties, setProperties, permissions }) {

    const [tables, seTables] = useState();

    const loadTables = () =>{
        let values = [];
        for(let i in QGISPRJ.layers){
            if(QGISPRJ.layers[i].classType == "QgsVectorLayer"){
                values.push({
                    value: QGISPRJ.layers[i].name,
                    label: QGISPRJ.layers[i].name
                })
            }

        }
        seTables(values)
    }
    useEffect(() => {
        loadTables();
    }, [])

    const filterOption = (input, option) =>
    (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

    return (
        <>
            {tables && <Form.Item
                label={<div className="reader">{i18next.t('manager.app.contentTree.table')}</div>}
                name="table"
                rules={[
                    {
                        required: true,
                        message: i18next.t('common.msg.form.requiredField', { fieldName: i18next.t('manager.app.contentTree.table') }),
                    }
                ]}
            >
                <Select
                    showSearch
                    placeholder={i18next.t('manager.app.contentTree.selectTable')}
                    optionFilterProp="children"
                    onChange={(e) => {                       
                        saveProperty("table", e)
                    }}
                    filterOption={filterOption}
                    options={tables}
                />
            </Form.Item>}
        </>
    );
}

export default TableConfig;