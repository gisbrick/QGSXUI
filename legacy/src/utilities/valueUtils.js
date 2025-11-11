
export function getIntegerTypes() {
    return ["INT", "LONG"]
}


export function getFloatTypes() {
    return ["REAL", "FLOAT", "DOUBLE", "NUMERIC"]
}


export function getDateTypes() {
    return ["DATE", "TIME"]
}


export function getBooleanTypes() {
    return ["BOOL", "BIT"]
}


export function dateToString(d, format) {
    if (!format) {
        return d.getFullYear().toString()
            + "-" +
            ((d.getMonth() + 1).toString().length == 2 ? (d.getMonth() + 1).toString() : "0" + (d.getMonth() + 1).toString())
            + "-" +
            (d.getDate().toString().length == 2 ? d.getDate().toString() : "0" + d.getDate().toString())
            + "T" +
            (d.getHours().toString().length == 2 ? d.getHours().toString() : "0" + d.getHours().toString())
            + ":" +
            ((parseInt(d.getMinutes() / 5) * 5).toString().length == 2 ? (parseInt(d.getMinutes() / 5) * 5).toString() : "0" + (parseInt(d.getMinutes() / 5) * 5).toString())
            + ":00:00";
    }
    else {
        //yyyy-MM-dd HH:mm:ss
        //Convertimos la fecha a string en base al formato 
        format = format.replace("yyyy", d.getFullYear().toString())
        format = format.replace("MM", ((d.getMonth() + 1).toString().length == 2 ? (d.getMonth() + 1).toString() : "0" + (d.getMonth() + 1).toString()))
        format = format.replace("dd", (d.getDate().toString().length == 2 ? d.getDate().toString() : "0" + d.getDate().toString()))
        format = format.replace("HH", (d.getHours().toString().length == 2 ? d.getHours().toString() : "0" + d.getHours().toString()))
        format = format.replace("mm", ((parseInt(d.getMinutes() / 5) * 5).toString().length == 2 ? (parseInt(d.getMinutes() / 5) * 5).toString() : "0" + (parseInt(d.getMinutes() / 5) * 5).toString()))
        format = format.replace("ss", "00")
        format = format.replace("zzz", "00")
        return format;
    }

}

export function dateToVisualDateTimeString(d) {
    let month = (d.getMonth() + 1).toString().padStart(2, '0')
    let day = d.getDate().toString().padStart(2, '0')
    let year = d.getFullYear().toString().padStart(4, '0')
    let hours = d.getHours().toString().padStart(2, '0')
    let minutes = d.getMinutes().toString().padStart(2, '0')
    let secconds = d.getSeconds().toString().padStart(2, '0')
    return day + "\\" + month + "\\" + year + " " + hours + ":" + minutes;
}

export function dateToVisualDateString(d) {
    let month = (d.getMonth() + 1).toString().padStart(2, '0')
    let day = d.getDate().toString().padStart(2, '0')
    let year = d.getFullYear().toString().padStart(4, '0')
    let hours = d.getHours().toString().padStart(2, '0')
    let minutes = d.getMinutes().toString().padStart(2, '0')
    let secconds = d.getSeconds().toString().padStart(2, '0')
    return day + "/" + month + "/" + year;
}

export function dateToVisualTimeString(d) {
    let month = (d.getMonth() + 1).toString().padStart(2, '0')
    let day = d.getDate().toString().padStart(2, '0')
    let year = d.getFullYear().toString().padStart(4, '0')
    let hours = d.getHours().toString().padStart(2, '0')
    let minutes = d.getMinutes().toString().padStart(2, '0')
    let secconds = d.getSeconds().toString().padStart(2, '0')
    return hours + ":" + minutes;
}

export function getCartocidiudadFormat(format, data) {
    let text = format
    let regex = /\{(.*?)\}/g;
    let matches = text.match(regex);

    matches.forEach((match) => {
        let regex = /\{(.*?)\}/g
        let id = regex.exec(match)[1]
        if (!data[id]) {
            text = text.replace(match, "")
        } else {
            text = text.replace(match, data[id])
        }
    })
    return text
}

/**
 * Función que localiza el tipo de simbolo comparativo en la constraint dependOn
 * 
 * @param {*} dependOnParam 
 * @returns 
 */
export function findDependOnSymbol(dependOnParam) {
    if(dependOnParam.includes("=")) {
        return "="
    } else if(dependOnParam.includes(">")) {
        return ">"
    } else if(dependOnParam.includes("<")) {
        return "<"
    } else if(dependOnParam.includes(">=")) {
        return ">="
    } else if(dependOnParam.includes("<=")) {
        return "<="
    } else if(dependOnParam.includes("<>")) {
        return "<>"
    }
}

/**
 * Función que obtienen el formato de un archivo que ha sido guardado en base de datos en formato base64.
 * Este archivo es un campo de la feature
 * 
 * @param {*} feature 
 * @returns 
 */
export function getFormatFromBase64Attachment(properties, field) {
    let regex = /(?<=data:).*?(?=;base64)/g
    let base64 = properties[field.name]
    //si no se encuentra ningun archivo base64 entonces se devuelve un string vacio
    if(base64==null) {
        return ""
    }
    //si hay archivo pero no es base64 entonces se devuelve string vacío
    const format = base64.match(regex);
    if(format.length==0) {
        return ""
    }
    return format[0]
}

/**
* Función que transforma la imagen a código base 64
* 
* @param {*} file 
* @returns 
*/
export function decodeFileToBase64(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(String(reader.result))
        reader.onerror = (error) => reject(error);
    });
}

