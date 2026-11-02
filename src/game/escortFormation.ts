import {BODY_LANE,bodyDistance,bodyPath} from './bodyClearance';
import {distance,segmentClear,type Navigation} from './smoothMovement';
import type {Point} from './world';import type {UnitSpace} from './unitSpace';
export const FORMATION={lateral:104,vertical:-12,anchorTravel:12,queueDistance:136,exitLead:300,exitOffset:80};
/** Stable visual stopping intent. Collision radii and mover parameters stay unchanged. */
export class EscortFormation {
 side=1;anchor:Point|null=null;point:Point|null=null;mode='wide';exitPoint:Point|null=null;
 reset(){this.side=1;this.anchor=null;this.point=null;this.mode='wide';this.exitPoint=null;}
 follow(tang:Point,heading:Point,space:UnitSpace,nav:Navigation){
  if(this.point&&this.anchor&&distance(tang,this.anchor)<FORMATION.anchorTravel&&space.free(this.point,'wukong')&&space.friendClear(this.point,'wukong'))return this.point;
  const length=Math.max(1,Math.hypot(heading.x,heading.y)),lead={x:heading.x/length*24,y:heading.y/length*24};const wide=(side:number)=>({x:tang.x+side*FORMATION.lateral+lead.x,y:tang.y+FORMATION.vertical+lead.y});
  const valid=(p:Point)=>space.free(p,'wukong',true)&&space.friendClear(p,'wukong')&&segmentClear(tang,p,nav)&&bodyDistance(p,tang)>=1&&!!bodyPath(space.units().find(u=>u.id==='wukong')!,p,space.view('wukong'),tang).route.length;
  for(const side of [this.side,-this.side]){const p=wide(side);if(valid(p)){this.side=side;this.anchor={...tang};this.point=p;this.mode='wide';return p;}}
  const hero=space.units().find(u=>u.id==='wukong')!,front=((hero.x-tang.x)*heading.x+(hero.y-tang.y)*heading.y)>=0?1:-1;const preferred={x:tang.x+front*heading.x/length*FORMATION.queueDistance,y:tang.y+front*heading.y/length*FORMATION.queueDistance};
  const p=space.endpoint('wukong',tang,preferred,[BODY_LANE.queue,BODY_LANE.queue+16],'formation-queue');if(p&&bodyDistance(p,tang)>=1){this.anchor={...tang};this.point=p;this.mode='queue';}return p;
 }
 finish(exit:Point,space:UnitSpace,nav:Navigation){
  if(this.exitPoint&&space.free(this.exitPoint,'wukong')&&segmentClear(exit,this.exitPoint,nav))return this.exitPoint;
  for(const [x,y] of [[-80,-24],[-100,-32],[-80,12],[80,-12],[-64,30]]){const p={x:exit.x+x,y:exit.y+y};if(space.free(p,'wukong',true)&&segmentClear(exit,p,nav)){this.exitPoint=p;this.mode='finish';return p;}}return null;
 }
}

/** Local firing sidestep: anchor at the bow, never at a distant victim. */
export function firingSpacing(a:Point&{id:string},other:Point&{id:string},space:UnitSpace){const side=a.x>=other.x?1:-1,key='bow-spacing-'+other.id,old=space.slots.get(a.id);if(old&&old.key===key&&bodyDistance(old.point,other)<1.05)space.slots.delete(a.id);const p=space.endpoint(a.id,a,{x:other.x+side*82,y:a.y},[64,80],key);return p&&bodyDistance(p,other)>=1.05?p:null;}
