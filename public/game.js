import * as entityOps from './common/entityOperations.js';
import { rotate } from './common/helper.js';

let Game = function(canvas, socket) {
    this.localEntities = []
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

    for(let entity of this.localEntities) {
        if(entity.socketId == this.clientId) {
            document.getElementById('positionStatus').textContent = `x: ${entity.x | 0}, y: ${entity.y | 0} lastAckNum: ${this.lastAckNum} screenRot: ${this.screenRot | 0}`;
        }
    }
}

Game.prototype.updateEntities = function() {
    for(let entity of this.localEntities) {
        if (entity.entityId == "bullet") {
            //entityOps.advanceEntity(entity, 90, 45)
        }
    }
}

Game.prototype.processServerMessages = function() {
    while (true) {
        let message = this.networkQueue.shift()
        if (!message) {
            break;
        }
        this.localEntities = message['state'];
        this.lastAckNum = message['num'];
        this.performServerReconciliation();
    }        
}

Game.prototype.performServerReconciliation = function() {
    //-1.identify player by an id?
    //0.find player
    //1.go through pending inputs 
    //2.find and delete inputs that the server has already processed via last_proc_num
    //3.apply inputs to player 
    //4.client is now making decisions before hte server 
    for (let entity of this.localEntities) {
        if (entity.socketId == this.clientId) {
            //console.log(`old:x${entity.x}y${entity.y}`)
            this.pendingInputStates = this.pendingInputStates.filter(input => input.num > this.lastAckNum);
            if(this.pendingInputStates) {
                for (let input of this.pendingInputStates) {
                    entityOps.applyInput(input.rot, input.inputs, entity);            
                }
                //console.log(`new:x${entity.x}y${entity. y}`)
            }
        }
    }
}

Game.prototype.draw = function() {
    let playerX = 0;
    let playerY = 0;
    for (let entity of this.localEntities) {
        if (entity.socketId == this.clientId)  {
            playerX = entity.x
            playerY = entity.y
            break;
        }
    }
    
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for(let entity of this.localEntities) {
        let cEntityX = entity.x - playerX;
        let cEntityY = entity.y - playerY;
        let [x, y] = rotate(cEntityX, cEntityY, this.screenRot);
        x += playerX;
        y += playerY;

        this.ctx.beginPath();
        this.ctx.rect(x - (entity.size / 2) + 300 - playerX, 
                      y - (entity.size / 2) + 300 - playerY, 
                      entity.size, entity.size);
        this.ctx.stroke();
    }
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
        let packagedInput = {rot: this.screenRot, num: this.cmdNum, inputs: tempInputs}

        this.socket.emit('inputs', packagedInput);    
        
        for(let entity of this.localEntities) {
            if (entity.socketId == this.clientId) {
                this.clApplyInputs(tempInputs);
                entityOps.applyInput(this.screenRot, tempInputs, entity)
            }
        }
        this.pendingInputStates.push(packagedInput)
        this.cmdNum += 1;
    }
}

Game.prototype.clApplyInputs = function(inputs) {
    if (inputs[81]) {
        this.screenRot += inputs[81] * this.screenRotSpeed
    }
    if (inputs[69]) {
        this.screenRot -= inputs[69] * this.screenRotSpeed
    }

}

Game.prototype.attachEventHandlers = function() {
	(function(self) {			
		window.addEventListener('keydown', function (e) {
            if([87, 83, 68, 65, 81, 69].includes(e.keyCode)) {
			    self.controller[e.keyCode] = true;
            }
		})
		window.addEventListener('keyup', function (e) {
            if([87, 83, 68, 65, 81, 69].includes(e.keyCode)) {
			    self.controller[e.keyCode] = false;
            }
		})
	})(this);
}

export { Game };