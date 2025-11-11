import { getDeleteXML, getInsertXML, getUpdateGeomXML, getUpdateXML } from "../utilities/WFSXMLUtilities";
import { CommonService } from "./common/commonService";
import { ServicesConfig } from "./servicesConfig";

export class PermissionsService {

    static LISTBYUNIT = (idUnit) => {
        let requestUrl = "/permissions/list/" + idUnit;
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static LISTBYUNITANDUSER = (idUnit, usr) => {
        let requestUrl = "/permissions/listByUser/" + idUnit + "/" + usr;
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static LISTBYUNITANDPROLE = (idUnit, role) => {
        let requestUrl = "/permissions/listByRole/" + idUnit + "/" + role;
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

       
    static ADD = (idUnit, permission) => {       
        let requestUrl = "/permissions/add/" + idUnit + "/"  + permission;
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    
    static DELETE = (idUnit, permission) => {       
        let requestUrl = "/permissions/delete/" + idUnit + "/"  + permission;
        return CommonService.delete(ServicesConfig.getBaseUrl() + requestUrl)
    }

}