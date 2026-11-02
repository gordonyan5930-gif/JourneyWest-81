import type {EscortRun} from './escortRun';
import {RANGED} from './rangedCombat';
import {distance,segmentClear} from './smoothMovement';
export const POST_HEAVY={expiry:6};
export function castAccess(r:EscortRun,id:string){const b=r.battle,a=b.enemies.find(a=>a.id===id);if(!a||a.hp<=0)return '目标已死亡';if(r.finished||!r.started||b.hero.hp<=0)return '当前不能施法';if(b.casting)return '正在施法';if(b.cooldown>0)return `冷却${b.cooldown.toFixed(1)}秒`;if(b.energy<RANGED.energyCost)return '能量不足';if(distance(b.hero,a)>RANGED.range)return '超射程';if(!segmentClear(b.hero,a,b.nav))return '地形遮挡';return '';}
type Completion={targetId:string;at:number;sequence:number;heavyAt:number|null};
/** Explicit single player command: complete THIS chain, then cast once at THIS target. */
export class PostHeavyOrder {
 pending:{targetId:string;meleeTarget:string;at:number}|null=null;completion:Completion|null=null;feedback='';
 clear(reason='',all=false){this.pending=null;if(all)this.completion=null;this.feedback=reason;}
 submit(r:EscortRun,targetId:string){const heavy=r.actionKind==='melee'&&r.attackStep===2&&r.battle.time<r.poseUntil;
  if(!r.heroTarget||r.combo.hits%3===0&&!heavy){this.feedback='请先接敌并开始本轮连段；或选择立即破空击';return false;}
  const reason=castAccess(r,targetId);if(reason){this.feedback=reason+' · 未预约/未耗能';return false;}
  const hit=heavy&&!r.melee?r.events.filter(e=>e.kind==='melee'&&e.step===2&&e.time>=r.poseAt).at(-1):null;
  r.manualHero=false;r.returning=false;r.heroPlanAt=0;this.completion={targetId:r.heroTarget,at:r.battle.time,sequence:r.eventSequence,heavyAt:hit?.time??null};this.pending={targetId,meleeTarget:r.heroTarget,at:r.battle.time};this.feedback='完成当前接敌连段，再向指定目标施法一次 · 执行时25能量 · 可取消施法';return true;
 }
 poll(r:EscortRun):string|null {const c=this.completion,b=r.battle;if(!c)return null;
  if(r.finished||b.hero.hp<=0||(b.hero.controlledUntil??0)>b.time){this.clear('倒地/受控/终局 · 预约取消，未耗能',true);return null;}
  if(b.time-c.at>POST_HEAVY.expiry){this.clear('本轮连段未完成 · 预约超时，未耗能',true);return null;}
  if(c.heavyAt===null){const hit=r.events.find(e=>e.sequence>c.sequence&&e.kind==='melee'&&e.step===2&&e.target===c.targetId);if(hit)c.heavyAt=hit.time;
   else if(r.heroTarget!==c.targetId||r.events.some(e=>e.sequence>c.sequence&&e.kind==='melee-miss')){this.clear('原连段中断/换敌 · 预约取消，未耗能',true);return null;}}
  const q=this.pending;if(q){const target=b.enemies.find(a=>a.id===q.targetId);if(!target||target.hp<=0)this.clear('指定目标失效 · 预约取消，当前接敌继续');}
  if(c.heavyAt!==null&&b.time>=r.poseUntil){this.completion=null;if(!this.pending)return null;const id=this.pending.targetId,reason=castAccess(r,id);this.clear(reason?reason+' · 执行取消，未耗能':'重击已结束 · 执行玩家预约');return reason?null:id;}return null;
 }
}
