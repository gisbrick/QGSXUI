import { ServicesConfig } from "./servicesConfig"
import { CommonService } from "./common/commonService"

export class OpenStreetMapService {

    static GETSEARCH = (param) => {
        //let url = "https://nominatim.openstreetmap.org/search?q=" + param.numero + "+" + param.direccion + "+" + param.ciudad + "+" + param.pais + "&format=geojson&bounded=1&viewbox="+param.viewBox
        //let url = "https://nominatim.openstreetmap.org/search?street=" + param.direccion + "&format=jsonv2&bounded=1&viewbox="+param.viewBox+"&polygon_geojson=1"
        let url = "https://nominatim.openstreetmap.org/search?q="+ param.direccion +"+" + param.nucleo +"&format=json&viewbox="+param.viewBox+"&bounded=1&polygon_geojson=1"
        return CommonService.get(url)
    }

}