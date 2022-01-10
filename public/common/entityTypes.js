export var BaseEntity = function(x, y, spd, size) {
	this.x = x;
	this.y = y;
	this.speed = spd;
	this.size = size;
}

export var Player = function(x, y, spd, size, socketId) {
	BaseEntity.call(this, x, y, spd, size);

	this.socketId = socketId;
}

export var Bullet = function(x, y, spd, size, dir) {
	BaseEntity.call(this, x, y, spd, size);

	this.direction = dir;
}