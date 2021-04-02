const ws = require('ws')

console.log("Robit controller.")

const server = new ws.Server({
    port: 8080,
});

server.on('connection', function connection(socket) {
    console.log("connection opened");

    socket.on('message', function incoming(message) {
        console.log("Incoming message: " + message);
        socket.send(message); // mirror response
    });
});


