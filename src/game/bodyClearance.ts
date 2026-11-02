import {distance,segmentClear,smoothPath,type Navigation} from './smoothMovement';
import type {Point} from './world';
// Body/head envelopes measured at unchanged ~110px actor height, excluding staff/cape.
// Soft ROUTE preference only; UnitSpace's 34x18 hard feet are unchanged.
export const BODY_LANE={width:62,depth:116,queue:136};
export function bodyDistance(a:Point,b:Point){return Math.hypot((a.x-b.x)/BODY_LANE.width,(a.y-b.y)/BODY_LANE.depth);}
export function bodyLane(nav:Navigation,friend:Point):Navigation{return {...nav,segmentCheck:(a,b)=>{
 if(nav.segmentCheck&&!nav.segmentCheck(a,b))return false;if(distance(a,b)<1e-7)return true;
 const x=(a.x-friend.x)/BODY_LANE.width,y=(a.y-friend.y)/BODY_LANE.depth,dx=(b.x-a.x)/BODY_LANE.width,dy=(b.y-a.y)/BODY_LANE.depth,t=Math.max(0,Math.min(1,-(x*dx+y*dy)/Math.max(1e-8,dx*dx+dy*dy))),start=Math.hypot(x,y),closest=Math.hypot(x+t*dx,y+t*dy),end=Math.hypot(x+dx,y+dy);
 return closest>=1||start<1.01&&closest>=start-1e-6&&end>start+1e-6;
 }};}
export function bodyPath(from:Point,to:Point,nav:Navigation,friend:Point){const view=bodyLane(nav,friend);return segmentClear(from,to,view)?{raw:[{...from},{...to}],route:[{...to}]}:smoothPath(from,to,view);}
