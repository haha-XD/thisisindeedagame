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
let playerEntities = [];

let wallChunks = lMap.updateChunks(wallEntities);
let playerChunks = lMap.updateChunks(playerEntities);

function spawnBullet(bullet) {
	io.emit('bullet', bullet);
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

	socket.on('dmg taken', (bullet) => {
		if (socket.playerEntity.hp > 0) {
			socket.playerEntity.hp -= bullet.damage;
		}
	})

	setInterval(() => {	
		socket.emit('update', {num: socket.lastAckNum,
     	    				   state: {
							       players: lMap.getVisibleChunks(
								       entityOps.entityChunkLoc(socket.playerEntity),
								       playerChunks
								   ), 
								   walls: lMap.getVisibleChunks(
									   entityOps.entityChunkLoc(socket.playerEntity),
									   wallChunks
								   )
							   } 
		});
	}, 1000/15)
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

function update() {
	wallChunks = lMap.updateChunks(wallEntities)
	playerChunks = lMap.updateChunks(playerEntities)
}

let x = 0;
let v = 4;
server.listen(port, () => {
	console.log(`[SERVER] now listening to port ${port}`);
	setInterval(update, 1000/15);
	setInterval(() => {
		spawnBullet(new bulletPattern.radialShotgun(555, 555, 2, 16, 5, 3, 6, x));
		x += v;
		if (Math.abs(x) > 120) {
			v *= -1
		}
	}, 1000/10)
	setInterval(() => {
		spawnBullet(new bulletPattern.radialShotgun(555, 555, 3, 16, 7, 3, 18, x));
	}, 1000)
});