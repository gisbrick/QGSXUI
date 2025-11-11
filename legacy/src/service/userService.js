import { getDeleteXML, getInsertXML, getUpdateGeomXML, getUpdateXML } from "../utilities/WFSXMLUtilities";
import { CommonService } from "./common/commonService";
import { ServicesConfig } from "./servicesConfig";

export class UserService {

    static LIST = () => {
        let requestUrl = "/user/list";
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static CREATE = (properties) => {       
        let requestUrl = "/user/create";
        return CommonService.post(ServicesConfig.getBaseUrl() + requestUrl, properties)
    }

    static DELROLEFROMUSER = (usr, idUnit, role) => {       
        let requestUrl = "/user/delrolefromuser/" + usr + "/" + idUnit + "/"  + role;
        return CommonService.delete(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static ADDROLE2USER = (usr, idUnit, role) => {       
        let requestUrl = "/user/addrole2user/" + usr + "/" + idUnit + "/"  + role;
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static UPDATE = (properties) => {       
        let requestUrl = "/user/update";
        return CommonService.post(ServicesConfig.getBaseUrl() + requestUrl, properties)
    }

    static DELETE = (id) => {       
        let requestUrl = "/user/delete/" + id;
        return CommonService.delete(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static LISTUNITS = (id) => {       
        let requestUrl = "/user/units/" + id;
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static LISTBYUNIT = (idUnit) => {       
        let requestUrl = "/user/unit/" + idUnit;
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static ADDUNIT = (id, unit) => {       
        let requestUrl = "/user/units/" + id;
        return CommonService.post(ServicesConfig.getBaseUrl() + requestUrl, unit)
    }

    static LISTBYUNIT = (idUnit) => {       
        let requestUrl = "/user/unit/" + idUnit;
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static LISTBYUNITANDROLE = (idUnit, role) => {       
        let requestUrl = "/user/unit/role/" + idUnit + "/" + role;
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    

    static DELETEUSERFROMUNIT = (usr, idUnit) => {       
        let requestUrl = "/user/unit/" + usr + "/" + idUnit;
        return CommonService.delete(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static ADDUSERTOUNIT = (usr, idUnit) => {       
        let requestUrl = "/user/unit/" + usr + "/" + idUnit;
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }
    
}