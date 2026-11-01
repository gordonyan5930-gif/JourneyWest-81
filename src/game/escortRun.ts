import {RangedBattle,makeArcher,ARCHER,RANGED,type Archer,type DamageEvent} from './rangedCombat';
import {SmoothMover,SAMPLE_NAV,MOVE,distance,segmentClear,type Navigation} from './smoothMovement';
import {SAMPLE_MAP,ROAD} from './sampleMap';
import {GUARD,chooseEnemyTarget,saferPoint,reachableNear} from './guardRules';
import type {Point} from './world';
export const ESCORT={start:{...SAMPLE_MAP.start},encounter:{x:750,y:540},exit:{...SAMPLE_MAP.destination},heroStart:{x:300,y:660},guard:{x:850,y:540},tangSpeed:70,arrival:2,approachRoute:[ROAD[2],ROAD[3],{x:750,y:540}],departureRoute:[ROAD[4],ROAD[5],ROAD[6],ROAD[7],ROAD[8],SAMPLE_MAP.destination],entrances:[{x:1220,y:380},{x:1456,y:272}]};
export type EscortPhase='ready'|'approach'|'encounter'|'depart'|'won'|'lost';
export type EscortCommand={type:'move';position:Point}|{type:'cast';targetId:string}|{type:'rally'}|{type:'revive'};
type Brain={motion:SmoothMover;planAt:number;decideAt:number;walked:number;firstShot:number|null};
export class EscortRun {
 phase:EscortPhase='ready';battle=new RangedBattle();heroMotion=new SmoothMover(ESCORT.heroStart);
 manualHero=false;returning=false;selectedEnemyId='';heroTarget='';melee:{targetId:string;left:number}|null=null;meleeNext=0;poseAt=-10;poseUntil=0;poseTargetId='';reviveAt=-10;actionKind='';meleeHits=0;deadFor=0;revives=0;
 evadeGoal:Point|null=null;evadeAt=0;lastDanger=-10;lastTangHit=-10;dangerSince:number|null=null;evadeAnchor:Point={...ESCORT.encounter};sosUntil=0;sosNext=0;sosCount=0;rescueCalls=0;heroPlanAt=0;
 events:{time:number;kind:string;unit?:string;target?:string;amount?:number}[]=[];
 private road=new SmoothMover(ESCORT.start);private evade=new SmoothMover(ESCORT.start);private waypoints:Point[]=[];private roadIndex=0;private roadDirty=false;private brains=new Map<string,Brain>();
 constructor(public nav:Navigation=SAMPLE_NAV){}
 get finished(){return this.phase==='won'||this.phase==='lost';}get started(){return this.phase!=='ready';}
 get objective(){switch(this.phase){case 'ready':return '开始护送 · 基础护卫自动执行，破空击与复活由玩家决定';case 'approach':return '沿山路护送 · 前方两名弓箭手正在走来';case 'encounter':return this.manualHero?'悟空手动行进/驻守 · 可破空击或点击回援恢复护卫':'悟空自动护卫 · 可指定敌人破空击，或手动移动/回援';case 'depart':return '全部来敌及敌箭已处理 · 护送唐僧抵达终点';case 'won':return '护送试段成功 · 唐僧存活并已抵达终点';case 'lost':return '护送失败 · 唐僧已阵亡，可重新开始';}}
 private mover(p:Point,speed:number){return new SmoothMover({x:p.x,y:p.y},{...this.nav,speed:(x,y)=>this.nav.speed(x,y)*speed/MOVE.speed});}
 private event(kind:string,unit?:string,target?:string,amount?:number){this.events.push({time:this.battle.time,kind,unit,target,amount});if(this.events.length>400)this.events.shift();}
 start(){
  this.battle=new RangedBattle(this.nav);const b=this.battle;b.enemies=ESCORT.entrances.map((p,i)=>makeArcher(`archer-${i+1}`,p));b.archer=b.enemies[0];Object.assign(b.tang,ESCORT.start,{goal:{...ESCORT.start}});Object.assign(b.hero,ESCORT.heroStart,{hp:GUARD.hp,max:GUARD.hp});
  this.heroMotion=new SmoothMover(ESCORT.heroStart,this.nav);this.road=this.mover(ESCORT.start,ESCORT.tangSpeed);this.evade=this.mover(ESCORT.start,ESCORT.tangSpeed);this.planRoad(ESCORT.approachRoute);this.brains=new Map(b.enemies.map(a=>[a.id,{motion:this.mover(a,GUARD.enemySpeed),planAt:0,decideAt:0,walked:0,firstShot:null}]));
  this.manualHero=false;this.returning=false;this.selectedEnemyId='';this.heroTarget='';this.melee=null;this.meleeNext=0;this.poseAt=-10;this.poseUntil=0;this.poseTargetId='';this.reviveAt=-10;this.actionKind='';this.meleeHits=0;this.deadFor=0;this.revives=0;this.evadeGoal=null;this.evadeAt=0;this.lastDanger=-10;this.lastTangHit=-10;this.dangerSince=null;this.evadeAnchor={...ESCORT.start};this.sosUntil=0;this.sosNext=0;this.sosCount=0;this.rescueCalls=0;this.heroPlanAt=0;this.events=[];
  this.phase='approach';b.driver=dt=>this.drive(dt);b.onDamage=e=>this.damaged(e);b.start();this.event('warning');
 }
 command(c:EscortCommand){const b=this.battle;if(!this.started||this.finished)return false;
  if(c.type==='revive'){if(b.hero.hp>0||this.deadFor<GUARD.reviveDelay||b.energy<GUARD.reviveCost)return false;b.energy-=GUARD.reviveCost;b.hero.hp=b.hero.max;b.hero.flash=.8;this.heroMotion.reset({x:b.tang.x,y:b.tang.y});Object.assign(b.hero,this.heroMotion.position);this.deadFor=0;this.revives++;this.reviveAt=b.time;this.manualHero=false;this.heroPlanAt=0;this.melee=null;this.event('revive');return true;}
  if(b.hero.hp<=0){b.message='悟空倒地，请耗能复活';return false;}
  if(c.type==='cast'){if(!b.request(b.hero,c.targetId))return false;this.selectedEnemyId=c.targetId;this.heroMotion.route=[];this.heroMotion.speed=0;this.melee=null;this.poseAt=b.time;this.poseUntil=b.time+.45;this.actionKind='ranged';this.poseTargetId=c.targetId;this.event('cast','wukong',c.targetId);return true;}
  if(b.casting)return false;
  if(c.type==='rally'){this.manualHero=false;this.returning=true;this.heroTarget='';this.heroPlanAt=0;this.melee=null;this.heroMotion.route=[];this.rescueCalls++;this.event('rally');return true;}
  if(!this.heroMotion.command(c.position))return false;this.manualHero=true;this.returning=false;this.melee=null;this.poseUntil=0;this.event('move','wukong');return true;
 }
 private damaged(e:DamageEvent){this.event(e.kind,e.sourceId,e.targetId,e.amount);const enemy=this.battle.enemies.find(a=>a.id===e.targetId);if(enemy){const old=enemy.threat[e.sourceId],decayed=old?old.value*Math.exp(-(e.time-old.at)/GUARD.threatDecay):0;enemy.threat[e.sourceId]={value:Math.min(200,decayed+e.amount*2),at:e.time};}if(e.targetId==='tang')this.lastTangHit=e.time;}
 private planRoad(points:Point[]){this.waypoints=points.map(p=>({...p}));this.roadIndex=0;this.roadDirty=true;}
 private advanceRoad(dt:number){const t=this.battle.tang;if(this.roadIndex>=this.waypoints.length)return;const goal=this.waypoints[this.roadIndex];if(this.roadDirty||!this.road.route.length){if(distance(t,goal)<=ESCORT.arrival){this.roadIndex++;this.roadDirty=true;return;}this.road.reset({x:t.x,y:t.y});this.road.command(goal);this.roadDirty=false;}this.road.update(dt);Object.assign(t,this.road.position);t.goal={...this.road.position};}
 private plan(mover:SmoothMover,p:Point){if(distance(mover.position,p)<12)return;if(!mover.route.length||distance(mover.route[mover.route.length-1],p)>22)mover.command(p);}
 private enemies(dt:number){const b=this.battle;
  for(const a of b.enemies){if(a.hp<=0)continue;const brain=this.brains.get(a.id)!;
   if(b.time>=brain.decideAt||!b.target(a.targetId)||b.target(a.targetId)!.hp<=0){brain.decideAt=b.time+GUARD.enemyDecision;const next=chooseEnemyTarget(a,b.hero,b.tang,b.time,this.nav);if(next!==a.targetId){a.targetId=next;a.lockedUntil=b.time+GUARD.targetLock;a.windup=0;a.next=GUARD.targetDelay;this.event('target',a.id,next);}}
   const target=b.target(a.targetId),moveTarget=target??b.tang;
   if(a.stun>0){brain.motion.speed=0;continue;}
   const canShoot=!!target&&distance(a,target)<=ARCHER.range&&segmentClear(a,target,this.nav)&&b.time>=GUARD.reaction&&brain.walked>=GUARD.minApproach;
   if(!canShoot||distance(a,moveTarget)>GUARD.enemyStand&&a.windup<=0){brain.motion.position={x:a.x,y:a.y};if(b.time>=brain.planAt){brain.planAt=b.time+GUARD.enemyPlan;brain.motion.position={x:a.x,y:a.y};this.plan(brain.motion,moveTarget);}const moved=brain.motion.update(dt);brain.walked+=moved;Object.assign(a,brain.motion.position);}
   else {brain.motion.route=[];brain.motion.speed=0;}
   if(!canShoot||!target){a.windup=0;continue;}
   if(a.windup>0){a.windup-=dt;if(a.windup<=0){if(target.hp>0&&distance(a,target)<=ARCHER.range&&segmentClear(a,target,this.nav)){b.launch('arrow',a,target,ARCHER.damage,ARCHER.arrowSpeed,a.id);b.arrowsFired++;a.released=.25;brain.firstShot??=b.time;this.event('shot',a.id,target.id);}a.next=ARCHER.interval;}}
   else {a.next-=dt;if(a.next<=0)a.windup=ARCHER.windup;}
  }
 }
 private hero(dt:number){const b=this.battle,h=b.hero;
  if(h.hp<=0){this.deadFor+=dt;this.melee=null;this.heroMotion.route=[];this.heroMotion.speed=0;return;}this.deadFor=0;
  if(b.casting||b.time<this.poseUntil&&this.actionKind==='ranged')return;
  const enemies=b.enemies.filter(a=>a.hp>0),old=enemies.find(a=>a.id===this.heroTarget);
  const eligible=(a:Archer)=>distance(a,b.tang)<=GUARD.chase||a.targetId==='wukong'&&distance(a,h)<=ARCHER.range;
  let target=old&&eligible(old)?old:undefined;
  if(!target){target=enemies.filter(a=>eligible(a)&&(distance(a,h)<=GUARD.radius||a.targetId==='tang'||a.targetId==='wukong')).sort((a,c)=>(distance(h,a)-(a.targetId==='tang'?100:0))-(distance(h,c)-(c.targetId==='tang'?100:0))).find(a=>reachableNear(h,a,this.nav));this.heroTarget=target?.id??'';}
  if(!this.manualHero&&distance(h,b.tang)>GUARD.chase+GUARD.evadeLeash)this.returning=true;if(this.returning&&distance(h,b.tang)<=GUARD.returnDistance)this.returning=false;if(this.returning){target=undefined;this.heroTarget='';}
  if(this.manualHero)target=this.heroMotion.route.length?undefined:enemies.filter(a=>distance(a,h)<=GUARD.meleeRange&&segmentClear(h,a,this.nav)).sort((a,c)=>distance(a,h)-distance(c,h))[0];
  if(this.melee){this.melee.left-=dt;if(this.melee.left<=0){const victim=enemies.find(a=>a.id===this.melee!.targetId);if(victim&&distance(h,victim)<=GUARD.meleeRange&&segmentClear(h,victim,this.nav)){b.damage(victim,GUARD.meleeDamage,'wukong','melee');this.meleeHits++;}this.melee=null;}return;}
  if(target&&distance(h,target)<=GUARD.meleeRange&&segmentClear(h,target,this.nav)&&b.time>=this.meleeNext){this.heroMotion.route=[];this.heroMotion.speed=0;this.melee={targetId:target.id,left:GUARD.windup};this.meleeNext=b.time+GUARD.period;this.poseAt=b.time;this.poseUntil=b.time+GUARD.pose;this.actionKind='melee';this.poseTargetId=target.id;this.event('melee-windup','wukong',target.id);return;}
  if(!this.manualHero&&b.time>=this.heroPlanAt){this.heroPlanAt=b.time+GUARD.replan;let goal:Point;
   if(target){const d=Math.max(1,distance(target,h));goal={x:target.x+(h.x-target.x)/d*48,y:target.y+(h.y-target.y)/d*48};if(!reachableNear(h,goal,this.nav))goal={x:target.x,y:target.y};}
   else if(this.returning)goal={x:b.tang.x,y:b.tang.y};
   else {const danger=enemies.sort((a,c)=>distance(a,b.tang)-distance(c,b.tang))[0],angle=danger?Math.atan2(danger.y-b.tang.y,danger.x-b.tang.x):-.3;goal={x:b.tang.x+Math.cos(angle)*80,y:b.tang.y+Math.sin(angle)*80};if(!reachableNear(h,goal,this.nav))goal={x:b.tang.x,y:b.tang.y};}
   this.plan(this.heroMotion,goal);
  }
  this.heroMotion.update(dt);Object.assign(h,this.heroMotion.position);
 }
 private tang(dt:number){const b=this.battle,t=b.tang,enemies=b.enemies.filter(a=>a.hp>0);
  const danger=b.time-this.lastTangHit<2||enemies.some(a=>distance(a,t)<180||a.targetId==='tang'&&distance(a,t)<=ARCHER.range&&segmentClear(a,t,this.nav));
  if(danger){if(this.dangerSince===null){this.dangerSince=b.time;this.evadeAnchor={x:t.x,y:t.y};}this.lastDanger=b.time;if(this.phase==='approach')this.phase='encounter';
   if(b.time>=this.evadeAt){const goal=saferPoint(t,b.hero,enemies,this.evadeAnchor,this.nav);this.evadeAt=b.time+GUARD.evadeHold;if(goal){this.evadeGoal=goal;this.evade.reset({x:t.x,y:t.y});this.evade.command(goal);this.roadDirty=true;this.event('evade','tang');}}
   this.evade.update(dt);if(this.evadeGoal)Object.assign(t,this.evade.position);
  }else if(b.time-this.lastDanger>=GUARD.calm){this.dangerSince=null;this.evadeGoal=null;this.advanceRoad(dt);}
  else if(this.evadeGoal){this.evade.update(dt);Object.assign(t,this.evade.position);}
  if(this.dangerSince!==null&&b.time-this.dangerSince>=GUARD.sosDanger&&t.hp>0&&t.hp<=GUARD.sosHp&&(b.hero.hp<=0||distance(b.hero,t)>=GUARD.sosFar)&&b.time>=this.sosNext){this.sosUntil=b.time+GUARD.sosVisible;this.sosNext=b.time+GUARD.sosInterval;this.sosCount++;this.event('sos','tang');}
  if(!danger&&b.time-this.lastDanger>=GUARD.calm)this.sosUntil=0;
  t.goal={x:t.x,y:t.y};
 }
 private drive(dt:number){this.enemies(dt);this.hero(dt);this.tang(dt);}
 update(delta:number){if(!this.started||this.finished)return;const b=this.battle;b.update(delta);
  if(b.failed||b.tang.hp<=0){this.phase='lost';return;}
  if(b.safe&&this.phase!=='depart'&&b.time-this.lastDanger>=GUARD.calm){this.phase='depart';this.planRoad(ESCORT.departureRoute);}
  if(this.phase==='depart'&&this.roadIndex>=this.waypoints.length&&distance(b.tang,ESCORT.exit)<=ESCORT.arrival&&b.safe)this.phase='won';
 }
}
