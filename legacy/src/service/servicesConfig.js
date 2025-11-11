import { CommonService } from "./common/commonService";



export class ServicesConfig {

    static getBaseUrl() {
        if (window.location.host.includes(":3000")) {
            return "."
        }
        else {
            return "./api/v1"
        }
    }

    static getBaseUrReports() {
        if (window.location.host.includes(":3000")) {
           return "http://" + window.location.host.split(":")[0] + ":5101"
        }
        else {
            return "https://" + window.location.host.split(":")[0] + ":5101"
        }
        
    }
}