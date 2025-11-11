import { getDeleteXML, getInsertXML, getUpdateGeomXML, getUpdateXML } from "../utilities/WFSXMLUtilities";
import { CommonService } from "./common/commonService";
import { ServicesConfig } from "./servicesConfig";

export class ProjectsService {

    static LISTBYUNITANDPERMISSION = (idUnit, permission) => {
        let requestUrl = "/projects/list/manager/" + idUnit + (permission?"/" + permission: "");
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }
}