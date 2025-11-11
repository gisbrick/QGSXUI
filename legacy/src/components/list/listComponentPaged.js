import { useEffect, useRef } from "react";
import { QgisService } from "../../service/qgisService";
import { useState } from "react";
import { Button, Card, Empty, Space, Table, Tooltip, theme, Tour, Spin } from "antd";
import LoadingComponent from "../utils/LoadingComponent";

import { Reactor } from "../../utilities/EventsUtilities";
import { getLastProperties, getOrderedFields, refreshWMSLayer } from "../../utilities/mapUtils";
import RowActionButtonsComponent, { getRowActionMenuComponentWidth } from "./components/rowActionButtonsComponent";
import FormComponentModal from "../form/formComponentModal";
import ConfirmDeleteComponent from "./components/confirmDeleteComponent";
import { drawSelectionFeature } from "../../utilities/mapDrawUtils";
import ValueComponet from "../values/valueComponet";
import TableToolbarComponent from "./components/tableToolbarComponent";
import { CheckOutlined, LoadingOutlined, QuestionCircleOutlined } from "@ant-design/icons";
import i18next from "i18next";
import { BrowserView, MobileView } from "react-device-detect";
import ConfirmDeleteMultipleComponent from "./components/confirmDeleteMultipleComponent";
import FormsComponentModal from "../form/formsComponentModal";
import TableToolbarComponentSelect from "./components/tableToolbarComponentSelect";
import { getBackgroundColorPrimary } from "../../utilities/paramsUtils";
import { useSelector } from "react-redux";
import { generalParams_state } from "../../features/generalParams/generalParamsSlice";
import { getFloatTypes, getIntegerTypes } from "../../utilities/valueUtils";

function ListComponentPaged({ map, layer, mapView, tablesResult, setSelected }) {
  const [QGISPRJ, setQGISPRJ] = useState();
  const [qgisLayer, setQgisLayer] = useState();
  const [loading, setLoading] = useState(false)


  const getQgisLayer = (prj) => {
    if (layer in prj.layers) {
      var qgislayer = prj.layers[layer];

      if (qgislayer.attributeTableConfig && qgislayer.attributeTableConfig.sortExpression && qgislayer.attributeTableConfig.sortExpression != "") {
        qgislayer.sortby = qgislayer.attributeTableConfig.sortExpression.replaceAll('"', '')
        qgislayer.sortType = qgislayer.attributeTableConfig.sortOrder == "0" ? "ASC" : "DESC";
      }

      qgislayer.reactor = new Reactor();
      //Evento de añadir filtros a la capa 
      qgislayer.reactor.registerEvent('filterAdded');
      qgislayer['addFilter'] = function (filter) {
        this.filter = filter;
        this.reactor.dispatchEvent('filterAdded');
        if (mapView) refreshWMSLayer(mapView);
      }

      //Evento de añadir orden a la capa 
      qgislayer.reactor.registerEvent('sortAdded');
      qgislayer['addSort'] = function (sortby, sortType) {
        this.sortby = sortby;
        this.sortType = sortType;
        this.reactor.dispatchEvent('sortAdded');
      }
      //Evento de añadir filtrofilterByMap por bbox map
      qgislayer.reactor.registerEvent('filterByMapChanged');
      qgislayer['changeFilterByMap'] = function (filterByMap) {
        this.filterByMap = filterByMap;
        this.reactor.dispatchEvent('filterByMapChanged');
      }

      setQgisLayer(qgislayer)
    }
  }

  const getQGISPRJ = () => {
    setQGISPRJ(null);
    setQgisLayer(null)
    QgisService.QGISPRJ(map)
      .then((data) => {
        setQGISPRJ(data);
        getQgisLayer(data)

      })
      .catch(err => {
        console.log("ERROR", err);
      })
  }

  useEffect(() => {
    if (mapView) {
      setQGISPRJ(mapView.QGISPRJ);
      if (layer in mapView.QGISPRJ.layers) {
        setQgisLayer(mapView.QGISPRJ.layers[layer])
      }
    }
    else {
      getQGISPRJ();
    }
  }, [layer])


  function renderListComponent() {

    if (QGISPRJ) {
      if (qgisLayer) {
        return <>
          <Card
            size="small"
            bordered={true}
            style={{ width: "fit-content" }}>
            <ListComponentLoaded
              map={map} layer={layer} mapView={mapView} QGISPRJ={QGISPRJ} qgisLayer={qgisLayer}
              tablesResult={tablesResult} setSelected={setSelected} setLoading={setLoading}
            ></ListComponentLoaded>
          </Card>
          {loading && <Spin indicator={<LoadingOutlined style={{ fontSize: 70 }} spin />} spinning={loading} fullscreen></Spin>}
        </>

      }
      else {
        return <Empty />
      }

    }
    else {
      return <LoadingComponent></LoadingComponent>
    }
  }


  return (
    <>
      <BrowserView>
        {renderListComponent()}
      </BrowserView>
      <MobileView>
        {renderListComponent()}
      </MobileView>

    </>
  );
}

export default ListComponentPaged;

function ListComponentLoaded({ height, map, layer, mapView, QGISPRJ, qgisLayer, tablesResult, setSelected, setLoading }) {

  const { token } = theme.useToken();

  const [dataSource, setDataSource] = useState([]);
  const [features, setFeatures] = useState([]);
  const [totalRows, setTotalRows] = useState(0);
  const [loadingTable, setLoadingTable] = useState(false);
  const [loadingTable1, setLoadingTable1] = useState(false);
  const [loadingTable2, setLoadingTable2] = useState(false);
  const [columns, setColumns] = useState();
  const [sortBy, setSortBy] = useState();

  const [selection, setSelection] = useState();
  const [selectionGraphics, setSelectionGraphics] = useState();

  const [viewForm, setViewForm] = useState();
  const [viewForms, setViewForms] = useState(); //Para editar múltiples features
  const [viewDeleteFeature, setViewDeleteFeature] = useState();
  const [viewDeleteFeatures, setViewDeleteFeatures] = useState();
  const [viewFormEditable, setViewFormEditable] = useState();
  const [formFeatureForm, setFormFeatureForm] = useState();
  const [formFeaturesForm, setFormFeaturesForm] = useState(); //Para editar múltiples features

  const [page, setPage] = useState();
  const [pageSize, setPageSize] = useState();

  const rowActionMenuComponentWidth = getRowActionMenuComponentWidth(qgisLayer)

  const [fieldsValueRelations, setFieldsValueRelations] = useState();

  const state_params = useSelector(generalParams_state)
  const [colorbackground, setColorBackground] = useState(token.colorBgContainer)
  const [tourSteps, setTourSteps] = useState([]);
  const [tourStepsToolbar, setTourStepsToolbar] = useState([]);
  const [tourStepsRow, setTourStepsRow] = useState([])
  const [stepsToolbarRow, setStepsToobarRow] = useState([])
  const [tourOpen, setTourOpen] = useState(false);
  const [totalCount, setTotalCount] = useState()
  const [showInfoSheet, setShowInfoSheet] = useState(true)

  const refRow = useRef(null)

  let integerTypes = getIntegerTypes()
  let floatTypes = getFloatTypes()

  useEffect(() => {
    if (state_params.length > 0) {

      let colorHeader = getBackgroundColorPrimary(state_params)

      if (colorHeader) {
        setColorBackground(colorHeader)
      }
    }
  }, [state_params])


  useEffect(() => {
    help()
    loadTotal()
  }, [])

  useEffect(() => {
    setSelection([])
    if (qgisLayer.sortby) {
      setSortByAux(qgisLayer.sortby + " " + qgisLayer.sortType)
    }
    else {
      setSortBy(null)
    }

    let fields = getOrderedFields(qgisLayer, true);
    setFieldsValueRelations(null)
    loadValueRelations(fields)

  }, [map])

  useEffect(() => {
    setLoadingTable(true)
    let fields = getOrderedFields(qgisLayer, true);
    fetchRecords(1, 10)
    setFieldsValueRelations(null)
    loadValueRelations(fields)

  }, [sortBy, map])



  useEffect(() => {
    let steps = [...stepsToolbarRow]
    setTourStepsRow(steps)
  }, [stepsToolbarRow])

  const getTourSteps = () => {
    return tourSteps.concat([...tourStepsToolbar]).concat([...tourStepsRow])
  }

  const help = () => {
    let steps = [];

    steps.push({
      title: i18next.t('common.tools.help.table.rowTools.tools.title'),
      description: i18next.t('common.tools.help.table.rowTools.tools.description'),
      target: () => refRow.current,
    })

    setStepsToobarRow(steps)
  }

  const setSortByAux = (sort) => {
    setSortBy(sort)
    if (sort) {
      let v = sort.split(" ")
      qgisLayer.sortby = v[0]
      qgisLayer.sortType = v[1]
    }
    else {
      qgisLayer.sortby = null
      qgisLayer.sortType = null
    }
  }

  const loadValueRelations = async (fields) => {
    //Inicio las value relation     
    let fieldsValueRelationsCopy = {}
    for (let i in fields) {
      let field = fields[i]
      let config = JSON.parse(field.editorWidgetSetup.config);
      if (field.editorWidgetSetup.type == "ValueRelation") {
        //alert("TODO TOÑO NO SIEMBRE INICIALIZA BIEN LAS VALUERELATIONS")
        setFieldsValueRelations(null)
        setLoadingTable1(true)
        fieldsValueRelationsCopy[field.name] = await QgisService.GETFEATURES(map, config.LayerName, 10000, 0, config.FilterExpression, null, null, null)
          .then((data) => {
            let newValues = {}
            for (var i in data.features) {
              let feature = data.features[i];
              newValues[feature.properties[config.Key]] = feature.properties[config.Value]
            }
            setLoadingTable1(false)
            return newValues
          })
          .catch(err => {
            setLoadingTable1(false)
            console.log("ERROR", err);
          })
      }
    }
    setFieldsValueRelations(fieldsValueRelationsCopy)
    initColumns(fields, fieldsValueRelationsCopy)
  }
  const reload = () => {
    fetchRecords(page, pageSize)
  }

  const renderSort = (field) => {
    //if (sortBy == field.name + " ASC") {
    if (qgisLayer.sortby == field.name && qgisLayer.sortType == "ASC") {
      return <span onClick={(e) => {
        setSortByAux(field.name + " DESC")
      }} className="ant-table-column-sorter ant-table-column-sorter-full"><span className="ant-table-column-sorter-inner" aria-hidden="true"><span role="img" aria-label="caret-up" className="anticon anticon-caret-up ant-table-column-sorter-up active"><svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-up" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M858.9 689L530.5 308.2c-9.4-10.9-27.5-10.9-37 0L165.1 689c-12.2 14.2-1.2 35 18.5 35h656.8c19.7 0 30.7-20.8 18.5-35z"></path></svg></span><span role="img" aria-label="caret-down" className="anticon anticon-caret-down ant-table-column-sorter-down"><svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-down" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z"></path></svg></span></span></span>;
    }
    //else if (sortBy == field.name + " DESC") {
    else if (qgisLayer.sortby == field.name && qgisLayer.sortType == "DESC") {
      return <span onClick={(e) => {
        setSortByAux(null)
      }} className="ant-table-column-sorter ant-table-column-sorter-full"><span className="ant-table-column-sorter-inner" aria-hidden="true"><span role="img" aria-label="caret-up" className="anticon anticon-caret-up ant-table-column-sorter-up"><svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-up" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M858.9 689L530.5 308.2c-9.4-10.9-27.5-10.9-37 0L165.1 689c-12.2 14.2-1.2 35 18.5 35h656.8c19.7 0 30.7-20.8 18.5-35z"></path></svg></span><span role="img" aria-label="caret-down" className="anticon anticon-caret-down ant-table-column-sorter-down active"><svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-down" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z"></path></svg></span></span></span>;
    }
    else {
      return <span onClick={(e) => {
        setSortByAux(field.name + " ASC")
      }} className="ant-table-column-sorter ant-table-column-sorter-full"><span className="ant-table-column-sorter-inner" aria-hidden="true"><span role="img" aria-label="caret-up" className="anticon anticon-caret-up ant-table-column-sorter-up"><svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-up" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M858.9 689L530.5 308.2c-9.4-10.9-27.5-10.9-37 0L165.1 689c-12.2 14.2-1.2 35 18.5 35h656.8c19.7 0 30.7-20.8 18.5-35z"></path></svg></span><span role="img" aria-label="caret-down" className="anticon anticon-caret-down ant-table-column-sorter-down"><svg viewBox="0 0 1024 1024" focusable="false" data-icon="caret-down" width="1em" height="1em" fill="currentColor" aria-hidden="true"><path d="M840.4 300H183.6c-19.7 0-30.7 20.8-18.5 35l328.4 380.8c9.4 10.9 27.5 10.9 37 0L858.9 335c12.2-14.2 1.2-35-18.5-35z"></path></svg></span></span></span>;
    }
  }

  const initColumns = (fields, fieldsValueRelationsCopy) => {
    let columnsAux = [];

    for (var i in fields) {
      let field = fields[i];
      let column = {
        title: <>
          {field.alias ? field.alias : field.name}
          <div style={{ position: "absolute", width: "10px", height: "100%", top: "10px", right: "10px", cursor: "pointer", zIndex: "5" }} >{renderSort(fields[i])}</div>
        </>,
        dataIndex: field.name,
        render: (_, feature, index) => {
          return <ValueComponet map={map} fieldsValueRelations={fieldsValueRelationsCopy} feature={feature} field={field} QGISPRJ={QGISPRJ} qgisLayer={qgisLayer}></ValueComponet>
        }
      }

      let showColumn = true
      if (qgisLayer && qgisLayer.customProperties && qgisLayer.customProperties.URBEGIS_HIDE_TABLE_COLUMNS) {
        try {
          let hideColumns = JSON.parse(qgisLayer.customProperties.URBEGIS_HIDE_TABLE_COLUMNS)
          if (hideColumns.indexOf(field.name) >= 0) {
            showColumn = false
          }
        }
        catch (e) { }
      }

      if (showColumn) columnsAux.push(column);
    }
    setColumns(columnsAux);
  }

  const loadTotal = async () => {
    //Evaluamos si tenemos que hacer filtro por extensión del mapa
    let bbox = null;
    if (mapView && qgisLayer.filterByMap) {
      let mapBbox = mapView.getBounds();
      bbox = mapBbox._southWest.lng + "," + mapBbox._southWest.lat + "," + mapBbox._northEast.lng + "," + mapBbox._northEast.lat;
    }
    setLoadingTable2(true)
    await QgisService.GETCOUNTFEATURES(map, layer, null, null, qgisLayer.filter, bbox, qgisLayer.sortby)
      .then((data) => {
        setTotalCount(data.numberOfFeatures);
        setLoadingTable2(false)
      })
      .catch(err => {
        setLoadingTable2(false)
        console.log("ERROR", err);
      });
  }

  const fetchRecords = async (page, pageSize) => {
    setPage(page)
    setPageSize(pageSize)
    //Evaluamos si tenemos que hacer filtro por extensión del mapa
    let bbox = null;
    if (mapView && qgisLayer.filterByMap) {
      let mapBbox = mapView.getBounds();
      bbox = mapBbox._southWest.lng + "," + mapBbox._southWest.lat + "," + mapBbox._northEast.lng + "," + mapBbox._northEast.lat;
    }


    let sort_by, sort_type = null;
    if (sortBy) {
      let sortValues = sortBy.split(" ")
      sort_by = sortValues[0]
      sort_type = sortValues[1]
    }

    let startIndex = (page - 1) * pageSize

    let promise1 = await QgisService.GETCOUNTFEATURES(map, layer, null, null, qgisLayer.filter, bbox, qgisLayer.sortby);
    let promise2 = await QgisService.GETFEATURES(map, layer, pageSize, startIndex, qgisLayer.filter, bbox, sort_by, sort_type);

    setLoadingTable(true)
    Promise.all([promise1, promise2])
      .then((values) => {
        let data1 = values[0]
        let data2 = values[1]
        setTotalRows(data1.numberOfFeatures);
        setFeatures(data2.features)
        let datasourceAux = []
        for (let i in data2.features) {
          data2.features[i].properties["URBEGIS_FEATURE_ID"] = data2.features[i].id;
          datasourceAux.push(data2.features[i])
        }
        setDataSource(datasourceAux)
        setLoadingTable(false)
      })
      .catch((reason) => {
        setLoadingTable(false)
        console.log("error", reason);
      })
  }

  const tableActions = {
    "select": (feature, selected) => {

      let selectionAux = [...selection]
      let selectionGraphicsAux = { ...selectionGraphics }

      if (!selectionGraphicsAux) selectionGraphicsAux = {};


      if (selected == null) selected = !selectionAux.includes(feature.id)

      if (selected) {
        let selection = feature.id//JSON.stringify(feature);
        selectionAux.push(selection);
        selectionGraphicsAux[selection] = { "feature": feature };
        //Si tenemos mapa y geometría, añadimos la geometría al mapa
        if (mapView) {
          drawSelectionFeature(mapView, tablesResult["graphicsLayer"], feature, selection, selectionGraphicsAux, qgisLayer)
        }
      }
      else {
        let selection = feature.id//JSON.stringify(feature);
        selectionAux.splice(selectionAux.indexOf(selection), 1);

        //Si tenemos mapa y geometría, la borramos de la layer
        if (mapView && selection in selectionGraphicsAux) {
          let graphic = tablesResult["graphicsLayer"].getLayer(selectionGraphicsAux[selection]["_leaflet_id"])
          if (graphic) {
            tablesResult["graphicsLayer"].removeLayer(graphic)
          }

          delete selectionGraphicsAux[selection];
        }
      }

      setSelectionGraphics(selectionGraphicsAux);
      setSelection(selectionAux);


    },
    "refresh": (feature) => {
      reload();
    },
    "delete": (feature) => {
      setViewDeleteFeature(true);
      setViewForm(false);
      setViewFormEditable(false);
      setFormFeatureForm(feature);
    },
    "view": (feature) => {
      setViewDeleteFeature(false);
      setViewForm(true);
      setShowInfoSheet(true)
      setViewFormEditable(false);
      setFormFeatureForm(feature);
    },
    "update": (feature) => {
      setViewDeleteFeature(false);
      setViewForm(true);
      setShowInfoSheet(false)
      setViewFormEditable(true);
      setFormFeatureForm(feature);
    },
    "insert": () => {
      setViewDeleteFeature(false);
      setViewForm(true);
      setViewFormEditable(true);
      setShowInfoSheet(false)
      //setFormFeatureForm(null);

      setFormFeatureForm(getLastProperties(qgisLayer));
    },
    "clearSelection": () => {
      setSelection([])

      //Si tenemos mapa, quitamos todos los gráficos del mapa
      if (mapView) {
        let selectionGraphicsAux = { ...selectionGraphics }
        for (let i in selectionGraphicsAux) {
          let graphic = tablesResult["graphicsLayer"].getLayer(selectionGraphicsAux[i]["_leaflet_id"])
          if (graphic) {
            tablesResult["graphicsLayer"].removeLayer(graphic)
          }
        }
        /*
        for (const [key, value] of Object.entries(selectionGraphicsAux)) {
          let graphic = tablesResult["graphicsLayer"].getLayer(value)
          if (graphic) {
            tablesResult["graphicsLayer"].removeLayer(graphic)
          }
        }*/
      }
      setSelectionGraphics({})

    },
    "zoomSelection": (feature) => {

      mapView.fitBounds(tablesResult["graphicsLayer"].getBounds());
    },
    "zoom": (feature) => {

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
      //mapView.fitBounds(tablesResult["graphicsLayer"].getBounds());      
    },
    "deleteSelection": () => {
      setViewDeleteFeatures(true);
    },
    "viewSelection": () => {
      alert("TODO viewSelection");
    },
    "updateSelection": () => {
      let features = []
      for (let i in selection) {
        features.push(selectionGraphics[selection[i]].feature)
      }
      setFormFeaturesForm(features)
      setShowInfoSheet(false)
      setViewForms(true)
    },
    "toogleFilterByMapExtension": (filter) => {
      alert("TODO filterByMapExtension");
    }
  }

  return (
    <>
      {/* Solo mostramos la toolbar si no estamos en modo selección */}
      {selection && !setSelected &&
        <>
          <div style={{ border: "1px solid", paddingLeft: "5px", paddingBottom: "10px", borderRadius: "5px", background: colorbackground, marginBottom: "5px" }}>
            {/* BOTON TOOL AYUDA*/}
            {<Tooltip title={i18next.t('common.tools.help.name')} key={"maphelp"}>
              <Button onMouseOver={(e) => window.mouseOverButton = true} onMouseOut={(e) => window.mouseOverButton = false}
                onClick={(e) => {
                  setTourOpen(true)
                }}
                type={"default"} shape="circle">
                <QuestionCircleOutlined />
              </Button>
            </Tooltip>}

            <TableToolbarComponent
              map={map} QGISPRJ={QGISPRJ} layer={layer} qgisLayer={qgisLayer} count={totalRows} reload={reload}
              mapView={mapView} columns={columns} tableActions={tableActions} selection={selection}
              tourStepsToolbar={tourStepsToolbar} setTourStepsToolbar={setTourStepsToolbar} totalCount={totalCount}
            ></TableToolbarComponent>
          </div>
        </>
      }
      {/* Si estamos en modo selección. mostramos la herramienta de busqueda */}
      {selection && setSelected &&
        <>
          <div style={{ border: "1px solid", paddingLeft: "5px", paddingBottom: "10px", borderRadius: "5px", background: colorbackground, marginBottom: "5px" }}>
            <TableToolbarComponentSelect map={map} QGISPRJ={QGISPRJ} layer={layer} qgisLayer={qgisLayer} count={totalRows} reload={reload} mapView={mapView} columns={columns} tableActions={tableActions} selection={selection}></TableToolbarComponentSelect>
          </div>
        </>

      }
      {/* TODO añadir en modo de selección una herramineta de búsqueda */}
      <Table
        loading={loadingTable || loadingTable1 || loadingTable2}
        style={{ "--bg-color": colorbackground }}
        rowSelection={{
          hideSelectAll: true,
          columnWidth: rowActionMenuComponentWidth,
          renderCell: (checked, feature, index, originNode) => {
            let selectionCopy = selection ? [...selection] : []
            {/* Solo mostramos los botones si no estamos en modo selección */ }
            if (!setSelected) {
              return <>{
                index == 0 ? <div ref={refRow}><RowActionButtonsComponent
                  map={map} QGISPRJ={QGISPRJ} layer={layer} qgisLayer={qgisLayer} reload={reload} mapView={mapView} index={index} feature={feature} tableActions={tableActions} selection={selectionCopy}>
                </RowActionButtonsComponent></div>
                  : <RowActionButtonsComponent
                    map={map} QGISPRJ={QGISPRJ} layer={layer} qgisLayer={qgisLayer} reload={reload} mapView={mapView} index={index} feature={feature} tableActions={tableActions} selection={selectionCopy}>
                  </RowActionButtonsComponent>}</>
            }
            else {
              return <Space wrap>
                <Tooltip title={i18next.t('common.actions.select.name')}>
                  <Button size='small' onClick={() => setSelected(feature)}
                    type={"default"} shape="circle">
                    <CheckOutlined />
                  </Button>
                </Tooltip>
              </Space>
            }

          }
        }}
        columns={columns}
        dataSource={dataSource}
        width={rowActionMenuComponentWidth}
        pagination={{
          total: totalRows,
          defaultPageSize: 10,
          showSizeChanger: true,
          pageSizeOptions: ['10', '25', '50'],
          onChange: (page, pageSize) => {

            fetchRecords(page, pageSize);
          },
        }}
        bordered
      ></Table>
      {viewForm && <FormComponentModal
        QGISPRJ={QGISPRJ} map={map} editable={viewFormEditable} feature={formFeatureForm}
        layer={layer} qgisLayer={qgisLayer}
        mapView={mapView} reload={reload} setVisible={setViewForm}
        showInfoSheet={showInfoSheet} setShowInfoSheet={setShowInfoSheet}>
      </FormComponentModal>}
      {viewForms && <FormsComponentModal
        QGISPRJ={QGISPRJ} map={map} editable={viewFormEditable} features={formFeaturesForm}
        layer={layer} qgisLayer={qgisLayer} mapView={mapView} reload={reload} visible={viewForms}
        setVisible={setViewForms} showInfoSheet={showInfoSheet} setShowInfoSheet={setShowInfoSheet}>
      </FormsComponentModal>}
      {viewDeleteFeature && <ConfirmDeleteComponent map={map} feature={formFeatureForm} layer={layer} qgisLayer={qgisLayer}
        mapView={mapView} reload={reload} setVisible={setViewDeleteFeature} setModalOpen={null} setLoading={setLoading}>
      </ConfirmDeleteComponent>}
      {viewDeleteFeatures && <ConfirmDeleteMultipleComponent map={map} selection={selection} tableActions={tableActions} layer={layer} qgisLayer={qgisLayer}
        mapView={mapView} reload={reload} setVisible={setViewDeleteFeatures} setModalOpen={null} setLoading={setLoading}>
      </ConfirmDeleteMultipleComponent>}
      {/* TOUR CON LA AYUDA */}
      {tourOpen && <Tour open={tourOpen} onClose={() => { setTourOpen(false); }} steps={getTourSteps()} zIndex={2000} />}
    </>
  )
}