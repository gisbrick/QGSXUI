const sanitizeFieldName = (name) => {
  if (!name) return '';
  return `"${name.replace(/"/g, '""')}"`;
};

const escapeValue = (value) => {
  if (value === null || value === undefined) return '';
  return String(value).replace(/'/g, "''");
};

const formatDateValue = (value) => {
  if (!value) return '';
  return value;
};

export const getFilterTypeForField = (field) => {
  if (!field) return 'text';
  const widgetType = (field.editorWidgetSetup?.type || '').toLowerCase();
  const typeName = (field.typeName || field.type || '').toLowerCase();

  if (widgetType === 'checkbox' || typeName.includes('bool')) {
    return 'boolean';
  }

  if (
    widgetType === 'valuerelation' ||
    widgetType === 'relationreference' ||
    widgetType === 'valuemap' ||
    widgetType === 'enumeration' ||
    widgetType === 'enum'
  ) {
    return 'select';
  }

  if (typeName.includes('date') || typeName.includes('time')) {
    return 'date';
  }

  if (
    typeName.includes('int') ||
    typeName.includes('real') ||
    typeName.includes('double') ||
    typeName.includes('numeric') ||
    typeName.includes('decimal')
  ) {
    return 'number';
  }

  return 'text';
};

const buildTextClause = (fieldName, filter) => {
  const column = sanitizeFieldName(fieldName);
  const value = escapeValue(filter.value || '');
  if (!value) return null;
  switch (filter.mode) {
    case 'equals':
      return `${column} ILIKE '${value}'`;
    case 'startsWith':
      return `${column} ILIKE '${value}%'`;
    case 'endsWith':
      return `${column} ILIKE '%${value}'`;
    case 'doesNotContain':
      return `${column} NOT ILIKE '%${value}%'`;
    case 'contains':
    default:
      return `${column} ILIKE '%${value}%'`;
  }
};

const buildNumberClause = (fieldName, filter) => {
  const column = sanitizeFieldName(fieldName);
  const value = filter.value;
  const valueTo = filter.valueTo;
  if (value === '' || value === null || value === undefined) {
    return null;
  }
  // En legacy, los valores numéricos también van entre comillas simples
  const valueStr = `'${escapeValue(String(value))}'`;
  const valueToStr = valueTo !== '' && valueTo !== null && valueTo !== undefined 
    ? `'${escapeValue(String(valueTo))}'` 
    : null;
  switch (filter.mode) {
    case 'equals':
      return `${column} = ${valueStr}`;
    case 'notEquals':
      return `${column} <> ${valueStr}`;
    case 'greater':
      return `${column} > ${valueStr}`;
    case 'greaterOrEqual':
      return `${column} >= ${valueStr}`;
    case 'less':
      return `${column} < ${valueStr}`;
    case 'lessOrEqual':
      return `${column} <= ${valueStr}`;
    case 'between':
      if (!valueToStr) {
        return null;
      }
      return `(${column} BETWEEN ${valueStr} AND ${valueToStr})`;
    default:
      return null;
  }
};

const buildDateClause = (fieldName, filter) => {
  const column = sanitizeFieldName(fieldName);
  const value = formatDateValue(filter.value);
  const valueTo = formatDateValue(filter.valueTo);
  if (!value) return null;
  switch (filter.mode) {
    case 'equals':
      return `${column} = '${value}'`;
    case 'before':
      return `${column} < '${value}'`;
    case 'after':
      return `${column} > '${value}'`;
    case 'between':
      if (!valueTo) return null;
      return `(${column} BETWEEN '${value}' AND '${valueTo}')`;
    default:
      return null;
  }
};

const buildBooleanClause = (fieldName, filter) => {
  if (filter.value === undefined || filter.value === null) {
    return null;
  }
  const column = sanitizeFieldName(fieldName);
  return `${column} = ${filter.value ? 'true' : 'false'}`;
};

const buildSelectClause = (fieldName, filter) => {
  if (!filter.values || filter.values.length === 0) {
    return null;
  }
  const column = sanitizeFieldName(fieldName);
  const values = filter.values
    .map((val) => `'${escapeValue(val)}'`)
    .join(', ');
  return `${column} IN (${values})`;
};

export const buildFilterQuery = (filters = {}, fieldsMap = {}) => {
  const clauses = Object.entries(filters)
    .map(([fieldName, filter]) => {
      if (!filter) return null;
      const field = fieldsMap[fieldName];
      const type = filter.type || getFilterTypeForField(field);
      switch (type) {
        case 'text':
          return buildTextClause(fieldName, filter);
        case 'number':
          return buildNumberClause(fieldName, filter);
        case 'date':
          return buildDateClause(fieldName, filter);
        case 'boolean':
          return buildBooleanClause(fieldName, filter);
        case 'select':
          return buildSelectClause(fieldName, filter);
        default:
          return buildTextClause(fieldName, filter);
      }
    })
    .filter(Boolean);

  if (clauses.length === 0) {
    return '';
  }
  return clauses.join(' AND ');
};

