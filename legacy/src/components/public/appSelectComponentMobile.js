import { useEffect, useRef, useState } from "react";
import { Card, Form } from "antd-mobile";
import i18next from "i18next";
import { Col, Row, Spin, Select, theme } from "antd";
import { useSelector, useDispatch } from "react-redux";
import Search from "antd/es/transfer/search";
import { HeartOutlined, HeartFilled } from "@ant-design/icons";
import { AppService } from "../../service/appService";
import Meta from "antd/es/card/Meta";
import { UnitService } from "../../service/unitService";
import { generalParams_state } from "../../features/generalParams/generalParamsSlice";
import { getBackgroundColorPrimary, getBackgroundColorSecundary } from "../../utilities/paramsUtils";
import { favoriteApps_state, addFavorite } from "../../features/favoriteApps/favoriteAppsSlice";
import { user_state } from "../../features/user/userSlice";

const AppSelectComponentMobile = ({ renderApp, languaje, favouriteAppsSelect }) => {

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

    const loadData = () => {

        setData([]);
        if (filterByUnit && filterByUnit != "") {
            AppService.LISTBYUSER(filterByUnit)
                .then((resp) => {
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
                //let options = [{ value: null, label: "" }]
                let options = []
                resp.map((item, index) => {
                    options.push({ value: item.idUnt, label: item.unitName })
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
        })*/
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
            return <Card key={"renderAppCard" + index}
                style={{ width: "60%", "display": "inline-block", textAlign: "center", margin: "5px" }}
                headerStyle={{ "width": "100%", "display": "inline-block" }}
                bordered={true}
                extra={
                    userstate.token && <a
                        onClick={
                            (event) => {
                                let appCopy = { ...app }
                                dispatch(addFavorite(appCopy))
                                event.stopPropagation();
                            }}
                    >{fav.map((fav) => fav.idUntApp).includes(app.idUntApp) ? <HeartFilled /> : <HeartOutlined />}
                    </a>
                }
                title={<>
                    <div style={{ width: "100%" }}>
                        <Row type="flex" align="middle" style={{ width: "100%" }}>
                            <Col style={{ width: "100%" }}>
                                <div style={{
                                    display: 'inline-flex',
                                    justifyContent: 'center',
                                    alignItems: 'center', overflow: "hidden", width: "100%", height: "80px"
                                }}>
                                    {app.thumbnail && <img
                                        alt={app.appName}
                                        style={{ height: "100%" }}
                                        src={app.thumbnail}
                                    />}
                                    {!app.thumbnail && <img
                                        alt={i18next.t("common.msg.image.title")}
                                        style={{ height: "100%" }}
                                        src={"data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAMIAAADDCAYAAADQvc6UAAABRWlDQ1BJQ0MgUHJvZmlsZQAAKJFjYGASSSwoyGFhYGDIzSspCnJ3UoiIjFJgf8LAwSDCIMogwMCcmFxc4BgQ4ANUwgCjUcG3awyMIPqyLsis7PPOq3QdDFcvjV3jOD1boQVTPQrgSkktTgbSf4A4LbmgqISBgTEFyFYuLykAsTuAbJEioKOA7DkgdjqEvQHEToKwj4DVhAQ5A9k3gGyB5IxEoBmML4BsnSQk8XQkNtReEOBxcfXxUQg1Mjc0dyHgXNJBSWpFCYh2zi+oLMpMzyhRcASGUqqCZ16yno6CkYGRAQMDKMwhqj/fAIcloxgHQqxAjIHBEugw5sUIsSQpBobtQPdLciLEVJYzMPBHMDBsayhILEqEO4DxG0txmrERhM29nYGBddr//5/DGRjYNRkY/l7////39v///y4Dmn+LgeHANwDrkl1AuO+pmgAAADhlWElmTU0AKgAAAAgAAYdpAAQAAAABAAAAGgAAAAAAAqACAAQAAAABAAAAwqADAAQAAAABAAAAwwAAAAD9b/HnAAAHlklEQVR4Ae3dP3PTWBSGcbGzM6GCKqlIBRV0dHRJFarQ0eUT8LH4BnRU0NHR0UEFVdIlFRV7TzRksomPY8uykTk/zewQfKw/9znv4yvJynLv4uLiV2dBoDiBf4qP3/ARuCRABEFAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghggQAQZQKAnYEaQBAQaASKIAQJEkAEEegJmBElAoBEgghgg0Aj8i0JO4OzsrPv69Wv+hi2qPHr0qNvf39+iI97soRIh4f3z58/u7du3SXX7Xt7Z2enevHmzfQe+oSN2apSAPj09TSrb+XKI/f379+08+A0cNRE2ANkupk+ACNPvkSPcAAEibACyXUyfABGm3yNHuAECRNgAZLuYPgEirKlHu7u7XdyytGwHAd8jjNyng4OD7vnz51dbPT8/7z58+NB9+/bt6jU/TI+AGWHEnrx48eJ/EsSmHzx40L18+fLyzxF3ZVMjEyDCiEDjMYZZS5wiPXnyZFbJaxMhQIQRGzHvWR7XCyOCXsOmiDAi1HmPMMQjDpbpEiDCiL358eNHurW/5SnWdIBbXiDCiA38/Pnzrce2YyZ4//59F3ePLNMl4PbpiL2J0L979+7yDtHDhw8vtzzvdGnEXdvUigSIsCLAWavHp/+qM0BcXMd/q25n1vF57TYBp0a3mUzilePj4+7k5KSLb6gt6ydAhPUzXnoPR0dHl79WGTNCfBnn1uvSCJdegQhLI1vvCk+fPu2ePXt2tZOYEV6/fn31dz+shwAR1sP1cqvLntbEN9MxA9xcYjsxS1jWR4AIa2Ibzx0tc44fYX/16lV6NDFLXH+YL32jwiACRBiEbf5KcXoTIsQSpzXx4N28Ja4BQoK7rgXiydbHjx/P25TaQAJEGAguWy0+2Q8PD6/Ki4R8EVl+bzBOnZY95fq9rj9zAkTI2SxdidBHqG9+skdw43borCXO/ZcJdraPWdv22uIEiLA4q7nvvCug8WTqzQveOH26fodo7g6uFe/a17W3+nFBAkRYENRdb1vkkz1CH9cPsVy/jrhr27PqMYvENYNlHAIesRiBYwRy0V+8iXP8+/fvX11Mr7L7ECueb/r48eMqm7FuI2BGWDEG8cm+7G3NEOfmdcTQw4h9/55lhm7DekRYKQPZF2ArbXTAyu4kDYB2YxUzwg0gi/41ztHnfQG26HbGel/crVrm7tNY+/1btkOEAZ2M05r4FB7r9GbAIdxaZYrHdOsgJ/wCEQY0J74TmOKnbxxT9n3FgGGWWsVdowHtjt9Nnvf7yQM2aZU/TIAIAxrw6dOnAWtZZcoEnBpNuTuObWMEiLAx1HY0ZQJEmHJ3HNvGCBBhY6jtaMoEiJB0Z29vL6ls58vxPcO8/zfrdo5qvKO+d3Fx8Wu8zf1dW4p/cPzLly/dtv9Ts/EbcvGAHhHyfBIhZ6NSiIBTo0LNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiECRCjUbEPNCRAhZ6NSiAARCjXbUHMCRMjZqBQiQIRCzTbUnAARcjYqhQgQoVCzDTUnQIScjUohAkQo1GxDzQkQIWejUogAEQo121BzAkTI2agUIkCEQs021JwAEXI2KoUIEKFQsw01J0CEnI1KIQJEKNRsQ80JECFno1KIABEKNdtQcwJEyNmoFCJAhELNNtScABFyNiqFCBChULMNNSdAhJyNSiEC/wGgKKC4YMA4TAAAAABJRU5ErkJggg=="}
                                    />}
                                </div>
                                <small className="reader">{app.appName}</small>
                            </Col>
                        </Row>
                    </div>
                </>}
                onClick={(e) => openApplication(app)}
                hoverable
                cover={""}>
                <Meta title={""} description={<><medium className="reader">{app.idUnt.unitName}</medium> <br /> <small className="reader">{app.description}</small></>} />
            </Card>

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

    useEffect(() => {
        if (favouriteAppsSelect && fav.length > 0) {
            let copyFav = [...fav]
            setData(copyFav)
        } else {
            loadUnits();
        }
    }, [favouriteAppsSelect]);

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
            loadData();
        }
    }, [filterByUnit, languaje, favouriteAppsSelect]);

    return (<>
        {/*<Select
            mode="multiple"
            allowClear
            style={{ width: "100%" }}
            showSearch
            placeholder={i18next.t('manager.unit.selectMultiple')}
            onChange={(e) => { setFilterByUnit(e); setCargando(true) }}
            filterOption={filterOption}
            options={units}
        />*/}
        {/*<Search
            placeholder={i18next.t('manager.app.name')}
            allowClear
            onSearch={(e) => { }}
            onChange={(e) => {
                setFilterByName(e.target.value);
            }}
            style={{
                width: "100%",
            }}
        />*/}
        <div style={{width: "100%", backgroundColor: backgroundColorHeader, padding:"15px", textAlign:"center",
            color: "#000000", fontFamily: "sans-serif", fontSize: "15px"
        }}>
            <span className="reader">{i18next.t("urbegis.pages.applications.name")}</span>
        </div>

        {cargando && <Spin className="ant-spin-centered"></Spin>}
        {(data && !cargando) && <div style={{ textAlign: "center", width: "100%" }}>
            {cargando && <Spin className="ant-spin-centered"></Spin>}
            {data && data.map((app, index) => {
                return renderAppCard(app, index)
            })}
            {(data?.length == 0 && !cargando) && i18next.t("common.msg.results.noResults")}
        </div>}
    </>)


}

export default AppSelectComponentMobile;