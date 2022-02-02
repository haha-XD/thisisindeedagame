import fs from 'fs';
import { bulletDict } from '../public/common/bullets.js';

import { advanceEntity } from '../public/common/entityOperations.js';

export function loadEnemyAI(mapName) {
    let aiData = {}
    const fileNames = fs.readdirSync(`./data/${mapName}/enemyAI`, 'utf8')
    for (let fileName of fileNames) {    
        const data = JSON.parse(fs.readFileSync(`./data/${mapName}/enemyAI/${fileName}`, 'utf8'))
        aiData[fileName.split('.')[0]] = data;
    }
    return aiData
}

export function updateEnemy(entity, ai, playerEntities, io) {
    entity.counter += 1;

    if(!entity.state) entity.state = ai.defaultState
    for (let behaviour of ai.states[entity.state].behaviour) {
        const args = behaviour.split(' ');
        parseCommand(playerEntities, entity, args, io, ai)
    }
}

function parseCommand(playerEntities, entity, args, io, ai) {
    switch (args[0]) {
        case 'stateChangeInRange':
            for (let pEntity of playerEntities) {
                let dist = Math.sqrt((pEntity.x-entity.x)**2+(pEntity.y-entity.y)**2)
                if (dist < args[1]) {
                    entity.state = args[2];
                    break;
                }
            }
            break;
        case 'chase':
            if (playerEntities.length==0) return;
            let min = Infinity
            let closestPlayer;
            for (let pEntity of playerEntities) {
                let dist = Math.sqrt((pEntity.x-entity.x)**2+(pEntity.y-entity.y)**2)
                if (dist < min) {
                    min = dist;
                    closestPlayer = pEntity;
                }
            }
            let angleToPlayer = Math.atan2(closestPlayer.y-entity.y, 
                                           closestPlayer.x-entity.x) * 180/Math.PI;
            advanceEntity(entity, angleToPlayer, entity.speed);
            break;
        case 'shoot':
            if (entity.counter % args[2] == 0) {
                let bullet = ai.projectiles[args[1]];
                io.emit('bullet', new bulletDict[bullet.type](entity.x, entity.y, 
                                                              bullet.speed, 
                                                              bullet.size, 
                                                              bullet.lifetime, 
                                                              bullet.damage, 
                                                              bullet.shotCount, 
                                                              bullet.startAngle)
                )    
            }
            break;
    }
}