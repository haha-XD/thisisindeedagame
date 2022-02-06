import { Bullet } from "./entityTypes.js";
import { radians } from "./helper.js";

export let BasePattern = function(x, y, spd, size, lifetime, damage) {
    this.creationTS = new Date().getTime()
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

export function updateBullet(entity) {
    let elapsedTime = new Date().getTime() - entity.creationTS; 
    if (elapsedTime/1000 > entity.lifetime) {
        return false;
    }
    entity.x = entity.oX + elapsedTime/10*entity.speed*Math.cos(radians(entity.direction));
    entity.y = entity.oY + elapsedTime/10*entity.speed*Math.sin(radians(entity.direction));
    return true;
}

export function parsePattern(pattern, entities) {
    switch (pattern.patternType) {
        case 'radial':
            console.log(pattern.shotCount)
            for(let i = 0; i < pattern.shotCount; i++) {
                let bullet = new Bullet(pattern.x, pattern.y, 
                                        pattern.speed, 
                                        pattern.size, 
                                        pattern.direction + i * (360/pattern.shotCount),
                                        pattern.lifetime,
                                        pattern.damage)
                entities.push(bullet);
            }
            break;
        case 'coneShotgun':
            for(let i = 0; i < pattern.shotCount; i++) {
                let bullet = new Bullet(pattern.x, pattern.y, 
                                        pattern.speed, 
                                        pattern.size, 
                                        pattern.direction - pattern.coneAngle/2 + i * (pattern.coneAngle/pattern.shotCount),
                                        pattern.lifetime,
                                        pattern.damage)
                entities.push(bullet);
            }
            break;
    }
}