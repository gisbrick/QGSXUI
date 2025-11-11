import { CommonService } from "./common/commonService";
import { ServicesConfig } from "./servicesConfig";

export class MediaGroupService {

    static LIST = (idUnit) => {
        let requestUrl = "/media_group/list/" + idUnit;
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static CREATE = (idUnit, properties) => {       
        let requestUrl = "/media_group/create/" + idUnit;;
        return CommonService.post(ServicesConfig.getBaseUrl() + requestUrl, properties)
    }

    static UPDATE = (idUnit, properties) => {       
        let requestUrl = "/media_group/update/" + idUnit;
        return CommonService.post(ServicesConfig.getBaseUrl() + requestUrl, properties)
    }

    static DELETE = (idUnit, uid) => {       
        let requestUrl = "/media_group/delete/" + idUnit + "/" + uid;
        return CommonService.delete(ServicesConfig.getBaseUrl() + requestUrl)
    }
}