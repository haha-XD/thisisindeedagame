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