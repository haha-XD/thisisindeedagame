import express from 'express'
const app = express();
import http from 'http'
const server = http.createServer(app);
import { Server } from 'socket.io';
const io = new Server(server);

import * as entityTypes from './public/common/entityTypes.js';
import * as entityOps from './public/common/entityOperations.js';

app.use(express.static('public'));

let svEntities = []

io.on('connection', (socket) => {
	socket.playerEntity = new entityTypes.Player(100, 100, 200, 32, socket.id);
	socket.lastAckNum = 0;
	svEntities.push(socket.playerEntity);

	console.log('[SERVER] a user has connected');	
	console.log(socket.playerEntity);
	
	socket.on('inputs', (data) => {
		let cmdNum = data['num'];
		let inputs = data['inputs'];
		let screenRot = data['rot'];
		entityOps.applyInput(screenRot, inputs, socket.playerEntity);
		socket.lastAckNum = cmdNum;
	})	

	socket.on('testBulletRequest', () => {
		svEntities.push(new entityTypes.Bullet(200, 200, 20, 16, 0))
	})

	setInterval(() => {socket.emit('update', {num: socket.lastAckNum,
										  	  state: svEntities})}, 1000/50)
})

let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}
server.listen(port, () => {
	console.log(`[SERVER] now listening to port ${port}`);
});