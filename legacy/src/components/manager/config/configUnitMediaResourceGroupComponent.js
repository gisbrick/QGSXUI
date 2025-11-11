import { useEffect, useRef, useState } from "react";
import { UnitUserService } from "../../../service/unitUserService";
import { Card, Col, Form, Row, Select, Tabs } from "antd";
import i18next from "i18next";
import ConfigPermissionsComponent from "./configPermissionsComponent";
import ConfigMediaGroupsComponent from "./configMediaGroupsComponent";
import ConfigUsersComponent from "./configUsersComponent";
import LoadingComponent from "../../utils/LoadingComponent";

const ConfigUnitMediaResourceGroupComponent = ({colorBackground, openMediaGroup}) => {

    const [unitsOptions, setUnitsOptions] = useState();
    const [units, setUnits] = useState();
    const [unit, setUnit] = useState();
    const [form] = Form.useForm();
    const [cargando, setCargando] = useState(true)

    const loadUnits = () => {
        UnitUserService.LISTMANAGEDUNITS().then((resp) => {
            let options = [];
            for (let i in resp) {
                options.push({
                    value: i,
                    label: resp[i].unitName,
                })
            }
            setUnits(resp)
            setUnitsOptions(options)
            setCargando(false)
        })
            .catch((error) => console.log(error))
    }

    useEffect(() => {
        loadUnits();
    }, []);

    return (
        <Card
            size="small"
            bordered={true}
            title={<div className="reader" style={{color:"#00000", fontFamily:"sans-serif", fontSize:""}}>{i18next.t('manager.unit.select')}</div>}
            //headStyle={{background:colorBackground}}
            styles={{header: {background:colorBackground }}}>
            <Form
                layout={"vertical"}
                disabled={false}
                form={form}>

                <Form.Item
                    name="unit"
                >
                    {cargando && <LoadingComponent/>}

                    {unitsOptions && openMediaGroup && <Select
                        defaultOpen={openMediaGroup}
                        showSearch
                        style={{ width: "100%" }}
                        placeholder={i18next.t('manager.unit.select')}
                        optionFilterProp="children"
                        filterOption={(input, option) => (option?.label ?? '').includes(input)}
                        filterSort={(optionA, optionB) =>
                            (optionA?.label ?? '').toLowerCase().localeCompare((optionB?.label ?? '').toLowerCase())
                        }
                        options={unitsOptions}
                        onChange={(i, option) => {
                            setUnit(units[i])

                        }}
                    />}
                </Form.Item>


            </Form>

            {unit && <ConfigUnit unit={unit} colorBackground={colorBackground}></ConfigUnit>}
        </Card>)
}

export default ConfigUnitMediaResourceGroupComponent;


const ConfigUnit = ({ unit, colorBackground }) => {

    const items = [
        {
            key: '1',
            label: <div className="reader" style={{color:"#00000", fontFamily:"sans-serif", fontSize:""}}>{i18next.t('manager.mediagroup.label')}</div>,
            children: <ConfigMediaGroupsComponent unit={unit} colorBackground={colorBackground} />
        }
    ];

    return (<Tabs
        defaultActiveKey="1"
        items={items}
        indicatorSize={(origin) => origin - 16}
    />)
}

