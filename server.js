const http = require('http')
const ws = require('ws')

// listen on single port,
// for each connection, take input and broadcast to all clients.
// ugly, but it works

const port = process.env.PORT || 8080;

const wsServer = new ws.Server({ port: port });

wsServer.on('connection', function connection(socket) {
    socket.on('message', data => {
        wsServer.clients
            .forEach(client => {
                if (client != socket) {
                    client.send(data);
                }
            });
    });
});

