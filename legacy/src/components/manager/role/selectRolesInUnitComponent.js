import { useEffect, useRef, useState } from "react";
//import { RoleService } from "../../../service/roleService";
import { Button, Card, Input, Modal, Space, Spin, Table, Tooltip } from "antd";
import i18next from "i18next";
import { CheckCircleOutlined, DeleteOutlined, EditOutlined, ExclamationCircleOutlined, FileAddOutlined, SearchOutlined, SelectOutlined } from "@ant-design/icons";
import { getColumnSearchProps } from "../../../utilities/tableUtils";
import { RolesService } from "../../../service/rolesService";


function SelectRoleInUnitComponent({ unit, permissions, addItem, excludeNames, setSelect }) {

    const [open, setOpen] = useState(true);
    const [data, setData] = useState();

    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const getData = () => {
        RolesService.LISTBYUNIT(unit.idUnt).then((resp) => {
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
            title: i18next.t('manager.roles.name'),
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => {
                return a.name.localeCompare(b.name);
            },
            ...getColumnSearchProps('name', i18next.t('manager.role.roleName'), setSearchText, setSearchedColumn)
        }]





    return (
        <>
            <Modal
                title={i18next.t('manager.roles.select')}
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

export default SelectRoleInUnitComponent;