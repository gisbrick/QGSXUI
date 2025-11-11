import { useEffect, useState, useRef } from "react";
import { Button, Drawer, Space, Tooltip } from "antd";
import Icon, { QuestionCircleOutlined } from '@ant-design/icons';
import i18next from "i18next";
import { useDispatch, useSelector } from 'react-redux';

import { ReactComponent as baseMap_icon } from '../../../assets/esri/basemap-32.svg'
import { ReactComponent as layers_icon } from '../../../assets/esri/layers-32.svg'
import { ReactComponent as tables_icon } from '../../../assets/esri/tables-32.svg'

import ContentBaseLayersComponent from "./contentBaseLayersComponent";
import ContentTocComponent from "./contentTocComponent";
import EditToolbarComponent from "./toolbarComponent/editToolbarComponent";
import InfoToolbarComponent from "./toolbarComponent/infoToolbarComponent";
import ReportsToolbarComponent from "./toolbarComponent/reportsToolbarComponent";
import { getLetterColorLegend, getLetterSizeLegend, getLetterTypeLegend } from "../../../utilities/paramsUtils";
import { generalParams_state } from "../../../features/generalParams/generalParamsSlice";
import { cerrarPopoverFilter } from "../../../features/popOverFilter/popOverFilterSlice";
import { user_state } from "../../../features/user/userSlice";
import { IsManager } from "../../../utilities/SecurityUtil";

function ToolbarComponent({ map, QGISPRJ, WMTSLAYERS, LEGEND, mapView, table, tableVisible, setTableVisible,
  tourOpen, setTourOpen, tourSteps, setTourSteps, showDrawerTocLocalState, setLoading }) {

  const state_params = useSelector(generalParams_state)
  const userState = useSelector(user_state)
  const dispatch = useDispatch()

  const [selectedTool, setSeletedTool] = useState(null)
  const [showDrawerBasemaps, setShowDrawerBasemaps] = useState(false)
  const [showDrawerToc, setShowDrawerToc] = useState(showDrawerTocLocalState)
  const [tableHasResults, setTableHasResults] = useState()
  const [letterSizeLegend, setLetterSizeLegend] = useState("16px")
  const [letterTypeLegend, setLetterTypeLegend] = useState("Helvetica")
  const [letterColorLegend, setLetterColorLegend] = useState("#000000")

  const [tourStepsRoot, setTourStepsRoot] = useState([]);
  const [tourStepsReport, setTourStepsReport] = useState([]);
  const [tourStepsInfo, setTourStepsInfo] = useState([]);
  const [tourStepsEdit, setTourStepsEdit] = useState([]);

  //Referencias de elementos que luego utilizaremos en tour de ayuda
  const refButtonToc = useRef(null);
  const refButtonMapasBase = useRef(null);
  const refButtonTableResults = useRef(null);

  let closeAllDrawers = () => {
    setShowDrawerBasemaps(false);
    setShowDrawerToc(false);
  }

  let openDrawer = (drawerVisible, setDrawerVisible) => {
    if (drawerVisible) {
      closeAllDrawers();
    }
    else {
      closeAllDrawers();
      setDrawerVisible.call(this, true);
    }

  }

  const onSelectToolChange = () => {
    //Removemos el gráfico en edición si existe
    if (mapView.editGeometry) mapView.editGeometry.remove()
    mapView.editGeometry = null;
    if (mapView.editGraphicsLayer) {
      let layers = mapView.editGraphicsLayer.getLayers()
      for (let i in layers) {
        mapView.editGraphicsLayer.removeLayer(layers[i])
      }
    }
  }

  /**
   * Función que modifica el aspecto del cursor dependiendo de la herramienta que se selecciona
   * 
   * @param {*} mapView 
   * @param {*} tool 
   * @param {*} selectedTool 
   */
  const editarAspectoCursor = (mapView, tool, selectedTool) => {

    if ((tool == "info" || tool == "cadastral_info") && tool !== selectedTool) {
      mapView._container.classList.add("cursor-info")
    } else {
      mapView._container.classList.remove("cursor-info")
    }   
    if (tool == "draw_points" && tool !== selectedTool) {
      mapView._container.classList.add("cursor-edit-point")
    } else {
      mapView._container.classList.remove("cursor-edit-point")
    }
    if (tool == "draw_lines" && tool !== selectedTool) {
      mapView._container.classList.add("cursor-edit-line")
    } else {
      mapView._container.classList.remove("cursor-edit-line")
    }
    if (tool == "draw_polygons" && tool !== selectedTool) {
      mapView._container.classList.add("cursor-edit-polygon")
    } else {
      mapView._container.classList.remove("cursor-edit-polygon")
    }
  };

  //Este método carga los pasos de ayuda, dependiendo de las herrmientas que estén visibles (revisar para ellos las condiciones de visibilidad de los botones de cada herramienta)
  const loadHelpSteps = () => {
    let steps = [];

    if (WMTSLAYERS.layers.length > 1 && refButtonMapasBase.current) {
      steps.push({
        title: i18next.t('common.tools.help.map.basemaps.button.title'),
        description: i18next.t('common.tools.help.map.basemaps.button.description'),
        //placement: 'top',
        target: () => refButtonMapasBase.current,
      })
    }

    steps.push({
      title: i18next.t('common.tools.help.map.toc.button.title'),
      description: IsManager(userState) ? i18next.t('common.tools.help.map.toc.button.description.admin') : i18next.t('common.tools.help.map.toc.button.description.user'),
      //placement: 'top',
      target: () => refButtonToc.current,
    })
    setTourStepsRoot(steps)
  }


  useEffect(() => {

    if (state_params.length > 0) {

      let colorLegend = getLetterColorLegend(state_params)

      if (colorLegend) {
        setLetterColorLegend(colorLegend)
      }

      let sizeLegend = getLetterSizeLegend(state_params)

      if (sizeLegend) {
        setLetterSizeLegend(sizeLegend)
      }

      let typeLegend = getLetterTypeLegend(state_params)

      if (typeLegend) {
        setLetterTypeLegend(typeLegend)
      }

    }

  }, [state_params])



  useEffect(() => {
    //Registra que se ha añadido una tabla a los resultados    
    table['registerTableAdded'] = function (layer) {
      setTableHasResults(true);
      setShowDrawerToc(false)
    }
    //Registra que se ha borrado una tabla a los resultados    
    table['registerTableDeleted'] = function (layer) {
      //TODO borrariamos los gráficos de resultados de esta capa
    }
    //Registra que se han eliminado todas las tabla de los resultados   
    table['registerAllTablesDeleted'] = function () {
      setTableHasResults(false);
    }

    loadHelpSteps()

  }, [])

  useEffect(() => {
    //console.log("tourStepsRoot", tourStepsRoot)
    //console.log("tourStepsReport", tourStepsReport)
    //console.log("tourStepsInfo", tourStepsInfo)
    //console.log("tourStepsEdit", tourStepsEdit)
    let steps = [...tourStepsRoot].concat([...tourStepsReport]).concat([...tourStepsInfo]).concat([...tourStepsEdit])
    //console.log("steps", steps)
    setTourSteps(steps)
  }, [tourStepsRoot, tourStepsReport, tourStepsInfo, , tourStepsEdit])

  useEffect(()=> {
    console.log("toool bar")
  }, [])

  return (
    <>
      <Space wrap align="end">
        {/* BOTON TOOL AYUDA*/}
        {<Tooltip title={i18next.t('common.tools.help.name')} key={"maphelp"}>
          <Button size='large' onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
            onClick={(e) => {
              setTourOpen(true);
            }}
            type={"default"} shape="circle">
            <QuestionCircleOutlined />
          </Button>
        </Tooltip>
        }
        {/* BOTON TOOL MAPAS BASE, solo si tenemos más de 1 mapa base*/}
        {WMTSLAYERS.layers.length > 1 &&
          <Tooltip title={i18next.t('common.tools.basemaps.name')} key={"basemaps"}>
            <Button ref={refButtonMapasBase} size='large' onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
              onClick={(e) => {
                openDrawer(showDrawerBasemaps, setShowDrawerBasemaps);
                e.stopPropagation();
                window.mouseOverButton = false
              }}
              type={"default"} shape="circle">
              <Icon component={baseMap_icon} />
            </Button>
          </Tooltip>
        }
        {/* BOTON DEL TOC*/}
        <Tooltip title={i18next.t('common.tools.toc.name')} key={"toc"}>
          <Button ref={refButtonToc} size='large' onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
            onClick={(e) => {
              openDrawer(showDrawerToc, setShowDrawerToc);
              e.stopPropagation();
              window.mouseOverButton = false
            }}
            type={"default"} shape="circle">
            <Icon component={layers_icon} />
          </Button>
        </Tooltip>

        {/* BOTON DEL MOSTRAR TABLA, solo si tenemos resultados añadidos*/}
        {tableHasResults && <Tooltip title={i18next.t('common.tools.table.name')} key={"table"}>
          <Button ref={refButtonTableResults} size='large' onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
            onClick={(e) => {
              setTableVisible(!tableVisible);
              e.stopPropagation();
              window.mouseOverButton = false
            }}
            type={"default"} shape="circle">
            <Icon component={tables_icon} />
          </Button>
        </Tooltip>}

        <ReportsToolbarComponent map={map} QGISPRJ={QGISPRJ} WMTSLAYERS={WMTSLAYERS} mapView={mapView} 
        selectedTool={selectedTool} setSeletedTool={setSeletedTool} onSelectToolChange={onSelectToolChange} 
        editarAspectoCursor={editarAspectoCursor} tourOpen={tourOpen} setTourOpen={setTourOpen} 
        tourSteps={tourStepsReport} setTourSteps={setTourStepsReport}></ReportsToolbarComponent>

        <InfoToolbarComponent map={map} QGISPRJ={QGISPRJ} WMTSLAYERS={WMTSLAYERS} mapView={mapView}
          selectedTool={selectedTool} setSeletedTool={setSeletedTool} onSelectToolChange={onSelectToolChange}
          editarAspectoCursor={editarAspectoCursor} tourOpen={tourOpen} setTourOpen={setTourOpen}
          tourSteps={tourStepsInfo} setTourSteps={setTourStepsInfo} setLoading={setLoading}></InfoToolbarComponent>

        <EditToolbarComponent map={map} QGISPRJ={QGISPRJ} mapView={mapView} selectedTool={selectedTool}
          setSeletedTool={setSeletedTool} onSelectToolChange={onSelectToolChange} editarAspectoCursor={editarAspectoCursor}
          tourOpen={tourOpen} setTourOpen={setTourOpen} tourSteps={tourStepsEdit} setTourSteps={setTourStepsEdit}
          setLoading={setLoading}></EditToolbarComponent>


      </Space>



      {/* DRAWER TOOL MAPAS BASE*/}
      <Drawer title={<div className={showDrawerBasemaps ? "reader" : ""}>{i18next.t('common.tools.basemaps.name')}</div>}
        mask={false}
        placement="right" onClose={() => setShowDrawerBasemaps(false)} open={showDrawerBasemaps}>
        <>
          <ContentBaseLayersComponent QGISPRJ={QGISPRJ} WMTSLAYERS={WMTSLAYERS} map={map} mapView={mapView} />
        </>
      </Drawer>

      {/* DRAWER TOOL TOC*/}
      {
        <>
          {/* !showDrawerToc && <Button type="primary" onClick={toggleDrawer} style={{ position: 'fixed', top: '120px', right: -6, transform: 'rotate(-0.25turn)', zIndex: 999 }}>
            <UpOutlined />
      </Button>*/}
          <Drawer
            title={
              <>
                <div className={showDrawerToc ? "reader" : ""} style={{ position: "relative" }}>
                  {/*<Button type="primary"
                    style={{ transform: 'rotate(-0.25turn)', zIndex: 5000, position: "absolute", left: "-63px", top: "103px" }}
                    onClick={toggleDrawer}>
                    <DownOutlined />
            </Button>*/}
                  {i18next.t('common.tools.toc.name')}
                </div>
              </>

            }
            mask={false}
            closable={true}
            placement="right" onClose={() => { setShowDrawerToc(false); dispatch(cerrarPopoverFilter()) }}
            open={showDrawerToc}
            style={{ overflow: "visible" }}>
            <>
              <div style={{ position: "relative" }}>
                <ContentTocComponent QGISPRJ={QGISPRJ} WMTSLAYERS={WMTSLAYERS} LEGEND={LEGEND} map={map} mapView={mapView} setShowDrawerToc={setShowDrawerToc} showDrawerToc={showDrawerToc} letterSizeLegend={letterSizeLegend} letterColorLegend={letterColorLegend} letterTypeLegend={letterTypeLegend} />
              </div>
            </>
          </Drawer>

        </>


      }

    </>
  );
}

export default ToolbarComponent;
