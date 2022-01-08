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
	this.x = 0;
	this.y = 0;
	this.speed = 200;
	
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
	entities.push(socket.entity);

	console.log(socket.entity);
	console.log('[SERVER] a user has connected');	
	
	socket.on('inputs', (data) => {
		timestamp = data['ts'];
		inputs = data['inputs'];
		applyInput(inputs, socket.entity);
	})	
	setInterval(() => {socket.emit('update', {ts: new Date(),
										  	  state: entities})}, 1000/10)
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
server.listen(port, () => {
	console.log(`[SERVER] now listening to port ${port}`);
});