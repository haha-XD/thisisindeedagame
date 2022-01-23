import { advance } from './helper.js' 

export function applyInput(rot, inputs, entity, wallEntities) {
    if (inputs[87]) { //w 
        advanceEntity(entity, -rot+90, -inputs[87], wallEntities)
    }
    if (inputs[83]) { //s
        advanceEntity(entity, -rot+90, inputs[83], wallEntities)
    }
    if (inputs[68]) { //d
        advanceEntity(entity, -rot, inputs[68], wallEntities)
    }
    if (inputs[65]) { //a
        advanceEntity(entity, -rot, -inputs[65], wallEntities)
    }
}

export function advanceEntity(entity, angle, amount, wallEntities) {
    console.log(amount)
    if(Math.abs(amount) > 0.01) {
        return
    }
    let movementVec = advance(angle, amount * entity.speed);

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
