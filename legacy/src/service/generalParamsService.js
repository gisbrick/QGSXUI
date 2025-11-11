import { CommonService } from "./common/commonService";
import { ServicesConfig } from "./servicesConfig";

export class GeneralParamsService {

    static LIST = () => {
        let requestUrl = "/params/list";
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static UPDATE = (id, param) => {
        let requestUrl = "/params/param/" + id
        return CommonService.update(ServicesConfig.getBaseUrl() + requestUrl, param)
    }
}