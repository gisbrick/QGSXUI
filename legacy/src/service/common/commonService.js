import { Component } from 'react';
import ReactDOM from 'react-dom/client';
import { useSelector } from 'react-redux';
import fetch from 'unfetch';
import { user_state } from '../../features/user/userSlice';
import { store } from '../../app/store'
import NotificationComponent from '../../components/utils/NotificationComponent';

const API_URL = ""

async function checkStatus(response) {      
    setTimeout(() => {       
        window.mouseOverButton = false
      }, "3000");
      
   

    if (response.ok) {
        return response;
    }

    try{
        var text = JSON.parse(await response.text());
    }
    catch{
        //Se ha producido un error en una request, pero la respuesta no es un JSON, por lo que NO está controlado
        //Por ahora no mostramos aviso al usuario y solo lo sacamos por el LOG
        console.log("NOT CONTROLED ERROR", response)
        return Promise.reject("{}");
    }
    


    const messages = ReactDOM.createRoot(document.getElementById('messages'));
    messages.render(
        <NotificationComponent type="error" text={text.message}></NotificationComponent>
    );


    // convert non-2xx HTTP responses into errors:   
    const error = new Error(response.statusText);
    error.response = response;
    return Promise.reject(error);
}


function getQueryString(params) {
    let strings = []
    for (let key in params) {
        strings.push(key + "=" + encodeURIComponent(params[key]))
    }
    return strings.join("&")
}

export class CommonService {


    //static dispatch = store.useDispatch();
    //static userstate = store.useSelector(user_state);

    static list(url) {
        const state = store.getState();
        return (
            fetch(API_URL + url, {
                headers: {
                    'Authorization': state.user.logged ? "Bearer " + state.user.token : ""
                }
            })
                .then(checkStatus)
                .then((resJson) => {
                    const data = resJson.json()
                    return data;
                })
        );
    }

    static get = async (url) => {
        const state = store.getState();
        return (
            fetch(API_URL + url, {
                headers: {
                    'Authorization': state.user.logged ? "Bearer " + state.user.token : "",
                    'Content-Type': 'application/json; charset=utf-8',
                    'Access-Control-Allow-Origin': '*',
                }
            }).then(checkStatus)
                .then((resJson) => {
                    return resJson.json()
                })
        )
    }

    static getWithoutToken = async (url) => {
        const state = store.getState();
        return (
            fetch(API_URL + url, {
                headers: {
                    
                }
            }).then(checkStatus)
                .then((resJson) => {
                    return resJson.json()
                })
        )
    }

    static download = async (url, permission) => {
        const state = store.getState();

        if(state.user.logged && permission){
            url = url + "/" + state.user.token;
        }

        window.open(url, "_blank").focus(); // window.open + focus
        /*
        return (
            fetch(API_URL + url, {
                headers: {
                    'Authorization': state.user.logged ? "Bearer " + state.user.token : ""
                }
            }).then(res => res.blob()).then(blob => {
                var urlCreator = window.URL || window.webkitURL;
                var imageUrl = urlCreator.createObjectURL(blob);
                return imageUrl;              
            }))
            */
    }

    static post = (url, bean) => {
        const state = store.getState();
        return (
            fetch(API_URL + url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': state.user.logged ? "Bearer " + state.user.token : ""
                },
                method: 'POST',
                body: JSON.stringify(bean)
            }).then(checkStatus)
                .then((resJson) => {
                    const data = resJson.json()
                    return data;
                })
        )
    }

    static postFormData = (url, bean) => {
        var data = new FormData()
        for(let key in bean){
            data.set(key, bean[key])           
            //data.append(key, bean[key])
        }
        const state = store.getState();

        /*
       
        data.Authorization =  state.user.logged ? "Bearer " + state.user.token : "";
        */
/*'Content-Type': 'multipart/form-data',*/
        
        return (
            fetch(API_URL + url, {
               
                headers: {                    
                    'Authorization': state.user.logged ? "Bearer " + state.user.token : "",
                    'Accept': '*/*',
                    /*'content-type': 'multipart/form-data; boundary=ebf9f03029db4c2799ae16b5428b06bd'*/
                },
                method: 'POST',
                body: data
            }).then(checkStatus)
                .then((resJson) => {
                    const data = resJson.json()
                    return data;
                })
        )
    }

    static postXml = (url, bean) => {       
        const state = store.getState();
        return (
            fetch(API_URL + url, {
                headers: {
                    'Content-Type': 'text/xml',
                    'Authorization': state.user.logged ? "Bearer " + state.user.token : ""
                },
                method: 'POST',
                body: bean
            })
                .then(checkStatus)
                .then(response => response.text())
                .then(str => new window.DOMParser().parseFromString(str, "text/xml"))
                .then(data => {
                    let responseObject = {}
                    let success = data.getElementsByTagName("SUCCESS")
                    if (success.length > 0) {
                        if(data.getElementsByTagName("InsertResult").length > 0) {
                            let id = data.getElementsByTagName("InsertResult").item(0).children.item(0).getAttribute("fid").split(".")[1]
                            responseObject["fid"] = id
                        }
                        if(data.getElementsByTagName("ResponseMail").length > 0) {
                            let response = data.getElementsByTagName("ResponseMail")[0]
                            if(response.children.length > 0) {
                                for (let index = 0; index < response.children.length; index++) {
                                    const element = response.children[index];
                                    responseObject[element.tagName] = element.textContent
                                }
                            }

                        }
                        return responseObject; //Ha ido bien
                    }
                    else {
                        let message = data.getElementsByTagName("Message")
                        //ha habido errores
                        const messages = ReactDOM.createRoot(document.getElementById('messages'));
                        messages.render(
                            <>
                                <NotificationComponent type="error" text={"transaction"} description={message[0].innerHTML}></NotificationComponent>
                            </>
                        );

                        // convert non-2xx HTTP responses into errors:   
                        const error = new Error("transaction");
                        return Promise.reject(error);
                    }
                })
        )

        /*  var text = JSON.parse(await response.text());


    const messages = ReactDOM.createRoot(document.getElementById('messages'));
    messages.render(
        <NotificationComponent type="error" text={text.message}></NotificationComponent>
    );


    // convert non-2xx HTTP responses into errors:   
    const error = new Error(response.statusText);
    error.response = response;
    return Promise.reject(error);*/
    }

    static update = (url, bean) => {
        const state = store.getState();
        return (fetch(API_URL + url, {
            headers: {
                'Content-Type': 'application/json',
                'Authorization': state.user.logged ? "Bearer " + state.user.token : ""
            },
            method: 'PUT',
            body: JSON.stringify(bean)
        }
        ).then(checkStatus))
            .then((resJson) => {
                const data = resJson.json()
                return data;
            })
    }

    static delete = (url) => {
       
        const state = store.getState();
        return (
            fetch(API_URL + url, {
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': state.user.logged ? "Bearer " + state.user.token : ""
                },
                method: 'DELETE'
            }).then(checkStatus))
    }
}
