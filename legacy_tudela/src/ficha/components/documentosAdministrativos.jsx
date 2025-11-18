import { useEffect, useState } from "react"
import MediaViewCarrousel from "./mediaViewCarrousel";
import MediaViewList from "./mediaViewList";

const DocumentosAdministrativos = ({ docs }) => {

    const [tiposMediaData, setTiposMediaData] = useState([])
    const values = [
        "Expediente obra municipal",
        "Informe de intervención-Inventario materiales",
        "Resolución permiso Gobierno de Navarra",
        "Informes-Resoluciones parciales"
    ]

    const filter = (tipo, theDocs) => {
        return theDocs.filter((d) => d.tipo.includes(tipo));
    };

    useEffect(() => {
        //console.log(docs)
        let o = values.map((item, index) => { return { tipo: values[index], data: filter(values[index], docs) } })
        setTiposMediaData(o)
    }, [docs]);

    return (
        <>
          {
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px" }}>
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
            </div>
          }
        </>
      );
}

export default DocumentosAdministrativos