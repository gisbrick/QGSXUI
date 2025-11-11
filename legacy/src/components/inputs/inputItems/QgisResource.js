// QgisResource.js
import { QgisService } from "../../../service/qgisService";

function wrapPromise(promise) {
    let status = "pending";
    let result;
    let suspender = promise.then(
        res => {
            status = "success";
            result = res;
        },
        err => {
            status = "error";
            result = err;
        }
    );
    return {
        read() {
            if (status === "pending") {
                throw suspender;
            } else if (status === "error") {
                throw result;
            } else if (status === "success") {
                return result;
            }
        }
    };
}

export function createQgisResource(map, config, properties, field) {
    let orderBy = config.OrderByValue ? config.LayerName : null;
    let orderType = orderBy ? "ASC" : null;

    const promise = QgisService.GETFEATURES(map, config.LayerName, 10000, 0, config.FilterExpression, null, orderBy, orderType)
        .then((data) => {
            let newValues = [];
            newValues.push({
                value: null,
                label: ""
            });
            for (var i in data.features) {
                let feature = data.features[i];
                newValues.push({
                    value: feature.properties[config.Key],
                    label: feature.properties[config.Value]
                });
            }
            return newValues;
        })
        .catch(err => {
            console.log("ERROR", err);
            throw err;
        });

    return wrapPromise(promise);
}
