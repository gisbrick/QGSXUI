import Header02 from "../header02";
import ElementosCatalogo from "./elementosCatalogo";

const CatalogoPiezas = () => {
    return (
        <>
            <Header02 title={"Catálogo de Piezas Arqueológicas de Tudela"}></Header02>
            <div className="container-museo">
                <ElementosCatalogo></ElementosCatalogo>
            </div>
        </>
    )
}

export default CatalogoPiezas;