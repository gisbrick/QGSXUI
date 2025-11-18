/**
 * Función que carga los datos de un fichero
 * 
 * @param {*} filename 
 * @returns 
 */
const getGeojsonData = async (filename, dataPath) => {
  //console.log(`${dataPath}/${filename}`)
  const response = await fetch(`${dataPath}/${filename}`);
  const geojsonData = await response.json();
  return geojsonData;
}

/**
 * Función que recupera un objeto (dato) de un array de objetos en función de un id y un campo
 * 
 * @param {*} geojson 
 * @param {*} featureId 
 * @param {*} field 
 * @returns 
 */
const findDataById = (geojson, featureId, field) => {
  if (geojson.features) {
    return geojson?.features.filter(f => f.properties[field] == featureId);
  }
  return []
}

/**
 * Función que carga los datos de una serie de ficheros y extrae los datos 
 * que son relevantes para elaborar la ficha de una intervención
 * 
 * @param {*} id 
 * @param {*} thePublicParam 
 * @returns 
 */
const getDatosIntervenciones = async (id, dataPath) => {

  let [intervencionData, actuacionesData, restosData,
    contextoCulturalData, docAdministrativos, docMultimedia,
    tipoAct, tipoRest, subtipoRest, tipoFase, tipoContextoCultural,
    parcelas, piezasDestacadasData, cronologiaData, mediaPiezasDestData
    , fotogrametria] =
    await Promise.all([
      getGeojsonData('Intervenciones.geojson', dataPath),
      getGeojsonData('Actuaciones en intervención.geojson', dataPath),
      getGeojsonData('Restos en intervención.geojson', dataPath),
      getGeojsonData('Tipos de contexto cultural en intervención.geojson', dataPath),
      getGeojsonData('Documentos administrativos.geojson', dataPath),
      getGeojsonData('Documentos multimedia.geojson', dataPath),
      getGeojsonData('Tipos de actuación.geojson', dataPath),
      getGeojsonData('Tipos de restos.geojson', dataPath),
      getGeojsonData('Subtipo de restos.geojson', dataPath),
      getGeojsonData('Tipo de fase.geojson', dataPath),
      getGeojsonData('Tipos de contexto cultural.geojson', dataPath),
      getGeojsonData('Parcelas catastrales en intervención.geojson', dataPath),
      getGeojsonData('Piezas destacadas.geojson', dataPath),
      getGeojsonData('Cronología de piezas destacadas.geojson', dataPath),
      getGeojsonData('Media piezas destacadas.geojson', dataPath),
      getGeojsonData('Fotogrametría.geojson', dataPath)
    ]);

  const intervencion = findDataById(intervencionData, id, "numero_int");
  const actuaciones = findDataById(actuacionesData, id, "numero_int");
  const restos = findDataById(restosData, id, "numero_int");
  const contextoCultural = findDataById(contextoCulturalData, id, "numero_int");
  const docAdmin = findDataById(docAdministrativos, id, "numero_int")
  const docMulti = findDataById(docMultimedia, id, "numero_int")
  const parcelasInt = findDataById(parcelas, id, "numero_int")
  const tipoActData = tipoAct?.features
  const tipoRestData = tipoRest?.features
  const subtipoRestData = subtipoRest?.features
  const tipoFaseData = tipoFase?.features
  const tipoCC = tipoContextoCultural?.features
  const piezas = findDataById(piezasDestacadasData, id, "numero_int")
  const cronologia = cronologiaData?.features
  const mediaPiezasDest = mediaPiezasDestData?.features
  const dataMediaFotogrametria = findDataById(fotogrametria, id, "numero_int")

  return {
    intervencion,
    actuaciones,
    restos,
    contextoCultural,
    docAdmin,
    docMulti,
    tipoActData,
    tipoRestData,
    subtipoRestData,
    tipoFaseData,
    tipoCC,
    parcelasInt,
    piezas,
    cronologia,
    mediaPiezasDest,
    dataMediaFotogrametria
  };
}

/**
 * Función que procesa los datos aportados por getDatosIntervenciones() y devuelve un objeto tipo intervención que
 * es usado para elaborar la ficha de una intervención
 * 
 * @param {*} dataInt 
 * @returns 
 */
const processDataIntervenciones = (dataInt) => {
  const { intervencion,
    actuaciones,
    restos,
    contextoCultural,
    docAdmin,
    docMulti,
    tipoActData,
    tipoRestData,
    subtipoRestData,
    tipoFaseData,
    tipoCC,
    parcelasInt,
    piezas,
    cronologia,
    mediaPiezasDest,
    dataMediaFotogrametria } = dataInt


  let intervencionValues = intervencion[0].properties
  intervencionValues["parcelas"] = parcelasInt.map((par) => { return { "cod_muni": par.properties.cod_muni, "cod_poligono": par.properties.cod_poligono, "num_parcela": par.properties.num_parcela, "tipo": par.properties.tipo } })
  intervencionValues["tipo_actuacion"] = actuaciones.map((act) => tipoActData.find((item) => item.properties.cod_act == act.properties.cod_act)?.properties.nom_act)
  intervencionValues["context_cult"] = contextoCultural.map((cc) => tipoCC.find((item) => item.properties.cod_con_cul == cc.properties.cod_con_cul)?.properties.nom_con_cul)
  intervencionValues["restos"] = restos.map((resto) => {
    const tipo = tipoRestData.find((i) => i.properties.cod_rest == resto.properties.tipo_resto)?.properties.nom_rest
    const subtipo = subtipoRestData.find((i) => i.properties.cod_subtipo_rest == resto.properties.subtipo_resto)?.properties.nom_subtipo_res
    const fase = tipoFaseData.find((i) => i.properties.cod_fase == resto.properties.fase_hist)?.properties.nom_fase
    const conservados = resto.properties.conserva_restos == 1
    const insitu = resto.properties.restos_in_situ == 1
    const visibles = resto.properties.restos_visibles == 1
    const visitables = resto.properties.restos_visitables == 1
    return {
      tipo,
      subtipo,
      fase,
      conservados,
      insitu,
      visibles,
      visitables
    }
  })

  intervencionValues["doc_admin"] = docAdmin.map((doc) => {
    const tipo = doc.properties.tipo
    const publico = doc.properties.publico
    const ruta = doc.properties.ruta
    const url = doc.properties.url
    return {
      tipo,
      publico,
      ruta,
      url
    }
  })

  intervencionValues["doc_multi"] = docMulti.map((doc) => {
    const tipo = doc.properties.tipo
    const publico = doc.properties.publico
    const ruta = doc.properties.ruta
    const url = doc.properties.url
    return {
      tipo,
      publico,
      ruta,
      url
    }
  })
  intervencionValues["doc_multi"]["fotogrametria"] = dataMediaFotogrametria.map((doc) => {
    const nombre = doc.properties.observaciones
    const publico = doc.properties.publico
    const url = doc.properties.enlace_3D
    return {
      nombre,
      publico,
      url
    }
  })

  //console.log("foto", dataMediaFotogrametria)
  intervencionValues["piezasDestacadas"] = piezas.map((pieza) => {

    pieza.properties.cronologia = cronologia.find((crono) => crono.properties.cod_crono == pieza.properties.cronologia)?.properties.nom_crono

    pieza.properties["media"] = mediaPiezasDest.filter((item) => item.properties.num_pieza == pieza.properties.num_pieza).map((item) => item.properties)

    return pieza?.properties
  })
  //TODO -FALTA PROCESAR LOS DOCUMENTOS
  return intervencionValues
}

/**
 * Función que carga los datos de una serie de ficheros y extrae los datos 
 * que son relevantes para elaborar la ficha de una pieza destacada
 * 
 * @param {*} id 
 * @param {*} thePublicParam 
 * @returns 
 */
const getDatosPiezasDestacadas = async (id, dataPath) => {
  let [intervencionData, piezasDestacadasData, cronologiaData, mediaPiezasDestData] =
    await Promise.all([
      getGeojsonData('Intervenciones.geojson', dataPath),
      getGeojsonData('Piezas destacadas.geojson', dataPath),
      getGeojsonData('Cronología de piezas destacadas.geojson', dataPath),
      getGeojsonData('Media piezas destacadas.geojson', dataPath)
    ])

  const piezaValues = findDataById(piezasDestacadasData, id, "num_pieza")[0].properties
  const intervencionId = piezaValues.numero_int
  const intervencion = findDataById(intervencionData, intervencionId, "numero_int")[0];
  const cronologia = cronologiaData?.features
  const mediaPiezasDest = mediaPiezasDestData?.features

  return {
    intervencion,
    piezaValues,
    cronologia,
    mediaPiezasDest
  };
}

/**
 * Función que procesa los datos aportados por getDatosPiezasDestacadas() y devuelve un objeto tipo pieza que
 * es usado para elaborar la ficha de una pieza destacada
 * 
 * @param {*} data 
 * @returns 
 */
const processDataPiezasDestacadas = (data) => {
  const {
    intervencion,
    piezaValues,
    cronologia,
    mediaPiezasDest } = data

  piezaValues.cronologia = cronologia.find((crono) => crono.properties.cod_crono == piezaValues.cronologia)?.properties.nom_crono
  piezaValues["media"] = mediaPiezasDest.filter((item) => item.properties.num_pieza == piezaValues.num_pieza).map((item) => item.properties)

  piezaValues.intervencion = intervencion.properties

  return piezaValues
}

/**
 * Función que se usa para recuperar los datos de una capa en un formato específico.
 * 
 * @param {*} layer 
 * @param {*} id 
 * @param {*} thePublicParam 
 * @returns 
 */
export const getDatos = async (layer, id, dataPath) => {
  //console.log(dataPath)
  try {
    if (layer == "intervenciones") {
      const data = await getDatosIntervenciones(id, dataPath)
      return processDataIntervenciones(data)
    }
    if (layer == "puntos_de_intervención") {
      const data = await getDatosIntervenciones(id, dataPath)
      return processDataIntervenciones(data)
    }

    if (layer == "piezas_destacadas") {
      const data = await getDatosPiezasDestacadas(id, dataPath)
      return processDataPiezasDestacadas(data)
    }

  } catch (error) {
    console.error("Error al obtener los datos:", error);
    return null;
  }
}
