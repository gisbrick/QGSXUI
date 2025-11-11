import './App.css';
import React from 'react';
import { useEffect, useState } from "react";
import { Button, ConfigProvider, Layout, Select, notification, } from 'antd';
import locale_es from 'antd/locale/es_ES';
import locale_en from 'antd/locale/en_GB';
import { setLanguage } from "./features/language/languageSlice";
import { useDispatch, useSelector } from 'react-redux';
import i18n from "i18next";
import translationEN from "./language/en/common.json"
import translationES from "./language/es/common.json"
import UrbegisApp from './apps/urbegis';
import { BrowserView, MobileView } from 'react-device-detect';
import UrbegisAppMobile from './apps/urbegisMobile';
import { GeneralParamsService } from './service/generalParamsService';
import { registrarParams } from './features/generalParams/generalParamsSlice';
import { getActiveBgColorSideMenu, getBorderColorSideMenuOptions, getDefaultAppId, getHoverBgColorSideMenu, getIdiomas, getNumberShownApps } from './utilities/paramsUtils';
import { generalParams_state } from './features/generalParams/generalParamsSlice';
import MessageInfo from './components/public/messageInfo';
import MessageWelcome from './components/public/messageWelcome';
import MessageOrientation from './components/public/messageOrientation';

const { Header, Footer, Sider, Content } = Layout;

function App() {

    const dispatch = useDispatch();

    const state_params = useSelector(generalParams_state)
    const [antdLocale, setAntdLocale] = useState();
    const [api, contextHolder] = notification.useNotification();
    const [isLoading, setLoading] = useState(true)
    const [resources, setResources] = useState();
    const [languages, setLanguages] = useState();
    const [borderColorSideMenuOptions, setBorderColorSideMenuOptions] = useState("#1677ff")
    const [defaultAppId, setDefaultAppId] = useState(0)
    const [activeBgColorSideMenu, setActiveBgColorSideMenu] = useState();
    const [hoverBgColorSideMenu, setHoverBgColorSideMenu] = useState();
    const [numberShownApps, setNumberShownApps] = useState(5)

    window.api = api

    //Traducimos el tour, ya que no pilla bien la traducción del fichero
    //TODO valorar si llevarlo a los JSON de configuración de traducciones o dejarlo aquí
    locale_es.Tour = { Next: "Siguiente", Previous: "Anterior", Finish: "Finalizar" }
    locale_en.Tour = { Next: "Next", Previous: "Previous", Finish: "Finish" }

    const handleChangeLanguage = (value) => {
        i18n
            /*.use(detector)*///TODO revisar. No funciona el detector
            /*.use(reactI18nextModule)*/ // passes i18n down to react-i18next
            .init({
                resources,
                fallbackLng: value, // use en if detected lng is not available
                keySeparator: "."
            });

        dispatch(setLanguage(value))
        i18n.changeLanguage(value);

        if (value == "en") {
            setAntdLocale(locale_en);
        }
        else if (value == "es") {
            setAntdLocale(locale_es);
        }
        else {
            setAntdLocale(locale_es);
        }
    };

    const addResources = (languages) => {
        const resources = {};
        languages.forEach(language => {
            //español
            if (language.language == "es") {
                resources[language.language] = {
                    translation: translationES
                }
                //inglés
            } else if (language.language == "en") {
                resources[language.language] = {
                    translation: translationEN
                }
            } else {
                console.log("añadir nuevo language")
            }
            //catalan
            //vasco
            //gallego
            //valenciano
            //balear
        });
        return resources
    }

    useEffect(() => {
        GeneralParamsService.LIST()
            .then((data) => {
                //console.log(data)
                dispatch(registrarParams(data))
                setLoading(false);
            }
            )
            .catch((error) => console.log(error))
    }, [])

    useEffect(() => {
        if (resources) {
            //console.log(resources)
            let defaultLanguage = languages.find((language) => language.type == "default").language
            //console.log(defaultLanguage)
            i18n
                //.use(detector)//TODO revisar. No funciona el detector
                //.use(reactI18nextModule) // passes i18n down to react-i18next
                .init({
                    resources,
                    fallbackLng: defaultLanguage, // use en if detected lng is not available
                    keySeparator: "."
                });
            handleChangeLanguage(defaultLanguage)
        }

    }, [resources])

    useEffect(() => {
        if (state_params.length > 0) {
            let { languages } = getIdiomas(state_params)
            setLanguages(languages)
            let resources = addResources(languages)
            setResources(resources)

            let borderColorSideMenuOptionsAux = getBorderColorSideMenuOptions(state_params);

            if (borderColorSideMenuOptionsAux) {
                setBorderColorSideMenuOptions(borderColorSideMenuOptionsAux)
            }

            let defaulAppIdAux = getDefaultAppId(state_params);

            if(defaulAppIdAux) {
                setDefaultAppId(defaulAppIdAux);
            }

            let activeBgColorSideMenuAux = getActiveBgColorSideMenu(state_params)

            if(activeBgColorSideMenuAux) {
                setActiveBgColorSideMenu(activeBgColorSideMenuAux)
            }

            let hoverBgColorSideMenuAux = getHoverBgColorSideMenu(state_params)

            if(hoverBgColorSideMenuAux) {
                setHoverBgColorSideMenu(hoverBgColorSideMenuAux)
            }

            let numberShownAppsAux = getNumberShownApps(state_params)

            if(numberShownAppsAux) {
                setNumberShownApps(numberShownAppsAux)
            }
        }

    }, [state_params])

    if (isLoading) {
        return <div className="App">Loading...</div>;
    }
    return (
        <>
            {contextHolder}
            <div>

                <ConfigProvider locale={antdLocale} >
                    <BrowserView>
                        {<UrbegisApp handleChangeLanguage={handleChangeLanguage} borderColorSideMenuOptions={borderColorSideMenuOptions} defaultAppId={defaultAppId} activeBgColorSideMenu={activeBgColorSideMenu} hoverBgColorSideMenu={hoverBgColorSideMenu} numberShownApps={numberShownApps}></UrbegisApp>}
                    </BrowserView>
                    <MobileView>
                        {<UrbegisAppMobile handleChangeLanguage={handleChangeLanguage} defaultAppId={defaultAppId}></UrbegisAppMobile>}
                    </MobileView>
                    {/*<DemoApp></DemoApp>*/}
                </ConfigProvider>

                {
                    state_params && <>
                        <MessageInfo></MessageInfo>
                        <MessageWelcome></MessageWelcome>
                    </>
                }
            </div>
        </>
    );



}

export default App;
