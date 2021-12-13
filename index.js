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

function applyInput(inputs, timestamp, entity) {
	now_ts = new Date().getTime();
	console.log(timestamp)
	latency = now_ts - timestamp;
	console.log('xd', latency)
	adjusted_latency = (Math.abs(latency * 2))/1000

	if (inputs[87]) {
		entity.y -= (inputs[87] + adjusted_latency) * entity.speed;
	}
	if (inputs[83]) {
		entity.y += (inputs[83] + adjusted_latency) * entity.speed;
	}
	if (inputs[68]) {
		entity.x += (inputs[68] + adjusted_latency) * entity.speed;
	}
	if (inputs[65]) {
		entity.x -= (inputs[65] + adjusted_latency) * entity.speed;
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
		applyInput(inputs, timestamp, socket.entity);
	})	
	setInterval(() => {socket.emit('update', {ts: new Date(),
										  	  state: entities})}, 1000/3)
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
server.listen(port, () => {
	console.log(`[SERVER] now listening to port ${port}`);
});