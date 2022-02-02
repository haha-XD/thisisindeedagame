import fs from 'fs';
import * as entityTypes from '../public/common/entityTypes.js';
import { TILE_SIZE, CHUNK_SIZE } from '../public/common/constants.js';
import { DefaultDict } from '../public/common/helper.js';

const entityDict = {
    '#' : entityTypes.Wall
}

export function loadMap(mapName) {
    let tempArray = []

    const data = fs.readFileSync(`./data/${mapName}/mapData.txt`, 'utf8')
    for (const [y, line] of data.split(/\r?\n/).entries()) {
        for (const [x, char] of line.split('').entries()) {
            if (Object.keys(entityDict).includes(char)) {
                tempArray.push(new entityDict[char](TILE_SIZE/2 + (TILE_SIZE * x), 
                                                    TILE_SIZE/2 + (TILE_SIZE * y), 
                                                    TILE_SIZE))
            }
        }
    }

    return tempArray;
}

export function updateChunks(entities) {	
	let tChunks = new DefaultDict(Array);

	for(let entity of entities) {
		let chunkX = Math.trunc(entity.x / CHUNK_SIZE)
		let chunkY = Math.trunc(entity.y / CHUNK_SIZE)
        if (entity.entityId == 'bullet') {
        }
		tChunks[[chunkX, chunkY]].push(entity);
	}	
	return tChunks
}

export function getVisibleChunks(chunkLoc, chunks) {
    let result = []
    for (let nx = -1; nx < 2; nx++) {
        for (let ny = -1; ny < 2; ny++) {
            result = result.concat(chunks[[chunkLoc[0]+nx, chunkLoc[1]+ny]]);
        }
    }
    return result
}