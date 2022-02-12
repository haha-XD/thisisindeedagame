import fs from 'fs';
import * as bulletPatterns from '../public/common/bulletPatterns.js';
import { fireBullet } from '../public/common/bullets.js';

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

export function updateEnemy(entity, ai, playerEntities, io, currentTick, projectiles) {
    entity.counter += 1;

    if(!entity.state) entity.state = ai.defaultState
    for (let behaviour of ai.states[entity.state].behaviour) {
        const args = behaviour.split(' ');
        parseCommand(playerEntities, entity, args, io, ai, currentTick, projectiles)
    }
}

function getClosestPlayer(entity, playerEntities) {
    let min = Infinity
    let closestPlayer;
    for (let pEntity of playerEntities) {
        let dist = Math.sqrt((pEntity.x-entity.x)**2+(pEntity.y-entity.y)**2)
        if (dist < min) {
            min = dist;
            closestPlayer = pEntity;
        }
    }                
    return [min, closestPlayer];
}

function parseCommand(playerEntities, entity, args, io, ai, currentTick, projectiles) {
    if (playerEntities.length==0) return;
    let [min, closestPlayer] = getClosestPlayer(entity, playerEntities)
    switch (args[0]) {
        case 'stateChangeInRange':
            if (min < args[1]) {
                entity.state = args[2];
            }
            break;
        case 'stateChangeOutRange':
            if (min > args[1]) {
                entity.state = args[2];
            }
            break;
        case 'stateChangeTime':
            if (entity.counter % args[1] == 0) {
                entity.state = args[2]
            }
            break;
        case 'chase':
            let angleToPlayer = Math.atan2(closestPlayer.y-entity.y, 
                                           closestPlayer.x-entity.x) * 180/Math.PI;
            advanceEntity(entity, angleToPlayer, entity.speed);
            break;
        case 'shoot':
            if (entity.counter % args[2] == 0) {
                let bullet = ai.projectiles[args[1]];
                bullet.x = entity.x
                bullet.y = entity.y
                fireBullet(bullet, io, currentTick, projectiles)
            }
            break;
        case 'shootAimed':
            if (entity.counter % args[2] == 0) {
                let angleToPlayer = Math.atan2(closestPlayer.y-entity.y, 
                                               closestPlayer.x-entity.x) * 180/Math.PI;
                let bullet = ai.projectiles[args[1]];
                bullet.x = entity.x
                bullet.y = entity.y
                bullet.direction = angleToPlayer;
                fireBullet(bullet, io, currentTick, projectiles)
            }
            break;
        case 'shootSpiral':
            if (entity.counter % args[2] == 0) {
                let bullet = ai.projectiles[args[1]];
                bullet.x = entity.x
                bullet.y = entity.y
                bullet.direction = entity.spiralAngle;
                fireBullet(bullet, io, currentTick, projectiles)
                entity.spiralAngle += parseInt(args[3])
            }
            break;
    }
}