import { Button, Card, Col, DatePicker, Descriptions, Form, Row, Space, Spin, Typography } from "antd";
import { useState, useEffect } from "react";
import ReactDOM from 'react-dom/client';
import i18next from "i18next";
import HtmlEditor from "../../../inputs/custom/htmlEditorComponent";
import { useSelector } from "react-redux";
import { generalParams_state } from "../../../../features/generalParams/generalParamsSlice";
import { getIdInfoMessageConfig, getIdWelcomeMessage, getInfoMessageConfig, getWelcomeMessage } from "../../../../utilities/paramsUtils";
import { GeneralParamsService } from "../../../../service/generalParamsService";
import NotificationComponent from "../../../utils/NotificationComponent";
import dayjs from 'dayjs';


const HomeParamComponent = ({ colorbackground }) => {

    const [saving, setSaving] = useState(false)
    const [welcomeMessage, setWelcomeMessage] = useState()
    const [infoMessageConfig, setInfoMessageConfig] = useState()
    const [infoMessage, setInfoMessage] = useState()
    const [infoMessageFrom, setInfoMessageFrom] = useState()
    const [infoMessageTo, setInfoMessageTo] = useState()

    const state_params = useSelector(generalParams_state)

    /*
    * En el useEffect se obtienen los parametros recuperados de base de datos
    */
    useEffect(() => {
        if (state_params.length > 0) {

            let welcomeMessage = getWelcomeMessage(state_params)

            if (welcomeMessage) {
                setWelcomeMessage(welcomeMessage)
            }

            let infoMessageConfig = getInfoMessageConfig(state_params)

            if (infoMessageConfig) {
                infoMessageConfig = JSON.parse(infoMessageConfig)
                setInfoMessageConfig(infoMessageConfig)
                if (infoMessageConfig.hasOwnProperty("message")) {
                    setInfoMessage(infoMessageConfig["message"])
                }
                if (infoMessageConfig.hasOwnProperty("from")) {
                    setInfoMessageFrom(infoMessageConfig["from"])
                }
                if (infoMessageConfig.hasOwnProperty("to")) {
                    setInfoMessageTo(infoMessageConfig["to"])
                }
            }

            //Si no existen ciertos parametros en base de datos se fijan los valores por defecto
        } else {

        }
    }, [])


    /**
     * Función que recibe como parámetros los ids de los registros de la tabla de parametrización y los valores asignados en la ventana de estilos.
     * Genera un array de promesas y lo devuelve
     * 
     * @param {*} arrayIds 
     * @param {*} arrayNewValuesParams 
     * @returns 
     */
    const actualizar = (arrayIds, arrayNewValuesParams) => {
        //console.log("actualizar arrayIds", arrayIds)
        //console.log("actualizar arrayNewValuesParams", arrayNewValuesParams)

        let arrayPromesas = []
        //console.log(arrayIds)
        //console.log(arrayNewValuesParams)
        for (let index = 0; index < arrayIds.length; index++) {
            const id = arrayIds[index];
            const newValue = arrayNewValuesParams[index]
            let promesa;
            if (id) {
                let object = {
                    "value": newValue
                }
                promesa = GeneralParamsService.UPDATE(id, object)
            }
            arrayPromesas.push(promesa)
        }
        return arrayPromesas
    }

    /**
    * Función que resuelve las promesas devueltas por la función actualizar.
    * Se realiza la actualización de base de datos.
    */
    const onSave = () => {

        let arrayIds = []
        let arrayNewValuesParams = []

        let welcomeMessageId = getIdWelcomeMessage(state_params)
        let infoMessageConfigId = getIdInfoMessageConfig(state_params)

        arrayIds.push(...[welcomeMessageId, infoMessageConfigId])
        let infoMessageConfig = { "message": infoMessage, "from": infoMessageFrom, "to": infoMessageTo }
        arrayNewValuesParams.push(...[welcomeMessage, JSON.stringify(infoMessageConfig)])

        let arrayPromesas = actualizar(arrayIds, arrayNewValuesParams)
        Promise.all(arrayPromesas)
            .then((data) => {
                setSaving(false)
                //console.log(data)
                //Informamos de que se han actualizado corréctamente los datos
                const messages = ReactDOM.createRoot(document.getElementById('messages'));
                messages.render(
                    <NotificationComponent type="success" text="update"></NotificationComponent>
                );
            })
            .catch((error) => {
                setSaving(false)
                //Informamos dde que algunos valores no son válidos   
                console.log(error)
                const messages = ReactDOM.createRoot(document.getElementById('messages'));
                messages.render(
                    <NotificationComponent type="error" text="invalidFields" description={error}></NotificationComponent>
                );
            })
    }


    const getDateValue = (value) => {

        if (value != null) {
            if (typeof value === 'string' || value instanceof String) {
                let out = dayjs(value)
                return out
            }
            else {
                //SI llegamos aquí, es porque ya tenemos convertido a dayjs la variable              
                return value
            }

        }
        else {
            return null;
        }
    }

    return (<>
        <Row gutter={[16, 16]}>
            <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                <Card
                    title={<div className="reader" style={{ color: "#00000", fontFamily: "sans-serif", fontSize: "" }}>{i18next.t("manager.home.welcomeTourMessage.name")}</div>}
                    size="small"
                    bordered={true}
                    //headStyle={{background: colorbackground}}
                    styles={{header: {background:colorbackground }}}>
                    <Space direction="vertical">
                        {i18next.t("manager.home.welcomeTourMessage.description")}
                    </Space>
                    {welcomeMessage && <HtmlEditor htmlValue={welcomeMessage} editable={true} onChange={setWelcomeMessage}></HtmlEditor>}
                    {!welcomeMessage && <HtmlEditor htmlValue={welcomeMessage} editable={true} onChange={setWelcomeMessage}></HtmlEditor>}
                </Card>
            </Col>
            <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                <Card 
                title={<div className="reader" style={{ color: "#00000", fontFamily: "sans-serif", fontSize: "" }}>{i18next.t("manager.home.infoMessage.name")}</div>}
                    size="small"
                    bordered={true}
                    //headStyle={{background: colorbackground}}
                    styles={{header: {background:colorbackground }}}>
                    <Space direction="vertical">
                        {i18next.t("manager.home.infoMessage.description")}
                    </Space>
                    <Row>
                        <Descriptions>
                            <Descriptions.Item label={i18next.t("manager.home.infoMessage.from")}>
                                <DatePicker value={getDateValue(infoMessageFrom)} format={'DD/MM/YYYY'} onChange={(date, dateString) => {
                                    setInfoMessageFrom(dateString)
                                }} />
                            </Descriptions.Item>
                            <Descriptions.Item label={i18next.t("manager.home.infoMessage.to")} style={{ paddingLeft: "10px" }}>
                                <DatePicker value={getDateValue(infoMessageTo)} format={'DD/MM/YYYY'} onChange={(date, dateString) => {
                                    setInfoMessageTo(dateString)
                                }} />
                            </Descriptions.Item>
                        </Descriptions>
                    </Row>
                    {infoMessage && <HtmlEditor htmlValue={infoMessage} editable={true} onChange={setInfoMessage}></HtmlEditor>}
                    {!infoMessage && <HtmlEditor htmlValue={infoMessage} editable={true} onChange={setInfoMessage}></HtmlEditor>}

                </Card>
            </Col>
        </Row>
        <Row gutter={[16, 16]} style={{ justifyContent: "center", padding: "10px" }}>
            <Col>
                <Space>
                    <Button type="primary" onClick={() => onSave()}>
                        {!saving && <div className="reader">{i18next.t('common.actions.save.name')}</div>}
                        {saving && <>{i18next.t('common.actions.save.saving')}</>}
                    </Button>
                    {saving && <Spin visible={saving}></Spin>}
                </Space>
            </Col>
        </Row>
    </>)
}

export default HomeParamComponent;