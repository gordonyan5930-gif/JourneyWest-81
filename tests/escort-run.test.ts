import {test,expect} from 'vitest';
import {EscortRun,ESCORT} from '../src/game/escortRun';
import {distance,segmentClear} from '../src/game/smoothMovement';
const until=(r:EscortRun,condition:()=>boolean,seconds=90)=>{for(let i=0;i<seconds*60&&!condition()&&!r.finished;i++)r.update(1/60);expect(condition()).toBe(true);};
test('both required approaching enemies and every threatening arrow must resolve before real exit victory',()=>{
 const r=new EscortRun();expect(r.phase).toBe('ready');r.start();expect(r.battle.enemies.length).toBe(2);expect(r.battle.enemies.every(a=>distance(a,r.battle.tang)>900)).toBe(true);const initial=r.battle.enemies.map(a=>({...a}));until(r,()=>r.battle.enemies.some(a=>a.hp<=0));expect(r.battle.safe).toBe(false);expect(r.finished).toBe(false);expect(r.battle.enemies.some(a=>a.hp>0)).toBe(true);expect(r.battle.enemies.every((a,i)=>distance(a,initial[i])>60)).toBe(true);
 until(r,()=>r.phase==='depart');expect(distance(r.battle.tang,ESCORT.exit)).toBeGreaterThan(100);until(r,()=>r.phase==='won');expect(r.battle.safe).toBe(true);expect(distance(r.battle.tang,ESCORT.exit)).toBeLessThanOrEqual(2);const terminal=JSON.stringify(r.battle);r.update(10);expect(JSON.stringify(r.battle)).toBe(terminal);
});
test('wrong manual holding naturally loses while restart after loss and win has fresh state',()=>{
 const r=new EscortRun();r.start();r.command({type:'move',position:ESCORT.exit});until(r,()=>r.phase==='lost');expect(r.battle.tang.hp).toBe(0);expect(r.battle.arrowsFired).toBeGreaterThanOrEqual(5);const old=r.battle;r.start();expect(r.battle).not.toBe(old);expect(r.battle.tang.hp).toBe(100);expect(r.battle.hero.hp).toBe(180);expect(r.battle.enemies.every(a=>a.hp===100)).toBe(true);until(r,()=>r.phase==='won');r.start();expect(r.phase).toBe('approach');expect(r.meleeHits).toBe(0);expect(r.sosCount).toBe(0);expect(r.revives).toBe(0);expect(r.manualHero).toBe(false);
});
test('restart clears actual flight, windup, target threats, rescue and resource state',()=>{
 const r=new EscortRun();r.start();until(r,()=>r.battle.shots.some(s=>s.kind==='arrow')&&r.battle.enemies[0].hp>0&&distance(r.battle.hero,r.battle.archer)<420&&segmentClear(r.battle.hero,r.battle.archer));expect(r.command({type:'cast',targetId:'archer-1'})).toBe(true);expect(r.battle.casting).toBe(true);r.start();expect(r.battle.shots).toEqual([]);expect(r.battle.cast).toBe(null);expect(r.battle.cooldown).toBe(0);expect(r.battle.energy).toBe(100);expect(r.battle.enemies.every(a=>a.targetId===''&&Object.keys(a.threat).length===0)).toBe(true);expect(r.evadeGoal).toBe(null);expect(r.melee).toBe(null);expect(r.events.map(e=>e.kind)).toEqual(['warning']);
});
