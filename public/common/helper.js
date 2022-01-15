export function radians(angle) {
    return (Math.PI/180) * angle; 
}

export function advance(x, y, angle, amount) {
    let tempX = x + (Math.cos(radians(angle)) * amount);
    let tempY = y + (Math.sin(radians(angle)) * amount);
    return [tempX, tempY];
}

export function rotate(x, y, angle) {
    let rotX = x * Math.cos(radians(angle)) - y * Math.sin(radians(angle));
    let rotY = x * Math.sin(radians(angle)) + y * Math.cos(radians(angle));
    return [rotX, rotY];
}