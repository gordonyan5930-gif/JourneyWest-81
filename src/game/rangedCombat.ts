import type {Point} from './world';
import {distance,segmentClear,SAMPLE_NAV,type Navigation} from './smoothMovement';
export const RANGED={range:420,cooldown:3.5,energyCost:25,energyMax:100,energyRegen:3,damage:55,windup:.3,projectileSpeed:850,hitRadius:20,interrupt:1.5,knockback:10};
export const ARCHER={hp:100,range:560,damage:20,windup:1.6,interval:1.1,arrowSpeed:420};
export const THREAT={hero:{x:600,y:550},tang:{x:750,y:540},archer:{x:950,y:525}};
export type Fighter=Point&{id:string;hp:number;max:number;flash:number};
export type Archer=Fighter&{windup:number;next:number;stun:number;released:number;targetId:string;lockedUntil:number;threat:Record<string,{value:number;at:number}>};
export const makeArcher=(id:string,p:Point):Archer=>({...p,id,hp:ARCHER.hp,max:ARCHER.hp,windup:0,next:.4,stun:0,flash:0,released:0,targetId:'',lockedUntil:0,threat:{}});
export type Shot={id:number;kind:'staff'|'arrow';position:Point;aim:Point;origin:Point;damage:number;speed:number;targetId:string;sourceId:string};
export type DamageEvent={sourceId:string;targetId:string;amount:number;kind:'staff'|'arrow'|'melee';time:number};
export class RangedBattle {
 active=false;failed=false;time=0;energy=RANGED.energyMax;cooldown=0;cast:{left:number;origin:Point;targetId:string}|null=null;shots:Shot[]=[];sequence=0;hits=0;interrupts=0;arrowsFired=0;message='威胁场景未启动';
 tang={...THREAT.tang,id:'tang',hp:100,max:100,flash:0,goal:{...THREAT.tang}};
 hero:Fighter={...THREAT.hero,id:'wukong',hp:180,max:180,flash:0};
 archer=makeArcher('archer-1',THREAT.archer);enemies:Archer[]=[this.archer];
 canOccupy?: (unit:Fighter,p:Point)=>boolean;driver?: (dt:number)=>void;onDamage?: (event:DamageEvent)=>void;
 constructor(public nav:Navigation=SAMPLE_NAV){}
 start(){this.active=true;this.message='弓箭手正在威胁唐僧 · 选悟空→破空击→点弓箭手';}
 get casting(){return !!this.cast;}
 get safe(){return this.enemies.every(a=>a.hp<=0)&&this.tang.hp>0&&!this.shots.some(s=>s.kind==='arrow');}
 target(id:string):Fighter|undefined{return id==='tang'?this.tang:id==='wukong'?this.hero:this.enemies.find(a=>a.id===id);}
 request(hero:Point,targetId:string){
  const target=this.enemies.find(a=>a.id===targetId);let reason='';
  if(!this.active||this.failed)reason='请先启动威胁场景';else if(this.hero.hp<=0)reason='悟空倒地，请耗能复活';else if(!target||target.hp<=0)reason='请选择存活的白骨弓箭手';else if(this.cast)reason='正在蓄势';else if(this.cooldown>0)reason='技能冷却中';else if(this.energy<RANGED.energyCost)reason='能量不足';else if(distance(hero,target)>RANGED.range)reason='目标超出射程';else if(!segmentClear(hero,target,this.nav))reason='地形遮挡，无法命中';
  if(reason){this.message=reason;return false;}this.energy-=RANGED.energyCost;this.cooldown=RANGED.cooldown;this.cast={left:RANGED.windup,origin:{x:hero.x,y:hero.y},targetId};this.message='如意金箍·破空击 · 蓄势';return true;
 }
 damage(victim:Fighter,amount:number,sourceId:string,kind:DamageEvent['kind']){if(victim.hp<=0)return;const actual=Math.min(victim.hp,amount);victim.hp-=actual;victim.flash=.3;this.onDamage?.({sourceId,targetId:victim.id,amount:actual,kind,time:this.time});}
 launch(kind:Shot['kind'],origin:Point,aim:Fighter,damage:number,speed:number,sourceId:string){this.shots.push({id:++this.sequence,kind,origin:{x:origin.x,y:origin.y},position:{x:origin.x,y:origin.y},aim:{x:aim.x,y:aim.y},damage,speed,targetId:aim.id,sourceId});}
 private legacyAI(dt:number){const a=this.archer;
  if(a.hp>0&&a.stun<=0){if(a.windup>0){a.windup-=dt;if(a.windup<=0){if(distance(a,this.tang)<=ARCHER.range&&segmentClear(a,this.tang,this.nav)){this.launch('arrow',a,this.tang,ARCHER.damage,ARCHER.arrowSpeed,a.id);this.arrowsFired++;a.released=.25;}a.next=ARCHER.interval;}}else{a.next-=dt;if(a.next<=0){a.windup=ARCHER.windup;const offset=Math.floor(this.time)%2?12:-12,candidate={x:THREAT.tang.x,y:THREAT.tang.y+offset};if(segmentClear(this.tang,candidate,this.nav))this.tang.goal=candidate;}}}
  const td=distance(this.tang,this.tang.goal),ts=Math.min(td,35*dt);if(td>.001){const next={x:this.tang.x+(this.tang.goal.x-this.tang.x)/td*ts,y:this.tang.y+(this.tang.goal.y-this.tang.y)/td*ts};if(segmentClear(this.tang,next,this.nav))Object.assign(this.tang,next);}
 }
 update(delta:number){if(!this.active||this.failed)return;const dt=Math.min(delta,.1);this.time+=dt;this.cooldown=Math.max(0,this.cooldown-dt);this.energy=Math.min(RANGED.energyMax,this.energy+RANGED.energyRegen*dt);
  for(const a of this.enemies){a.flash=Math.max(0,a.flash-dt);a.released=Math.max(0,a.released-dt);a.stun=Math.max(0,a.stun-dt);}for(const u of [this.tang,this.hero])u.flash=Math.max(0,u.flash-dt);
  if(this.cast){this.cast.left-=dt;if(this.cast.left<=0){const a=this.enemies.find(a=>a.id===this.cast!.targetId);if(a&&a.hp>0&&this.hero.hp>0&&segmentClear(this.cast.origin,a,this.nav))this.launch('staff',this.cast.origin,a,RANGED.damage,RANGED.projectileSpeed,'wukong');else this.message='目标失效或出手时被地形阻挡';this.cast=null;}}
  if(this.driver)this.driver(dt);else this.legacyAI(dt);
  const alive:Shot[]=[];for(const shot of this.shots){const d=distance(shot.position,shot.aim),step=Math.min(d,shot.speed*dt),next=d?{x:shot.position.x+(shot.aim.x-shot.position.x)/d*step,y:shot.position.y+(shot.aim.y-shot.position.y)/d*step}:{...shot.aim};
   if(!segmentClear(shot.position,next,this.nav)){this.message='飞行被地形截断';continue;}shot.position=next;
   if(d<=step+RANGED.hitRadius){const victim=this.target(shot.targetId);if(victim&&victim.hp>0&&distance(next,victim)<=RANGED.hitRadius){this.damage(victim,shot.damage,shot.sourceId,shot.kind);if(shot.kind==='staff'){const a=victim as Archer;this.hits++;if(a.windup>0)this.interrupts++;a.windup=0;a.stun=RANGED.interrupt;a.next=ARCHER.interval;const away={x:a.x+(a.x-shot.origin.x)/Math.max(1,distance(a,shot.origin))*RANGED.knockback,y:a.y+(a.y-shot.origin.y)/Math.max(1,distance(a,shot.origin))*RANGED.knockback};if(segmentClear(a,away,this.nav)&&(!this.canOccupy||this.canOccupy(a,away)))Object.assign(a,away);this.message=a.hp<=0?'破空击命中 · 白骨弓箭手被击败':'破空击命中 · 打断射箭';}else this.message=`${victim.id==='tang'?'唐僧':'悟空'}被箭矢击中`;}else this.message='目标移动，攻击落空';}
   else alive.push(shot);
  }this.shots=alive;if(this.hero.hp<=0)this.cast=null;if(this.tang.hp<=0){this.failed=true;this.cast=null;this.message='护送失败 · 唐僧已阵亡';}else if(this.safe)this.message='远程威胁解除 · 唐僧存活（独立技能实验，不发通关印章）';
 }
}
