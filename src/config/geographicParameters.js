/**
 * Configuración base de unidades administrativas (municipios)
 * para su uso en distintos componentes de la aplicación.
 * Cada municipio incluye la información de su provincia.
 */

export const ADMINISTRATIVE_MUNICIPALITIES = [
  {
    provinceIneCode: '50',
    provinceCatastroCode: '50',
    provinceName: 'Zaragoza',
    name: 'Zaragoza',
    slug: 'zaragoza',
    cartoCiudadName: 'Zaragoza',
    ineCode: '50297',
    catastroCode: '50297',
    postalCode: '50001',
    provinceSlug: 'zaragoza'
  }
];

const DEFAULT_LOCATION_FILTERS = ADMINISTRATIVE_MUNICIPALITIES.map((municipality) => {
  // Construir objeto provincia desde los datos del municipio
  const province = {
    name: municipality.provinceName,
    slug: municipality.provinceSlug,
    cartoCiudadName: municipality.provinceName,
    ineCode: municipality.provinceIneCode,
    catastroCode: municipality.provinceCatastroCode
  };

  return {
    municipio: municipality.cartoCiudadName || municipality.name,
    provincia: municipality.provinceName || '',
    metadata: {
      municipality,
      province
    }
  };
});

const normalizeCustomFilter = (entry = {}) => {
  // Extraer nombre de provincia
  const provinceName =
    entry?.province?.cartoCiudadName ||
    entry?.province?.name ||
    entry?.provinceName ||
    entry?.provincia ||
    entry?.province ||
    entry?.municipality?.provinceName ||
    '';

  // Extraer nombre de municipio
  const municipalityName =
    entry?.municipality?.cartoCiudadName ||
    entry?.municipality?.name ||
    entry?.municipio ||
    entry?.municipality ||
    entry?.municipioName ||
    entry?.municipalityName ||
    '';

  if (!provinceName && !municipalityName) {
    return null;
  }

  // Construir objeto provincia si tenemos datos del municipio
  let province = entry?.province || null;
  if (!province && entry?.municipality) {
    const mun = entry.municipality;
    province = {
      name: mun.provinceName,
      slug: mun.provinceSlug,
      cartoCiudadName: mun.provinceName,
      ineCode: mun.provinceIneCode,
      catastroCode: mun.provinceCatastroCode
    };
  }

  return {
    municipio: municipalityName,
    provincia: provinceName,
    metadata: {
      province: province,
      municipality: entry?.municipality || null,
      extra: entry
    }
  };
};

export const getDefaultLocationFilters = () => {
  return DEFAULT_LOCATION_FILTERS.map((filter) => ({ ...filter }));
};

export const resolveLocationFilters = (customFilters) => {
  if (Array.isArray(customFilters) && customFilters.length > 0) {
    const normalized = customFilters
      .map((entry) => normalizeCustomFilter(entry))
      .filter(Boolean);

    if (normalized.length > 0) {
      return normalized;
    }
  }

  return getDefaultLocationFilters();
};


