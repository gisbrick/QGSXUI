import i18next from "i18next";
import { useState, useEffect } from "react";
import ReactDOM from 'react-dom/client';
import { Input, Card, Button, Space, Modal, theme, Col, Row, Upload, Spin, InputNumber } from "antd";
import { SketchPicker } from 'react-color';
import { useSelector } from "react-redux";
import { PlusOutlined } from "@ant-design/icons";

import NotificationComponent from "../../../utils/NotificationComponent";
import {
    getBackgroundColorPrimary,
    getBackgroundColorSecundary,
    getIdColorPrimary,
    getIdColorSecundary,
    getIdLogo,
    getIdNombreApp,
    getLogoApp,
    getNombreApp,
    getIdLetterColorSideMenu,
    getIdLetterSizeSideMenu,
    getIdLetterTypeSideMenu,
    getLetterSizeSideMenu,
    getLetterTypeSideMenu,
    getLetterColorSideMenu,
    getIdLetterSizeForm,
    getLetterSizeForm,
    getIdLetterTypeForm,
    getLetterTypeForm,
    getIdLetterColorForm,
    getLetterColorForm,
    getIdLetterColorHeadMenu,
    getIdLetterSizeHeadMenu,
    getIdLetterTypeHeadMenu,
    getLetterColorHeadMenu,
    getLetterSizeHeadMenu,
    getLetterTypeHeadMenu,
    getLetterColorLegend,
    getIdLetterColorLegend,
    getLetterSizeLegend,
    getIdLetterSizeLegend,
    getLetterTypeLegend,
    getIdLetterTypeLegend,
    getIdBorderColorSideMenuOptions,
    getBorderColorSideMenuOptions,
    getActiveBgColorSideMenu,
    getHoverBgColorSideMenu,
    getIdActiveBgSideMenu,
    getIdHoverBgSideMenu,
    getIdManagerEmail,
    getManagerEmail,
    getIdNumberShownApps,
    getNumberShownApps
} from "../../../../utilities/paramsUtils";
import { generalParams_state } from "../../../../features/generalParams/generalParamsSlice";
import { GeneralParamsService } from "../../../../service/generalParamsService";


const StylesParamComponent = ({ colorbackground }) => {

    const state_params = useSelector(generalParams_state)

    const [toggle, setToggle] = useState(0)
    const [saving, setSaving] = useState(false)
    const [colorPrimarioElegido, setColorPrimarioElegido] = useState("")
    const [colorSecundarioElegido, setColorSecundarioElegido] = useState("")
    const [nombreApp, setNombreApp] = useState("")
    const [logo, setLogo] = useState("")

    const [letterSizeSideMenu, setLetterSizeSideMenu] = useState(14)
    const [letterColorSideMenu, setLetterColorSideMenu] = useState("#000000")
    const [letterTypeSideMenu, setLetterTypeSideMenu] = useState("Helvetica")

    const [letterSizeForm, setLetterSizeForm] = useState(14)
    const [letterTypeForm, setLetterTypeForm] = useState("Helvetica")
    const [letterColorForm, setLetterColorForm] = useState("#000000")

    const [letterSizeHeadMenu, setLetterSizeHeadMenu] = useState(14)
    const [letterColorHeadMenu, setLetterColorHeadMenu] = useState("#000000")
    const [letterTypeHeadMenu, setLetterTypeHeadMenu] = useState("Helvetica")

    const [letterSizeLegend, setLetterSizeLegend] = useState(14)
    const [letterColorLegend, setLetterColorLegend] = useState("#000000")
    const [letterTypeLegend, setLetterTypeLegend] = useState("Helvetica")


    const [previewOpen, setPreviewOpen] = useState(false);
    const [previewImage, setPreviewImage] = useState("");
    const [fileList, setFileList] = useState([]);

    const [borderColorSideMenuOptions, setBorderColorSideMenuOptions] = useState("#1677ff")
    const [activeBgColorSideMenu, setActiveBgColorSideMenu] = useState();
    const [hoverBgColorSideMenu, setHoverBgColorSideMenu] = useState();

    const [managerEmail, setManagerEmail] = useState("")
    const [numberShownApps, setNumberShownApps] = useState(5)

    /**
     * Función que cierra la ventana modal que muesta la imagend el logo
     * 
     * @returns 
     */
    const handleCancel = () => setPreviewOpen(false);

    /**
     * Función que gestiona la previsualización de la imagen cargada para el logo
     * 
     * @param {*} file 
     */
    const handlePreview = async (file) => {
        if (!file.url && !file.preview) {
            file.preview = await getBase64(file.originFileObj);
        }

        setPreviewImage(file.url || (String(file.preview)));
        setPreviewOpen(true);
    };

    /**
     * Función que añade la imagen subida a la lista de archivos.
     * También transforma la imagen a código base64 y lo añade al estado del logo.
     * 
     * @param {*} param0 
     */
    const handleChange = async ({ fileList: newFileList }) => {
        setFileList(newFileList);
        if (newFileList.length > 0) {
            let logo = await getBase64(newFileList[0].originFileObj)
            setLogo(logo)
        }

    }

    /**
     * Función que transforma la imagen a código base 64
     * 
     * @param {*} file 
     * @returns 
     */
    const getBase64 = (file) =>
        new Promise((resolve, reject) => {
            const reader = new FileReader();
            reader.readAsDataURL(file);
            reader.onload = () => resolve(String(reader.result));
            reader.onerror = (error) => reject(error);
        });

    const uploadButton = (
        <div>
            <PlusOutlined />
            <div className="reader" style={{ marginTop: 8 }}>{i18next.t("common.actions.add.name")}</div>
        </div>
    );


    const {
        token: { colorBgContainer },
    } = theme.useToken();

    /**
     * Función que recibe como parámetros los ids de los registros de la tabla de parametrización y los valores asignados en la ventana de estilos.
     * Genera un array de promesas y lo devuelve
     * 
     * @param {*} arrayIds 
     * @param {*} arrayNewValuesParams 
     * @returns 
     */
    const actualizar = (arrayIds, arrayNewValuesParams) => {
        let arrayPromesas = []
        //console.log(arrayIds)
        //console.log(arrayNewValuesParams)
        for (let index = 0; index < arrayIds.length; index++) {
            const id = arrayIds[index];
            const newValue = arrayNewValuesParams[index]
            let promesa;
            if (id) {
                let object = {
                    "value": newValue
                }
                promesa = GeneralParamsService.UPDATE(id, object)
            }
            arrayPromesas.push(promesa)
        }
        return arrayPromesas
    }

    /**
     * Función que resuelve las promesas devueltas por la función actualizar.
     * Se realiza la actualización de base de datos.
     */
    const onSave = () => {
        setSaving(true)
        //console.log(colorPrimarioElegido)
        let arrayIds = []
        let arrayNewValuesParams = []

        let idColorPrimary = getIdColorPrimary(state_params)
        let idColorSecundary = getIdColorSecundary(state_params)
        let idNombreApp = getIdNombreApp(state_params)
        let idLogo = getIdLogo(state_params)

        let idColorLetterSideMenu = getIdLetterColorSideMenu(state_params)
        let idLetterSizeSideMenu = getIdLetterSizeSideMenu(state_params)
        let idLetterTypeSideMenu = getIdLetterTypeSideMenu(state_params)

        let idLetterSizeForm = getIdLetterSizeForm(state_params)
        let idLetterTypeForm = getIdLetterTypeForm(state_params)
        let idLetterColorForm = getIdLetterColorForm(state_params)

        let idColorLetterHeadMenu = getIdLetterColorHeadMenu(state_params)
        let idLetterSizeHeadMenu = getIdLetterSizeHeadMenu(state_params)
        let idLetterTypeHeadMenu = getIdLetterTypeHeadMenu(state_params)

        let idLetterColorLegend = getIdLetterColorLegend(state_params)
        let idLetterSizeLegend = getIdLetterSizeLegend(state_params)
        let idLetterTypeLegend = getIdLetterTypeLegend(state_params)

        let idBorderColorSideMenuOptions = getIdBorderColorSideMenuOptions(state_params)
        let idActiveBgSideMenu = getIdActiveBgSideMenu(state_params)
        let idHoverBgSideMenu = getIdHoverBgSideMenu(state_params)

        let idManagerEmail = getIdManagerEmail(state_params)
        let idNumberShownApps = getIdNumberShownApps(state_params)

        arrayIds.push(...[idColorPrimary, idColorSecundary, idColorLetterSideMenu,
            idLogo, idNombreApp, idLetterSizeSideMenu, idLetterTypeSideMenu,
            idLetterSizeForm, idLetterTypeForm, idLetterColorForm, idColorLetterHeadMenu,
            idLetterSizeHeadMenu, idLetterTypeHeadMenu, idLetterColorLegend, idLetterSizeLegend,
            idLetterTypeLegend, idBorderColorSideMenuOptions, idActiveBgSideMenu,idHoverBgSideMenu,
            idManagerEmail, idNumberShownApps
        ])
        //console.log(arrayIds)

        arrayNewValuesParams.push(...[colorPrimarioElegido, colorSecundarioElegido, letterColorSideMenu,
            logo, nombreApp, letterSizeSideMenu, letterTypeSideMenu, letterSizeForm, letterTypeForm,
            letterColorForm, letterColorHeadMenu, letterSizeHeadMenu, letterTypeHeadMenu, letterColorLegend,
            letterSizeLegend, letterTypeLegend, borderColorSideMenuOptions, activeBgColorSideMenu, hoverBgColorSideMenu,
            managerEmail, numberShownApps
        ])
        //console.log(arrayNewValuesParams)
        let arrayPromesas = actualizar(arrayIds, arrayNewValuesParams)
        Promise.all(arrayPromesas)
            .then((data) => {
                setSaving(false)
                //console.log(data)
                //Informamos de que se han actualizado corréctamente los datos
                const messages = ReactDOM.createRoot(document.getElementById('messages'));
                messages.render(
                    <NotificationComponent type="success" text="update"></NotificationComponent>
                );
            })
            .catch((error) => {
                setSaving(false)
                //Informamos dde que algunos valores no son válidos   
                console.log(error)
                const messages = ReactDOM.createRoot(document.getElementById('messages'));
                messages.render(
                    <NotificationComponent type="error" text="invalidFields" description={error}></NotificationComponent>
                );
            })

    }

    /**
     * Properties para personalizar el upload
     */
    const props = {
        onRemove: (file) => {
            //console.log("elimina")
            setLogo("")
        },
        onPreview: (file) => {
            handlePreview(file)
        },
        onChange: (fileList) => {
            handleChange(fileList)
        },
        beforeUpload: (file) => {
            return false;
        },
    }


    /**
     * En el useEffect se obtienen los parametros recuperados de base de datos
     */
    useEffect(() => {
        if (state_params.length > 0) {

            let colorPrimary = getBackgroundColorPrimary(state_params)

            if (colorPrimary) {
                setColorPrimarioElegido(colorPrimary)
            }

            let colorSecondary = getBackgroundColorSecundary(state_params)

            if (colorSecondary) {

                setColorSecundarioElegido(colorSecondary)
            }

            let nombreApp = getNombreApp(state_params)

            if (nombreApp) {
                setNombreApp(nombreApp)
            }

            let logoApp = getLogoApp(state_params)

            if (nombreApp) {
                setLogo(logoApp)
            }

            let letterColorSideMenu = getLetterColorSideMenu(state_params)

            if (letterColorSideMenu) {
                setLetterColorSideMenu(letterColorSideMenu)
            }

            let letterTypeSideMenu = getLetterTypeSideMenu(state_params)

            if (letterTypeSideMenu) {
                setLetterTypeSideMenu(letterTypeSideMenu)
            }

            let letterSizeSideMenu = getLetterSizeSideMenu(state_params)

            if (letterSizeSideMenu) {
                setLetterSizeSideMenu(letterSizeSideMenu)
            }

            let letterTypeForm = getLetterTypeForm(state_params)

            if (letterTypeForm) {
                setLetterTypeForm(letterTypeForm)
            }

            let letterSizeForm = getLetterSizeForm(state_params)

            if (letterSizeForm) {
                setLetterSizeForm(letterSizeForm)
            }

            let letterColorForm = getLetterColorForm(state_params)

            if (letterColorForm) {
                setLetterColorForm(letterColorForm)
            }

            let letterColorHeadMenu = getLetterColorHeadMenu(state_params)

            if (letterColorHeadMenu) {
                setLetterColorHeadMenu(letterColorHeadMenu)
            }

            let letterTypeHeadMenu = getLetterTypeHeadMenu(state_params)

            if (letterTypeHeadMenu) {
                setLetterTypeHeadMenu(letterTypeHeadMenu)
            }

            let letterSizeHeadMenu = getLetterSizeHeadMenu(state_params)

            if (letterSizeHeadMenu) {
                setLetterSizeHeadMenu(letterSizeHeadMenu)
            }

            let letterTypeLegend = getLetterTypeLegend(state_params)

            if (letterTypeLegend) {
                setLetterTypeLegend(letterTypeLegend)
            }

            let letterSizeLegend = getLetterSizeLegend(state_params)

            if (letterSizeLegend) {
                setLetterSizeLegend(letterSizeLegend)
            }

            let letterColorLegend = getLetterColorLegend(state_params)

            if (letterColorLegend) {
                setLetterColorLegend(letterColorLegend)
            }

            let borderColorSideMenuOptions = getBorderColorSideMenuOptions(state_params)

            if (borderColorSideMenuOptions) {
                setBorderColorSideMenuOptions(borderColorSideMenuOptions)
            }

            let activeBgColorSideMenuAux = getActiveBgColorSideMenu(state_params)

            if (activeBgColorSideMenuAux) {
                setActiveBgColorSideMenu(activeBgColorSideMenuAux)
            }

            let hoverBgColorSideMenuAux = getHoverBgColorSideMenu(state_params)

            if(hoverBgColorSideMenuAux) {
                setHoverBgColorSideMenu(hoverBgColorSideMenuAux)
            }

            let managerEmailAux = getManagerEmail(state_params)

            if(managerEmailAux) {
                setManagerEmail(managerEmailAux)
            }

            let numberShownAppsAux = getNumberShownApps(state_params)
            console.log(numberShownAppsAux)
            if(numberShownAppsAux) {
                console.log(numberShownAppsAux)
                setNumberShownApps(numberShownAppsAux)
            }

            //Si no existen ciertos parametros en base de datos se fijan los valores por defecto
        } else {
            setColorPrimarioElegido(colorBgContainer)
            setColorSecundarioElegido(colorBgContainer)
        }
    }, [])

    return (
        <>
            <Row gutter={[16, 16]}>
                <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                    <Card
                        title={<div className="reader" style={{ color: "#00000", fontFamily: "sans-serif", fontSize: "" }}>{i18next.t("manager.params.name_logo.name")}</div>}
                        size="small"
                        bordered={true}
                        styles={{ header: { background: colorbackground } }}>
                        <Space direction="vertical">
                            <div>
                                <Space className="container-form">
                                    <label className="reader">{i18next.t("manager.params.election.name")}</label>
                                    <Input value={nombreApp} onChange={(e) => setNombreApp(e.target.value)}></Input>
                                </Space>
                            </div>

                            <div>
                                <Space className="container-form">
                                    <label className="reader">{i18next.t("manager.params.election.logo")}</label>
                                    <Upload {...props}
                                        listType="picture-circle"
                                        fileList={fileList}
                                    >
                                        {fileList.length >= 1 ? null : uploadButton}
                                    </Upload>
                                    <Modal open={previewOpen} footer={null} onCancel={handleCancel}>
                                        <img alt="" style={{ width: '100%' }} src={previewImage} />
                                    </Modal>
                                </Space>
                            </div>

                        </Space>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                    <Card
                        title={<div className="reader" style={{ color: "#00000", fontFamily: "sans-serif", fontSize: "" }}>{i18next.t("manager.params.election.colors")}</div>}
                        size="small"
                        bordered={true}
                        styles={{ header: { background: colorbackground } }}>

                        <Space direction="vertical">
                            <div>
                                <Space className="container-form">
                                    <label className="reader">{i18next.t("manager.params.election.colorFirst")}</label>
                                    <div style={{ width: "25px", height: "25px", background: colorPrimarioElegido }}></div>
                                    <Input value={colorPrimarioElegido} onChange={(e) => setColorPrimarioElegido(e.target.value)} />
                                    <Button onClick={() => setToggle(1)}>{toggle == 1 ? <div className="reader">{i18next.t('manager.params.palette.close')}</div> : <div className="reader">{i18next.t('manager.params.palette.open')}</div>}
                                    </Button>
                                </Space>
                                {toggle == 1 && <Modal
                                    footer={null}
                                    open={toggle}
                                    onCancel={() => setToggle(0)}
                                    width={"fit-content"}
                                    height={"auto"}
                                >
                                    <div style={{ padding: "15px" }}>
                                        <SketchPicker
                                            color={colorPrimarioElegido}
                                            disableAlpha={true}
                                            onChange={(color) => setColorPrimarioElegido(color.hex)} />
                                    </div>
                                </Modal>

                                }
                            </div>
                            <div>
                                <Space className="container-form">
                                    <label className="reader">{i18next.t("manager.params.election.colorSecond")}</label>
                                    <div style={{ width: "25px", height: "25px", background: colorSecundarioElegido }}></div>
                                    <Input value={colorSecundarioElegido} onChange={(e) => setColorSecundarioElegido(e.target.value)} />
                                    <Button onClick={() => setToggle(2)}>{toggle == 2 ? <div className="reader">{i18next.t('manager.params.palette.close')}</div> : <div className="reader">{i18next.t('manager.params.palette.open')}</div>}</Button>
                                </Space>
                                {toggle == 2 && <Modal
                                    footer={null}
                                    open={toggle}
                                    onCancel={() => setToggle(0)}
                                    width={"fit-content"}
                                    height={"auto"}
                                >
                                    <div style={{ padding: "15px" }}>
                                        <SketchPicker
                                            color={colorSecundarioElegido}
                                            disableAlpha={true}
                                            onChange={(color) => setColorSecundarioElegido(color.hex)} />
                                    </div>
                                </Modal>

                                }
                            </div>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                    <Card
                        title={<div className="reader" style={{ color: "#00000", fontFamily: "sans-serif", fontSize: "" }}>{i18next.t("manager.params.sideMenu.name")}</div>}
                        size="small"
                        bordered={true}
                        styles={{ header: { background: colorbackground } }}>

                        <Space direction="vertical">
                        <div>
                                <Space className="container-form">
                                    <label className="reader">{i18next.t("manager.params.election.bgColorHover")}</label>
                                    <div style={{ width: "25px", height: "25px", background: hoverBgColorSideMenu }}></div>
                                    <Input value={hoverBgColorSideMenu} onChange={(e) => setHoverBgColorSideMenu(e.target.value)} />
                                    <Button onClick={() => setToggle(9)}>{toggle == 9 ? <div className="reader">{i18next.t('manager.params.palette.close')}</div> : <div className="reader">{i18next.t('manager.params.palette.open')}</div>}</Button>
                                </Space>
                                {toggle == 9 && <Modal
                                    footer={null}
                                    open={toggle}
                                    onCancel={() => setToggle(0)}
                                    width={"fit-content"}
                                    height={"auto"}
                                >
                                    <div style={{ padding: "15px" }}>
                                        <SketchPicker
                                            color={hoverBgColorSideMenu}
                                            disableAlpha={true}
                                            onChange={(color) => setHoverBgColorSideMenu(color.hex)} />
                                    </div>
                                </Modal>

                                }
                            </div>
                            <div>
                                <Space className="container-form">
                                    <label className="reader">{i18next.t("manager.params.election.bgColorActive")}</label>
                                    <div style={{ width: "25px", height: "25px", background: activeBgColorSideMenu }}></div>
                                    <Input value={activeBgColorSideMenu} onChange={(e) => setActiveBgColorSideMenu(e.target.value)} />
                                    <Button onClick={() => setToggle(8)}>{toggle == 8 ? <div className="reader">{i18next.t('manager.params.palette.close')}</div> : <div className="reader">{i18next.t('manager.params.palette.open')}</div>}</Button>
                                </Space>
                                {toggle == 8 && <Modal
                                    footer={null}
                                    open={toggle}
                                    onCancel={() => setToggle(0)}
                                    width={"fit-content"}
                                    height={"auto"}
                                >
                                    <div style={{ padding: "15px" }}>
                                        <SketchPicker
                                            color={activeBgColorSideMenu}
                                            disableAlpha={true}
                                            onChange={(color) => setActiveBgColorSideMenu(color.hex)} />
                                    </div>
                                </Modal>

                                }
                            </div>
                            <div>
                                <Space className="container-form">
                                    <label className="reader">{i18next.t("manager.params.election.borderColor")}</label>
                                    <div style={{ width: "25px", height: "25px", background: borderColorSideMenuOptions }}></div>
                                    <Input value={borderColorSideMenuOptions} onChange={(e) => setBorderColorSideMenuOptions(e.target.value)} />
                                    <Button onClick={() => setToggle(7)}>{toggle == 7 ? <div className="reader">{i18next.t('manager.params.palette.close')}</div> : <div className="reader">{i18next.t('manager.params.palette.open')}</div>}</Button>
                                </Space>
                                {toggle == 7 && <Modal
                                    footer={null}
                                    open={toggle}
                                    onCancel={() => setToggle(0)}
                                    width={"fit-content"}
                                    height={"auto"}
                                >
                                    <div style={{ padding: "15px" }}>
                                        <SketchPicker
                                            color={borderColorSideMenuOptions}
                                            disableAlpha={true}
                                            onChange={(color) => setBorderColorSideMenuOptions(color.hex)} />
                                    </div>
                                </Modal>

                                }
                            </div>
                            <div>
                                <Space className="container-form">
                                    <label className="reader">{i18next.t("manager.params.election.letterSize")}</label>
                                    <InputNumber value={letterSizeSideMenu} onChange={(e) => setLetterSizeSideMenu(e)} />
                                </Space>
                            </div>

                            <div>
                                <Space className="container-form">
                                    <label className="reader">{i18next.t("manager.params.election.letterColor")}</label>
                                    <div style={{ width: "25px", height: "25px", background: letterColorSideMenu }}></div>
                                    <Input value={letterColorSideMenu} onChange={(e) => setLetterColorSideMenu(e.target.value)} />
                                    <Button onClick={() => setToggle(3)}>{toggle == 3 ? <div className="reader">{i18next.t('manager.params.palette.close')}</div> : <div className="reader">{i18next.t('manager.params.palette.open')}</div>}</Button>
                                </Space>
                                {toggle == 3 && <Modal
                                    footer={null}
                                    open={toggle}
                                    onCancel={() => setToggle(0)}
                                    width={"fit-content"}
                                    height={"auto"}
                                >
                                    <div style={{ padding: "15px" }}>
                                        <SketchPicker
                                            color={letterColorSideMenu}
                                            disableAlpha={true}
                                            onChange={(color) => setLetterColorSideMenu(color.hex)} />
                                    </div>
                                </Modal>

                                }
                            </div>

                            <div>
                                <Space className="container-form">
                                    <label className="reader">{i18next.t("manager.params.election.letterType")}</label>
                                    <Input value={letterTypeSideMenu} onChange={(e) => setLetterTypeSideMenu(e.target.value)} />
                                </Space>
                                {<div><span style={{ color: letterColorSideMenu, fontSize: letterSizeSideMenu + "px", fontFamily: letterTypeSideMenu }}>{i18next.t("manager.params.letterStyleView")}</span></div>}
                            </div>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                    <Card
                        title={<div className="reader" style={{ color: "#00000", fontFamily: "sans-serif", fontSize: "" }}>{i18next.t("manager.params.form.name")}</div>}
                        size="small"
                        bordered={true}
                        styles={{ header: { background: colorbackground } }}>

                        <Space direction="vertical">
                            <div>
                                <Space className="container-form">
                                    <label className="reader">{i18next.t("manager.params.election.letterSize")}</label>
                                    <InputNumber value={letterSizeForm} onChange={(e) => setLetterSizeForm(e)} />
                                </Space>
                            </div>

                            <div>
                                <Space className="container-form">
                                    <label className="reader">{i18next.t("manager.params.election.letterColor")}</label>
                                    <div style={{ width: "25px", height: "25px", background: letterColorForm }}></div>
                                    <Input value={letterColorForm} onChange={(e) => setLetterColorForm(e.target.value)} />
                                    <Button onClick={() => setToggle(4)}>{toggle == 4 ? <div className="reader">{i18next.t('manager.params.palette.close')}</div> : <div className="reader">{i18next.t('manager.params.palette.open')}</div>}</Button>
                                </Space>
                                {toggle == 4 && <Modal
                                    footer={null}
                                    open={toggle}
                                    onCancel={() => setToggle(0)}
                                    width={"fit-content"}
                                    height={"auto"}
                                >
                                    <div style={{ padding: "15px" }}>
                                        <SketchPicker
                                            color={letterColorForm}
                                            disableAlpha={true}
                                            onChange={(color) => setLetterColorForm(color.hex)} />
                                    </div>
                                </Modal>

                                }
                            </div>

                            <div>
                                <Space className="container-form">
                                    <label className="reader">{i18next.t("manager.params.election.letterType")}</label>
                                    <Input value={letterTypeForm} onChange={(e) => setLetterTypeForm(e.target.value)} />
                                </Space>
                                {<div><span style={{ color: letterColorForm, fontSize: letterSizeForm + "px", fontFamily: letterTypeForm }}>{i18next.t("manager.params.letterStyleView")}</span></div>}
                            </div>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                    <Card
                        title={<div className="reader" style={{ color: "#00000", fontFamily: "sans-serif", fontSize: "" }}>{i18next.t("manager.params.headMenu.name")}</div>}
                        size="small"
                        bordered={true}
                        styles={{ header: { background: colorbackground } }}>
                        <Space direction="vertical">
                            <div>
                                <Space className="container-form">
                                    <label >{i18next.t("manager.params.election.letterSize")}</label>
                                    <InputNumber value={letterSizeHeadMenu} onChange={(e) => setLetterSizeHeadMenu(e)} />
                                </Space>
                            </div>

                            <div>
                                <Space className="container-form">
                                    <label >{i18next.t("manager.params.election.letterColor")}</label>
                                    <div style={{ width: "25px", height: "25px", background: letterColorHeadMenu }}></div>
                                    <Input value={letterColorHeadMenu} onChange={(e) => setLetterColorHeadMenu(e.target.value)} />
                                    <Button onClick={() => setToggle(5)}>{toggle == 5 ? i18next.t('manager.params.palette.close') : i18next.t('manager.params.palette.open')}</Button>
                                </Space>
                                {toggle == 5 && <Modal
                                    footer={null}
                                    open={toggle}
                                    onCancel={() => setToggle(0)}
                                    width={"fit-content"}
                                    height={"auto"}
                                >
                                    <div style={{ padding: "15px" }}>
                                        <SketchPicker
                                            color={letterColorHeadMenu}
                                            disableAlpha={true}
                                            onChange={(color) => setLetterColorHeadMenu(color.hex)} />
                                    </div>
                                </Modal>

                                }
                            </div>

                            <div>
                                <Space className="container-form">
                                    <label >{i18next.t("manager.params.election.letterType")}</label>
                                    <Input value={letterTypeHeadMenu} onChange={(e) => setLetterSizeHeadMenu(e.target.value)} />
                                </Space>
                                {<div><span style={{ color: letterColorHeadMenu, fontSize: letterSizeHeadMenu + "px", fontFamily: letterTypeHeadMenu }}>{i18next.t("manager.params.letterStyleView")}</span></div>}
                            </div>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                    <Card
                        title={<div className="reader" style={{ color: "#00000", fontFamily: "sans-serif", fontSize: "" }}>{i18next.t("manager.params.legend.name")}</div>}
                        size="small"
                        bordered={true}
                        styles={{ header: { background: colorbackground } }}>

                        <Space direction="vertical">
                            <div>
                                <Space className="container-form">
                                    <label >{i18next.t("manager.params.election.letterSize")}</label>
                                    <InputNumber value={letterSizeLegend} onChange={(e) => setLetterSizeLegend(e)} />
                                </Space>
                            </div>

                            <div>
                                <Space className="container-form">
                                    <label >{i18next.t("manager.params.election.letterColor")}</label>
                                    <div style={{ width: "25px", height: "25px", background: letterColorLegend }}></div>
                                    <Input value={letterColorLegend} onChange={(e) => setLetterColorLegend(e.target.value)} />
                                    <Button onClick={() => setToggle(6)}>{toggle == 6 ? i18next.t('manager.params.palette.close') : i18next.t('manager.params.palette.open')}</Button>
                                </Space>
                                {toggle == 6 && <Modal
                                    footer={null}
                                    open={toggle}
                                    onCancel={() => setToggle(0)}
                                    width={"fit-content"}
                                    height={"auto"}
                                >
                                    <div style={{ padding: "15px" }}>
                                        <SketchPicker
                                            color={letterColorLegend}
                                            disableAlpha={true}
                                            onChange={(color) => setLetterColorLegend(color.hex)} />
                                    </div>
                                </Modal>

                                }
                            </div>

                            <div>
                                <Space className="container-form">
                                    <label >{i18next.t("manager.params.election.letterType")}</label>
                                    <Input value={letterTypeLegend} onChange={(e) => setLetterSizeLegend(e.target.value)} />
                                </Space>
                                {<div><span style={{ color: letterColorLegend, fontSize: letterSizeLegend + "px", fontFamily: letterTypeLegend }}>{i18next.t("manager.params.letterStyleView")}</span></div>}
                            </div>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                <Card
                        title={<div className="reader" style={{ color: "#00000", fontFamily: "sans-serif", fontSize: "" }}>{i18next.t("manager.params.managerEmail")}</div>}
                        size="small"
                        bordered={true}
                        styles={{ header: { background: colorbackground } }}>

                        <Space direction="vertical">
                            <div>
                                <Space className="container-form">
                                    <label >{i18next.t("manager.params.election.managerEmail")}</label>
                                    <Input value={managerEmail} onChange={(e) => setManagerEmail(e.target.value)} />
                                </Space>
                            </div>
                        </Space>
                    </Card>
                </Col>
                <Col xs={24} sm={12} md={12} lg={12} xl={12}>
                <Card
                        title={<div className="reader" style={{ color: "#00000", fontFamily: "sans-serif", fontSize: "" }}>{i18next.t("manager.params.numberApps")}</div>}
                        size="small"
                        bordered={true}
                        styles={{ header: { background: colorbackground } }}>

                        <Space direction="vertical">
                            <div>
                                <Space className="container-form">
                                    <label >{i18next.t("manager.params.election.numberApps")}</label>
                                    {<InputNumber min={1} value={numberShownApps} onChange={(e) => setNumberShownApps(e)}></InputNumber>}
                                </Space>
                            </div>
                        </Space>
                    </Card>
                </Col>
            </Row>
            <Row gutter={[16, 16]} style={{ justifyContent: "center", padding: "10px" }}>
                <Col>
                    <Space>
                        <Button type="primary" onClick={() => onSave()}>
                            {!saving && <div className="reader">{i18next.t('common.actions.save.name')}</div>}
                            {saving && <>{i18next.t('common.actions.save.saving')}</>}
                        </Button>
                        {saving && <Spin visible={saving}></Spin>}
                    </Space>
                </Col>
            </Row>

        </>

    )
}

export default StylesParamComponent;