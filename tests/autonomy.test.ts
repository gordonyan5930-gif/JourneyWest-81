import {COMBO} from '../src/game/meleeCombo';
import {test,expect} from 'vitest';
import {EscortRun,ESCORT} from '../src/game/escortRun';
import {distance,segmentClear,smoothPath,type Navigation} from '../src/game/smoothMovement';
import {GUARD,saferPoint,chooseEnemyTarget} from '../src/game/guardRules';
import {RangedBattle,makeArcher,RANGED,ARCHER} from '../src/game/rangedCombat';
const advance=(r:EscortRun,seconds:number,observe?:(r:EscortRun)=>void)=>{for(let i=0;i<seconds*60&&!r.finished;i++){r.update(1/60);observe?.(r);}};
const until=(r:EscortRun,condition:()=>boolean,seconds=80)=>{for(let i=0;i<seconds*60&&!condition()&&!r.finished;i++)r.update(1/60);expect(condition()).toBe(true);};
const open:Navigation={tile:16,walkable:(x,y)=>x>=0&&y>=0&&x<70&&y<45,speed:()=>1};
test('no input guard fights, takes real damage, preserves geometry and wins without spending skill energy',()=>{
 const r=new EscortRun();r.start();let previous=[{...r.battle.hero},{...r.battle.tang},...r.battle.enemies.map(a=>({...a}))],oldTang=100,eventIndex=1;const starts=new Map<string,number>();
 advance(r,90,r=>{const now=[r.battle.hero,r.battle.tang,...r.battle.enemies];now.forEach((p,i)=>expect(segmentClear(previous[i],p)).toBe(true));previous=now.map(p=>({...p}));expect(r.battle.tang.hp).toBeLessThanOrEqual(oldTang);oldTang=r.battle.tang.hp;
  for(const e of r.events.slice(eventIndex)){if(e.kind==='melee-windup')starts.set(e.target!,e.time);if(e.kind==='melee'){expect(e.time-starts.get(e.target!)!).toBeGreaterThanOrEqual(COMBO.steps[e.step??0].windup-.017);expect(distance(r.battle.hero,{x:e.x!,y:e.y!})).toBeLessThanOrEqual(GUARD.meleeRange);expect(segmentClear(r.battle.hero,{x:e.x!,y:e.y!})).toBe(true);}if(e.kind==='shot')expect(e.time).toBeGreaterThanOrEqual(GUARD.reaction);}eventIndex=r.events.length;
 });
 expect(r.phase).toBe('won');expect(r.meleeHits).toBeGreaterThanOrEqual(8);expect(r.battle.hero.hp).toBeLessThan(180);expect(r.battle.hero.hp).toBeGreaterThan(0);expect(r.battle.energy).toBe(100);expect(r.battle.hits).toBe(0);expect(r.battle.enemies.every(a=>a.hp===0)).toBe(true);expect(r.battle.safe).toBe(true);expect(distance(r.battle.tang,ESCORT.exit)).toBeLessThan(2);
 const shots=r.events.filter(e=>e.kind==='shot');expect(shots.some(e=>e.target==='wukong')).toBe(true);
});
test('valid manual movement reaches its destination; far holding can naturally fail and SOS never overrides it',()=>{
 const r=new EscortRun();r.start();expect(r.command({type:'move',position:{x:1390,y:320}})).toBe(true);until(r,()=>r.heroMotion.route.length===0,15);expect(distance(r.battle.hero,{x:1390,y:320})).toBeLessThan(2);advance(r,50);expect(r.phase).toBe('lost');expect(r.sosCount).toBeGreaterThan(0);expect(r.manualHero).toBe(true);expect(r.battle.hits).toBe(0);expect(r.battle.tang.hp).toBe(0);
 const calls=r.events.filter(e=>e.kind==='sos');for(let i=1;i<calls.length;i++)expect(calls[i].time-calls[i-1].time).toBeGreaterThanOrEqual(GUARD.sosInterval-.017);
});
test('rally uses movement instead of teleport/heal and restores an autonomous winning defence',()=>{
 const r=new EscortRun();r.start();r.command({type:'move',position:{x:240,y:720}});advance(r,10);const before={...r.battle.hero},tangHP=r.battle.tang.hp;expect(r.command({type:'rally'})).toBe(true);expect(r.battle.hero.x).toBe(before.x);expect(r.battle.hero.y).toBe(before.y);expect(r.battle.tang.hp).toBe(tangHP);expect(r.manualHero).toBe(false);advance(r,.1);expect(distance(before,r.battle.hero)).toBeLessThanOrEqual(21.01);advance(r,80);expect(r.phase).toBe('won');expect(r.battle.tang.hp).toBeGreaterThan(0);expect(r.events.some(e=>e.kind==='target'&&e.target==='tang')).toBe(true);expect(r.events.some(e=>e.kind==='shot'&&e.target==='wukong')).toBe(true);
});
test('manual skills select either enemy and reduce required melee work using the same resource/flight rules',()=>{
 const r=new EscortRun();r.start();r.command({type:'move',position:{x:900,y:550}});let stage=0,rallied=false;
 advance(r,90,r=>{if(stage<2&&r.battle.time>3&&r.battle.enemies[stage===0?1:0].windup>1&&r.command({type:'cast',targetId:stage===0?'archer-2':'archer-1'}))stage++;if(stage===2&&!rallied&&!r.battle.casting){r.command({type:'rally'});rallied=true;}});
 expect(r.phase).toBe('won');expect(r.battle.hits).toBe(2);expect(r.meleeHits).toBe(6); // 55 ranged +22+22+40 requires three real melee contacts per wounded100HP target.expect(r.events.filter(e=>e.kind==='staff').map(e=>e.target)).toEqual(['archer-2','archer-1']);expect(r.battle.tang.hp).toBeGreaterThan(0);
});
test('natural Wukong knockdown is not failure, costs existing scheme-B energy to revive and never heals Tang',()=>{
 const r=new EscortRun();r.start();r.command({type:'move',position:{x:900,y:550}});let stage=0,posted=false;
 untilControlled(r,()=>r.battle.hero.hp===0,r=>{if(stage<2&&!r.heroMotion.route.length&&r.battle.archer.windup>1&&r.command({type:'cast',targetId:'archer-1'}))stage++;
  const a=r.battle.enemies[1];if(stage===2&&r.battle.archer.hp===0&&!posted&&a.windup>1.4){const angle=Math.atan2(r.battle.hero.y-a.y,r.battle.hero.x-a.x);for(const offset of [0,.35,-.35,.7,-.7]){const p={x:a.x+Math.cos(angle+offset)*110,y:a.y+Math.sin(angle+offset)*110};if(distance(r.battle.hero,p)<270&&r.command({type:'move',position:p})){posted=true;break;}}}
 });
 expect(r.finished).toBe(false);expect(r.command({type:'revive'})).toBe(false);until(r,()=>r.deadFor>=GUARD.reviveDelay,5);const hp=r.battle.tang.hp,energy=r.battle.energy;expect(r.command({type:'revive'})).toBe(true);expect(r.battle.hero.id).toBe('wukong');expect(r.battle.hero.max).toBe(180);expect(r.battle.hero.hp).toBe(180);expect(r.battle.tang.hp).toBe(hp);expect(r.battle.energy).toBeCloseTo(energy-GUARD.reviveCost);expect(r.command({type:'revive'})).toBe(false);
 advance(r,90);expect(r.phase).toBe('won');expect(r.revives).toBe(1);
});
function untilControlled(r:EscortRun,condition:()=>boolean,commands:(r:EscortRun)=>void){for(let i=0;i<5000&&!condition()&&!r.finished;i++){r.update(1/60);commands(r);}expect(condition()).toBe(true);}
test('per-enemy threat, lock and decay avoid global or per-hit retargeting',()=>{
 const h={id:'wukong',x:300,y:100,hp:180,max:180,flash:0},t={id:'tang',x:200,y:100,hp:100,max:100,flash:0},a=makeArcher('a',{x:450,y:100}),other=makeArcher('b',{x:450,y:100});a.targetId=other.targetId='tang';a.lockedUntil=1.2;a.threat.wukong={value:110,at:0};
 expect(chooseEnemyTarget(a,h,t,.3,open)).toBe('tang');expect(chooseEnemyTarget(a,h,t,1.3,open)).toBe('wukong');expect(chooseEnemyTarget(other,h,t,1.3,open)).toBe('tang');expect(chooseEnemyTarget(a,h,t,40,open)).toBe('tang');h.hp=0;expect(chooseEnemyTarget(a,h,t,2,open)).toBe('tang');
});
test('released arrows retain original victim and aim even if shooter changes target; no body interception claim',()=>{
 const b=new RangedBattle(open);b.start();b.driver=()=>{};Object.assign(b.archer,{x:400,y:100});Object.assign(b.tang,{x:200,y:100});Object.assign(b.hero,{x:300,y:100});b.launch('arrow',b.archer,b.tang,ARCHER.damage,ARCHER.arrowSpeed,b.archer.id);b.archer.targetId='wukong';for(let i=0;i<60;i++)b.update(1/60);expect(b.tang.hp).toBe(80);expect(b.hero.hp).toBe(180);
});
test('skill cancels a pending melee rather than counting a second invisible hit',()=>{
 const r=new EscortRun();r.start();until(r,()=>!!r.melee,30);const target=r.melee!.targetId,hitCount=r.meleeHits;expect(r.command({type:'cast',targetId:target})).toBe(true);expect(r.melee).toBe(null);advance(r,.4);expect(r.meleeHits).toBe(hitCount);expect(r.battle.energy).toBeLessThan(100);
});
test('evade candidates handle blocked rear, multiple enemies, distant or down hero without crossing terrain',()=>{
 const nav={...open,walkable:(x:number,y:number)=>open.walkable(x,y)&&!(x*16>=380&&x*16<=450&&y*16>=250&&y*16<=330)};
 const t={x:470,y:350},h={id:'wukong',x:500,y:300,hp:180,max:180,flash:0},es=[{id:'a',x:650,y:300,hp:100,max:100,flash:0},{id:'b',x:470,y:180,hp:100,max:100,flash:0}];
 for(const hero of [h,{...h,x:950,y:600},{...h,hp:0}]){const p=saferPoint(t,hero,es,t,nav);expect(p).not.toBe(null);const path=smoothPath(t,p!,nav).route;expect(path.length).toBeGreaterThan(0);let prev=t;for(const q of path){expect(segmentClear(prev,q,nav)).toBe(true);prev=q;}expect(Math.min(...es.map(e=>distance(e,p!)))).toBeGreaterThan(100);expect(distance(t,p!)).toBeLessThanOrEqual(GUARD.evadeLeash);}
});
