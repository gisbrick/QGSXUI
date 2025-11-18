import Handlebars from 'handlebars';

const params = new URLSearchParams(window.location.search);
const { layer, id } = JSON.parse(decodeURIComponent(params.get('data')));

async function loadTemplate(url) {
  const response = await fetch(url);
  const templateSource = await response.text();  // Obtiene la plantilla como texto
  return Handlebars.compile(templateSource);     // Compila la plantilla con Handlebars
}

const getGeojsonData = async (filename) => {
  const response = await fetch(`../../public/${MAP_GEOJSON_CONTENT_BASE_URL}/${filename}`);
  const geojsonData = await response.json();
  return geojsonData;
}

const findDataByIdIntervencion = (geojson, featureId) => {
  return geojson.features.filter(f => f.properties.numero_int === featureId);
}

const getDatosIntervenciones = async () => {

  let [intervencionData, actuacionesData, restosData, contextoCulturalData, docAdministrativos, docMultimedia, tipoAct, tipoRest, subtipoRest, tipoFase, tipoContextoCultural, parcelas] = await Promise.all([
    getGeojsonData('Intervenciones.geojson'),
    getGeojsonData('Actuaciones en intervención.geojson'),
    getGeojsonData('Restos en intervención.geojson'),
    getGeojsonData('Tipos de contexto cultural en intervención.geojson'),
    getGeojsonData('Documentos administrativos.geojson'),
    getGeojsonData('Documentos multimedia.geojson'),
    getGeojsonData('Tipos de actuación.geojson'),
    getGeojsonData('Tipos de restos.geojson'),
    getGeojsonData('Subtipo de restos.geojson'),
    getGeojsonData('Tipo de fase.geojson'),
    getGeojsonData('Tipos de contexto cultural.geojson'),
    getGeojsonData('Parcelas catastrales en intervención.geojson')
  ]);

  const intervencion = findDataByIdIntervencion(intervencionData, id);
  const actuaciones = findDataByIdIntervencion(actuacionesData, id);
  const restos = findDataByIdIntervencion(restosData, id);
  const contextoCultural = findDataByIdIntervencion(contextoCulturalData, id);
  const docAdmin = findDataByIdIntervencion(docAdministrativos, id)
  const docMulti = findDataByIdIntervencion(docMultimedia, id)
  const parcelasInt = findDataByIdIntervencion(parcelas, id)
  const tipoActData = tipoAct.features
  const tipoRestData = tipoRest.features
  const subtipoRestData = subtipoRest.features
  const tipoFaseData = tipoFase.features
  const tipoCC = tipoContextoCultural.features

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
    parcelasInt
  };
}

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
    parcelasInt } = dataInt
    let intervencionValues = intervencion[0].properties
    intervencionValues["parcelas"] = parcelasInt.map( (par) => {return {"cod_muni": par.properties.cod_muni, "cod_poligono": par.properties.cod_poligono, "num_parcela": par.properties.num_parcela, "tipo": par.properties.tipo}})
    intervencionValues["tipo_actuacion"] = actuaciones.map((act) => tipoActData.find((item) => item.properties.cod_act == act.properties.cod_act)?.properties.nom_act)
    intervencionValues["context_cult"] = contextoCultural.map((cc) => tipoCC.find((item) => item.properties.cod_con_cul== cc.properties.cod_con_cul)?.properties.nom_con_cul)
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

    //TODO -FALTA PROCESAR LOS DOCUMENTOS
    //console.log("2",intervencionValues)
  return intervencionValues
}

const getDatos = async (layer) => {
  try {
    if (layer == "intervenciones") {
      const data = await getDatosIntervenciones()
      //console.log("1",data)
      return processDataIntervenciones(data)
    }

  } catch (error) {
    console.error("Error al obtener los datos:", error);
    return null;
  }
}

const renderTemplate = async () => {
  try {
    const template = await loadTemplate(`${layer}Template.hbs`);

    const data = await getDatos(layer);

    if (data) {
      const html = template(data);  // Pasa todos los datos a la plantilla
      document.getElementById("content").innerHTML = html; // Inserta el HTML en el DOM
    } else {
      console.log("No se pudieron obtener los datos para la capa:", layer);
    }
  } catch (error) {
    console.error("Error al cargar la plantilla o los datos:", error);
  }
}

renderTemplate();
