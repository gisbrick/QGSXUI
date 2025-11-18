import Header02 from "../header02"
import ElementosMuseo from "./elementosMuseo"
import './museoVirtual.css'

const MuseoVirtual = () => {
    return (
        <>
            <Header02 title={"Museo Virtual en tres dimensiones de las piezas-restos más destacados de Tudela."}></Header02>
            <div className="container-museo">
                <ElementosMuseo></ElementosMuseo>
            </div>
        </>
    )
}

export default MuseoVirtual