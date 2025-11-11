import { useEffect, useRef, useState } from "react";
import { Button, Card, Input, Modal, Space, Spin, Table, Tooltip } from "antd";
import i18next from "i18next";
import { CheckCircleOutlined, DeleteOutlined, EditOutlined, ExclamationCircleOutlined, FileAddOutlined, SearchOutlined, SelectOutlined } from "@ant-design/icons";
import { getColumnSearchProps } from "../../../utilities/tableUtils";
import { PermissionsService } from "../../../service/permissionsService";


function SelectPermissionInUnitComponent({ unit, addItem, excludeNames, setSelect }) {

    const [open, setOpen] = useState(true);
    const [data, setData] = useState();

    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');

    const getData = () => {
        PermissionsService.LISTBYUNIT(unit.idUnt).then((resp) => {
            let dataAux = []
            let i = 0;
            resp.map((value, index) => {
                if (!excludeNames.includes(value)) {
                    let item = {}
                    item.index = i;
                    item.name = value;
                    dataAux.push({ ...item })
                    ++i
                }
            })
            setData(dataAux)
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
                            excludeNames.push(data[index].name)
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
            title: i18next.t('manager.permissions.name'),
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => {
                return a.usr.localeCompare(b.usr);
            },
            ...getColumnSearchProps('name', i18next.t('manager.permissions.permissionName'), setSearchText, setSearchedColumn)
        }]





    return (
        <>
            <Modal
                title={i18next.t('manager.permissions.select')}
                maskClosable={false}
                open={open}
                footer={null}
                onCancel={(e) => setSelect(null)}>

                {data && <Table columns={columns} dataSource={data} />}
                {!data && <Spin className="ant-spin-centered" />}

            </Modal>
        </>
    );
}

export default SelectPermissionInUnitComponent;