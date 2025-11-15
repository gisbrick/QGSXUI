// Sistema completo de validación para campos de formulario QGIS
// Basado en la implementación legacy pero mejorado

/**
 * Utilidades para formatear fechas
 */
const dateToString = (date) => {
  if (!date) return '';
  if (typeof date === 'string') return date;
  if (date instanceof Date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0');
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  }
  return String(date);
};

/**
 * Encuentra el símbolo comparativo en una constraint dependOn
 */
const findDependOnSymbol = (dependOnParam) => {
  if (dependOnParam.includes('>=')) return '>=';
  if (dependOnParam.includes('<=')) return '<=';
  if (dependOnParam.includes('<>')) return '<>';
  if (dependOnParam.includes('=')) return '=';
  if (dependOnParam.includes('>')) return '>';
  if (dependOnParam.includes('<')) return '<';
  return null;
};

/**
 * Valida que un valor sea mayor que la fecha/hora actual
 */
export const greaterThanNow = (value) => {
  if (!value) return false;
  const valueDate = new Date(value);
  const now = new Date();
  return valueDate > now;
};

/**
 * Valida que un valor sea menor que la fecha/hora actual
 */
export const smallerThanNow = (value) => {
  if (!value) return false;
  const valueDate = new Date(value);
  const now = new Date();
  return valueDate < now;
};

/**
 * Valida que value1 sea mayor que value2
 */
export const greaterThanValue = (value1, value2) => {
  if (value1 === null || value1 === undefined || value2 === null || value2 === undefined) return false;
  // Intentar comparar como números primero
  const num1 = Number(value1);
  const num2 = Number(value2);
  if (!isNaN(num1) && !isNaN(num2)) {
    return num1 > num2;
  }
  // Comparar como strings
  return String(value1) > String(value2);
};

/**
 * Valida que value1 sea mayor o igual que value2
 */
export const greaterEqualThanValue = (value1, value2) => {
  if (value1 === null || value1 === undefined || value2 === null || value2 === undefined) return false;
  const num1 = Number(value1);
  const num2 = Number(value2);
  if (!isNaN(num1) && !isNaN(num2)) {
    return num1 >= num2;
  }
  return String(value1) >= String(value2);
};

/**
 * Valida que value1 sea menor que value2
 */
export const smallerThanValue = (value1, value2) => {
  if (value1 === null || value1 === undefined || value2 === null || value2 === undefined) return false;
  const num1 = Number(value1);
  const num2 = Number(value2);
  if (!isNaN(num1) && !isNaN(num2)) {
    return num1 < num2;
  }
  return String(value1) < String(value2);
};

/**
 * Valida que value1 sea menor o igual que value2
 */
export const smallerEqualThanValue = (value1, value2) => {
  if (value1 === null || value1 === undefined || value2 === null || value2 === undefined) return false;
  const num1 = Number(value1);
  const num2 = Number(value2);
  if (!isNaN(num1) && !isNaN(num2)) {
    return num1 <= num2;
  }
  return String(value1) <= String(value2);
};

/**
 * Validación de DNI español
 */
const DNI_REGEX = /^(\d{8})([A-Z])$/;
export const validDNI = (dni) => {
  if (!dni) return false;
  const dniStr = String(dni).toUpperCase().replace(/\s/g, '');
  const match = dniStr.match(DNI_REGEX);
  if (!match) return false;
  const dni_letters = 'TRWAGMYFPDXBNJZSQVHLCKE';
  const letter = dni_letters.charAt(parseInt(match[1], 10) % 23);
  return letter === match[2];
};

/**
 * Validación de NIE español
 */
const NIE_REGEX = /^[XYZ]\d{7,8}[A-Z]$/;
export const validNIE = (nie) => {
  if (!nie) return false;
  const nieStr = String(nie).toUpperCase().replace(/\s/g, '');
  const match = nieStr.match(NIE_REGEX);
  if (!match) return false;
  const nie_prefix = nieStr.charAt(0);
  let prefixNum = 0;
  switch (nie_prefix) {
    case 'X': prefixNum = 0; break;
    case 'Y': prefixNum = 1; break;
    case 'Z': prefixNum = 2; break;
    default: return false;
  }
  return validDNI(prefixNum + nieStr.substr(1));
};

/**
 * Validación de CIF español
 */
const CIF_REGEX = /^([ABCDEFGHJKLMNPQRSUVW])(\d{7})([0-9A-J])$/;
export const validCIF = (cif) => {
  if (!cif) return false;
  const cifStr = String(cif).toUpperCase().replace(/\s/g, '');
  const match = cifStr.match(CIF_REGEX);
  if (!match) return false;
  const letter = match[1];
  const number = match[2];
  const control = match[3];
  
  let even_sum = 0;
  let odd_sum = 0;
  
  for (let i = 0; i < number.length; i++) {
    const n = parseInt(number[i], 10);
    if (i % 2 === 0) {
      // Posiciones impares
      let multiplied = n * 2;
      odd_sum += multiplied < 10 ? multiplied : multiplied - 9;
    } else {
      // Posiciones pares
      even_sum += n;
    }
  }
  
  const control_digit = (10 - (even_sum + odd_sum).toString().substr(-1));
  const control_letter = 'JABCDEFGHI'.substr(control_digit, 1);
  
  if (letter.match(/[ABEH]/)) {
    return control == control_digit;
  } else if (letter.match(/[KPQS]/)) {
    return control == control_letter;
  } else {
    return control == control_digit || control == control_letter;
  }
};

/**
 * Valida DNI, NIE o CIF español
 */
export const validateSpanishID = (str) => {
  if (!str) return false;
  const strUpper = String(str).toUpperCase().replace(/\s/g, '');
  
  if (strUpper.match(DNI_REGEX)) {
    return validDNI(strUpper);
  }
  if (strUpper.match(CIF_REGEX)) {
    return validCIF(strUpper);
  }
  if (strUpper.match(NIE_REGEX)) {
    return validNIE(strUpper);
  }
  return false;
};

/**
 * Valida la constraint dependOn
 */
export const dependOn = (comparedFieldNameWithValue, properties) => {
  if (!comparedFieldNameWithValue || !properties) return false;
  
  const comparativeSymbol = findDependOnSymbol(comparedFieldNameWithValue);
  if (!comparativeSymbol) return false;
  
  let field = '';
  let value = '';
  
  switch (comparativeSymbol) {
    case '=':
      [field, value] = comparedFieldNameWithValue.split('=');
      return properties[field] == value;
    case '<>':
      [field, value] = comparedFieldNameWithValue.split('<>');
      return properties[field] != value;
    case '<':
      [field, value] = comparedFieldNameWithValue.split('<');
      return properties[field] < value;
    case '<=':
      [field, value] = comparedFieldNameWithValue.split('<=');
      return properties[field] <= value;
    case '>':
      [field, value] = comparedFieldNameWithValue.split('>');
      return properties[field] > value;
    case '>=':
      [field, value] = comparedFieldNameWithValue.split('>=');
      return properties[field] >= value;
    default:
      return false;
  }
};

/**
 * Valida el tipo de dato de un valor según el tipo de campo QGIS
 */
export const validateDataType = (value, fieldType) => {
  if (value === null || value === undefined || value === '') {
    return { valid: true, error: '' }; // Los valores vacíos se validan con constraintNotNull
  }
  
  const typeNameUpper = String(fieldType || '').toUpperCase();
  
  // Tipos enteros
  if (typeNameUpper.includes('INT') || typeNameUpper.includes('LONG') || typeNameUpper.includes('INTEGER')) {
    const num = Number(value);
    if (isNaN(num) || !Number.isInteger(num)) {
      return { valid: false, error: 'ui.qgis.validation.integerType' };
    }
    return { valid: true, error: '' };
  }
  
  // Tipos decimales
  if (typeNameUpper.includes('REAL') || typeNameUpper.includes('FLOAT') || typeNameUpper.includes('DOUBLE') || typeNameUpper.includes('NUMERIC') || typeNameUpper.includes('DECIMAL')) {
    const num = Number(value);
    if (isNaN(num)) {
      return { valid: false, error: 'ui.qgis.validation.numberType' };
    }
    return { valid: true, error: '' };
  }
  
  // Tipos fecha
  if (typeNameUpper.includes('DATE')) {
    const date = new Date(value);
    if (isNaN(date.getTime())) {
      return { valid: false, error: 'ui.qgis.validation.dateType' };
    }
    return { valid: true, error: '' };
  }
  
  // Tipos hora
  if (typeNameUpper.includes('TIME')) {
    // Validar formato de hora HH:mm:ss o HH:mm
    const timeRegex = /^([0-1][0-9]|2[0-3]):[0-5][0-9](:[0-5][0-9])?$/;
    if (!timeRegex.test(String(value))) {
      return { valid: false, error: 'ui.qgis.validation.timeType' };
    }
    return { valid: true, error: '' };
  }
  
  // Tipos booleano
  if (typeNameUpper.includes('BOOL') || typeNameUpper.includes('BIT') || typeNameUpper.includes('BOOLEAN')) {
    const boolValue = value === true || value === false || value === 1 || value === 0 || value === '1' || value === '0' || value === 'true' || value === 'false';
    if (!boolValue && value !== null && value !== '') {
      return { valid: false, error: 'ui.qgis.validation.booleanType' };
    }
    return { valid: true, error: '' };
  }
  
  // Por defecto, aceptar cualquier valor (texto)
  return { valid: true, error: '' };
};

/**
 * Parsea una constraint expression de QGIS
 */
const parseConstraintExpression = (constraintExpression) => {
  if (!constraintExpression || typeof constraintExpression !== 'string') {
    return [];
  }
  
  // Dividir por comas y limpiar
  return constraintExpression.split(',').map(c => c.trim()).filter(c => c);
};

/**
 * Valida un campo completo según su configuración QGIS
 * @param {Object} field - Configuración del campo QGIS
 * @param {*} value - Valor a validar
 * @param {Object} allValues - Todos los valores del formulario (para validaciones comparativas)
 * @param {Object} layer - Configuración de la capa (para obtener otros campos)
 * @param {Function} t - Función de traducción
 * @returns {Object} { valid: boolean, error: string }
 */
export const validateFieldValue = (field, value, allValues = {}, layer = null, t = null, language = 'es', translations = null) => {
  // Función de traducción que usa el sistema de traducción del proyecto
  const translate = (key, params = {}) => {
    // Si hay función de traducción proporcionada, usarla
    if (t && typeof t === 'function') {
      try {
        const translated = t(key, params);
        // Si la traducción devuelve la clave (no encontrada), usar fallback
        if (translated && translated !== key) {
          return translated;
        }
      } catch (e) {
        // Si hay error, continuar con fallback
      }
    }
    
    // Fallback: usar traducciones del contexto o cargar desde archivos JSON según el idioma
    try {
      // Primero intentar usar las traducciones del contexto si están disponibles
      if (translations && typeof translations === 'object') {
        const keys = key.split('.');
        let result = translations;
        
        for (const k of keys) {
          if (result && typeof result === 'object' && k in result) {
            result = result[k];
          } else {
            result = null;
            break;
          }
        }
        
        if (typeof result === 'string' && result.trim()) {
          let msg = result;
          if (params && Object.keys(params).length > 0) {
            Object.keys(params).forEach(k => {
              msg = msg.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
            });
          }
          return msg;
        }
      }
      
      // Si no hay traducciones del contexto, usar fallback hardcodeado según el idioma
      // Nota: Este fallback solo incluye ES y EN. Para otros idiomas, deben estar en los archivos de traducción
      const fallbackTranslations = (language === 'en' || language?.startsWith('en')) ? {
        'ui.qgis.validation.required': 'This field must be filled in mandatory',
        'ui.qgis.validation.requiredWithField': 'The field "{field}" must be filled in mandatory',
        'ui.qgis.validation.invalidType': 'The entered data type is not valid',
        'ui.qgis.validation.invalidTypeWithField': 'The field "{field}": The entered data type is not valid',
        'ui.qgis.validation.greaterThanNow': 'The date/time must be after the current date/time',
        'ui.qgis.validation.greaterThanNowWithField': 'The field "{field}": The date/time must be after the current date/time',
        'ui.qgis.validation.smallerThanNow': 'The date/time must be before the current date/time',
        'ui.qgis.validation.smallerThanNowWithField': 'The field "{field}": The date/time must be before the current date/time',
        'ui.qgis.validation.greaterThanField': 'The value must be greater than the value of field "{field}"',
        'ui.qgis.validation.greaterEqualThanField': 'The value must be greater than or equal to the value of field "{field}"',
        'ui.qgis.validation.smallerThanField': 'The value must be less than the value of field "{field}"',
        'ui.qgis.validation.maxLength': 'The text cannot have more than {max} characters',
        'ui.qgis.validation.maxLengthWithField': 'The field "{field}": The text cannot have more than {max} characters',
        'ui.qgis.validation.dependOn': 'This field can only have a value when field "{field}" meets the required condition',
        'ui.qgis.validation.dni': 'The entered DNI is not valid',
        'ui.qgis.validation.nie': 'The entered NIE is not valid',
        'ui.qgis.validation.cif': 'The entered CIF is not valid',
        'ui.qgis.validation.dniNieCif': 'The entered document (DNI/NIE/CIF) is not valid',
        'ui.qgis.validation.integerType': 'The value must be an integer number',
        'ui.qgis.validation.numberType': 'The value must be a number',
        'ui.qgis.validation.dateType': 'The value must be a valid date',
        'ui.qgis.validation.timeType': 'The value must be a valid time (HH:mm or HH:mm:ss)',
        'ui.qgis.validation.booleanType': 'The value must be true or false',
        'ui.qgis.validation.maxLengthField': 'The text cannot have more than {length} characters',
        'ui.qgis.validation.maxLengthFieldWithField': 'The field "{field}": The text cannot have more than {length} characters',
        'ui.qgis.validation.maxDecimals': 'The number cannot have more than {precision} decimals',
        'ui.qgis.validation.maxDecimalsWithField': 'The field "{field}": The number cannot have more than {precision} decimals',
        'ui.qgis.validation.invalidValue': 'The entered value is not valid'
      } : {
        'ui.qgis.validation.required': 'Este campo debe rellenarse de manera obligatoria',
        'ui.qgis.validation.requiredWithField': 'El campo "{field}" debe rellenarse de manera obligatoria',
        'ui.qgis.validation.invalidType': 'El tipo de dato introducido no es válido',
        'ui.qgis.validation.invalidTypeWithField': 'El campo "{field}": El tipo de dato introducido no es válido',
        'ui.qgis.validation.greaterThanNow': 'La fecha/hora debe ser posterior a la fecha/hora actual',
        'ui.qgis.validation.greaterThanNowWithField': 'El campo "{field}": La fecha/hora debe ser posterior a la fecha/hora actual',
        'ui.qgis.validation.smallerThanNow': 'La fecha/hora debe ser anterior a la fecha/hora actual',
        'ui.qgis.validation.smallerThanNowWithField': 'El campo "{field}": La fecha/hora debe ser anterior a la fecha/hora actual',
        'ui.qgis.validation.greaterThanField': 'El valor debe ser mayor que el valor del campo "{field}"',
        'ui.qgis.validation.greaterEqualThanField': 'El valor debe ser mayor o igual que el valor del campo "{field}"',
        'ui.qgis.validation.smallerThanField': 'El valor debe ser menor que el valor del campo "{field}"',
        'ui.qgis.validation.maxLength': 'El texto no puede tener más de {max} caracteres',
        'ui.qgis.validation.maxLengthWithField': 'El campo "{field}": El texto no puede tener más de {max} caracteres',
        'ui.qgis.validation.dependOn': 'Este campo solo puede tener valor cuando el campo "{field}" cumple la condición requerida',
        'ui.qgis.validation.dni': 'El DNI introducido no es válido',
        'ui.qgis.validation.nie': 'El NIE introducido no es válido',
        'ui.qgis.validation.cif': 'El CIF introducido no es válido',
        'ui.qgis.validation.dniNieCif': 'El documento (DNI/NIE/CIF) introducido no es válido',
        'ui.qgis.validation.integerType': 'El valor debe ser un número entero',
        'ui.qgis.validation.numberType': 'El valor debe ser un número',
        'ui.qgis.validation.dateType': 'El valor debe ser una fecha válida',
        'ui.qgis.validation.timeType': 'El valor debe ser una hora válida (HH:mm o HH:mm:ss)',
        'ui.qgis.validation.booleanType': 'El valor debe ser verdadero o falso',
        'ui.qgis.validation.maxLengthField': 'El texto no puede tener más de {length} caracteres',
        'ui.qgis.validation.maxLengthFieldWithField': 'El campo "{field}": El texto no puede tener más de {length} caracteres',
        'ui.qgis.validation.maxDecimals': 'El número no puede tener más de {precision} decimales',
        'ui.qgis.validation.maxDecimalsWithField': 'El campo "{field}": El número no puede tener más de {precision} decimales',
        'ui.qgis.validation.invalidValue': 'El valor introducido no es válido'
      };
      
      let msg = fallbackTranslations[key] || key;
      if (params && Object.keys(params).length > 0) {
        Object.keys(params).forEach(k => {
          msg = msg.replace(new RegExp(`\\{${k}\\}`, 'g'), params[k]);
        });
      }
      return msg;
    } catch (e) {
      // Si todo falla, devolver la clave
      return key;
    }
  };
  
  // Función helper para construir mensajes de error con el nombre del campo
  const buildFieldError = (fieldAlias, baseKey, params = {}) => {
    const fieldParams = { ...params, field: fieldAlias };
    // Intentar primero con la clave que incluye el nombre del campo
    const withFieldKey = `${baseKey}WithField`;
    let errorMsg = translate(withFieldKey, fieldParams);
    
    // Si no existe la clave con campo, construir el mensaje manualmente
    if (errorMsg === withFieldKey) {
      const baseMsg = translate(baseKey, params);
      errorMsg = translate('ui.qgis.validation.fieldPrefix', { field: fieldAlias, message: baseMsg });
      // Si tampoco existe fieldPrefix, construir manualmente según el idioma
      if (errorMsg === 'ui.qgis.validation.fieldPrefix') {
        // Prefijo del campo según el idioma (solo ES y EN tienen fallback hardcodeado)
        // Para otros idiomas, debe estar en los archivos de traducción
        const fieldPrefix = (language === 'en' || language?.startsWith('en')) ? 'Field' : 'El campo';
        errorMsg = `${fieldPrefix} "${fieldAlias}": ${baseMsg}`;
      }
    }
    
    return errorMsg;
  };
  
  // Si el campo es de solo lectura, no validar
  if (field.readOnly) {
    return { valid: true, error: '' };
  }
  
  // 1. Validar constraintNotNull (campo requerido)
  if (field.constraintNotNull) {
    if (value === null || value === undefined || value === '') {
      const fieldAlias = field.alias || field.name;
      // Usar mensaje personalizado si existe, sino usar el traducido
      const errorMsg = field.constraints?.constraintDescription;
      if (errorMsg && errorMsg.trim()) {
        // Si hay mensaje personalizado, usarlo tal cual
        return { valid: false, error: errorMsg };
      } else {
        // Si no hay mensaje personalizado, usar el mensaje estándar traducido con el nombre del campo
        return { valid: false, error: buildFieldError(fieldAlias, 'ui.qgis.validation.required') };
      }
    }
  }
  
  // Si el valor está vacío y no es requerido, no validar más
  if ((value === null || value === undefined || value === '') && !field.constraintNotNull) {
    return { valid: true, error: '' };
  }
  
  // 2. Validar tipo de dato
  if (field.typeName) {
    const typeValidation = validateDataType(value, field.typeName);
    if (!typeValidation.valid) {
      const fieldAlias = field.alias || field.name;
      // Si el error es una clave de traducción, traducirla
      let errorMsg = typeValidation.error;
      if (errorMsg && errorMsg.startsWith('ui.qgis.validation.')) {
        // Usar buildFieldError para incluir el nombre del campo
        return { valid: false, error: buildFieldError(fieldAlias, errorMsg) };
      } else if (!errorMsg) {
        return { valid: false, error: buildFieldError(fieldAlias, 'ui.qgis.validation.invalidType') };
      } else {
        // Si el error ya tiene texto, añadir el nombre del campo
        return { valid: false, error: buildFieldError(fieldAlias, 'ui.qgis.validation.invalidType') };
      }
    }
  }
  
  // 3. Validar constraintExpression
  if (field.constraints && field.constraints.constraintExpression) {
    const constraints = parseConstraintExpression(field.constraints.constraintExpression);
    
    for (const constraint of constraints) {
      // Greater than now
      if (constraint === "'{greaterThan:{now}}'" || constraint === "{greaterThan:{now}}") {
        if (!greaterThanNow(value)) {
          const fieldAlias = field.alias || field.name;
          const errorMsg = field.constraints.constraintDescription || buildFieldError(fieldAlias, 'ui.qgis.validation.greaterThanNow');
          return { valid: false, error: errorMsg };
        }
      }
      
      // Smaller than now
      if (constraint === "'{smallerThan:{now}}'" || constraint === "{smallerThan:{now}}") {
        if (!smallerThanNow(value)) {
          const fieldAlias = field.alias || field.name;
          const errorMsg = field.constraints.constraintDescription || buildFieldError(fieldAlias, 'ui.qgis.validation.smallerThanNow');
          return { valid: false, error: errorMsg };
        }
      }
      
      // Greater than field
      if (constraint.startsWith("'{greaterThan:") || constraint.startsWith("{greaterThan:")) {
        const match = constraint.match(/['"]?\{greaterThan:([^}]+)\}['"]?/);
        if (match) {
          const comparedFieldName = match[1].trim();
          const comparedValue = allValues[comparedFieldName];
          if (comparedValue != null && value != null) {
            const comparedField = layer?.fields?.find(f => f.name === comparedFieldName);
            const comparedFieldAlias = comparedField?.alias || comparedFieldName;
            if (!greaterThanValue(value, comparedValue)) {
              const errorMsg = field.constraints.constraintDescription || translate('ui.qgis.validation.greaterThanField', { field: comparedFieldAlias });
              return { valid: false, error: errorMsg };
            }
          }
        }
      }
      
      // Greater equal than field
      if (constraint.startsWith("'{greaterEqualThan:") || constraint.startsWith("{greaterEqualThan:")) {
        const match = constraint.match(/['"]?\{greaterEqualThan:([^}]+)\}['"]?/);
        if (match) {
          const comparedFieldName = match[1].trim();
          const comparedValue = allValues[comparedFieldName];
          if (comparedValue != null && value != null) {
            const comparedField = layer?.fields?.find(f => f.name === comparedFieldName);
            const comparedFieldAlias = comparedField?.alias || comparedFieldName;
            if (!greaterEqualThanValue(value, comparedValue)) {
              const errorMsg = field.constraints.constraintDescription || translate('ui.qgis.validation.greaterEqualThanField', { field: comparedFieldAlias });
              return { valid: false, error: errorMsg };
            }
          }
        }
      }
      
      // Smaller than field
      if (constraint.startsWith("'{smallerThan:") || constraint.startsWith("{smallerThan:")) {
        const match = constraint.match(/['"]?\{smallerThan:([^}]+)\}['"]?/);
        if (match) {
          const comparedFieldName = match[1].trim();
          const comparedValue = allValues[comparedFieldName];
          if (comparedValue != null && value != null) {
            const comparedField = layer?.fields?.find(f => f.name === comparedFieldName);
            const comparedFieldAlias = comparedField?.alias || comparedFieldName;
            if (!smallerThanValue(value, comparedValue)) {
              const errorMsg = field.constraints.constraintDescription || translate('ui.qgis.validation.smallerThanField', { field: comparedFieldAlias });
              return { valid: false, error: errorMsg };
            }
          }
        }
      }
      
      // Max length
      if (constraint.startsWith("'{maxLength:") || constraint.startsWith("{maxLength:")) {
        const match = constraint.match(/['"]?\{maxLength:(\d+)\}['"]?/);
        if (match) {
          const maxLength = parseInt(match[1], 10);
          if (String(value).length > maxLength) {
            const fieldAlias = field.alias || field.name;
            const errorMsg = field.constraints.constraintDescription || buildFieldError(fieldAlias, 'ui.qgis.validation.maxLength', { max: maxLength });
            return { valid: false, error: errorMsg };
          }
        }
      }
      
      // Depend on
      if (constraint.includes('{dependOn:') || constraint.includes("'{dependOn:")) {
        const match = constraint.match(/['"]?\{dependOn:\{([^}]+)\}\}['"]?/);
        if (match) {
          const comparedFieldNameWithValue = match[1].trim();
          if (!dependOn(comparedFieldNameWithValue, allValues)) {
            // Si no cumple la dependencia, el campo debe estar vacío
            if (value != null && value !== '') {
              const fieldName = comparedFieldNameWithValue.split(/[=<>]/)[0];
              const comparedField = layer?.fields?.find(f => f.name === fieldName);
              const comparedFieldAlias = comparedField?.alias || fieldName;
              const errorMsg = field.constraints.constraintDescription || translate('ui.qgis.validation.dependOn', { field: comparedFieldAlias });
              return { valid: false, error: errorMsg };
            }
            // Si cumple la dependencia, el campo debe tener valor
            if (field.constraintNotNull && (value === null || value === '')) {
              const errorMsg = field.constraints.constraintDescription || translate('ui.qgis.validation.required');
              return { valid: false, error: errorMsg };
            }
          }
        }
      }
      
      // DNI
      if (constraint === "'{DNI}'" || constraint === "{DNI}") {
        if (!validDNI(value)) {
          const errorMsg = field.constraints.constraintDescription || translate('ui.qgis.validation.dni');
          return { valid: false, error: errorMsg };
        }
      }
      
      // NIE
      if (constraint === "'{NIE}'" || constraint === "{NIE}") {
        if (!validNIE(value)) {
          const errorMsg = field.constraints.constraintDescription || translate('ui.qgis.validation.nie');
          return { valid: false, error: errorMsg };
        }
      }
      
      // CIF
      if (constraint === "'{CIF}'" || constraint === "{CIF}") {
        if (!validCIF(value)) {
          const errorMsg = field.constraints.constraintDescription || translate('ui.qgis.validation.cif');
          return { valid: false, error: errorMsg };
        }
      }
      
      // DNI_NIE_CIF
      if (constraint === "'{DNI_NIE_CIF}'" || constraint === "{DNI_NIE_CIF}") {
        if (!validateSpanishID(value)) {
          const errorMsg = field.constraints.constraintDescription || translate('ui.qgis.validation.dniNieCif');
          return { valid: false, error: errorMsg };
        }
      }
    }
  }
  
  // 4. Validar longitud máxima del campo (si está definida)
  if (field.length && field.length > 0) {
    const valueStr = String(value || '');
    if (valueStr.length > field.length) {
      const fieldAlias = field.alias || field.name;
      return { valid: false, error: buildFieldError(fieldAlias, 'ui.qgis.validation.maxLengthField', { length: field.length }) };
    }
  }
  
  // 5. Validar precisión para campos numéricos
  if (field.precision && field.precision > 0 && (field.typeName?.toUpperCase().includes('REAL') || field.typeName?.toUpperCase().includes('FLOAT') || field.typeName?.toUpperCase().includes('DOUBLE'))) {
    const valueStr = String(value || '');
    const decimalPart = valueStr.split('.')[1];
    if (decimalPart && decimalPart.length > field.precision) {
      const fieldAlias = field.alias || field.name;
      return { valid: false, error: buildFieldError(fieldAlias, 'ui.qgis.validation.maxDecimals', { precision: field.precision }) };
    }
  }
  
  return { valid: true, error: '' };
};

// Mantener compatibilidad con el código existente
export const validators = {
  required: (value) => value !== undefined && value !== null && value !== '',
  minLength: (value, length) => typeof value === 'string' && value.length >= length,
  minValue: (value, min) => typeof value === 'number' && value >= min,
  maxLength: (value, max) => typeof value === 'string' && value.length <= max,
  maxValue: (value, max) => typeof value === 'number' && value <= max
};

/**
 * Aplica las reglas de validación a un valor y devuelve el primer error que encuentre
 * @deprecated Usar validateFieldValue en su lugar
 */
export const validateValue = (value, rules) => {
  for (const rule of rules) {
    const fn = validators[rule.rule];
    if (!fn) continue;
    
    const valid = rule.value !== undefined ? fn(value, rule.value) : fn(value);
    
    if (!valid) return rule.message;
  }
  
  return '';
};
