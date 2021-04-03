const http = require('http')
const ws = require('ws')

var startServer = function(port, onConnectMade, onReceiveMsg) {
    // assume single connection for simplicity's sake
    var hasAllocated = false;

    const httpServer = http.createServer();

    const wsServer = new ws.Server({
        noServer: true,
    });

    wsServer.on('connection', function connection(socket) {
        onConnectMade(socket);
        socket.on('message', onReceiveMsg);
    });

    httpServer.on('upgrade', function upgrade(request, socket, head) {
        if (hasAllocated) {
          socket.write('HTTP/1.1 401 Unauthorized\r\n\r\n');
          socket.destroy();
          return;
        }

        hasAllocated = true;

        wsServer.handleUpgrade(request, socket, head, function done(webSocket) {
          wsServer.emit('connection', webSocket, request);
        });
    });

    httpServer.listen(port);
};


var droneSocketHolder = {
    socket: false
};

var droneConnection = startServer(
    8081,
    function(socket) {
        droneSocketHolder.socket = socket
    },
    function(msg) { });

var clientConnection = startServer(
    8080,
    function(socket) {},
    function(msg) {
        if (droneSocketHolder.socket) {
            droneSocketHolder.socket.send(msg);
        } else {
            console.log("Discarding msg to drone: " + msg);
        }
    });
