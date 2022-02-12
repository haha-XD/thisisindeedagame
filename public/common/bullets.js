import { Bullet } from "./entityTypes.js";
import * as bulletPatterns from "./bulletPatterns.js";
import { radians } from "./helper.js";
import { PROJECTILE_DELAY, SV_UPDATE_RATE } from "./constants.js";

export function updateBullet(entity) {
    let elapsedTime = new Date().getTime() - entity.creationTS; 
    if (elapsedTime<0) {
        entity.x = NaN
        entity.y = NaN
    }
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
            for(let i = 0; i < pattern.shotCount; i++) {
                let bullet = new Bullet(
                    pattern.x, pattern.y, 
                    pattern.speed, 
                    pattern.size, 
                    pattern.direction + i * (360/pattern.shotCount),
                    pattern.lifetime,
                    pattern.damage
                )
                bullet.creationTS = pattern.creationTS
                entities.push(bullet);
            }
            break;
        case 'coneShotgun':
            for(let i = 0; i < pattern.shotCount; i++) {
                let bullet = new Bullet(
                    pattern.x, pattern.y, 
                    pattern.speed, 
                    pattern.size, 
                    pattern.direction - pattern.coneAngle/2 + i * (pattern.coneAngle/pattern.shotCount),
                    pattern.lifetime,
                    pattern.damage
                )
                bullet.creationTS = pattern.creationTS
                entities.push(bullet);
            }
            break;
    }
}

export function fireBullet(bullet, io, currentTick, projectiles) {
    let pattern = new bulletPatterns[bullet.type](bullet);
    pattern.creationTS -= PROJECTILE_DELAY
    parsePattern(pattern, projectiles)
    io.emit('bullet', {
        tick: currentTick + Math.floor(PROJECTILE_DELAY/(1000/SV_UPDATE_RATE)), 
        bullet: pattern
    });    
}