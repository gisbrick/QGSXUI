import { useEffect, useRef, useState } from "react";
import { Reactor } from "../../utilities/EventsUtilities";
import { refreshWMSLayer } from "../../utilities/mapUtils";
import { QgisService } from "../../service/qgisService";


const SurveyComponent = ({ map, layer, mapView, tablesResult, setSelected }) => {

    const [QGISPRJ, setQGISPRJ] = useState();
    const [qgisLayer, setQgisLayer] = useState();


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


    return (
        <>
            {qgisLayer && <SurveyComponentLoaded map={map} layer={layer} mapView={mapView} tablesResult={tablesResult }
                setSelected={setSelected} QGISPRJ={QGISPRJ} qgisLayer={qgisLayer}></SurveyComponentLoaded>}
        </>
    )
}


export default SurveyComponent

const SurveyComponentLoaded = ({ map, layer, mapView, tablesResult, setSelected, QGISPRJ, qgisLayer }) => {
    console.log("QGISPRJ", QGISPRJ)
    console.log("qgisLayer", qgisLayer)

    //TODO valorar como planteamos que un usuario solo pueda dar de alta un evento den la encuesta
    //Este componente también prodría servir para notificaciones, avisos y sugerencias, admitiendo que un usuario pueda añadir varios elem,entos
   
    const renderSpatialSurvey = () => {
         //TODO modificar QGISPRJ para que solo admita inserts en mapa, y oculte los demás botones, salvo el de mapa base
         //Botones a ocultar: TOC, LEYENDA (si aun lo tenemos), PRINT, INFO
         //Quitar capacidades de la layer, salvo la de inser
        return <>TODO SPATIAL SURVEY</>
    }

    const renderTabularSurvey = () => {
         //TODO abrir directamente un formulario de inser
         //Una vez guardado un insert, resetear el formulario
        return <>TODO TABULAR SURVEY</>
    }

    return (<>
        {qgisLayer.has_geometry && renderSpatialSurvey()}
        {!qgisLayer.has_geometry && renderTabularSurvey()}
    </>)
}