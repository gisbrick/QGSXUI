import { useEffect, useRef, useState } from "react";
import { Button, Card, Col, Form, Input, Modal, Row, Tour, Space, Spin, Table, Tooltip } from "antd";
import i18next from "i18next";
import ReactDOM from 'react-dom/client';
import { DeleteOutlined, EditOutlined, ExclamationCircleOutlined, FileAddOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import Search from "antd/es/transfer/search";
import NotificationComponent from "../../utils/NotificationComponent";
import FormPermissionsComponent from "../permission/formPermissionsComponent";
import { MediaGroupService } from "../../../service/mediaGroupService";
import FormResourceGroupComponent from "../resourceGroup/formResourceGroupComponent";
import { getColumnSearchProps } from "../../../utilities/tableUtils";

const ConfigMediaGroupsComponent = ({ unit, colorBackground }) => {
    const [data, setData] = useState();

    const [toDelete, setToDelete] = useState();
    const [confimDelete, setConfimDelete] = useState();

    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const [editMediaGroup, setEditMediaGroup] = useState();
    const [stepsHelpTour, setStepsHelpTour] = useState([])
    const [tourOpen, setTourOpen] = useState(false)
    const [loading, setLoading] = useState(false)

    const botonAdd = useRef(null)
    const botonEdit = useRef(null)
    const botonDelete = useRef(null)

    const loadData = () => {
        setData([]);
        setLoading(true)
        MediaGroupService.LIST(unit.idUnt).then((resp) => {
            resp.map((item, index) => {
                item.index = index;
            })
            setData(resp)
            setLoading(false)
        })
    }

    const deleteItem = () => {
        MediaGroupService.DELETE(unit.idUnt, toDelete.uidResGrp).then((resp) => {
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
                            setEditMediaGroup(data[index])
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
            render: (index) => rederToolbar(index),
        },
        {
            title: <div className="reader">{i18next.t('manager.mediagroup.resGrpName')}</div>,
            dataIndex: 'resGrpName',
            key: 'resGrpName',
            sorter: (a, b) => {
                return a.resGrpName.localeCompare(b.resGrpName);
            },
            ...getColumnSearchProps('resGrpName', i18next.t('manager.mediagroup.resGrpName'), setSearchText, setSearchedColumn)
        },
        {
            title: <div className="reader">{i18next.t('manager.mediagroup.uidResGrp')}</div>,
            dataIndex: 'uidResGrp',
            key: 'uidResGrp',
            sorter: (a, b) => {
                return a.uidResGrp.localeCompare(b.uidResGrp);
            },
            ...getColumnSearchProps('uidResGrp', i18next.t('manager.mediagroup.uidResGrp'), setSearchText, setSearchedColumn)
        }]

    const getTourSteps = () => {
        return stepsHelpTour
    }

    const loadHelpSteps = () => {
        let steps = []

        if (data && (editMediaGroup == null)) {
            steps.push({
                title: i18next.t('common.tools.help.configuration.media.create.button.title'),
                description: i18next.t('common.tools.help.configuration.media.create.button.description'),
                //placement: 'top',
                target: () => botonAdd.current,
            })
        }

        if (data && data.length>0 && (editMediaGroup == null)) {
            steps.push({
                title: i18next.t('common.tools.help.configuration.media.edit.button.title'),
                description: i18next.t('common.tools.help.configuration.media.edit.button.description'),
                //placement: 'top',
                target: () => botonEdit.current,
            })
        }

        if (data && data.length>0 && (editMediaGroup == null)) {
            steps.push({
                title: i18next.t('common.tools.help.configuration.media.remove.button.title'),
                description: i18next.t('common.tools.help.configuration.media.remove.button.description'),
                //placement: 'top',
                target: () => botonDelete.current,
            })
        }
        setStepsHelpTour(steps)
    }


    useEffect(() => {
        loadData();
        setEditMediaGroup(null)
    }, [unit]);

    useEffect(() => {
        loadHelpSteps()
    }, [tourOpen])

    return (<>
        {!data && <Spin />}
        {/* LISTADO DE GRUPOS */}
        {data && (editMediaGroup == null) &&
            <Card
                size="small"
                bordered={true}
                style={{}}>
                <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <Button type="primary"
                            ref={botonAdd}
                            disabled={false} icon={<FileAddOutlined />} onClick={(e) => setEditMediaGroup({ resGrpName: null, description: null })}>
                            {i18next.t('manager.mediagroup.create')}
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
                <Table columns={columns} dataSource={data} loading={loading} style={{ "--bg-color": colorBackground }} />
            </Card>
        }
        {data && editMediaGroup &&
            <FormResourceGroupComponent unit={unit} item={editMediaGroup} loadData={loadData} setSelected={setEditMediaGroup}></FormResourceGroupComponent>
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
        {/* TOUR CON LA AYUDA */}
        {tourOpen && <Tour open={tourOpen} arrow={false} onClose={() => setTourOpen(false)} steps={getTourSteps()} />}
    </>)
}

export default ConfigMediaGroupsComponent;