import { useEffect, useRef, useState } from "react";
import { Avatar, Button, Card, Checkbox, Col, DatePicker, Form, Input, Modal, Row, Space, Spin, Table, Tooltip, Upload } from "antd"
import i18next from "i18next";
import { CloseCircleTwoTone, DeleteOutlined, ExclamationCircleOutlined, FileAddOutlined, SaveOutlined, SearchOutlined } from "@ant-design/icons";
import ReactDOM from 'react-dom/client';
import NotificationComponent from "../../utils/NotificationComponent";
import { getColumnSearchProps } from "../../../utilities/tableUtils";
import { RolesService } from "../../../service/rolesService";
import SelectRoleInUnitComponent from "./selectRolesInUnitComponent";

function FormRoleInPermissionComponent({ unit, permissions, setPermissions }) {

    const [form] = Form.useForm();
    const [data, setData] = useState(false);

    const [select, setSelect] = useState();
    const [excludeNames, setExcludeNames] = useState();
    const [selected, setSelected] = useState();

    const [toDelete, setToDelete] = useState();
    const [confimDelete, setConfimDelete] = useState();

    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');


    const getData = () => {       
        RolesService.LISTBYUNITANDPERMISSION(unit.idUnt, permissions.name).then((resp) => {
            let dataAux = []
            let i = 0;
            resp.map((name, index) => {
                var item = {}
                item.index = index
                item.name = name
                dataAux.push({ ...item })
            })
            setData(dataAux)
        })
        /*
        RolesService.LISTBYUNITANDPERMISSION(unit.idUnt, permissions.name).then((resp) => {
            resp.map((item, index) => {
                item.index = index
            })
            setData(resp)
        })*/
    }

    const add = (permission) => {        
        let skip = []
        for (let i in data) {
            skip.push(data[i].name)
        }
        setExcludeNames(skip)
        setSelect(true)

    }

    const addItem = (role) => {
        console.log("addItem", role)
        //AÑADIMOS EL ROL AL PERMISO
        RolesService.ADDPERMISSION2ROLE(unit.idUnt, role.name, permissions.name).then((resp) => {
            const messages = ReactDOM.createRoot(document.getElementById('messages'));
            messages.render(
                <NotificationComponent type="success" text="add"></NotificationComponent>
            );
            /*
            let skip = [...skip]
            skip.push(role.name)
            setExcludeNames(skip)
            */
            getData();
        })
    }

    const deleteItem = () => {  
        //BORRAMOS EL ROL DEL PERMISO
        RolesService.DELPERMISSIONFROMROLE(unit.idUnt, toDelete.name, permissions.name).then((resp) => {
            const messages = ReactDOM.createRoot(document.getElementById('messages'));
            messages.render(
                <NotificationComponent type="success" text="delete"></NotificationComponent>
            );
            setConfimDelete(false);
            getData();
        })       
    }


    useEffect(() => {
        getData();
    }, [])


    const renderToolbar = (index) => {
        return <Space wrap>
            {/**BOTON BORRAR */}
            {
                <Tooltip title={i18next.t('common.actions.delete.name')} key={"delete"}>
                    <Button size='middle' disabled={false} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                        onClick={(e) => {
                            setToDelete(data[index])
                            setConfimDelete(true)                            
                            window.mouseOverButton = false
                        }}
                        type={"default"} shape="circle">
                        <DeleteOutlined />
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
            render: (index) => renderToolbar(index)
        },
        {
            title: i18next.t('manager.roles.name'),
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => {
                //SORTER STRING
                return a.name.localeCompare(b.name);
            },
            ...getColumnSearchProps('name', i18next.t('manager.roles.name'), setSearchText, setSearchedColumn)
        }
    ]


    return (
        <>
            <Row>
                <Col span={20} offset={2}>
                    <Card
                        size="small"
                        bordered={true}
                        style={{}}>
                        <Form
                            layout={"vertical"}
                            disabled={false} // De momento lo pongo siempre como editable... ya veremos como lo dejamos                           
                            form={form}>

                            {<Form.Item style={{ marginleft: 'auto' }}>
                                <Row justify={"end"}>
                                    <Space>
                                        <Button htmlType="button" onClick={(e) => setPermissions(null)}>
                                            <Space>
                                                <CloseCircleTwoTone />
                                                {i18next.t('common.actions.exit.name')}
                                            </Space>

                                        </Button>
                                    </Space>
                                </Row>
                            </Form.Item>}

                            {!data && <Spin className="ant-spin-centered"></Spin>}
                            {data && <Card
                                size="small"
                                bordered={true}
                                title={i18next.t('manager.roles.permissions', {name: permissions.name})}
                                style={{}}>
                                {data && !selected && <>
                                    <Button type="primary"
                                        disabled={false} onClick={(e) => add()}>
                                        <Space>
                                            <FileAddOutlined />
                                            {i18next.t('common.actions.add.name')}
                                        </Space>
                                    </Button>
                                    <Table columns={columns} dataSource={data} />
                                </>}

                            </Card>}

                        </Form>
                    </Card>
                </Col>
            </Row >

            {select && <SelectRoleInUnitComponent unit={unit} permissions={permissions} addItem={addItem} excludeNames={excludeNames} setSelect={setSelect} />
            }

            {/* MODAL DE CONFIRMACiÓN DE BORRADO */}
            {<Modal
                title={(<><ExclamationCircleOutlined /> {i18next.t('common.actions.delete.name')}</>)}
                okText={i18next.t('common.actions.delete.name')}
                okButtonProps={{ disabled: false }}
                cancelText={i18next.t('common.actions.cancel.name')}
                cancelButtonProps={{ disabled: false }}
                maskClosable={false}
                icon={<ExclamationCircleOutlined />}
                open={confimDelete}
                onOk={(e) => deleteItem()}
                onCancel={(e) => setConfimDelete(false)}>
                <p>{i18next.t('common.actions.delete.confirmMsg')}</p>
            </Modal>}

        </>
    );
}

export default FormRoleInPermissionComponent;