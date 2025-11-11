import { store } from "../app/store";
import { ServicesConfig } from "../service/servicesConfig";
import { dateToString, getCartocidiudadFormat } from "./valueUtils";
import { CartociudadService } from "../service/cartociudadService";

//Inicia la extensión de la vista
export function setView(map, viewExtent) {
    var mapBounds = window.L.latLngBounds([
        [viewExtent.yMaximum, viewExtent.xMinimum],
        [[viewExtent.yMinimum, viewExtent.xMaximum]]
    ]);

    map.fitBounds(mapBounds);

    //map.setView([51.505, -0.09], 13);
}

//Devuelve los filtros configurados en las capas qgis
export function getWMSFilters(QGISPRJ, layers) {
    //&FILTER=countries_shapeburst,countries:"name" = 'France';places: "name" = 'Paris'
    let filters = [];
    for (let i in layers) {
        if (layers[i] in QGISPRJ.layers) {
            let qgslayer = QGISPRJ.layers[layers[i]]
            if (qgslayer.filter) {
                filters.push(layers[i] + ": " + qgslayer.filter.replaceAll("1=1 AND ", ""))
            }
            else {
                //filters.push(layers[i])
            }
        }

    }
    return filters.join(';')
}

//Devuelve una capa WMS
export async function getWMSLayer(map) {
    let random = Math.random();//Con esto evitamos que el navegador cachee las imágenes

    let url = ServicesConfig.getBaseUrl() + "/qgis?SERVICE=WMS&REQUEST=GETMAP&MAP=" + map.QGISPRJ.mapRef.map + "&UNIT=" + map.QGISPRJ.mapRef.unit + "&PERMISSION=" + map.QGISPRJ.mapRef.permission;

    //Añadimos el token si el usuario está logueado
    const state = store.getState();
    if (state.user.logged) {
        url = url + "&TOKEN=" + state.user.token
    }
    let layers = getVisibleLayersInChildren(map.QGISPRJ.layerTree.children, [], map.WMTSLAYERS);
    let filter = getWMSFilters(map.QGISPRJ, layers);

    //TODAS ESTOS METODOS FUNCIONAN, PERO DE MOMENTO DEJO EL MÉTODO DE L.WMS.overlay, YA QUE LOS OTROS TIENEN PROBLEMAS DE REFESCO DE TILES
    //var wmsLayer = window.L.tileLayer.wms(url, {
    //var wmsLayer = window.L.WMS.tileLayer(url, {
    var wmsLayer = window.L.WMS.overlay(url, {
        tiled: false,
        layers: layers.toString(),
        filter: filter,
        format: 'image/png',
        transparent: true,
        maxZoom: 25,
        random: Math.random() //Con esto evitamos que el navegador cachee las imágenes
    });

    /*
      var wmsLayer = L.tileLayer.wms('http://ows.mundialis.de/services/service?', {
      layers: 'TOPO-OSM-WMS'
  }).addTo(map);*/
    return wmsLayer;
}

//Devuelve las capas visi8bles en un hijo del TOC
export function getVisibleLayersInChildren(children, visibleLayers, WMTSLAYERS) {

    let childrenAux = children.slice().reverse();
    for (var i in childrenAux) {
        let child = childrenAux[i];

        if (typeof child.isVisible != "boolean") {//Nos aseguramos que sea boleano
            child.isVisible = child.isVisible.toLowerCase() === 'true';
        }
        if ("children" in child && child.isVisible) {
            let visibleLayersAux = getVisibleLayersInChildren(child["children"], visibleLayers, WMTSLAYERS);
            visibleLayers.concat(visibleLayersAux)
        }
        else {
            if (child.isVisible && !layerIsBaseLayer(child.name, WMTSLAYERS)) {
                visibleLayers.push(child.name)
            }
        }
    }
    return visibleLayers;
}


//Indica si una capa es baselayer
export function layerIsBaseLayer(layerName, WMTSLAYERS) {
    let out = false;
    for (var i in WMTSLAYERS.layers) {
        if (!out) out = WMTSLAYERS.layers[i].name == layerName;
    }

    return out;
}

//Devuelve los campos en orden
export function getOrderedFields(qgisLayer, visible) {
    let out = [];
    //let orderIndex = getFieldsOrdererdIndex(qgisLayer, visible);
    let orderNames = getFieldsOrdererdName(qgisLayer, visible);
    for (var i in orderNames) {
        out.push(getFieldByName(qgisLayer, orderNames[i]))
    }

    return out;
}

//Devuleve el orden de los índices de los campos de la capa
export function getFieldsOrdererdIndex(qgisLayer, visible) {
    let out = [];

    let readTabs = (tabs, indexList) => {
        for (let i in tabs) {
            let tab = tabs[i];
            if (tab.classType == "QgsAttributeEditorField") {
                if (visible) {
                    let field = getFieldByName(qgisLayer, tab.name)
                    if (field && field.editorWidgetSetup && field.editorWidgetSetup.type != 'Hidden') {
                        indexList.push(tab.idx);
                    }
                }
                else {
                    indexList.push(tab.idx);
                }

            }
            else if (tab.classType == "QgsAttributeEditorContainer" && tab.children) {
                readTabs(tab.children, indexList);
            }
        }

    }

    readTabs(qgisLayer.editFormConfig.tabs, out);

    return out;
}

//Devuleve el orden de los nombres de los campos de la capa, además selecciona una serie de campos
export function getFieldsOrdererdName(qgisLayer, visible) {
    let out = [];

    let readTabs = (tabs, nameList) => {
        for (let i in tabs) {
            let tab = tabs[i];
            if (tab.classType == "QgsAttributeEditorField") {
                if (visible) {
                    let field = getFieldByName(qgisLayer, tab.name)
                    if (field && field.editorWidgetSetup && field.editorWidgetSetup.type != 'Hidden') {
                        nameList.push(tab.name);
                    }
                }
                else {
                    nameList.push(tab.name);
                }

            }
            else if (tab.classType == "QgsAttributeEditorContainer" && tab.children) {
                readTabs(tab.children, nameList);
            }
        }

    }
    if(qgisLayer.editFormConfig) {
        readTabs(qgisLayer.editFormConfig.tabs, out);
    }

    return out;
}

export function getFieldByName(qgisLayer, fieldName) {
    let out = null
    for (let i in qgisLayer.fields) {
        if (qgisLayer.fields[i].name == fieldName) out = qgisLayer.fields[i]
    }
    return out
}

//Devuelve la lista de capas base
export async function getBaseLayers(map, WMTSLAYERS) {
    return new Promise(async function (resolve, reject) {
        if (!WMTSLAYERS.layers || WMTSLAYERS.layers.length === 0) resolve([]);

        let out = [];

        for (var i in WMTSLAYERS.layers) {
            let WMTSLAYER = WMTSLAYERS.layers[i];
            let baseLayer = await getBaseLayer(map, WMTSLAYER);
            if (baseLayer != null) {
                baseLayer.WMTSLAYER = WMTSLAYER;
                out.push(baseLayer);
            }
        }
        resolve(out);
    })
}

//Devuelve una capas base
export async function getBaseLayer(map, WMTSLAYER) {
    let baseLayer;
    if (WMTSLAYER.source.type && WMTSLAYER.source.type.toUpperCase() == "XYZ") {
        baseLayer = await getBaseLayerXYZ(map, WMTSLAYER);
        if (baseLayer != null) {
            baseLayer.WMTSLAYER = WMTSLAYER;
        }

    }
    else if (WMTSLAYER.source.tileMatrixSet) {
        baseLayer = await getBaseLayerWMTS(map, WMTSLAYER);
        if (baseLayer != null) {
            baseLayer.WMTSLAYER = WMTSLAYER;
        }
    }
    else {
        baseLayer = await getBaseLayerWMS(map, WMTSLAYER);
        if (baseLayer != null) {
            baseLayer.WMTSLAYER = WMTSLAYER;
        }
    }
    return baseLayer;
}


//Devuelve una capa base XYZ
export function getBaseLayerXYZ(map, WMTSLAYER) {
    return new Promise(async function (resolve, reject) {
        let out = window.L.tileLayer(decodeURIComponent(WMTSLAYER.source.url), {
            maxZoom: WMTSLAYER.zmax,
        });
        resolve(out);
    })
}

//Devuelve una capa base WMTS
export async function getBaseLayerWMS(map, WMTSLAYER) {
    return new Promise(async function (resolve, reject) {
        /*
        const serveiTopoCache = window.L.tileLayer.wms("https://geoserveis.icgc.cat/icc_mapesmultibase/utm/wms/service?", {
            layers: 'topo',
            format: 'image/jpeg',
            crs: "25831",
            continuousWorld: true,
            attribution: 'Institut Cartogràfic i Geològic de Catalunya',
        });
        resolve(serveiTopoCache);
        return*/

        let out = window.L.tileLayer.wms(decodeURIComponent(WMTSLAYER.source.url), {
            maxZoom: WMTSLAYER.zmax,
            layers: WMTSLAYER.source.layers,
            format: WMTSLAYER.source.format,
            continuousWorld: true
        });
        resolve(out);
    })
}
//Devuelve una capa base WMTS
export async function getBaseLayerWMTS(map, WMTSLAYER) {
    return new Promise(async function (resolve, reject) {

        let url = decodeURIComponent(WMTSLAYER.source.url);
        let baseUrl = url.split("?")[0];
        let searchParams = null;
        if (url.split("?").length > 1) {
            searchParams = new URLSearchParams(url.split("?")[1]);
        }

        let compatibleTileMatrixTexts = ["3857", "GoogleMaps"]//["4326", "3857", "GoogleMaps"] //TODO Por algún motivo no carga bien la 4326, no gestiona bien la posivión XY de las tiles
        let getTilematrix = function (name) {

            let out = null;
            for (let i in compatibleTileMatrixTexts) {
                if (!out && name.toUpperCase().includes(compatibleTileMatrixTexts[i].toUpperCase())) {
                    out = name;
                }
            }
            return out;
        }

        var options = {
            layers: WMTSLAYER.source.layers,
            styles: WMTSLAYER.source.styles,
            format: WMTSLAYER.source.format,
            SRS: WMTSLAYER.source.crs,
            maxZoom: 25,
            continuousWorld: true
        };

        async function getCapabilities() {
            return new Promise(async function (resolve, reject) {
                var text = await getXMLfromURL(baseUrl + "?request=getCapabilities");
                if (!text) resolve(null);
                let parser = new DOMParser();
                let xmlDoc = parser.parseFromString(text, "text/xml");


                var tileMatrixSetNodes = xmlDoc.getElementsByTagName("TileMatrixSet");

                var zoomLevels = null;
                var tilematrixSetPrefix = null;
                for (var i = 0; i < tileMatrixSetNodes.length; i++) {
                    var identifier = tileMatrixSetNodes[i].getElementsByTagName("ows\:Identifier")[0];
                    if (identifier) {
                        var tms = getTilematrix(identifier.innerHTML)
                        tilematrixSetPrefix = null;
                        if (tms) {
                            options["tilematrixSet"] = tms;
                            zoomLevels = tileMatrixSetNodes[i].getElementsByTagName("TileMatrix").length - 1;

                            if (tileMatrixSetNodes[i].getElementsByTagName("TileMatrix").length > 0) {
                                var tileMatrixIdentifier = tileMatrixSetNodes[i].getElementsByTagName("TileMatrix")[0].getElementsByTagName("ows\:Identifier")[0].textContent;
                                if (tileMatrixIdentifier.includes(":")) {
                                    tilematrixSetPrefix = tileMatrixIdentifier.substring(0, tileMatrixIdentifier.lastIndexOf(":"))
                                }
                            }
                        }
                    }
                }
                if (zoomLevels) {
                    options["maxNativeZoom"] = zoomLevels;
                }
                if (tilematrixSetPrefix) {
                    options["tilematrixSetPrefix"] = tilematrixSetPrefix;
                }


                let layer = new window.L.TileLayer.WMTS(baseUrl, options);
                resolve(layer);
                /*
                let layer = new window.L.tileLayer.wms(baseUrl, options);
                resolve(layer);*/


            })
        }

        let out = await getCapabilities();
        resolve(out);
    });
}

async function getXMLfromURL(url) {
    return new Promise(function (resolve, reject) {
        fetch(url)
            .then((response) => response.text())
            .then((textResponse) => resolve(textResponse))
            .catch((error) => {
                console.log("ERROR", error);
                resolve(null)
            });
    })
}

export function getQgisLayerByLayerId(QGISPRJ, layerId) {
    let out = null
    for (let i in QGISPRJ.layers) {
        if (QGISPRJ.layers[i].id == layerId) {
            out = QGISPRJ.layers[i]
        }
    }
    return out
}

export function getLayerFieldsByIndexes(qgisLayer, fieldIndexes) {
    let out = []

    for (let i in fieldIndexes) {
        out.push(qgisLayer.fields[fieldIndexes[i]])
    }
    return out
}

export function getLayerFieldByName(qgisLayer, fieldName) {
    let out = null

    for (let i in qgisLayer.fields) {
        if (qgisLayer.fields[i].name == fieldName) out = qgisLayer.fields[i]
    }
    return out
}

export async function refreshWMSLayer(mapView) {
    if (mapView.wmsLayer) {
        //mapView.wmsLayer.wmsParams.random =  Math.random() //Con esto evitamos que el navegador cachee las imágenes
        setTimeout(async function () {
            mapView.wmsLayer.remove();
            var wmsLayer = await getWMSLayer(mapView);
            wmsLayer.addTo(mapView);
            mapView.wmsLayer = wmsLayer;
        }, 100);
    }
}

export function GETOGCFilterEncoding(filter) {
    //let '<Filter><PropertyIsEqualTo><PropertyName>name</PropertyName><Literal>Paris</Literal></PropertyIsEqualTo></Filter>'
    let conditionsOGC = []
    let conditions = filter.split(" AND ")
    for (let i in conditions) {
        if (conditions[i].trim() != "1=1") {
            let c = GETOGCFilterEncodingCondition(conditions[i])
            if (c) conditionsOGC.push(GETOGCFilterEncodingCondition(conditions[i]))
        }

    }
    if (conditionsOGC.length > 0) {
        return "<ogc:Filter><ogc:And>" + conditionsOGC.join("") + "</ogc:And></ogc:Filter>"
    }
    else {
        return ""
    }

}

export function GETOGCFilterEncodingCondition(condition) {

    /**<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc" xmlns:gml="http://www.opengis.net/gml">
<ogc:And>
<ogc:BBOX>
<ogc:PropertyName>geometry</ogc:PropertyName>
<gml:Envelope srsName="EPSG:25830">
<gml:lowerCorner>719914 4663160</gml:lowerCorner>
<gml:upperCorner>730898 4666680</gml:upperCorner>
</gml:Envelope>
</ogc:BBOX>
<ogc:And xmlns:ogc="http://www.opengis.net/ogc">
<ogc:PropertyIsLike xmlns:ogc="http://www.opengis.net/ogc" singleChar="_" escapeChar="\" matchCase="false" wildCard="%">
<ogc:PropertyName xmlns:ogc="http://www.opengis.net/ogc">titulo</ogc:PropertyName>
<ogc:Literal xmlns:ogc="http://www.opengis.net/ogc">%conciert%</ogc:Literal>
</ogc:PropertyIsLike>
<ogc:PropertyIsLessThan xmlns:ogc="http://www.opengis.net/ogc">
<ogc:PropertyName xmlns:ogc="http://www.opengis.net/ogc">precio</ogc:PropertyName>
<ogc:Literal xmlns:ogc="http://www.opengis.net/ogc">15</ogc:Literal>
</ogc:PropertyIsLessThan>
</ogc:And>
</ogc:And>
</ogc:Filter>*/


    let vs, name, value;
    let out

    if (condition.includes("<=")) {
        vs = condition.split("<=")
        name = vs[0].trim().replaceAll("\"", "").replaceAll("'", "")
        value = vs[1].trim().replaceAll("\"", "").replaceAll("'", "")
        out = `<ogc:PropertyIsLessThanOrEqualTo><ogc:PropertyName>${name}</ogc:PropertyName><ogc:Literal>${value}</ogc:Literal></ogc:PropertyIsLessThanOrEqualTo>`
    }
    else if (condition.includes(">=")) {
        vs = condition.split(">=")
        name = vs[0].trim().replaceAll("\"", "").replaceAll("'", "")
        value = vs[1].trim().replaceAll("\"", "").replaceAll("'", "")
        out = `<ogc:PropertyIsGreaterThanOrEqualTo><ogc:PropertyName>${name}</ogc:PropertyName><ogc:Literal>${value}</ogc:Literal></ogc:PropertyIsGreaterThanOrEqualTo>`
    }
    else if (condition.includes("!=")) {
        vs = condition.split("!=")
        name = vs[0].trim().replaceAll("\"", "").replaceAll("'", "")
        value = vs[1].trim().replaceAll("\"", "").replaceAll("'", "")
        out = `<ogc:PropertyIsNotEqualTo><ogc:PropertyName>${name}</ogc:PropertyName><ogc:Literal>${value}</ogc:Literal></ogc:PropertyIsNotEqualTo>`
    }
    else if (condition.includes("=")) {
        vs = condition.split("=")
        name = vs[0].trim().replaceAll("\"", "").replaceAll("'", "")
        value = vs[1].trim().replaceAll("\"", "").replaceAll("'", "")
        out = `<ogc:PropertyIsEqualTo><ogc:PropertyName>${name}</ogc:PropertyName><ogc:Literal>${value}</ogc:Literal></ogc:PropertyIsEqualTo>`
    }
    else if (condition.includes("<")) {
        vs = condition.split("<")
        name = vs[0].trim().replaceAll("\"", "").replaceAll("'", "")
        value = vs[1].trim().replaceAll("\"", "").replaceAll("'", "")
        out = `<ogc:PropertyIsLessThan><ogc:PropertyName>${name}</ogc:PropertyName><ogc:Literal>${value}</ogc:Literal></ogc:PropertyIsLessThan>`
    }
    else if (condition.includes(">")) {
        vs = condition.split(">")
        name = vs[0].trim().replaceAll("\"", "").replaceAll("'", "")
        value = vs[1].trim().replaceAll("\"", "").replaceAll("'", "")
        out = `<ogc:PropertyIsGreaterThan><ogc:PropertyName>${name}</ogc:PropertyName><ogc:Literal>${value}</ogc:Literal></ogc:PropertyIsGreaterThan>`
    }
    if (condition.includes("ILIKE")) {
        vs = condition.split("ILIKE")
        name = vs[0].trim().replaceAll("\"", "").replaceAll("'", "")
        value = vs[1].trim().replaceAll("\"", "").replaceAll("'", "")
        out = `<ogc:PropertyIsLike singleChar="_" escapeChar="\" matchCase="false" wildCard="%"><ogc:PropertyName>${name}</ogc:PropertyName><ogc:Literal>${value}</ogc:Literal></ogc:PropertyIsLike>`
    }

    var isDate = function (date) {
        return (new Date(date) !== "Invalid Date") && !isNaN(new Date(date));
    }
    /*
    if(isDate(value)){//no lo usamos en los filtros de fechas, porque no funciona
        return null
    }
    else{
        return out
    }*/
    return out
}


export function getQgisLayerByTypeName(QGISPRJ, TYPENAME) {
    TYPENAME = TYPENAME.replaceAll(" ", "_")
    let qgisLayer = null
    for (let key in QGISPRJ.layers) {
        if (key.replaceAll(" ", "_") == TYPENAME) {
            qgisLayer = QGISPRJ.layers[key]
        }
    }
    return qgisLayer
}


export function getLastProperties(qgisLayer) {

    if (!qgisLayer.hasOwnProperty("lastInsertProperties")) return {}

    let out = {}
    for (let i in qgisLayer.fields) {
        let field = qgisLayer.fields[i]
        if (field.reuseLastValue && qgisLayer.lastInsertProperties.hasOwnProperty(field.name)) {
            out[field.name] = qgisLayer.lastInsertProperties[field.name]
        }
    }

    return out;
}

export function getLastPropertiesReusable(qgisLayer, properties) {
    let out = {}
    for (let i in qgisLayer.fields) {
        let field = qgisLayer.fields[i]
        if (field.reuseLastValue && properties.hasOwnProperty(field.name)) {
            out[field.name] = properties[field.name]
        }
        if (field.defaultValueDefinition && field.defaultValueDefinition.expression && field.defaultValueDefinition.expression != "") {
            if (field.defaultValueDefinition.expression == "'{username}'") {
                const state = store.getState();
                if (state.user.logged) out[field.name] = state.user.username
            }
            else if (field.defaultValueDefinition.expression == "'{now}'") {
                out[field.name] = dateToString(new Date())
            }
            //TODO Añadir otros valores a documentar por defecto
            else {
                out[field.name] = field.defaultValueDefinition.expression.replaceAll("'", "").replaceAll("\"", "")
            }
        }
    }


    return out;
}

export async function getDefaultProperties(qgisLayer, geomAux, isNewfeature) {
    let out = {}
    let flag = false
    for (let i in qgisLayer.fields) {
        let field = qgisLayer.fields[i]

        if (qgisLayer?.customProperties?.URBEGIS_CARTOCIUDAD_INFO && isNewfeature) {
            let URBEGIS_CARTOCIUDAD_INFO = JSON.parse(qgisLayer?.customProperties?.URBEGIS_CARTOCIUDAD_INFO).columns
            let name = URBEGIS_CARTOCIUDAD_INFO.find((element) => element.name == field.name)
            if(name) {
                flag = true
            }
        }
        if (field.defaultValueDefinition && field.defaultValueDefinition.expression && field.defaultValueDefinition.expression != "") {
            if (field.defaultValueDefinition.expression == "'{username}'") {
                const state = store.getState();
                if (state.user.logged) out[field.name] = state.user.username
            }
            else if (field.defaultValueDefinition.expression == "'{now}'") {
                let date = dateToString(new Date())
                if(field.editorWidgetSetup.config){
                    let config = JSON.parse(field.editorWidgetSetup.config)
                    if(config.field_format){
                        date = dateToString(new Date(), config.field_format)
                    }
                }
               

                out[field.name] = date;               
            }
            //TODO Añadir otros valores a documentar por defecto
            else {
                out[field.name] = field.defaultValueDefinition.expression.replaceAll("'", "").replaceAll("\"", "")
            }
        }
    }
    if (qgisLayer?.customProperties?.URBEGIS_CARTOCIUDAD_INFO && isNewfeature && flag && geomAux) {
        let URBEGIS_CARTOCIUDAD_INFO = JSON.parse(qgisLayer?.customProperties?.URBEGIS_CARTOCIUDAD_INFO)
        let latLong = geomAux.coordinates
        //console.log("latlon", latLong)
        const latitud = latLong[0].toFixed(4)
        const longitud = latLong[1].toFixed(4)
        let data = await CartociudadService.GET_UBICACION(longitud, latitud)
            .then((response) => {
                return response
            })
            .catch((error) => {
                console.log(error)
            })
        if (data) {
            for (let i in URBEGIS_CARTOCIUDAD_INFO.columns) {
                let column = URBEGIS_CARTOCIUDAD_INFO.columns[i]
                //console.log(column)
                let format = column.format
                let value = getCartocidiudadFormat(format, data)
                out[column.name] = value
                //console.log(out[column.name])
            }
        }

    }

    return out;
}


