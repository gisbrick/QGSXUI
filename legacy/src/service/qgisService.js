import { store } from "../app/store";
import { getDeleteMultipleXML, getDeleteXML, getInsertXML, getUpdateGeomXML, getUpdateXML } from "../utilities/WFSXMLUtilities";
import { GETOGCFilterEncoding, getWMSFilters } from "../utilities/mapUtils";
import { CommonService } from "./common/commonService";
import { ServicesConfig } from "./servicesConfig";

export class QgisService {


    static QGISPRJ = (map) => {
        const state = store.getState();
        //state.user.logged ? state.user.token      
        return CommonService.get(ServicesConfig.getBaseUrl() + "/qgis?SERVICE=QGISPRJ&MAP=" +encodeURI(map.map) + "&UNIT=" + map.unit + "&PERMISSION=" + map.permission + "&TOKEN=" + (state.user.logged ? state.user.token : ""))
    }

    static WMTSLAYERS = (map) => {
        const state = store.getState();
        return CommonService.get(ServicesConfig.getBaseUrl() + "/qgis?SERVICE=WMTSLAYERS&MAP=" + encodeURI(map.map) + "&UNIT=" + map.unit + "&PERMISSION=" + map.permission + "&TOKEN=" + (state.user.logged ? state.user.token : ""))
    }

    static GENERAL = (map, properties) => {
        const state = store.getState();
        let otherParams = new URLSearchParams(properties).toString()
        return CommonService.get(ServicesConfig.getBaseUrl() + "/qgis?MAP=" + encodeURI(map.map) + "&UNIT=" + map.unit + "&PERMISSION=" + map.permission + "&" + otherParams + "&TOKEN=" + (state.user.logged ? state.user.token : ""))
    }

    static GETCOUNTFEATURES = (map, layer, maxFeatures, startIndex, expFilter, bbox, sortby, sortType) => {
        const state = store.getState();
        let requestUrl = "/qgis?SERVICE=WFS&REQUEST=GetFeature&MAP=" + encodeURI(map.map) + "&UNIT=" + map.unit + "&PERMISSION=" + map.permission + "&TYPENAME=" + layer.replaceAll(' ', '_') + "&RESULTTYPE=hits&OUTPUTFORMAT=geojson&SRSNAME=EPSG:4326" + "&TOKEN=" + (state.user.logged ? state.user.token : "");
        if (maxFeatures) requestUrl = requestUrl + "&MAXFEATURES=" + maxFeatures;
        if (startIndex) requestUrl = requestUrl + "&STARTINDEX=" + startIndex;
        //if (expFilter) requestUrl = requestUrl + "&EXP_FILTER=" + GETOGCFilterEncoding(expFilter);
        if (expFilter) {
            let f = GETOGCFilterEncoding(expFilter)
            //requestUrl = requestUrl + "&FILTER=" + encodeURI(f);
            //requestUrl = requestUrl + "&FILTER=" + f;
            requestUrl = requestUrl + "&EXP_FILTER=" + expFilter.replaceAll("1=1 AND ", "").replaceAll("%", "%25");
        }
        if (bbox) requestUrl = requestUrl + "&BBOX=" + bbox;
        if (sortby) requestUrl = requestUrl + "&SORTBY=" + sortby + " " + sortType;

        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static GETFEATURES = (map, layer, maxFeatures, startIndex, expFilter, bbox, sortby, sortType) => {
        const state = store.getState();
        let requestUrl = "/qgis?SERVICE=WFS&REQUEST=GetFeature&MAP=" + encodeURI(map.map) + "&UNIT=" + map.unit + "&PERMISSION=" + map.permission + "&TYPENAME=" + layer.replaceAll(' ', '_') + "&RESULTTYPE=results&OUTPUTFORMAT=geojson&SRSNAME=EPSG:4326" + "&TOKEN=" + (state.user.logged ? state.user.token : "");
        if (maxFeatures) requestUrl = requestUrl + "&MAXFEATURES=" + maxFeatures;
        if (startIndex) requestUrl = requestUrl + "&STARTINDEX=" + startIndex;
        if (expFilter) {
            let f = GETOGCFilterEncoding(expFilter)
            //requestUrl = requestUrl + "&FILTER=" + encodeURI(f);
            //requestUrl = requestUrl + "&FILTER=" + f;
            requestUrl = requestUrl + "&EXP_FILTER=" + expFilter.replaceAll("1=1 AND ", "").replaceAll("%", "%25").replaceAll("'", "%27");
        }
        if (bbox) requestUrl = requestUrl + "&BBOX=" + bbox;
        if (sortby && sortType) requestUrl = requestUrl + "&SORTBY=" + sortby + " " + sortType;

        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }




    static DELETEFEATURE = (map, feature) => {
        const state = store.getState();
        let requestUrl = "/qgis?SERVICE=WFS&VERSION=1.1.0&REQUEST=Transaction&MAP=" + encodeURI(map.map) + "&UNIT=" + map.unit + "&PERMISSION=" + map.permission + "" + "&TOKEN=" + (state.user.logged ? state.user.token : "");
        return CommonService.postXml(ServicesConfig.getBaseUrl() + requestUrl, getDeleteXML(feature))
    }

    static DELETEFEATURES = (map, featuresIds) => {
        const state = store.getState();
        let requestUrl = "/qgis?SERVICE=WFS&VERSION=1.1.0&REQUEST=Transaction&MAP=" + encodeURI(map.map) + "&UNIT=" + map.unit + "&PERMISSION=" + map.permission + "" + "&TOKEN=" + (state.user.logged ? state.user.token : "");
        return CommonService.postXml(ServicesConfig.getBaseUrl() + requestUrl, getDeleteMultipleXML(featuresIds))
    }

    static UPDATEFEATURE = (map, qgisLayer, feature, properties, geometry) => {
        const state = store.getState();
        let requestUrl = "/qgis?SERVICE=WFS&VERSION=1.1.0&REQUEST=Transaction&MAP=" + encodeURI(map.map) + "&UNIT=" + map.unit + "&PERMISSION=" + map.permission + "" + "&TOKEN=" + (state.user.logged ? state.user.token : "");
        if (feature && feature.id != null) {
            return CommonService.postXml(ServicesConfig.getBaseUrl() + requestUrl, getUpdateXML(qgisLayer, feature, properties, geometry))
        }
        else {
            return CommonService.postXml(ServicesConfig.getBaseUrl() + requestUrl, getInsertXML(qgisLayer, properties, geometry))
        }

    }

    static UPDATEGEOMETRY = (map, qgisLayer, feature, geometry) => {
        const state = store.getState();
        let requestUrl = "/qgis?SERVICE=WFS&VERSION=1.1.0&REQUEST=Transaction&MAP=" + encodeURI(map.map) + "&UNIT=" + map.unit + "&PERMISSION=" + map.permission + "" + "&TOKEN=" + (state.user.logged ? state.user.token : "");
        return CommonService.postXml(ServicesConfig.getBaseUrl() + requestUrl, getUpdateGeomXML(qgisLayer, feature, geometry))

    }

    static WMSFEATUREINFO = (map, query) => {
        const state = store.getState();
        let url = "/qgis?MAP=" + encodeURI(map.map) + "&UNIT=" + map.unit + "&PERMISSION=" + map.permission + "" + "&TOKEN=" + (state.user.logged ? state.user.token : "");
        let requestUrl = url + window.L.Util.getParamString(query, url, true);

        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)

    }

    //No se utiliza por ahora
    static WMSFEATUREINFOFILTER = (map, layerName, field, value) => {
        let url = "/qgis?MAP="+map.map+"&UNIT="+map.unit+"&PERMISSION=null&TOKEN=&SERVICE=WMS&VERSION=1.1.1&REQUEST=GetFeatureInfo&LAYERS="+layerName+"&QUERY_LAYERS="+layerName+"&INFO_FORMAT=application/json&FEATURE_COUNT=5&SRS=EPSG:3857&FILTER="+layerName+':"'+field+'" = \''+value+'\''
        return CommonService.get(ServicesConfig.getBaseUrl() + url)
    }


    static WMSFEATURE = (map, feature) => {
        const state = store.getState();
        let requestUrl = "/qgis?SERVICE=WFS&VERSION=1.1.0&REQUEST=GetFeature&RESULTTYPE=results&OUTPUTFORMAT=geojson&SRSNAME=EPSG:4326&MAP=" + map.map + "&UNIT=" + map.unit + "&PERMISSION=" + map.permission + "&TOKEN=" + (state.user.logged ? state.user.token : "") + "&FEATUREID=" + ((feature && feature.id) ? feature.id.replaceAll(' ', '_') : "");
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)

    }

    static LEGEND = (map, layers) => {
        const state = store.getState();
        let requestUrl = "/qgis?PERMISSION=" + map.permission + "&REQUEST=GetLegendGraphic&UNIT=" + map.unit + "&FORMAT=application/json&version=1.1.1&srs=EPSG:3857&service=WMS&layers=" + layers + "&width=1256&SERVICE=WMS&styles=&MAP=" + map.map + "&TOKEN=" + (state.user.logged ? state.user.token : "");

        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

}