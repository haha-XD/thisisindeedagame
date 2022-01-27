export let BaseEntity = function(x, y, spd, size) {
	this.creationTS = new Date().getTime(); 
	this.x = x;
	this.y = y;
	this.oX = x;
	this.oY = y;
	this.speed = spd;
	this.size = size;
}

export let Player = function(x, y, spd, size, socketId) {
	BaseEntity.call(this, x, y, spd, size);

	this.entityId = 'player'
	this.socketId = socketId;
}

export let Bullet = function(x, y, spd, size, dir) {
	BaseEntity.call(this, x, y, spd, size);

	this.entityId = 'bullet'
	this.direction = dir;
}

export let Wall = function(x, y, size) {
	BaseEntity.call(this, x, y, null, size);

	this.entityId = 'wall'
}

export let BulletPattern = function(x, y, data) {
	BaseEntity.call(this, x, y, null);
	
	this.entityId = 'bulletPattern'
}