import {it,expect} from 'vitest';
import {path} from '../src/game/world';
import {sampleWalkable,SAMPLE_MAP} from '../src/game/sampleMap';
it('new sample has a continuous authored corridor and blocks mountains/void',()=>{
 const route=path({x:SAMPLE_MAP.start.x/32,y:SAMPLE_MAP.start.y/32},{x:SAMPLE_MAP.destination.x/32,y:SAMPLE_MAP.destination.y/32},sampleWalkable);
 expect(route.length).toBeGreaterThan(20);expect(route.every(p=>sampleWalkable(Math.floor(p.x),Math.floor(p.y)))).toBe(true);expect(sampleWalkable(17,7)).toBe(false);expect(sampleWalkable(-1,20)).toBe(false);
});
