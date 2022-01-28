import { Bullet } from "./entityTypes.js";
import { radians } from "./helper.js";

let id = 0;

export let BasePattern = function(x, y, spd, size, lifetime) {
    this.creationTS = new Date().getTime()
    this.x = x;
    this.y = y;
    this.speed = spd;
    this.size = size;
    this.lifetime = lifetime //seconds
}

export let radialShotgun = function(x, y, spd, size, lifetime, shotCount, startAngle) {
	BasePattern.call(this, x, y, spd, size, lifetime);

    this.shotCount = shotCount;
    this.startAngle = startAngle
    this.patternType = 'radial';
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
    console.log(pattern)
    if (pattern.patternType == 'radial') {
        for(let i = 0; i < pattern.shotCount; i++) {
            let bullet = new Bullet(pattern.x, pattern.y, 
                                    pattern.speed, 
                                    pattern.size, 
                                    pattern.startAngle + i * (360/pattern.shotCount),
                                    pattern.lifetime)
            bullet.creationTS = pattern.creationTS+200;
            entities.push(bullet);
        }
    }
}