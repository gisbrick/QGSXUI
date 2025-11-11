function Event(name) {
    this.name = name;
    this.callbacks = [];
}

Event.prototype.registerCallback = function (callback) {
    this.callbacks.push(callback);
}

export function Reactor() {
    this.events = {};
}

Reactor.prototype.registerEvent = function (eventName) {
    var event = new Event(eventName);
    this.events[eventName] = event;
};

Reactor.prototype.dispatchEvent = function (eventName, eventArgs) {
    if(eventName in this.events){
        this.events[eventName].callbacks.forEach(function (callback) {
            callback(eventArgs);
        });
    }
};

Reactor.prototype.addEventListener = function (eventName, callback) {
    if(eventName in this.events){
        this.events[eventName].registerCallback(callback);
    }
};