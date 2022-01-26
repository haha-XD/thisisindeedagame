import express from 'express'
const app = express();
import http from 'http'
const server = http.createServer(app);
import { Server } from 'socket.io';
const io = new Server(server);

import * as entityTypes from './public/common/entityTypes.js';
import * as entityOps from './public/common/entityOperations.js';
import * as lMap from './server_modules/levelMap.js';
import { radians } from './public/common/helper.js';

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
		console.log('spawning bullets')
		for (let i = 0; i < 37; i++) {
			svEntities.push(new entityTypes.Bullet(100, 100, 3, 16, i * 10));			
		}
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
	let tRmvArray = []
	for (let entity of svEntities) {
		if (entity.entityId == 'bullet') {
			let elapsedTime = new Date().getTime() - entity.creationTS; 
			entity.x = entity.oX + elapsedTime/10*entity.speed*Math.cos(radians(entity.direction));
			entity.y = entity.oY + elapsedTime/10*entity.speed*Math.sin(radians(entity.direction));
			
			if (Math.abs(entity.x) > 1000 || Math.abs(entity.y) > 1000) {
				tRmvArray.push(entity)
			} 
		}
	}
	svEntities = svEntities.filter(entity => !(tRmvArray.includes(entity)));
	chunks = lMap.updateChunks(svEntities);
}

server.listen(port, () => {
	console.log(`[SERVER] now listening to port ${port}`);
	setInterval(update, 1000/10);
});