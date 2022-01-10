export let BaseEntity = function(x, y, spd, size) {
	this.x = x;
	this.y = y;
	this.speed = spd;
	this.size = size;
}

export let Player = function(x, y, spd, size, socketId) {
	BaseEntity.call(this, x, y, spd, size);

	this.socketId = socketId;
}

export let Bullet = function(x, y, spd, size, dir) {
	BaseEntity.call(this, x, y, spd, size);

	this.direction = dir;
}