import React, { useState, useEffect } from 'react';
import Icon, {
    AppstoreOutlined,
    ControlOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    SettingOutlined,
    UploadOutlined,
    UserOutlined,
    ToolOutlined,
    SoundOutlined,
    CloseOutlined,
    HeartFilled,
    RightOutlined,
    UpOutlined,
    ExclamationOutlined
} from '@ant-design/icons';
import { Layout, theme, FloatButton, ConfigProvider } from 'antd';
import { useSelector } from 'react-redux';
import { Empty, Tabs } from 'antd-mobile';
import i18next from 'i18next';
import ApplicationsPage from './urbegis/pages/applicationsPage';
import ProfilePage from './urbegis/pages/profilePage';
import AdminPage from './urbegis/pages/adminPage';
import ManagerPage from './urbegis/pages/managerPage';
import ParamPage from './urbegis/pages/paramPage';
import ReactCountryFlag from 'react-country-flag';
import LanguajeSelector from '../components/common/languajeSelector';
import LoggedStatus from '../components/common/loggedStatus';
import { IsAdmin, IsManager } from '../utilities/SecurityUtil';
import AppMenu from '../components/public/appMenu';
import ContentPage from './urbegis/pages/contentPage';
import { generalParams_state } from '../features/generalParams/generalParamsSlice';
import {
    getBackgroundColorPrimary,
    getBackgroundColorSecundary,
    getLogoApp
} from '../utilities/paramsUtils';
import { ReactComponent as layer_map } from "../assets/esri/layer-map.svg";
import { AppService } from '../service/appService';
import { user_state } from '../features/user/userSlice';
import { CancelAudio, CheckQueu, Speak } from '../utilities/pageContentReader';
import { ContentReader } from '../utilities/pageContentReaderClass';
import { selectLang } from '../features/language/languageSlice';
import MessageOrientation from '../components/public/messageOrientation';
import IconNoSound from '../components/icons/IconNoSound';


const { Header, Sider, Content } = Layout

function UrbegisAppMobile({ handleChangeLanguage, defaultAppId }) {

    const state_params = useSelector(generalParams_state)
    const userstate = useSelector(user_state)
    const language = useSelector(selectLang)

    const [collapsed, setCollapsed] = useState(false);
    const [numberPublicApps, setNumberPublicApps] = useState(null);
    const [renderContent, setRenderContent] = useState();
    const [selectedSiderMenu, setSelectedSiderMenu] = useState();
    const [selectedAppMenu, setSelectedAppMenu] = useState();
    const [app, setApp] = useState(null);
    const [soundActivated, setSoundActivated] = useState(false)
    const [chosenContent, setChosenContent] = useState();

    const [favouriteAppsSelect, setFavouriteAppsSelect] = useState(false)
    const [mensajeLoggeo, setMensajeLoggeo] = useState(false)

    const [showOrientation, setShowOrientation] = useState(false)
    const [showFloatButtons, setShowFloatButtons] = useState(true)
    const [bliker, setBlicker] = useState(true)

    const [contentViewType, setContentViewType] = useState([])


    const {
        token: { colorBgContainer },
    } = theme.useToken();

    const [backgroundColorHeader, setBackgroundColorHeader] = useState(colorBgContainer)
    const [backgroundColorContent, setBackgroundColorContent] = useState(colorBgContainer)
    const [logo, setLogo] = useState("")

    useEffect(() => {

        if (state_params.length > 0) {

            let colorHeader = getBackgroundColorPrimary(state_params)

            if (colorHeader) {
                setBackgroundColorHeader(colorHeader)
            }

            let colorContent = getBackgroundColorSecundary(state_params)

            if (colorContent) {

                setBackgroundColorContent(colorContent)
            }

            let logo = getLogoApp(state_params)

            if (logo) {
                setLogo(logo)
            }
        } else {
            setBackgroundColorHeader(colorBgContainer)
            setBackgroundColorContent(colorBgContainer)
        }

    }, [state_params])

    /**
 * Hacer la llamada a la aplicación de información general
 */
    useEffect(() => {
        /**
         * Se eliminan los difuminados de color blanco que aparecen en los extremos del menu tabulado.
         */
        const maskRight = document.getElementsByClassName("adm-tabs-header-mask-right");
        const maskLeft = document.getElementsByClassName("adm-tabs-header-mask-left");

        if (maskRight[0] && maskLeft[0]) {
            maskRight[0].remove();
            maskLeft[0].remove();
        }

        setRenderContentFunc("innit");
    }, [])

    /**
 * Este useEffect renderiza la pagina de aplicaciones cuando se ha clicado el boton de favoritos 
 * y solo cuando la vista está en la pestaña de aplicaciones
 */
    useEffect(() => {
        if (chosenContent == "applications") {
            setRenderContentFunc("applications");
            setChosenContent("applications")
        }
    }, [favouriteAppsSelect])

    /**
 *Cada vez que hay cambio de usuario se comprueba a cuantas aplicaciones tiene acceso
 */
    useEffect(() => {
        mountSiderMenu()
    }, [userstate])


    /**
 * Aplicación que monta el menú lateral asincronamente.
 */
    const mountSiderMenu = async () => {
        let numApps = await countNumberOfPublicApps();
        //console.log("pasa a la construcción del array")
        let array = getSiderItems(numApps)
        //console.log("fija el numero de apps")
        setNumberPublicApps(array)
    }


    /**
     * Función que sirve para iniciar la app de Información general.
     * 
     * @param {*} idUnit 
     * @param {*} lang 
     */
    const startInnit = (idUnit, lang) => {
        AppService.INNIT(idUnit, lang)
            .then((data) => {
                renderAppFunction(data[0])
            })
            .catch((error) => console.log(error))
    }

    /**
     * Función que asigna el numero de aplicaciones que tiene acceso el usuario
     * Si el usuario tiene acceso a una o más aplicaciones se muestra la pestaña de aplicaciones, sino no.
     */
    const countNumberOfPublicApps = async () => {
        let out = []
        await AppService.LIST()
            .then((resp) => {
                //console.log("respuesta asyncrona")
                out = resp.length
            })
            .catch((error) => {
                out = 0
                console.log(error)
            })
        //console.log("devuelve valor de respuesta asyncrona")
        return out
    }


    const renderAppContent = (item, openApp) => {
        //setSelectedSiderMenu(null)
        setSelectedAppMenu(item.key)

        setRenderContent(<ContentPage app={openApp ? openApp : app} item={item} colorBackground={backgroundColorHeader}/>)

    }

    const renderAppFunction = (openApp) => {
        //Con esto evitamos el cambio de menú desde otros componentes si ha cambios para guardar
        if (window.preventUnmountComponents) {
            window.preventUnmountComponentFunction()
            return
        }


        setSelectedSiderMenu("application");
        //setApp({...app})

        setApp(null)
        if (openApp.config && (typeof openApp.config === 'string' || openApp.config instanceof String)) {
            openApp.config = JSON.parse(openApp.config)
        }
        setApp(openApp)

        //Vamos a primer contenido, si eciste
        let firstLeaf = null
        for (let i in openApp.config) {
            if (!firstLeaf && openApp.config[i].type == "LEAF") {
                firstLeaf = openApp.config[i];
            }
        }
        if (firstLeaf) {
            renderAppContent(firstLeaf, openApp)
        }


    }


    const setRenderContentFunc = (content) => {
        setChosenContent(content)
        //Con esto evitamos el cambio de menú desde otros componentes si ha cambios para guardar
        if (window.preventUnmountComponents) {
            window.preventUnmountComponentFunction()
            return
        }
        setSelectedAppMenu(null)
        setApp(null)
        setSelectedSiderMenu(content);

        if (content == "innit") {
            startInnit(defaultAppId, i18next.language)

        }

        else if (content == "applications") {
            setRenderContent(
                function (renderApp) {
                    return <ApplicationsPage renderApp={renderAppFunction} favouriteAppsSelect={favouriteAppsSelect} />
                })
        }
        else if (content == "profile") {
            setRenderContent(
                function () {
                    return <ProfilePage mensajeLoggeo={mensajeLoggeo} setMensajeLoggeo={setMensajeLoggeo} />
                })
        }
        else if (content == "admin") {
            setRenderContent(
                function () {
                    return <AdminPage />
                })
        }
        else if (content == "manager") {
            setRenderContent(
                function () {
                    return <ManagerPage />
                })
        }
        else if (content == "params") {
            setRenderContent(
                function () {
                    return <ParamPage />
                })
        }
        else {
            setRenderContent(
                function () {
                    return <Empty />
                })
        }
    }


    const getSiderItems = (num) => {

        let out = []
        out.push(
            {
                key: 'innit',
                icon: <Icon component={layer_map} />,
                label: <div className="reader">{i18next.t('urbegis.pages.innit.name')}</div>,
                onClick: (e) => {
                    setFavouriteAppsSelect(false)
                    setRenderContentFunc("innit");
                    setChosenContent("innit")
                }
            }
        )

        if (num > 0) {
            out.push({
                key: 'applications',
                icon: <AppstoreOutlined style={{ marginRight: "3px" }} />,
                label: <div className="reader">{i18next.t('urbegis.pages.applications.name')}</div>,
                onClick: (e) => {
                    setFavouriteAppsSelect(false)
                    setRenderContentFunc("applications");
                    setChosenContent("applications")
                }
            })
        }

        out.push({
            key: 'profile',
            icon: <UserOutlined />,
            label: <div className="reader">{i18next.t('urbegis.pages.profile.name')}</div>,
            onClick: (e) => {
                setFavouriteAppsSelect(false)
            }
        })


        if (IsManager(userstate)) {

            out.push({
                key: 'manager',
                icon: <SettingOutlined />,
                label: <div className="reader">{i18next.t('urbegis.pages.manager.name')}</div>,
                onClick: (e) => {
                    setFavouriteAppsSelect(false)
                }
            })
        }

        if (IsAdmin(userstate)) {
            out.push({
                key: 'admin',
                icon: <ToolOutlined />,
                label: <div className="reader">{i18next.t('urbegis.pages.admin.name')}</div>,
                onClick: (e) => {
                    setFavouriteAppsSelect(false)
                }
            })
            out.push({
                key: 'params',
                icon: <ControlOutlined />,
                label: <div className="reader">{i18next.t('urbegis.pages.parameterization.name')}</div>,
                onClick: (e) => {
                    setFavouriteAppsSelect(false)
                    setRenderContentFunc("params");
                }
            })
        }

        out.push({
            key: 'language',
            icon: <LanguajeSelector handleChangeLanguage={handleChangeLanguage} setRenderContentFunc={setRenderContentFunc}></LanguajeSelector>,
            label: '           ',
            disabled: true
        })

        return out;
    }

    /**
 * Función que recoge como parámetro el nombre de la clase que identifica a los elementos del DOM que hay que leer.
 * Se usan las funciones de la WEB AUDIO API para realizar la lectura.
 * Con la función CheckQueu() se comprueba que ya no hay más contenido por leer para eliminar el botón de cancelar audio.
 * Se utiliza la función Speak() para reproducir el audio en un idioma en concreto
 * 
 * @param {*} className 
 */
    const lecturaContenido = (className) => {
        setSoundActivated(true)
        const textoElement = Array.from(
            document.getElementsByClassName(className)
        );
        for (let index = 0; index < textoElement.length; index++) {
            const element = textoElement[index];
            const palabra = textoElement[index].innerText;
            let reader = new ContentReader(palabra);
            reader.utterance.onstart = () => {
                element.classList.add("highlight");
            }
            reader.utterance.onend = () => {
                element.classList.remove("highlight")
                if (!CheckQueu()) {
                    setSoundActivated(false)
                }
            }
            Speak(reader.utterance, language)
        }

    }

    return (
        <>
            <Layout style={{
                "height": "100vh",
                "width": "100%",
                "display": "flex",
                "alignItems": "flex-end",
            }}>
                {numberPublicApps && <div style={{ marginBottom: "auto", width: "100%" }}>
                    <div style={{ textAlign: "center", float: "left", height: "50px", background: backgroundColorContent, width: "60px" }} >
                        <img src={logo} alt='' className="demo-logo-vertical-mobile">
                        </img>
                    </div>
                    <div style={{ marginLeft: "60px" }}>
                        <Tabs className='ant-layout-sider' onChange={(e) => {
                            if (e == 'language' || e == 'logo') {
                                return
                            }
                            else {
                                setRenderContentFunc(e)
                            }
                        }} activeKey={selectedSiderMenu}
                            style={{ background: backgroundColorContent }}>
                            {numberPublicApps && numberPublicApps.map(item => (
                                <Tabs.Tab
                                    title={item.icon}
                                    key={item.key}>
                                </Tabs.Tab>

                            ))}

                        </Tabs>
                    </div>

                </div>}

                <div style={{ marginBottom: "auto", width: "100%" }}>

                    {app && <AppMenu app={app} renderAppContent={renderAppContent}
                        selectedAppMenu={selectedAppMenu} setSelectedAppMenu={setRenderContentFunc}
                        setContentViewType={setContentViewType}></AppMenu>
                    }
                </div>

                <Content
                    style={{
                        background: backgroundColorContent,
                        width: "100%",
                        display: "flex",
                        flexDirection: "column",
                        height: "100vh",
                        overflow: "auto"
                    }}
                >

                    {renderContent}
                    {!renderContent && <Empty />}
                </Content>
                <FloatButton.Group
                    key={"right"}
                    open={showFloatButtons}
                    trigger="click"
                    placement={"right"}
                    onClick={(e) => {
                        setShowFloatButtons(!showFloatButtons)
                        setBlicker(false)
                    }}
                    style={{ right: 24, zIndex: 1000 }}
                    icon={<UpOutlined key="right" />}
                >
                    {
                        userstate.token && !app && chosenContent == "applications" &&
                        <FloatButton type="primary" icon={<HeartFilled />}
                            onClick={(e) => { setFavouriteAppsSelect(!favouriteAppsSelect); }} />
                    }
                    <FloatButton
                        shape="circle"
                        type="primary"
                        icon={<SoundOutlined style={{ color: 'black' }} />}
                        onClick={() => {
                            lecturaContenido("reader")
                        }}
                    />
                    {/*<ConfigProvider
                        theme={{
                            components: {
                                FloatButton: {
                                    colorPrimary: "#ff7616",
                                    colorPrimaryHover: "#ff9751",
                                }
                            }
                        }}
                    >
                        <FloatButton
                            type='primary'
                            className={bliker ? 'blink' : ''}
                            icon={<ExclamationOutlined style={{ color: 'black' }} />}
                            onClick={(e) => {
                                setShowOrientation(true)
                                setBlicker(false)
                            }} />
                    </ConfigProvider>*/}
                    {soundActivated &&
                        <FloatButton
                            shape="circle"
                            type="primary"
                            icon={<IconNoSound />}
                            onClick={() => {
                                setSoundActivated(false)
                                CancelAudio("reader")
                            }}
                        />}

                </FloatButton.Group>
            </Layout>
            {showOrientation && <MessageOrientation showOrientation={showOrientation} setShowOrientation={setShowOrientation} contentViewType={contentViewType}></MessageOrientation>}
            {/**<Layout style={{ height: "100vh" }}>
        <Sider trigger={null} collapsible collapsed={collapsed}>
            <div className="demo-logo-vertical" >

            </div>
            <Menu
                theme="dark"
                mode="inline"
                selectedKeys={[selectedSiderMenu]}
                items={getSiderItems()}
            />
        </Sider>
        <Layout>
            <Header
                style={{
                    padding: 0,
                    background: colorBgContainer,
                    alignItems: "flex-start"
                }}                >
                <Row style={{ width: "100%", paddingRight: "20px" }}>
                    <Col flex="auto">
                        <Row>
                            <Col>
                                <Button
                                    type="text"
                                    icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                                    onClick={() => setCollapsed(!collapsed)}
                                    style={{
                                        fontSize: '16px',
                                        width: 64,
                                        height: 64,
                                    }}
                                />
                            </Col>
                            <Col flex="auto">
                                <>
                                
                                
                                    {app && <AppMenu app={app} renderAppContent={renderAppContent}
                                    selectedAppMenu={selectedAppMenu} setSelectedAppMenu={setRenderContentFunc}></AppMenu>}
                                </>
                            </Col>
                        </Row>
                    </Col>
                    <Col flex="130px" style={{textAlign: "right"}}>
                        <Space wrap>
                            <LoggedStatus setRenderContentFunc={setRenderContentFunc}></LoggedStatus>
                            <LanguajeSelector handleChangeLanguage={handleChangeLanguage} setRenderContentFunc={setRenderContentFunc}></LanguajeSelector>
                        </Space>
                    </Col>
                </Row>

            </Header>
            <Content
                style={{
                    margin: '24px 16px',
                    padding: 24,
                    minHeight: 280,
                    background: colorBgContainer,
                    overflow: "auto"
                }}
            >
                {renderContent}
                {!renderContent && <Empty />}
            </Content>
        </Layout>
    </Layout> */}</>

    );
}

export default UrbegisAppMobile;

