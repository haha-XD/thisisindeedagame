export function applyInput(inputs, entity) {
    if (inputs[87]) {
        entity.y -= (inputs[87]) * entity.speed;
    }
    if (inputs[83]) {
        entity.y += (inputs[83]) * entity.speed;
    }
    if (inputs[68]) {
        entity.x += (inputs[68]) * entity.speed;
    }
    if (inputs[65]) {
        entity.x -= (inputs[65]) * entity.speed;
    }
}