import { advance, addVectors } from './helper.js' 
import { CHUNK_SIZE } from './constants.js' 

export function applyInput(rot, inputs, entity, wallEntities) {
    let movementVec = [0,0]
    if (inputs[87] && inputs[87] <= 0.3) { //w 
        movementVec = addVectors(advance(-rot+90, -inputs[87]), movementVec)
    }
    if (inputs[83] && inputs[83] <= 0.3) { //s
        movementVec = addVectors(advance(-rot+90, inputs[83]), movementVec)
    }
    if (inputs[68] && inputs[68] <= 0.3) { //d
        movementVec = addVectors(advance(-rot, inputs[68]), movementVec)
    }
    if (inputs[65] && inputs[65] <= 0.3) { //a
        movementVec = addVectors(advance(-rot, -inputs[65]), movementVec)
    }
    let magnitude = Math.sqrt(movementVec[0]**2 + movementVec[1]**2);
    if (magnitude == 0) {
        return;
    }
    movementVec = [movementVec[0]/magnitude*entity.speed,
                   movementVec[1]/magnitude*entity.speed] 
    //normalize movement vector then multiply by speed

    entity.y += movementVec[1];
    for (let wallEntity of wallEntities) {
        if (detectEntityCollision(entity, wallEntity)) {
            if (movementVec[1] > 0) {
                entity.y = entityTop(wallEntity) - entity.size/2 - 1
            }
            if (movementVec[1] < 0) {
                entity.y = entityBottom(wallEntity) + entity.size/2 + 1
            }
        }    
    }
    entity.x += movementVec[0];
    for (let wallEntity of wallEntities) {
        if (detectEntityCollision(entity, wallEntity)) {
            if (movementVec[0] > 0) {
                entity.x = entityLeft(wallEntity) - entity.size/2 - 1
            }
            if (movementVec[0] < 0) {
                entity.x = entityRight(wallEntity) + entity.size/2 + 1
            }
        }    
    }
}

export function advanceEntity(entity, angle, amount) {
    let movementVec = advance(angle, amount * entity.speed);
    entity.x += movementVec[0];
    entity.y += movementVec[1];
}

export function entityTop(entity) {
    return entity.y - entity.size/2;
}

export function entityBottom(entity) {
    return entity.y + entity.size/2;
}

export function entityRight(entity) {
    return entity.x + entity.size/2
}

export function entityLeft(entity) {
    return entity.x - entity.size/2
}

export function detectEntityCollision(entity1, entity2) {
    if (!(entityRight(entity1) < entityLeft(entity2) ||
          entityLeft(entity1) > entityRight(entity2) ||
          entityBottom(entity1) < entityTop(entity2) ||
          entityTop(entity1) > entityBottom(entity2))) {
        //then entity1 is colliding with entity2
        return true;
    } else {
        return false;
    }
}

export function entityChunkLoc(entity) {
    return [Math.trunc(entity.x/CHUNK_SIZE),
            Math.trunc(entity.y/CHUNK_SIZE)];
}