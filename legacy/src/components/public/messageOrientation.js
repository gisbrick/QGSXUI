import { Button, Card, Checkbox, Image, Modal, Steps } from "antd"
import { useState, useEffect } from "react"
import botonAyudaImage from './images/botonAyuda.png';
import i18next from "i18next";


const MessageOrientation = ({ showOrientation, setShowOrientation, contentViewType }) => {

    const [current, setCurrent] = useState(0);
    const [items, setItems] = useState()
    const [generalSteps, setGeneralSteps] = useState([])
    //map, html, report, table, opendata

    const stepsMapa = [
        {
            title: 'Mapa',
            content:
                <Card>
                    <p dangerouslySetInnerHTML={{__html: i18next.t("orientation.map.text")}}></p>
                    <p>{i18next.t("orientation.map.text1")}</p>
                    <p>{i18next.t("orientation.map.text2")}{
                        <Image
                            width={"50px"}
                            src={botonAyudaImage}
                        />}{i18next.t("orientation.map.text3")}</p>

                </Card>
        },
    ]

    const stepsInforme = [
        {
            title: 'Informe',
            content: 
            <Card>
                <p dangerouslySetInnerHTML={{__html: i18next.t("orientation.report.text")}}></p>
                <p>{i18next.t("orientation.report.text1")}</p>
                <p>{i18next.t("orientation.report.text2")}</p>
            </Card>
        },
    ]

    const stepsHtml = [
        {
            title: 'HTML',
            content:
                <Card>
                    <p dangerouslySetInnerHTML={{__html: i18next.t("orientation.html.text")}}></p>
                    <p>{i18next.t("orientation.html.text1")}</p>
                </Card>
        },
    ]

    const stepsTabla = [
        {
            title: 'Tabla',
            content:
                <Card>
                    <p dangerouslySetInnerHTML={{__html: i18next.t("orientation.table.text")}}></p>
                    <p>{i18next.t("orientation.table.text1")}</p>
                    <p>{i18next.t("orientation.table.text2")}</p>
                    <p>{i18next.t("orientation.table.text3")}{
                        <Image
                            width={"50px"}
                            src={botonAyudaImage}
                        />}{i18next.t("orientation.table.text4")}</p>
                </Card>
        },
    ]

    const stepsOpenData = [
        {
            title: 'Datos abiertos',
            content:
                <Card>
                    <p dangerouslySetInnerHTML={{__html: i18next.t("orientation.opendata.text")}}></p>
                    <p>{i18next.t("orientation.opendata.text1")}</p>
                </Card>
        },
    ]

    const next = () => {
        setCurrent(current + 1);
    };
    const prev = () => {
        setCurrent(current - 1);
    };

    const obetenerSteps = (contentType) => {
        let generalStepsAux = []

        if (contentType.includes("map")) {
            generalStepsAux.push(...stepsMapa)
        }
        if (contentType.includes("report")) {
            generalStepsAux.push(...stepsInforme)
        }
        if (contentType.includes("html")) {
            generalStepsAux.push(...stepsHtml)
        }
        if (contentType.includes("table")) {
            generalStepsAux.push(...stepsTabla)
        }
        if (contentType.includes("opendata")) {
            generalStepsAux.push(...stepsOpenData)
        }
        const itemsAux = generalStepsAux.map((item) => ({
            key: item.title,
            title: item.title,
        }));
        setItems(itemsAux)
        setGeneralSteps(generalStepsAux)
    }

    useEffect(() => {
        obetenerSteps(contentViewType)
    }, [])


    return (<>
        {generalSteps.length > 0 && <Modal
            title="¿Cómo utilizar?"
            open={showOrientation}
            onClose={() => {
                setShowOrientation(false)
            }}
            onCancel={() => {
                setShowOrientation(false)
            }}
            onOk={() => {
                setShowOrientation(false)
            }}
        >


            <Steps current={current} items={items} />
            <br />
            <div>{generalSteps[current].content}</div>
            <div
                style={{
                    marginTop: 24,
                }}
            >
                {current > 0 && (
                    <Button

                        onClick={() => prev()}
                    >
                        Anterior
                    </Button>
                )}
                {current < generalSteps.length - 1 && (
                    <Button type="primary" onClick={() => next()}
                        style={{
                            margin: '0 8px',
                        }}
                    >
                        Siguiente
                    </Button>
                )}
            </div>


        </Modal>}
    </>)

}

export default MessageOrientation; 