import { useEffect, useRef, useState } from "react";
import { theme, Card, Col, Form, Row, Select, Spin, Tooltip } from "antd";
import Icon from "@ant-design/icons/lib/components/Icon";
import { HeartOutlined, HeartFilled } from "@ant-design/icons";
import i18next from "i18next";
import { useDispatch, useSelector } from "react-redux";
import Search from "antd/es/transfer/search";

import { generalParams_state } from "../../features/generalParams/generalParamsSlice";
import { AppService } from "../../service/appService";
import Meta from "antd/es/card/Meta";
import { UnitService } from "../../service/unitService";
import { getBackgroundColorPrimary, getBackgroundColorSecundary } from "../../utilities/paramsUtils";
import { addFavorite, favoriteApps_state } from "../../features/favoriteApps/favoriteAppsSlice";
import { user_state } from "../../features/user/userSlice";

const AppSelectComponent = ({ renderApp, languaje, favouriteAppsSelect }) => {

    const state_params = useSelector(generalParams_state)
    const state_favoriteApps = useSelector(favoriteApps_state);
    const userstate = useSelector(user_state)

    const dispatch = useDispatch();

    const [data, setData] = useState();
    const [units, setUnits] = useState();
    const [cargando, setCargando] = useState(false);

    const [filterByUnit, setFilterByUnit] = useState();
    const [filterByName, setFilterByName] = useState();

    const [fav, setFav] = useState([])

    const {
        token: { colorBgContainer },
    } = theme.useToken();

    const [backgroundColorHeader, setBackgroundColorHeader] = useState(colorBgContainer)
    const [backgroundColorContent, setBackgroundColorContent] = useState(colorBgContainer)


    const loadApps = () => {
        setData([]);
        if (filterByUnit && filterByUnit != "") {
            AppService.LISTBYUSER(filterByUnit)
                .then((resp) => {
                    //console.log("1")
                    setCargando(true)
                    resp.map((item, index) => {
                        item.index = index;
                    })
                    setData(resp)
                    return "done"
                })
                .then((resp) => {
                    if (resp == "done") {
                        setCargando(false)
                    }
                })
                .catch((error) => console.log(error))
        }
        else {
            setCargando(true)
            AppService.LIST()
                .then((resp) => {
                    //console.log("2")
                    resp.map((item, index) => {
                        item.index = index;
                    })
                    setData(resp)
                    return "done"
                })
                .then((resp) => {
                    if (resp == "done") {
                        setCargando(false)
                    }
                })
                .catch((error) => console.log(error))
        }

    }

    const loadUnits = () => {
        setUnits([]);
        UnitService.LIST()
            .then((resp) => {
                //console.log("3")
                //let options = [{ value: null, label: "" }]
                let options = []
                resp.map((item, index) => {
                    //if (item.unitName != "Información general") {
                        options.push({ value: item.idUnt, label: item.unitName })
                    //}
                })
                setUnits(options)
            })
            .catch((error) => console.log(error))
        /*
        UnitUserService.LISTUSERUNITS().then((resp) => {
            let options = [{ value: null, label: "" }]
            resp.map((item, index) => {
                options.push({ value: item.idUnt, label: item.unitName })
            })
            setUnits(options)
        })
        */
    }

    const openApplication = (app) => {
        //console.log("app", app)
        let appCopy = { ...app }
        renderApp(appCopy)
    }

    const isVisible = (app) => {
        let visible = true;
        if (filterByName) {
            visible = app.appName.toLowerCase().includes(filterByName.toLowerCase())
        }

        return visible
    }

    const renderAppCard = (app, index) => {
        if (isVisible(app)) {
            return <Col key={"renderAppCard" + index}
                className="gutter-row" span={6}>
                <Card
                    title={
                    <Tooltip title={app.appName} mouseLeaveDelay={0}>
                        <small className="reader" style={{color:"#00000", fontFamily:"sans-serif"}}>
                            {app.appName}
                            </small>
                            </Tooltip>}
                    extra={/*userstate.token &&*/ <a
                        onClick={
                            (event) => {
                                let appCopy = { ...app }
                                dispatch(addFavorite(appCopy))
                                event.stopPropagation();
                            }}
                    >{fav.map((fav) => fav.idUntApp).includes(app.idUntApp) ? <HeartFilled /> : <HeartOutlined />}
                    </a>}
                    onClick={(e) => openApplication(app)}
                    hoverable
                    style={{ width: "80%", textAlign: "center", margin: "5px" }}
                    cover={<div style={{ overflow: "hidden", height: "150px" }}>
                        {app.thumbnail && <Icon component={() => (<svg
                            width={"200px"}
                            height={"200px"}>
                            <g>
                                <image
                                    width={"210px"}
                                    height={"145px"}
                                    x="0"
                                    y="4"
                                    preserveAspectRatio="none"
                                    href={app.thumbnail}
                                />
                            </g>
                        </svg>)} />}
                        {!app.thumbnail && <img
                            style={{ height: "100%" }}
                            src={"data:image/png;base64,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"}
                            alt=""
                        />}
                    </div>}>
                    <Meta title={""}
                        description={<>
                            <span className="reader" style={{color:"#00000", fontFamily:"sans-serif"}}>
                                {app.idUnt.unitName}
                            </span>
                            <br />
                            <small className="reader" style={{color:"#00000", fontFamily:"sans-serif"}}>
                                {app.description}
                            </small></>
                        } />
                </Card>
            </Col>
        }
        else {
            return <></>
        }
    }

    const filterOption = (input, option) =>
        (option?.label ?? '').toLowerCase().includes(input.toLowerCase());

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

        } else {
            setBackgroundColorHeader(colorBgContainer)
            setBackgroundColorContent(colorBgContainer)
        }

    }, [state_params])

    /**
     * Este useEffect registra el estado de las aplicaciones favoritas cuando se añaden o se eliminan.
     */
    useEffect(() => {
        setFav(state_favoriteApps)
    }, [state_favoriteApps])


    /*useEffect(() => {
        if (favouriteAppsSelect && fav.length > 0) {
            let copyFav = [...fav]
            setData(copyFav)
        } else {
            loadUnits();
        }
    }, [favouriteAppsSelect]);*/


    useEffect(() => {
        if (favouriteAppsSelect && fav.length > 0) {
            let copyFav = [...fav]
            let copy2 = []
            if (filterByUnit?.length > 0) {
                copy2 = copyFav.filter((fav) => filterByUnit.includes(fav.idUnt.idUnt))

            } else {
                copy2 = copyFav
            }
            setCargando(false)
            setData(copy2)
        } else {
            loadApps();
        }
    }, [filterByUnit, languaje, favouriteAppsSelect]);


    return (<>
        <Row style={{
            position: "sticky",
            zIndex: 20,
            top: 0,
        }}
        >
            {/*<Col span={11} style={{
                background: backgroundColorHeader,
                borderRadius: "20px",
                padding: "10px",
                boxShadow: "0 4px 8px rgba(0, 0, 0, 0.1), 0 6px 20px rgba(0, 0, 0, 0.15)",
                border: "1px solid rgba(255, 255, 255, 0.1)",
                transition: "transform 0.2s ease-in-out",
                transform: "translateZ(0)",
                position: "relative",
                overflow: "hidden",
            }}>
                {/*units && units.length > 1 &&*/
                    /*<Form layout="vertical">
                        <Form.Item label={<div className="reader" style={{ color: "#00000", fontFamily: "sans-serif", fontSize: "15px" }}>{i18next.t('manager.unit.filter')}</div>} >
                            <Select
                                mode="multiple"
                                allowClear
                                style={{ width: "100%", marginRight: "5px" }}
                                showSearch
                                placeholder={i18next.t('manager.unit.selectMultiple')}
                                onChange={(e) => { setFilterByUnit(e); setCargando(true) }}
                                filterOption={filterOption}
                                options={units}
                            />
                        </Form.Item>
                    </Form>
                }
                </Col>*/}
            {/*<Col span={1}></Col>*/}
            {/*<Col span={11}>
                <Form layout="vertical">
                    <Form.Item label={i18next.t('manager.app.filterByName')} >
                        <Search
                            placeholder={i18next.t('manager.app.name')}
                            allowClear
                            onSearch={(e) => { }}
                            onChange={(e) => {
                                setFilterByName(e.target.value);
                            }}
                            style={{
                                width: "100%",
                            }}
                        />
                    </Form.Item>
                </Form>
                        </Col>*/}
        </Row>

        {cargando && <Spin className="ant-spin-centered"></Spin>}

        {(data && !cargando) &&
            <Card
                size="small"
                bordered={false}
                style={{ background: colorBgContainer }}>
                {cargando && <Spin className="ant-spin-centered"></Spin>}
                <Row gutter={16} style={{ paddingBottom: "20px" }}>
                    {data && data.map((app, index) => {
                        return renderAppCard(app, index)
                    })}
                </Row>
                {(data?.length == 0 && !cargando) && <div className="reader">{i18next.t("common.msg.results.noData")}</div>}
            </Card>}


    </>)


}

export default AppSelectComponent;