import ListComponent from "../../components/list/listComponent";

function DemoPage03() {
  return (
    <>
      <>DemoPage02: LISTADO COMARCAS</> <br />
      <div style={{ width: "1000px"}}>
        <ListComponent height={200} map={{
          unit: "unit01",
          permission: null,
          map: "test3.qgz"
        }} layer={"Poligono"}></ListComponent>
      </div>     
    </>
  );
}

export default DemoPage03;
