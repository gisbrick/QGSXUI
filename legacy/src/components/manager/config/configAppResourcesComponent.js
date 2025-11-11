import { useEffect, useState } from "react";
import { UnitUserService } from "../../../service/unitUserService";
import { Card, Form, Select } from "antd";
import i18next from "i18next";
import ListAppComponent from "../app/listAppComponent";
import LoadingComponent from "../../utils/LoadingComponent";

const ConfigAppResourcesComponent = ({colorBackground, openApps}) => {

    const [unitsOptions, setUnitsOptions] = useState();
    const [units, setUnits] = useState();
    const [unit, setUnit] = useState();
    const [form] = Form.useForm();
    const [cargando, setCargando] = useState(true)

    const loadUnits = () => {
        UnitUserService.LISTMANAGEDUNITS()
            .then((resp) => {
                let options = [];
                for (let i in resp) {
                    //if (resp[i].unitName != "Información general") {
                        options.push({
                            value: i,
                            label: resp[i].unitName,
                        })
                    //}

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
            styles={{ header: { background: colorBackground } }}>
            <Form
                layout={"vertical"}
                disabled={false}
                form={form}>

                <Form.Item
                    name="unit"
                >
                    {cargando && <LoadingComponent></LoadingComponent>}
                    {unitsOptions && openApps && <Select
                        defaultOpen={openApps}
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

            {unit && <ListAppComponent unit={unit} colorBackground={colorBackground}></ListAppComponent>}
        </Card>
    )
}

export default ConfigAppResourcesComponent;



