import React, { useState, useEffect, Suspense } from 'react';
import { useSelector } from 'react-redux';
import Icon, {
    AppstoreOutlined,
    ControlOutlined,
    MenuFoldOutlined,
    MenuUnfoldOutlined,
    SettingOutlined,
    ToolOutlined,
    UserOutlined,
    SoundOutlined,
    CloseOutlined,
    HeartFilled,
    MailOutlined,
    RightOutlined,
    QuestionOutlined,
    ExclamationOutlined,
    UpOutlined
} from '@ant-design/icons';
import { Layout, Menu, Button, theme, Tooltip, Empty, FloatButton, Row, Col, ConfigProvider, Spin } from 'antd';
import i18next from 'i18next';
import ApplicationsPage from './urbegis/pages/applicationsPage';
import ProfilePage from './urbegis/pages/profilePage';
import AdminPage from './urbegis/pages/adminPage';
import ManagerPage from './urbegis/pages/managerPage';
import LanguajeSelector from '../components/common/languajeSelector';
import LoggedStatus from '../components/common/loggedStatus';
import { HasAccessToUnitPermission, IsAdmin, IsManager } from '../utilities/SecurityUtil';
import AppMenu from '../components/public/appMenu';
import ContentPage from './urbegis/pages/contentPage';
import { generalParams_state } from '../features/generalParams/generalParamsSlice';
import { user_state } from '../features/user/userSlice';
import {
    getBackgroundColorPrimary,
    getBackgroundColorSecundary,
    getLetterColorSideMenu,
    getLetterSizeSideMenu,
    getLetterTypeSideMenu,
    getLogoApp,
    getLetterColorHeadMenu,
    getLetterSizeHeadMenu,
    getLetterTypeHeadMenu,
} from '../utilities/paramsUtils';
import ParamPage from './urbegis/pages/paramPage';
import { ReactComponent as layer_map } from "../assets/esri/layer-map.svg";
import { AppService } from '../service/appService';
import { CancelAudio, CheckQueu, Speak } from '../utilities/pageContentReader';
import { selectLang } from '../features/language/languageSlice';
import { ContentReader } from '../utilities/pageContentReaderClass';
import { favoriteApps_state } from '../features/favoriteApps/favoriteAppsSlice';
import LoadingComponent from '../components/utils/LoadingComponent';
import MessageOrientation from '../components/public/messageOrientation';
import IconNoSound from '../components/icons/IconNoSound';


const { Header, Sider, Content } = Layout

function UrbegisApp({ handleChangeLanguage, borderColorSideMenuOptions, defaultAppId, activeBgColorSideMenu, hoverBgColorSideMenu, numberShownApps }) {

    const state_params = useSelector(generalParams_state)
    const userstate = useSelector(user_state)
    const language = useSelector(selectLang)
    const state_favoriteApps = useSelector(favoriteApps_state);


    const [numberPublicApps, setNumberPublicApps] = useState([]);
    const [collapsed, setCollapsed] = useState(false);
    const [renderContent, setRenderContent] = useState();
    const [selectedSiderMenu, setSelectedSiderMenu] = useState();
    const [selectedAppMenu, setSelectedAppMenu] = useState();
    const [app, setApp] = useState();
    const [chosenContent, setChosenContent] = useState();
    const [soundActivated, setSoundActivated] = useState(false)
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
    const [letterColorSideMenu, setLetterColorSideMenu] = useState("#000000")
    const [letterSizeSideMenu, setLetterSizeSideMenu] = useState(14)
    const [letterTypeSideMenu, setLetterTypeSideMenu] = useState("Helvetica")

    const [letterSizeHeadMenu, setLetterSizeHeadMenu] = useState("16px")
    const [letterTypeHeadMenu, setLetterTypeHeadMenu] = useState("Helvetica")
    const [letterColorHeadMenu, setLetterColorHeadMenu] = useState("#000000")

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

            let letterColorSideMenu = getLetterColorSideMenu(state_params)

            if (letterColorSideMenu) {
                setLetterColorSideMenu(letterColorSideMenu)
            }

            let letterSizeSideMenu = getLetterSizeSideMenu(state_params)

            if (letterSizeSideMenu) {
                setLetterSizeSideMenu(letterSizeSideMenu)
            }

            let letterTypeSideMenu = getLetterTypeSideMenu(state_params)

            if (letterTypeSideMenu) {
                setLetterTypeSideMenu(letterTypeSideMenu)
            }


            let letterSize = getLetterSizeHeadMenu(state_params)

            if (letterSize) {
                setLetterSizeHeadMenu(letterSize)
            }

            let letterFamily = getLetterTypeHeadMenu(state_params)

            if (letterFamily) {
                setLetterTypeHeadMenu(letterFamily)
            }

            let letterColor = getLetterColorHeadMenu(state_params)

            if (letterColor) {
                setLetterColorHeadMenu(letterColor)
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
        setRenderContentFunc("innit");
        setChosenContent("innit")
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
        let applications = await loadApplications();
        let array = getSiderItems(applications)
        setNumberPublicApps(array)
    }

    /**
     * Función que sirve para iniciar la app de Información general.
     * 
     * @param {*} idUnit 
     * @param {*} lang 
     */
    const startInnit = (idUnit, lang, content) => {
        AppService.INNIT(idUnit, lang)
            .then((data) => {

                if (numberPublicApps.length > 0) {
                    data[0].idUntApp = content
                }
                renderAppFunction(data[0])
            })
            .catch((error) => console.log(error))
    }

    /**
     * Función que asigna el numero de aplicaciones que tiene acceso el usuario
     * Si el usuario tiene acceso a una o más aplicaciones se muestra la pestaña de aplicaciones, sino no.
     */
    const loadApplications = async () => {
        let out = 0
        await AppService.LIST()
            .then((resp) => {
                resp.map((item, index) => {
                    item.index = index;
                })
                out = resp.sort((a, b) => a.orden - b.orden)
                return "done"
            }).then((resp) => {
                if (resp == "done") {
                }
            }).catch((error) => {
                console.log(error)
            })
        return out
    }

    const openApplication = (app) => {
        //console.log("app", app)
        let appCopy = { ...app }
        renderAppFunction(appCopy)
    }

    const renderAppContent = (item, openApp) => {

        setSelectedAppMenu(item.key)
        setRenderContent(
            <ContentPage app={openApp ? openApp : app} item={item} colorBackground={backgroundColorHeader} />
        )

        if (openApp) {
            setSelectedSiderMenu(openApp.idUntApp + "")
        }
    }

    const renderAppFunction = (openApp) => {
        //Con esto evitamos el cambio de menú desde otros componentes si ha cambios para guardar
        if (window.preventUnmountComponents) {
            window.preventUnmountComponentFunction()
            return
        }
        //setApp({...app})

        setApp(null)
        if (openApp.config && (typeof openApp.config === 'string' || openApp.config instanceof String)) {
            openApp.config = JSON.parse(openApp.config)
        }
        setApp(openApp)

        //Vamos a primer contenido, si existe. Sino se busca el primer hijo del elemento padre
        let renderLeaf = null;
        let firstLeaf = openApp.config?.find((item) => item.type === "LEAF")

        let firstChildinParent = firstChildInParent(openApp.config)

        if (firstLeaf) {
            if (firstLeaf.permission && HasAccessToUnitPermission(openApp.idUnt.unitName, firstLeaf.permission, userstate)) {
                renderLeaf = firstLeaf;
            }
            else if (!firstLeaf.permission) {
                renderLeaf = firstLeaf;
            }
        }
        if (!firstLeaf && firstChildinParent) {
            if (firstChildinParent.permission && HasAccessToUnitPermission(openApp.idUnt.unitName, firstChildinParent.permission, userstate)) {
                renderLeaf = firstChildinParent;
            }
            else if (!firstChildinParent.permission) {
                renderLeaf = firstChildinParent;
            }
        }
        //console.log("renderLeaf", renderLeaf)
        if (renderLeaf) {
            renderAppContent(renderLeaf, openApp)
        }
    }

    const firstChildInParent = (elements) => {
        for (var i = 0; i < elements.length; i++) {
            if (elements[i].type === "LEAF") {
                return elements[i]
            } else {
                return firstChildInParent(elements[i].children)
            }
        }
    }


    const setRenderContentFunc = (content) => {
        //Con esto evitamos el cambio de menú desde otros componentes si ha cambios para guardar
        if (window.preventUnmountComponents) {
            window.preventUnmountComponentFunction()
            return
        }
        setSelectedAppMenu(null)
        setApp(null)
        setSelectedSiderMenu(content);

        if (content == "innit") {
            startInnit(defaultAppId, i18next.language, content)
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

    const createApplicationsArray = (applications) => {
        let out = []

        applications.forEach((app, index) => {
            const IconSvg = () => (
                <svg
                    width="2.0em"
                    height="2.0em">
                    <g>
                        <image
                            width="100%"
                            height="100%"
                            x="0"
                            y="0"
                            preserveAspectRatio="none"
                            href={app.thumbnail}
                        />
                    </g>
                </svg>
            );
            out.push({
                key: app.idUntApp + "",
                label: <Tooltip title={app.appName} placement='topLeft'><span className="reader">{app.appName}</span></Tooltip>,
                icon: <Icon component={IconSvg} style={{ marginRight: "3px" }} />,
                style: { "border": "1px solid " + borderColorSideMenuOptions, marginTop: "15px", paddingLeft: "15px" },
                onClick: () => {
                    openApplication(app)
                }
            })

        });
        return out
    }

    const getSiderItems = (applications) => {
        let numApps = applications.length

        let out = []

        if (numApps > numberShownApps) {
            const nameDefaultApp = applications.find((app) => app.idUntApp == defaultAppId)?.appName
            out.push(
                {
                    key: 'innit',
                    icon: <Icon component={layer_map} style={{ marginRight: "3px" }} />,
                    label: <div className="reader">{nameDefaultApp}</div>,
                    style: { "border": "1px solid " + borderColorSideMenuOptions },
                    onClick: (e) => {
                        setFavouriteAppsSelect(false)
                        setRenderContentFunc("innit");
                        setChosenContent("innit")
                    }
                }
            )

            out.push({
                key: 'applications',
                icon: <AppstoreOutlined style={{ marginRight: "3px" }} />,
                label: <div className="reader">{i18next.t('urbegis.pages.applications.name')}</div>,
                style: { "border": "1px solid " + borderColorSideMenuOptions },
                onClick: (e) => {
                    setFavouriteAppsSelect(false)
                    setRenderContentFunc("applications");
                    setChosenContent("applications")
                }
            })
        } else {

            out.push({
                key: 'applications',
                icon: <AppstoreOutlined style={{ marginRight: "3px" }} />,
                label: <div className="reader">{i18next.t('urbegis.pages.applications.name')}</div>,
                children: createApplicationsArray(applications),
            })
        }

        if (IsManager(userstate)) {

            out.push({
                key: 'manager',
                icon: <SettingOutlined />,
                label: <div className="reader">{i18next.t('urbegis.pages.manager.name')}</div>,
                style: { "border": "1px solid " + borderColorSideMenuOptions },
                onClick: (e) => {
                    setFavouriteAppsSelect(false)
                    setRenderContentFunc("manager");
                    setChosenContent("manager")
                }
            })

        }

        if (IsAdmin(userstate)) {
            out.push({
                key: 'admin',
                icon: <ToolOutlined />,
                label: <div className="reader">{i18next.t('urbegis.pages.admin.name')}</div>,
                style: { "border": "1px solid " + borderColorSideMenuOptions },
                onClick: (e) => {
                    setFavouriteAppsSelect(false)
                    setRenderContentFunc("admin");
                    setChosenContent("admin")
                }
            })

            out.push({
                key: 'params',
                icon: <ControlOutlined />,
                label: <div className="reader">{i18next.t('urbegis.pages.parameterization.name')}</div>,
                style: { "border": "1px solid " + borderColorSideMenuOptions },
                onClick: (e) => {
                    setFavouriteAppsSelect(false)
                    setRenderContentFunc("params");
                    setChosenContent("params")
                }
            })
        }
        //console.log("out2", out)
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
            <Layout style={{ height: "100vh" }}>
                <Header
                    style={{
                        padding: 0,
                        background: backgroundColorHeader,
                        alignItems: "flex-start",
                    }}>
                    <Row style={{ width: "100%", paddingRight: "20px", height: "auto" }}>
                        <Col span={3}>
                            <div style={{textAlign:"center"}}>
                            <img src={logo} alt="" className="demo-logo-vertical" />
                            </div>
                        </Col>
                        <Col span={1}>
                            <Button
                                type="text"
                                icon={collapsed ? <MenuUnfoldOutlined /> : <MenuFoldOutlined />}
                                onClick={() => { setCollapsed(!collapsed) }}
                                style={{
                                    fontSize: '16px',
                                    width: 64,
                                    height: 64,
                                }}
                            />
                        </Col>
                        <Col span={16}>
                            <>
                                {/*MENÚ DINÁMICO QUE SE CARGA CUANDO SELECCIONAMOS UNA APLICACIÓN*/}
                                {app && <AppMenu app={app} renderAppContent={renderAppContent}
                                    selectedAppMenu={selectedAppMenu} setSelectedAppMenu={setRenderContentFunc}
                                    letterColorHeadMenu={letterColorHeadMenu} letterSizeHeadMenu={letterSizeHeadMenu}
                                    letterTypeHeadMenu={letterTypeHeadMenu} setContentViewType={setContentViewType}></AppMenu>}
                            </>
                        </Col>
                        <Col span={4} /*style={{overflow:"auto"}}*/>
                            <Row justify="end" gutter={[16]} /*style={{overflow:"auto", whiteSpace:"nowrap"}}*/>
                                <Col flex="auto" style={{ overflow: "auto", whiteSpace: "nowrap", textAlign: "end", marginTop: "20px" }}>
                                    {
                                        <div style={{ color: letterColorHeadMenu, fontFamily: letterTypeHeadMenu, fontSize: letterSizeHeadMenu + "px", overflow: "auto", lineHeight: "normal" }}>
                                            {userstate.username}
                                        </div>
                                    }
                                </Col>
                                <Col xl={{ span: 3 }} lg={{ span: 5 }} md={{ span: 10 }} sm={{ span: 10 }} xs={{ span: 10 }} style={{ paddingLeft: "0px" }}>
                                    <LoggedStatus setRenderContentFunc={setRenderContentFunc} setMensajeLoggeo={setMensajeLoggeo}></LoggedStatus>
                                </Col>
                                <Col xl={{ span: 7 }} lg={{ span: 7 }} md={{ span: 10 }} sm={{ span: 10 }} xs={{ span: 10 }} >
                                    <LanguajeSelector handleChangeLanguage={handleChangeLanguage} setRenderContentFunc={setRenderContentFunc} chosenContent={chosenContent}></LanguajeSelector>
                                </Col>
                            </Row>
                        </Col>
                    </Row>

                </Header>

                <Layout>
                    <Sider trigger={null} collapsible onCollapse={() => console.log("cierra")} collapsed={collapsed} width={"fit-content"} style={{ background: backgroundColorContent }}>

                        <ConfigProvider
                            theme={{
                                components: {
                                    Menu: {
                                        fontFamily: letterTypeSideMenu,
                                        fontSize: letterSizeSideMenu + "px",
                                        itemColor: letterColorSideMenu,
                                        itemHoverColor: letterColorSideMenu,
                                        colorBgTextHover: hoverBgColorSideMenu,
                                        controlItemBgActive: activeBgColorSideMenu,
                                        itemSelectedColor: letterColorSideMenu
                                    },
                                },
                            }}
                        >
                            {numberPublicApps.length > 0 && <Menu
                                style={{ background: backgroundColorContent, marginTop: "5px" }}
                                mode="inline"
                                selectedKeys={[selectedSiderMenu]}
                                items={numberPublicApps}
                                defaultOpenKeys={['applications']}
                            >
                            </Menu>}
                        </ConfigProvider>
                    </Sider>
                    <Suspense fallback={<LoadingComponent></LoadingComponent>}>
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
                    </Suspense>

                </Layout>

                <div >
                    <FloatButton.Group
                        key={"right"}
                        open={showFloatButtons}
                        trigger="click"
                        placement={"right"}
                        onClick={(e) => {
                            setShowFloatButtons(!showFloatButtons)
                            setBlicker(false)
                        }}
                        style={{ position: "fixed", right: window.innerWidth - 70, zIndex: 900 }}
                        icon={<UpOutlined key="right" />}
                    >
                        {!app && chosenContent == "applications" &&
                            <Tooltip title={i18next.t('common.actions.favourites')} placement='right'>
                                <FloatButton type="primary"
                                    icon={<HeartFilled />}
                                    style={{ zIndex: 900 }}
                                    onClick={(e) => {
                                        if (state_favoriteApps.length > 0) setFavouriteAppsSelect(!favouriteAppsSelect);
                                    }}
                                />
                            </Tooltip>}
                        <Tooltip title={i18next.t('common.actions.reader.listen')} placement='right'>
                            <FloatButton
                                shape="circle"
                                type="primary"
                                icon={<SoundOutlined style={{ color: 'black' }} />}
                                onClick={() => {
                                    lecturaContenido("reader")
                                }}
                            />
                        </Tooltip>

                        {soundActivated && <Tooltip title={i18next.t('common.actions.reader.end')} placement='right'>
                            <FloatButton
                                shape="circle"
                                type="primary"
                                icon={<IconNoSound />}
                                onClick={() => {
                                    setSoundActivated(false)
                                    CancelAudio("reader")
                                }}
                            />
                        </Tooltip>}
                    </FloatButton.Group>

                </div>
            </Layout>
            {showOrientation && <MessageOrientation showOrientation={showOrientation} setShowOrientation={setShowOrientation} contentViewType={contentViewType}></MessageOrientation>}
        </>

    );
}

export default UrbegisApp;

