import express from 'express'
const app = express();
import http from 'http'
const server = http.createServer(app);
import { Server } from 'socket.io';
const io = new Server(server);

import * as entityTypes from './public/common/entityTypes.js';
import * as entityOps from './public/common/entityOperations.js';
import * as lMap from './server_modules/levelMap.js';
import * as enemies from './server_modules/enemies.js';
import { SV_UPDATE_RATE } from './public/common/constants.js';
import { updateBullet } from './public/common/bullets.js';
app.use(express.static('public'));

let wallEntities = lMap.loadMap('nexus');
let playerEntities = [];
let enemyEntities = [];

let wallChunks = lMap.updateChunks(wallEntities);
let playerChunks = lMap.updateChunks(playerEntities);
let enemyChunks = lMap.updateChunks(enemyEntities);

let enemyAI = enemies.loadEnemyAI('nexus');

enemyEntities.push(new entityTypes.Enemy(550, 550, 5, 48, 'chaser'))

io.on('connection', (socket) => {
	socket.playerEntity = new entityTypes.Player(300, 300, 5, 32, socket.id);
	socket.projectiles = [];
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

	socket.on('disconnect', () => {
		playerEntities = playerEntities.filter(entity => entity != socket.playerEntity);
	});

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
								   ), 
								   enemies: lMap.getVisibleChunks(
									   entityOps.entityChunkLoc(socket.playerEntity),
									   enemyChunks
								   )
							   } 
		});
	}, 1000/SV_UPDATE_RATE)

	socket.latency = 0;
	let startTime = 0;
	setInterval(() => {
	  startTime = Date.now();
	  socket.emit('ping');
	}, 200);
	socket.on('pong', function() {
	  socket.latency = Date.now() - startTime;
	  console.log(socket.latency);
	});
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

function update() {
	for (let entity of enemyEntities) {
		enemies.updateEnemy(entity, enemyAI[entity.ai], playerEntities, io)
	}
    for (let s of io.of('/').sockets) {
        let socket = s[1];
		let tempArray = []
		console.log(socket.projectiles.length)
		for (let projectile of socket.projectiles) {
			if (!(updateBullet(projectile))) {
				tempArray.push(projectile)
			}
			if (entityOps.detectEntityCollision(projectile, socket.playerEntity)) {
				if (socket.playerEntity.hp > 0) {
					socket.playerEntity.hp -= projectile.damage;
				}
			}
			for (let wall of Object.values(wallEntities)) {
				if(entityOps.detectEntityCollision(projectile, wall)) {
					tempArray.push(projectile)
				}
			}
		}
		socket.projectiles = socket.projectiles.filter(element => !tempArray.includes(element))
	}


	wallChunks = lMap.updateChunks(wallEntities);
	playerChunks = lMap.updateChunks(playerEntities);
	enemyChunks = lMap.updateChunks(enemyEntities);
}

server.listen(port, () => {
	console.log(`[SERVER] now listening to port ${port}`);
	setInterval(update, 1000/SV_UPDATE_RATE);
});