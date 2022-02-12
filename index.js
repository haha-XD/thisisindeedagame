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
let projectileEntities = [];

let wallChunks = lMap.updateChunks(wallEntities);
let playerChunks = lMap.updateChunks(playerEntities);
let enemyChunks = lMap.updateChunks(enemyEntities);

let enemyAI = enemies.loadEnemyAI('nexus');

enemyEntities.push(new entityTypes.Enemy(550, 550, 5, 48, 'chaser'))

let tick = 0;
let startTime = new Date().getTime();

io.on('connection', (socket) => {
	socket.playerEntity = new entityTypes.Player(300, 300, 5, 32, socket.id);
	socket.lastAckNum = 0;

	playerEntities.push(socket.playerEntity);

	console.log('[SERVER] a user has connected');	
	console.log(socket.playerEntity);
	socket.emit('tick', tick)

	socket.on('ping', function() {
		socket.emit('pong');
	});
	
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
		socket.emit('update', {
			num: socket.lastAckNum,
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
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

function update() {
	tick = Math.floor((new Date().getTime()-startTime)/(1000/SV_UPDATE_RATE))
	console.log(tick)
	
	for (let entity of enemyEntities) {
		enemies.updateEnemy(entity, enemyAI[entity.ai], playerEntities, io, tick, projectileEntities)
	}
	let tempArray = []
	for (let projectile of projectileEntities) {
		if (!(updateBullet(projectile))) {
			tempArray.push(projectile)
		}
		for (let player of playerEntities) {
			if (entityOps.detectEntityCollision(projectile, player)) {
				if (player.hp > 0) {
					player.hp -= projectile.damage;
				}
			}
		}
		for (let wall of Object.values(wallEntities)) {
			if(entityOps.detectEntityCollision(projectile, wall)) {
				tempArray.push(projectile)
			}
		}
	}
	projectileEntities = projectileEntities.filter(element => !tempArray.includes(element))

	wallChunks = lMap.updateChunks(wallEntities);
	playerChunks = lMap.updateChunks(playerEntities);
	enemyChunks = lMap.updateChunks(enemyEntities);
}

server.listen(port, () => {
	console.log(`[SERVER] now listening to port ${port}`);
	setInterval(update, 1000/SV_UPDATE_RATE);
});