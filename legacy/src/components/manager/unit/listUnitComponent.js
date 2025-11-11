import { useEffect, useRef, useState } from "react";
import { UnitService } from "../../../service/unitService";
import { Button, Card, Tour, Modal, Space, Spin, Table, Tooltip } from "antd";
import i18next from "i18next";
import FormtUnitComponent from "./formUnitComponent";
import { DeleteOutlined, EditOutlined, ExclamationCircleOutlined, FileAddOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import ReactDOM from 'react-dom/client';
import NotificationComponent from "../../utils/NotificationComponent";
import Icon from "@ant-design/icons/lib/components/Icon";
import Search from "antd/es/transfer/search";
import { getColumnSearchProps } from "../../../utilities/tableUtils";

const ListUnitComponent = ({ colorbackground }) => {

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

    const rederToolbar = (index) => {
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
            render: (index) => rederToolbar(index)
        },
        {
            title: i18next.t('manager.unit.name'),
            dataIndex: 'unitName',
            key: 'unitName',
            sorter: (a, b) => {
                return a.unitName.localeCompare(b.unitName);
            },
            ...getColumnSearchProps('unitName', i18next.t('manager.unit.unitName'), setSearchText, setSearchedColumn)
        },
        {
            title: i18next.t('manager.unit.description'),
            dataIndex: 'description',
            key: 'description',
            sorter: (a, b) => {
                return a.description.localeCompare(b.description);
            },
            ...getColumnSearchProps('description', i18next.t('manager.unit.description'), setSearchText, setSearchedColumn)
        },
        {
            title: i18next.t('manager.unit.path'),
            dataIndex: 'path',
            key: 'path',
            sorter: (a, b) => {
                return a.path.localeCompare(b.path);
            },
            ...getColumnSearchProps('path', i18next.t('manager.unit.path'), setSearchText, setSearchedColumn)
        }]

    const loadData = () => {
        UnitService.LIST().then((resp) => {
            resp.map((item, index) => {
                item.index = index;
            })
            setData(resp)
        })
    }

    const deleteItem = () => {
        UnitService.DELETE(toDelete.idUnt).then((resp) => {
            const messages = ReactDOM.createRoot(document.getElementById('messages'));
            messages.render(
                <NotificationComponent type="success" text="delete"></NotificationComponent>
            );

            setConfimDelete(false)
            loadData();
        })

    }
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
                title: i18next.t('common.tools.help.administration.units.create.button.title'),
                description: i18next.t('common.tools.help.administration.units.create.button.description'),
                //placement: 'top',
                target: () => botonAdd.current,
            })
        }

        if (data && !selected) {
            steps.push({
                title: i18next.t('common.tools.help.administration.units.edit.button.title'),
                description: i18next.t('common.tools.help.administration.units.edit.button.description'),
                //placement: 'top',
                target: () => botonEdit.current,
            })
        }

        if (data && !selected) {
            steps.push({
                title: i18next.t('common.tools.help.administration.units.remove.button.title'),
                description: i18next.t('common.tools.help.administration.units.remove.button.description'),
                //placement: 'top',
                target: () => botonDelete.current,
            })
        }
        setStepsHelpTour(steps)
    }

    useEffect(() => {
        loadData({ unitName: null, description: null, path: null, unitAppList: [], unitUserList: [] });
    }, []);

    useEffect(() => {
        loadHelpSteps()
    }, [tourOpen])


    return (
        <>
            <Card
                size="small"
                bordered={true}
                title={<div className="reader" style={{ color: "#00000", fontFamily: "sans-serif", fontSize: "" }}>{i18next.t('manager.unit.label')}</div>}
                //headStyle={{background:colorbackground}}
                styles={{header: {background:colorbackground }}}>
                {!data && <Spin className="ant-spin-centered"></Spin>}
                {data && !selected && <>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "baseline" }}>
                        <Button type="primary"
                            ref={botonAdd}
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
                {data && selected && <FormtUnitComponent item={selected} loadData={loadData} setSelected={setSelected} />}
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

export default ListUnitComponent;