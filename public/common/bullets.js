import { Bullet } from "./entityTypes.js";

export let radialShotgun = function(x, y, spd, size, shotCount) {
    this.creationTS = new Date().getTime()
    this.x = x;
    this.y = y;
    this.speed = spd;
    this.size = size;
    this.shotCount = shotCount;

    this.patternType = 'radial';
}

export function parsePattern(pattern, entities) {
    if (pattern.patternType == 'radial') {
        for(let i = 0; i < pattern.shotCount; i++) {
            let bullet = new Bullet(pattern.x, pattern.y, pattern.speed, pattern.size, i * (360/pattern.shotCount))
            bullet.creationTS = pattern.creationTS+200;
            entities.push(bullet);
        }
    }
}