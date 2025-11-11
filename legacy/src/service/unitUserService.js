import { getDeleteXML, getInsertXML, getUpdateGeomXML, getUpdateXML } from "../utilities/WFSXMLUtilities";
import { CommonService } from "./common/commonService";
import { ServicesConfig } from "./servicesConfig";

export class UnitUserService {

   

    static DELETE = (id) => {       
        let requestUrl = "/unit_user/delete/" + id;
        return CommonService.delete(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static LISTMANAGEDUNITS = (id) => {       
        let requestUrl = "/unit_user/manager";
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    
    static LISTUSERUNITS = (id) => {       
        let requestUrl = "/unit_user/user";
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    
   
    
}