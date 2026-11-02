import {COMBO} from './meleeCombo';import {segmentClear,distance} from './smoothMovement';import type {Archer,RangedBattle} from './rangedCombat';
export type Resistance={knockback:number;airborne:boolean;control:number};
export const LIGHT_RESISTANCE:Resistance={knockback:1,airborne:true,control:1};
export const HEAVY_RESISTANCE:Resistance={knockback:.25,airborne:false,control:.5}; // interface only; no new enemy spawned
export type ControlState={phase:'none'|'hurt'|'airborne'|'down'|'rising'|'dead';age:number;height:number;vx:number;vy:number;remaining:number;hurtAt:number;hurtDuration:number;lightUntil:number;heavyUntil:number;immuneUntil:number;resistance:Resistance};
export class EnemyControl {
 states=new Map<string,ControlState>();
 constructor(public battle:RangedBattle){}
 get(id:string){let s=this.states.get(id);if(!s){s={phase:'none',age:0,height:0,vx:0,vy:0,remaining:0,hurtAt:-10,hurtDuration:.12,lightUntil:0,heavyUntil:0,immuneUntil:0,resistance:{...LIGHT_RESISTANCE}};this.states.set(id,s);}return s;}
 blocked(id:string){const p=this.get(id).phase;return p==='hurt'||p==='airborne'||p==='down'||p==='rising';}
 /** Translate ground position in small validated steps; no return teleport on obstruction. */
 private move(a:Archer,s:ControlState,amount:number){for(let left=amount;left>1e-7;){const n=Math.min(2,left);left-=n;const p={x:a.x+s.vx*n,y:a.y+s.vy*n};if(!segmentClear(a,p,this.battle.nav)||this.battle.canOccupy&&!this.battle.canOccupy(a,p)){s.remaining=0;return;}Object.assign(a,p);s.remaining=Math.max(0,s.remaining-n);}}
 hurt(a:Archer){const s=this.get(a.id);s.hurtAt=this.battle.time;if(a.hp<=0&&s.phase!=='airborne'){s.phase='dead';s.height=0;a.reservedLanding=false;}}
 impact(a:Archer,origin:{x:number;y:number},step:number){const s=this.get(a.id),now=this.battle.time,heavy=step===2,cfg=COMBO.steps[step];s.hurtAt=now;if(s.phase==='airborne')return a.hp<=0?'dead-in-air':'resisted';const d=Math.max(1,distance(origin,a));s.vx=(a.x-origin.x)/d;s.vy=(a.y-origin.y)/d;
  // Reactions cannot repeatedly renew the control timers. Damage still applies under poise.
  const permitted=now>=s.immuneUntil&&now>=(heavy?s.heavyUntil:s.lightUntil);const push=cfg.knockback*s.resistance.knockback;
  if(heavy&&permitted&&s.resistance.airborne){s.phase='airborne';a.reservedLanding=true;s.age=0;s.height=0;s.remaining=push;s.heavyUntil=now+COMBO.heavyImmunity;s.immuneUntil=now+COMBO.airTime+COMBO.downTime+COMBO.riseTime+COMBO.counterGrace;a.windup=0;a.next=Math.max(a.next,.25);return 'launch';}
  this.move(a,s,push);
  if(a.hp<=0){s.phase='dead';return 'dead';}
  if(permitted&&a.windup>=COMBO.interruptMinRemaining){a.windup=0;a.next=.25;s.phase='hurt';s.age=0;s.hurtDuration=cfg.flinch*s.resistance.control;s.lightUntil=now+COMBO.lightImmunity;s.remaining=0;return 'interrupt';}
  return 'resisted';
 }
 update(dt:number){for(const a of this.battle.enemies){const s=this.get(a.id);if(s.phase==='airborne'){s.age=Math.min(COMBO.airTime,s.age+dt);this.move(a,s,Math.min(s.remaining,26*s.resistance.knockback/COMBO.airTime*dt));s.height=Math.sin(Math.PI*s.age/COMBO.airTime)*COMBO.airHeight*s.resistance.control;if(s.age>=COMBO.airTime){s.height=0;a.reservedLanding=false;s.phase=a.hp<=0?'dead':'down';s.age=0;}}
   else if(a.hp<=0){s.phase='dead';s.height=0;a.reservedLanding=false;}
   else if(s.phase==='hurt'||s.phase==='down'||s.phase==='rising'){s.age+=dt;const duration=s.phase==='hurt'?s.hurtDuration:s.phase==='down'?COMBO.downTime:COMBO.riseTime;if(s.age>=duration){s.phase=s.phase==='down'?'rising':'none';s.age=0;}}
  }}
}
