import { getDeleteXML, getInsertXML, getUpdateGeomXML, getUpdateXML } from "../utilities/WFSXMLUtilities";
import { CommonService } from "./common/commonService";
import { ServicesConfig } from "./servicesConfig";

export class RolesService {

    
    static LISTBYUNIT = (idUnit) => {
        let requestUrl = "/roles/list/" + idUnit;
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static LISTBYUNITANDUSER = (idUnit, usr) => {
        let requestUrl = "/roles/byUser/list/" + idUnit + "/" + usr;
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static LISTBYUNITANDPERMISSION = (idUnit, permission) => {
        let requestUrl = "/roles/byPermission/list/" + idUnit + "/" + permission;
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    

       
    static ADD = (idUnit, rolename) => {       
        let requestUrl = "/roles/add/" + idUnit + "/"  + rolename;
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static ADDPERMISSION2ROLE = (idUnit, rolename, permissionname) => {       
        let requestUrl = "/roles/addpermission2role/" + idUnit + "/" + rolename + "/"  + permissionname;
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static DELPERMISSIONFROMROLE = (idUnit, rolename, permissionname) => {       
        let requestUrl = "/roles/deletepermissionfromrole/" + idUnit + "/" + rolename + "/"  + permissionname;
        return CommonService.delete(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static DELETE = (idUnit, rolename) => {       
        let requestUrl = "/roles/delete/" + idUnit + "/"  + rolename;
        return CommonService.delete(ServicesConfig.getBaseUrl() + requestUrl)
    }

}