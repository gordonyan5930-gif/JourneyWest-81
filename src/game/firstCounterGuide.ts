/** Only the existing teaching encounter's second bow's FIRST draw changes. */
export const FIRST_COUNTER={targetId:'archer-2',firstWindup:3.2,position:{x:850,y:540}};
import type {EscortRun} from './escortRun';
import type {StaffOutcome} from './rangedCombat';
import {RANGED} from './rangedCombat';
import {castAccess} from './postHeavyOrder';
import {distance} from './smoothMovement';
import {tacticalAdvice} from './tacticalAdvice';
export const enemyName=(id:string)=>id==='archer-2'?'弓手二':'弓手一';
export function shortCastReason(reason:string){return /超出射程|超射程/.test(reason)?'太远了，靠近后再试':/地形|遮挡/.test(reason)?'山石挡住了，换个位置':/冷却/.test(reason)?'技能正在冷却':/能量/.test(reason)?'能量不足':/倒地/.test(reason)?'悟空倒地，先复活':/存活|死亡|失效/.test(reason)?'目标已倒下，请重新选择':/蓄势|施法/.test(reason)?'正在施法，请稍等':reason;}
type Note={kind:string;wall:number;game:number;target?:string;[key:string]:unknown};
/** Presentation only. Commands are issued only by existing player click handlers. */
export class FirstCounterGuide {
 positioned=false;attempted=false;result='';returnedAt:number|null=null;pendingAt:number|null=null;pendingTarget='';timeline:Note[]=[];lastShown='';
 reset(){this.positioned=false;this.attempted=false;this.result='';this.returnedAt=null;this.pendingAt=null;this.pendingTarget='';this.timeline=[];this.lastShown='';}
 note(r:EscortRun,kind:string,extra:Record<string,unknown>={}){this.timeline.push({kind,wall:Date.now(),game:r.battle.time,...extra});if(this.timeline.length>100)this.timeline.shift();}
 position(r:EscortRun){this.positioned=true;this.attempted=false;this.result='';this.returnedAt=null;this.note(r,'position',{manual:r.manualHero});}
 select(r:EscortRun,id:string){this.note(r,'select',{target:id});}
 input(r:EscortRun,id:string){this.note(r,'input',{target:id,energy:r.battle.energy,hero:r.battle.hero.hp,tang:r.battle.tang.hp,combo:r.combo.hits%3,aim:r.events.filter(e=>e.kind==='aim'&&e.unit===id).at(-1)?.sequence});}
 accepted(r:EscortRun,id:string,ok:boolean){this.attempted=true;this.returnedAt=null;if(ok){this.pendingAt=r.battle.time;this.pendingTarget=id;this.result='棍影飞向'+enemyName(id);this.note(r,'cast',{target:id,energy:r.battle.energy});}else{this.pendingAt=null;const aim=r.events.filter(e=>e.kind==='aim'&&e.unit===id).at(-1),shot=r.events.filter(e=>e.kind==='shot'&&e.unit===id).at(-1);this.result=(shot&&(!aim||shot.time>=aim.time)&&r.battle.time-shot.time<1.5?'箭已射出 · ':'')+shortCastReason(r.battle.message);this.note(r,'rejected',{target:id,reason:this.result,energy:r.battle.energy});}}
 outcome(r:EscortRun,o:StaffOutcome){const {kind:outcomeKind,...details}=o;this.note(r,'outcome',{...details,outcomeKind,hero:r.battle.hero.hp,tang:r.battle.tang.hp});if(this.pendingAt===null||Math.abs(o.castAt-this.pendingAt)>.001||o.targetId!==this.pendingTarget)return;this.pendingAt=null;this.result=o.kind==='hit'?(r.battle.enemies.find(a=>a.id===o.targetId)!.hp<=0?`击败${enemyName(o.targetId)} · 命中${o.damage}`:o.interrupted?`打断成功 · 命中${o.damage}`:`命中${o.damage} · 未打断`):o.kind==='blocked'?'棍影被山石挡住了':o.kind==='miss'?'未命中 · 目标已移开':'目标已倒下，棍影未命中';}
 rally(r:EscortRun){this.returnedAt=r.battle.time;this.pendingAt=null;this.result='已恢复护卫 · 悟空正在回援';this.note(r,'rally',{manual:r.manualHero});}
 focus(r:EscortRun){return this.returnedAt===null&&!r.finished&&!this.attempted?(r.selectedEnemyId||FIRST_COUNTER.targetId):'';}
 view(r:EscortRun){
  const b=r.battle,base={visible:!r.finished&&(this.returnedAt===null||b.time-this.returnedAt<4),step:'prepare',text:'前往旗标会手动驻守；反击后请回援。',button:'前往旗标 · 手动驻守',action:'position',disabled:!r.started};
  if(!r.started)return {...base,text:'弓手会拉弓放箭。开始护送后，跟随提示练习反击。'};
  if(b.hero.hp<=0){if(this.pendingAt!==null&&!b.casting&&!b.shots.some(s=>s.kind==='staff')){this.pendingAt=null;this.result='悟空倒地，施法中断';this.note(r,'cancelled');}return {...base,step:'down',text:'悟空倒地了，先耗能复活。',button:'',action:'none'};}
  if(this.returnedAt!==null)return {...base,step:'complete',text:this.result,button:'',action:'none'};
  if(this.attempted){if(this.pendingAt!==null&&(r.finished||!b.casting&&!b.shots.some(s=>s.kind==='staff'))){this.pendingAt=null;if(b.hero.hp<=0)this.result='悟空倒地，施法中断';}return {...base,step:this.pendingAt!==null?'flight':'result',text:this.result+(r.manualHero?' · 点回援护卫':' · 可继续护送'),button:'回援护卫',action:'rally',disabled:b.casting||this.pendingAt!==null};}
  const a=b.enemies.find(a=>a.id===FIRST_COUNTER.targetId)!;
  if(a.hp<=0)return {...base,step:'unavailable',text:'弓手二已被击败。可继续护送或重新练习。',button:'回援护卫',action:'rally',disabled:b.casting};
  if(!this.positioned)return base;
  if(distance(b.hero,FIRST_COUNTER.position)>18)return {...base,step:'moving',text:r.heroMotion.route.length?'正在前往旗标，到达后手动驻守。':'尚未到旗标。也可点回援恢复护卫。',button:r.heroMotion.route.length?'正在前往…':'前往旗标 · 手动驻守',disabled:!!r.heroMotion.route.length};
  if(!r.selectedEnemyId)return {...base,step:'select',text:'选择高亮的弓手二，准备破空击。',button:'选中弓手二',action:'select',disabled:false};
  const id=r.selectedEnemyId,target=b.enemies.find(a=>a.id===id),reason=castAccess(r,id),advice=tacticalAdvice(b,r),opening=advice.recommendation?.enemy.id===id;
  const text=reason?shortCastReason(reason):opening?`${enemyName(id)}拉弓了，现在破空击！`:target&&target.windup>0?`${enemyName(id)}正在拉弓`:target?.released?`${enemyName(id)}已放箭，棍影不能追回旧箭`:`已选${enemyName(id)}，留意拉弓动作`;
  return {...base,step:opening?'opening':'cast',text,button:`破空击 → ${enemyName(id)} · ${RANGED.energyCost}能量`,action:'cast',disabled:!target||target.hp<=0||b.hero.hp<=0||b.casting};
 }
 shown(r:EscortRun,step:string,text:string,target:string){const key=step+'/'+text+'/'+target;if(key!==this.lastShown){this.lastShown=key;this.note(r,'shown',{step,text,target,aim:r.events.filter(e=>e.kind==='aim'&&e.unit===target).at(-1)?.sequence});}}
}
