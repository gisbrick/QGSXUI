import i18next from "i18next";
import { CommonService } from "./common/commonService";
import { ServicesConfig } from "./servicesConfig";

export class AppService {

    static LIST = () => {
        let requestUrl = "/app/list/" + i18next.language;
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static LISTBYUSER = (idUnt) => {
        let requestUrl = "/app/list/user/" + idUnt + "/" + i18next.language;
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static LISTBYMANAGER = (idUnt) => {
        let requestUrl = "/app/list/manager/" + idUnt;
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static INNIT = (idUnt) => {
        let requestUrl = "/app/innit/" + idUnt + "/" + null;
        return CommonService.get(ServicesConfig.getBaseUrl() + requestUrl)
    }

    static CREATE = (idUnt,properties) => {       
        let requestUrl = "/app/create/" + idUnt;
        return CommonService.post(ServicesConfig.getBaseUrl() + requestUrl, properties)
    }

    static UPDATE = (idUnt, properties) => {       
        let requestUrl = "/app/update/" + idUnt;
        return CommonService.post(ServicesConfig.getBaseUrl() + requestUrl, properties)
    }

    static DELETE = (idUnt, idApp) => {       
        let requestUrl = "/app/delete/" + idUnt + "/" + idApp;
        return CommonService.delete(ServicesConfig.getBaseUrl() + requestUrl)
    }

}