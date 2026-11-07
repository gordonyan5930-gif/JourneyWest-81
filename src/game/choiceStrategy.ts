import type {EscortRun} from './escortRun';
import {CHOICES} from './flightAction';
import {RANGED} from './rangedCombat';
import {GUARD} from './guardRules';
import {distance} from './smoothMovement';
export type ChoiceProfile=typeof CHOICES & {returnLead?:number;guardReadyOnLanding?:boolean};
// Same two ordinary archers. Distances, real approach and target AI trigger
// overlap; there is no spawn clock, frozen enemy or player-only damage bonus.
export const STRATEGY_CHOICES:ChoiceProfile={...CHOICES,tree:{x:560,y:520},entrances:[{x:1040,y:432},{x:48,y:816}],returnLead:140,guardReadyOnLanding:true};
// Round1 is a readable presentation of the existing encounter, not a second
// damage model. Explicit entry keeps the accepted strategy/classic comparisons.
export const ROUND1_CHOICES:ChoiceProfile={...STRATEGY_CHOICES};
export const CHOICE_READABILITY={nearRange:100,staffRange:RANGED.range};
export function round1Cue(r:EscortRun){
 const fact=encounterCue(r),b=r.battle,[far,near]=b.enemies;
 if(fact.stage==='ready')return {stage:'ready',text:'先留守观察：近侧自动接敌，远端可选中查看'};
 if(r.finished)return fact;
 const f=r.flight;
 if(b.hero.hp<=0){
  const text=f.active?'正在安全落地，落地后按条件复活':r.deadFor<GUARD.reviveDelay?`复活还需${Math.ceil(GUARD.reviveDelay-r.deadFor)}秒`:b.energy<GUARD.reviveCost?`复活需要${GUARD.reviveCost}能量，当前不足`:`可尝试复活（${GUARD.reviveCost}能量，需安全空位）`;
  return {stage:'down',text:'悟空倒地 · '+text};
 }
 if(f.active){
  const returning=['return-rise','return','land','crash'].includes(f.phase),events=f.events.filter(e=>e.action===f.action);
  const action=f.kind==='peach'?'摘桃':'飞袭',settled=events.some(e=>e.kind===(f.kind==='peach'?'picked':'hit'));
  const mode=f.returnManual?'手动驻守':'自动护卫';
  if(returning)return {stage:'away',text:`${action}${settled?'已结算':'未结算'} · 正在返程，落地恢复${mode}`};
  if(f.phase==='harvest')return {stage:'away',text:'正在采摘 · 成功才扣1份桃子并回血，可提前回援'};
  const phase=({takeoff:'起飞',outbound:'接近目标','approach-land':'准备落地',windup:'强击蓄势',contact:'强击接触',recovery:'收招'} as Record<string,string>)[f.phase]??'进行中';
  return {stage:'away',text:`悟空离队${action} · ${phase}${r.dangerSince!==null?'，唐僧受威胁':''}，可回援`};
 }
 const full=[b.hero,b.tang].filter(u=>u.hp>0).every(u=>u.hp===u.max);
 if(r.manualHero)return {stage:'manual',text:`悟空手动${r.heroMotion.route.length?'行进':'驻守'} · ${b.safe&&full?'全员满血；':''}回援才恢复自动护卫`};
 if(b.safe){
  const restored=f.events.at(-1)?.kind==='landed'?'已恢复护卫 · ':'';
  const recovery=full?'全员满血，无需摘桃':f.fruit===0?'桃子已耗尽，继续护送':`有伤势，选桃树查看采摘条件（${f.fruit}份）`;
  return {stage:'breather',text:'威胁已解除 · '+restored+recovery};
 }
 if(near.hp>0){
  if(r.meleeHits===0&&distance(near,b.hero)>CHOICE_READABILITY.nearRange)return {stage:'approach',text:'近侧来敌 · 留守可自动接敌，观察远端入口'};
  if(far.hp>0&&far.windup>0)return {stage:'overlap',text:'两路威胁 · 近侧尚未清除，此时离队有风险'};
  return {stage:'near',text:'近侧正在交战 · 留守护卫，远端来敌可选中观察'};
 }
 if(far.hp>0){
  const inStaff=distance(far,b.hero)<=CHOICE_READABILITY.staffRange;
  // Range alone does not promise a hit/interrupt; the existing access panel
  // remains authoritative for obstruction, cooldown and real cast availability.
  return {stage:'far',text:inStaff?'近侧已清 · 远敌进入棍影射程，选中查看破空击条件':!r.flight.reason(r,'assault',far.id)?'近侧已清 · 远敌仍在棍影射程外，可选中飞袭抢先压制':'近侧已清 · 留守接近远敌，飞袭条件请点选查看'};
 }
 return {stage:'arrows',text:'敌人已倒下 · 仍有飞箭，先护送避险'};
}
export function encounterCue(r:EscortRun){
 const [far,near]=r.battle.enemies,b=r.battle;
 if(!r.started)return {stage:'ready',text:'开始护送：近侧自动护卫，远侧来敌需留意'};
 if(r.finished)return {stage:'result',text:r.phase==='won'?'已抵达 · 本段结束':'护送失败 · 可重新开始'};
 if(b.safe)return {stage:'breather',text:'威胁已解除 · 喘息后继续护送，可查看伤势'};
 const controlled=r.controls.get(far.id).phase;
 const front=far.hp>0?controlled==='airborne'?'远端弓手被击飞':controlled==='down'?'远端弓手倒地中':controlled==='rising'?'远端弓手正在起身':controlled==='hurt'?'远端弓手受击':`远端弓手${far.windup>0?(far.targetId==='tang'?'正在瞄准唐僧蓄势':'正在瞄准悟空蓄势'):far.released>0?'已放箭':'正从入口走来'}`:'远端威胁已解除';
 if(near.hp>0&&far.hp>0&&(r.melee?.targetId===near.id||distance(near,b.hero)<100)&&far.windup>0)return {stage:'overlap',text:`两路威胁 · 近侧${near.hp<=40?'残血但仍存活':'正在交战'}，${front}`};
 if(near.hp>0)return {stage:'near',text:`近侧需要护卫 · ${front}`};
 return {stage:'far',text:`近侧已清 · ${front}`};
}
