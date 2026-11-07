import {RANGED,type RangedBattle} from './rangedCombat';
import {distance,segmentClear} from './smoothMovement';
import type {EscortRun} from './escortRun';
// Presentation budget, not an enemy/skill timing change. A recommendation must
// cover normal two-click input AND remain readable before that response starts.
export const ADVICE={responseSeconds:1.5,readableSeconds:.35,safetySeconds:.15,observationSeconds:.05};
export type AdviceContext=Pick<EscortRun,'combo'|'melee'|'actionKind'|'poseUntil'|'attackStep'|'heroTarget'|'finished'>;
export function comboStatus(r:AdviceContext,time:number){
 const progress=r.combo.hits%3,active=r.actionKind==='melee'&&time<r.poseUntil;
 const text=active&&r.attackStep===2?(r.melee?'重击蓄势':'重击出手 / 收招'):progress===2?'轻击 2/2 · 重击准备':progress===1?'轻击 1/2':'轻击 0/2';
 return {progress,active,heavy:progress===2||active&&r.attackStep===2,text,cancelCost:active||progress>0?'主动施法会取消当前近战并重置连段':'当前无有效连段'};
}
export function tacticalAdvice(b:RangedBattle,r:AdviceContext){
 const combo=comboStatus(r,b.time),available=b.active&&!r.finished&&!b.failed&&b.hero.hp>0&&!b.casting&&b.cooldown<=0&&b.energy>=RANGED.energyCost;
 const drawing=b.enemies.filter(a=>a.hp>0&&a.windup>0);
 const candidates=drawing.map(a=>{const flight=distance(b.hero,a)/RANGED.projectileSpeed;
  const required=RANGED.windup+flight+ADVICE.responseSeconds+ADVICE.readableSeconds+ADVICE.safetySeconds+ADVICE.observationSeconds;
  const reachable=distance(b.hero,a)<=RANGED.range&&segmentClear(b.hero,a,b.nav);
  const preservingChain=!combo.active&&combo.progress===0;
  return {enemy:a,flight,required,slack:a.windup-required,reachable,preservingChain,reason:!reachable?'射程或地形不满足':!preservingChain?'保留当前连段 / 重击':a.windup<required?'剩余蓄势不足普通操作余量':'有操作余量'};
 });
 const recommendation=available?candidates.filter(c=>c.reachable&&c.preservingChain&&c.slack>=0).sort((a,c)=>Number(c.enemy.targetId==='tang')-Number(a.enemy.targetId==='tang')||c.slack-a.slack)[0]:undefined;
 return {available,combo,drawing,candidates,recommendation};
}
