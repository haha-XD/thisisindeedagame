var Game = function(canvas, socket) {
    this.entities = []
    //rendering
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
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
    this.processServerMessages();
	this.processInputs(); 
    this.draw();

    for(entity of this.entities) {
        if(entity.id == this.clientId) {
            document.getElementById('positionStatus').textContent = `x: ${entity.x}, y: ${entity.y} lastAckNum: ${this.lastAckNum}`;
        }
    }
}

Game.prototype.processServerMessages = function() {
    while (true) {
        var message = this.networkQueue.shift()
        if (!message) {
            break;
        }
        this.entities = message['state'];
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
    for (entity of this.entities) {
        if (entity.id == this.clientId) {
            //console.log(`old:x${entity.x}y${entity.y}`)
            this.pendingInputStates = this.pendingInputStates.filter(input => input.num > this.lastAckNum);
            console.log(this.pendingInputStates.length);
            if(this.pendingInputStates) {
                for (input of this.pendingInputStates) {
                    this.applyInput(input.inputs, entity);            
                }
                //console.log(`new:x${entity.x}y${entity. y}`)
            }
        }
    }
}

Game.prototype.draw =function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for(entity of this.entities) {
        this.ctx.beginPath();
        this.ctx.rect(entity.x-(entity.size/2), entity.y-(entity.size/2), entity.size, entity.size);
        this.ctx.stroke();
    }
}

Game.prototype.processInputs = function() {
	var nowTs = new Date().getTime();
	var lastTs = this.lastTs || nowTs;
	var dtSec = (nowTs - lastTs)/1000;
	this.lastTs = nowTs; //getting the time from the last update till now 
	
	var tempInputs = {}; //how long are you pressing each key?
	for(property in this.controller) {
		if(this.controller[property]) {
			tempInputs[property] = dtSec;
		}
	}
    if(Object.keys(tempInputs).length != 0) {
        var packagedInput = {num: this.cmdNum, inputs: tempInputs}

        this.socket.emit('inputs', packagedInput);    
        
        for(entity of this.entities) {
            if (entity.id == this.clientId) {
                this.applyInput(tempInputs, entity)
            }
        }
        this.pendingInputStates.push(packagedInput)
        this.cmdNum += 1;
    }
}

Game.prototype.attachEventHandlers = function() {
	(function(self) {			
		window.addEventListener('keydown', function (e) {
            if([87, 83, 68, 65].includes(e.keyCode)) {
			    self.controller[e.keyCode] = true;
            }
		})
		window.addEventListener('keyup', function (e) {
            if([87, 83, 68, 65].includes(e.keyCode)) {
			    self.controller[e.keyCode] = false;
            }
		})
	})(this);
}

Game.prototype.applyInput = function(inputs, entity) {
	if (inputs[87]) {
		entity.y -= inputs[87] * entity.speed;
	}
	if (inputs[83]) {
		entity.y += inputs[83] * entity.speed;
	}
	if (inputs[68]) {
		entity.x += inputs[68] * entity.speed;
	}
	if (inputs[65]) {
		entity.x -= inputs[65] * entity.speed;
    }
}
