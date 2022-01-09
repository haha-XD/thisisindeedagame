var BaseEntity = function(x, y, spd, size) {
	this.x = x;
	this.y = y;
	this.speed = spd;
	this.size = size;
}
exports.BaseEntity = BaseEntity;

var Player = function(x, y, spd, size, socketId) {
	BaseEntity.call(this, x, y, spd, size);

	this.socketId = socketId;
}
exports.Player = Player;

var Bullet = function(x, y, spd, size, dir) {
	BaseEntity.call(this, x, y, spd, size);

	this.direction = dir;
}
exports.Bullet = Bullet;