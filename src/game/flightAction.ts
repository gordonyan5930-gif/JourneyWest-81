import type {EscortRun} from './escortRun';
import type {Point} from './world';
import {distance,segmentClear,smoothPath,type Navigation} from './smoothMovement';
import {sampleTerrain,SAMPLE_MAP} from './sampleMap';

/** Opt-in prototype. Existing escort constants and original encounter remain untouched. */
export const CHOICES={entrances:[{x:1120,y:400},{x:48,y:800}],tree:{x:500,y:700},fruit:2,heal:40};
export const FLIGHT={energy:30,cooldown:10,range:720,speed:420,height:70,takeoff:.35,landing:.3,windup:.65,contact:.12,recovery:.35,harvest:1.5,reach:64,damage:70,maxOutbound:6,replan:.4};
// Foreground low obstacles/water may be overflown, never landed on. Mountain
// cells (including rocks) and background are conservative no-fly volumes.
export const AIR_NAV:Navigation={tile:SAMPLE_MAP.tile,segmentCheck:(a,b)=>[a,b].every(p=>p.x>=0&&p.y>=0&&p.x<SAMPLE_MAP.width&&p.y<SAMPLE_MAP.height),walkable:(x,y)=>!['mountain','background'].includes(sampleTerrain(x,y))&&x>=0&&y>=0&&x*16<SAMPLE_MAP.width&&y*16<SAMPLE_MAP.height,speed:()=>1};
export type FlightPhase='idle'|'takeoff'|'outbound'|'approach-land'|'windup'|'contact'|'recovery'|'harvest'|'return-rise'|'return'|'land'|'crash';
export type FlightKind='assault'|'peach';
export type FlightEvent={sequence:number;time:number;kind:string;action:number;target?:string;amount?:number;unit?:string;x:number;y:number;height:number;energy:number;fruit:number;phase:FlightPhase;manual:boolean};
export class FlightAction {
 phase:FlightPhase='idle';kind:FlightKind='assault';targetId='';height=0;age=0;cooldown=0;fruit=CHOICES.fruit;message='留守自动护卫，或选敌飞袭／选桃树摘桃';
 route:Point[]=[];goal:Point|null=null;origin:Point={x:0,y:0};savedHold:Point={x:0,y:0};savedManual=false;returnManual=false;returnRequested=false;settling=false;
 action=0;sequence=0;events:FlightEvent[]=[];away=0;lastAway=0;hits=0;healed=0;outboundAge=0;planIn=0;returnAge=0;private landed=false;private settled=false;
 constructor(public enabled=false,public air:Navigation=AIR_NAV){}
 get active(){return this.phase!=='idle';}get airborne(){return this.active&&!this.landed;}
 private note(r:EscortRun,kind:string,extra:Partial<FlightEvent>={}){const b=r.battle;this.events.push({sequence:++this.sequence,time:b.time,kind,action:this.action,target:this.targetId,x:b.hero.x,y:b.hero.y,height:this.height,energy:b.energy,fruit:this.fruit,phase:this.phase,manual:r.manualHero,...extra});}
 private phaseTo(p:FlightPhase){this.phase=p;this.age=0;}
 private path(from:Point,to:Point){return segmentClear(from,to,this.air)?[{...to}]:smoothPath(from,to,this.air).route;}
 private spot(r:EscortRun,anchor:Point,preferred:Point,max=180,groundAnchor=false){
  const points=[preferred];for(const radius of [48,68,96,128,160,220,280,320])for(let i=0;i<12;i++)points.push({x:anchor.x+Math.cos(i*Math.PI/6)*radius,y:anchor.y+Math.sin(i*Math.PI/6)*radius});
  points.sort((a,b)=>distance(a,preferred)-distance(b,preferred));return points.find(p=>distance(p,anchor)<=max&&r.space.free(p,'wukong',true)&&r.space.friendClear(p,'wukong')&&(!groundAnchor||segmentClear(anchor,p,r.nav))&&this.path(r.battle.hero,p).length)??null;
 }
 private destination(r:EscortRun){const b=r.battle;if(this.kind==='peach')return this.spot(r,CHOICES.tree,{x:CHOICES.tree.x+50,y:CHOICES.tree.y+18},80,true);const a=b.enemies.find(a=>a.id===this.targetId&&a.hp>0);if(!a)return null;const d=Math.max(1,distance(b.hero,a));return this.spot(r,a,{x:a.x+(b.hero.x-a.x)/d*54,y:a.y+(b.hero.y-a.y)/d*54},60,true);}
 reason(r:EscortRun,kind:FlightKind,id=''){
  const b=r.battle;if(!this.enabled)return '请打开飞袭／摘桃原型入口';if(!r.started||r.finished||b.failed||b.tang.hp<=0)return '请先开始遭遇';if(this.active)return '正在离队行动，可点回援提前返回';if(b.hero.hp<=0)return '悟空倒地，请先复活';if(b.casting||b.shots.some(s=>s.kind==='staff'))return '等待破空击结束再出发';if((b.hero.controlledUntil??0)>b.time)return '悟空正受控制';if(!segmentClear(b.hero,b.hero,r.nav))return '起飞点不是合法地面';
  if(kind==='assault'){const a=b.enemies.find(a=>a.id===id&&a.hp>0);if(!a)return '先选中存活敌人';if(this.cooldown>0)return '飞袭冷却中';if(b.energy<FLIGHT.energy)return '飞袭需要30能量';if(distance(b.hero,a)>FLIGHT.range)return '目标超出飞袭范围';}
  else {if(!this.fruit)return '桃子已耗尽';if([b.hero,b.tang].every(u=>u.hp<=0||u.hp===u.max))return '不需要补血';if(distance(b.hero,CHOICES.tree)>FLIGHT.range)return '桃树超出飞行范围';}
  const oldKind=this.kind,oldId=this.targetId;this.kind=kind;this.targetId=id;const goal=this.destination(r);this.kind=oldKind;this.targetId=oldId;if(!goal)return '没有合法起降路线（山石或地图边界）';return '';
 }
 launch(r:EscortRun,kind:FlightKind,id=''){
  const reason=this.reason(r,kind,id);if(reason){this.message=reason;return false;}
  const b=r.battle;this.kind=kind;this.targetId=id;this.origin={x:b.hero.x,y:b.hero.y};this.savedHold={...(r.heroMotion.route.at(-1)??this.origin)};this.savedManual=r.manualHero;this.returnManual=r.manualHero;this.returnRequested=false;this.settling=false;this.settled=false;this.away=0;this.outboundAge=0;this.returnAge=0;this.planIn=0;this.action++;this.landed=false;this.height=0;this.goal=this.destination(r)!;this.route=this.path(b.hero,this.goal);
  if(kind==='assault'){b.energy-=FLIGHT.energy;this.cooldown=FLIGHT.cooldown;}
  r.heroMotion.route=[];r.heroMotion.speed=0;r.melee=null;r.heroTarget='';r.poseUntil=0;r.postHeavy.clear('离队取消预约',true);r.combo.reset('flight');r.space.yielding.delete('wukong');r.space.slots.delete('wukong');r.manualHero=true;
  b.hero.airHeight=0;this.phaseTo('takeoff');this.message=kind==='assault'?'飞袭出发 · 30能量已消耗，途中回援不返还':'离队摘桃 · 采摘成功才消耗桃子';this.note(r,'launch');return true;
 }
 recall(r:EscortRun,rally=false){if(!this.active)return false;this.returnRequested=true;if(rally)this.returnManual=false;this.message=this.phase==='contact'||this.phase==='recovery'?'招式已出，收招后立即回援':'提前返程 · 已付能量不返还，未采摘不扣桃';this.note(r,'recall');if(!['contact','recovery','return','return-rise','land','crash'].includes(this.phase))this.beginReturn(r);return true;}
 stopForResult(r:EscortRun){if(!this.active||this.settling)return;this.settling=true;this.returnManual=true;this.savedHold={x:r.battle.hero.x,y:r.battle.hero.y};this.returnRequested=true;this.message='遭遇结束，停止结算并安全落地';this.note(r,'result-abort');this.beginReturn(r);}
 private beginReturn(r:EscortRun){this.returnAge=0;this.goal=null;this.route=[];this.planIn=0;this.phaseTo(this.height<FLIGHT.height?'return-rise':'return');this.landed=false;this.note(r,'return');}
 private returnSpot(r:EscortRun){const b=r.battle;if(this.settling||b.hero.hp<=0)return this.spot(r,b.hero,b.hero,180);if(this.returnManual)return this.spot(r,this.savedHold,this.savedHold,this.returnAge>8?320:180,true);
  const threats=b.enemies.filter(a=>a.hp>0).sort((a,c)=>distance(a,b.tang)-distance(c,b.tang)),a=threats[0],angle=a?Math.atan2(b.tang.y-a.y,b.tang.x-a.x):Math.PI;const preferred={x:b.tang.x+Math.cos(angle)*105,y:b.tang.y+Math.sin(angle)*105};return this.spot(r,b.tang,preferred,this.returnAge>8?320:180,true);
 }
 private travel(r:EscortRun,dt:number){let budget=FLIGHT.speed*dt;const h=r.battle.hero;while(budget>0&&this.route.length){const p=this.route[0],d=distance(h,p),n=Math.min(d,budget);if(d<.01){this.route.shift();continue;}const next={x:h.x+(p.x-h.x)/d*n,y:h.y+(p.y-h.y)/d*n};if(!segmentClear(h,next,this.air)){this.route=[];return;}Object.assign(h,next);budget-=n;if(n>=d-.001)this.route.shift();}}
 private finish(r:EscortRun){this.height=0;r.battle.hero.airHeight=0;this.landed=true;this.lastAway=this.away;this.phaseTo('idle');r.heroMotion.reset(r.battle.hero);r.manualHero=this.returnManual;r.returning=!this.returnManual;r.heroPlanAt=0;r.melee=null;r.poseUntil=0;this.route=[];this.note(r,r.battle.hero.hp<=0?'down-landed':'landed');if(!this.settling)this.message=this.returnManual?'已返程 · 恢复手动驻守':'已返程 · 恢复自动护卫';}
 update(r:EscortRun,dt:number){this.cooldown=Math.max(0,this.cooldown-dt);if(!this.active)return;const b=r.battle;this.age+=dt;this.away+=dt;if(['return-rise','return','land'].includes(this.phase))this.returnAge+=dt;
  if(b.hero.hp<=0&&this.phase!=='crash'){this.settling=true;this.goal=this.returnSpot(r);this.route=this.goal?this.path(b.hero,this.goal):[];this.phaseTo('crash');this.note(r,'down-abort');this.message='悟空倒地，动作中断；需耗能复活';}
  if(!this.settling&&(b.failed||b.tang.hp<=0||r.finished))this.stopForResult(r);
  if(this.phase==='crash'){this.travel(r,dt);if(!this.route.length){this.height=Math.max(0,this.height-FLIGHT.height*dt/.3);if(this.height<=0)this.finish(r);}b.hero.airHeight=this.height;return;}
  if(this.phase==='takeoff'){this.height=Math.min(FLIGHT.height,this.height+FLIGHT.height*dt/FLIGHT.takeoff);if(this.height>=FLIGHT.height)this.phaseTo('outbound');}
  else if(this.phase==='outbound'){
   this.outboundAge+=dt;this.planIn-=dt;const target=b.enemies.find(a=>a.id===this.targetId&&a.hp>0);if(this.kind==='assault'&&!target){this.message='指定目标已失效，未命中，原路返程';this.note(r,'target-invalid');this.beginReturn(r);}
   else if(this.outboundAge>FLIGHT.maxOutbound){this.message='接近超时，未命中，返程';this.note(r,'approach-timeout');this.beginReturn(r);}
   else {if(this.planIn<=0){this.planIn=FLIGHT.replan;const goal=this.destination(r);if(!goal){this.message='目标附近无合法落点，返程';this.note(r,'landing-rejected');this.beginReturn(r);}else {this.goal=goal;this.route=this.path(b.hero,goal);}}
    if(this.phase==='outbound'){this.travel(r,dt);if(!this.route.length&&this.goal&&distance(b.hero,this.goal)<2&&r.space.free(b.hero,'wukong',true)&&r.space.friendClear(b.hero,'wukong')){this.phaseTo('approach-land');this.note(r,'arrive');}}}
  }
  else if(this.phase==='approach-land'){
   if(!r.space.free(b.hero,'wukong',true)||!r.space.friendClear(b.hero,'wukong')){this.phaseTo('takeoff');this.planIn=0;}
   else {this.height=FLIGHT.height*Math.max(0,1-this.age/FLIGHT.landing);if(this.age>=FLIGHT.landing){this.landed=true;this.phaseTo(this.kind==='assault'?'windup':'harvest');this.note(r,this.kind==='assault'?'telegraph':'harvest-start');}}}
  else if(this.phase==='windup'){const a=b.enemies.find(a=>a.id===this.targetId&&a.hp>0);if(!a){this.message='指定目标已失效，未命中';this.note(r,'target-invalid');this.beginReturn(r);}else if(this.age>=FLIGHT.windup){this.phaseTo('contact');const inReach=distance(b.hero,a)<=FLIGHT.reach&&segmentClear(b.hero,a,r.nav)&&r.controls.get(a.id).height<=12;if(inReach){const amount=Math.min(a.hp,FLIGHT.damage);b.damage(a,FLIGHT.damage,'wukong','fly');this.hits++;const control=r.controls.impact(a,b.hero,2);this.message=`飞袭命中${amount} · ${control==='launch'?'击飞':'受击'} · 正在返程`;this.note(r,'hit',{amount});}else{this.message='飞袭落空：目标移出接触范围或遮挡';this.note(r,'miss');}}}
  else if(this.phase==='contact'){if(this.age>=FLIGHT.contact)this.phaseTo('recovery');}
  else if(this.phase==='recovery'){if(this.age>=FLIGHT.recovery)this.beginReturn(r);}
  else if(this.phase==='harvest'){if(this.age>=FLIGHT.harvest){const living=[b.hero,b.tang].filter(u=>u.hp>0&&u.hp<u.max);if(living.length&&this.fruit>0&&!this.settled){this.settled=true;this.fruit--;const labels:string[]=[];for(const u of living){const amount=Math.min(CHOICES.heal,u.max-u.hp);u.hp+=amount;this.healed+=amount;labels.push((u.id==='tang'?'唐僧':'悟空')+'+'+amount);this.note(r,'heal',{unit:u.id,amount});}this.message='摘桃成功 · '+labels.join(' / ')+' · 返程中';this.note(r,'picked');}else this.message='不需要补血 · 没有消耗桃子';this.beginReturn(r);}}
  else if(this.phase==='return-rise'){this.height=Math.min(FLIGHT.height,this.height+FLIGHT.height*dt/FLIGHT.takeoff);if(this.height>=FLIGHT.height)this.phaseTo('return');}
  else if(this.phase==='return'){
   this.planIn-=dt;if(this.planIn<=0||!this.goal){this.planIn=FLIGHT.replan;this.goal=this.returnSpot(r);this.route=this.goal?this.path(b.hero,this.goal):[];}
   this.travel(r,dt);if(!this.route.length&&this.goal&&distance(b.hero,this.goal)<2&&r.space.free(b.hero,'wukong',true)&&r.space.friendClear(b.hero,'wukong')&&(this.returnManual||this.settling||distance(b.hero,b.tang)<(this.returnAge>8?320:180))){this.phaseTo('land');this.note(r,'return-arrive');}
  }
  else if(this.phase==='land'){if(!r.space.free(b.hero,'wukong',true)||!r.space.friendClear(b.hero,'wukong')||!this.returnManual&&!this.settling&&distance(b.hero,b.tang)>(this.returnAge>8?320:180)){this.phaseTo('return-rise');this.goal=null;}else{this.height=FLIGHT.height*Math.max(0,1-this.age/FLIGHT.landing);if(this.age>=FLIGHT.landing)this.finish(r);}}
  b.hero.airHeight=this.height;
 }
}
