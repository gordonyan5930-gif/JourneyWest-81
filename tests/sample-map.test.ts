import {it,expect} from 'vitest';
import {path} from '../src/game/world';
import {sampleWalkable,SAMPLE_MAP,sampleTerrain,ROAD,sampleSpeed} from '../src/game/sampleMap';
const tile=SAMPLE_MAP.tile;
const routeTo=(x:number,y:number)=>path({x:SAMPLE_MAP.start.x/tile,y:SAMPLE_MAP.start.y/tile},{x:x/tile,y:y/tile},sampleWalkable);
it('crosses the full ground/ford without entering excluded terrain',()=>{
 const route=routeTo(SAMPLE_MAP.destination.x,SAMPLE_MAP.destination.y);
 expect(route.length).toBeGreaterThan(80);expect(route.every(p=>sampleWalkable(Math.floor(p.x),Math.floor(p.y)))).toBe(true);expect(sampleWalkable(-1,20)).toBe(false);
});
it('allows broad grass and grove detours beyond the former road corridor',()=>{
 for(const [x,y,ground] of [[575,470,'grass'],[230,640,'forest']] as const){expect(sampleTerrain(Math.floor(x/tile),Math.floor(y/tile))).toBe(ground);expect(routeTo(x,y).length).toBeGreaterThan(0);}
 expect(sampleSpeed(230,640)).toBe(.8);
});
it('separates shallow ford, deep pool, cliff and mountain collisions',()=>{
 const at=(x:number,y:number)=>sampleTerrain(Math.floor(x/tile),Math.floor(y/tile));
 expect(at(957,462)).toBe('shallow');expect(routeTo(957,462).length).toBeGreaterThan(0);
 expect(at(1250,650)).toBe('deep-water');expect(routeTo(1250,650)).toEqual([]);
 expect(at(770,800)).toBe('cliff');expect(routeTo(770,800)).toEqual([]);
 expect(at(380,500)).toBe('mountain');expect(routeTo(380,500)).toEqual([]);
 expect(ROAD.length).toBeGreaterThan(2);
});

import {TERRAIN_REVIEW,reviewWorld} from '../src/game/terrainReview';
it('matches the recorded fence, bank and rock correction points',()=>{for(const c of TERRAIN_REVIEW){const p=reviewWorld(c.source);expect(sampleTerrain(Math.floor(p.x/tile),Math.floor(p.y/tile)),c.id).toBe(c.expected);if(['fence','mountain'].includes(c.expected))expect(routeTo(p.x,p.y),c.id).toEqual([]);else expect(routeTo(p.x,p.y).length,c.id).toBeGreaterThan(0);}});
