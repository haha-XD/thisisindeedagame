import { Bullet } from "./entityTypes.js";
import * as bulletPatterns from "./bulletPatterns.js";
import { radians } from "./helper.js";

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
            for(let i = 0; i < pattern.shotCount; i++) {
                let bullet = new Bullet(pattern.x, pattern.y, 
                                        pattern.speed, 
                                        pattern.size, 
                                        pattern.direction + i * (360/pattern.shotCount),
                                        pattern.lifetime,
                                        pattern.damage)
                bullet.creationTS = new Date().getTime()
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
                bullet.creationTS = new Date().getTime()
                entities.push(bullet);
            }
            break;
    }
}

export function fireBullet(bullet, io) {
    for (let s of io.of('/').sockets) {
        let socket = s[1];
        let pattern = new bulletPatterns[bullet.type](bullet)
        setTimeout(() => {
            parsePattern(pattern, socket.projectiles)
        }, socket.latency)
        socket.emit('bullet', pattern);    
    }
}