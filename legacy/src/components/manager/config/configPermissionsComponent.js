import { useEffect, useRef, useState } from "react";
import { Button, Card, Col, Form, Input, Modal, Row, Select, Space, Spin, Table, Tour, Tooltip } from "antd";
import i18next from "i18next";
import ReactDOM from 'react-dom/client';
import { DeleteOutlined, EditOutlined, ExclamationCircleOutlined, FileAddOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import Search from "antd/es/transfer/search";
import NotificationComponent from "../../utils/NotificationComponent";
import FormPermissionsComponent from "../permission/formPermissionsComponent";
import { PermissionsService } from "../../../service/permissionsService";
import FormUserInUnitComponent from "../user/formUserInRoleComponent";
import { getColumnSearchProps } from "../../../utilities/tableUtils";
import FormRoleInPermissionComponent from "../role/formRoleInPermissionComponent";


const ConfigPermissionsComponent = ({ unit, colorBackground }) => {

    const [data, setData] = useState();

    const [toDelete, setToDelete] = useState();
    const [confimDelete, setConfimDelete] = useState();

    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const [editPermissionRoles, setEditPermissionRoles] = useState();
    const [stepsHelpTour, setStepsHelpTour] = useState([])
    const [tourOpen, setTourOpen] = useState(false)

    const botonAdd = useRef(null)
    const botonEdit = useRef(null)
    const botonDelete = useRef(null)

    const [addPermission, setAddPermission] = useState();
    const [permissionname, setPermissionname] = useState();
    const [loading, setLoading] = useState(false)

    const loadData = () => {
        setData([]);
        setLoading(true)
        PermissionsService.LISTBYUNIT(unit.idUnt).then((resp) => {
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

    const addPermissionName = () => {
        PermissionsService.ADD(unit.idUnt, permissionname).then((resp) => {
            const messages = ReactDOM.createRoot(document.getElementById('messages'));
            messages.render(
                <NotificationComponent type="success" text="add"></NotificationComponent>
            );
            setPermissionname(null)
            setAddPermission(false)
            loadData();
        })        
    }

    const deleteItem = () => {        
        PermissionsService.DELETE(unit.idUnt, toDelete.name).then((resp) => {
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
            {/* BOTON EDITAR PERMISOS*/}
            {
                <Tooltip title={i18next.t('manager.permissions.editroles')} key={"edit"}>
                    <Button ref={index == 0 ? botonEdit : null} size='middle' disabled={false} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                        onClick={(e) => {
                            setEditPermissionRoles(data[index])
                            window.mouseOverButton = false
                        }}
                        type={"default"} shape="circle">
                        <EditOutlined />
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
            title: i18next.t('manager.permissions.name'),
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

        if (data && data.length > 0 && (editPermissionRoles == null)) {
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
        setEditPermissionRoles(null)
    }, [unit]);

    useEffect(() => {
        loadHelpSteps()
    }, [tourOpen, unit, data])

    return (<>
        {!data && <Spin className="ant-spin-centered" />}
        {/* LISTADO DE USUARIOS */}
        {data && (editPermissionRoles == null) &&
            <Card
                size="small"
                bordered={true}
                style={{}}>
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                    <Button
                        ref={botonAdd}
                        type="primary"
                        disabled={false} icon={<FileAddOutlined />} onClick={(e) => setAddPermission(true)}>
                        {i18next.t('manager.permissions.add2unit')}
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
        {data && editPermissionRoles &&   
            <FormRoleInPermissionComponent unit={unit} permissions={editPermissionRoles} setPermissions={setEditPermissionRoles}></FormRoleInPermissionComponent>
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
        {/* MODAL PARA AÑADIR UN NUEVO PERMISO */}
        {<Modal
            title={i18next.t('manager.permissions.setPermissionName2Add')}
            okText={i18next.t('common.actions.add.name')}
            okButtonProps={{ disabled: false }}
            cancelText={i18next.t('common.actions.cancel.name')}
            cancelButtonProps={{ disabled: false }}
            maskClosable={false}
            icon={<FileAddOutlined />}
            open={addPermission}
            onOk={(e) => {
                addPermissionName()
            }}
            onCancel={(e) => setAddPermission(false)}>
            <Input value={permissionname} onChange={(e) => {
                setPermissionname(e.target.value)
            }} />
        </Modal>}
        {/* TOUR CON LA AYUDA */}
        {tourOpen && <Tour open={tourOpen} arrow={false} onClose={() => setTourOpen(false)} steps={getTourSteps()} />}

    </>)
}


export default ConfigPermissionsComponent;