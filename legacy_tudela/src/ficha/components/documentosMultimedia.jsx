import { useEffect, useState } from "react";
import MediaViewCarrousel from "./mediaViewCarrousel";
import MediaViewList from "./mediaViewList";
import "./documentosMultimedia.css"
import FotogrametriaCarrousel from "./fotogrametriaCarrousel";

const DocumentosMultimedia = ({ docs, values, tipo }) => {

  const [tiposMediaData, setTiposMediaData] = useState([])
  const [fotogrametria, setFotogrametria] = useState([])

  const filter = (tipo, theDocs) => {
    return theDocs.filter((d) => d.tipo.includes(tipo));
  };

  const procesarFotogrametria = (items) => {
    let fotogrametria = []
    if (items) {
      items.map((item) => {
        if (item.url) {
          const match = item.url.match(/\/3d-models\/.*-(\w+)$/);
          if (match && match[1]) {
            item.urlEmbebido = `https://sketchfab.com/models/${match[1]}/embed`;
          }
        }
      })
      fotogrametria = items
    }
    return fotogrametria
  }

  useEffect(() => {
    let o = values.map((item, index) => { return { tipo: values[index], data: filter(values[index], docs) } })
    setTiposMediaData(o)
    let datosFotogrametria = procesarFotogrametria(docs?.fotogrametria)
    setFotogrametria(datosFotogrametria)
  }, [docs]);

  return (
    <>
      {
        <div className={"documentosMultimedia media"+ (tipo=="intervencion" ? "intervencion" : "")} style={{}}>
          {tiposMediaData.length > 0 && tiposMediaData.map((item, index) => {
            return (
              item.data.length > 0 && <div key={item.tipo + index} style={{ textAlign: "center" }}>
                <div style={{ fontWeight: "bold", fontSize: "14px" }}>{item.tipo}</div>
                <>
                  <MediaViewCarrousel files={item.data}></MediaViewCarrousel>
                  <MediaViewList files={item.data}></MediaViewList>
                </>
              </div>
            )
          })}
          <>
          {fotogrametria.length > 0 && <div style={{ textAlign: "center" }}>
            <div style={{ fontWeight: "bold", fontSize: "14px" }}>{"Fotogrametría"}</div>
            { <FotogrametriaCarrousel files={fotogrametria}></FotogrametriaCarrousel>}
          </div>}
          </>
        </div>
      }
    </>
  );
}

export default DocumentosMultimedia