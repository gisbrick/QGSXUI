
import { useEffect, useState } from "react";
import { generalParams_state } from "../../features/generalParams/generalParamsSlice";
import { useSelector } from "react-redux";
import { getWelcomeMessage } from "../../utilities/paramsUtils";
import { Button, Card, Checkbox, Image, Modal, Steps } from "antd";

import centro from './images/centro.png';
import superior_izquierda from './images/superior_izquierda.png';
import superior from './images/superior.png';
import izquierda from './images/izquierda.png';
import i18next from "i18next";

const MessageWelcome = ({ }) => {

    const [welcomeMessage, setWelcomeMessage] = useState();
    const [show, setShow] = useState();
    const state_params = useSelector(generalParams_state)

    const [current, setCurrent] = useState(0);

    const steps = [
        {
            title: '',
            content: <div dangerouslySetInnerHTML={{ __html: welcomeMessage }} />
        },
        {
            title: '',
            content: <Card>
                <p>{i18next.t("welcomeMessage.slide1.text")}</p>
                <Image
                    width={'100%'}
                    src={superior_izquierda}
                />
            </Card>,
        },
        {
            title: '',
            content: <Card>
                <p>{i18next.t("welcomeMessage.slide2.text")}</p>
                <p>{i18next.t("welcomeMessage.slide2.text1")}</p>
                <Image
                    width={'100%'}
                    src={izquierda}
                />
            </Card>
        },
        {
            title: '',
            content: <Card>
                <p>{i18next.t("welcomeMessage.slide3.text")}</p>
                <Image
                    width={'100%'}
                    src={centro}
                />
            </Card>
        },
        {
            title: '',
            content: <Card>
                <p>{i18next.t("welcomeMessage.slide4.text")}</p>
                <Image
                    width={'100%'}
                    src={superior}
                />
            </Card>
        },
    ];

    useEffect(() => {
        let hidewWelcome = localStorage.getItem('URBEGIS_hideWelcome');
        let welcomeMessage = getWelcomeMessage(state_params)
        setWelcomeMessage(welcomeMessage)
        if (!hidewWelcome && welcomeMessage) {
            setShow(true);
        }
        else {
            //localStorage.removeItem('URBEGIS_hideWelcome')
        }
    }, [])

    const next = () => {
        setCurrent(current + 1);
    };
    const prev = () => {
        setCurrent(current - 1);
    };

    const items = steps.map((item) => ({
        key: item.title,
        title: item.title,
    }));

    return (<>
        {show && <Modal
            title="Bienvenido"
            open={show}

            onCancel={() => {
                setShow(false)
            }}
            footer={[
                <Checkbox onChange={(e) => {
                    if (e.target.checked) {
                        localStorage.setItem('URBEGIS_hideWelcome', true)
                    }
                    else {
                        localStorage.removeItem('URBEGIS_hideWelcome')
                    }
                }}>No volver a mostrar</Checkbox>
            ]}
        >


            <Steps current={current} items={items} />
            <br />
            <div>{steps[current].content}</div>
            <div
                style={{
                    marginTop: 24,
                }}
            >
                {current > 0 && (
                    <Button
                        style={{
                            margin: '0 8px',
                        }}
                        onClick={() => prev()}
                    >
                        Anterior
                    </Button>
                )}
                {current < steps.length - 1 && (
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

export default MessageWelcome 