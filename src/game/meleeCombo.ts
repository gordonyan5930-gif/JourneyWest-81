/** Round2: same84 damage over three hits; heavier recovery pays for control. */
export const COMBO={timeout:2.4,steps:[
 {damage:22,windup:.24,period:.8,pose:.62,knockback:4,flinch:.10},
 {damage:22,windup:.28,period:.8,pose:.66,knockback:6,flinch:.12},
 {damage:40,windup:.45,period:1.25,pose:1.1,knockback:26,flinch:.12}
 ] as const,airTime:.32,airHeight:42,downTime:.28,riseTime:.25,lightImmunity:4,heavyImmunity:6,counterGrace:3.4,interruptMinRemaining:.4};
export class MeleeCombo {
 hits=0;target='';lastHit=-Infinity;resetReason='new-run';
 reset(reason:string){this.hits=0;this.target='';this.lastHit=-Infinity;this.resetReason=reason;}
 expire(time:number){if(this.hits>0&&time-this.lastHit>COMBO.timeout)this.reset('expired');}
 next(target:string,time:number){if(this.target!==target||time-this.lastHit>COMBO.timeout)this.reset(this.target!==target?'target-changed':'expired');return this.hits%3;}
 hit(target:string,time:number,step:number){this.target=target;this.lastHit=time;this.hits=step+1;}
}
export function comboFrame(age:number,step:number){const thresholds=step===2?[.12,.25,.37,.45,.53,.7,.93,1.25]:[.07,.13,.2,COMBO.steps[step].windup,COMBO.steps[step].windup+.08,.43,.53,COMBO.steps[step].pose];const found=thresholds.findIndex(t=>age<t);return step*8+(found<0?7:found);}
