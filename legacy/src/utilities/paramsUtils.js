

export function getBackgroundColorPrimary(state) {

    let color = null;
    color = state.find((item)=> item.name=="BACKGROUND_COLOR_PRIMARY")?.value

    if(!color && color=="") {
        return null
    }
    return color;
}

export function getBackgroundColorSecundary(state) {

    let color = null;
    color = state.find((item)=> item.name=="BACKGROUND_COLOR_SECUNDARY")?.value

    if(!color && color=="") {
        return null
    }
    return color;
}


export function getIdColorPrimary(state) {
    let id = null;
    id = state.find((item)=> item.name=="BACKGROUND_COLOR_PRIMARY")?.idPrm

    if(!id && id=="") {
        return null
    }
    return id;
}

export function getIdColorSecundary(state) {
    let id = null;
    id = state.find((item)=> item.name=="BACKGROUND_COLOR_SECUNDARY")?.idPrm

    if(!id && id=="") {
        return null
    }
    return id;
}

export function getNombreApp(state) {
    let nombre = null;
    nombre = state.find((item)=> item.name=="nombre_app")?.value

    if(!nombre && nombre=="") {
        return null
    }
    return nombre;
}

export function getIdNombreApp(state) {
    let id = null;
    id = state.find((item)=> item.name=="nombre_app")?.idPrm

    if(!id && id=="") {
        return null
    }
    return id;
}

export function getLogoApp(state) {
    let logo = null;
    logo = state.find((item)=> item.name=="logo")?.value

    if(!logo && logo=="") {
        return null
    }
    return logo;
}

export function getIdLogo(state) {
    let id = null;
    id = state.find((item)=> item.name=="logo")?.idPrm

    if(!id && id=="") {
        return null
    }
    return id;
}

export function getIdiomas(state) {
    let idiomas = null;
    idiomas = state.find((item)=> item.name=="idiomas")?.value

    if(!idiomas && idiomas=="") {
        return null
    }
    return JSON.parse(idiomas);
}

export function getIdLetterColorSideMenu(state) {
    let id = null;
    id = state.find((item)=> item.name=="LETTER_COLOR_SIDEMENU")?.idPrm

    if(!id && id=="") {
        return null
    }
    return id;
}

export function getLetterColorSideMenu(state) {
    let color = null;
    color = state.find((item)=> item.name=="LETTER_COLOR_SIDEMENU")?.value

    if(!color && color=="") {
        return null
    }
    return color;
}

export function getIdLetterSizeSideMenu(state){
    let id = null;
    id = state.find((item)=> item.name=="LETTER_SIZE_SIDEMENU")?.idPrm

    if(!id && id=="") {
        return null
    }
    return id;
}

export function getLetterSizeSideMenu(state) {
    let size = null;
    size = state.find((item)=> item.name=="LETTER_SIZE_SIDEMENU")?.value

    if(!size && size=="") {
        return null
    }
    return size;
}

export function getIdLetterTypeSideMenu(state) {
    let id = null;
    id = state.find((item)=> item.name=="LETTER_TYPE_SIDEMENU")?.idPrm

    if(!id && id=="") {
        return null
    }
    return id;
}

export function getLetterTypeSideMenu(state) {
    let type = null;
    type = state.find((item)=> item.name=="LETTER_TYPE_SIDEMENU")?.value

    if(!type && type=="") {
        return null
    }
    return type;
}

export function getNombreAyuntamiento(state) {
    let name = null;
    name = state.find((item)=> item.name=="NOMBRE_AYUNTAMIENTO")?.value

    if(!name && name=="") {
        return null
    }
    return name;
}

export function getIdLetterColorForm(state) {
    let id = null;
    id = state.find((item)=> item.name=="LETTER_COLOR_FORM")?.idPrm

    if(!id && id=="") {
        return null
    }
    return id;
}

export function getLetterColorForm(state) {
    let color = null;
    color = state.find((item)=> item.name=="LETTER_COLOR_FORM")?.value

    if(!color && color=="") {
        return null
    }
    return color;
}

export function getIdLetterSizeForm(state){
    let id = null;
    id = state.find((item)=> item.name=="LETTER_SIZE_FORM")?.idPrm

    if(!id && id=="") {
        return null
    }
    return id;
}

export function getLetterSizeForm(state) {
    let size = null;
    size = state.find((item)=> item.name=="LETTER_SIZE_FORM")?.value

    if(!size && size=="") {
        return null
    }
    return size;
}

export function getIdLetterTypeForm(state) {
    let id = null;
    id = state.find((item)=> item.name=="LETTER_TYPE_FORM")?.idPrm

    if(!id && id=="") {
        return null
    }
    return id;
}

export function getLetterTypeForm(state) {
    let type = null;
    type = state.find((item)=> item.name=="LETTER_TYPE_FORM")?.value

    if(!type && type=="") {
        return null
    }
    return type;
}

export function getIdLetterColorHeadMenu(state) {
    let id = null;
    id = state.find((item)=> item.name=="LETTER_COLOR_HEADMENU")?.idPrm

    if(!id && id=="") {
        return null
    }
    return id;
}

export function getLetterColorHeadMenu(state) {
    let color = null;
    color = state.find((item)=> item.name=="LETTER_COLOR_HEADMENU")?.value

    if(!color && color=="") {
        return null
    }
    return color;
}

export function getIdLetterSizeHeadMenu(state){
    let id = null;
    id = state.find((item)=> item.name=="LETTER_SIZE_HEADMENU")?.idPrm

    if(!id && id=="") {
        return null
    }
    return id;
}

export function getLetterSizeHeadMenu(state) {
    let size = null;
    size = state.find((item)=> item.name=="LETTER_SIZE_HEADMENU")?.value

    if(!size && size=="") {
        return null
    }
    return size;
}

export function getIdLetterTypeHeadMenu(state) {
    let id = null;
    id = state.find((item)=> item.name=="LETTER_TYPE_HEADMENU")?.idPrm

    if(!id && id=="") {
        return null
    }
    return id;
}

export function getLetterTypeHeadMenu(state) {
    let type = null;
    type = state.find((item)=> item.name=="LETTER_TYPE_HEADMENU")?.value

    if(!type && type=="") {
        return null
    }
    return type;
}

export function getShowLegendParam(state) {
    let type = null;
    type = state.find((item)=> item.name=="LEGEND_MAP_DISPLAY")?.value

    if(!type && type=="") {
        return null
    }
    return type;
}


export function getIdWelcomeMessage(state) {
    let id = null;
    id = state.find((item)=> item.name=="WELCOM_MESSAGE")?.idPrm

    if(!id && id=="") {
        return null
    }
    return id;
}

export function getWelcomeMessage(state) {

    let out = null;
    out = state.find((item)=> item.name=="WELCOM_MESSAGE")?.value

    if(!out && out=="") {
        return null
    }
    return out;
}

export function getIdInfoMessageConfig(state) {
    let id = null;
    id = state.find((item)=> item.name=="INFO_MESSAGE_CONFIG")?.idPrm

    if(!id && id=="") {
        return null
    }
    return id;
}

export function getInfoMessageConfig(state) {
    let type = null;
    type = state.find((item)=> item.name=="INFO_MESSAGE_CONFIG")?.value

    if(!type && type=="") {
        return null
    }
    return type;
}

export function getIdLetterTypeLegend(state) {
    let id = null;
    id = state.find((item)=> item.name=="LETTER_TYPE_LEGEND")?.idPrm

    if(!id && id=="") {
        return null
    }
    return id;
}

export function getLetterTypeLegend(state) {
    let type = null;
    type = state.find((item)=> item.name=="LETTER_TYPE_LEGEND")?.value

    if(!type && type=="") {
        return null
    }
    return type;
}

export function getIdLetterColorLegend(state) {
    let id = null;
    id = state.find((item)=> item.name=="LETTER_COLOR_LEGEND")?.idPrm

    if(!id && id=="") {
        return null
    }
    return id;
}

export function getLetterColorLegend(state) {
    let type = null;
    type = state.find((item)=> item.name=="LETTER_COLOR_LEGEND")?.value

    if(!type && type=="") {
        return null
    }
    return type;
}

export function getIdLetterSizeLegend(state) {
    let id = null;
    id = state.find((item)=> item.name=="LETTER_SIZE_LEGEND")?.idPrm

    if(!id && id=="") {
        return null
    }
    return id;
}

export function getLetterSizeLegend(state) {
    let type = null;
    type = state.find((item)=> item.name=="LETTER_SIZE_LEGEND")?.value

    if(!type && type=="") {
        return null
    }
    return type;
}

export function getIdBorderColorSideMenuOptions(state) {
    let id = null;
    id = state.find((item)=> item.name=="BORDER_COLOR_SIDEMENU_OPTIONS")?.idPrm

    if(!id && id=="") {
        return null
    }
    return id;
}

export function getBorderColorSideMenuOptions(state) {
    let type = null;
    type = state.find((item)=> item.name=="BORDER_COLOR_SIDEMENU_OPTIONS")?.value

    if(!type && type=="") {
        return null
    }
    return type;
}

export function getDefaultAppId(state) {
    let type = null;
    type = state.find((item)=> item.name=="DEFAULT_APP_ID")?.value

    if(!type && type=="") {
        return null
    }
    return type;
}

export function getIdActiveBgSideMenu(state) {
    let id = null;
    id = state.find((item)=> item.name=="ACTIVE_BG_COLOR_SIDEMENU")?.idPrm

    if(!id && id=="") {
        return null
    }
    return id;
}

export function getActiveBgColorSideMenu(state) {
    let type = null;
    type = state.find((item)=> item.name=="ACTIVE_BG_COLOR_SIDEMENU")?.value

    if(!type && type=="") {
        return null
    }
    return type;
}

export function getIdHoverBgSideMenu(state) {
    let id = null;
    id = state.find((item)=> item.name=="HOVER_BG_COLOR_SIDEMENU")?.idPrm

    if(!id && id=="") {
        return null
    }
    return id;
}

export function getHoverBgColorSideMenu(state) {
    let type = null;
    type = state.find((item)=> item.name=="HOVER_BG_COLOR_SIDEMENU")?.value

    if(!type && type=="") {
        return null
    }
    return type;
}

export function getIdManagerEmail(state) {
    let id = null;
    id = state.find((item)=> item.name=="GESTOR_EMAIL")?.idPrm

    if(!id && id=="") {
        return null
    }
    return id;
}

export function getManagerEmail(state) {
    let type = null;
    type = state.find((item)=> item.name=="GESTOR_EMAIL")?.value

    if(!type && type=="") {
        return null
    }
    return type;
}

export function getIdNumberShownApps(state) {
    let id = null;
    id = state.find((item)=> item.name=="NUMBER_APP_SHOWN_MENU")?.idPrm

    if(!id && id=="") {
        return null
    }
    return id;
}

export function getNumberShownApps(state) {
    let type = null;
    type = state.find((item)=> item.name=="NUMBER_APP_SHOWN_MENU")?.value
    if(!type && type=="") {
        return null
    }

    return type;
}