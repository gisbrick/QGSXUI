import { getDeleteMultipleXML, getDeleteXML, getInsertXML, getUpdateGeomXML, getUpdateXML } from "../utilities/WFSXMLUtilities";
import { GETOGCFilterEncoding } from "../utilities/mapUtils";
import { CommonService } from "./common/commonService";
import { ServicesConfig } from "./servicesConfig";

export class QgisScheduleService {



    static GETFEATURES = (map, layer, maxFeatures, startIndex, expFilter, bbox, sortby, sortType) => {
        let requestUrl = "/qgisSchedule?SERVICE=WFS&REQUEST=GetFeature&MAP=" +  encodeURI(map.map) + "&UNIT=" + map.unit + "&PERMISSION=" + map.permission + "&TYPENAME=" + layer.replaceAll(' ', '_') + "&RESULTTYPE=results&OUTPUTFORMAT=geojson&SRSNAME=EPSG:4326";
        if (maxFeatures) requestUrl = requestUrl + "&MAXFEATURES=" + maxFeatures;
        if (startIndex) requestUrl = requestUrl + "&STARTINDEX=" + startIndex;
        if (expFilter){
            let f = GETOGCFilterEncoding(expFilter)           
            //requestUrl = requestUrl + "&FILTER=" + encodeURI(f);
            //requestUrl = requestUrl + "&FILTER=" + f;
            requestUrl = requestUrl + "&EXP_FILTER=" + expFilter.replaceAll("1=1 AND ", "").replaceAll("%", "%25");
        }
        if (bbox) requestUrl = requestUrl + "&BBOX=" + bbox;
        if (sortby && sortType) requestUrl = requestUrl + "&SORTBY=" + sortby + " " + sortType;
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }


    static DELETEFEATURE = (map, feature) => {
        const featureIdArr = feature.id.split(".");
        const TYPENAME = featureIdArr[0].replaceAll(" ", "_");
        const FID = featureIdArr[1];

        let requestUrl = "/qgisSchedule?SERVICE=WFS&VERSION=1.1.0&REQUEST=Transaction&MAP=" +  encodeURI(map.map) + "&UNIT=" + map.unit + "&PERMISSION=" + map.permission + "&TYPENAME=" + TYPENAME;
        return CommonService.postXml(ServicesConfig.getBaseUrl() + requestUrl, getDeleteXML(feature))
        /*
        let requestUrl = "/qgisSchedule?SERVICE=WFS&VERSION=1.1.0&REQUEST=Transaction&MAP=" + map.map + "&UNIT=" + map.unit + "&PERMISSION=" + map.permission + "&TYPENAME=" + layer.replaceAll(' ', '_');
        return CommonService.postXml(ServicesConfig.getBaseUrl() + requestUrl, getDeleteXML(feature))
        */
    }

    static DELETEFEATURES = (map, layer, featuresIds) => {
        let requestUrl = "/qgisSchedule?SERVICE=WFS&VERSION=1.1.0&REQUEST=Transaction&MAP=" + encodeURI(map.map) + "&UNIT=" + map.unit + "&PERMISSION=" + map.permission + "&TYPENAME=" + layer.replaceAll(' ', '_');
        return CommonService.postXml(ServicesConfig.getBaseUrl() + requestUrl, getDeleteMultipleXML(featuresIds))
    }

    static UPDATEFEATURE = (map, layer, qgisLayer, feature, properties) => {
        let requestUrl = "/qgisSchedule?SERVICE=WFS&VERSION=1.1.0&REQUEST=Transaction&MAP=" + encodeURI(map.map) + "&UNIT=" + map.unit + "&PERMISSION=" + map.permission + "&TYPENAME=" + layer.replaceAll(' ', '_');

        if (feature && feature.id != null) {
            return CommonService.postXml(ServicesConfig.getBaseUrl() + requestUrl, getUpdateXML(qgisLayer, feature, properties, null))
        }
        else {            
            return CommonService.postXml(ServicesConfig.getBaseUrl() + requestUrl, getInsertXML(qgisLayer, properties, null))
        }

    }
}