import { useEffect, useState } from "react";
import { Col, ConfigProvider, Menu, Row, Typography, theme } from "antd";
import { useSelector } from "react-redux";
import { BrowserView, MobileView } from "react-device-detect";

import { generalParams_state } from "../../features/generalParams/generalParamsSlice";
import { HasAccessToUnitPermission } from "../../utilities/SecurityUtil";
import { user_state } from "../../features/user/userSlice";
import { getBackgroundColorPrimary } from "../../utilities/paramsUtils";


const { Text } = Typography;

const AppMenu = ({ app, renderAppContent, selectedAppMenu, letterColorHeadMenu,letterSizeHeadMenu, letterTypeHeadMenu, setContentViewType }) => {

    const state_params = useSelector(generalParams_state)
    const userstate = useSelector(user_state);

    const [currentApp, setCurrentApp] = useState();
    const [backgroundColorMenu, setBackgroundColorMenu] = useState("")

    const {
        token: { colorBgContainer },
    } = theme.useToken();

    let hasPermissionToApp = true;
    if (currentApp && app.prmName) {
        hasPermissionToApp = HasAccessToUnitPermission(currentApp.idUnt.unitName, app.prmName, userstate)
    }

    const obtainContentViewType = (app) => {
        let contentType = []
        if(app) {
            app.content.forEach(element => {
                contentType.push(element.contentType)
            });
        }
        return contentType
    }

    const goToFirstLeaf = (app) => {
        let firstLeaf = null
        for (let i in app.config) {
            /*
            if (!firstLeaf && app.config[i].type == "LEAF") {
                firstLeaf = app.config[i];
            }*/
            if (!firstLeaf && app.config[i].type == "LEAF" ) {
                if(app.config[i].permission && HasAccessToUnitPermission(app.idUnt.unitName, app.config[i].permission, userstate)){
                    firstLeaf = app.config[i];
                }
                else if(!app.config[i].permission){
                    firstLeaf = app.config[i];
                }
                
            }
        }
        if (firstLeaf) {
            let contentViewType = obtainContentViewType(firstLeaf)
            setContentViewType(contentViewType)
            renderAppContent(firstLeaf)
        }
    }


    if (currentApp && (app.idUntApp != currentApp.idUntApp)) {
        setCurrentApp(app)
        goToFirstLeaf(app);
    }

    const getItems = () => {
        let out = []
        const titles = currentApp.config.map((item) => item = item.title)
        iterateChildren(out, currentApp.config, titles)
        return out
    }

    const iterateChildren = (out, list, titles) => {
        for (let i in list) {
            let item = list[i]
            if (item.permission) {
                if (HasAccessToUnitPermission(currentApp.idUnt.unitName, item.permission, userstate)) {
                    addChildren(item, out, list, titles)
                }
            }
            else {
                addChildren(item, out, list, titles)
            }


        }
    }

    const addChildren = (item, out, list, titles) => {
        if (item.type == "LEAF") {
            let o = {
                label: titles.includes(item.title) ? <div className="reader">{item.title}</div> : item.title,
                key: item.key,
                value: item,
                type: item.type,
                onClick: () => {
                    let contentViewType = obtainContentViewType(item)
                    setContentViewType(contentViewType)
                    renderAppContent(item)
                }
            }
            out.push(o)
        }
        if (item.type == "PARENT") {
            let o = {
                label: titles.includes(item.title) ? <div className="reader">{item.title}</div> : item.title,
                key: item.key,
                value: item,
                type: item.type,
                children: []
            }
            out.push(o)
            iterateChildren(o.children, item.children, titles)
        }
    }

    useEffect(() => {

        if (state_params.length > 0) {

            let colorMenu = getBackgroundColorPrimary(state_params)

            if (colorMenu) {
                setBackgroundColorMenu(colorMenu)
            }

        } else {
            setBackgroundColorMenu(colorBgContainer)
        }

    }, [state_params])

    useEffect(() => {
        setCurrentApp(app)
        goToFirstLeaf(app);
    }, []);

    return (<>

        <BrowserView>
            {hasPermissionToApp &&
                <div style={{ display: "flex", width:"100%" }}>
                    <div style={{width:"fit-content", whiteSpace:"nowrap", marginRight:"10px"}}>
                        {currentApp &&
                            <Text 
                                className="reader"
                                type="secondary"
                                style={{
                                    fontWeight: "bold",
                                    color: letterColorHeadMenu,
                                    fontSize: letterSizeHeadMenu +"px",
                                    marginTop: "20px",
                                    fontFamily: letterTypeHeadMenu
                                }}>{currentApp.appName}</Text>}
                    </div>
                    <div style={{overflow:"auto", whiteSpace:"nowrap", width: "100%"}}>
                        {currentApp &&
                            <>
                                <ConfigProvider
                                    theme={{
                                        components: {
                                            Menu: {
                                                fontFamily: letterTypeHeadMenu,
                                                fontSize: letterSizeHeadMenu + "px",
                                                itemColor: letterColorHeadMenu,
                                                itemHoverColor: letterColorHeadMenu,
                                            }
                                        },
                                    }}
                                >
                                    <Menu selectedKeys={[selectedAppMenu]} mode="horizontal" items={getItems()}
                                    //disabledOverflow={true}
                                        style={{
                                            background: backgroundColorMenu,
                                            height: "auto",
                                            color: letterColorHeadMenu,
                                        }}
                                    />
                                </ConfigProvider>
                            </>

                        }
                    </div>

                </div>
            }
        </BrowserView>
        <MobileView>
            {hasPermissionToApp &&
                <Row>
                    <Col style={{ width: "100%", textAlign: "center" }}>
                        {currentApp && <Text type="secondary" >{currentApp.appName}</Text>}
                    </Col>
                    <Col flex={"auto"}>
                        {currentApp && <Menu selectedKeys={[selectedAppMenu]} mode="horizontal" items={getItems()} style={{ background: backgroundColorMenu }} />}
                    </Col>
                </Row>}
        </MobileView>
    </>)


}

export default AppMenu;