import { getDeleteXML, getInsertXML, getUpdateGeomXML, getUpdateXML } from "../utilities/WFSXMLUtilities";
import { CommonService } from "./common/commonService";
import { ServicesConfig } from "./servicesConfig";

export class ExternalReportsService {

    static LIST = () => {
        let requestUrl = "/api/v1/common/list";
        return CommonService.get(ServicesConfig.getBaseUrReports() + requestUrl)
    }

    static GET = (group, id) => {       
        let requestUrl = "/api/v1/common/report/" + group + "/" + id;
        return CommonService.get(ServicesConfig.getBaseUrReports() + requestUrl)
    }

    static DOWNLOAD = (muni, format, group, id, props) => {       
        let requestUrl = "/api/v1/" + group + "/" + id + "/" + muni + "/" + format;       
        return CommonService.post(ServicesConfig.getBaseUrReports() + requestUrl, props)
    }

  
}