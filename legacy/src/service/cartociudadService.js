import { ServicesConfig } from "./servicesConfig"
import { CommonService } from "./common/commonService"

export class CartociudadService {

    static GET_UBICACION = (long, lat) => {
        let url = `https://www.cartociudad.es/geocoder/api/geocoder/reverseGeocode?lon=${long}&lat=${lat}`
        //console.log(url)
        return CommonService.getWithoutToken(url)
    }

}