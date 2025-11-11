import { Button, Checkbox, Form, Input, Space, Tooltip, Row, Card, Col, Alert, theme, ConfigProvider } from 'antd';
import { LoginOutlined } from '@ant-design/icons';
import i18next from "i18next";
import { useEffect, useState } from "react"

import { useDispatch, useSelector } from 'react-redux';
import { SecurityService } from '../../service/securityService';
import { login, logout, user_state } from '../../features/user/userSlice';
import { generalParams_state } from '../../features/generalParams/generalParamsSlice';
import { getBackgroundColorPrimary, getNombreAyuntamiento } from '../../utilities/paramsUtils';
import { selectLang } from '../../features/language/languageSlice';
import RegisterFormComponent from './registerFormComponent';
import { AppService } from '../../service/appService';
import LoadingComponent from '../utils/LoadingComponent';

const LoginComponent = ({ mensajeLoggeo, setMensajeLoggeo }) => {

    const dispatch = useDispatch();
    const userstate = useSelector(user_state);
    const state_params = useSelector(generalParams_state)
    const [noValidUser, setNoValidUser] = useState()
    const [mensajeLogLocal, setMensajeLogLocal] = useState(mensajeLoggeo)

    const {
        token: { colorBgContainer },
    } = theme.useToken();

    const [backgroundColor, setBackgroundColor] = useState(colorBgContainer)

    const [estadoForm, setEstadoForm] = useState("login")

    const [loginForm] = Form.useForm();

    const [registerForm] = Form.useForm();

    const loginExpiration = 60 * 1000 * 60 * 24 * 30 // Expira en 30 días
    let values = { "username": null, "password": null, "remember": false };

    let loginComponentValues = localStorage.getItem("sgvmap40_loginComponentValues");
    if (loginComponentValues) loginComponentValues = JSON.parse(loginComponentValues);

    if (loginComponentValues && loginComponentValues.expiry > Date.now()) {
        values = loginComponentValues.value;
    }

    const handleLogin = (value) => {
        dispatch(login(value))
    };

    const handleLogout = () => {
        dispatch(logout())
        setMensajeLoggeo(false)
        setMensajeLogLocal(false)
    };


    const onFinish = () => {

        loginForm.validateFields().then((values) => {
            if (values.remember) {
                // `item` is an object which contains the original value
                // as well as the time when it's supposed to expire
                const item = {
                    value: values,
                    expiry: Date.now() + loginExpiration,
                }
                localStorage.setItem("urbegis_loginComponentValues", JSON.stringify(item));
            }
            else {
                localStorage.removeItem("urbegis_loginComponentValues");
            }

            SecurityService.AUTHENTICATE(values.username, values.password)
                .then((data) => {
                    setNoValidUser(false)
                    let userFeature = {};
                    userFeature.username = data.username
                    userFeature.authorities = [];
                    for (let i in data.authorities) {
                        userFeature.authorities.push(data.authorities[i].authority)
                    }
                    userFeature.token = data.token;
                    handleLogin(userFeature);

                }).catch((error) => {
                    console.log("ha habido un error")
                    setNoValidUser(true)
                })
        })


    };

    const onFinishFailed = (errorInfo) => {
    };


    useEffect(() => {

        if (state_params.length > 0) {

            let colorHeader = getBackgroundColorPrimary(state_params)

            if (colorHeader) {
                setBackgroundColor(colorHeader)
            }

        } else {
            setBackgroundColor(colorBgContainer)
        }

    }, [state_params])

    return (<>
        {userstate.logged &&
            <LogoutForm
                userstate={userstate} handleLogout={handleLogout} loginForm={loginForm} backgroundColor={backgroundColor}
                mensajeLoggeo={mensajeLoggeo} setMensajeLoggeo={setMensajeLoggeo} setMensajeLogLocal={setMensajeLogLocal} mensajeLogLocal={mensajeLogLocal}></LogoutForm>}
        {!userstate.logged && estadoForm == "login" &&
            <LoginForm values={values} onFinish={onFinish} onFinishFailed={onFinishFailed}
                loginForm={loginForm} noValidUser={noValidUser} setNoValidUser={setNoValidUser}
                setEstadoForm={setEstadoForm} backgroundColor={backgroundColor}
            ></LoginForm>}
        {/*!userstate.logged && estadoForm=="register" && <RegisterFormComponent setEstadoForm={setEstadoForm} registerForm={registerForm}/>*/}
    </>
    )
}
export default LoginComponent;


const LogoutForm = ({ userstate, handleLogout, backgroundColor, mensajeLoggeo, setMensajeLoggeo, setMensajeLogLocal, mensajeLogLocal }) => {

    const userState = useSelector(user_state)
    const language = useSelector(selectLang)

    const [role, setRole] = useState("")
    //const [unidades, setUnidades] = useState("")
    const [namesApps, setNameApps] = useState([])
    const [loading, setLoading] = useState(false)

    const addComplementaryText = (userState) => {
        const user_authorities = userState.authorities
        if (user_authorities.includes("ROLE_ADMIN")) {
            setRole(i18next.t("text.admin"))
        }
        else {
            //let unidades = []
            user_authorities.forEach(rol => {
                if (rol != "ROLE_PUBLIC") {
                    const coincidencias = rol.match(/UNIT=([^&]+)/);

                    //const unidad = coincidencias ? coincidencias[1] : null

                    // Extraer las palabras encontradas y agregarlas a la lista
                    /*if (unidad) {
                        //console.log(unidad)
                        unidades.push(unidad.charAt(0).toUpperCase() + unidad.slice(1).toLowerCase())
                    }*/
                }
            })
            setRole(i18next.t("text.manager"))
            //setUnidades(unidades)
        }
    }

    const renderText = (role, userState, apps) => {
        if (role == "Gestor") {

            setMensajeLoggeo(<>
                <div className="reader">{i18next.t("text.loggedIn.manager", { "username": userState.username, "userrole": role })}</div>
                <ul>
                    {apps.map((app) => <li className="reader">{i18next.t("text.loggedIn.unidad", { "unidad": app })}</li>)}
                </ul>
            </>)

            return <>
                <div className="reader">{i18next.t("text.loggedIn.manager", { "username": userState.username, "userrole": role })}</div>
                <ul>
                    {apps.map((app) => <li className="reader">{i18next.t("text.loggedIn.unidad", { "unidad": app })}</li>)}
                </ul>
            </>
        } else if (role == "Manager") {

            setMensajeLoggeo(<>
                <div className="reader">{i18next.t("text.loggedIn.manager", { "username": userState.username, "userrole": role })}</div>
                <ul>
                    {apps.map((app) => <li className="reader">{i18next.t("text.loggedIn.unidad", { "unidad": app })}</li>)}
                </ul>
            </>)

            return <>
                {i18next.t("text.loggedIn.manager", { "username": userState.username, "userrole": role })}
                <ul>
                    {apps.map((app) => <li>{i18next.t("text.loggedIn.unidad", { "unidad": app })}</li>)}
                </ul>
            </>
        }
        else if (role == "Administrador") {
            setMensajeLoggeo(<div className="reader">{i18next.t("text.loggedIn.admin", { "username": userState.username, "userrole": role })}</div>)
            return <div className="reader">{i18next.t("text.loggedIn.admin", { "username": userState.username, "userrole": role })}</div>
        }
        else {
            return <div></div>
        }
    }

    useEffect(() => {
        if (!mensajeLogLocal) {
            setLoading(true)
            AppService.LIST()
                .then((resp) => {
                    let nameAppsAux = []
                    resp.map((item, index) => {
                        nameAppsAux.push(item.appName)
                    })
                    setNameApps(nameAppsAux)
                    return "done"
                })
                .then((resp) => {
                    if (resp == "done") {
                        setLoading(false)
                    }
                })
                .catch((error) => {
                    setLoading(false)
                    console.log(error)
                })
        }

    }, [])

    useEffect(() => {
        addComplementaryText(userState)
    }, [language])


    return (
        <Card
            title={<div className="reader" style={{ color: "#000000", fontFamily: "sans-serif", fontSize: "" }}>{i18next.t('common.tools.login.logged')}</div>}
            size="small"
            bordered={true}
            //headStyle={{ background: backgroundColor }}
            styles={{header: {background:backgroundColor }}}>
            <Space direction='vertical'>
                <Space>
                    <div className="reader" style={{ color: "#000000", fontFamily: "sans-serif", fontSize: "15px" }}>{i18next.t('common.tools.login.logged_as') + ' '}<b>{userstate.username}</b></div>
                    <Tooltip title={i18next.t('common.tools.login.logout')}>
                        <Button type="primary" icon={<LoginOutlined />} onClick={(e) => handleLogout()} />
                    </Tooltip>
                </Space>
                {!loading && <div style={{ padding: "10px", border: "1px dashed grey", color: "#000000", fontFamily: "sans-serif", fontSize: "15px" }}>
                    {
                        mensajeLogLocal ? mensajeLogLocal : renderText(role, userState, namesApps)
                        /*role == "Gestor" || role == "Manager" ?

                            i18next.t("text.loggedIn.manager", { "username": userState.username, "userrole": role, "unidades": unidades }) :
                            i18next.t("text.loggedIn.admin", { "username": userState.username, "userrole": role })*/
                    }
                </div>}
            </Space>
            {loading && <div style={{ textAlign: "center", width: "auto" }}><LoadingComponent></LoadingComponent></div>}

        </Card>
    )

}

const LoginForm = ({ values, onFinish, onFinishFailed, loginForm, noValidUser, setNoValidUser, setEstadoForm, backgroundColor }) => {

    const state_params = useSelector(generalParams_state)
    const [nombreAyuntamiento, setNombreAyuntamiento] = useState("")


    useEffect(() => {

        if (state_params.length > 0) {

            if (state_params.length > 0) {
                let nombre_ayuntamiento = getNombreAyuntamiento(state_params)

                if (nombre_ayuntamiento) {
                    setNombreAyuntamiento(nombre_ayuntamiento)
                }
            }

        } else {

        }

    }, [state_params])

    const [form] = Form.useForm();

    return (
        <Row>
            <Col span={20} offset={2}>
                <Card
                    //headStyle={{ background: backgroundColor }}
                    styles={{header: {background:backgroundColor }}}
                    title={<div className="reader" style={{ color: "#000000", fontFamily: "sans-serif", fontSize: "15px" }}>{i18next.t('common.tools.login.login')}</div>}
                    size="small"
                    bordered={true}
                    style={{}}>
                    <Form
                        name="basic"
                        layout="vertical"
                        initialValues={values}
                        onFinish={onFinish}
                        onFinishFailed={onFinishFailed}
                        form={loginForm}
                        autoComplete="off"

                    >
                        <Form.Item
                            label={<div className="reader" style={{ color: "#000000", fontFamily: "sans-serif", fontSize: "15px" }}>{i18next.t('common.tools.login.username')}</div>}
                            name="username"
                            rules={[
                                {
                                    required: true,
                                    message: i18next.t('common.tools.login.username_required'),
                                },
                            ]}
                            style={{}}
                        >
                            <Input />
                        </Form.Item>

                        <Form.Item
                            label={<div className="reader" style={{ color: "#000000", fontFamily: "sans-serif", fontSize: "15px" }}>{i18next.t('common.tools.login.password')}</div>}
                            name="password"
                            value={values.password}
                            rules={[
                                {
                                    required: true,
                                    message: i18next.t('common.tools.login.password_required'),
                                },
                            ]}
                        >
                            <Input.Password />
                        </Form.Item>

                        <Form.Item
                            name="remember"
                            valuePropName="checked"
                            value={values.remember}
                            wrapperCol={{
                                offset: 8,
                                span: 16,
                            }}
                        >
                            <Checkbox>{<div className="reader" style={{ color: "#000000", fontFamily: "sans-serif", fontSize: "15px" }}>{i18next.t('common.tools.login.rememberme')}</div>}</Checkbox>
                        </Form.Item>

                        <Form.Item
                            wrapperCol={{
                                offset: 8,
                                span: 16,
                            }}
                        >
                            <Button type="primary" onClick={(e) => {
                                onFinish();
                                return false;
                            }}>
                                {<div className="reader" style={{ fontFamily: "sans-serif", fontSize: "15px" }}>{i18next.t('common.tools.login.initsession')}</div>}
                            </Button>
                        </Form.Item>
                    </Form>
                    {/*<Space direction='vertical'>
                        {noValidUser &&
                            <>
                                <Alert
                                    message="Nombre de usuario/contraseña errores o usuario no registrado."
                                    type="error"
                                    style={{ textAlign: "center" }}
                                    action={
                                        <Button size="small" type="primary" onClick={(e)=> {setEstadoForm("register");setNoValidUser(false)}}>
                                            Registrarse
                                        </Button>
                                    }
                                    closable
                                    onClose={() => setNoValidUser(false)}
                                />
                            </>
                        }
                        {<div style={{ padding: "10px", border: "1px dashed grey" }}>
                            <div className="reader">{i18next.t("text.logIn", { "name": nombreAyuntamiento })}</div>
                        </div>}
                    </Space>*/}

                </Card>

            </Col>
        </Row>
    )
}