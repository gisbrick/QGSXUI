import { getDeleteXML, getInsertXML, getUpdateGeomXML, getUpdateXML } from "../utilities/WFSXMLUtilities";
import { CommonService } from "./common/commonService";
import { ServicesConfig } from "./servicesConfig";

export class SecurityService {

   
    static AUTHENTICATE = (username, password) => {
        
        let requestUrl = "/security/authenticate";
        let bean = {"username": username, "password": password}
        return CommonService.post(ServicesConfig.getBaseUrl() + requestUrl, bean)
    }

}