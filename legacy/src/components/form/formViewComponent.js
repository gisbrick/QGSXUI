import React, { useEffect, useState } from "react";
import i18next from "i18next";
import { theme } from "antd";
import { MediaService } from "../../service/mediaService";
import MediaFormViewCarrousel from "../media/mediaFormViewCarrousel";
import LoadingComponent from "../utils/LoadingComponent";
import { useSelector } from "react-redux";
import { generalParams_state } from "../../features/generalParams/generalParamsSlice";
import { getBackgroundColorPrimary, getLetterColorForm, getLetterSizeForm, getLetterTypeForm } from "../../utilities/paramsUtils";
import MediaFormViewDocumentsList from "../media/mediaFormViewDocumentsList";
import dayjs from 'dayjs';
import { getFloatTypes, getIntegerTypes } from "../../utilities/valueUtils";
import { QgisService } from "../../service/qgisService";

const FormViewComponent = ({ page, qgisLayers, map, qgisLayer, feature, mapView, QGISPRJ }) => {

    const state_params = useSelector(generalParams_state)
    const {
        token: { colorBgContainer },
    } = theme.useToken();

    const [htmlParseado, setHtmlParseado] = useState(null)
    const [data, setData] = useState([])
    const [loadingMedia, setLoadingMedia] = useState(false)
    const [loadingImage, setLoadingImage] = useState(true)

    const [backgroundColorHeader, setBackgroundColorHeader] = useState(colorBgContainer)
    const [letterSizeForm, setLetterSizeForm] = useState(14)
    const [letterTypeForm, setLetterTypeForm] = useState("Helvetica")
    const [letterColorForm, setLetterColorForm] = useState("#000000")

    const imageHeight = 190;
    let integerTypes = getIntegerTypes()
    let floatTypes = getFloatTypes()

    // Función recursiva para convertir los nodos hijos en componentes React
    const parseNode = (node) => {
        // Si el nodo es un elemento HTML
        if (node.nodeType === Node.ELEMENT_NODE) {
            const { tagName, attributes } = node;

            // Crear el elemento React correspondiente
            const reactElement = React.createElement(
                tagName.toLowerCase(),
                // Convertir los atributos del elemento a un objeto para pasar como props
                Object.fromEntries(Array.from(attributes).map(attr => [attr.name, attr.value])),
                // Convertir los nodos hijos del elemento a componentes React
                ...(node.childNodes ? Array.from(node.childNodes).map(parseNode) : [])
            );

            return reactElement;
        }
        // Si el nodo es un nodo de texto
        else if (node.nodeType === Node.TEXT_NODE) {
            // Si el texto contiene al menos un carácter que no sea un espacio en blanco, añadir la clase 'greeting'
            if (/\S/.test(node.textContent)) {
                if (node.textContent.toLowerCase() == "null") {
                    return null
                }
                return React.createElement('span', { className: qgisLayer.name + "_" + page }, node.textContent);
            } else {
                return null;
            }
        }
        // Si el nodo es otro tipo de nodo, como un comentario
        else {
            return null;
        }
    }


    const parseHTMLToReact = (htmlString) => {
        // Crear un elemento HTML temporal
        const tempElement = document.createElement('div');
        // Insertar el HTML como contenido del elemento temporal
        tempElement.innerHTML = htmlString;

        // Convertir los nodos hijos del elemento temporal a un array
        const children = Array.from(tempElement.childNodes);


        // Convertir cada nodo hijo del elemento temporal en un componente React
        const reactChildren = children.map(parseNode);

        // Devolver un fragmento de React que contiene los componentes hijos
        return React.createElement(React.Fragment, null, ...reactChildren);
    }

    /**
     * Función para la recuperación de datos multimedia de la base de datos
     */
    let loadMediaData = async () => {
        setLoadingMedia(true)
        setData([])
        await MediaService.LISTFEATURE(map, feature)
            .then((data) => {
                if (data.length > 0) {
                    //setDataAux(dataAux)
                    //let data = loadImage(dataAux, 0)
                    setData(data)
                    setLoadingMedia(false)
                }
                setLoadingMedia(false)
            })
    }


    /**
     * Función:
     *  1º Obtener los valores entre  [% %] del raw html
     *  2º Usar esos valores para ver a que fields pertenecen
     *  3º Si hay un alias en el field obtener el alias, si no lo hay entonces obtener el name.
     *  4º Hacer la sustitución de los valores en el rawHTML.
     * 
     * @param {*} qgisLayer 
     * @param {*} feature 
     * @param {*} rawHtml 
     * @returns 
     */
    const buildHTML = async (qgisLayer, feature, rawHtml, map) => {
        let htmlAux = rawHtml;
        let regex = /\[%(.*?)\%]/g;
        let html = qgisLayer.mapTipTemplate

        let matches = html.match(regex);
        if (matches) {
            let arrayPromesas = []
            matches.forEach((match) => {
                let regex = /\"(.*?)\"/g
                let id = regex.exec(match)[1]
                let fields = qgisLayer.fields
                let field = fields.find((field) => field.name == id)
                let item = field.alias != "" ? field.alias : field.name
                let valorAux = feature.properties[item]
                arrayPromesas.push(getFeaturesFromTables(field, map, valorAux))

            })

            let resultados = await Promise.all(arrayPromesas)

            matches.forEach((match, index) => {
                let regex = /\"(.*?)\"/g
                let id = regex.exec(match)[1]
                let fields = qgisLayer.fields
                let field = fields.find((field) => field.name == id)
                let item = field.alias != "" ? field.alias : field.name
                let valorAux = feature.properties[item]
                let element = resultados[index]
                if (element) {
                    valorAux = getValuesFromTableFeatures(field, element, valorAux)
                }

                if (!valorAux) {
                    htmlAux = htmlAux.replace(match, "")
                } else {
                    if (field.editorWidgetSetup.type == "DateTime") {
                        valorAux = formateoFecha(field, feature, valorAux)
                    }
                    if (fieldIs(field, integerTypes) || fieldIs(field, floatTypes)) {
                        valorAux = valorAux.toLocaleString("de-DE")
                    }
                    htmlAux = htmlAux.replace(match, valorAux)
                }
            })
        }
        return htmlAux;
    }

    const getValuesFromTableFeatures = (field, element, valorAux) => {
        const features = element.features
        let config = JSON.parse(field.editorWidgetSetup.config)
        const { Key: key, Value: value } = config
        let elementAux = features.find((feature) => feature.properties[key] == valorAux).properties[value]
        return elementAux
    }

    const getFeaturesFromTables = (field, map) => {
        if (field.editorWidgetSetup.type == "ValueRelation") {
            let config = JSON.parse(field.editorWidgetSetup.config)
            const { LayerName: layerName } = config
            return QgisService.GETFEATURES(map, layerName, null, null, null, null, null, null)
        } else {
            return null
        }
    }


    /**
     * Función que recupera la información de la feature
     * 
     * @param {*} map 
     * @param {*} feature 
     * @param {*} qgisLayer 
     * @returns 
     */
    const getFeatureInfo = async (map, feature, qgisLayer) => {
        let featureAux = { ...feature }

        for (let i in qgisLayer.fields) {
            let field = qgisLayer.fields[i]
            if (field.alias && field.alias != "") {
                featureAux.properties[field.alias] = featureAux.properties[field.name]
            }
        }
        return featureAux
    }

    /**
     * Función que sirve para formatear la fecha a dd/MM/yyyy
     * 
     * @param {*} field 
     * @param {*} feature 
     * @param {*} theValue 
     * @returns 
     */
    const formateoFecha = (field, feature, theValue) => {
        let valor = ""
        let date = null
        let config = JSON.parse(field.editorWidgetSetup.config);
        const timeFormat = 'HH:mm:ss'

        let displayFormat = config.display_format;
        if (displayFormat == timeFormat) {
            //Si es hora
            if (field.name in feature.properties && feature.properties[field.name]) {
                date = getDateValue("1970-01-01 " + theValue)
                valor = date.toDate().toLocaleString()
            }
        }
        else {
            //Si es fecha
            date = getDateValue(theValue)
            valor = date.toDate().toLocaleDateString()
        }
        return valor
    }

    /**
     * Función para obtener el valor Date de una fecha en String
     * 
     * @param {*} value 
     * @returns 
     */
    const getDateValue = (value) => {

        if (value != null) {
            if (typeof value === 'string' || value instanceof String) {
                let out = dayjs(value)
                return out
            }
            else {
                //SI llegamos aquí, es porque ya tenemos convertido a dayjs la variable              
                return value
            }
        }
        else {
            return null;
        }
    }

    /**
     * Obtiene el tipo de field que es
     * 
     * @param {*} field 
     * @param {*} types 
     * @returns 
     */
    const fieldIs = (field, types) => {
        let out = false;
        for (let i in types) {
            if (!out && field.typeName.toUpperCase().includes(types[i])) out = true
        }
        //console.log("id", out)
        return out;
    }

    /**
     * Función asincrona que contruye el html, lo convierte a componentes react y recupera los datos multimedia de base de datos
     */
    const mount = async () => {
        setHtmlParseado(null)
        let featureAux = await getFeatureInfo(map, feature, qgisLayer)
        if (qgisLayer && feature && featureAux) {
            let rawHtml = qgisLayer.mapTipTemplate
            let parseHTML = await buildHTML(qgisLayer, featureAux, rawHtml, map)
            const reactComponent = parseHTMLToReact(parseHTML);
            setHtmlParseado(reactComponent);
            if (qgisLayer.customProperties["URBEGIS_MEDIA"]) {
                setLoadingMedia(true)
                await loadMediaData()
                setLoadingMedia(false)
            }

        } else {
            setHtmlParseado(<div style={{ textAlign: "center" }}>{i18next.t("common.msg.results.noData")}</div>);
        }
    }

    useEffect(() => {
        if (state_params.length > 0) {
            let colorHeader = getBackgroundColorPrimary(state_params)

            if (colorHeader) {
                setBackgroundColorHeader(colorHeader)
            }


            let letterSizeForm = getLetterSizeForm(state_params)

            if (letterSizeForm) {
                setLetterSizeForm(letterSizeForm)
            }

            let letterTypeForm = getLetterTypeForm(state_params)

            if (letterTypeForm) {
                setLetterTypeForm(letterTypeForm)
            }

            let letterColorForm = getLetterColorForm(state_params)

            if (letterColorForm) {
                setLetterColorForm(letterColorForm)
            }


        }
    }, [state_params])

    useEffect(() => {
        mount()
    }, [feature]);

    return (
        <>
            <div className="form-view" style={{
                display: "flex", flexDirection: "column", marginBottom: "20px",
                color: letterColorForm, fontFamily: letterTypeForm, fontSize: letterSizeForm + "px"
            }}>
                <div>
                    <div style={{ background: backgroundColorHeader, padding: "1px", borderRadius: "10px", textAlign: "center" }}>
                        <h3 className={qgisLayer.name + "_" + page}>{i18next.t("formView.media")}</h3>
                    </div>
                    <div style={{ padding: "5px" }}>
                        {loadingMedia ? <LoadingComponent></LoadingComponent> : <div style={{ textAlign: "center" }}>{
                            data.length > 0 && loadingImage ? <MediaFormViewCarrousel map={map} qgisLayer={qgisLayer} page={page} feature={feature} height={imageHeight} data={data} setLoadingImage={setLoadingImage}></MediaFormViewCarrousel> :
                                <div className={qgisLayer.name + "_" + page}>{i18next.t("common.msg.results.noData")}</div>
                        }
                        </div>}
                    </div>
                </div>

                <div>
                    <div style={{ background: backgroundColorHeader, padding: "1px", borderRadius: "10px", textAlign: "center" }}>
                        <h3 className={qgisLayer.name + "_" + page}>{i18next.t("formView.characteristics")}</h3>
                    </div>
                    <div style={{ padding: "1px", textAlign: "justify" }}>
                        {htmlParseado ? htmlParseado : <LoadingComponent></LoadingComponent>}
                    </div>
                </div>
                <div>
                    <div style={{ background: backgroundColorHeader, padding: "1px", borderRadius: "10px", textAlign: "center" }}>
                        <h3 className={qgisLayer.name + "_" + page}>{i18next.t("formView.attached")}</h3>

                    </div>
                    <div style={{ padding: "1px" }}>
                        {loadingMedia ? <LoadingComponent></LoadingComponent> :
                            <>
                                <div style={{ textAlign: "center" }}>
                                    {
                                        data.length > 0 ? <MediaFormViewDocumentsList map={map} feature={feature} data={data}></MediaFormViewDocumentsList> :
                                            <div className={qgisLayer.name + "_" + page}>{i18next.t("common.msg.results.noData")}</div>
                                    }
                                </div>
                                {/*<Tooltip placement="right" title={i18next.t('common.actions.download.downloadZip')} key={"media.download"}>
                                    <Button disabled={false} style={{ float: "right", marginBottom: "10px" }} icon={<FileZipOutlined />}></Button>
                                </Tooltip>*/}
                            </>
                        }
                    </div>

                </div>

            </div>
        </>

    );

}

export default FormViewComponent;