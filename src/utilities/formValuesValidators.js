// Mapa de funciones que validan los distintos tipos de reglas
export const validators = {
  required: (value) => value !== undefined && value !== null && value !== '',
  minLength: (value, length) => typeof value === 'string' && value.length >= length,
  minValue: (value, min) => typeof value === 'number' && value >= min
};

// Aplica las reglas de validación a un valor y devuelve el primer error que encuentre
// TODO adecuar a las reglas de validación que se definan en el formulario en base a la configuración QGIS
export const validateValue = (value, rules) => {
  for (const rule of rules) {
    const fn = validators[rule.rule];
    if (!fn) continue;

    // Si la regla tiene un valor extra (como longitud mínima), se lo pasamos
    const valid = rule.value !== undefined ? fn(value, rule.value) : fn(value);

    // Si la validación falla, devolvemos el mensaje de error
    if (!valid) return rule.message;
  }

  // Si todo es válido, no hay mensaje de error
  return '';
};