import { useEffect, useRef, useState } from "react";
import { UserService } from "../../../service/userService";
import { Button, Card, Input, Modal, Space, Spin, Table, Tooltip } from "antd";
import i18next from "i18next";
import { CheckCircleOutlined, DeleteOutlined, EditOutlined, ExclamationCircleOutlined, FileAddOutlined, SearchOutlined, SelectOutlined } from "@ant-design/icons";
import ReactDOM from 'react-dom/client';
import NotificationComponent from "../../utils/NotificationComponent";
import Icon from "@ant-design/icons/lib/components/Icon";
import Search from "antd/es/transfer/search";
import { getColumnSearchProps } from "../../../utilities/tableUtils";


function SelectUserInUnitComponent({ unit, addItem, excludeIdUsr,  setSelect}) {

    const [open, setOpen] = useState(true);
    const [data, setData] = useState();

    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');

    const getData = () => {      
        UserService.LISTBYUNIT(unit.idUnt).then((resp) => {           
            let dataAux = []
            let i = 0;
            resp.map((item, index) => {                
                if (!excludeIdUsr.includes(item.idUsr)) {
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
                            addItem(data[index])
                            excludeIdUsr.push(data[index].idUsr)
                            getData();
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
            title: i18next.t('manager.user.name'),
            dataIndex: 'usr',
            key: 'usr',
            sorter: (a, b) => {
                return a.usr.localeCompare(b.usr);
            },
            ...getColumnSearchProps('usr', i18next.t('manager.user.userName'),  setSearchText, setSearchedColumn)
        }]


 


    return (
        <>
            <Modal
                title={i18next.t('manager.user.select')}
                maskClosable={false}
                open={open}
                footer={null}
                onCancel={(e) => setSelect(null)}>

                {data && <Table columns={columns} dataSource={data} />}
                {!data && <Spin className="ant-spin-centered"/>}

            </Modal>
        </>
    );
}

export default SelectUserInUnitComponent;