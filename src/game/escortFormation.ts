import {distance,segmentClear,type Navigation} from './smoothMovement';
import type {Point} from './world';import type {UnitSpace} from './unitSpace';
export const FORMATION={lateral:104,vertical:-12,anchorTravel:24,queueDistance:72,exitLead:300,exitOffset:80};
/** Stable visual stopping intent. Collision radii and mover parameters stay unchanged. */
export class EscortFormation {
 side=1;anchor:Point|null=null;point:Point|null=null;mode='wide';exitPoint:Point|null=null;
 reset(){this.side=1;this.anchor=null;this.point=null;this.mode='wide';this.exitPoint=null;}
 follow(tang:Point,heading:Point,space:UnitSpace,nav:Navigation){
  if(this.point&&this.anchor&&distance(tang,this.anchor)<FORMATION.anchorTravel&&space.free(this.point,'wukong')&&space.friendClear(this.point,'wukong'))return this.point;
  const wide=(side:number)=>({x:tang.x+side*FORMATION.lateral,y:tang.y+FORMATION.vertical});
  const valid=(p:Point)=>space.free(p,'wukong',true)&&space.friendClear(p,'wukong')&&segmentClear(tang,p,nav);
  for(const side of [this.side,-this.side]){const p=wide(side);if(valid(p)){this.side=side;this.anchor={...tang};this.point=p;this.mode='wide';return p;}}
  const length=Math.max(1,Math.hypot(heading.x,heading.y));const preferred={x:tang.x-heading.x/length*FORMATION.queueDistance,y:tang.y-heading.y/length*FORMATION.queueDistance};
  const p=space.endpoint('wukong',tang,preferred,[72,88],'formation-queue');if(p){this.anchor={...tang};this.point=p;this.mode='queue';}return p;
 }
 finish(exit:Point,space:UnitSpace,nav:Navigation){
  if(this.exitPoint&&space.free(this.exitPoint,'wukong')&&segmentClear(exit,this.exitPoint,nav))return this.exitPoint;
  for(const [x,y] of [[-80,-24],[-100,-32],[-80,12],[80,-12],[-64,30]]){const p={x:exit.x+x,y:exit.y+y};if(space.free(p,'wukong',true)&&segmentClear(exit,p,nav)){this.exitPoint=p;this.mode='finish';return p;}}return null;
 }
}

/** Local firing sidestep: anchor at the bow, never at a distant victim. */
export function firingSpacing(a:Point&{id:string},other:Point&{id:string},space:UnitSpace){const side=a.x>=other.x?1:-1;return space.endpoint(a.id,a,{x:other.x+side*76,y:a.y},[64,80],'bow-spacing-'+other.id);}
