let id = 0;

export let BaseEntity = function(x, y, spd, size) {
	this.creationTS = new Date().getTime(); 
	this.x = x;
	this.y = y;
	this.oX = x;
	this.oY = y;
	this.speed = spd;
	this.size = size;
	this.positionBuffer = [];
	this.id = id
	id++
}

export let Player = function(x, y, spd, size, socketId) {
	BaseEntity.call(this, x, y, spd, size);

	this.entityId = 'player'
	this.hp = 1000;
	this.maxhp = this.hp;
	this.socketId = socketId;
}

export let Bullet = function(x, y, spd, size, dir, lifetime, damage) {
	BaseEntity.call(this, x, y, spd, size);

	this.entityId = 'bullet'
	this.lifetime = lifetime;
	this.direction = dir;
	this.damage = damage;
}

export let Enemy = function(x, y, spd, size, dataAI) {
	BaseEntity.call(this, x, y, spd, size);

	this.entityId = 'enemy';
	this.counter = 0;
	this.spiralAngle = 0;
	this.ai = dataAI; //name of file in /enemy_data
	this.state;
}

export let Wall = function(x, y, size) {
	BaseEntity.call(this, x, y, null, size);

	this.entityId = 'wall'
	this.stationary = true;
}
