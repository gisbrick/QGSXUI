import { Col, Row } from "antd";
import { BrowserView, MobileView } from "react-device-detect";
import LoginComponent from "../../../components/security/loginComponent";


function ProfilePage({mensajeLoggeo, setMensajeLoggeo}) {



  return (
    <>
      <BrowserView>
        <Row>
          <Col span={15} offset={5}>
            <LoginComponent mensajeLoggeo={mensajeLoggeo} setMensajeLoggeo={setMensajeLoggeo}></LoginComponent>
          </Col>
        </Row>

      </BrowserView>
      <MobileView>
        <Row>
          <Col span={24}>
            <LoginComponent mensajeLoggeo={mensajeLoggeo} setMensajeLoggeo={setMensajeLoggeo}></LoginComponent>
          </Col>
        </Row>
      </MobileView>
    </>
  );
}

export default ProfilePage;
