import type {Point} from './world';
export const SAMPLE_MAP={width:1600,height:900,tile:32,start:{x:240,y:720},destination:{x:1456,y:272}};
// Authored corridor follows the newly generated ground/ford. This is not a mask
// extracted from the concept board; the visible overlay is for human alignment review.
export const ROAD:Point[]=[{x:0,y:820},{x:240,y:720},{x:480,y:625},{x:660,y:548},{x:880,y:520},{x:1015,y:492},{x:1090,y:430},{x:1220,y:380},{x:1380,y:295},{x:1500,y:195},{x:1599,y:145}];
function segmentDistance(p:Point,a:Point,b:Point){const dx=b.x-a.x,dy=b.y-a.y;const t=Math.max(0,Math.min(1,((p.x-a.x)*dx+(p.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(p.x-a.x-t*dx,p.y-a.y-t*dy);}
export function sampleWalkable(x:number,y:number){const p={x:(x+.5)*32,y:(y+.5)*32};if(p.x<0||p.y<0||p.x>=1600||p.y>=900)return false;return ROAD.slice(1).some((b,i)=>segmentDistance(p,ROAD[i],b)<=64);}
