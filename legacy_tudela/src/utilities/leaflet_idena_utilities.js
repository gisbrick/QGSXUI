import mapabase from '../assets/thumbnails/mapabase.png';
import catastro from '../assets/thumbnails/catastro.png';
import mapaBaseGris from '../assets/thumbnails/mapaBaseGris.png';
import mapaTopografico from '../assets/thumbnails/mapaTopografico.png';
import ortofoto from '../assets/thumbnails/ortofoto2023.png';
import ortofoto_1956_57 from '../assets/thumbnails/ortofoto_1956_57.png';
import ortofoto_1927 from '../assets/thumbnails/ortofoto_1927.png';
import base_ortofoto from '../assets/thumbnails/base_ortofoto.png';



export const TUDELA_center_coords = [42.0579023909846, -1.6053622960400569];

export const IDENA_initialZoom = 8;



export const IDENA_resolutions_extended = [

    58514285.714285714 * 0.00028, // Nivel 0
    29257142.857142857 * 0.00028, // Nivel 1
    14628571.428571429 * 0.00028, // Nivel 2
    7314285.7142857143 * 0.00028, // Nivel 3
    3657142.8571428573 * 0.00028, // Nivel 4
    1828571.4285714286 * 0.00028, // Nivel 5
    914285.7142857143 * 0.00028, // Nivel 6
    457142.85714285716 * 0.00028, // Nivel 7
    228571.42857142858 * 0.00028, // Nivel 8
    114285.71428571429 * 0.00028, // Nivel 9
    57142.857142857145 * 0.00028, // Nivel 10
    28571.428571428572 * 0.00028, // Nivel 11
    14285.714285714286 * 0.00028, // Nivel 12
    7142.857142857143 * 0.00028, // Nivel 13
    3571.4285714285716 * 0.00028, // Nivel 14
    1785.7142857142858 * 0.00028, // Nivel 15
    892.8571428571429 * 0.00028, // Nivel 16
    446.42857142857144 * 0.00028, // Nivel 17    
];



export const IDENA_resolutions = [
    3657142.8571428573 * 0.00028, // Nivel 0
    1828571.4285714286 * 0.00028, // Nivel 1
    914285.7142857143 * 0.00028, // Nivel 2
    457142.85714285716 * 0.00028, // Nivel 3
    228571.42857142858 * 0.00028, // Nivel 4
    114285.71428571429 * 0.00028, // Nivel 5
    57142.857142857145 * 0.00028, // Nivel 6
    28571.428571428572 * 0.00028, // Nivel 7
    14285.714285714286 * 0.00028, // Nivel 8
    7142.857142857143 * 0.00028, // Nivel 9
    3571.4285714285716 * 0.00028, // Nivel 10
    1785.7142857142858 * 0.00028, // Nivel 11
    892.8571428571429 * 0.00028, // Nivel 12
    446.42857142857144 * 0.00028, // Nivel 13  
];


export const crs25830_IDENA = new window.L.Proj.CRS('EPSG:25830',
    '+proj=utm +zone=30 +ellps=GRS80 +units=m +no_defs',
    {
        resolutions: IDENA_resolutions,
        origin: [480408, 4861892], // TopLeftCorner de las capabilities
    }
);


// Mapa base IDENA WMTS
L.TileLayer.IDENA_EXTENDED_PNG = L.TileLayer.extend({
    constructor: function (layer) {
        this.layer = layer;
        L.TileLayer.prototype.constructor.call(this);
    },
    initialize: function (layer) {
        this.layer = layer;
        L.TileLayer.prototype.initialize.call(this);
    },
    options: {
        tileSize: 256,      // Tamaño de las teselas en píxeles
    },
    getTileUrl: function (coords) {

        var z = coords.z; // Nivel de zoom del mapa
        var resolutionMap = IDENA_resolutions[z]; // Resolución del mapa en este nivel         
        var zLayer = this.getClosestZoomLevel(resolutionMap, IDENA_resolutions_extended); // Encontrar el nivel de zoom más cercano en la capa
        var resolutionLayer = IDENA_resolutions_extended[zLayer]; // Resolución de la capa en este nivel

        // Calcular el factor de escala entre el mapa y la capa
        var scaleFactor = resolutionMap / resolutionLayer;

        // Ajustar X e Y al esquema de la capa
        var xLayer = Math.floor(coords.x * scaleFactor);
        var yLayer = Math.floor(coords.y * scaleFactor);

        return "https://idena.navarra.es/ogc/wmts/" + this.layer + "/default/epsg25830/" + zLayer + "/" + yLayer + "/" + xLayer + ".png"
    },
    getClosestZoomLevel: function (resolutionMap, layerResolutions) {
        // Encuentra el nivel de zoom en la capa cuya resolución es más cercana a la del mapa
        var closestZoom = 0;
        var minDifference = Infinity;

        layerResolutions.forEach((resolutionLayer, index) => {
            var difference = Math.abs(resolutionMap - resolutionLayer);
            if (difference < minDifference) {
                minDifference = difference;
                closestZoom = index;
            }
        });

        return closestZoom;
    }

});

// Mapa base IDENA WMTS
L.TileLayer.IDENA_JPEG = L.TileLayer.extend({
    constructor: function (layer) {
        this.layer = layer;
        L.TileLayer.prototype.constructor.call(this);
    },
    initialize: function (layer) {
        this.layer = layer;
        L.TileLayer.prototype.initialize.call(this);
    },
    options: {
        tileSize: 256,      // Tamaño de las teselas en píxeles
    },
    getTileUrl: function (coords) {
        return "https://idena.navarra.es/ogc/wmts/" + this.layer + "/default/epsg25830/" + coords.z + "/" + coords.y + "/" + coords.x + ".jpeg"
    }
});


// Función inicialización Mapa base IDENA WMTS en png
/*
Mapas admitidos:
mapabase
mapaBaseGris
mapaTopografico
mapaTopografico2017
*/
export function tileLayerIDENA_EXTENDED_PNG(layer) {
    return new L.TileLayer.IDENA_EXTENDED_PNG(layer);
}

// Función inicialización Mapa base IDENA WMTS en jpg
/*
Mapas admitidos:
ortofoto_maxima_actualidad
ortofoto2023
ortofoto2022
ortofoto2021
ortofoto2020
ortofoto2019
ortofoto2018
ortofoto2017
ortofoto2014
ortofoto2012
*/
export function tileLayerIDENA_JPEG(layer) {
    return new L.TileLayer.IDENA_JPEG(layer);
}

//Busca una dirección en Navarra, en el municipio indicado
export async function searchAddress(text, municipio) {
    const url = "https://idena.navarra.es/ogc/wfs"

    let { streetName, portalNumber } = _parseAddress(text);

    let data = {
        REQUEST: 'GetFeature',
        SERVICE: 'WFS',
        VERSION: '1.1.0',
        MAXFEATURES: 500,
        OUTPUTFORMAT: 'JSON',
        TYPENAME: portalNumber ? "IDENA:CATAST_Txt_Portal" : "IDENA:CATAST_Lin_CalleEje",
        outputFormat: 'application/json',
        //srsName: 'EPSG:25830',
        PROPERTYNAME: portalNumber ? "ENTIDADC,VIA,PORTAL,CVIA,CENTIDADC,CMUNICIPIO" : "ENTIDADC,VIA,CVIA,CENTIDADC,CMUNICIPIO",
        FILTER: _getFilterXML(municipio, streetName, portalNumber)
    }

    let response = await fetch(url, {
        method: 'POST',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        },
        body: new URLSearchParams(data)
    });

    const jsonData = await response.json();

    //Depura los resultados de jsonData, quitando los duplicados
    let uniqueData = [];
    if (!portalNumber) {
        let seen = new Set();
        jsonData.features.forEach(feature => {
            if (!seen.has(feature.properties.VIA)) {
                seen.add(feature.properties.VIA);
                uniqueData.push(feature.properties);
            }
        });
        //Ordenamos los resultados por VIA
        uniqueData.sort((a, b) => a.VIA.localeCompare(b.VIA));
    }
    else {
        jsonData.features.forEach(feature => {
            uniqueData.push(feature.properties);
        });

        //Ordenamos los resultados por VIA y PORTAL
        uniqueData.sort((a, b) => {
            if (a.VIA === b.VIA) {
                return parseInt(a.PORTAL) - parseInt(b.PORTAL);
            }
            return a.VIA.localeCompare(b.VIA);
        });

    }

    let out = {
        "data": uniqueData,
        "type": portalNumber ? "portal" : "street"
    }

    return out;
}

//Localiza una dirección en Navarra, en el municipio indicado
export async function geocodeAddress(result, resultType) {
    const url = "https://idena.navarra.es/ogc/wfs"


    let data = {
        REQUEST: 'GetFeature',
        SERVICE: 'WFS',
        VERSION: '1.1.0',
        MAXFEATURES: 500,
        OUTPUTFORMAT: 'JSON',
        SRSNAME: "EPSG:4326",
        TYPENAME: resultType == "portal" ? "IDENA:CATAST_Txt_Portal" : "IDENA:CATAST_Lin_CalleEje,CATAST_Txt_Calle",
        outputFormat: 'application/json',
        FILTER: _getFilterXMLGeocode(result, resultType)
    }

    const params = new URLSearchParams(data).toString();
    let response = await fetch(`${url}?${params}`, {
        method: 'GET',
        headers: {
            'Content-Type': 'application/x-www-form-urlencoded'
        }
    });

    const jsonData = await response.json();

    return jsonData;
    //https://idena.navarra.es/ogc/wfs?service=WFS&request=GetFeature&version=1.1.0&outputFormat=JSON&srsname=EPSG%3A25830&typename=IDENA%3ACATAST_Lin_CalleEje%2CCATAST_Txt_Calle&filter=%3CFilter+xmlns%3Aogc%3D%22http%3A%2F%2Fwww.opengis.net%2Fogc%22+xmlns%3Agml%3D%22http%3A%2F%2Fwww.opengis.net%2Fgml%22%3E%3CAnd%3E%3CPropertyIsEqualTo%3E%3CPropertyName%3ECVIA%3C%2FPropertyName%3E%3CLiteral%3E%3C!%5BCDATA%5B9098%5D%5D%3E%3C%2FLiteral%3E%3C%2FPropertyIsEqualTo%3E%3CPropertyIsEqualTo%3E%3CPropertyName%3ECVIA%3C%2FPropertyName%3E%3CLiteral%3E%3C!%5BCDATA%5B9098%5D%5D%3E%3C%2FLiteral%3E%3C%2FPropertyIsEqualTo%3E%3C%2FAnd%3E%3C%2FFilter%3E&maxFeatures=1000
}

function _getFilterXMLGeocode(result, resultType) {
    let filterXML = "";
    let CMUNICIPIO = result.CMUNICIPIO;
    let CVIA = result.CVIA;


    if (resultType == "portal") {
        let PORTAL = result.PORTAL;
        filterXML = `<Filter xmlns:ogc="http://www.opengis.net/ogc" xmlns:gml="http://www.opengis.net/gml"><And><PropertyIsEqualTo><PropertyName>CMUNICIPIO</PropertyName><Literal><![CDATA[${CMUNICIPIO}]]></Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>CENTIDADC</PropertyName><Literal><![CDATA[1]]></Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>CVIA</PropertyName><Literal><![CDATA[${CVIA}]]></Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>PORTAL</PropertyName><Literal><![CDATA[${PORTAL}]]></Literal></PropertyIsEqualTo></And></Filter>`;

    }
    else {
        filterXML = `<Filter xmlns:ogc="http://www.opengis.net/ogc" xmlns:gml="http://www.opengis.net/gml"><And><PropertyIsEqualTo><PropertyName>CVIA</PropertyName><Literal><![CDATA[${CVIA}]]></Literal></PropertyIsEqualTo><PropertyIsEqualTo><PropertyName>CVIA</PropertyName><Literal><![CDATA[${CVIA}]]></Literal></PropertyIsEqualTo></And></Filter>`;

    }
    return filterXML;
}
function _getFilterXML(municipio, streetName, portalNumber) {
    let municipioUpper = municipio.toUpperCase();
    let municipioLower = municipio.toLowerCase();
    let streetNameUpper = streetName.toUpperCase();
    let streetNameLower = streetName.toLowerCase();

    let filterFortal = "";
    if (portalNumber) {
        filterFortal = `<ogc:Or><ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*"><ogc:PropertyName>PORTAL</ogc:PropertyName><ogc:Literal><![CDATA[${portalNumber}*]]></ogc:Literal></ogc:PropertyIsLike><ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*"><ogc:PropertyName>PORTAL</ogc:PropertyName><ogc:Literal><![CDATA[${portalNumber}*]]></ogc:Literal></ogc:PropertyIsLike></ogc:Or>`;
    }

    const filterXML = `<ogc:Filter xmlns:ogc="http://www.opengis.net/ogc" xmlns:gml="http://www.opengis.net/gml"><ogc:And><ogc:Or><ogc:Or><ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*"><ogc:PropertyName>ENTIDADC</ogc:PropertyName><ogc:Literal><![CDATA[*${municipioLower}*]]></ogc:Literal></ogc:PropertyIsLike><ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*"><ogc:PropertyName>ENTIDADC</ogc:PropertyName><ogc:Literal><![CDATA[*${municipioUpper}*]]></ogc:Literal></ogc:PropertyIsLike></ogc:Or><ogc:Or><ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*"><ogc:PropertyName>ENTINOAC</ogc:PropertyName><ogc:Literal><![CDATA[*${municipioLower}*]]></ogc:Literal></ogc:PropertyIsLike><ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*"><ogc:PropertyName>ENTINOAC</ogc:PropertyName><ogc:Literal><![CDATA[*${municipioUpper}*]]></ogc:Literal></ogc:PropertyIsLike></ogc:Or></ogc:Or><ogc:Or><ogc:Or><ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*"><ogc:PropertyName>VIA</ogc:PropertyName><ogc:Literal><![CDATA[*${streetNameLower}*]]></ogc:Literal></ogc:PropertyIsLike><ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*"><ogc:PropertyName>VIA</ogc:PropertyName><ogc:Literal><![CDATA[*${streetNameUpper}*]]></ogc:Literal></ogc:PropertyIsLike></ogc:Or><ogc:Or><ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*"><ogc:PropertyName>VIANOAC</ogc:PropertyName><ogc:Literal><![CDATA[*${streetNameLower}*]]></ogc:Literal></ogc:PropertyIsLike><ogc:PropertyIsLike matchCase="false" escape="\" singleChar="_" wildCard="*"><ogc:PropertyName>VIANOAC</ogc:PropertyName><ogc:Literal><![CDATA[*${streetNameUpper}*]]></ogc:Literal></ogc:PropertyIsLike></ogc:Or></ogc:Or>${filterFortal}</ogc:And></ogc:Filter>`;


    return filterXML;
}

function _parseAddress(text) {
    // Remove punctuation and convert to uppercaseº
    let cleanedText = text.replace(/[.,]/g, '').toUpperCase();

    // Split the text into parts
    let parts = cleanedText.split(' ');

    // Initialize variables for street name and portal number
    let streetName = '';
    let portalNumber = '';

    // Iterate over the parts to separate street name and portal number
    parts.forEach(part => {
        if (isNaN(part)) {
            streetName += part + '+';
        } else {
            portalNumber = part;
        }
    });

    // Remove the trailing '+' from the street name
    if (streetName.endsWith('+')) {
        streetName = streetName.slice(0, -1);
    }

    return { streetName, portalNumber };
}

let ly_catastro = new L.tileLayer.wms("https://idena.navarra.es/ogc/ows", {
    layers: 'catastro,regionesFronterizas',
    format: 'image/png',
    transparent: true,
    version: '1.3.0',
    crs: L.CRS.EPSG25830
});

let ly_mapabase_ortofoto = new L.tileLayer.wms("https://idena.navarra.es/ogc/ows", {
    layers: 'mapaBase_orto',
    format: 'image/png',
    transparent: true,
    version: '1.3.0',
    crs: L.CRS.EPSG25830
})
let ly_mapabase = new L.TileLayer.IDENA_EXTENDED_PNG("mapabase");
let ly_mapaTopografico = new L.TileLayer.IDENA_EXTENDED_PNG("mapaTopografico");
let ly_ortofoto2024 = new L.TileLayer.IDENA_JPEG("ortofoto2024");
//https://iber.chebro.es/Sit.IWS/servidorIWS.aspx?tipo=geoservervuelo&minx=194628&miny=4216338&maxx=1099624&maxy=5068480&width=976&height=919&srs=25830
//https://iber.chebro.es/Sit.IWS/servidorIWS.aspx?tipo=geoservervuelo&service=WMS&request=GetMap&layers=geoservervuelo&styles=&format=image%2Fpng&transparent=true&version=1.3.0&width=256&height=256&crs=EPSG%3A25830&bbox=615320.0000000002,4657603.999999999,615575.9999999993,4657859.999999999


L.TileLayer.CHE_ortofoto1927 = L.TileLayer.extend({
    getTileUrl: function (coords) {
        var tileSize = this.getTileSize();

        // Calculamos las coordenadas del pixel en el sistema de coordenadas del mapa
        var nwPoint = coords.multiplyBy(tileSize.x);
        var sePoint = nwPoint.add(tileSize);

        // Convertir los puntos de pixel a latitud/longitud usando el CRS del mapa
        var nwLatLng = map.options.crs.pointToLatLng(nwPoint, this._getZoomForUrl());
        var seLatLng = map.options.crs.pointToLatLng(sePoint, this._getZoomForUrl());

        // Convertir las lat/lng a coordenadas proyectadas en EPSG:25830
        // Usamos el método `project` del objeto projection definido en el CRS.
        var nwProjected = map.options.crs.projection.project(nwLatLng);
        var seProjected = map.options.crs.projection.project(seLatLng);

        // Definir el bounding box basado en las coordenadas proyectadas
        var minx = nwProjected.x;
        var maxy = nwProjected.y; // normalmente la esquina superior izquierda tiene Y máximo
        var maxx = seProjected.x;
        var miny = seProjected.y;

        // Construir la URL dinámica utilizando los parámetros calculados
        var url = "https://iber.chebro.es/Sit.IWS/servidorIWS.aspx" +
            "?tipo=geoservervuelo" +
            "&minx=" + minx +
            "&miny=" + miny +
            "&maxx=" + maxx +
            "&maxy=" + maxy +
            "&width=" + tileSize.x +
            "&height=" + tileSize.y +
            "&srs=25830";

        return url;
    }
});
let ly_ortofoto1927 = new L.TileLayer.CHE_ortofoto1927();

let ly_ortofoto1956_57 =  new L.tileLayer.wms("https://www.ign.es/wms/pnoa-historico", {
    layers: 'AMS_1956-1957',
    format: 'image/png',
    transparent: true,
    version: '1.3.0',
    crs: L.CRS.EPSG25830
});


//let mapaTopografico2017 = tileLayerIDENA_EXTENDED_PNG("mapaTopografico2017");

export const IDENA_baseMaps = [
    {
        id: 1,
        alias: 'Catastro (IDENA)',
        name: 'catatstro',
        layer: ly_catastro,
        thumbnail: catastro,
    },
    {
        id: 2,
        alias: 'Mapa base (IDENA)',
        name: 'mapabase',
        layer: ly_mapabase,
        thumbnail: mapabase,
        legend: "https://idena.navarra.es/ogc/wmts/mapabase/default/legend/mapabase.png"
    },
    {
        id: 3,
        alias: 'Mapa topográfico (IDENA)',
        name: 'mapaTopografico',
        layer: ly_mapaTopografico,
        thumbnail: mapaTopografico
    },
    {
        id: 4,
        alias: 'Ortofoto de 1927 (CHE)',
        name: 'ortofoto1927',
        layer: ly_ortofoto1927,
        thumbnail: ortofoto_1927
    },
    {
        id: 5,
        alias: 'Vuelo Americano 1956-57 (IGN)',
        name: 'ortofoto1956_57',
        layer: ly_ortofoto1956_57,
        thumbnail: ortofoto_1956_57
    },
    {
        id : 6,
        alias: 'Ortofoto de 2024 (IDENA)',
        name: 'ortofoto2024',
        layer: ly_ortofoto2024,
        thumbnail: ortofoto
    },
    {
        id: 7,
        alias: 'Mapa base/ortofoto',
        name: 'mapabaseortofoto',
        layer: ly_mapabase_ortofoto,
        thumbnail: base_ortofoto
    },
];
