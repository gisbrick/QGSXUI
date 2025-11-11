import { Button, Row, Col, Card, Form, Input, Checkbox, Space } from "antd";
import i18next from "i18next";
import { useState, useEffect } from "react";


const RegisterFormComponent = ({ setEstadoForm, registerForm }) => {

    const [username, setUsername] = useState("")
    const [lastname, setLastname] = useState("")
    const [email, setEmail] = useState("")
    const [phone, setPhone] = useState("")
    const [postcode, setPostcode] = useState("")
    const [password, setPassword] = useState("")
    const [notifications, setNotifications] = useState(false)

    const values = {
        "username": "amigo",
        "lastname": null,
        "email": null,
        "phone": null,
        "postalcode": null,
        "password":null,
        "checkpassword": null,
        "notifications": true
    }


    const onFinish = () => {

    }

    const onFinishFailed = () => { }


    return (
        <Row>
            <Col span={20} offset={2}>
                <Card
                    title={<div className="reader">{i18next.t('common.tools.registration.registration')}</div>}
                    size="small"
                    bordered={true}
                    style={{}}>
                    <Form
                        name="basic"
                        layout="vertical"
                        //initialValues={values}
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        form={registerForm}
                        autoComplete="off"
                    >
                        <Form.Item
                            label={<div className="reader">{i18next.t('common.tools.registration.username')}</div>}
                            name="username"
                            value={username}
                            rules={[
                                {
                                    required: true,
                                    message: i18next.t('common.tools.registration.username_required'),
                                },
                            ]}
                            style={{}}
                        >
                            <Input value={username}/>
                        </Form.Item>

                        <Form.Item
                            label={<div className="reader">{i18next.t('common.tools.registration.lastname')}</div>}
                            name="lastname"
                            rules={[
                                {
                                    required: true,
                                    message: i18next.t('common.tools.registration.lastname_required'),
                                },
                            ]}
                            style={{}}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label={<div className="reader">{i18next.t('common.tools.registration.email')}</div>}
                            name="email"
                            rules={[
                                {
                                    required: true,
                                    message: i18next.t('common.tools.registration.email_required'),
                                },
                            ]}
                            style={{}}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label={<div className="reader">{i18next.t('common.tools.registration.phone')}</div>}
                            name="phone"
                            rules={[
                                {
                                    required: true,
                                    message: i18next.t('common.tools.registration.phone_required'),
                                },
                            ]}
                            style={{}}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label={<div className="reader">{i18next.t('common.tools.registration.postalcode')}</div>}
                            name="postalcode"
                            rules={[
                                {
                                    required: true,
                                    message: i18next.t('common.tools.registration.postalcode_required'),
                                },
                            ]}
                            style={{}}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label={<div className="reader">{i18next.t('common.tools.registration.password')}</div>}
                            name="password"
                            value={""}
                            rules={[
                                {
                                    required: true,
                                    message: i18next.t('common.tools.registration.password_required'),
                                },
                            ]}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label={<div className="reader">{i18next.t('common.tools.registration.checkpassword')}</div>}
                            name="checkpassword"
                            rules={[
                                {
                                    required: true,
                                    message: i18next.t('common.tools.registration.password_required'),
                                },
                            ]}
                            style={{}}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            name="notifications"
                            valuePropName="checked"
                            wrapperCol={{
                                offset: 8,
                                span: 16,
                            }}
                        >
                            <Checkbox>{<div className="reader">{i18next.t('common.tools.registration.notifications')}</div>}</Checkbox>
                        </Form.Item>

                        <Form.Item
                            wrapperCol={{
                                offset: 8,
                                span: 16,
                            }}
                        >
                            <Space>
                                <Button type="primary" onClick={(e) => {
                                    onFinish();
                                    return false;
                                }}>
                                    {<div className="reader">{i18next.t('common.tools.registration.accept')}</div>}
                                </Button>
                                <Button htmlType="reset" type="primary" onClick={(e) => {
                                    setEstadoForm("login")
                                }}>
                                    {<div className="reader">{i18next.t('common.tools.registration.exit')}</div>}
                                </Button>
                            </Space>

                        </Form.Item>
                    </Form>
                </Card>
            </Col>
        </Row>
    )
}

export default RegisterFormComponent;