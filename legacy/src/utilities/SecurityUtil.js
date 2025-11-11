import { useDispatch, useSelector } from "react-redux";
import { user_state } from "../features/user/userSlice";

export function HasRole(role) {
    const userstate = useSelector(user_state);

    const evalValue = () => {
        if (userstate.logged) {
            return userstate.authorities.includes(role)
        }
        return false;
    }

    return (evalValue())
}

export function IsLogged() {
    const userstate = useSelector(user_state);

    const evalValue = () => {
        return userstate.logged;
    }

    return (evalValue())
}


export function HasAccessToUnitPermission(unit, permission, userstate) {

    //Si no hemos asignado permisios, es porque el recurso el público
    if (!permission) return true;

    const evalValue = () => {
        if (userstate.logged) {
            let out = false;
            for (let i in userstate.authorities) {
                if (userstate.authorities[i].startsWith("ROLE_MANAGER_" + unit.toUpperCase()) || userstate.authorities[i].startsWith("ROLE_ADMIN")) {
                    out = true
                }
            }
            //Si ya tiene acceso, le damos acceso, y si no, evaluamos que tenga acceso al permiso
            return out ? out : userstate.authorities.includes("ROLE_RESOURCE?UNIT=" + unit.toUpperCase() + "&PERMISSION=" + permission.toUpperCase())
        }
        return false;
    }

    return (evalValue())
}

export function IsManagerInUnit(unit) {
    const userstate = useSelector(user_state);

    const evalValue = () => {
        if (userstate.logged) {
            let out = false;
            for (let i in userstate.authorities) {
                if (userstate.authorities[i].startsWith("ROLE_MANAGER_" + unit.toUpperCase()) || userstate.authorities[i].startsWith("ROLE_ADMIN")) {
                    out = true
                }
            }
            return out
        }
        return false;
    }

    return (evalValue())
}

export function IsManager(userstate) {
    const evalValue = () => {
        if (userstate.logged) {
            let out = false;
            for (let i in userstate.authorities) {
                if (userstate.authorities[i].startsWith("ROLE_MANAGER_") || userstate.authorities[i].startsWith("ROLE_ADMIN")) {
                    out = true
                }
            }
            return out
        }
        return false;
    }
    return (evalValue())
}

export function IsAdmin(userstate) {

    const evalValue = () => {
        if (userstate.logged) {
            return userstate.authorities.includes("ROLE_ADMIN")
        }
        return false;
    }

    return (evalValue())
}


export function HasAccessToProjectTool(QGSPRJ, toolName) {
    let out = true;
    if (QGSPRJ.hasOwnProperty("variables")
        && QGSPRJ["variables"].hasOwnProperty("URBEGIS_TOOLS")) {
        var obj = JSON.parse(QGSPRJ["variables"]["URBEGIS_TOOLS"])
        if (obj.hasOwnProperty(toolName) && obj[toolName].hasOwnProperty("PERMISSIONS")) {
            out = obj[toolName]["PERMISSIONS"]
        }
    }

    return out;
}

export function HasAccessToLayerTool(QGSPRJ, layerName, toolName) {
    let out = true;
    if (QGSPRJ.hasOwnProperty("layers")
        && QGSPRJ["layers"].hasOwnProperty(layerName)) {
        let layer = QGSPRJ["layers"][layerName]
        if (layer.hasOwnProperty("customProperties")
            && layer["customProperties"].hasOwnProperty("URBEGIS_LAYER_PERMISSIONS")) {
            var obj = JSON.parse(layer["customProperties"]["URBEGIS_LAYER_PERMISSIONS"])
            if (obj.hasOwnProperty("URBEGIS_LAYER_TOOLS")
                && obj["URBEGIS_LAYER_TOOLS"].hasOwnProperty(toolName)
                && obj["URBEGIS_LAYER_TOOLS"][toolName].hasOwnProperty("PERMISSIONS")) {
                out = obj["URBEGIS_LAYER_TOOLS"][toolName]["PERMISSIONS"]
            }

        }
    }

    return out;
}




