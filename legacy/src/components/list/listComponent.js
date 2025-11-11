import { useEffect } from "react";
import { QgisService } from "../../service/qgisService";
import { useState } from "react";
import { Card, Empty } from "antd";
import LoadingComponent from "../utils/LoadingComponent";
import { Reactor } from "../../utilities/EventsUtilities";
import VirtualScrollTableComponent from "./components/virtualScrollTableComponent";
import { getLastProperties, getOrderedFields, refreshWMSLayer } from "../../utilities/mapUtils";
import { getRowActionMenuComponentWidth } from "./components/rowActionButtonsComponent";
import FormComponentModal from "../form/formComponentModal";
import ConfirmDeleteComponent from "./components/confirmDeleteComponent";
import { drawSelectionFeature } from "../../utilities/mapDrawUtils";
import ConfirmDeleteMultipleComponent from "./components/confirmDeleteMultipleComponent";
import FormsComponentModal from "../form/formsComponentModal";
import { useSelector } from 'react-redux';
import { query_state } from "../../features/query/querySlice";

function ListComponent({ height, map, layer, mapView, tablesResult, tourStepsToolbar, setTourStepsToolbar, setTourStepsRow, setLoading }) {
  const [QGISPRJ, setQGISPRJ] = useState();
  const [qgisLayer, setQgisLayer] = useState();


  const getQGISPRJ = () => {
    QgisService.QGISPRJ(map)
      .then((data) => {
        setQGISPRJ(data);
        if (layer in data.layers) {
          var qgislayer = data.layers[layer];


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
  }, [])


  function renderListComponent() {

    if (QGISPRJ) {
      if (qgisLayer) {
        return <ListComponentLoaded height={height} map={map} layer={layer} mapView={mapView} QGISPRJ={QGISPRJ} qgisLayer={qgisLayer} tablesResult={tablesResult} tourStepsToolbar={tourStepsToolbar} setTourStepsToolbar={setTourStepsToolbar} setTourStepsRow={setTourStepsRow}
        setLoading={setLoading}></ListComponentLoaded>
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
      <Card
        size="small"
        bordered={true}
        style={{}}>
        {renderListComponent()}
      </Card>
    </>
  );
}
export default ListComponent;

function ListComponentLoaded({ height, map, layer, mapView, QGISPRJ, qgisLayer, tablesResult, tourStepsToolbar, setTourStepsToolbar, setTourStepsRow, setLoading }) {

  const [count, setCount] = useState();
  const [totalCount, setTotalCount] = useState()
  const [virtualData, setVirtualData] = useState();
  const [columns, setColumns] = useState();

  const [selection, setSelection] = useState();
  const [selectionGraphics, setSelectionGraphics] = useState();

  const [viewForm, setViewForm] = useState();
  const [viewForms, setViewForms] = useState(); //Para editar múltiples features
  const [viewDeleteFeature, setViewDeleteFeature] = useState();
  const [viewDeleteFeatures, setViewDeleteFeatures] = useState();
  const [viewFormEditable, setViewFormEditable] = useState();
  const [formFeatureForm, setFormFeatureForm] = useState();
  const [formFeaturesForm, setFormFeaturesForm] = useState(); //Para editar múltiples features
  const [fieldsValueRelations, setFieldsValueRelations] = useState();
  const [showInfoSheet, setShowInfoSheet] = useState(true)

  const querystate = useSelector(query_state);

  //Para que sirve?
  const maxWidth = 500;

  const loadData = () => {
    let bbox = null;
    if (mapView && qgisLayer.filterByMap) {
      let mapBbox = mapView.getBounds();
      bbox = mapBbox._southWest.lng + "," + mapBbox._southWest.lat + "," + mapBbox._northEast.lng + "," + mapBbox._northEast.lat;
    }
    QgisService.GETCOUNTFEATURES(map, layer, null, null, qgisLayer.filter, bbox, qgisLayer.sortby)
      .then((data) => {
        setTotalCount(data.numberOfFeatures)
      })
      .catch(err => {
        console.log("ERROR", err);
      });
  }


  const reloadData = () => {
    //Evaluamos si tenemos que hacer filtro por extensión del mapa
    let bbox = null;
    if (mapView && qgisLayer.filterByMap) {
      let mapBbox = mapView.getBounds();
      bbox = mapBbox._southWest.lng + "," + mapBbox._southWest.lat + "," + mapBbox._northEast.lng + "," + mapBbox._northEast.lat;
    }
    if (qgisLayer.filterByQuery) {
    }
    //TODO
    //Evaluamos si tenemos que hacer un filtro por query


    QgisService.GETCOUNTFEATURES(map, layer, null, null, qgisLayer.filter, bbox, qgisLayer.sortby)
      .then((data) => {
        setCount(data);
        //Inicializamos los datos virtuales del listado (solo los índices)
        let dataAux = Array.from(
          {
            length: data.numberOfFeatures,
          },
          (_, key) => ({
            key,
          }),
        );

        setVirtualData(dataAux);

      })
      .catch(err => {
        console.log("ERROR", err);
      });
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
          //let graphic = tablesResult["graphicsLayer"].getLayer(selectionGraphicsAux[selection]["_leaflet_id"])
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
    //Refresh debería devolver la tabla y el mapa a su versión original
    "refresh": (feature) => {
      reloadData();
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
      //setFormFeatureForm({});

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
    "deleteSelection": (feature) => {
      setViewDeleteFeatures(true);
    },
    "viewSelection": (feature) => {
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



  const getTextWidth = (text) => {
    if (!text) return 0;
    const constParam = 6;
    let out = (50) + text.length * constParam;

    out = out > maxWidth ? maxWidth : out;
    return out;
  }

  const initColumnsWidth = (fields, widths) => {
    let columnsAux = [{
      title: '',
      dataIndex: null,
      width: getRowActionMenuComponentWidth(qgisLayer), //calcula anchura en base a herramientas activas
    }];

    for (var i in fields) {
      let field = fields[i];
      let column = {
        title: field.alias ? field.alias : field.name,
        dataIndex: field.name,
        width: widths[field.name],
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

  const initColumns = (fields) => {
    //Evaluamos el ancho de cada columna en función de las 20 primeras
    //Evaluamos el ancho en función del nombre del campo
    let widths = {};
    for (var i in fields) {
      let field = fields[i];
      widths[field.name] = getTextWidth(field.alias ? field.alias : field.name)
    }

    //Evaluamos si tenemos que hacer filtro por extensión del mapa
    let bbox = null;
    if (mapView && qgisLayer.filterByMap) {
      let mapBbox = mapView.getBounds();
      bbox = mapBbox._southWest.lng + "," + mapBbox._southWest.lat + "," + mapBbox._northEast.lng + "," + mapBbox._northEast.lat;
    }
    //map, layer, maxFeatures, startIndex, expFilter, bbox, sortby
    //Evaluamos el ancho en función de los primeros 20 registros
    QgisService.GETFEATURES(map, layer, 20, 0, qgisLayer.filter, bbox, qgisLayer.sortby, qgisLayer.sortType)
      .then((data) => {
        for (var i in data.features) {
          let feature = data.features[i];
          for (var i in fields) {
            let field = fields[i];
            let w = getTextWidth(feature.properties[field.name])
            let config = JSON.parse(field.editorWidgetSetup.config)
            if (w > widths[field.name] && !config.IsMultiline) {
              widths[field.name] = w;
            }
          }
        }
        initColumnsWidth(fields, widths);
      })
      .catch(err => {
        console.log("ERROR", err);
      })
  }

  const loadValueRelations = async (fields) => {
    //Inicio las value relation     
    let fieldsValueRelationsCopy = {}
    for (let i in fields) {
      let field = fields[i]
      let config = JSON.parse(field.editorWidgetSetup.config);
      if (field.editorWidgetSetup.type == "ValueRelation") {
        fieldsValueRelationsCopy[field.name] = await QgisService.GETFEATURES(map, config.LayerName, 10000, 0, config.FilterExpression, null, null, null)
          .then((data) => {
            let newValues = {}
            for (var i in data.features) {
              let feature = data.features[i];
              newValues[feature.properties[config.Key]] = feature.properties[config.Value]
            }
            return newValues
          })
          .catch(err => {
            console.log("ERROR", err);
          })
      }
    }
    setFieldsValueRelations(fieldsValueRelationsCopy)
  }

  useEffect(() => {

    if (qgisLayer.attributeTableConfig && qgisLayer.attributeTableConfig.sortExpression && qgisLayer.attributeTableConfig.sortExpression != "") {
      qgisLayer.sortby = qgisLayer.attributeTableConfig.sortExpression.replaceAll('"', '')
      qgisLayer.sortType = qgisLayer.attributeTableConfig.sortOrder == "0" ? "ASC" : "DESC";
    }
    // Usage
    let fields = getOrderedFields(qgisLayer, true);
    loadValueRelations(fields)
    initColumns(fields);
    setSelection([])
    reloadData();
    loadData()
    qgisLayer.reactor.addEventListener('sortAdded', function () {
      setVirtualData([]);
      reloadData();
    });

    qgisLayer.reactor.addEventListener('filterByMapChanged', function () {
      setVirtualData([]);
      reloadData();
    });

    //TODO
    //Añadir un event listener para el filtro por query
    qgisLayer.reactor.addEventListener('filterByQuery', function () {
      console.log("actura el event")
      setVirtualData([]);
      reloadData();
    });

    if (mapView) {

      //Iniciamos la capa de gráficos y la añadimos al mapa
      tablesResult["graphicsLayer"] = window.L.featureGroup([]);
      mapView.addLayer(tablesResult["graphicsLayer"]);

      //Ponemos por defecto que la tabla filtre por mapa, dependiendo del estado actual de la layer
      //qgisLayer.filterByMap = false;

      mapView.on('moveend', function (e) {
        if (qgisLayer.filterByMap) {
          //REFRESCA FILTRO PARA FILTRAR POR EXTENSiÖNDE MAPA
          //setVirtualData([]);
          reloadData();
        }
      });
    }
  }, [])

  /**
   * Cuando se modifica el estado de la query, se ejecuta la funcion reloadData()
   */
  useEffect(() => {
    reloadData()
  }, [querystate])


  function renderListComponentLoaded() {

    if (typeof count !== 'undefined' && columns && selection) {
      return (
        <>

          <VirtualScrollTableComponent fieldsValueRelations={fieldsValueRelations} map={map} layer={layer} QGISPRJ={QGISPRJ} qgisLayer={qgisLayer} count={count} totalCount={totalCount} mapView={mapView}
            columns={columns} virtualData={virtualData} scroll={{ y: height, x: '100vw' }} tableActions={tableActions} selection={selection} setSelection={setSelection}
            tourStepsToolbar={tourStepsToolbar} setTourStepsToolbar={setTourStepsToolbar} setTourStepsRow={setTourStepsRow}>
          </VirtualScrollTableComponent>
          {viewForm && <FormComponentModal 
          QGISPRJ={QGISPRJ} map={map} editable={viewFormEditable} feature={formFeatureForm} layer={layer}
           qgisLayer={qgisLayer} mapView={mapView} reload={reloadData} setVisible={setViewForm}
           showInfoSheet={showInfoSheet} setShowInfoSheet={setShowInfoSheet} setLoading={setLoading}>
          </FormComponentModal>}
          {viewForms && <FormsComponentModal 
          QGISPRJ={QGISPRJ} map={map} editable={viewFormEditable} features={formFeaturesForm} layer={layer} 
          qgisLayer={qgisLayer} mapView={mapView} reload={reloadData} visible={viewForms} setVisible={setViewForms}
          showInfoSheet={showInfoSheet} setShowInfoSheet={setShowInfoSheet} setLoading={setLoading}>
          </FormsComponentModal>}
          {viewDeleteFeature && <ConfirmDeleteComponent map={map} feature={formFeatureForm} layer={layer} qgisLayer={qgisLayer}
            mapView={mapView} reload={reloadData} setVisible={setViewDeleteFeature} setModalOpen={null}
            setLoading={setLoading}>
          </ConfirmDeleteComponent>}
          {viewDeleteFeatures && <ConfirmDeleteMultipleComponent map={map} selection={selection} tableActions={tableActions} layer={layer} qgisLayer={qgisLayer}
            mapView={mapView} reload={reloadData} setVisible={setViewDeleteFeatures} setModalOpen={null} setLoading={setLoading}>
          </ConfirmDeleteMultipleComponent>}
        </>
      )
    }
    else {
      return <LoadingComponent></LoadingComponent>
    }
  }


  return (
    <>
      {renderListComponentLoaded()}
    </>
  )
}