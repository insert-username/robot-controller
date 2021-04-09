class KeyPressMonitor {
    constructor() {
        this.keyDownSet = new Set();
    }

    keyDown(keyCode, callIfInitialKeyDown) {
        if (!this.keyDownSet.has(keyCode)) {
            callIfInitialKeyDown();
            this.keyDownSet.add(keyCode);
        }
    }

    keyUp(keyCode) {
        this.keyDownSet.delete(keyCode);
    }
}

const protocol = window.location.href.startsWith("https") ?
    "wss" :
    "ws";
const url = protocol + ":" + window.location.hostname + ":" + window.location.port;

window.onload = function (e) {
    console.log("started");
    var clientLogElement = document.getElementById("clientLog");
    var droneLogElement = document.getElementById("droneLog");

    var appendLog = function(message, logElement) {
        logElement.insertAdjacentHTML('beforeend', '<li>' + message + '</li>');
        parentElement = logElement.parentElement;
        parentElement.scrollTo(0, parentElement.scrollHeight);
    };

    var socketClientOut = new WebSocket(url);
    socketClientOut.onopen = function (event) {
        appendLog("connection opened", clientLogElement);

        const keepAlive = JSON.stringify({ keepAlive: true });
        setInterval(() => socketClientOut.send(keepAlive), 5000);
    };
    socketClientOut.onmessage = function (event) {
        appendLog("Received: " + event.data, clientLogElement);
    };


    var socketDroneIn = new WebSocket(url);
    socketDroneIn.onopen = function (event) {
        appendLog("drone in connection opened", droneLogElement);
    };
    socketDroneIn.onmessage = function (event) {
        appendLog("Received: " + event.data, droneLogElement);
    };

    const keyPressMonitor = new KeyPressMonitor();

    document.onkeydown = function(evt) {
        evt = evt || window.event;
        var keyCode = (typeof evt.which == "number") ? evt.which : evt.keyCode;

        if (keyCode) {
            keyPressMonitor.keyDown(keyCode, function() {
                socketClientOut.send(JSON.stringify({
                        droneCommand: 1,
                        keyCode: keyCode,
                        delta: "down"
                    }));
            });
        }
    };

    document.onkeyup = function(evt) {
        evt = evt || window.event;
        var keyCode = (typeof evt.which == "number") ? evt.which : evt.keyCode;

        if (keyCode) {
            keyPressMonitor.keyUp(keyCode);
            socketClientOut.send(JSON.stringify({
                    keyCode: keyCode,
                    delta: "up"
                }));
        }
    };
};
