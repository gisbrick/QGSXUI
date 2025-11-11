import { Card, Col, Row, Space } from "antd";
import ContentLEAF from "../../../components/public/contentLEAF";
import { BrowserView, MobileView } from "react-device-detect";

function ContentPage({ app, item, colorBackground }) {
  //TODO desarrollar el incorporar PESTAÑAS, si las configura el usuario
  const renderContent = () => {
    //Si solo tenemos un contenido, sin padre... lo añadimos directamente
    if (item.content && item.content.length == 1 && item.content[0].type == "LEAF") {
      return <ContentLEAF app={app} leaf={item.content[0]} colorBackground={colorBackground}></ContentLEAF>
    }
    //Si no, tenemos que recorrer los padres para crear la estructura de la página
    else {
      let span = 24
      return <Row>

        {item.content.map((item, index) => {
          return <Col key={"ContentPage" + index} span={span}>
            <ContentPageItem app={app} item={item} colorBackground={colorBackground}></ContentPageItem>
          </Col>
        })}
      </Row>
    }
  }

  return (
    <>
      {renderContent()}
    </>
  );
}

export default ContentPage;

function ContentPageItem({ app, item, colorBackground }) {

  const renderContentBrowser = () => {

    //Si solo tenemos un contenido, sin padre... lo añadimos directamente
    if (item.children && item.children.length == 1 && item.children[0] == "LEAF") {
      return <ContentLEAF app={app} item={item.children[0]} colorBackground={colorBackground}></ContentLEAF>
    }
    //Si no, tenemos que recorrer los padres para crear la estructura de la página
    else {
      if (item.type == "LEAF") {
        return <ContentLEAF app={app} leaf={item} colorBackground={colorBackground}></ContentLEAF>
      }
      else if (item.children) {
        let span = !item.columns ? 1 : 24 / parseInt(item.columns)

        if (item.title) {
          return <Card
            size="small"
            title={<div className="reader">{item.title}</div>}
            bordered={true}
            style={{}}>
            {/*<Row>
              {item.children.map((item, index) => {
                return <Col key={"ContentPageItem_" + index} span={24}>
                  <ContentPageItem app={app} item={item}></ContentPageItem>
                </Col>
              })}
            </Row>*/}
            <div style={{ display: "flex" }}>
              {item.children.map((item, index) => {
                return <div key={"ContentPageItem_" + index} style={{ flex: 1 }}>
                  <ContentPageItem app={app} item={item} colorBackground={colorBackground}></ContentPageItem>
                </div>
              })}
            </div>
          </Card>
        }
        else {

          /*return <Row>
            {item.children.map((item, index) => {
              return <Col key={"ContentPageItem_" + index} span={span}>
                <ContentPageItem app={app} item={item}></ContentPageItem>
              </Col>
            })}
          </Row>*/
          return <div style={{ display: "flex" }}>
            {item.children.map((item, index) => {
              return <div key={"ContentPageItem_" + index} style={{ flex:1 }}>
                <ContentPageItem app={app} item={item} colorBackground={colorBackground}></ContentPageItem>
              </div>
            })}
          </div>
        }

      }
      else {
        return <></>
      }


    }
  }

  const renderContentMobile = () => {
    //Si solo tenemos un contenido, sin padre... lo añadimos directamente
    if (item.children && item.children.length == 1 && item.children[0] == "LEAF") {
      return <ContentLEAF app={app} item={item.children[0]} colorBackground={colorBackground}></ContentLEAF>
    }
    //Si no, tenemos que recorrer los padres para crear la estructura de la página
    else {
      if (item.type == "LEAF") {
        return <ContentLEAF app={app} leaf={item} colorBackground={colorBackground}></ContentLEAF>
      }
      else if (item.children) {
        let span = !item.columns ? 1 : 24 / parseInt(item.columns)

        if (item.title) {
          return item.children.map((item, index) => {
            return <ContentPageItem key={"renderContentMobile" + index} app={app} item={item} colorBackground={colorBackground}></ContentPageItem>
          })
        }
        else {
          return item.children.map((item, index) => {
            return <ContentPageItem key={"renderContentMobile" + index} app={app} item={item} colorBackground={colorBackground}></ContentPageItem>
          })
        }

      }
      else {
        return <></>
      }


    }
  }

  return (<>
    <BrowserView>
      {renderContentBrowser()}
    </BrowserView>
    <MobileView>
      {renderContentMobile()}
    </MobileView>
  </>)
}

