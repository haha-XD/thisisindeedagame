import { advance } from './helper.js' 

export function applyInput(rot, inputs, entity) {
    if (inputs[87]) { //w 
        advanceEntity(entity, -rot+90, -inputs[87] * entity.speed)
    }
    if (inputs[83]) { //s
        advanceEntity(entity, -rot+90, inputs[83] * entity.speed)
    }
    if (inputs[68]) { //d
        advanceEntity(entity, -rot, inputs[68] * entity.speed)
    }
    if (inputs[65]) { //a
        advanceEntity(entity, -rot, -inputs[65] * entity.speed)
    }
}

export function advanceEntity(entity, angle, amount) {
    console.log(entity, angle, amount);
    let newPos = advance(entity.x, entity.y, angle, amount);
    entity.x = newPos[0];
    entity.y = newPos[1];
}