var Game = function(canvas, socket) {
    this.entities = []
    //rendering
    this.canvas = canvas;
    this.ctx = canvas.getContext('2d');
    //networking    
    this.socket = socket;
    this.socket.on('connect', () => {console.log('connected!'); 
                                     this.client_id = this.socket.id.valueOf();});
    this.socket.on('update', (entities) => {this.entities = entities}); 
    //updates
	this.update_rate = 100;
    this.update_interval = null;
    //controller
    this.last_ts = 0;
    this.controller = {};
    //server reconciliation
    this.input_no = 0 //an incrementing counter for every input the client has made
	this.pending_input_states = []; //an array of 'controllers' that are yet to be processed

    this.last_processed_input_no = 0; //what the server has last processed
    this.socket.on('input_processed', (input_no) => {this.last_processed_input_no=input_no}); 

}

Game.prototype.initialize = function(update_rate=0) {
	this.attachEventHandlers();
	this.setUpdateRate(update_rate || this.update_rate);	
}

Game.prototype.setUpdateRate = function(hz) {
	this.update_rate = hz;
	if(this.update_interval) {
		clearInterval(this.update_interval);
	}
	this.update_interval = setInterval(
		(function(self) { return function() { self.update(); }; })(this),
		1000 / hz);		
}

Game.prototype.update = function() {
    //server reconcilliation 
    //-1.identify player by an id?
    //0.find player
    //1.go through pending inputs 
    //2.find and delete inputs that the server has already processed via last_proc_num
    //3.apply inputs to player 
    //4.pray it works
    for (entity of this.entities) {
        if (entity.id == this.client_id) {
            //console.log(`old:x${entity.x}y${entity.y}`)
            var i = this.pending_input_states.length;
            while (i--) {
                var input = this.pending_input_states[i];
                console.log(input.input_no, this.last_processed_input_no, this.pending_input_states.length);
                if (input.input_no <= this.last_processed_input_no) {
                    this.pending_input_states.splice(i, 1);
                }   
            }
            for(input in this.pending_input_states) {
                this.applyInput(input, entity);
            }
            //console.log(`new:x${entity.x}y${entity.y}`)
        }
    }

	this.processInputs();
    this.draw();
}

Game.prototype.draw =function() {
    this.ctx.clearRect(0, 0, this.canvas.width, this.canvas.height);
    for(entity of this.entities) {
        this.ctx.beginPath();
        this.ctx.rect(entity.x-(entity.size/2), entity.y-(entity.size/2), 50, 50);
        this.ctx.stroke();
    }
}

Game.prototype.processInputs = function() {
	var now_ts = +new Date();
	var last_ts = this.last_ts || now_ts;
	var dt_sec = (now_ts - last_ts)/1000;
	this.last_ts = now_ts; //getting the time from the last update till now 
	
	var temp_inputs = {}; //how long are you pressing each key?
	for(property in this.controller) {
		if(this.controller[property]) {
			temp_inputs[property] = dt_sec;
		}
	}
    console.log(Object.keys(temp_inputs).length);
    if(Object.keys(temp_inputs).length != 0) {
        var packaged_input = {input_no: this.input_no, inputs: temp_inputs}

        this.socket.emit('inputs', packaged_input);    
        
        for(entity of this.entities) {
            if (entity.id == this.client_id) {
                console.log('yo');
                this.applyInput(temp_inputs, entity);
            }
        }
        this.pending_input_states.push(packaged_input)
        this.input_no++;
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
