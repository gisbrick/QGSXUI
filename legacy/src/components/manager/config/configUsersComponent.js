import { useEffect, useRef, useState } from "react";
import { Button, Card, Col, Form, Input, Modal, Row, Select, Space, Spin, Table, Tour, Tooltip } from "antd";
import i18next from "i18next";
import ReactDOM from 'react-dom/client';
import { UserService } from "../../../service/userService";
import { DeleteOutlined, EditOutlined, ExclamationCircleOutlined, FileAddOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import NotificationComponent from "../../utils/NotificationComponent";
import FormRolesComponent from "../role/formRolesComponent";
import { getColumnSearchProps } from "../../../utilities/tableUtils";


const ConfigUsersComponent = ({ unit, colorBackground }) => {

    const [data, setData] = useState();

    const [toDelete, setToDelete] = useState();
    const [confimDelete, setConfimDelete] = useState();

    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');

    const [addUser, setAddUser] = useState();
    const [username, setUsername] = useState();

    const [editUserRoles, setEditUserRoles] = useState();
    const [stepsHelpTour, setStepsHelpTour] = useState([])
    const [tourOpen, setTourOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const botonAdd = useRef(null)
    const botonEdit = useRef(null)
    const botonDelete = useRef(null)

    const addUserName = () => {
        UserService.ADDUSERTOUNIT(username, unit.idUnt).then((resp) => {
            const messages = ReactDOM.createRoot(document.getElementById('messages'));
            messages.render(
                <NotificationComponent type="success" text="add"></NotificationComponent>
            );
            setUsername(null)
            setAddUser(false)
            loadData();
        })
    }

    const loadData = () => {
        setData([]);
        setLoading(true)
        UserService.LISTBYUNIT(unit.idUnt).then((resp) => {
            resp.map((item, index) => {
                item.index = index;
            })
            setData(resp)
            setLoading(false)
        })
    }

    const deleteItem = () => {
        UserService.DELETEUSERFROMUNIT(toDelete.usr, unit.idUnt).then((resp) => {
            const messages = ReactDOM.createRoot(document.getElementById('messages'));
            messages.render(
                <NotificationComponent type="success" text="delete"></NotificationComponent>
            );
            setConfimDelete(false)
            loadData();
        })

    }

    const rederToolbar = (index) => {
        return <Space wrap>
            {/* BOTON EDITAR PERMISOS*/}
            {
                <Tooltip title={i18next.t('manager.permissions.edit')} key={"edit"}>
                    <Button ref={index == 0 ? botonEdit : null} size='middle' disabled={false} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                        onClick={(e) => {
                            setEditUserRoles(data[index])
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
            render: (index) => rederToolbar(index),
        },
        {
            title: i18next.t('manager.user.usr'),
            dataIndex: 'usr',
            key: 'usr',
            sorter: (a, b) => {
                return a.usr.localeCompare(b.usr);
            },
            ...getColumnSearchProps('usr', i18next.t('manager.user.usr'), setSearchText, setSearchedColumn)
        }]


    const getTourSteps = () => {
        return stepsHelpTour
    }

    const loadHelpSteps = () => {
        let steps = []

        if (data && (editUserRoles == null)) {
            steps.push({
                title: i18next.t('common.tools.help.configuration.roles.user.add.button.title'),
                description: i18next.t('common.tools.help.configuration.roles.user.add.button.description'),
                //placement: 'top',
                target: () => botonAdd.current,
            })
        }

        if (data && data.length > 0 && (editUserRoles == null)) {
            steps.push({
                title: i18next.t('common.tools.help.configuration.roles.user.edit.button.title'),
                description: i18next.t('common.tools.help.configuration.roles.user.edit.button.description'),
                //placement: 'top',
                target: () => botonEdit.current,
            })
        }

        if (data && data.length > 0 && (editUserRoles == null)) {
            steps.push({
                title: i18next.t('common.tools.help.configuration.roles.user.remove.button.title'),
                description: i18next.t('common.tools.help.configuration.roles.user.remove.button.description'),
                //placement: 'top',
                target: () => botonDelete.current,
            })
        }
        setStepsHelpTour(steps)
    }

    useEffect(() => {
        loadData();
        setEditUserRoles(null)
    }, [unit]);

    useEffect(() => {
        loadHelpSteps()
    }, [tourOpen, unit, data])

    return (<>
        {!data && <Spin className="ant-spin-centered" />}
        {/* LISTADO DE USUARIOAS */}
        {data && (editUserRoles == null) &&
            <Card
                size="small"
                bordered={true}
                style={{}}>
                <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <Button
                            ref={botonAdd}
                            type="primary"
                            disabled={false} icon={<FileAddOutlined />} onClick={(e) => setAddUser(true)}>
                            {i18next.t('manager.user.add2unit')}
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
                </>
                <br />
                <Table columns={columns} dataSource={data} loading={loading} style={{ '--bg-color': colorBackground }} />
            </Card>
        }
        {data && editUserRoles &&
            <FormRolesComponent unit={unit} user={editUserRoles} setUser={setEditUserRoles}></FormRolesComponent>
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
        {/* MODAL PARA AÑADIR UN NUEVO USUARIO */}
        {<Modal
            title={i18next.t('manager.user.setUserName2Add')}
            okText={i18next.t('common.actions.add.name')}
            okButtonProps={{ disabled: false }}
            cancelText={i18next.t('common.actions.cancel.name')}
            cancelButtonProps={{ disabled: false }}
            maskClosable={false}
            icon={<FileAddOutlined />}
            open={addUser}
            onOk={(e) => {
                addUserName()
            }}
            onCancel={(e) => setAddUser(false)}>
            <Input value={username} onChange={(e) => {
                setUsername(e.target.value)
            }} />
        </Modal>}
        {/* TOUR CON LA AYUDA */}
        {tourOpen && <Tour open={tourOpen} arrow={false} onClose={() => setTourOpen(false)} steps={getTourSteps()} />}

    </>)
}

export default ConfigUsersComponent;
