import * as entityOps from './common/entityOperations.js';
import { rotate, radians, advance } from './common/helper.js';

let Game = function(canvas, socket) {
    this.localEntities = []
    this.wallEntities = []
    this.playerEntity = null;
    //rendering
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.screenRot = 45;
    this.screenRotSpeed = 200
    //networking    
    this.networkQueue = []
    this.socket = socket;
    this.socket.on('connect', () => {console.log('connected!'); 
                                     this.clientId = this.socket.id.valueOf();});
    this.socket.on('update', (data) => {
        this.networkQueue.push(data);
    }); 
    //updates
	this.updateRate = 100;
    this.updateInterval = null;
    //controller
    this.lastTs = 0;
    this.controller = {};
    //server reconciliation
    this.lastAckNum = 0;
    this.cmdNum = 0
	this.pendingInputStates = []; //an array of 'controllers' that are yet to be processed
}

Game.prototype.initialize = function(updateRate=0) {
	this.attachEventHandlers();
	this.setUpdateRate(updateRate || this.updateRate);	
}

Game.prototype.setUpdateRate = function(hz) {
	this.updateRate = hz;
	if(this.updateInterval) {
		clearInterval(this.updateInterval);
	}
	this.updateInterval = setInterval(
		(function(self) { return function() { self.update(); }; })(this),
		1000 / hz);		
}

Game.prototype.update = function() {
    if(!this.socket.connected) {
        return;
    }
    this.processServerMessages();
	this.processInputs(); 
    this.updateEntities();
    this.draw();

    let player = this.playerEntity;
    document.getElementById('positionStatus').textContent = `x: ${player.x | 0}, y: ${player.y | 0} lastAckNum: ${this.lastAckNum} screenRot: ${this.screenRot | 0} chunkLoc: ${entityOps.entityChunkLoc(player)}`;
}

Game.prototype.updateEntities = function() {
    console.log(this.localEntities.length)
    for (let entity of this.localEntities) {
        if (entity.entityId == 'bullet') {
			let elapsedTime = new Date().getTime() - entity.creationTS; 
			entity.x = entity.oX + elapsedTime/10*entity.speed*Math.cos(radians(entity.direction));
			entity.y = entity.oY + elapsedTime/10*entity.speed*Math.sin(radians(entity.direction));
        }
    }
}
 7
Game.prototype.processServerMessages = function() {
    while (true) {
        let message = this.networkQueue.shift()
        if (!message) {
            break;
        }
        this.localEntities = message['state'];
        this.lastAckNum = message['num'];

        //categorizing
        for(let entity of this.localEntities) {
            if (entity.socketId == this.clientId) {
                this.playerEntity = entity;
            }
        }
        this.wallEntities = this.localEntities.filter(entity => entity.entityId == 'wall')
        //

        this.performServerReconciliation();
    }        
}

Game.prototype.performServerReconciliation = function() {
    this.pendingInputStates = this.pendingInputStates.filter(input => input.num > this.lastAckNum);
    if(this.pendingInputStates) {
        for (let input of this.pendingInputStates) {
            entityOps.applyInput(input.rot, input.inputs, this.playerEntity, this.wallEntities);            
        }
    }

}

Game.prototype.draw = function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    const centerX = this.canvas.width/2
    const centerY = this.canvas.height/2
    for (let entity of this.localEntities) {

        let cEntityX = Math.trunc(entity.x - this.playerEntity.x);
        let cEntityY = Math.trunc(entity.y - this.playerEntity.y);
        let [x, y] = rotate(cEntityX, cEntityY, this.screenRot);
        x += centerX;
        y += centerY;

        if(entity.entityId == 'wall') {
            this.blitRotated(entity, x, y);
        } else {
            this.blit(entity, x, y);
        }
    }
}

Game.prototype.blitRotated = function(entity, x, y) {
    this.ctx.save()
        this.ctx.translate(x, y)
        this.ctx.rotate(radians(this.screenRot))
        this.ctx.fillStyle = 'grey';
        this.ctx.fillRect(-(entity.size / 2), 
                          -(entity.size / 2), 
                          entity.size, entity.size);
    this.ctx.restore()
}

Game.prototype.blit = function(entity, x, y) {
    this.ctx.fillStyle = 'black';
    this.ctx.fillRect(x-(entity.size / 2), 
                      y-(entity.size / 2), 
                      entity.size, entity.size);
}

Game.prototype.processInputs = function() {
	let nowTs = new Date().getTime();
	let lastTs = this.lastTs || nowTs;
	let dtSec = (nowTs - lastTs)/1000;
	this.lastTs = nowTs; //getting the time from the last update till now 
	
	let tempInputs = {}; //how long are you pressing each key?
	for(let property in this.controller) {
		if(this.controller[property]) {
			tempInputs[property] = dtSec;
		}
	}
    
    if(Object.keys(tempInputs).length != 0) {
        this.clApplyInputs(tempInputs);
        
        if (Object.keys(tempInputs).filter(key => ['87','83','68','65'].includes(key)).length != 0) {
            let packagedInput = {rot: this.screenRot, num: this.cmdNum, inputs: tempInputs}

            this.socket.emit('inputs', packagedInput);    
            entityOps.applyInput(this.screenRot, tempInputs, this.playerEntity, this.wallEntities);
            this.pendingInputStates.push(packagedInput)
    
            this.cmdNum += 1;    
        }
    }
}

Game.prototype.clApplyInputs = function(inputs) {
    if (inputs[81]) {
        this.screenRot += inputs[81] * this.screenRotSpeed
    }
    if (inputs[69]) {
        this.screenRot -= inputs[69] * this.screenRotSpeed
    }
    if (inputs[84]) {
        this.screenRot = 0
    }
}

Game.prototype.attachEventHandlers = function() {
	(function(self) {			
		window.addEventListener('keydown', function (e) {
            if([87, 83, 68, 65, 81, 69, 84].includes(e.keyCode)) {
			    self.controller[e.keyCode] = true;
            }
		})
		window.addEventListener('keyup', function (e) {
            if([87, 83, 68, 65, 81, 69, 84].includes(e.keyCode)) {
			    self.controller[e.keyCode] = false;
            }
		})
	})(this);
}

export { Game };