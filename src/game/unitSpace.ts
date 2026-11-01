import type {Point} from './world';
import {SmoothMover,SAMPLE_NAV,distance,segmentClear,smoothPath,type Navigation} from './smoothMovement';
export type Occupant=Point&{id:string;hp:number};
// Elliptical FOOT occupancy, not a large sprite/body collision circle.
export const SPACE={halfWidth:16,halfDepth:8,gap:2,replanDelay:.35,yieldHold:.8};
const separation=(a:Point,b:Point)=>Math.hypot((a.x-b.x)/(SPACE.halfWidth*2+SPACE.gap),(a.y-b.y)/(SPACE.halfDepth*2+SPACE.gap));
export class UnitSpace {
 yielding=new Map<string,{goal:Point;settled:number}>();slots=new Map<string,{key:string;point:Point;anchor:Point}>();waits=new Map<string,number>();detours=0;yields=0;
 constructor(public units:()=>Occupant[],public nav:Navigation=SAMPLE_NAV){}
 clear(){this.yielding.clear();this.slots.clear();this.waits.clear();this.detours=0;this.yields=0;}
 free(p:Point,id:string,reservations=false){return segmentClear(p,p,this.nav)&&this.units().every(u=>u.id===id||u.hp<=0||separation(p,u)>=1)&&( !reservations||[...this.slots].every(([owner,s])=>owner===id||this.units().find(u=>u.id===owner)?.hp===0||separation(p,s.point)>=1));}
 friendClear(p:Point,id:string){const friend=this.units().find(u=>u.id===(id==='wukong'?'tang':id==='tang'?'wukong':''));return !friend||friend.hp<=0||Math.hypot((p.x-friend.x)/44,(p.y-friend.y)/40)>=1;}
 private lineFree(a:Point,b:Point,id:string){return this.units().every(u=>{if(u.id===id||u.hp<=0)return true;const ax=(a.x-u.x)/(SPACE.halfWidth*2+SPACE.gap),ay=(a.y-u.y)/(SPACE.halfDepth*2+SPACE.gap),dx=(b.x-a.x)/(SPACE.halfWidth*2+SPACE.gap),dy=(b.y-a.y)/(SPACE.halfDepth*2+SPACE.gap),t=Math.max(0,Math.min(1,-(ax*dx+ay*dy)/Math.max(.00001,dx*dx+dy*dy)));const closest=Math.hypot(ax+t*dx,ay+t*dy),start=Math.hypot(ax,ay);return closest>=.999||start<1.01&&closest>=start-.000001&&Math.hypot(ax+dx,ay+dy)>start+.00001;});}
 view(id:string):Navigation{return {...this.nav,walkable:(x,y)=>this.nav.walkable(x,y)&&(this.units().some(u=>u.id===id&&Math.floor(u.x/this.nav.tile)===x&&Math.floor(u.y/this.nav.tile)===y)||this.free({x:(x+.5)*this.nav.tile,y:(y+.5)*this.nav.tile},id)),segmentCheck:(a,b)=>(!this.nav.segmentCheck||this.nav.segmentCheck(a,b))&&this.lineFree(a,b,id)};}
 private reachable(p:Point,id:string){const own=this.units().find(u=>u.id===id);if(!own)return false;const nav=this.view(id);return distance(own,p)<1||segmentClear(own,p,nav)||!!smoothPath(own,p,nav).route.length;}
 endpoint(id:string,anchor:Point,preferred:Point,radii=[0,44,62,82],key='local'):Point|null{
  const old=this.slots.get(id);if(old&&old.key===key&&(!key.startsWith('melee-')||distance(old.point,anchor)<=62)&&distance(old.anchor,anchor)<18&&this.free(old.point,id,true)&&this.friendClear(old.point,id)&&segmentClear(anchor,old.point,this.nav)&&(key==='revive'||this.reachable(old.point,id)))return {...old.point};
  const base=Math.atan2(preferred.y-anchor.y,preferred.x-anchor.x),points:Point[]=[];
  for(const r of radii)for(const offset of r?[0,.45,-.45,.9,-.9,1.5,-1.5,Math.PI]:[0])points.push({x:anchor.x+Math.cos(base+offset)*r,y:anchor.y+Math.sin(base+offset)*r});
  points.sort((a,b)=>distance(a,preferred)-distance(b,preferred));
  for(const p of points){if(!this.free(p,id,true)||!this.friendClear(p,id)||!segmentClear(anchor,p,this.nav)||(key!=='revive'&&!this.reachable(p,id)))continue;this.slots.set(id,{key,point:{...p},anchor:{x:anchor.x,y:anchor.y}});return p;}return null;
 }
 command(id:string,m:SmoothMover,p:Point){if(!this.free(p,id)||!this.friendClear(p,id))p=this.endpoint(id,p,m.position,[58,78,98],'approach')??p;const view=this.view(id),plan=segmentClear(m.position,p,view)?{raw:[{...m.position},{...p}],route:[{...p}]}:smoothPath(m.position,p,view);if(!plan.route.length){const approach=smoothPath(m.position,p,this.nav);if(!approach.route.length)return false;plan.route=approach.route;plan.raw=approach.raw;}m.route=plan.route;m.raw=plan.raw;if(m.speed<1)m.heading=Math.atan2(m.route[0].y-m.position.y,m.route[0].x-m.position.x);return true;}
 step(id:string,m:SmoothMover,delta:number){let left=Math.min(.1,delta),moved=0,blocked=false;const destination=m.route.at(-1);
  while(left>1e-7){const dt=Math.min(left,1/120);left-=dt;const before={...m.position},route=[...m.route],travelled=m.travelled;const amount=m.update(dt);
   if(amount&&!this.lineFree(before,m.position,id)){m.position=before;m.route=route;m.speed=0;m.travelled=travelled;blocked=true;continue;}moved+=amount;
  }
  const wait=blocked?(this.waits.get(id)??0)+delta:0;this.waits.set(id,wait);
  if(blocked&&wait>=SPACE.replanDelay&&destination){this.waits.set(id,0);let goal=destination;if(!this.free(goal,id))goal=this.endpoint(id,destination,m.position,[44,62,82],'occupied-goal')??destination;if(this.command(id,m,goal))this.detours++;}
  const yielding=this.yielding.get(id);if(yielding&&!m.route.length){yielding.settled+=delta;if(yielding.settled>=SPACE.yieldHold){this.yielding.delete(id);this.command(id,m,yielding.goal);}}return moved;
 }
 // Voluntary, stable sidestep for an idle lower-priority unit. No pushing or teleport.
 yieldTo(id:string,m:SmoothMover,passing:Point,towards:Point){if(this.yielding.has(id)||distance(m.position,passing)>90)return false;const resume=m.route.at(-1)??{...m.position};const a=Math.atan2(towards.y-passing.y,towards.x-passing.x),origin={...m.position};
  for(const r of [46,64,84])for(const side of [1,-1,.7,-.7,1.3,-1.3,2]){const p={x:origin.x+Math.cos(a+side*Math.PI/2)*r,y:origin.y+Math.sin(a+side*Math.PI/2)*r};if(this.free(p,id,true)&&this.reachable(p,id)&&this.command(id,m,p)){this.yielding.set(id,{goal:{...resume},settled:0});this.yields++;return true;}}return false;
 }
}
