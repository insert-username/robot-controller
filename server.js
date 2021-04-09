const http = require('http');
const ws = require('ws');
const express = require('express');


const PORT = process.env.PORT || 8080;


const app = express();
const expressServer = app.listen(PORT);
app.use(express.static(__dirname + '/public'));
const wsServer = new ws.Server({ server: expressServer });

wsServer.on('connection', function connection(socket) {
    socket.on('message', data => {

        const messageObject = JSON.parse(data);

        if (messageObject.keepAlive) {
            return; // just keeps connection open.
        }

        if (messageObject.droneCommand) {
            wsServer.clients
                .forEach(client => {
                    client.send(data);
                });
        }
    });
});

