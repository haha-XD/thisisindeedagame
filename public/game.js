import { parsePattern, updateBullet } from './common/bullets.js';
import { SV_UPDATE_RATE } from './common/constants.js';
import * as entityOps from './common/entityOperations.js';
import { rotate, radians } from './common/helper.js';

let Game = function(canvas, UIcanvas, socket) {
    this.localEntities = {}
    this.playerEntities = {}
    this.localBulletEntities = []
    this.wallEntities = {}
    this.enemyEntities = {}
    this.playerEntity;
    //rendering
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    this.UIcanvas = UIcanvas;
    this.UIctx = UIcanvas.getContext('2d');
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
    this.socket.on('bullet', (data) => {
        parsePattern(data, this.localBulletEntities);
    }); 
    this.socket.on('ping', () => {
        this.socket.emit('pong');
    })
    //updates
	this.updateRate = 100;
    this.updateInterval;
    //controller
    this.lastTs = 0;
    this.controller = {};
    this.mouseHolding = false;
    this.mousePos = []
    //server reconciliation
    this.lastBulletAckNum = 0;
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
    this.interpolateEnemies();
    this.updateEntities();
    this.draw();

    let player = this.playerEntity;
    document.getElementById('positionStatus').textContent = `x: ${player.x | 0}, y: ${player.y | 0} lastAckNum: ${this.lastAckNum} screenRot: ${this.screenRot | 0} chunkLoc: ${entityOps.entityChunkLoc(player)} hp: ${player.hp}`;
}

Game.prototype.interpolateEnemies = function() {
    let renderTS = new Date().getTime() - (1000/SV_UPDATE_RATE)

    for (let entity of Object.values(this.localEntities)) {
        if (entity.socketId == this.clientId) continue;
        
        let buffer = entity.positionBuffer;

        while (buffer.length >= 2 && buffer[1][0] <= renderTS) {
            buffer.shift()
        }

        if (buffer.length >=2 && buffer[0][0] <= renderTS && renderTS <= buffer[1][0]) {
            let x0 = buffer[0][1][0];
            let x1 = buffer[1][1][0];
            let y0 = buffer[0][1][1];
            let y1 = buffer[1][1][1];
            let t0 = buffer[0][0];
            let t1 = buffer[1][0];
      
            entity.x = x0 + (x1 - x0) * (renderTS - t0) / (t1 - t0);
            entity.y = y0 + (y1 - y0) * (renderTS - t0) / (t1 - t0);
        }
    }
}

Game.prototype.updateEntities = function() {
	let tempArray = []
	for (let entity of this.localBulletEntities) {
		if (!(updateBullet(entity))) {
			tempArray.push(entity)
		}
        if (entityOps.detectEntityCollision(entity, this.playerEntity)) {
            this.socket.emit('dmg taken', entity)
    
        }
		for (let wall of Object.values(this.wallEntities)) {
			if(entityOps.detectEntityCollision(entity, wall)) {
				tempArray.push(entity)
			}
		}
    }
	this.localBulletEntities = this.localBulletEntities.filter(element => !tempArray.includes(element))
}

Game.prototype.parseSvEntities = function(entityArray, entityDict) {
    for (let assignEntity of entityArray) {
        if (!entityDict[assignEntity.id]) {
            entityDict[assignEntity.id] = assignEntity;
        }

        let entity = entityDict[assignEntity.id]

        if (assignEntity.socketId == this.clientId) {
            this.playerEntity = entity
            Object.assign(entity, assignEntity)
        } else {
            let tempX = assignEntity.x.valueOf()
            let tempY = assignEntity.y.valueOf()
            assignEntity.x = entity.x
            assignEntity.y = entity.y
            assignEntity.positionBuffer = entity.positionBuffer
            Object.assign(entity, assignEntity)

            if (!entity.stationary) {
                entity.positionBuffer.push([new Date().getTime(), [tempX, tempY]])
            }
        }
    }
}

Game.prototype.processServerMessages = function() {
    while (true) {
        let message = this.networkQueue.shift()
        if (!message) {
            break;
        }
        
        this.parseSvEntities(message['state']['players'], this.playerEntities)
        this.parseSvEntities(message['state']['walls'], this.wallEntities)
        this.parseSvEntities(message['state']['enemies'], this.enemyEntities)

        this.lastAckNum = message['num'];
    
        this.localEntities = {...this.playerEntities, ...this.wallEntities, ...this.enemyEntities};
    
        this.performServerReconciliation();
    }        
}

Game.prototype.performServerReconciliation = function() {
    this.pendingInputStates = this.pendingInputStates.filter(input => input.num > this.lastAckNum);
    if(this.pendingInputStates) {
        for (let input of this.pendingInputStates) {
            entityOps.applyInput(input.rot, input.inputs, this.playerEntity, Object.values(this.wallEntities));            
        }
    }

}

Game.prototype.draw = function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    this.UIctx.clearRect(0, 0, this.UIcanvas.width, this.UIcanvas.height);
    const centerX = this.canvas.width/2
    const centerY = this.canvas.height/2
    for (let entity of Object.values(this.localEntities).concat(this.localBulletEntities)) {
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

    //minimap (placeholder)
    this.UIctx.beginPath();
    this.UIctx.fillStyle = "black";
    this.UIctx.fillRect(0, 0, 
                        this.UIcanvas.width, this.UIcanvas.height);
    this.ctx.stroke();

    //healthbar
    this.UIctx.beginPath();
    this.UIctx.fillStyle = "grey";
    this.UIctx.fillRect(this.UIcanvas.width/30, 
                        this.UIcanvas.height/2.5, 
                        this.UIcanvas.width/30 * 28, 
                        25);
    this.UIctx.beginPath();
    this.UIctx.fillStyle = "red";
    this.UIctx.fillRect(this.UIcanvas.width/30, 
                        this.UIcanvas.height/2.5, 
                        this.UIcanvas.width/30 * 28 * (this.playerEntity.hp/this.playerEntity.maxhp), 
                        25);
    this.UIctx.fillStyle = "white";
    this.UIctx.font = "20px Verdana";
    this.UIctx.fillText("HP", 
                        this.UIcanvas.width/15, 
                        this.UIcanvas.height/2.35);
    this.UIctx.font = "bold 18px helvetica";
    this.UIctx.fillText(`${this.playerEntity.hp}/${this.playerEntity.maxhp}`, 
                        this.UIcanvas.width/2.5, 
                        this.UIcanvas.height/2.36);


    //fog of war
    let maskCanvas = document.createElement('canvas');
    maskCanvas.width = this.canvas.width;
    maskCanvas.height = this.canvas.height;
    let maskCtx = maskCanvas.getContext('2d');
    maskCtx.fillStyle = 'black'
    maskCtx.fillRect(0, 0, maskCanvas.width, maskCanvas.height);
    maskCtx.globalCompositeOperation = 'xor';
    maskCtx.arc(centerX, centerY, 400, 0, 2 * Math.PI);
    maskCtx.fill();
    this.ctx.drawImage(maskCanvas, 0, 0);
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
            entityOps.applyInput(this.screenRot, tempInputs, this.playerEntity, Object.values(this.wallEntities));
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
        function getCursorPosition(canvas, event) {
            const rect = canvas.getBoundingClientRect()
            const x = event.clientX - rect.left
            const y = event.clientY - rect.top
            console.log("x: " + x + " y: " + y)
        }			
        function mouseInterval() {
            let setIntervalId = setInterval(function() {
              if (!self.mouseHolding) clearInterval(setIntervalId);
              getCursorPosition(self.canvas, self.mousePos);
            }, 100); //set your wait time between consoles in milliseconds here
        }
          
		window.addEventListener('keydown', (e) => {
            if([87, 83, 68, 65, 81, 69, 84].includes(e.keyCode)) {
			    self.controller[e.keyCode] = true;
            }
		})
		window.addEventListener('keyup', (e) => {
            if([87, 83, 68, 65, 81, 69, 84].includes(e.keyCode)) {
			    self.controller[e.keyCode] = false;
            }
		})
        window.addEventListener('mousedown', () => {
            self.mouseHolding = true;
            mouseInterval();
        })
        window.addEventListener('mouseup', () => {
            self.mouseHolding = false;
            mouseInterval();
        })
        window.addEventListener('mouseleave', () => {
            self.mouseHolding = false;
            mouseInterval();
        })
        self.canvas.addEventListener('mousemove', (e) => {
            self.mousePos = e;
        })
	})(this);
}



export { Game };