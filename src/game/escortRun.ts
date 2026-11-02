import {COMBO,MeleeCombo} from './meleeCombo';
import {EnemyControl} from './enemyControl';
import {EscortFormation,FORMATION,firingSpacing} from './escortFormation';
import {UnitSpace} from './unitSpace';
import {RangedBattle,makeArcher,ARCHER,RANGED,type Archer,type DamageEvent} from './rangedCombat';
import {SmoothMover,SAMPLE_NAV,MOVE,distance,segmentClear,type Navigation} from './smoothMovement';
import {SAMPLE_MAP,ROAD} from './sampleMap';
import {GUARD,chooseEnemyTarget,saferPoint,reachableNear} from './guardRules';
import type {Point} from './world';
export const ESCORT={start:{...SAMPLE_MAP.start},encounter:{x:750,y:540},exit:{...SAMPLE_MAP.destination},heroStart:{x:344,y:708},guard:{x:850,y:540},tangSpeed:70,arrival:2,approachRoute:[ROAD[2],ROAD[3],{x:750,y:540}],departureRoute:[ROAD[4],ROAD[5],ROAD[6],ROAD[7],ROAD[8],SAMPLE_MAP.destination],entrances:[{x:1220,y:380},{x:1456,y:272}]};
export type EscortPhase='ready'|'approach'|'encounter'|'depart'|'won'|'lost';
export type EscortCommand={type:'move';position:Point}|{type:'cast';targetId:string}|{type:'rally'}|{type:'revive'};
type Brain={motion:SmoothMover;planAt:number;decideAt:number;walked:number;firstShot:number|null;spacingAt?:number;spacingGoal?:Point;spacingUntil?:number};
export class EscortRun {
 phase:EscortPhase='ready';battle=new RangedBattle();heroMotion=new SmoothMover(ESCORT.heroStart);
 manualHero=false;returning=false;selectedEnemyId='';heroTarget='';melee:{targetId:string;left:number;step:number}|null=null;meleeNext=0;poseAt=-10;poseUntil=0;poseTargetId='';reviveAt=-10;actionKind='';meleeHits=0;deadFor=0;revives=0;
 evadeGoal:Point|null=null;evadeAt=0;lastDanger=-10;lastTangHit=-10;dangerSince:number|null=null;evadeAnchor:Point={...ESCORT.encounter};sosUntil=0;sosNext=0;sosCount=0;rescueCalls=0;heroPlanAt=0;
 threatEndedAt:number|null=null;dangerSeconds=0;eventSequence=0;
 events:{sequence:number;time:number;kind:string;unit?:string;target?:string;amount?:number;step?:number;x?:number;y?:number}[]=[];
 private road=new SmoothMover(ESCORT.start);private evade=new SmoothMover(ESCORT.start);private waypoints:Point[]=[];private roadIndex=0;private roadDirty=false;private brains=new Map<string,Brain>();
 formation=new EscortFormation();space:UnitSpace;combo=new MeleeCombo();controls=new EnemyControl(this.battle);attackStep=0;poseFacingLeft=false;
 constructor(public nav:Navigation=SAMPLE_NAV){this.space=new UnitSpace(()=>[this.battle.hero,this.battle.tang,...this.battle.enemies],nav);}
 get finished(){return this.phase==='won'||this.phase==='lost';}get started(){return this.phase!=='ready';}
 get objective(){switch(this.phase){case 'ready':return '开始护送 · 基础护卫自动执行，破空击与复活由玩家决定';case 'approach':return '沿山路护送 · 前方两名弓箭手正在走来';case 'encounter':return this.manualHero?'悟空手动行进/驻守 · 可破空击或点击回援恢复护卫':'悟空自动护卫 · 可指定敌人破空击，或手动移动/回援';case 'depart':return '全部来敌及敌箭已处理 · 护送唐僧抵达终点';case 'won':return '护送试段成功 · 唐僧存活并已抵达终点';case 'lost':return '护送失败 · 唐僧已阵亡，可重新开始';}}
 private mover(p:Point,speed:number){return new SmoothMover({x:p.x,y:p.y},{...this.nav,speed:(x,y)=>this.nav.speed(x,y)*speed/MOVE.speed});}
 private event(kind:string,unit?:string,target?:string,amount?:number){this.events.push({sequence:++this.eventSequence,time:this.battle.time,kind,unit,target,amount});if(this.events.length>400)this.events.shift();}
 start(){
  this.battle=new RangedBattle(this.nav);this.controls=new EnemyControl(this.battle);this.combo.reset('new-run');this.attackStep=0;this.poseFacingLeft=false;const b=this.battle;b.enemies=ESCORT.entrances.map((p,i)=>makeArcher(`archer-${i+1}`,p));for(const a of b.enemies)a.windupDuration=GUARD.archerWindup;b.archer=b.enemies[0];Object.assign(b.tang,ESCORT.start,{goal:{...ESCORT.start}});Object.assign(b.hero,ESCORT.heroStart,{hp:GUARD.hp,max:GUARD.hp});
  this.heroMotion=new SmoothMover(ESCORT.heroStart,this.nav);this.road=this.mover(ESCORT.start,ESCORT.tangSpeed);this.evade=this.mover(ESCORT.start,ESCORT.tangSpeed);this.planRoad(ESCORT.approachRoute);this.brains=new Map(b.enemies.map(a=>[a.id,{motion:this.mover(a,GUARD.enemySpeed),planAt:0,decideAt:0,walked:0,firstShot:null}]));
  this.manualHero=false;this.returning=false;this.selectedEnemyId='';this.heroTarget='';this.melee=null;this.meleeNext=0;this.poseAt=-10;this.poseUntil=0;this.poseTargetId='';this.reviveAt=-10;this.actionKind='';this.meleeHits=0;this.deadFor=0;this.revives=0;this.evadeGoal=null;this.evadeAt=0;this.lastDanger=-10;this.lastTangHit=-10;this.dangerSince=null;this.evadeAnchor={...ESCORT.start};this.sosUntil=0;this.sosNext=0;this.sosCount=0;this.rescueCalls=0;this.heroPlanAt=0;this.events=[];this.eventSequence=0;this.threatEndedAt=null;this.dangerSeconds=0;
  this.space.clear();this.formation.reset();this.combo.reset('retry');this.attackStep=0;this.controls=new EnemyControl(this.battle);b.canOccupy=(u,p)=>this.space.free(p,u.id)&&this.space.canTraverse(u.id,u,p);this.phase='approach';b.driver=dt=>this.drive(dt);b.onDamage=e=>this.damaged(e);b.start();this.event('warning');
 }
 command(c:EscortCommand){const b=this.battle;if(!this.started||this.finished)return false;
  if(c.type==='revive'){if(b.hero.hp>0||this.deadFor<GUARD.reviveDelay||b.energy<GUARD.reviveCost)return false;const enemies=b.enemies.filter(a=>a.hp>0),nearest=enemies.sort((a,c)=>distance(a,b.tang)-distance(c,b.tang))[0],away=nearest?{x:b.tang.x+(b.tang.x-nearest.x),y:b.tang.y+(b.tang.y-nearest.y)}:{x:b.tang.x-50,y:b.tang.y};this.space.slots.delete('wukong');const spawn=this.space.endpoint('wukong',b.tang,away,[48,66,86],'revive');if(!spawn){b.message='附近暂无安全空位，请稍后复活';return false;}b.energy-=GUARD.reviveCost;b.hero.hp=b.hero.max;b.hero.flash=.8;this.heroMotion.reset(spawn);Object.assign(b.hero,this.heroMotion.position);this.deadFor=0;this.revives++;this.reviveAt=b.time;this.manualHero=false;this.heroPlanAt=0;this.melee=null;this.event('revive');return true;}
  if(b.hero.hp<=0){b.message='悟空倒地，请耗能复活';return false;}
  if(c.type==='cast'){if(!b.request(b.hero,c.targetId))return false;this.combo.reset('ranged-command');this.selectedEnemyId=c.targetId;this.heroMotion.route=[];this.heroMotion.speed=0;this.melee=null;this.poseAt=b.time;this.poseUntil=b.time+.45;this.actionKind='ranged';this.poseTargetId=c.targetId;this.poseFacingLeft=b.enemies.find(a=>a.id===c.targetId)!.x<b.hero.x;this.event('cast','wukong',c.targetId);return true;}
  if(b.casting)return false;
  if(c.type==='rally'){this.combo.reset('rally');this.space.yielding.delete('wukong');this.manualHero=false;this.returning=true;this.heroTarget='';this.heroPlanAt=0;this.melee=null;this.heroMotion.route=[];this.rescueCalls++;this.event('rally');return true;}
  this.space.yielding.delete('wukong');this.space.slots.delete('wukong');const goal=this.space.free(c.position,'wukong')&&this.space.friendClear(c.position,'wukong')?c.position:this.space.endpoint('wukong',c.position,this.battle.hero,[44,62],'manual');if(!goal||!this.space.command('wukong',this.heroMotion,goal))return false;this.combo.reset('move-command');this.manualHero=true;this.returning=false;this.melee=null;this.poseUntil=0;this.event('move','wukong');return true;
 }
 private damaged(e:DamageEvent){this.event(e.kind,e.sourceId,e.targetId,e.amount);if(e.kind==='melee')this.events.at(-1)!.step=this.melee?.step;const victim=this.battle.target(e.targetId);if(victim)Object.assign(this.events.at(-1)!,{x:victim.x,y:victim.y});const enemy=this.battle.enemies.find(a=>a.id===e.targetId);if(enemy){this.controls.hurt(enemy);const old=enemy.threat[e.sourceId],decayed=old?old.value*Math.exp(-(e.time-old.at)/GUARD.threatDecay):0;enemy.threat[e.sourceId]={value:Math.min(200,decayed+e.amount*2),at:e.time};}if(e.targetId==='tang')this.lastTangHit=e.time;}
 private stepTang(m:SmoothMover,dt:number){const h=this.battle.hero,t=this.battle.tang,next=m.route[0],ahead=this.heroMotion.route[0];if(next&&h.hp>0&&!this.melee&&!this.battle.casting&&this.battle.time>=this.poseUntil&&(distance(h,t)<60||!!ahead&&distance(h,t)<85&&((ahead.x-h.x)*(next.x-t.x)+(ahead.y-h.y)*(next.y-t.y))<0)&&((next.x-t.x)*(h.x-t.x)+(next.y-t.y)*(h.y-t.y))>0)this.space.yieldTo('wukong',this.heroMotion,t,next);const amount=this.space.step('tang',m,dt);if(amount<.01&&m.route.length&&!this.battle.casting&&!this.melee&&this.battle.time>=this.poseUntil)this.space.yieldTo('wukong',this.heroMotion,this.battle.tang,m.route[0]);return amount;}
 private planRoad(points:Point[]){this.waypoints=points.map(p=>({...p}));this.roadIndex=0;this.roadDirty=true;}
 private advanceRoad(dt:number){const t=this.battle.tang;if(this.roadIndex>=this.waypoints.length)return;const goal=this.waypoints[this.roadIndex];if(this.roadDirty||!this.road.route.length){if(distance(t,goal)<=ESCORT.arrival){this.roadIndex++;this.roadDirty=true;return;}this.road.reset({x:t.x,y:t.y});this.road.command(goal);this.roadDirty=false;}this.stepTang(this.road,dt);Object.assign(t,this.road.position);t.goal={...this.road.position};}
 private plan(mover:SmoothMover,p:Point,id='wukong',precision=12){if(distance(mover.position,p)<precision)return;if(!mover.route.length||distance(mover.route[mover.route.length-1],p)>(precision<12?6:22))this.space.command(id,mover,p);}
 private enemies(dt:number){const b=this.battle;
  for(const a of b.enemies){if(a.hp<=0)continue;const brain=this.brains.get(a.id)!;
   if(b.time>=brain.decideAt||!b.target(a.targetId)||b.target(a.targetId)!.hp<=0){brain.decideAt=b.time+GUARD.enemyDecision;const next=chooseEnemyTarget(a,b.hero,b.tang,b.time,this.nav);if(next!==a.targetId){a.targetId=next;a.lockedUntil=b.time+GUARD.targetLock;a.windup=0;a.next=GUARD.targetDelay;this.event('target',a.id,next);}}
   const target=b.target(a.targetId),moveTarget=target??b.tang;
   if(a.stun>0||this.controls.blocked(a.id)){brain.motion.speed=0;continue;}
   // Only the later claimant adjusts its firing angle; never cancel an active draw.
   if(target&&a.windup<=0&&!brain.spacingGoal&&b.time>=(brain.spacingAt??0)&&b.enemies.some(other=>other.id<a.id&&other.hp>0&&Math.abs(other.x-a.x)<56&&Math.abs(other.y-a.y)<80)){
    brain.spacingAt=b.time+4;const other=b.enemies.find(o=>o.id<a.id&&o.hp>0&&Math.abs(o.x-a.x)<56&&Math.abs(o.y-a.y)<80)!,goal=firingSpacing(a,other,this.space);
    if(goal&&distance(a,goal)>8&&this.space.command(a.id,brain.motion,goal)){brain.spacingGoal=goal;brain.spacingUntil=b.time+1.8;}
   }
   if(brain.spacingGoal){brain.motion.position={x:a.x,y:a.y};brain.walked+=this.space.step(a.id,brain.motion,dt);Object.assign(a,brain.motion.position);if(distance(a,brain.spacingGoal)<3||!brain.motion.route.length||b.time>=(brain.spacingUntil??0))brain.spacingGoal=undefined;else continue;}
   const canShoot=!!target&&distance(a,target)<=ARCHER.range&&segmentClear(a,target,this.nav)&&b.time>=GUARD.reaction&&brain.walked>=GUARD.minApproach;
   if(!canShoot||distance(a,moveTarget)>GUARD.enemyStand&&a.windup<=0){brain.motion.position={x:a.x,y:a.y};if(b.time>=brain.planAt){brain.planAt=b.time+GUARD.enemyPlan;brain.motion.position={x:a.x,y:a.y};this.plan(brain.motion,moveTarget,a.id);}const moved=this.space.step(a.id,brain.motion,dt);brain.walked+=moved;Object.assign(a,brain.motion.position);}
   else {brain.motion.route=[];brain.motion.speed=0;}
   if(!canShoot||!target){a.windup=0;continue;}
   if(a.windup>0){a.windup-=dt;if(a.windup<=0){if(target.hp>0&&distance(a,target)<=ARCHER.range&&segmentClear(a,target,this.nav)){b.launch('arrow',a,target,ARCHER.damage,ARCHER.arrowSpeed,a.id);b.arrowsFired++;a.released=.25;brain.firstShot??=b.time;this.event('shot',a.id,target.id);}a.next=ARCHER.interval;}}
   else {a.next-=dt;if(a.next<=0){a.windup=a.windupDuration;this.event('aim',a.id,target.id);}}
  }
 }
 private hero(dt:number){const b=this.battle,h=b.hero;
  if(h.hp<=0){this.combo.reset('death');this.deadFor+=dt;this.melee=null;this.heroMotion.route=[];this.heroMotion.speed=0;return;}this.deadFor=0;
  if(this.space.yielding.has('wukong')&&!b.casting&&!this.melee&&b.time>=this.poseUntil){this.space.step('wukong',this.heroMotion,dt);Object.assign(h,this.heroMotion.position);return;}
  if((h.controlledUntil??0)>b.time){this.combo.reset('controlled');this.melee=null;this.poseUntil=0;this.heroMotion.speed=0;return;}
  if(b.time<this.poseUntil&&this.actionKind==='melee'&&!this.melee){this.heroMotion.speed=0;return;}
  if(b.casting||b.time<this.poseUntil&&this.actionKind==='ranged')return;
  const enemies=b.enemies.filter(a=>a.hp>0),old=enemies.find(a=>a.id===this.heroTarget);
  const eligible=(a:Archer)=>distance(a,b.tang)<=GUARD.chase||a.targetId==='wukong'&&distance(a,h)<=ARCHER.range;
  let target=old&&eligible(old)?old:undefined;
  if(!target){target=enemies.filter(a=>eligible(a)&&(distance(a,h)<=GUARD.radius||a.targetId==='tang'||a.targetId==='wukong')).sort((a,c)=>(distance(h,a)-(a.targetId==='tang'?100:0))-(distance(h,c)-(c.targetId==='tang'?100:0))).find(a=>reachableNear(h,a,this.nav));this.heroTarget=target?.id??'';}
  if(!this.manualHero&&distance(h,b.tang)>GUARD.chase+GUARD.evadeLeash)this.returning=true;if(this.returning&&distance(h,b.tang)<=GUARD.returnDistance)this.returning=false;if(this.returning){target=undefined;this.heroTarget='';}
  if(this.manualHero)target=this.heroMotion.route.length?undefined:enemies.filter(a=>distance(a,h)<=GUARD.meleeRange&&segmentClear(h,a,this.nav)).sort((a,c)=>distance(a,h)-distance(c,h))[0];
  if(this.melee){this.melee.left-=dt;if(this.melee.left<=0){const victim=enemies.find(a=>a.id===this.melee!.targetId);if(victim&&(victim.x-h.x)*(this.poseFacingLeft?-1:1)>=-12&&this.controls.get(victim.id).height<=12&&distance(h,victim)<=GUARD.meleeRange&&segmentClear(h,victim,this.nav)){const step=this.melee.step;b.damage(victim,COMBO.steps[step].damage,'wukong','melee');this.meleeHits++;this.combo.hit(victim.id,b.time,step);const outcome=this.controls.impact(victim,h,step);this.event(outcome==='launch'?'launch':outcome==='interrupt'?'melee-interrupt':'melee-contact','wukong',victim.id);this.events.at(-1)!.step=step;if(victim.hp<=0)this.combo.reset('target-dead');}else{this.event('melee-miss','wukong',this.melee.targetId);this.combo.reset('miss');}this.melee=null;}return;}
  if(target&&this.controls.get(target.id).height<=12&&distance(h,target)<=GUARD.meleeRange&&segmentClear(h,target,this.nav)&&b.time>=this.meleeNext){this.heroMotion.route=[];this.heroMotion.speed=0;this.attackStep=this.combo.next(target.id,b.time);const cfg=COMBO.steps[this.attackStep];this.melee={targetId:target.id,left:cfg.windup,step:this.attackStep};this.meleeNext=b.time+cfg.period;this.poseAt=b.time;this.poseUntil=b.time+cfg.pose;this.actionKind='melee';this.poseTargetId=target.id;this.poseFacingLeft=target.x<h.x;this.event('melee-windup','wukong',target.id);this.events.at(-1)!.step=this.attackStep;return;}
  if(!this.manualHero&&b.time>=this.heroPlanAt){this.heroPlanAt=b.time+GUARD.replan;let goal:Point;
   if(target){const dx=h.x-target.x,dy=h.y-target.y,d=Math.max(1,distance(h,target)),sx=Math.abs(dx/d*54)<46?(dx<0?-46:46):dx/d*54,sy=Math.sign(dy)*Math.sqrt(54*54-sx*sx);const slot=this.space.endpoint('wukong',target,{x:target.x+sx,y:target.y+sy},[54,56],'melee-'+target.id);if(!slot)return;goal=slot;}
   else if(this.returning){const slot=this.space.endpoint('wukong',b.tang,h,[54,74],'rally');if(!slot)return;goal=slot;}
   else {const next=this.waypoints[this.roadIndex]??ESCORT.exit,heading={x:next.x-b.tang.x,y:next.y-b.tang.y};const slot=b.safe&&distance(b.tang,ESCORT.exit)<FORMATION.exitLead?this.formation.finish(ESCORT.exit,this.space,this.nav):this.formation.follow(b.tang,heading,this.space,this.nav);if(!slot)return;goal=slot;}
   this.plan(this.heroMotion,goal,'wukong',target?1.5:12);
  }
  this.space.step('wukong',this.heroMotion,dt);Object.assign(h,this.heroMotion.position);
 }
 private tang(dt:number){const b=this.battle,t=b.tang,enemies=b.enemies.filter(a=>a.hp>0);
  const danger=b.time-this.lastTangHit<2||enemies.some(a=>distance(a,t)<180||a.targetId==='tang'&&distance(a,t)<=ARCHER.range&&segmentClear(a,t,this.nav));
  if(danger){this.dangerSeconds+=dt;if(this.dangerSince===null){this.dangerSince=b.time;this.evadeAnchor={x:t.x,y:t.y};}this.lastDanger=b.time;if(this.phase==='approach')this.phase='encounter';
   if(b.time>=this.evadeAt){const goal=saferPoint(t,b.hero,enemies,this.evadeAnchor,this.nav,p=>this.space.free(p,'tang',true)&&this.space.friendClear(p,'tang'));this.evadeAt=b.time+GUARD.evadeHold;if(goal){this.evadeGoal=goal;this.evade.reset({x:t.x,y:t.y});this.space.command('tang',this.evade,goal);this.roadDirty=true;this.event('evade','tang');}}
   this.stepTang(this.evade,dt);if(this.evadeGoal)Object.assign(t,this.evade.position);
  }else if(b.time-this.lastDanger>=GUARD.calm){this.dangerSince=null;this.evadeGoal=null;this.advanceRoad(dt);}
  else if(this.evadeGoal){this.stepTang(this.evade,dt);Object.assign(t,this.evade.position);}
  if(this.dangerSince!==null&&b.time-this.dangerSince>=GUARD.sosDanger&&t.hp>0&&t.hp<=GUARD.sosHp&&(b.hero.hp<=0||distance(b.hero,t)>=GUARD.sosFar)&&b.time>=this.sosNext){this.sosUntil=b.time+GUARD.sosVisible;this.sosNext=b.time+GUARD.sosInterval;this.sosCount++;this.event('sos','tang');}
  if(!danger&&b.time-this.lastDanger>=GUARD.calm)this.sosUntil=0;
  t.goal={x:t.x,y:t.y};
 }
 private drive(dt:number){this.controls.update(dt);this.enemies(dt);this.hero(dt);this.tang(dt);}
 update(delta:number){if(!this.started||this.finished)return;const b=this.battle;b.update(delta);this.combo.expire(b.time);
  if(b.safe&&this.threatEndedAt===null)this.threatEndedAt=b.time;
  if(b.failed||b.tang.hp<=0){this.phase='lost';this.melee=null;this.combo.reset('result');this.poseUntil=0;return;}
  if(b.safe&&this.phase!=='depart'&&b.time-this.lastDanger>=GUARD.calm){this.phase='depart';this.planRoad(ESCORT.departureRoute);}
  if(this.phase==='depart'&&this.roadIndex>=this.waypoints.length&&distance(b.tang,ESCORT.exit)<=ESCORT.arrival&&b.safe)this.phase='won';
 }
}
