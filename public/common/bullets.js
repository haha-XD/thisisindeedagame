import { Bullet } from "./entityTypes.js";

let id = 0;

export let radialShotgun = function(x, y, spd, size, shotCount) {
    this.creationTS = new Date().getTime()
    this.x = x;
    this.y = y;
    this.speed = spd;
    this.size = size;
    this.shotCount = shotCount;

    this.patternType = 'radial';
    this.id = id;
    id++;
}

export function parsePattern(pattern, entities) {
    console.log(pattern)
    if (pattern.patternType == 'radial') {
        for(let i = 0; i < pattern.shotCount; i++) {
            let bullet = new Bullet(pattern.x, pattern.y, pattern.speed, pattern.size, i * (360/pattern.shotCount))
            bullet.creationTS = pattern.creationTS+200;
            entities.push(bullet);
        }
    }
}