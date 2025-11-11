import { useEffect, useState, useRef } from "react";
import { Button, Card, Checkbox, Tour, Image, Modal, Space, Spin, Table, Tooltip } from "antd";
import i18next from "i18next";
import ReactDOM from 'react-dom/client';
import { DeleteOutlined, EditOutlined, ExclamationCircleOutlined, FileAddOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import NotificationComponent from "../../utils/NotificationComponent";
import { AppService } from "../../../service/appService";
import FormAppComponent from "./formAppComponent";
import { getColumnSearchProps } from "../../../utilities/tableUtils";

const ListAppComponent = ({ unit, colorBackground }) => {
    const [data, setData] = useState();

    const [toDelete, setToDelete] = useState();
    const [confimDelete, setConfimDelete] = useState();

    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');

    const [editApp, setEditApp] = useState();

    const [loading, setLoading] = useState(false);
    const [stepsHelpTour, setStepsHelpTour] = useState([])
    const [tourOpen, setTourOpen] = useState(false)

    const botonAdd = useRef(null)
    const botonEdit = useRef(null)
    const botonDelete = useRef(null)


    const loadData = () => {
        setLoading(true)
        setData([]);
        AppService.LISTBYMANAGER(unit.idUnt).then((resp) => {
            resp.map((item, index) => {
                item.index = index;
            })
            setData(resp)
            setLoading(false)
        })
        .catch(() => {
            setLoading(false)
        })
    }

    const deleteItem = () => {
        AppService.DELETE(unit.idUnt, toDelete.idUntApp).then((resp) => {
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
                <Tooltip title={i18next.t('manager.app.edit')} key={"edit"}>
                    <Button ref={index == 0 ? botonEdit : null} size='middle' disabled={false} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                        onClick={(e) => {
                            setEditApp(data[index])
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

    const rederThumbnail = (index) => {
        if (data[index].thumbnail) {
            return <Image
                width={70}
                src={data[index].thumbnail}
            />
        }
        else {
            return <></>
        }

    }


    const columns = [
        {
            title: '',
            dataIndex: 'index',
            key: 'index',
            render: (index) => rederToolbar(index),
        },
        {
            title: i18next.t('manager.app.appName'),
            dataIndex: 'appName',
            key: 'appName',
            sorter: (a, b) => {
                return a.appName.localeCompare(b.appName);
            },
            ...getColumnSearchProps('appName', i18next.t('manager.app.appName'), setSearchText, setSearchedColumn)
        },
        {
            title: i18next.t('manager.app.language'),
            dataIndex: 'lang',
            key: 'lang',
            sorter: (a, b) => {
                return a.lang.localeCompare(b.lang);
            },
            ...getColumnSearchProps('lang', i18next.t('manager.app.language'), setSearchText, setSearchedColumn)
        },
        {
            title: i18next.t('manager.app.thumbnail'),
            dataIndex: 'index',
            key: 'thumbnail',
            render: (index) => rederThumbnail(index),
        }/*,
        {
            title: i18next.t('manager.app.description'),
            dataIndex: 'description',
            key: 'description',
            sorter: (a, b) => {
                return a.description.localeCompare(b.description);
            },
            ...getColumnSearchProps('description', i18next.t('manager.app.description'),  setSearchText, setSearchedColumn)
        }*/,
        {
            title: i18next.t('manager.app.isPublished'),
            dataIndex: 'isPublished',
            key: 'isPublished',
            sorter: (a, b) => {
                return a.prmName.localeCompare(b.prmName);
            },
            render: (isPublished, index) => {
                return (<Checkbox disabled={true} checked={isPublished} />);
            },
        },
        {
            title: i18next.t('manager.app.prmName'),
            dataIndex: 'prmName',
            key: 'prmName',
            sorter: (a, b) => {
                return a.prmName.localeCompare(b.prmName);
            },
            ...getColumnSearchProps('prmName', i18next.t('manager.app.prmName'), setSearchText, setSearchedColumn)
        }]

    const getTourSteps = () => {
        return stepsHelpTour
    }

    const loadHelpSteps = () => {
        let steps = []

        if (data && (editApp == null)) {
            steps.push({
                title: i18next.t('common.tools.help.configuration.apps.create.button.title'),
                description: i18next.t('common.tools.help.configuration.apps.create.button.description'),
                //placement: 'top',
                target: () => botonAdd.current,
            })
        }

        if (data && data.length > 0 && (editApp == null)) {
            steps.push({
                title: i18next.t('common.tools.help.configuration.apps.edit.button.title'),
                description: i18next.t('common.tools.help.configuration.apps.edit.button.description'),
                //placement: 'top',
                target: () => botonEdit.current,
            })
        }

        if (data && data.length > 0 && (editApp == null)) {
            steps.push({
                title: i18next.t('common.tools.help.configuration.apps.remove.button.title'),
                description: i18next.t('common.tools.help.configuration.apps.remove.button.description'),
                //placement: 'top',
                target: () => botonDelete.current,
            })
        }
        setStepsHelpTour(steps)
    }



    useEffect(() => {
        loadData();
        setEditApp(null)

    }, [unit]);

    useEffect(() => {
        loadHelpSteps()
    }, [tourOpen])


    return (<>
        {!data && <Spin className="ant-spin-centered" />}
        {/* LISTADO DE APLICACIONES */}
        {data && (editApp == null) &&
            <Card
                size="small"
                bordered={true}
                style={{}}>
                <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <Button type="primary"
                            ref={botonAdd}
                            style={{ width: "150px" }}
                            disabled={false} onClick={(e) => setEditApp({ appName: null, description: null, prmName: null, config: "[]", thumbnail: null })}>
                            <div style={{ float: "left", marginRight: "5px" }}>{<FileAddOutlined />}</div>
                            <div className="reader">{i18next.t('manager.app.create')}</div>
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
                    <Table columns={columns} dataSource={data} loading={loading} style={{ '--bg-color': colorBackground }} />
                </>
            </Card>
        }
        {data && editApp &&
            <FormAppComponent unit={unit} item={editApp} loadData={loadData} setSelected={setEditApp}></FormAppComponent>
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
        {tourOpen && <Tour open={tourOpen} arrow={false} onClose={() => setTourOpen(false)} steps={getTourSteps()} zIndex={2000}/>}

    </>)
}

export default ListAppComponent;