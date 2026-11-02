import {GUARD} from './guardRules';
import {RANGED,type RangedBattle} from './rangedCombat';
import {tacticalAdvice,type AdviceContext} from './tacticalAdvice';
// Unknown combo context cannot support a recommendation.
export function counterOpportunity(b:RangedBattle,r?:AdviceContext){return r?tacticalAdvice(b,r).recommendation?.enemy:undefined;}
export function attackFrame(age:number,kind:string,pending:boolean){if(kind==='melee')return pending?(age<.15?'8':'9'):(age<.35?'10':'11');return age<.2?'8':age<.3?'9':age<.38?'10':'11';}
export function combatTotals(events:{kind:string;target?:string;amount?:number}[],revives:number){return {heroDamage:events.filter(e=>e.target==='wukong').reduce((n,e)=>n+(e.amount??0),0),tangDamage:events.filter(e=>e.target==='tang').reduce((n,e)=>n+(e.amount??0),0),energySpent:events.filter(e=>e.kind==='cast').length*RANGED.energyCost+revives*GUARD.reviveCost};}
