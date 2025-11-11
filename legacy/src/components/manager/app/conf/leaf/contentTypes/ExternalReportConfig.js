import { useEffect, useRef, useState } from "react";
import { Button, Card, Input, Form, Modal, Space, Spin, Table, Tooltip, Select } from "antd";
import i18next from "i18next";
import { CheckCircleOutlined, DeleteOutlined, EditOutlined, ExclamationCircleOutlined, FileAddOutlined, SearchOutlined, SelectOutlined } from "@ant-design/icons";
import ReactDOM from 'react-dom/client';
import Icon from "@ant-design/icons/lib/components/Icon";
import Search from "antd/es/transfer/search";
import { v4 as uuid } from 'uuid';
import { ExternalReportsService } from "../../../../../../service/externalReportsService";

function ExternalReportConfig({ QGISPRJ, saveProperty, unit, config, properties, setProperties, permissions }) {


    const [reports, setReports] = useState();
    const [reportsConfig, setReportsConfig] = useState();

    useEffect(() => {
        loadReports()
    }, [])

    const loadReports = () => {
        ExternalReportsService.LIST().then((resp) => {
            
            let _reports = []
            let _reportsConfig = {}
            for (let key in resp) {
                for(let i in resp[key]){
                    let report = resp[key][i]
                    _reports.push({
                        value: key + ":" + report.id,
                        label: report.name
                    })
                    _reportsConfig[key + ":" + report.id] = {
                        value: key + ":" + report.id,
                        label: report.name,
                        config: report,
                        group: key
                    }
                }              
               
            }           
            setReports(_reports)
            setReportsConfig(_reportsConfig)

        })
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
                {reports && <Select
                    showSearch
                    placeholder={i18next.t('manager.app.contentTree.selectTable')}
                    optionFilterProp="children"
                    onChange={(e) => {
                        console.log("reportsConfig[e]", reportsConfig[e])
                        saveProperty("report", reportsConfig[e])
                    }}
                    filterOption={filterOption}
                    options={reports}
                />}
            </Form.Item>}
        </>
    );
}

export default ExternalReportConfig;