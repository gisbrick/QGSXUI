import { useEffect, useRef, useState } from "react";
import { Button, Card, Input, Form, Modal, Space, Spin, Table, Tooltip, Select } from "antd";
import i18next from "i18next";
import { CheckCircleOutlined, DeleteOutlined, EditOutlined, ExclamationCircleOutlined, FileAddOutlined, SearchOutlined, SelectOutlined } from "@ant-design/icons";
import ReactDOM from 'react-dom/client';
import Icon from "@ant-design/icons/lib/components/Icon";
import Search from "antd/es/transfer/search";
import { v4 as uuid } from 'uuid';

function ReportConfig({ QGISPRJ, saveProperty, unit, config, properties, setProperties, permissions }) {

    let reports = []
    for (let i in QGISPRJ.layoutManager.layouts){
        let layout = QGISPRJ.layoutManager.layouts[i]
        if(layout.classType == "QgsReport"){
            reports.push({
                    value: layout.name,
                    label: layout.name
                })
        }
    }

    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

    return (
        <>
            {<Form.Item
                label={<div className="reader">{i18next.t('manager.app.contentTree.report')}</div>}
                name="layout"
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
                        saveProperty("layout", e)
                    }}
                    filterOption={filterOption}
                    options={reports}
                />
            </Form.Item>}
        </>
    );
}

export default ReportConfig;