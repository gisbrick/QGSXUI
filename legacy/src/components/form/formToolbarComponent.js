import { useState, useRef, useEffect } from "react";
import { Button, Space, Tooltip } from "antd";

import {
    DeleteOutlined,
    EditOutlined, EnvironmentOutlined,
    FileSearchOutlined, ScheduleOutlined, ZoomInOutlined, SoundOutlined, CloseOutlined, WarningOutlined,
    QuestionCircleOutlined
} from '@ant-design/icons';
import i18next from "i18next";
import ConfirmDeleteComponent from "../list/components/confirmDeleteComponent";
import MediaComponentModal from "../media/mediaComponentModal";
import ReportsComponent from "./reportsComponent";
import ScheduleComponentModal from "../schedule/scheduleComponentModal";
import { CancelAudio, CheckQueu, Speak } from "../../utilities/pageContentReader";
import { ContentReader } from "../../utilities/pageContentReaderClass";
import { useSelector } from "react-redux";
import { selectLang } from "../../features/language/languageSlice";
import { HasAccessToLayerTool, HasAccessToProjectTool } from "../../utilities/SecurityUtil";


function FormToolbarComponent({ QGISPRJ, map, editable, setEditable, feature, qgisLayer, mapView, reload, visible, setVisible, page, setShowFormView, setTourStepsToolbars, setTourOpen, showFormView, setLoading }) {

    const [viewDeleteFeature, setViewDeleteFeature] = useState();
    const [soundActivated, setSoundActivated] = useState(false)
    const [showMedia, setShowMedia] = useState();
    const [showSchedule, setShowSchedule] = useState();

    const [tourSteps, setTourSteps] = useState([])

    const botonEdit = useRef(null)
    const botonGeo = useRef(null)
    const botonBorrar = useRef(null)
    const botonZoom = useRef(null)
    const botonMedia = useRef(null)
    const botonSchedule = useRef(null)
    const botonLectura = useRef(null)

    const language = useSelector(selectLang)


    //Recuperamos información de si puede gestionar documentos
    let media = null;
    if (qgisLayer && qgisLayer.customProperties && qgisLayer.customProperties.URBEGIS_MEDIA) {
        media = JSON.parse(qgisLayer.customProperties.URBEGIS_MEDIA)
    }

    //Recuperamos información de si puede gestionar schedule
    let schedule = null;
    if (qgisLayer && qgisLayer.customProperties && qgisLayer.customProperties.URBEGIS_LAYER_SCHEDULE) {
        schedule = JSON.parse(qgisLayer.customProperties.URBEGIS_LAYER_SCHEDULE)
    }

    let zoom = () => {
        //console.log("zoooom")
        let featureBounds;
        if (feature.bbox) {
            featureBounds = window.L.latLngBounds([
                [feature.bbox[3], feature.bbox[0]],
                [feature.bbox[1], feature.bbox[2]]
            ]);
        }
        else {
            let grades = 0.001;
            let x = feature.geometry.coordinates[0];
            let y = feature.geometry.coordinates[1];
            featureBounds = window.L.latLngBounds([
                [y + grades, x - grades],
                [y - grades, x + grades]
            ]);
        }
        mapView.fitBounds(featureBounds);
    }

    let deleteFeature = () => {
        setViewDeleteFeature(true);
    }

    let openMedia = () => {
        setShowMedia(true)
    }

    let openSchedule = () => {
        setShowSchedule(true)
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

    const loadHelpsSteps = () => {
        let steps = []

        if (feature && feature.id && qgisLayer && !editable && qgisLayer.WFSCapabilities.allowUpdate) {
            steps.push({
                title: i18next.t('common.tools.help.form.edit.button.title'),
                description: i18next.t('common.tools.help.form.edit.button.description'),
                //placement: 'top',
                target: () => botonEdit.current,
            })
        }

        if (feature && feature.id && qgisLayer && mapView && qgisLayer.WFSCapabilities.allowUpdate) {
            steps.push({
                title: i18next.t('common.tools.help.form.geometry.button.title'),
                description: i18next.t('common.tools.help.form.geometry.button.description'),
                //placement: 'top',
                target: () => botonGeo.current,
            })
        }

        if (feature && feature.id && qgisLayer && qgisLayer.WFSCapabilities.allowDelete) {
            steps.push({
                title: i18next.t('common.tools.help.form.delete.button.title'),
                description: i18next.t('common.tools.help.form.delete.button.description'),
                //placement: 'top',
                target: () => botonBorrar.current,
            })
        }

        if (feature && feature.id && mapView) {
            steps.push({
                title: i18next.t('common.tools.help.form.zoom.button.title'),
                description: i18next.t('common.tools.help.form.zoom.button.description'),
                //placement: 'top',
                target: () => botonZoom.current,
            })
        }

        if (HasAccessToProjectTool(QGISPRJ, "MEDIA") && HasAccessToLayerTool(QGISPRJ, qgisLayer.name, "MEDIA") && feature && feature.id && media) {
            steps.push({
                title: i18next.t('common.tools.help.form.media.button.title'),
                description: i18next.t('common.tools.help.form.media.button.description'),
                //placement: 'top',
                target: () => botonMedia.current,
            })
        }

        if (feature && feature.id && schedule) {
            steps.push({
                title: i18next.t('common.tools.help.form.schedule.button.title'),
                description: i18next.t('common.tools.help.form.schedule.button.description'),
                //placement: 'top',
                target: () => botonSchedule.current,
            })
        }

        if (feature && feature.id && mapView) {
            steps.push({
                title: i18next.t('common.tools.help.form.reader.button.title'),
                description: i18next.t('common.tools.help.form.reader.button.description'),
                //placement: 'top',
                target: () => botonLectura.current,
            })
        }

        setTourSteps(steps)
    }

    useEffect(() => {
        loadHelpsSteps()
    }, [feature, editable])

    useEffect(() => {
        let steps = [...tourSteps]
        setTourStepsToolbars(steps)
    }, [tourSteps])

    return (
        <>
            <Space wrap>

                {<Tooltip title={i18next.t('common.tools.help.name')} key={"maphelp"}>
                    <Button size='large' disabled={false} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                        onClick={(e) => {
                            setTourOpen(true);
                        }}
                        type={"default"} shape="circle">
                        <QuestionCircleOutlined />
                    </Button>
                </Tooltip>
                }

                {/* BOTON INICIAR EDICIÓN ATRIBUTOS*/}
                {/*HasAccessToProjectTool(QGISPRJ, "TABLE") && HasAccessToLayerTool(QGISPRJ, qgisLayer.name, "TABLE") &&*/ feature && feature.id && qgisLayer && !editable && qgisLayer.WFSCapabilities.allowUpdate &&
                    <Tooltip title={i18next.t('common.actions.edit.attributes')} key={"editAttributes"}>
                        <Button ref={botonEdit} size='large' disabled={false} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                            onClick={(e) => {
                                setEditable(true)
                                setShowFormView(false)
                                e.stopPropagation();
                                window.mouseOverButton = false
                            }}
                            type={"default"} shape="circle">
                            <EditOutlined />
                        </Button>
                    </Tooltip>
                }

                {/* BOTON INICIAR EDICIÓN GEOMETRÍA*/}
                {/*HasAccessToProjectTool(QGISPRJ, "TABLE") && HasAccessToLayerTool(QGISPRJ, qgisLayer.name, "TABLE") &&*/ feature && feature.id && qgisLayer && mapView && qgisLayer.WFSCapabilities.allowUpdate &&
                    <Tooltip title={i18next.t('common.actions.edit.geometry')} key={"editGeometry"}>
                        <Button ref={botonGeo} size='large' disabled={false} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                            onClick={(e) => {
                                mapView.editFeatureGeometry(feature, qgisLayer)
                                setVisible(false)
                                //console.log("setVisible editGeometry")
                                e.stopPropagation();
                                window.mouseOverButton = false
                            }}
                            type={"default"} shape="circle">
                            <EnvironmentOutlined />
                        </Button>
                    </Tooltip>
                }

                {/* BOTON BORRAR*/}
                {/*HasAccessToProjectTool(QGISPRJ, "TABLE") && HasAccessToLayerTool(QGISPRJ, qgisLayer.name, "TABLE") &&*/ feature && feature.id && qgisLayer && qgisLayer.WFSCapabilities.allowDelete &&
                    <Tooltip title={i18next.t('common.actions.delete.name')} key={"delete"}>
                        <Button ref={botonBorrar} size='large' disabled={false} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                            onClick={(e) => {
                                deleteFeature();
                                e.stopPropagation();
                                window.mouseOverButton = false
                            }}
                            type={"default"} shape="circle">
                            <DeleteOutlined />
                        </Button>
                    </Tooltip>
                }


                {/* BOTON ZOOM*/}
                {feature && feature.id && mapView &&
                    <Tooltip title={i18next.t('common.actions.zoom.name')} key={"zoom"}>
                        <Button ref={botonZoom} size='large' disabled={false} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                            onClick={(e) => {
                                zoom();
                                e.stopPropagation();
                                window.mouseOverButton = false
                            }}
                            type={"default"} shape="circle">
                            <ZoomInOutlined />
                        </Button>
                    </Tooltip>
                }

                {/* BOTON GESTION DOCUMENTAL*/}
                {HasAccessToProjectTool(QGISPRJ, "MEDIA") && HasAccessToLayerTool(QGISPRJ, qgisLayer.name, "MEDIA") && feature && feature.id && media &&
                    <Tooltip title={i18next.t('common.actions.media.name')} key={"media"}>
                        <Button ref={botonMedia} size='large' disabled={false} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                            onClick={(e) => {
                                openMedia();
                                e.stopPropagation();
                                window.mouseOverButton = false
                            }}
                            type={"default"} shape="circle">
                            <FileSearchOutlined />
                        </Button>
                    </Tooltip>
                }

                {/* BOTON DE INCIDENCIAS*/}
                {/*feature && feature.id &&
                    <Tooltip title={i18next.t('common.actions.incidents.name')} key={"incidents"}>
                        <Button ref={botonIncidents} size='large' disabled={false} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                            onClick={(e) => {
                                openIcidencias();
                                e.stopPropagation();
                                window.mouseOverButton = false
                            }}
                            type={"default"} shape="circle">
                            <WarningOutlined />
                        </Button>
                    </Tooltip>
                */}

                {/* BOTON DE SCHEDULE*/}
                {feature && feature.id && schedule &&
                    <Tooltip title={i18next.t('common.actions.schedule.name')} key={"schedule"}>
                        <Button ref={botonSchedule} size='large' disabled={false} onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                            onClick={(e) => {
                                openSchedule();
                                e.stopPropagation();
                                window.mouseOverButton = false
                            }}
                            type={"default"} shape="circle">
                            <ScheduleOutlined />
                        </Button>
                    </Tooltip>
                }

                {/* REPORTS*/}
                {feature && feature.id &&
                    <ReportsComponent QGISPRJ={QGISPRJ} map={map} qgisLayer={qgisLayer} mapView={mapView} featureId={feature.id}></ReportsComponent>
                }

                {/* LECTURA DE CONTENIDO */}
                {feature && feature.id && mapView && showFormView &&
                    <Tooltip
                        title={i18next.t('common.actions.reader.listen')}>
                        <Button
                            ref={botonLectura}
                            disabled={false}
                            shape="circle"
                            size='large'
                            onClick={() => {
                                //PageContentReader(language, qgisLayer.name + "_" + page);
                                lecturaContenido(qgisLayer.name + "_" + page)
                            }}><SoundOutlined />
                        </Button>
                    </Tooltip>}
                {soundActivated && <Tooltip
                    title={i18next.t('common.actions.reader.end')}>
                    <Button
                        disabled={false}
                        shape="circle"
                        size='large'
                        onClick={() => {
                            CancelAudio(qgisLayer.name + "_" + page)
                            setSoundActivated(false)
                        }}><CloseOutlined />
                    </Button>
                </Tooltip>}


            </Space>

            {viewDeleteFeature && <ConfirmDeleteComponent map={map} feature={feature} layer={qgisLayer.name} qgisLayer={qgisLayer}
                mapView={mapView} reload={reload} setVisible={setViewDeleteFeature} setModalOpen={setVisible} setLoading={setLoading}>
            </ConfirmDeleteComponent>}

            {showMedia && <MediaComponentModal media={media} map={map} editable={editable} setEditable={setEditable} feature={feature} qgisLayer={qgisLayer} mapView={mapView} reload={reload} visible={showMedia} setVisible={setShowMedia}></MediaComponentModal>}

            {showSchedule && <ScheduleComponentModal schedule={schedule} map={map} editable={editable} setEditable={setEditable} feature={feature} QGISPRJ={QGISPRJ} qgisLayer={qgisLayer} mapView={mapView} reload={reload} visible={showSchedule} setVisible={setShowSchedule}></ScheduleComponentModal>}

        </>
    );
}

export default FormToolbarComponent;