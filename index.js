import express from 'express'
const app = express();
import http from 'http'
const server = http.createServer(app);
import { Server } from 'socket.io';
const io = new Server(server);

import * as entityTypes from './public/common/entityTypes.js';
import * as entityOps from './public/common/entityOperations.js';
import * as lMap from './server_modules/levelMap.js';
import * as bulletPattern from './public/common/bullets.js'
import { radians } from './public/common/helper.js'

app.use(express.static('public'));

let wallEntities = lMap.loadMap('nexus');
let playerEntities = []
let svBulletEntities = [];

let chunks = lMap.updateChunks(wallEntities); //because only walls exist when starting

function spawnBullet(bullet) {
	io.emit('bullet', bullet);
	bulletPattern.parsePattern(bullet, svBulletEntities);
}

io.on('connection', (socket) => {
	socket.playerEntity = new entityTypes.Player(300, 300, 5, 32, socket.id);
	socket.currentArea = null;
	socket.lastAckNum = 0;
	playerEntities.push(socket.playerEntity);

	console.log('[SERVER] a user has connected');	
	console.log(socket.playerEntity);
	
	socket.on('inputs', (data) => {
		let cmdNum = data['num'];
		let inputs = data['inputs'];
		let screenRot = data['rot'];
		entityOps.applyInput(screenRot, inputs, socket.playerEntity, wallEntities);
		socket.lastAckNum = cmdNum;	
	})	

	socket.on('testBulletRequest', () => {
		console.log('sending bullet')
	})

	setInterval(() => {	
		socket.emit('update', {num: socket.lastAckNum,
     	    				   state: lMap.getVisibleChunks(
										entityOps.entityChunkLoc(socket.playerEntity),
										chunks
							   )

		});
	}, 1000/15)
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

function update() {
	let tempArray = []
	for (let entity of svBulletEntities) {
		if (!(bulletPattern.updateBullet(entity))) {
			tempArray.push(entity)
		}	
		for(let player of playerEntities) {
			if (entityOps.detectEntityCollision(entity, player)) {
				if (player.hp > 0) {
					player.hp -= entity.damage
				}
			}
		}
		for(let wall of wallEntities) {
			if(entityOps.detectEntityCollision(entity, wall)) {
				tempArray.push(entity)
			}
		}
	}
	svBulletEntities = svBulletEntities.filter(element => !tempArray.includes(element))

	chunks = lMap.updateChunks(wallEntities.concat(playerEntities));
}

let x = 0;
server.listen(port, () => {
	console.log(`[SERVER] now listening to port ${port}`);
	setInterval(update, 1000/15);
	setInterval(() => {
		spawnBullet(new bulletPattern.radialShotgun(200, 200, 3, 16, 2, 5, 10, x));
		x+= 18;
	}, 1000/5)
});