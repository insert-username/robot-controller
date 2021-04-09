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
    const socketClientOut = new WebSocket(url);
    var clientLogElement = document.getElementById("clientLog");

    const attachKeyListener = function() {
        const keyPressMonitor = new KeyPressMonitor();

        document.onkeydown = function(evt) {
            if (socketClientOut.readyState != WebSocket.OPEN) {
                return;
            }

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
            if (socketClientOut.readyState != WebSocket.OPEN) {
                return;
            }

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
    }

    var appendLog = function(message, logElement) {
        logElement.insertAdjacentHTML('beforeend', '<li>' + message + '</li>');
        parentElement = logElement.parentElement;
        parentElement.scrollTo(0, parentElement.scrollHeight);
    };

    const keepAliveMessage = JSON.stringify({ keepAlive: true });
    var keepAliveSender = function() {
        if (socketClientOut.readyState === WebSocket.OPEN) {
            socketClientOut.send(keepAliveMessage);
        }
    };

    socketClientOut.onopen = function (event) {
        appendLog("connection opened", clientLogElement);

        setInterval(keepAliveSender, 5000);
        attachKeyListener();
    };
    socketClientOut.onClose = () => {
        clearInterval(keepAliveSender);
    };

    socketClientOut.onmessage = function (event) {
        appendLog("IN: " + event.data, clientLogElement);
    };

};
