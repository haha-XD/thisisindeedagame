export let BasePattern = function(x, y, spd, size, lifetime, damage) {
    this.x = x;
    this.y = y;
    this.speed = spd;
    this.size = size;
    this.lifetime = lifetime; //seconds
    this.damage = damage;
}

export let radialShotgun = function({x, y, speed, size, lifetime, damage, shotCount, direction}) {
	BasePattern.call(this, x, y, speed, size, lifetime, damage);

    this.shotCount = shotCount;
    this.direction = direction
    this.patternType = 'radial';
}

export let coneShotgun = function({x, y, speed, size, lifetime, damage, shotCount, direction, coneAngle}) {
	BasePattern.call(this, x, y, speed, size, lifetime, damage);

    this.shotCount = shotCount;
    this.direction = direction
    this.coneAngle = coneAngle
    this.patternType = 'coneShotgun';
}