import { getDeleteXML, getInsertXML, getUpdateGeomXML, getUpdateXML } from "../utilities/WFSXMLUtilities";
import { CommonService } from "./common/commonService";
import { ServicesConfig } from "./servicesConfig";

export class MediaService {

    static LISTTABLE = (map, qgislayer) => {
        let requestUrl = "/media/list/table/" + map.unit + "/" + (map.permission ? map.permission + "/" : "") + map.map + "/" + qgislayer.name;
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static LISTFEATURE = (map, feature) => {
        const featureIdArr = feature.id.split(".");
        const TYPENAME = featureIdArr[0].replaceAll(" ", "_")
        const FID = featureIdArr[1];
        let requestUrl = "/media/list/feature/" + map.unit + "/" + (map.permission ? map.permission + "/" : "") + map.map + "/" + TYPENAME + "/" + FID;
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static DOWNLOAD = (map, feature, UID) => {
        const featureIdArr = feature.id.split(".");
        const TYPENAME = featureIdArr[0].replaceAll(" ", "_");
        const FID = featureIdArr[1];
              
        let requestUrl = "/media/download/" + map.unit + "/" + (map.permission ? map.permission + "/" : "") + map.map + "/" + TYPENAME + "/" + UID;       ;
        return CommonService.download(ServicesConfig.getBaseUrl() + requestUrl, map.permission)
    }

    static BASE64FILE = (map, feature, UID) => {
        const featureIdArr = feature.id.split(".");
        const TYPENAME = featureIdArr[0].replaceAll(" ", "_");
        const FID = featureIdArr[1];
        let requestUrl = "/media/base64file/" + map.unit + "/" + (map.permission ? map.permission + "/" : "") + map.map + "/" + TYPENAME + "/" + UID + "/" + FID;
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static DELETE = (map, feature, UID) => {
        const featureIdArr = feature.id.split(".");
        const TYPENAME = featureIdArr[0].replaceAll(" ", "_");
        const FID = featureIdArr[1];
        let requestUrl = "/media/delete/" + map.unit + "/" + (map.permission ? map.permission + "/" : "") + map.map + "/" + TYPENAME + "/" + UID + "/" + FID;
        return CommonService.delete(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static DELETEFEATUREMEDIA = (map, feature) => {
        const featureIdArr = feature.id.split(".");
        const TYPENAME = featureIdArr[0].replaceAll(" ", "_");
        const FID = featureIdArr[1];
        let requestUrl = "/media/deletemany/" + map.unit + "/" + (map.permission ? map.permission + "/" : "") + map.map + "/" + TYPENAME + "/" + FID;
        return CommonService.delete(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static CREATE = (map, feature, properties) => {
        const featureIdArr = feature.id.split(".");
        const TYPENAME = featureIdArr[0].replaceAll(" ", "_");
        const FID = featureIdArr[1];
        console.log(TYPENAME, "  ", FID)

        let requestUrl = "/media/create/" + map.unit + "/" + (map.permission ? map.permission + "/" : "") + map.map + "/" + TYPENAME + "/" + FID;
        return CommonService.postFormData(ServicesConfig.getBaseUrl() + requestUrl, properties)
    }

    static UPDATE = (map, feature, properties, UID) => {
        const featureIdArr = feature.id.split(".");
        const TYPENAME = featureIdArr[0].replaceAll(" ", "_");
        const FID = featureIdArr[1];
        let requestUrl = "/media/update/" + map.unit + "/" + (map.permission ? map.permission + "/" : "") + map.map + "/" + TYPENAME + "/" + UID + "/" + FID;
        return CommonService.postFormData(ServicesConfig.getBaseUrl() + requestUrl, properties)
    }

}
