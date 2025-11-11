import { useEffect, useRef, useState } from "react";
import { Button, Card, Col, Form, Input, Modal, Row, Select, Space, Spin, Table, Tour, Tooltip } from "antd";
import i18next from "i18next";
import ReactDOM from 'react-dom/client';
import { DeleteOutlined, EditOutlined, ExclamationCircleOutlined, FileAddOutlined, KeyOutlined, QuestionCircleOutlined, UserOutlined } from "@ant-design/icons";
import Search from "antd/es/transfer/search";
import NotificationComponent from "../../utils/NotificationComponent";
import FormRolesComponent from "../role/formRolesComponent";
import FormUserInRoleComponent from "../user/formUserInRoleComponent";
import { getColumnSearchProps } from "../../../utilities/tableUtils";
import { RolesService } from "../../../service/rolesService";
import FormPermissionInRoleComponent from "../permission/formPermissionInRoleComponent";


const ConfigRolesComponent = ({ unit, colorBackground }) => {

    const [data, setData] = useState();

    const [toDelete, setToDelete] = useState();
    const [confimDelete, setConfimDelete] = useState();

    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const [editRoleUsers, setEditRoleUsers] = useState();
    const [stepsHelpTour, setStepsHelpTour] = useState([])
    const [tourOpen, setTourOpen] = useState(false)

    const [editRolePermission, setEditRolePermission] = useState();

    const botonAdd = useRef(null)
    const botonEdit = useRef(null)
    const botonDelete = useRef(null)

    const [addRole, setAddRole] = useState();
    const [rolename, setRolename] = useState();
    const [loading, setLoading] = useState(false)

    const loadData = () => {
        setData([]);
        setLoading(true)
        RolesService.LISTBYUNIT(unit.idUnt).then((resp) => {
            let dataAux = []

            resp.map((item, index) => {
                dataAux.push({
                    index: index,
                    name: item
                })
            })
            setData(dataAux);
            setLoading(false)
        })
    }

    const addRoleName = () => {
        RolesService.ADD(unit.idUnt, rolename).then((resp) => {
            const messages = ReactDOM.createRoot(document.getElementById('messages'));
            messages.render(
                <NotificationComponent type="success" text="add"></NotificationComponent>
            );
            setRolename(null)
            setAddRole(false)
            loadData();
        })
    }

    const deleteItem = () => {
        //Borra el rol
        RolesService.DELETE(unit.idUnt, toDelete.name).then((resp) => {
            const messages = ReactDOM.createRoot(document.getElementById('messages'));
            messages.render(
                <NotificationComponent type="success" text="delete"></NotificationComponent>
            );
            setConfimDelete(false)
            loadData();
        })

    }

    const renderToolbar = (index) => {
        return <Space wrap>
            {/* BOTON EDITAR USUARIOS*/}
            {
                <Tooltip title={i18next.t('manager.roles.edituser')} key={"edituser"}>
                    <Button ref={index == 0 ? botonEdit : null} size='middle' disabled={false} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                        onClick={(e) => {
                            setEditRoleUsers(data[index])
                            window.mouseOverButton = false
                        }}
                        type={"default"} shape="circle">
                        <UserOutlined />
                    </Button>
                </Tooltip>
            }
             {/* BOTON EDITAR PERMISOS*/}
             {
                <Tooltip title={i18next.t('manager.roles.editpermission')} key={"editpermission"}>
                    <Button ref={index == 0 ? botonEdit : null} size='middle' disabled={false} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                        onClick={(e) => {
                            setEditRolePermission(data[index])
                            window.mouseOverButton = false
                        }}
                        type={"default"} shape="circle">
                        <KeyOutlined />
                    </Button>
                </Tooltip>
            }
            {/* BOTON BORRAR*/}
            {
                <Tooltip title={i18next.t('common.actions.delete.name')} key={"delete"}>
                    <Button ref={index == 0 ? botonDelete : null} size='middle' disabled={false} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
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
            width: 150,
            render: (index) => renderToolbar(index),
        },
        {
            title: i18next.t('manager.roles.name'),
            dataIndex: 'name',
            key: 'name',
            sorter: (a, b) => {
                return a.name.localeCompare(b.name);
            },
            ...getColumnSearchProps('name', i18next.t('manager.permissions.name'), setSearchText, setSearchedColumn)
        }]

    const getTourSteps = () => {
        return stepsHelpTour
    }

    const loadHelpSteps = () => {
        let steps = []

        if (data && data.length > 0 && (editRoleUsers == null)) {
            steps.push({
                title: i18next.t('common.tools.help.configuration.permissions.permission.edit.button.title'),
                description: i18next.t('common.tools.help.configuration.permissions.permission.edit.button.description'),
                //placement: 'top',
                target: () => botonEdit.current,
            })
        }

        setStepsHelpTour(steps)
    }

    useEffect(() => {
        loadData();
        setTourOpen(false)
        setEditRoleUsers(null)
    }, [unit]);

    useEffect(() => {
        loadHelpSteps()
    }, [tourOpen, unit, data])

    return (<>
        {!data && <Spin className="ant-spin-centered" />}
        {/* LISTADO DE USUARIOS */}
        {data && (editRoleUsers == null && editRolePermission == null) &&
            <Card
                size="small"
                bordered={true}
                style={{}}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <Button
                        ref={botonAdd}
                        type="primary"
                        disabled={false} icon={<FileAddOutlined />} onClick={(e) => setAddRole(true)}>
                        {i18next.t('manager.roles.add2unit')}
                    </Button>
                    {<Tooltip title={i18next.t('common.tools.help.name')} key={"maphelp"}>
                        <Button size='large' disabled={false} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                            onClick={(e) => {
                                setTourOpen(true);
                            }}
                            type={"default"} shape="circle">
                            <QuestionCircleOutlined />
                        </Button>
                    </Tooltip>}
                </div>
                <br />
                <Table columns={columns} dataSource={data} loading={loading} style={{ "--bg-color": colorBackground }} />
            </Card>
        }
        {data && editRoleUsers &&
            <FormUserInRoleComponent unit={unit} editRoleUsers={editRoleUsers} setEditRoleUsers={setEditRoleUsers}></FormUserInRoleComponent>
        }
        {data && editRolePermission &&
            <FormPermissionInRoleComponent unit={unit} editRolePermission={editRolePermission} setEditRolePermission={setEditRolePermission}></FormPermissionInRoleComponent>
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
        {/* MODAL PARA AÑADIR UN NUEVO ROL */}
        {<Modal
            title={i18next.t('manager.roles.setRoleName2Add')}
            okText={i18next.t('common.actions.add.name')}
            okButtonProps={{ disabled: false }}
            cancelText={i18next.t('common.actions.cancel.name')}
            cancelButtonProps={{ disabled: false }}
            maskClosable={false}
            icon={<FileAddOutlined />}
            open={addRole}
            onOk={(e) => {
                addRoleName()
            }}
            onCancel={(e) => setAddRole(false)}>
            <Input value={rolename} onChange={(e) => {
                setRolename(e.target.value)
            }} />
        </Modal>}
        {/* TOUR CON LA AYUDA */}
        {tourOpen && <Tour open={tourOpen} arrow={false} onClose={() => setTourOpen(false)} steps={getTourSteps()} />}

    </>)
}


export default ConfigRolesComponent;