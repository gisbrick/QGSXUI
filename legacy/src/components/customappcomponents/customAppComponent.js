import { Empty } from "antd";
import Inhumation from "./cemetery/inhumation";
import Transfer from "./cemetery/transfer";
import Insertion from "./inventory/insertion";
import SearcherInhu from "./cemetery/searcherInhu";

const CustomAppComponent = ({ map, custom_app_component, colorBackground }) => {

    const render = () => {
        if (custom_app_component.group == "cemetery") {
            if (custom_app_component.component == "inhumation") {
                return <Inhumation map={map} custom_app_component={custom_app_component} colorBackground={colorBackground}></Inhumation>
            }
            else if (custom_app_component.component == "transfer") {
                return <Transfer map={map} custom_app_component={custom_app_component}></Transfer>
            } else if (custom_app_component.component == "searcher") {
                return <SearcherInhu map={map} custom_app_component={custom_app_component}></SearcherInhu>
            } else {
                return <Empty />
            }

        }
        else if (custom_app_component.group == "inventory") {
            if (custom_app_component.component == "insertion") {
                return <Insertion map={map} custom_app_component={custom_app_component}></Insertion>
            }
            else {
                return <Empty />
            }

        }
        else {
            return <Empty />
        }
    }

    return (
        <>
            {render()}
        </>
    )
};
export default CustomAppComponent;