import {RangedBattle,THREAT} from './rangedCombat';
import {SmoothMover,SAMPLE_NAV,MOVE,distance} from './smoothMovement';
import {SAMPLE_MAP,ROAD} from './sampleMap';
import type {Point} from './world';

// A short encounter on the existing map, not the full White Bone Ridge level.
export const ESCORT={start:{...SAMPLE_MAP.start},encounter:{...THREAT.tang},exit:{...SAMPLE_MAP.destination},heroStart:{x:300,y:660},guard:{x:850,y:540},tangSpeed:70,arrival:2,approachRoute:[ROAD[2],ROAD[3],THREAT.tang],departureRoute:[ROAD[4],ROAD[5],ROAD[6],ROAD[7],ROAD[8],SAMPLE_MAP.destination]};
export type EscortPhase='ready'|'approach'|'encounter'|'depart'|'won'|'lost';
export class EscortRun {
 phase:EscortPhase='ready';battle=new RangedBattle();
 private mover=this.createMover();private remainingLegs:Point[]=[];
 private createMover(){return new SmoothMover(ESCORT.start,{...SAMPLE_NAV,speed:(x,y)=>SAMPLE_NAV.speed(x,y)*ESCORT.tangSpeed/MOVE.speed});}
 get finished(){return this.phase==='won'||this.phase==='lost';}
 get started(){return this.phase!=='ready';}
 get objective(){switch(this.phase){
  case 'ready':return '开始护送，陪同唐僧穿过梯田山路';
  case 'approach':return '护送唐僧前往山路前方 · 悟空可点地面自由绕行';
  case 'encounter':return '保护唐僧 · 选悟空→破空击→点击白骨弓箭手';
  case 'depart':return '弓箭手已被击败 · 护送唐僧抵达山路终点';
  case 'won':return '护送试段成功 · 唐僧存活、威胁解除并已抵达终点';
  case 'lost':return '护送失败 · 唐僧已阵亡，可重新开始';
 }}
 start(){
  // Replace every piece of per-run combat state, including in-flight shots/casts.
  this.battle=new RangedBattle();this.mover=this.createMover();
  Object.assign(this.battle.tang,ESCORT.start,{goal:{...ESCORT.start}});
  this.plan(ESCORT.approachRoute);
  this.phase='approach';
 }
 private plan(points:Point[]){this.remainingLegs=points.map(p=>({...p}));this.nextLeg();}
 private nextLeg(){const goal=this.remainingLegs.shift();if(goal&&!this.mover.command(goal))throw new Error('护送道路节点无有效路线');}
 private moveTang(dt:number){if(!this.mover.route.length&&this.remainingLegs.length)this.nextLeg();this.mover.update(dt);Object.assign(this.battle.tang,this.mover.position);this.battle.tang.goal={...this.mover.position};}
 update(delta:number){
  if(!this.started||this.finished)return;const dt=Math.min(delta,.1),b=this.battle;
  if(b.tang.hp<=0||b.failed){this.phase='lost';return;}
  if(this.phase==='approach'){
   this.moveTang(dt);
   if(!this.remainingLegs.length&&!this.mover.route.length&&distance(b.tang,ESCORT.encounter)<=ESCORT.arrival){b.start();this.phase='encounter';}
  }else if(this.phase==='encounter'){
   // Existing evasion, arrows, damage, skill resources and interrupts are unchanged.
   b.update(dt);
   if(b.failed||b.tang.hp<=0){this.phase='lost';return;}
   if(b.safe){this.mover.reset(b.tang);this.plan(ESCORT.departureRoute);this.phase='depart';}
  }else if(this.phase==='depart'){
   // No remaining arrows: keep normal resource recovery while the route owns position.
   b.tang.goal={x:b.tang.x,y:b.tang.y};b.update(dt);this.moveTang(dt);
   if(b.failed||b.tang.hp<=0)this.phase='lost';
   else if(!this.remainingLegs.length&&!this.mover.route.length&&distance(b.tang,ESCORT.exit)<=ESCORT.arrival&&b.safe)this.phase='won';
  }
 }
}
