import {test,expect} from 'vitest';
import {EscortRun,ESCORT} from '../src/game/escortRun';
import {RANGED} from '../src/game/rangedCombat';
import {distance,segmentClear} from '../src/game/smoothMovement';
const until=(r:EscortRun,condition:()=>boolean,seconds=50)=>{for(let i=0;i<seconds*60&&!condition();i++)r.update(1/60);expect(condition()).toBe(true);};
const encounter=(r:EscortRun)=>{r.start();until(r,()=>r.phase==='encounter');};
const protect=(r:EscortRun)=>{expect(r.battle.request(ESCORT.guard,'archer-1')).toBe(true);until(r,()=>r.battle.hits===1);until(r,()=>r.battle.cooldown===0);expect(r.battle.request(ESCORT.guard,'archer-1')).toBe(true);until(r,()=>r.phase==='depart');};
test('actual safe path positions trigger encounter; killing archer is not arrival victory',()=>{
 const r=new EscortRun();expect(r.phase).toBe('ready');r.start();const initial={...r.battle.tang};r.update(.1);expect(distance(initial,r.battle.tang)).toBeGreaterThan(0);expect(r.battle.active).toBe(false);
 let prev={...r.battle.tang};for(let i=0;i<3000&&r.phase==='approach';i++){r.update(1/60);expect(segmentClear(prev,r.battle.tang)).toBe(true);prev={...r.battle.tang};}
 expect(r.phase).toBe('encounter');expect(distance(r.battle.tang,ESCORT.encounter)).toBeLessThanOrEqual(ESCORT.arrival);protect(r);
 expect(r.finished).toBe(false);expect(distance(r.battle.tang,ESCORT.exit)).toBeGreaterThan(100);
 let previous={...r.battle.tang};for(let i=0;i<3000&&r.phase==='depart';i++){r.update(1/60);expect(segmentClear(previous,r.battle.tang)).toBe(true);previous={...r.battle.tang};}expect(r.phase).toBe('won');expect(r.battle.safe).toBe(true);expect(r.battle.tang.hp).toBeGreaterThan(0);expect(distance(r.battle.tang,ESCORT.exit)).toBeLessThanOrEqual(ESCORT.arrival);
 const terminal=JSON.stringify(r.battle);r.update(10);expect(JSON.stringify(r.battle)).toBe(terminal);
});
test('normal archer AI kills unprotected Tang; restart after loss and after win are clean',()=>{
 const r=new EscortRun();encounter(r);until(r,()=>r.phase==='lost',20);expect(r.battle.tang.hp).toBe(0);expect(r.battle.arrowsFired).toBeGreaterThanOrEqual(5);
 const old=r.battle;r.start();expect(r.battle).not.toBe(old);expect(r.phase).toBe('approach');expect(r.battle.failed).toBe(false);expect(r.battle.tang.hp).toBe(100);expect(r.battle.archer.hp).toBe(100);expect(r.battle.active).toBe(false);
 until(r,()=>r.phase==='encounter');protect(r);until(r,()=>r.phase==='won');r.start();expect(r.phase).toBe('approach');expect(r.battle.hits).toBe(0);expect(r.battle.tang.hp).toBe(100);
});
test('restart during actual arrow flight or skill windup clears shots, enemy, cast, resources and timers',()=>{
 const r=new EscortRun();encounter(r);until(r,()=>r.battle.shots.some(s=>s.kind==='arrow'));
 expect(r.battle.request(ESCORT.guard,'archer-1')).toBe(true);expect(r.battle.casting).toBe(true);expect(r.battle.cooldown).toBe(RANGED.cooldown);r.start();
 expect(r.battle.shots).toEqual([]);expect(r.battle.cast).toBe(null);expect(r.battle.cooldown).toBe(0);expect(r.battle.energy).toBe(RANGED.energyMax);expect(r.battle.sequence).toBe(0);expect(r.battle.time).toBe(0);expect(r.battle.arrowsFired).toBe(0);expect(r.battle.archer.windup).toBe(0);expect(r.battle.archer.stun).toBe(0);
});
