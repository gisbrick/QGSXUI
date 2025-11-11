import { dateToString, findDependOnSymbol } from "./valueUtils";

export function greaterThanNow(value) {

    return value > dateToString(new Date())
}

export function smallerThanNow(value) {
    return value < dateToString(new Date())
}

export function greaterThanValue(value1, value2) {
    return value1 > value2
}

export function greaterEqualThanValue(value1, value2) {
    return value1 >= value2
}

export function smallerThanValue(value1, value2) {
    return value1 < value2
}

export function smallerEqualThanValue(value1, value2) {
    return value1 <= value2
}

var DNI_REGEX = /^(\d{8})([A-Z])$/;
var CIF_REGEX = /^([ABCDEFGHJKLMNPQRSUVW])(\d{7})([0-9A-J])$/;
var NIE_REGEX = /^[XYZ]\d{7,8}[A-Z]$/;

export function validateSpanishID(str) {

    // Ensure upcase and remove whitespace
    str = str.toUpperCase().replace(/\s/, '');

    var valid = false;
    var type = spainIdType(str);

    switch (type) {
        case 'dni':
            valid = validDNI(str);
            break;
        case 'nie':
            valid = validNIE(str);
            break;
        case 'cif':
            valid = validCIF(str);
            break;
    }
    /*
    return {
        type: type,
        valid: valid
    };*/
    return valid;

};

export function spainIdType(str) {
    if (str.match(DNI_REGEX)) {
        return 'dni';
    }
    if (str.match(CIF_REGEX)) {
        return 'cif';
    }
    if (str.match(NIE_REGEX)) {
        return 'nie';
    }
};

export function validDNI(dni) {
    var dni_letters = "TRWAGMYFPDXBNJZSQVHLCKE";
    var letter = dni_letters.charAt(parseInt(dni, 10) % 23);

    return letter == dni.charAt(8);
};

/**
 * Función que valida la constraint dependOn proveniente de la capa
 * 
 * @param {*} comparedFieldName 
 * @param {*} properties 
 * @returns 
 */
export function dependOn(comparedFieldName, properties) {
    let result = false;
    let comparativeSymbol = findDependOnSymbol(comparedFieldName)
    let field = ""
    let value = ""
    switch (comparativeSymbol) {
        case "=":
            field = comparedFieldName.split("=")[0]
            value = comparedFieldName.split("=")[1]
            //console.log("dato1", properties[field])
            //console.log("dato2", value)
            if (properties[field] == value) {
                result = true
            }
            else {
                result = false
            }
            break;
        case "<>":
            field = comparedFieldName.split("=")[0]
            value = comparedFieldName.split("=")[1]
            if (properties[field] != value) {
                result = true
            }
            else {
                result = false
            }
            break;
        case "<":
            field = comparedFieldName.split("<")[0]
            value = comparedFieldName.split("<")[1]
            if (properties[field] < value) {
                result = true
            }
            else {
                result = false
            }
            break;
        case "<=":
            field = comparedFieldName.split("<=")[0]
            value = comparedFieldName.split("<=")[1]
            if (properties[field] <= value) {
                result = true
            }
            else {
                result = false
            }
            break;
        case ">":
            field = comparedFieldName.split(">")[0]
            value = comparedFieldName.split(">")[1]
            if (properties[field] > value) {
                result = true
            }
            else {
                result = false
            }
            break;
        case ">=":
            field = comparedFieldName.split(">=")[0]
            value = comparedFieldName.split(">=")[1]
            if (properties[field] >= value) {
                result = true
            }
            else {
                result = false
            }
            break;
        default:
            result = false;
            break;
    }
    return result
};

export function validNIE(nie) {

    // Change the initial letter for the corresponding number and validate as DNI
    var nie_prefix = nie.charAt(0);

    switch (nie_prefix) {
        case 'X': nie_prefix = 0; break;
        case 'Y': nie_prefix = 1; break;
        case 'Z': nie_prefix = 2; break;
    }

    return validDNI(nie_prefix + nie.substr(1));

};

export function validCIF(cif) {

    var match = cif.match(CIF_REGEX);
    var letter = match[1],
        number = match[2],
        control = match[3];

    var even_sum = 0;
    var odd_sum = 0;
    var n;

    for (var i = 0; i < number.length; i++) {
        n = parseInt(number[i], 10);

        // Odd positions (Even index equals to odd position. i=0 equals first position)
        if (i % 2 === 0) {
            // Odd positions are multiplied first.
            n *= 2;

            // If the multiplication is bigger than 10 we need to adjust
            odd_sum += n < 10 ? n : n - 9;

            // Even positions
            // Just sum them
        } else {
            even_sum += n;
        }

    }

    var control_digit = (10 - (even_sum + odd_sum).toString().substr(-1));
    var control_letter = 'JABCDEFGHI'.substr(control_digit, 1);

    // Control must be a digit
    if (letter.match(/[ABEH]/)) {
        return control == control_digit;

        // Control must be a letter
    } else if (letter.match(/[KPQS]/)) {
        return control == control_letter;

        // Can be either
    } else {
        return control == control_digit || control == control_letter;
    }

};


/*
export function isNIF(dni){
    var numero, l, letra;
    var expresion_regular_dni = /^[XYZ]?\d{5,8}[A-Z]$/;

    dni = dni.toUpperCase();

    if(expresion_regular_dni.test(dni) === true){
        numero = dni.substr(0,dni.length-1);
        numero = numero.replace('X', 0);
        numero = numero.replace('Y', 1);
        numero = numero.replace('Z', 2);
        l = dni.substr(dni.length-1, 1);
        numero = numero % 23;
        letra = 'TRWAGMYFPDXBNJZSQVHLCKET';
        letra = letra.substring(numero, numero+1);
        if (letra != l) {
            //alert('Dni erroneo, la letra del NIF no se corresponde');
            return false;
        }else{
            //alert('Dni correcto');
            return true;
        }
    }else{
        //alert('Dni erroneo, formato no válido');
        return false;
    }
}*/
