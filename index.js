import express from 'express'
const app = express();
import http from 'http'
const server = http.createServer(app);
import { Server } from 'socket.io';
const io = new Server(server);

import * as entityTypes from './public/common/entityTypes.js';
import * as entityOps from './public/common/entityOperations.js';
import * as lMap from './server_modules/levelMap.js';

app.use(express.static('public'));

let svEntities = lMap.loadMap('nexus');
let chunks = lMap.updateChunks(svEntities);

io.on('connection', (socket) => {
	socket.playerEntity = new entityTypes.Player(100, 100, 5, 32, socket.id);
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
		svEntities.push(new entityTypes.Bullet(100, 100, 2, 16, 45));
	})

	setInterval(() => {
		socket.emit('update', {num: socket.lastAckNum,
     	    				   state: lMap.getVisibleChunks(
										entityOps.entityChunkLoc(socket.playerEntity),
										chunks
							   )
		});
	}, 1000/10)
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

function update() {
	for (let entity of svEntities) {
		if (entity.entityId == 'bullet') {
			entityOps.advanceEntity(entity, entity.direction, entity.speed);
		}
	}
	chunks = lMap.updateChunks(svEntities);
}

server.listen(port, () => {
	console.log(`[SERVER] now listening to port ${port}`);
	setInterval(update, 1000/10);
});