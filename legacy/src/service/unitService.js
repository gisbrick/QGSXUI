import { getDeleteXML, getInsertXML, getUpdateGeomXML, getUpdateXML } from "../utilities/WFSXMLUtilities";
import { CommonService } from "./common/commonService";
import { ServicesConfig } from "./servicesConfig";

export class UnitService {

    static LIST = () => {
        let requestUrl = "/unit/list";
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static CREATE = (properties) => {       
        let requestUrl = "/unit/create";
        return CommonService.post(ServicesConfig.getBaseUrl() + requestUrl, properties)
    }

    static UPDATE = (properties) => {       
        let requestUrl = "/unit/update";
        return CommonService.post(ServicesConfig.getBaseUrl() + requestUrl, properties)
    }

    static DELETE = (id) => {       
        let requestUrl = "/unit/delete/" + id;
        return CommonService.delete(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static LISTUNITS = (id) => {       
        let requestUrl = "/unit/units/" + id;
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    
    static ADDUSER = (id, unit) => {       
        let requestUrl = "/unit/units/" + id;
        return CommonService.post(ServicesConfig.getBaseUrl() + requestUrl, unit)
    }
}