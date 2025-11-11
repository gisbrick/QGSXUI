import { useState, useEffect } from "react";
import { DownOutlined, DownloadOutlined, ReloadOutlined } from "@ant-design/icons";
import { Badge, Button, Dropdown, Menu, message, Modal, Select, Space, Steps, Switch, theme } from "antd";
import Title from "antd/es/typography/Title";
import i18next from "i18next";

const Transfer = ({ map, custom_app_component }) => {

    const steps = [
        {
            title: 'Primero',
            content: 'Contenido',
        },
        {
            title: 'Segundo',
            content: 'Contenido',
        },
        {
            title: 'ültimo',
            content: 'Contenido',
        },
    ];

    const { token } = theme.useToken();
    const [current, setCurrent] = useState(0);
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
    const contentStyle = {
        lineHeight: '260px',
        textAlign: 'center',
        color: token.colorTextTertiary,
        backgroundColor: token.colorFillAlter,
        borderRadius: token.borderRadiusLG,
        border: `1px dashed ${token.colorBorder}`,
        marginTop: 16,
    };

    const render = () => {
        return <>
            <Title level={3}>Este es un ejemplo sobre el que implementar el componente de Traslado en cementerios</Title>
            <br /><br />
            <Steps current={current} items={items} />
            <div style={contentStyle}>{steps[current].content}</div>
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
                    <Button type="primary" onClick={() => next()}>
                        Siguiente
                    </Button>
                )}
                {current === steps.length - 1 && (
                    <Button type="primary" onClick={() => message.success('Processing complete!')}>
                        Hecho
                    </Button>
                )}
            </div>
        </>
    }



    return (
        <>
            {render()}
        </>
    )
};
export default Transfer;