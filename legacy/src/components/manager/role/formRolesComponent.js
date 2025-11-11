import { useEffect, useRef, useState } from "react";
import { UserService } from "../../../service/userService";
import { Avatar, Button, Card, Checkbox, Col, DatePicker, Form, Input, Modal, Row, Space, Spin, Table, Tooltip, Upload } from "antd"
import i18next from "i18next";
import { CloseCircleTwoTone, DeleteOutlined, FileAddOutlined, SaveOutlined, SearchOutlined } from "@ant-design/icons";
import ReactDOM from 'react-dom/client';
import NotificationComponent from "../../utils/NotificationComponent";
import Search from "antd/es/transfer/search";
import SelectUnitComponent from "../unit/selectUnitComponent";
import { UnitUserService } from "../../../service/unitUserService";
import { RolesService } from "../../../service/rolesService";
import SelectRolesComponent from "./selectRolesComponent";
import { getColumnSearchProps } from "../../../utilities/tableUtils";

function FormRolesComponent({ unit, user, setUser }) {

    const [form] = Form.useForm();
    const [data, setData] = useState(false);

    const [select, setSelect] = useState();
    const [excludeNames, setExcludeNames] = useState();
    const [selected, setSelected] = useState();

    const [searchText, setSearchText] = useState('');
    const [searchedColumn, setSearchedColumn] = useState('');


    const getData = () => {
        RolesService.LISTBYUNITANDUSER(unit.idUnt, user.usr).then((resp) => {
            let items = []
            resp.map((item, index) => {
                items.push({
                    index: index,
                    name: item
                })
            })
            setData(items)
        })
    }

    const add = (role) => {
        let skip = []
        for (let i in data) {
            skip.push(data[i].name)
        }
        setExcludeNames(skip)
        setSelect(true)
    }

    const addItem = (role) => {
        //Añade el rol al usuario
        UserService.ADDROLE2USER(user.usr, unit.idUnt, role).then((resp) => {
            const messages = ReactDOM.createRoot(document.getElementById('messages'));
            messages.render(
                <NotificationComponent type="success" text="add"></NotificationComponent>
            );
            getData();
        })
    }

    const deleteItem = (index) => {
       //Desvinculamos el rol del usuario        
        UserService.DELROLEFROMUSER(user.usr, unit.idUnt, data[index].name).then((resp) => {
            const messages = ReactDOM.createRoot(document.getElementById('messages'));
            messages.render(
                <NotificationComponent type="success" text="delete"></NotificationComponent>
            );
            getData();
        })
    }


    useEffect(() => {
        getData();
    }, [])


    const renderToolbar = (index) => {
        return <Space wrap>
            {
                <Tooltip title={i18next.t('common.actions.delete.name')} key={"delete"}>
                    <Button size='middle' disabled={false} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                        onClick={(e) => {
                            deleteItem(index)
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
                                        <Button htmlType="button" onClick={(e) => setUser(null)}>
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
                                title={i18next.t('manager.roles.user', {name: user.usr})}
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
            </Row>

            {select && <SelectRolesComponent unit={unit} user={user} addItem={addItem} excludeNames={excludeNames} setSelect={setSelect} />}

        </>
    );
}

export default FormRolesComponent;