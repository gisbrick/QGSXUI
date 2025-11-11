import { useEffect, useState } from "react"
import { QgisService } from "../../../../service/qgisService"
import { Button, Card, Form, Space, Input, InputNumber, Alert, List, Divider, Select } from "antd"
import QgisTabComponent from "../../../form/qgisTabComponent"
import LoadingComponent from "../../../utils/LoadingComponent"
import i18next from "i18next"

const UnidadFunerariaInput = ({ map, properties, editable, setProperties, form, QGISPRJ, qgisLayer,
    tiposUnidadesFunerarias, estadosUnidadesFunerarias, tiposResto, zonas, colorBackground }) => {

    const [featureState, setFeatureState] = useState(null)
    const [propertiesUnitFune, setPropertiesUnitFune] = useState(false)
    const [loading, setLoading] = useState(false)
    const [defaultValue, setDefaultValue] = useState(true)
    const [zona, setZona] = useState()
    const [numero, setNumero] = useState()

    const [showAlertColumbario, setShowAlertColumbario] = useState(false);
    const [showAlertOcupado, setShowAlertOcupado] = useState(false)
    const [showAlertReservado, setShowAlertReservado] = useState(false)
    const [showAlertExito, setShowAlertExito] = useState(false)
    const [namesList, setNamesList] = useState("")
    const [loadingMessageColumbario, setLoadingMessageColumbario] = useState(false)
    const [loadingMessageOcupado, setLoadingMessageOcupado] = useState(false)
    const [loadingMessageReservado, setLoadingMessageReservado] = useState(false)
    const [loadingMessageTemporal, setLoadingMessageTemporal] = useState(false)
    const [showAlertTemporal, setShowAlertTemporal] = useState(false)

    const [errorHappen, setErrorHappen] = useState(false)


    const searchFuneUnit = (map, properties, tiposResto) => {
        setLoading(true)
        setPropertiesUnitFune(false)
        QgisService.GETFEATURES(map, 'Unidad funeraria', 1, null, `zona = '${zona}' AND numero = ${numero}`, null, "n_orden", 'ASC')
            .then((data) => {
                if (data.features[0]) {
                    setPropertiesUnitFune(data.features[0].properties)
                    setFeatureState(data.features[0])
                    validator(data.features[0].properties, properties, tiposResto)
                }
                setLoading(false)
            })
            .catch((error) => {
                setLoading(false)
                console.log(error)
            })
    }

    const onClose = (index) => {
        if (index === 1) {
            setShowAlertExito(false)
        } else if (index === 2) {
            setShowAlertColumbario(false)
        } else if (index === 3) {
            setShowAlertOcupado(false)
        } else if (index === 4) {
            setShowAlertTemporal(false)
        } else if (index === 5) {
            setShowAlertReservado(false)
        }
    };

    const validator = async (propertiesFeature, generalProperties, tiposResto) => {
        const { cod_unid_f } = propertiesFeature;
        const { id_tipo_resto } = generalProperties;
        if (id_tipo_resto && cod_unid_f) {

            setLoadingMessageColumbario(true)
            setLoadingMessageOcupado(true)
            setLoadingMessageReservado(true)
            setLoadingMessageTemporal(true)

            try {
                const [unidadData] = await Promise.all([
                    QgisService.GETFEATURES(map, 'Unidad funeraria', null, null, `cod_unid_f = ${cod_unid_f}`, null, null, null),
                ]);

                await validateColumbario(tiposResto, unidadData, id_tipo_resto);
                await validateOcupado(unidadData, propertiesFeature);
                await validateFechaUltimaAccion(unidadData);

                setLoadingMessageColumbario(false)
                setLoadingMessageOcupado(false)
                setLoadingMessageReservado(false)
                setLoadingMessageTemporal(false)

            } catch (error) {
                console.log("Error en la validación:", error);
            }
        }
    };

    const validateColumbario = async (tipoRestoData, unidadData, id_tipo_resto) => {
        const tipoUnidadFuneraria = tiposUnidadesFunerarias.find(
            (tipo) => tipo.properties.cod_tipo_unidad_f === unidadData.features[0].properties.tipo_unid_f
        );

        const tipoResto = tipoRestoData.find(
            (tipo) => tipo.properties.id_tipo_resto === id_tipo_resto
        )
        if (tipoUnidadFuneraria?.properties.descrip === "Columbario" &&
            tipoResto.properties.descrip !== "Cenizas") {
            setShowAlertColumbario(true);
            setLoadingMessageColumbario(false)
            setErrorHappen(true)
        } else {
            setLoadingMessageColumbario(false)
        }
    };

    const validateOcupado = async (unidadData, properties) => {

        const estadoUnidadFuneraria = estadosUnidadesFunerarias.find(
            (estado) => estado.properties.cod_estado_unidad_f === unidadData.features[0].properties.estado_unid_f
        );

        if (estadoUnidadFuneraria?.properties.descrip === "Ocupado") {

            const data = await QgisService.GETFEATURES(map, "Inhumados", null, null, `cod_unid_f = ${properties.cod_unid_f}`, null, null, null).catch((error) => console.log("error", error));

            if (data) {
                setNamesList(
                    <List
                        itemLayout="horizontal"
                        dataSource={data.features}
                        renderItem={(item, index) => (
                            <List.Item>
                                <List.Item.Meta
                                    title={(item.properties.nombre ? item.properties.nombre : "-")
                                        + " " +
                                        (item.properties.ape1 ? item.properties.ape1 : "-")
                                        + " " +
                                        (item.properties.ape2 ? item.properties.ape2 : "-")
                                    }
                                />
                            </List.Item>
                        )}
                    />
                )
            }
        }
        if (estadoUnidadFuneraria?.properties.descrip === "Ocupado") {
            setLoadingMessageOcupado(false)
            setShowAlertOcupado(true);
        }
        if (estadoUnidadFuneraria?.properties.descrip === "Reservado") {
            setLoadingMessageReservado(false)
            setShowAlertReservado(true);
        }
    };

    const validateFechaUltimaAccion = async (unidadData) => {
        const hoy = Date.now()
        const fecha = unidadData.features[0].properties.fecha_ult_accion
        if (fecha && fecha != "") {

            const fechaToCompare = new Date(fecha).getTime();
            const diferenciaEnMilisegundos = hoy - fechaToCompare

            const diferenciaEnAnios = diferenciaEnMilisegundos / (1000 * 60 * 60 * 24 * 365);

            if (diferenciaEnAnios < 5) {
                setLoadingMessageTemporal(false)
                setShowAlertTemporal(true)
            }
        }
    }

    const findFirstFreeFuneUnit = async (properties, tiposResto, tiposUnidadesFunerarias) => {
        let query = "";
        const { id_tipo_resto } = properties;
        let tipoRestoDescrip = tiposResto.find((resto) => resto.properties.id_tipo_resto == id_tipo_resto)?.properties?.descrip
        if (tipoRestoDescrip == "Cenizas") {
            //Solo en columbario
            let idTipoUnidad = tiposUnidadesFunerarias.find((tipo) => tipo.properties.descrip == "Columbario")?.properties?.cod_tipo_unidad_f

            if (idTipoUnidad) {
                query = `tipo_unid_f = ${idTipoUnidad}`
            }
        } else {
            //En todas menos en columbario, fosa común, externo y panteón
            let idTiposUnidades = tiposUnidadesFunerarias
                .filter((tipo) => !["Columbario", "Fosa común", "Externo", "Panteón"].includes(tipo.properties.descrip))
                .map((tipo) => `tipo_unid_f = ${tipo.properties.cod_tipo_unidad_f}`);
            query = idTiposUnidades.join(" OR ");
        }


        setLoading(true)

        await QgisService.GETFEATURES(map, 'Unidad funeraria', 1, null, `estado_unid_f = 1 AND (${query})`, null, "n_orden", 'ASC')
            .then((data) => {
                setPropertiesUnitFune(data.features[0].properties)
                setFeatureState(data.features[0])
                setLoading(false)
            })
            .catch((error) => {
                setLoading(false)
                console.log(error)
            })
    }

    const resetMessages = () => {
        setShowAlertColumbario(false)
        setShowAlertOcupado(false)
        setShowAlertReservado(false)
        setShowAlertTemporal(false)
        setShowAlertExito(false)
        setErrorHappen(false)
    }

    const acceptUnitFune = () => {
        if (propertiesUnitFune) {
            let propertiesAux = { ...properties }
            propertiesAux["cod_unid_f"] = featureState.properties.cod_unid_f
            setProperties(propertiesAux)
            form.setFieldValue("cod_unid_f", featureState.properties.cod_unid_f);
            setShowAlertExito(true)
        }
    }

    useEffect(() => {
        form.setFieldValue("cod_unid_f", undefined);
        findFirstFreeFuneUnit(properties, tiposResto, tiposUnidadesFunerarias)
    }, [])

    useEffect(() => {
        console.log("loadingMessageColumbario", loadingMessageColumbario)
        console.log("loadingMessageOcupado", loadingMessageOcupado)
        console.log("loadingMessageTemporal", loadingMessageTemporal)
        console.log("tiporestodata", tiposResto)
    }, [loadingMessageColumbario, loadingMessageOcupado, loadingMessageTemporal])


    useEffect(() => {

        form.setFieldsValue({
            cod_unid_f: undefined,
        });

    }, [defaultValue]);

    return (
        <>
            {(loadingMessageColumbario || loadingMessageOcupado || loadingMessageTemporal || loadingMessageReservado) && <LoadingComponent></LoadingComponent>}
            {showAlertColumbario && (
                <Alert
                    message={i18next.t("custom_app_component.cemetery.steps.unit.msg.error.title")}
                    description={i18next.t("custom_app_component.cemetery.steps.unit.msg.error.text")}
                    type="error"
                    closable
                    onClose={() => onClose(2)}
                />
            )}
            {showAlertOcupado && (
                <Alert
                    message={i18next.t("custom_app_component.cemetery.steps.unit.msg.warning.title")}
                    description={
                        <Space direction="vertical">
                            {i18next.t("custom_app_component.cemetery.steps.unit.msg.warning.text1")}
                            {namesList}
                            {i18next.t("custom_app_component.cemetery.steps.unit.msg.warning.text2")}
                            <Button onClick={() => {
                                onClose(3)
                            }
                            }>
                                {i18next.t("custom_app_component.cemetery.steps.unit.msg.warning.accept")}
                            </Button>
                        </Space>
                    }
                    type="warning"
                    closable
                    onClose={() => onClose(3)}
                />
            )}
            {showAlertReservado && (
                <Alert
                    message={i18next.t("custom_app_component.cemetery.steps.unit.msg.warning.title")}
                    description={
                        <Space direction="vertical">
                            {i18next.t("custom_app_component.cemetery.steps.unit.msg.warning.text4")}
                            {namesList}
                            {i18next.t("custom_app_component.cemetery.steps.unit.msg.warning.text2")}
                            <Button onClick={() => {
                                onClose(5)
                            }
                            }>
                                {i18next.t("custom_app_component.cemetery.steps.unit.msg.warning.accept")}
                            </Button>
                        </Space>
                    }
                    type="warning"
                    closable
                    onClose={() => onClose(5)}
                />
            )}
            {showAlertTemporal && (
                <Alert
                    message={i18next.t("custom_app_component.cemetery.steps.unit.msg.warning.title")}
                    description=
                    {
                        <>
                            <Space direction="vertical">
                                {i18next.t("custom_app_component.cemetery.steps.unit.msg.warning.text3")}
                                {i18next.t("custom_app_component.cemetery.steps.unit.msg.warning.text2")}
                                <Button onClick={() => {
                                    //setWarningTemporalHappen(false)
                                    setShowAlertTemporal(false)
                                    onClose(4)
                                }}>
                                    {i18next.t("custom_app_component.cemetery.steps.unit.msg.warning.accept")}
                                </Button>
                            </Space>
                        </>
                    }
                    type="warning"
                    closable
                    onClose={() => onClose(4)}
                />
            )}
            {showAlertExito && !showAlertColumbario && !showAlertOcupado && !showAlertTemporal && !showAlertReservado && (
                <Alert
                    message={i18next.t("custom_app_component.cemetery.steps.unit.msg.success.title")}
                    description={i18next.t("custom_app_component.cemetery.steps.unit.msg.success.text")}
                    type="success"
                    closable
                    onClose={() => onClose(1)}
                />
            )}
            {<Card
                size="small"
                title={<div className="reader" style={{ color: "#00000", fontFamily: "sans-serif", fontSize: "" }}>{defaultValue ? i18next.t("custom_app_component.cemetery.steps.unit.default") : i18next.t("custom_app_component.cemetery.steps.unit.search")}</div>}
                bordered={true}
                styles={{ header: { background: colorBackground } }}>
                {!defaultValue && <Space>
                    {i18next.t("custom_app_component.cemetery.steps.unit.zone")}{<Select
                        showSearch
                        placeholder={i18next.t("custom_app_component.cemetery.steps.unit.labelzone")}
                        optionFilterProp="label"
                        onChange={(e) => { setZona(e) }}
                        options={zonas}
                    />}
                    {i18next.t("custom_app_component.cemetery.steps.unit.num")}<InputNumber onChange={(e) => setNumero(e)}></InputNumber>
                    <Button onClick={() => { searchFuneUnit(map, properties, tiposResto) }}>{i18next.t("custom_app_component.cemetery.actions.search")}</Button>
                </Space>}
                {loading && <LoadingComponent></LoadingComponent>}
                {!loading && <Form
                    layout={"vertical"}
                    disabled={true}
                    form={form}>
                    {featureState && qgisLayer.editFormConfig.tabs.map((tab, index) => {
                        return <>
                            <div>
                                <QgisTabComponent key={"QgisTabComponent" + index} QGISPRJ={QGISPRJ} map={map} form={null} editable={false} feature={featureState} properties={propertiesUnitFune} qgisLayer={qgisLayer} mapView={null} reload={null} tab={tab} hideRelations={true}></QgisTabComponent>
                            </div>
                        </>
                    })}
                </Form>}
                {<Space>
                    {!loading && featureState && <Button disabled={errorHappen || showAlertOcupado || showAlertTemporal || showAlertReservado } onClick={() => acceptUnitFune()}>{i18next.t("custom_app_component.cemetery.actions.accept")}</Button>}
                    {!loading && featureState && <Divider>{i18next.t("custom_app_component.cemetery.actions.o")}</Divider>}
                    {!loading && !defaultValue && <Button onClick={() => { setDefaultValue(!defaultValue); resetMessages(); setPropertiesUnitFune(false); findFirstFreeFuneUnit(properties, tiposResto, tiposUnidadesFunerarias) }}>{i18next.t("custom_app_component.cemetery.actions.selectUnitDefault")}</Button>}
                    {!loading && defaultValue && <Button onClick={() => { setDefaultValue(!defaultValue); setPropertiesUnitFune(false) }}>{i18next.t("custom_app_component.cemetery.actions.selectOtherUnit")}</Button>}
                </Space>}
            </Card>}

        </>
    )

}

export default UnidadFunerariaInput;