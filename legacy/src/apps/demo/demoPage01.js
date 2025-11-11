import MapComponent from "../../components/map/mapComponent";
import HtmlEditor from "../../components/inputs/custom/htmlEditorComponent";


function DemoPage01() {

  return (
    <>

      <HtmlEditor fieldValue={"Hola!!!"} />

      <>DemoPage01: MAP</> <br />
      <div style={{ width: "1000px", height: "500px" }}>
        <MapComponent map={{
          unit: "unit01",
          permission: null,
          map: "test3.qgz"
        }}></MapComponent>
      </div>
    </>
  );
}

export default DemoPage01;
