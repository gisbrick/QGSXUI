import { useEffect, useRef, useState } from "react";
import { UserService } from "../../../service/userService";
import { Button, Card, Input, Modal, Space, Spin, Table, Tooltip, Tour } from "antd";
import i18next from "i18next";
import FormtUserComponent from "./formUserComponent";
import { DeleteOutlined, EditOutlined, ExclamationCircleOutlined, FileAddOutlined, SearchOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import ReactDOM from 'react-dom/client';
import NotificationComponent from "../../utils/NotificationComponent";
import Icon from "@ant-design/icons/lib/components/Icon";
import Search from "antd/es/transfer/search";
import { getColumnSearchProps } from "../../../utilities/tableUtils";

const ListUserComponent = ({ colorbackground }) => {

    const [data, setData] = useState();
    const [selected, setSelected] = useState();
    const [toDelete, setToDelete] = useState();
    const [confimDelete, setConfimDelete] = useState();
    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');
    const [stepsHelpTour, setStepsHelpTour] = useState([])
    const [tourOpen, setTourOpen] = useState(false)

    const botonAdd = useRef(null)
    const botonEdit = useRef(null)
    const botonDelete = useRef(null)

    const loadData = () => {
        UserService.LIST().then((resp) => {
            resp.map((item, index) => {
                item.index = index;
            })
            setData(resp)
        })
    }

    const deleteItem = () => {
        UserService.DELETE(toDelete.idUsr).then((resp) => {
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
            {/* BOTON EDITAR*/}
            {
                <Tooltip title={i18next.t('common.actions.edit.name')} key={"edit"}>
                    <Button ref={index == 0 ? botonEdit : null} size='middle' disabled={false} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                        onClick={(e) => {
                            setSelected(data[index])
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
            title: i18next.t('manager.user.usr'),
            dataIndex: 'usr',
            key: 'usr',
            sorter: (a, b) => {
                return a.usr.localeCompare(b.usr);
            },
            ...getColumnSearchProps('usr', i18next.t('manager.user.usr'), setSearchText, setSearchedColumn)
        }]


    const insertItem = () => {
        setSelected({})
    }

    const getTourSteps = () => {
        return stepsHelpTour
    }

    const loadHelpSteps = () => {
        let steps = []

        if (data && !selected) {
            steps.push({
                title: i18next.t('common.tools.help.administration.users.create.button.title'),
                description: i18next.t('common.tools.help.administration.users.create.button.description'),
                //placement: 'top',
                target: () => botonAdd.current,
            })
        }

        if (data && !selected) {
            steps.push({
                title: i18next.t('common.tools.help.administration.users.edit.button.title'),
                description: i18next.t('common.tools.help.administration.users.edit.button.description'),
                //placement: 'top',
                target: () => botonEdit.current,
            })
        }

        if (data && !selected) {
            steps.push({
                title: i18next.t('common.tools.help.administration.users.remove.button.title'),
                description: i18next.t('common.tools.help.administration.users.remove.button.description'),
                //placement: 'top',
                target: () => botonDelete.current,
            })
        }
        setStepsHelpTour(steps)
    }

    useEffect(() => {
        loadData({ usr: null, password: null, us01: [] });
    }, []);

    useEffect(() => {
        loadHelpSteps()
    }, [tourOpen])

    return (
        <>

            <Card
                size="small"
                title={<div className="reader" style={{ color: "#00000", fontFamily: "sans-serif", fontSize: "" }}>{i18next.t('manager.user.label')}</div>}
                bordered={true}
                //headStyle={{ background: colorbackground }}
                styles={{header: {background:colorbackground }}}>
                {!data && <Spin className="ant-spin-centered"></Spin>}
                {data && !selected && <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <Button
                            ref={botonAdd}
                            type="primary"
                            disabled={false} onClick={(e) => insertItem()}>
                            <Space>
                                <FileAddOutlined />
                                {<div className="reader">{i18next.t('common.actions.create.name')}</div>}
                            </Space>

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
                    <Table columns={columns} dataSource={data} style={{ "--bg-color": colorbackground }} />
                </>}
                {data && selected && <FormtUserComponent item={selected} loadData={loadData} setSelected={setSelected} />}
            </Card>
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

        </>
    );
}

export default ListUserComponent;