import express from 'express'
const app = express();
import http from 'http'
const server = http.createServer(app);
import { Server } from 'socket.io';
const io = new Server(server);

import * as entityTypes from './public/common/entityTypes.js';
import * as entityOps from './public/common/entityOperations.js';
import { loadMap } from './server_modules/levelMap.js';
import { CHUNK_SIZE } from './server_modules/constants.js';

app.use(express.static('public'));

let svEntities = loadMap('nexus');
let chunks = new Proxy({}, {
	get: (target, name) => name in target ? target[name] : []
})

for(let entity of svEntities) {
	chunkX = Math.trunc(entity.x / CHUNK_SIZE)
	chunkY = Math.trunc(entity.y / CHUNK_SIZE)
	chunks[chunkX, chunkY] = [entity];
}

io.on('connection', (socket) => {
	socket.playerEntity = new entityTypes.Player(100, 100, 500, 32, socket.id);
	socket.currentArea = null;
	socket.lastAckNum = 0;
	svEntities.push(socket.playerEntity);

	console.log('[SERVER] a user has connected');	
	console.log(socket.playerEntity);
	
	socket.on('inputs', (data) => {
		let cmdNum = data['num'];
		let inputs = data['inputs'];
		let screenRot = data['rot'];
		let wallEntities = svEntities.filter(entity => entity.entityId == 'wall')
		entityOps.applyInput(screenRot, inputs, socket.playerEntity, wallEntities);
		socket.lastAckNum = cmdNum;	
	})	

	socket.on('testBulletRequest', () => {
		svEntities.push(new entityTypes.Wall(200, 200, 32))
		svEntities.push(new entityTypes.Wall(200, 232, 32))
		svEntities.push(new entityTypes.Wall(200, 264, 32))
	})

	setInterval(() => {
		socket.emit('update', {num: socket.lastAckNum,
     	    				   state: svEntities})
	}, 1000/10)
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
server.listen(port, () => {
	console.log(`[SERVER] now listening to port ${port}`);
});