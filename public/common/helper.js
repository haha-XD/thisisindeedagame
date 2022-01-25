export function radians(angle) {
    return (Math.PI/180) * angle; 
}

export function advance(angle, amount) {
    let vecX = Math.cos(radians(angle)) * amount;
    let vecY = Math.sin(radians(angle)) * amount;
    return [vecX, vecY];
}

export function rotate(x, y, angle) {
    let rotX = x * Math.cos(radians(angle)) - y * Math.sin(radians(angle));
    let rotY = x * Math.sin(radians(angle)) + y * Math.cos(radians(angle));
    return [rotX, rotY];
}

export function addVectors(vec1, vec2) {
    return [vec1[0] + vec2[0], vec1[1] + vec2[1]];
}

export class DefaultDict {
    constructor(defaultInit) {
      return new Proxy({}, {
        get: (target, name) => name in target ?
          target[name] :
          (target[name] = typeof defaultInit === 'function' ?
            new defaultInit().valueOf() :
            defaultInit)
      })
    }
}
  
  