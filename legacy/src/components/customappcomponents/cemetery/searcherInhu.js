import { useState } from "react"
import i18next from "i18next";
import { Alert, Button, Collapse, ConfigProvider, DatePicker, Form, Input, Space, Table } from "antd";
import { QgisService } from "../../../service/qgisService";
import { PushpinOutlined } from "@ant-design/icons";
import LoadingComponent from "../../utils/LoadingComponent";
import MapComponent from "../../map/mapComponent";

const SearcherInhu = ({ map, custom_app_component }) => {

    const [callbackMapLoaded, setCallbackMapLoaded] = useState(null)
    const [form] = Form.useForm()
    const [data, setData] = useState(false)
    const [loading, setLoading] = useState(false)
    const [showAlert, setShowAlert] = useState(false)
    const [selectedRowKey, setSelectedRowKey] = useState(null);

    const dataHeaders = [
        {
            title: <div className="reader">{i18next.t("custom_app_component.cemetery.searcher.form.zone")}</div>,
            dataIndex: 'zona',
            key: 'zona',
        },
        {
            title: <div className="reader">{i18next.t("custom_app_component.cemetery.searcher.form.row")}</div>,
            dataIndex: 'fila',
            key: 'fila',
        },
        {
            title: <div className="reader">{i18next.t("custom_app_component.cemetery.searcher.form.num")}</div>,
            dataIndex: 'num',
            key: 'num',
        },
        {
            title: <div className="reader">{i18next.t("custom_app_component.cemetery.searcher.form.name")}</div>,
            dataIndex: 'nombre',
            key: 'nombre',
        },
        {
            title: <div className="reader">{i18next.t("custom_app_component.cemetery.searcher.form.fname")}</div>,
            dataIndex: 'ape1',
            key: 'ape1',
        },
        {
            title: <div className="reader">{i18next.t("custom_app_component.cemetery.searcher.form.sname")}</div>,
            dataIndex: 'ape2',
            key: 'ape2',
        },
        {
            title: <div className="reader">{i18next.t("custom_app_component.cemetery.searcher.form.birthday")}</div>,
            dataIndex: 'fecha_nacimiento',
            key: 'birthDate',
        },
        {
            title: <div className="reader">{i18next.t("custom_app_component.cemetery.searcher.form.deathday")}</div>,
            dataIndex: 'fecha_defuncion',
            key: 'deathDate',
        },
        {
            title: <div className="reader">{i18next.t("custom_app_component.cemetery.searcher.form.remains")}</div>,
            dataIndex: 'resto',
            key: 'resto',
        },
        {
            title: <div className="reader">{i18next.t("custom_app_component.cemetery.searcher.form.choose")}</div>,
            dataIndex: '',
            key: 'elegir',
            render: (text, record) => (
                <Button size="small" icon={<PushpinOutlined />} onClick={() => { findInhumadoMap(record); handleRowClick(record); }}>
                    {i18next.t("custom_app_component.cemetery.searcher.form.choose")}
                </Button>
            ),
        }
    ];

    const onFinish = (values) => {
        let query = "1=1 "
        query += values.nombre ? `AND "nombre" ILIKE '%${values.nombre}%'` : ""
        query += values.firstname ? ` AND "ape1" ILIKE '${values.firstname}'` : ""
        query += values.secondname ? ` AND "ape2" ILIKE ${values.secondname}` : ""
        query += values.birthDate ? ` AND "fecha_nacimiento" = ${getDateTextValue((values.birthDate).toDate())}` : ""
        query += values.deathDate ? ` AND "fecha_defuncion" = ${getDateTextValue((values.deathDate).toDate())}` : ""
        if (!values.nombre && !values.firstname && !values.secondname) {
            setShowAlert(true)
        } else {
            search(map, 'Localizador', 10, null, query, null, "nombre", null)
        }
    };

    const search = async (map, layer, maxFeatures, startIndex, expFilter, bbox, sortby, sortType) => {
        setData(false)
        setLoading(true)
        let inhumados = await QgisService.GETFEATURES(map, layer, maxFeatures, startIndex, expFilter, bbox, sortby, sortType)
            .then((data) => {
                return data
            })
            .catch((error) => {
                console.log("error", error)
                setLoading(false)
            })
        setData(mountData(inhumados))
    }

    const mountData = (inhumados) => {
        let data = []
        if (inhumados.features.length > 0) {
            inhumados.features.forEach((feature) => {
                let dataObject = {}
                dataObject["key"] = feature.id
                dataObject["zona"] = feature.properties.zona
                dataObject["fila"] = feature.properties.fila
                dataObject["num"] = feature.properties.numero
                dataObject["nombre"] = feature.properties.nombre
                dataObject["ape1"] = feature.properties.ape1
                dataObject["ape2"] = feature.properties.ape2
                dataObject["fecha_nacimiento"] = feature.properties.fecha_nacimiento //dateToString(dayjs(feature.properties.fecha_nacimiento, "YYYY-MM-DD"), "dd/MM/yyyy") 
                dataObject["fecha_defuncion"] = feature.properties.fecha_defuncion
                dataObject["resto"] = feature.properties.resto
                dataObject["geometry"] = feature.geometry
                data.push(dataObject)
            })
        }
        setLoading(false)
        return data
    }

    const findInhumadoMap = (inhumado) => {
        let geometry = inhumado.geometry.coordinates
        let name = `${inhumado.nombre} ${inhumado.ape1} ${inhumado.ape2}`
        if (geometry) {
            dibujarEntidad(geometry, name)
        }
    }

    /**
     * Función que pinta la feature en el mapa, si no existe ya.
     * Si ya existe entonces no la pinta.
     * 
     * @param {*} feature 
     */
    const dibujarEntidad = (geometry, name) => {
        //comprobar que existe geojson
        let coords = [...geometry]
        if (callbackMapLoaded["graphics"]) {
            callbackMapLoaded["graphics"].remove()
        }
        if (coords[0] < coords[1]) {
            coords.reverse()
        }
        callbackMapLoaded["graphics"] = window.L.marker(coords)
        callbackMapLoaded["graphics"].addTo(callbackMapLoaded);

        callbackMapLoaded["graphics"].bindTooltip(name).openTooltip()
        callbackMapLoaded.setView(coords, 20)

    }

    const getDateTextValue = (d) => {
        let month = (d.getMonth() + 1).toString().padStart(2, '0')
        let day = d.getDate().toString().padStart(2, '0')
        let year = d.getFullYear().toString().padStart(4, '0')
        let out = year + "-" + month + "-" + day
        return out
    }

    const resetSearch = () => {
        setData(false)
        form.resetFields();
        callbackMapLoaded["graphics"].remove()
        setSelectedRowKey(null)
    }

    const formView = () => {
        return (<Form
            layout={"vertical"}
            disabled={false}
            onFinish={onFinish}
            form={form}
        >
            <div
                className="flex-container">
                <Form.Item name={"nombre"} label={<span className="reader">{i18next.t("custom_app_component.cemetery.searcher.form.name")}</span>} className="form-item">
                    <Input></Input>
                </Form.Item>
                <Form.Item name={"firstname"} label={<span className="reader">{i18next.t("custom_app_component.cemetery.searcher.form.fname")}</span>} className="form-item">
                    <Input></Input>
                </Form.Item>
                <Form.Item name={"secondname"} label={<span className="reader">{i18next.t("custom_app_component.cemetery.searcher.form.sname")}</span>} className="form-item">
                    <Input></Input>
                </Form.Item>
                <Form.Item name={"birthDate"} label={<span className="reader">{i18next.t("custom_app_component.cemetery.searcher.form.birthday")}</span>} className="form-item">
                    <DatePicker
                        format={'DD-MM-YYYY'}
                    ></DatePicker>
                </Form.Item>
                <Form.Item name={"deathDate"} label={<span className="reader">{i18next.t("custom_app_component.cemetery.searcher.form.deathday")}</span>} className="form-item">
                    <DatePicker
                        format={'DD-MM-YYYY'}
                    ></DatePicker>
                </Form.Item>
                <Form.Item label={null} className="form-item">
                    <Space>
                        <Button type="primary" htmlType="submit">
                        {i18next.t("custom_app_component.cemetery.actions.find")}
                        </Button>
                        <Button onClick={() => { resetSearch() }}>{i18next.t("custom_app_component.cemetery.actions.resetSearch")}</Button>
                    </Space>

                </Form.Item>
            </div>

        </Form>)
    }

    const handleRowClick = (record) => {
      setSelectedRowKey(record.key);
    };

    const rowClassName = (record) => {
        return record.key === selectedRowKey ? 'selected-row' : '';
      };


    return (
        <>
            {showAlert && <Alert showIcon message={i18next.t("custom_app_component.cemetery.msg.info")} type="info"
                closable
                onClose={(e) => setShowAlert(false)} />}
            <Collapse
            size="small"
                collapsible="header"
                defaultActiveKey={['1']}
                items={[
                    {
                        key: '1',
                        label: <div className="reader" style={{ fontSize: "12px" }}>{i18next.t("custom_app_component.cemetery.searcher.header")}</div>,
                        children: formView()
                    },
                ]}>
            </Collapse>

            {data &&
                <ConfigProvider
                    theme={{
                        components: {
                            Table: {
                                fontSize: "12px"
                            },
                        },
                    }}
                >
                    <Table
                        size="small"
                        columns={dataHeaders}
                        dataSource={data}
                        pagination={false}
                        rowClassName={rowClassName}
                        style={{padding:"15px"}}
                    ></Table>
                </ConfigProvider>
            }
            {loading && <div style={{ padding: "15px" }}><LoadingComponent></LoadingComponent></div>}
            <MapComponent map={map} callbackMapLoaded={(callbackMapLoaded)} setCallbackMapLoaded={setCallbackMapLoaded} blockTools={true}></MapComponent>
        </>
    )
}

export default SearcherInhu;