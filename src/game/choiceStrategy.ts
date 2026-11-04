import type {EscortRun} from './escortRun';
import {CHOICES} from './flightAction';
import {distance} from './smoothMovement';
export type ChoiceProfile=typeof CHOICES & {returnLead?:number;guardReadyOnLanding?:boolean};
// Same two ordinary archers. Distances, real approach and target AI trigger
// overlap; there is no spawn clock, frozen enemy or player-only damage bonus.
export const STRATEGY_CHOICES:ChoiceProfile={...CHOICES,tree:{x:560,y:520},entrances:[{x:1040,y:432},{x:48,y:816}],returnLead:140,guardReadyOnLanding:true};
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
