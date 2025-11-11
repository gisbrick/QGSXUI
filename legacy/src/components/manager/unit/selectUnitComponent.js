import { useEffect, useRef, useState } from "react";
import { UnitService } from "../../../service/unitService";
import { Button, Card, Input, Modal, Space, Spin, Table, Tooltip } from "antd";
import i18next from "i18next";
import FormtUnitComponent from "./formUnitComponent";
import { CheckCircleOutlined, DeleteOutlined, EditOutlined, ExclamationCircleOutlined, FileAddOutlined, SearchOutlined, SelectOutlined } from "@ant-design/icons";
import ReactDOM from 'react-dom/client';
import NotificationComponent from "../../utils/NotificationComponent";
import Icon from "@ant-design/icons/lib/components/Icon";
import Search from "antd/es/transfer/search";
import { getColumnSearchProps } from "../../../utilities/tableUtils";

function SelectUnitComponent({ onSelect, excludeIds }) {

    const [open, setOpen] = useState(true);
    const [data, setData] = useState();

    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');

    const getData = () => {      
        UnitService.LIST().then((resp) => {           
            let dataAux = []
            let i = 0;
            resp.map((item, index) => {                
                if (!excludeIds.includes(item.idUnt)) {
                    item.index = i;
                    dataAux.push({ ...item })
                    ++i
                }
            })
            setData(dataAux);
        })
    }

    useEffect(() => {
        getData()
    }, [])

    const renderToolbar = (index) => {
        return <Space wrap>
            {/* BOTON SELECCIONAR*/}
            {
                <Tooltip title={i18next.t('common.actions.select.name')} key={"edit"}>
                    <Button size='middle' disabled={false} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                        onClick={(e) => {
                            onSelect(data[index])
                            window.mouseOverButton = false
                        }}
                        type={"default"} shape="circle">
                        <CheckCircleOutlined />
                    </Button>
                </Tooltip>
            }
        </Space>
    }

   
    const columns = [       
        {
            title: '',
            dataIndex: 'index',
            key: 'index',
            render: (index) => renderToolbar(index),
        },
        {
            title: i18next.t('manager.unit.name'),
            dataIndex: 'unitName',
            key: 'unitName',
            sorter: (a, b) => {
                return a.unitName.localeCompare(b.unitName);
            },
            ...getColumnSearchProps('unitName', i18next.t('manager.unit.unitName'),  setSearchText, setSearchedColumn)
        },
        {
            title: i18next.t('manager.unit.description'),
            dataIndex: 'description',
            key: 'description',
            sorter: (a, b) => {
                return a.description.localeCompare(b.description);
            },
            ...getColumnSearchProps('description', i18next.t('manager.unit.description'),  setSearchText, setSearchedColumn)
        }]


 


    return (
        <>
            <Modal
                title={i18next.t('manager.unit.select')}
                maskClosable={false}
                open={open}
                footer={null}
                onCancel={(e) => onSelect(null)}>

                {data && <Table columns={columns} dataSource={data} />}
                {!data && <Spin className="ant-spin-centered"/>}

            </Modal>
        </>
    );
}

export default SelectUnitComponent;