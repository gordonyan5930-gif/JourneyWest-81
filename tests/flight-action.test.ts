import {test,expect} from 'vitest';
import {EscortRun} from '../src/game/escortRun';
import {AIR_NAV,CHOICES,FLIGHT} from '../src/game/flightAction';
import {distance,segmentClear} from '../src/game/smoothMovement';
import {sampleTerrain} from '../src/game/sampleMap';
import {RangedBattle} from '../src/game/rangedCombat';
const dt=1/60;
function run(){const r=new EscortRun(undefined,'choices');r.start();return r;}
function step(r:EscortRun,seconds:number){for(let i=0;i<Math.round(seconds/dt);i++)r.update(dt);}
function until(r:EscortRun,p:()=>boolean,seconds=40){for(let i=0;i<seconds/dt&&!p();i++)r.update(dt);expect(p()).toBe(true);}
test('normal fly uses one real hero, single charge/contact, safe auto return, unchanged existing stats',()=>{
 const r=run();step(r,10);console.log('FLIGHT_START',r.battle.hero,r.battle.tang,r.battle.enemies.map(a=>({id:a.id,x:a.x,y:a.y,hp:a.hp})));const energy=r.battle.energy;
 expect(r.command({type:'fly',targetId:'archer-1'})).toBe(true);expect(r.battle.energy).toBe(energy-30);expect(r.command({type:'fly',targetId:'archer-2'})).toBe(false);expect(r.command({type:'cast',targetId:'archer-1'})).toBe(false);
 const history:any[]=[];let last={...r.battle.hero};until(r,()=>{history.push({x:r.battle.hero.x,y:r.battle.hero.y,height:r.flight.height,phase:r.flight.phase});expect(distance(last,r.battle.hero)).toBeLessThanOrEqual(FLIGHT.speed*dt+.01);last={...r.battle.hero};return !r.flight.active;});
 expect(history.some(p=>p.height>50&&distance(p,r.flight.origin)>100)).toBe(true);expect(r.flight.events.filter(e=>e.kind==='launch')).toHaveLength(1);expect(r.flight.events.filter(e=>e.kind==='hit')).toHaveLength(1);expect(r.flight.events.find(e=>e.kind==='hit')?.amount).toBeGreaterThan(0);expect(r.flight.events.find(e=>e.kind==='hit')?.amount).toBeLessThanOrEqual(70);expect(r.manualHero).toBe(false);expect(segmentClear(r.battle.hero,r.battle.hero,r.nav)).toBe(true);expect(r.space.friendClear(r.battle.hero,'wukong')).toBe(true);expect(r.flight.height).toBe(0);expect(r.battle.hero.airHeight).toBe(0);
});
test('manual hold return and recall cancel a harvest without spending fruit; retry resets everything',()=>{
 const r=run();r.command({type:'move',position:{x:650,y:580}});until(r,()=>!r.heroMotion.route.length);until(r,()=>r.battle.hero.hp<r.battle.hero.max||r.battle.tang.hp<r.battle.tang.max);const home={...r.battle.hero};expect(r.manualHero).toBe(true);expect(r.command({type:'pick-peach'})).toBe(true);until(r,()=>r.flight.phase==='harvest');expect(r.command({type:'cancel-flight'})).toBe(true);until(r,()=>!r.flight.active);expect(r.flight.fruit).toBe(2);expect(r.flight.events.some(e=>e.kind==='heal')).toBe(false);expect(r.manualHero).toBe(true);expect(distance(r.battle.hero,home)).toBeLessThan(181);
 r.start();expect(r.flight.active).toBe(false);expect(r.flight.fruit).toBe(2);expect(r.flight.cooldown).toBe(0);expect(r.flight.events).toHaveLength(0);expect(r.battle.shots).toHaveLength(0);expect(r.battle.hero.airHeight??0).toBe(0);expect(r.manualHero).toBe(false);
});
test('full HP and invalid/out-of-range requests are free; two successful harvests cap living HP, never revive',()=>{
 const r=run();expect(r.command({type:'pick-peach'})).toBe(false);expect(r.flight.message).toBe('不需要补血');expect(r.flight.fruit).toBe(2);expect(r.command({type:'fly',targetId:'none'})).toBe(false);expect(r.command({type:'fly',targetId:'archer-1'})).toBe(false);expect(r.battle.energy).toBe(100);
 // State-edge component fixture, not ordinary gameplay evidence.
 r.battle.enemies.forEach(a=>a.hp=0);r.battle.hero.hp=170;r.battle.tang.hp=90;expect(r.command({type:'pick-peach'})).toBe(true);until(r,()=>!r.flight.active);expect(r.flight.events.filter(e=>e.kind==='picked')).toHaveLength(1);expect(r.flight.events.filter(e=>e.kind==='heal').every(e=>e.amount!<=40)).toBe(true);expect(r.flight.fruit).toBe(1);expect(r.battle.hero.hp).toBeLessThanOrEqual(180);expect(r.battle.tang.hp).toBeLessThanOrEqual(100);
 r.battle.hero.hp=170;expect(r.command({type:'pick-peach'})).toBe(true);until(r,()=>!r.flight.active);expect(r.flight.fruit).toBe(0);expect(r.flight.events.filter(e=>e.kind==='picked')).toHaveLength(2);expect(r.command({type:'pick-peach'})).toBe(false);expect(r.flight.message).toBe('桃子已耗尽');
});
test('target invalidation and early recall never auto-retarget or refund; contact cannot double settle',()=>{
 const r=run();step(r,10);expect(r.command({type:'fly',targetId:'archer-1'})).toBe(true);step(r,.6);r.battle.damage(r.battle.enemies[0],1000,'fixture','staff');until(r,()=>!r.flight.active);expect(r.flight.hits).toBe(0);expect(r.flight.events.some(e=>e.kind==='target-invalid')).toBe(true);expect(r.flight.events.filter(e=>e.kind==='launch')).toHaveLength(1);
 const q=run();step(q,10);expect(q.command({type:'fly',targetId:'archer-1'})).toBe(true);until(q,()=>q.flight.phase==='contact');for(let i=0;i<8;i++)q.command({type:'cancel-flight'});until(q,()=>!q.flight.active);expect(q.flight.events.filter(e=>e.kind==='hit')).toHaveLength(1);expect(q.flight.events.filter(e=>e.kind==='launch')).toHaveLength(1);
});
test('air path crosses low barriers but forbids mountains/bounds; arrows use captured altitude and can hurt a flier',()=>{
 const fence=Array.from({length:5700},(_,i)=>({x:i%100,y:Math.floor(i/100)})).find(p=>sampleTerrain(p.x,p.y)==='fence')!;expect(AIR_NAV.walkable(fence.x,fence.y)).toBe(true);expect(segmentClear({x:fence.x*16+8,y:fence.y*16+8},{x:fence.x*16+8,y:fence.y*16+8})).toBe(false);expect(AIR_NAV.walkable(-1,10)).toBe(false);expect(segmentClear({x:1120,y:90},{x:1300,y:160},AIR_NAV)).toBe(false);
 const b=new RangedBattle({tile:16,walkable:()=>true,speed:()=>1});b.start();b.driver=()=>{};Object.assign(b.hero,{x:500,y:500,airHeight:70});const a=b.archer;Object.assign(a,{x:450,y:500});b.launch('arrow',a,b.hero,20,420,a.id);for(let i=0;i<20;i++)b.update(dt);expect(b.hero.hp).toBe(160);
 b.hero.hp=180;b.hero.airHeight=0;b.launch('arrow',a,b.hero,20,420,a.id);b.hero.airHeight=70;for(let i=0;i<20;i++)b.update(dt);expect(b.hero.hp).toBe(180);
});
test('downing and loss during harvesting abort settlement and land continuously; revival remains player paid',()=>{
 const r=run();r.battle.hero.hp=170;expect(r.command({type:'pick-peach'})).toBe(true);until(r,()=>r.flight.phase==='harvest');r.battle.damage(r.battle.hero,1000,'fixture','arrow');until(r,()=>!r.flight.active);expect(r.flight.fruit).toBe(2);expect(r.flight.healed).toBe(0);expect(r.battle.hero.hp).toBe(0);expect(r.finished).toBe(false);expect(r.command({type:'revive'})).toBe(false);step(r,3);const e=r.battle.energy;expect(r.command({type:'revive'})).toBe(true);expect(r.battle.energy).toBeLessThan(e);
 const q=run();q.battle.hero.hp=170;q.command({type:'pick-peach'});until(q,()=>q.flight.phase==='harvest');q.battle.damage(q.battle.tang,1000,'fixture','arrow');step(q,3);expect(q.phase).toBe('lost');expect(q.flight.fruit).toBe(2);expect(q.flight.healed).toBe(0);expect(q.flight.active).toBe(false);expect(segmentClear(q.battle.hero,q.battle.hero,q.nav)).toBe(true);
});

test('moving target can evade contact; inaccessible volumes reject free; air death and occupied manual home settle legally',()=>{
 // Deliberate state-edge fixtures, kept separate from normal-command comparisons/browser proof.
 const r=run();step(r,10);expect(r.command({type:'fly',targetId:'archer-1'})).toBe(true);until(r,()=>r.flight.phase==='windup');const a=r.battle.enemies[0];a.x+=180;a.windup=0;step(r,.8);expect(r.flight.hits).toBe(0);expect(r.flight.events.some(e=>e.kind==='miss')).toBe(true);until(r,()=>!r.flight.active);
 const q=run();Object.assign(q.battle.hero,{x:1000,y:500});Object.assign(q.battle.enemies[0],{x:1120,y:100});expect(q.command({type:'fly',targetId:'archer-1'})).toBe(false);expect(q.battle.energy).toBe(100);expect(segmentClear({x:800,y:901},{x:800,y:901},AIR_NAV)).toBe(false);
 const dead=run();step(dead,10);expect(dead.command({type:'fly',targetId:'archer-1'})).toBe(true);step(dead,.8);expect(dead.flight.height).toBeGreaterThan(0);dead.battle.damage(dead.battle.hero,1000,'fixture','arrow');let last={...dead.battle.hero};until(dead,()=>{expect(distance(last,dead.battle.hero)).toBeLessThanOrEqual(FLIGHT.speed*dt+.01);last={...dead.battle.hero};return !dead.flight.active;});expect(dead.flight.hits).toBe(0);expect(segmentClear(dead.battle.hero,dead.battle.hero,dead.nav)).toBe(true);expect(dead.flight.fruit).toBe(2);
 const occupied=run();step(occupied,10);occupied.manualHero=true;const home={...occupied.battle.hero};expect(occupied.command({type:'fly',targetId:'archer-1'})).toBe(true);step(occupied,.5);Object.assign(occupied.battle.enemies[1],home,{id:'archer-2',hp:100,stun:99});until(occupied,()=>!occupied.flight.active);expect(occupied.manualHero).toBe(true);expect(occupied.space.free(occupied.battle.hero,'wukong')).toBe(true);expect(distance(occupied.battle.hero,home)).toBeLessThanOrEqual(320);
});
