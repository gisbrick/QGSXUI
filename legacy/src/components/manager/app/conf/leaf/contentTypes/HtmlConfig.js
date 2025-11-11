import { useEffect, useRef, useState } from "react";
import { Button, Card, Input, Form, Modal, Space, Spin, Table, Tooltip, Select } from "antd";
import i18next from "i18next";
import { CheckCircleOutlined, DeleteOutlined, EditOutlined, ExclamationCircleOutlined, FileAddOutlined, SearchOutlined, SelectOutlined } from "@ant-design/icons";
import ReactDOM from 'react-dom/client';
import Icon from "@ant-design/icons/lib/components/Icon";
import Search from "antd/es/transfer/search";
import { v4 as uuid } from 'uuid';
import HtmlEditor from "../../../../../inputs/custom/htmlEditorComponent";
import RichTextEditor from "react-rte";

function HtmlConfig({ QGISPRJ, saveProperty, unit, config, properties, setProperties, permissions }) {
    const [html, setHtml] = useState();
    //let html = RichTextEditor.createValueFromString(htmlValue, 'html');

    useEffect(() => {
        if (properties && "html" in properties) {          
            setHtml(properties["html"]);
        }
        else{
            setHtml("...");
        }
    }, [])

    const handleSetHtml = (e) => {
        //console.log("handleSetHtml", e)
        saveProperty("html", e)
    }

    //HtmlEditor = ({  editable, htmlValue, setHtmlValue, value, onChange }) 
    return (
        <>
            <Form.Item
                label={<div className="reader">{i18next.t('manager.app.contentTree.html')}</div>}
                name="html"
                rules={[]}
            >
                {html && <HtmlEditor editable={true} htmlValue={html} setHtmlValue={setHtml} value={html} onChange={handleSetHtml}></HtmlEditor>}
            </Form.Item>
        </>
    );
}

export default HtmlConfig;