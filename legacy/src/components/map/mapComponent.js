import { useEffect, useRef, useState } from "react";
import SplitPane, { Pane } from "react-split-pane";
import { BrowserView, MobileView } from "react-device-detect";
import { v4 as uuid } from 'uuid';
import i18next from "i18next";
import { QgisService } from "../../service/qgisService";
import TableComponent from "./tableComponent";
import { Reactor } from "../../utilities/EventsUtilities";
import { getBaseLayers, getWMSLayer, setView } from "../../utilities/mapUtils";
import ToolbarComponent from "./components/toolbarComponent";
import LoadingComponent from "../utils/LoadingComponent";
import SearchComponent from "./components/SearchComponent";
import { isMobile } from 'react-device-detect';
import { Spin, Tour } from "antd";
import { LoadingOutlined } from "@ant-design/icons";
import { useSelector } from "react-redux";
import { generalParams_state } from "../../features/generalParams/generalParamsSlice";
import { getShowLegendParam } from "../../utilities/paramsUtils";

function MapComponent({ map, callbackMapLoaded, setCallbackMapLoaded, blockTools }) {
  const [uid, setUid] = useState();
  const [QGISPRJ, setQGISPRJ] = useState();
  const [WMTSLAYERS, setWMTSLAYERS] = useState();
  const [LEGEND, setLEGEND] = useState(false);
  const [BUSCADOR, setBUSCADOR] = useState(null);

  const getQGISPRJ = async () => {
    setQGISPRJ(null)
    let datos = null
    await QgisService.QGISPRJ(map)
      .then((data) => {
        //console.log("data", data)
        data.mapRef = map;
        //Iniciamos los eventos personalidados del mapa y capas       
        for (var i in data.layers) {
          var layer = data.layers[i];
          //Evento de añadir filtros a la capa
          layer.reactor = new Reactor();
          layer.reactor.registerEvent('filterAdded');
          layer['addFilter'] = function (filter) {
            this.filter = filter;
            this.reactor.dispatchEvent('filterAdded');
          }

          //Evento de añadir orden a la capa 
          layer.reactor.registerEvent('sortAdded');
          layer['addSort'] = function (sortby, sortType) {
            this.sortby = sortby;
            this.sortType = sortType;
            this.reactor.dispatchEvent('sortAdded');
          }
          //Evento de añadir orden a la capa 
          layer.reactor.registerEvent('filterByMapChanged');
          layer['changeFilterByMap'] = function (filterByMap) {
            this.filterByMap = filterByMap;
            this.reactor.dispatchEvent('filterByMapChanged');
          }

          //Se añade un event listener
          layer.reactor.registerEvent('filterByQueryChanged');
          layer['changeFilterByQuery'] = function (filterByQuery) {
            this.filterByQuery = filterByQuery;
            this.reactor.dispatchEvent('filterByQueryChanged');
          }


        }
        datos = data
        setQGISPRJ(data);
      })
      .catch(err => {
        datos = null
        console.log("ERROR", err);
      })
    return datos
  }

  const getWMTSLAYERS = async () => {
    return await QgisService.WMTSLAYERS(map)
  }

  const getLegend = async (QGISPRJ) => {

    let keys = Object.keys(QGISPRJ.layers)
    let layers = keys.join(",")
    //Sino tenemos layers, no hacemos la request, ya que provoca un error en QGIS Server
    if (layers && layers != "") {
      return await QgisService.LEGEND(map, layers)
    }

  }

  const getBuscador = (QGISPRJ) => {
    const buscador = "URBEGIS_NOMINATIM_GEOCODER"
    if (QGISPRJ && QGISPRJ.variables && buscador in QGISPRJ.variables) {
      let propsCopy = JSON.parse(QGISPRJ.variables[buscador]);
      setBUSCADOR(propsCopy)
    } else {
      setBUSCADOR(null)
    }
  }

  const mountProject = async () => {
    setLEGEND(false)
    await getQGISPRJ()
      .then((data) => {
        if (data) {
          Promise.all([getWMTSLAYERS(), getLegend(data)])
            .then((values) => {
              setWMTSLAYERS(values[0])
              setLEGEND(values[1].nodes)
            })
          return data
        }
      })
      .then((data) => {
        getBuscador(data)
      });

  }

  useEffect(() => {
    if (uid) {
      mountProject()
    } else {
      setUid(uuid())
    }
  }, [map, uid])


  function renderMapComponent() {

    if (QGISPRJ && WMTSLAYERS && LEGEND) {
      return <MapComponentLoaded map={map} QGISPRJ={QGISPRJ} 
      WMTSLAYERS={WMTSLAYERS} LEGEND={LEGEND} BUSCADOR={BUSCADOR} uid={uid} callbackMapLoaded={callbackMapLoaded} 
      setCallbackMapLoaded={setCallbackMapLoaded} blockTools={blockTools}></MapComponentLoaded>
    }
    else {
      return <LoadingComponent></LoadingComponent>
    }
  }

  return (
    <>
      {renderMapComponent()}
    </>
  );
}

export default MapComponent;

function MapComponentLoaded({ map, QGISPRJ, WMTSLAYERS, LEGEND, BUSCADOR, uid, callbackMapLoaded, setCallbackMapLoaded, blockTools}) {

  const state_params = useSelector(generalParams_state)


  const mapRef = useRef(null);
  const tableRef = useRef(null);

  const [mapView, setMapView] = useState();
  const [tableVisible, setTableVisible] = useState(false)
  const [tableSize, setTableSize] = useState()
  const [mapOffsets, setMapOffsets] = useState()
  const [showDrawerTocLocalState, setShowDrawerTocLocalState] = useState(false)
  const [loading, setLoading] = useState(false);

  const [tourSteps, setTourSteps] = useState([]);
  const [tourStepsToolbars, setTourStepsToolbars] = useState([]);
  const [tourOpen, setTourOpen] = useState(false);
  const [collapsedMeasures, setCollapsedMeasures] = useState(true)

  //Referencias de elementos que luego utilizaremos en tour de ayuda
  const refButtonZoom = useRef(null);
  const refButtonRotate = useRef(null);
  const refButtonHome = useRef(null);
  const refButtonMeasures = useRef(null);
  const refButtonLocation = useRef(null);

  let initMapView = async () => {



    //Calculamos el tamaño de la tabla en función del tamaño del mapa
    let map_offsets = document.getElementById("map_" + uid).getBoundingClientRect();
    setTableSize(map_offsets.bottom - map_offsets.top - 235)
    setMapOffsets(map_offsets)


    // Obtención del CRS EPSG:25830.
    var crs = new window.L.Proj.CRS('EPSG:25830',
      '+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs', //http://spatialreference.org/ref/epsg/25830/proj4/
      {
        resolutions: [2048, 1024, 512, 256, 128, 64, 32, 16, 8, 4, 2, 1, 0.5],
        //Origen de servicio teselado
        origin: [0, 0]
      });

    //Inicializamos el mapa
    var mapView = window.L.map("map_" + uid, {
      //crs: crs,
      attributionControl: false,
      editable: true,
      minZoom: 0,
      maxZoom: 25,
      zoom: 9,
      scrollWheelZoom: false,
      zoomControl: false,

      //ROTACION      
      rotate: true,
      rotateControl: null,

      //HOME      
      defaultExtentControl: false,

      bearing: 0
    });


    //zoom personalizado
    let customZoomControl = new window.L.Control.Zoom({
      position: 'topleft',
      zoomInTitle: i18next.t("common.tools.zoom.zoomin"),
      zoomOutTitle: i18next.t("common.tools.zoom.zoomout")
    });

    customZoomControl.addTo(mapView);

    //Rotación   
    let customRotationControl = new window.L.control.rotate({
      title: "Hola",
      closeOnZeroBearing: false
    });
    customRotationControl.addTo(mapView);

    //Extension inicial   
    let defaultExtent = new window.L.control.defaultExtent({ title: i18next.t("common.tools.zoom.zoomdefault") })
    defaultExtent.addTo(mapView);




    //SCALEBAR
    window.L.control.betterscale({ position: "bottomleft", metric: true, imperial: false }).addTo(mapView);

    mapView.on('zoomend', function () {
      if (mapView.wmsLayer) {
        //mapView.wmsLayer.wmsParams.random =  Math.random() //Con esto evitamos que el navegador cachee las imágenes
        /*
        setTimeout(function() {
          mapView.wmsLayer.setParams({ fake: Date.now() }, false);
      }, 500);   */
      }
    });

    mapView.QGISPRJ = QGISPRJ;
    mapView.WMTSLAYERS = WMTSLAYERS;

    window.map01 = mapView;//SOLO PARA PRUEBAS

    mapView.showTable = (layer) => {
      tableRef.current.addLayer(layer, mapView);
    }

    setView(mapView, QGISPRJ.viewExtent);


    //LOCALZIACIÓN
    let lc = window.L.control
      .locate({
        strings: {
          title: i18next.t('common.tools.location.name')
        }
      })
      .addTo(mapView);



    let baseLayers = await getBaseLayers(mapView, WMTSLAYERS);
    if (baseLayers != null && baseLayers.length > 0 && baseLayers[0] != null) {
      baseLayers[0].addTo(mapView);
      mapView.baseLayer = baseLayers[0];
    }


    var wmsLayer = await getWMSLayer(mapView);
    if (wmsLayer) {
      wmsLayer.addTo(mapView);
      mapView.wmsLayer = wmsLayer;
    }

    
    setMapView(mapView);

    loadHelpSteps();

    if(mapView && setCallbackMapLoaded){
      setCallbackMapLoaded(mapView)
    }

  }

  const loadHelpSteps = () => {
    let steps = [...tourSteps];

    steps.push({
      title: i18next.t('common.tools.help.map.title'),
      description: i18next.t('common.tools.help.map.description'),
    })

    steps.push({
      title: i18next.t('common.tools.help.map.navigation.button.title'),
      description: (
        <div>
          {i18next.t('common.tools.help.map.navigation.button.description')}
          <div style={{ display: 'flex', alignItems: 'center', marginTop: '10px' }}>
            <img
              src="/shift_key.png"
              alt="shift key"
              style={{ width: '100px', height: 'auto', marginRight: '10px' }}
            />
            <img
              src="/shift_key_name.png"
              alt="shift key name"
              style={{ width: '100px', height: 'auto' }}
            />
          </div>
        </div>
      ),
      placement: 'right',
      target: () => refButtonZoom.current,
    })

    steps.push({
      title: i18next.t('common.tools.help.map.rotation.button.title'),
      description: i18next.t('common.tools.help.map.rotation.button.description'),
      placement: 'right',
      target: () => refButtonRotate.current,
    })

    steps.push({
      title: i18next.t('common.tools.help.map.home.button.title'),
      description: i18next.t('common.tools.help.map.home.button.description'),
      placement: 'right',
      target: () => refButtonHome.current,
    })

    steps.push({
      title: i18next.t('common.tools.help.map.measures.button.title'),
      description: i18next.t('common.tools.help.map.measures.button.description'),
      placement: 'right',
      target: () => refButtonMeasures.current,
    })

    steps.push({
      title: i18next.t('common.tools.help.map.location.button.title'),
      description: i18next.t('common.tools.help.map.location.button.description'),
      placement: 'right',
      target: () => refButtonLocation.current,
    })

    setTourSteps(steps)

  }

  const getTourSteps = () => {
    return tourSteps.concat(tourStepsToolbars)
  }

  useEffect(() => {

    if (state_params.length > 0) {
      let showLegend = getShowLegendParam(state_params);

      if (showLegend == "1") {
        setShowDrawerTocLocalState(true)
      }
      else if (showLegend == "0") {
        setShowDrawerTocLocalState(false)
      }
      else {
        console.log("no ha cargado el parametro de show leyenda")
      }
    }

  }, [state_params])

  useEffect(() => {
    if (mapView) {
      //mapView.remove();
    }

    initMapView()

  }, [map])

  useEffect(() => {
    if (mapView) {

      window.L.Measure = {
        linearMeasurement: i18next.t('common.tools.measures.linearMeasurement'),
        areaMeasurement: i18next.t('common.tools.measures.areaMeasurement'),
        start: i18next.t('common.tools.measures.start'),
        meter: i18next.t('common.tools.measures.meter'),
        kilometer: i18next.t('common.tools.measures.kilometer'),
        kilometerDecimals: 2,
        squareMeter: i18next.t('common.tools.measures.squareMeter'),
        squareMeterDecimals: 0,
        squareKilometers: i18next.t('common.tools.measures.squareKilometers'),
        squareKilometersDecimals: 2
      };
      //Opciones
      let measureOptions = {
        position: 'topleft',
        title: i18next.t('common.tools.measures.title'),
        collapsed: collapsedMeasures,
        color: '#05f9f9',
      };


      let customControl = window.L.control.measure(measureOptions)

      customControl.addTo(mapView);

      if (isMobile) {

        const maskRight = document.getElementsByClassName("leaflet-control-measure");
        maskRight[0].addEventListener("click", (e) => {
          customControl.remove()
          setCollapsedMeasures(!collapsedMeasures)
        })

      }

    }
  }, [mapView, collapsedMeasures])

  useEffect(() => {
    if (!mapView) {

      initMapView();

    }
    else {
      mapView.invalidateSize(true);
    }
  }, [tableVisible])

  const style = { with: "100%", height: "100%" }

  return (
    <>
      <SplitPane split="horizontal" style={{ position: "relative !important" }}
        minSize={"50"}
        size={
          tableVisible ? 300 : "100%"
          /*
          tableVisible ? localStorage.getItem('urbegis_splitPos') ? parseInt(localStorage.getItem('urbegis_splitPos')) : "50%" : "100%"*/
        }
        defaultSize={
          tableVisible ? 300 : "100%"
          /*
          tableVisible ? localStorage.getItem('urbegis_splitPos') ? parseInt(localStorage.getItem('urbegis_splitPos')) : "50%" : "100%"*/
        }

        onChange={(size) => {
          //Recalculamos tamaño de tabla al cambiar el tamaño del splitpane
          var bottom = mapOffsets.bottom;
          var sizeAux = bottom - size - 50;
          setTableSize(sizeAux)
          mapView.invalidateSize(true);
          //localStorage.setItem('urbegis_splitPos', size + "");
        }}>
        <Pane className="">
          <div ref={mapRef} style={style} id={"map_" + uid}>
            <BrowserView>
              <>
                <div style={{ zIndex: 900, position: "absolute", left: "10px", bottom: "10px" }}>
                  {mapView && WMTSLAYERS && !blockTools && <ToolbarComponent map={map} QGISPRJ={QGISPRJ} mapView={mapView} WMTSLAYERS={WMTSLAYERS} LEGEND={LEGEND} table={tableRef.current} tableVisible={tableVisible} setTableVisible={setTableVisible}
                    tourOpen={tourOpen} setTourOpen={setTourOpen} tourSteps={tourStepsToolbars} setTourSteps={setTourStepsToolbars}
                    showDrawerTocLocalState={showDrawerTocLocalState} setLoading={setLoading}></ToolbarComponent>}
                </div>
                {<>
                  {BUSCADOR && <div style={{ height: "52px", width: "316px", marginRight: "5px", zIndex: 900, position: "sticky", left: "50px", marginTop: "10px" }}
                    onMouseOver={(e) => { mapView.dragging.disable(); mapView.scrollWheelZoom.disable(); window.mouseOverButton = true; }}
                    onMouseOut={(e) => { mapView.dragging.enable(); mapView.scrollWheelZoom.enable(); window.mouseOverButton = false; }}>
                    <SearchComponent
                      mapView={mapView} BUSCADOR={BUSCADOR}
                    ></SearchComponent>
                  </div>}
                </>
                }
              </>

            </BrowserView>
            <MobileView>
              <div className={"leaflet-control-container"} style={{ zIndex: 900, position: "absolute", left: "10px", bottom: "10px" }}>
                {mapView && WMTSLAYERS && !blockTools && <ToolbarComponent map={map} QGISPRJ={QGISPRJ} mapView={mapView} WMTSLAYERS={WMTSLAYERS} LEGEND={LEGEND} table={tableRef.current} tableVisible={tableVisible} setTableVisible={setTableVisible}
                  tourOpen={tourOpen} setTourOpen={setTourOpen} tourSteps={tourStepsToolbars} setTourSteps={setTourStepsToolbars}
                  showDrawerTocLocalState={false} setLoading={setLoading}></ToolbarComponent>}
              </div>
              {<>
                {BUSCADOR && <div style={{ height: "52px", width: "316px", marginRight: "5px", zIndex: 900, position: "sticky", left: "50px", marginTop: "10px" }}
                  onMouseOver={(e) => { mapView.dragging.disable(); mapView.scrollWheelZoom.disable(); window.mouseOverButton = true; }}
                  onMouseOut={(e) => { mapView.dragging.enable(); mapView.scrollWheelZoom.enable(); window.mouseOverButton = false; }}>
                  <SearchComponent
                    mapView={mapView} BUSCADOR={BUSCADOR}
                  ></SearchComponent>
                </div>}
              </>
              }
            </MobileView>

            {/* referencias a ayuda en componentes leaflet. Solo se emplean como referencia en el ROUTER de ayuda*/}
            <div style={{ "position": "absolute", "top": "10px", "left": "10px", zIndex: "-10000" }}>
              {/* NAVEGACION */}
              <div ref={refButtonZoom} style={{
                "width": "30px", "height": "62px"
                , "backgroundColor": "red", "opacity": "0.5"
              }}>
                NAVEGACION
              </div>
              {/* ROTACION */}
              <div ref={refButtonRotate} style={{
                "width": "30px", "height": "30px", marginTop: "12px"
                , "backgroundColor": "red", "opacity": "0.5"
              }}>
                ROTACION
              </div>
              {/* HOME */}
              <div ref={refButtonHome} style={{
                "width": "30px", "height": "30px", marginTop: "12px"
                , "backgroundColor": "red", "opacity": "0.5"
              }}>
                HOME
              </div>
              {/* MEDICIONES */}
              <div ref={refButtonMeasures} style={{
                "width": "30px", "height": "30px", marginTop: "12px"
                , "backgroundColor": "red", "opacity": "0.5"
              }}>
                MEDICIONES
              </div>
              {/* LOCALIZACION GPS */}
              <div ref={refButtonLocation} style={{
                "width": "30px", "height": "30px", marginTop: "12px"
                , "backgroundColor": "red", "opacity": "0.5"
              }}>
                LOCALIZACION GPS
              </div>

            </div>

          </div>
        </Pane>
        <Pane className="">
          {<TableComponent ref={tableRef} tableSize={tableSize} mapDiv={mapRef} mapView={mapView} QGISPRJ={QGISPRJ} tableVisible={tableVisible} setTableVisible={setTableVisible} setLoading={setLoading}></TableComponent>}
        </Pane>
      </SplitPane>
      {/* TOUR CON LA AYUDA */}
      <Tour open={tourOpen} onClose={() => setTourOpen(false)} steps={getTourSteps()} zIndex={2000} />

      {loading && <Spin indicator={<LoadingOutlined style={{ fontSize: 70 }} spin />} spinning={loading} fullscreen></Spin>}

    </>
  );

}


