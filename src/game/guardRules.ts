import {CONFIG} from './world';
import type {Point} from './world';
import {ARCHER,type Archer,type Fighter} from './rangedCombat';
import {distance,segmentClear,smoothPath,SAMPLE_NAV,type Navigation} from './smoothMovement';
export const GUARD={hp:180,meleeDamage:28,meleeRange:64,windup:.25,period:CONFIG.attackPeriod,pose:.45,radius:270,chase:440,returnDistance:100,replan:.6,enemySpeed:58,enemyStand:290,enemyPlan:.7,enemyDecision:.25,minApproach:60,targetDelay:.2,nearThreatRadius:140,nearThreatScore:130,tangPriority:70,heroPriority:20,reaction:3,targetLock:1.2,switchMargin:25,threatDecay:4,evadeHold:2,calm:4,evadeLeash:220,sosHp:40,sosDanger:2,sosFar:260,sosInterval:8,sosVisible:3,reviveCost:CONFIG.reviveCost,reviveDelay:CONFIG.reviveDelay};
export function chooseEnemyTarget(a:Archer,hero:Fighter,tang:Fighter,now:number,nav:Navigation=SAMPLE_NAV){
 const valid=[hero,tang].filter(u=>u.hp>0&&distance(a,u)<=ARCHER.range&&segmentClear(a,u,nav));
 const score=(u:Fighter)=>{const d=distance(a,u),h=a.threat[u.id];return (u.id==='tang'?GUARD.tangPriority-d*.08:GUARD.heroPriority-d*.06+(d<GUARD.nearThreatRadius?GUARD.nearThreatScore:0))+(h?h.value*Math.exp(-(now-h.at)/GUARD.threatDecay):0);};
 const ranked=valid.sort((x,y)=>score(y)-score(x)),old=valid.find(u=>u.id===a.targetId),best=ranked[0];if(!best)return '';
 if(old&&old.id!==best.id&&(now<a.lockedUntil||score(best)<score(old)+GUARD.switchMargin))return old.id;return best.id;
}
export function reachableNear(from:Point,goal:Point,nav:Navigation=SAMPLE_NAV){if(!segmentClear(goal,goal,nav))return false;return !!smoothPath(from,goal,nav).route.length;}
function clearance(p:Point,a:Point,b:Point){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/Math.max(.0001,dx*dx+dy*dy)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
export function saferPoint(tang:Point,hero:Fighter,enemies:Fighter[],anchor:Point,nav:Navigation=SAMPLE_NAV,unoccupied:(p:Point)=>boolean=()=>true){
 const threats=enemies.filter(e=>e.hp>0);if(!threats.length)return null;
 const nearest=[...threats].sort((a,b)=>distance(a,tang)-distance(b,tang))[0];const useHero=hero.hp>0&&distance(hero,tang)<GUARD.sosFar;
 const angle=Math.atan2(hero.y-nearest.y,hero.x-nearest.x),candidates:Point[]=[];
 if(useHero)for(const turn of [0,-.5,.5])for(const length of [70,100])candidates.push({x:hero.x+Math.cos(angle+turn)*length,y:hero.y+Math.sin(angle+turn)*length});
 for(let i=0;i<12;i++)for(const length of [65,110])candidates.push({x:tang.x+Math.cos(i*Math.PI/6)*length,y:tang.y+Math.sin(i*Math.PI/6)*length});
 const safety=(p:Point)=>Math.min(...threats.map(e=>distance(e,p)))*.7+threats.reduce((s,e)=>s+Math.min(500,distance(e,p))*.08,0);
 let chosen:Point|null=null,best=safety(tang);
 for(const p of candidates){if(!unoccupied(p)||distance(p,anchor)>GUARD.evadeLeash||!segmentClear(p,p,nav))continue;const path=smoothPath(tang,p,nav).route;if(!path.length)continue;let length=0,prev=tang,minClear=Infinity;for(const n of path){length+=distance(prev,n);minClear=Math.min(minClear,...threats.map(e=>clearance(e,prev,n)));prev=n;}if(length>270||minClear<Math.min(60,...threats.map(e=>distance(e,tang)))-10)continue;
  const behind=useHero?Math.max(0,((p.x-hero.x)*Math.cos(angle)+(p.y-hero.y)*Math.sin(angle)))*.4:0;const score=safety(p)+behind-length*.2;
  if(score>best+10){best=score;chosen=p;}
 }return chosen;
}
