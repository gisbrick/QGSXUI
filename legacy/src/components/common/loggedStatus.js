import { Button, Select, Space, Tooltip } from "antd";
import i18next from "i18next";
import ReactCountryFlag from "react-country-flag";
import { useDispatch, useSelector } from "react-redux";
import { login, logout, user_state } from "../../features/user/userSlice";
import { LoginOutlined, UserOutlined } from "@ant-design/icons";


function LoggedStatus({ setRenderContentFunc, setMensajeLoggeo }) {

    const dispatch = useDispatch();
    const userstate = useSelector(user_state);

    const handleLogIn = () => {
        setRenderContentFunc("profile")
    };

    const handleLogout = () => {
        dispatch(logout())
        setMensajeLoggeo(false)
        setRenderContentFunc("profile")
    };

    return (
        <>
            {userstate.logged && <Logout userstate={userstate} handleLogout={handleLogout}></Logout>}
            {!userstate.logged && <Login handleLogIn={handleLogIn}></Login>}
        </>
    );
}

export default LoggedStatus;

const Logout = ({ userstate, handleLogout }) => {
    return (

            <Tooltip title={i18next.t('common.tools.login.logout')}>
                <Button type="primary" icon={<LoginOutlined />} onClick={(e) => handleLogout()} />
            </Tooltip>
    )

}

const Login = ({ handleLogIn }) => {
    return (

            <Tooltip title={i18next.t('common.tools.login.login')}>
                <Button type="primary" icon={<UserOutlined />} onClick={(e) => handleLogIn()} />
            </Tooltip>

    )

}