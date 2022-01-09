const express = require('express');
const app = express();
const http = require('http')
const server = http.createServer(app);
const { Server } = require('socket.io');
const io = new Server(server);

app.use(express.static('public'));

var entities = []

var Entity = function() {
	this.id = ''
	this.x = 100;
	this.y = 100;
	this.speed = 200;
	
	this.size = 32
}

var Bullet = function(x, y, spd, dir) {
	this.id = ''
	this.x = x;
	this.y = y;
	this.speed = spd;
	this.direction = dir;
	
	this.size = 32
}


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
	socket.entity = new Entity();
	socket.entity.id = socket.id;
	socket.lastAckNum = 0;
	entities.push(socket.entity);

	console.log(socket.entity);
	console.log('[SERVER] a user has connected');	
	
	socket.on('inputs', (data) => {
		cmdNum = data['num'];
		inputs = data['inputs'];
		applyInput(inputs, socket.entity);
		socket.lastAckNum = cmdNum;
	})	

	socket.on('testBulletRequest', () => {
		socket.emit('bulletSpawn', Bullet(200, 200, 50, 0))
	})

	setInterval(() => {socket.emit('update', {num: socket.lastAckNum,
										  	  state: entities})}, 1000/50)
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
server.listen(port, () => {
	console.log(`[SERVER] now listening to port ${port}`);
});