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

export function parsePattern(pattern, entities, latency) {
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
                bullet.creationTS = new Date().getTime();
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
                
                bullet.creationTS = new Date().getTime();
                entities.push(bullet);
            }
            break;
    }
}

export function fireBullet(bullet, io, currentTick, projectiles) {
    const pattern = new bulletPatterns[bullet.type](bullet);
    const projectileTick = currentTick + PROJECTILE_DELAY/(1000/SV_UPDATE_RATE)
    parsePattern(pattern, projectiles)
    setTimeout(() => {
        io.emit('bullet', {
            tick: projectileTick,
            bullet: pattern
        }); 
        console.log(projectileTick, currentTick)
    }, PROJECTILE_DELAY)
}