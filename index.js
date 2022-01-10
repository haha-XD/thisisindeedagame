const express = require('express');
const app = express();
const http = require('http')
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

var entityTypes = require('./common/entityTypes');

app.use(express.static('public'));

var svEntities = []

function applyInput(inputs, entity) {
    if (inputs[87]) {
        entity.y -= (inputs[87]) * entity.speed;
    }
    if (inputs[83]) {
        entity.y += (inputs[83]) * entity.speed;
    }
    if (inputs[68]) {
        entity.x += (inputs[68]) * entity.speed;
    }
    if (inputs[65]) {
        entity.x -= (inputs[65]) * entity.speed;
    }
}

io.on('connection', (socket) => {
	socket.playerEntity = new entityTypes.Player(100, 100, 200, 32, socket.id);
	socket.lastAckNum = 0;
	svEntities.push(socket.playerEntity);

	console.log('[SERVER] a user has connected');	
	console.log(socket.playerEntity);
	
	socket.on('inputs', (data) => {
		cmdNum = data['num'];
		inputs = data['inputs'];
		applyInput(inputs, socket.playerEntity);
		socket.lastAckNum = cmdNum;
	})	

	socket.on('testBulletRequest', () => {
		svEntities.push(new entityTypes.Bullet(200, 200, 20, 16, 0));
	})

	setInterval(() => {socket.emit('update', {num: socket.lastAckNum,
										  	  state: svEntities})}, 1000/50)
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
server.listen(port, () => {
	console.log(`[SERVER] now listening to port ${port}`);
});