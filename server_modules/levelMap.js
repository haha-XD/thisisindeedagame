import fs from 'fs';
import * as entityTypes from '../public/common/entityTypes.js';
import { TILE_SIZE } from './constants.js';

const entityDict = {
    '#' : entityTypes.Wall
}

export function loadMap(mapName) {
    try {
        let tempArray = []

        const data = fs.readFileSync(`./map_data/${mapName}.txt`, 'utf8')
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
    } catch (err) {
        console.error(err)
    }

}
