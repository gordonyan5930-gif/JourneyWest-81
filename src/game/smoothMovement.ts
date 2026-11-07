import type {Point} from './world';
import {SAMPLE_MAP,sampleWalkable,sampleSpeed,sampleGeometryClear} from './sampleMap';
export type Navigation={tile:number;walkable:(x:number,y:number)=>boolean;speed:(x:number,y:number)=>number;segmentCheck?:(a:Point,b:Point)=>boolean};
export const SAMPLE_NAV:Navigation={tile:SAMPLE_MAP.tile,walkable:sampleWalkable,speed:sampleSpeed,segmentCheck:sampleGeometryClear};
export const MOVE={speed:210,acceleration:620,deceleration:820,turnRate:7,cornerRadius:24,substep:1/120,arrival:1.5};
export const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
export const angleDelta=(a:number,b:number)=>Math.atan2(Math.sin(a-b),Math.cos(a-b));
// Exact supercover grid traversal. Equal boundary times also test BOTH orthogonal
// cells, so diagonal movement/LOS cannot squeeze between touching blockers.
export function segmentClear(a:Point,b:Point,nav:Navigation=SAMPLE_NAV){
 if(nav.segmentCheck&&!nav.segmentCheck(a,b))return false;
 const t=nav.tile;let x=Math.floor(a.x/t),y=Math.floor(a.y/t);const ex=Math.floor(b.x/t),ey=Math.floor(b.y/t);
 if(!nav.walkable(x,y)||!nav.walkable(ex,ey))return false;
 const dx=b.x-a.x,dy=b.y-a.y,sx=Math.sign(dx),sy=Math.sign(dy),tx=dx?Math.abs(t/dx):Infinity,ty=dy?Math.abs(t/dy):Infinity;
 let mx=dx?((sx>0?(x+1)*t:x*t)-a.x)/dx:Infinity,my=dy?((sy>0?(y+1)*t:y*t)-a.y)/dy:Infinity;
 for(let i=0;i<20000;i++){if(x===ex&&y===ey)return true;if(Math.abs(mx-my)<1e-10){if(!nav.walkable(x+sx,y)||!nav.walkable(x,y+sy))return false;x+=sx;y+=sy;mx+=tx;my+=ty;}else if(mx<my){x+=sx;mx+=tx;}else{y+=sy;my+=ty;}if(!nav.walkable(x,y))return false;}return false;
}
export function eightPath(start:Point,end:Point,nav:Navigation=SAMPLE_NAV):Point[]{
 if(!segmentClear(start,start,nav)||!segmentClear(end,end,nav))return [];
 const tile=nav.tile,s={x:Math.floor(start.x/tile),y:Math.floor(start.y/tile)},e={x:Math.floor(end.x/tile),y:Math.floor(end.y/tile)};
 if(!nav.walkable(s.x,s.y)||!nav.walkable(e.x,e.y))return [];
 if(s.x===e.x&&s.y===e.y)return segmentClear(start,end,nav)?[{...start},{...end}]:[];
 const key=(p:Point)=>`${p.x},${p.y}`,heuristic=(p:Point)=>{const dx=Math.abs(p.x-e.x),dy=Math.abs(p.y-e.y);return Math.max(dx,dy)+(Math.SQRT2-1)*Math.min(dx,dy);};
 const open=[s],scores=new Map([[key(s),0]]),previous=new Map<string,Point>(),closed=new Set<string>();
 while(open.length){let best=0;for(let i=1;i<open.length;i++)if(scores.get(key(open[i]))!+heuristic(open[i])<scores.get(key(open[best]))!+heuristic(open[best]))best=i;
  const p=open.splice(best,1)[0],k=key(p);if(closed.has(k))continue;closed.add(k);
  if(p.x===e.x&&p.y===e.y){const nodes:Point[]=[];let n:Point|undefined=p;while(n){nodes.unshift({x:(n.x+.5)*tile,y:(n.y+.5)*tile});n=previous.get(key(n));}nodes[0]={...start};nodes.push({...end});return nodes.slice(1).every((n,i)=>segmentClear(nodes[i],n,nav))?nodes:[];}
  for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1],[1,1],[-1,1],[1,-1],[-1,-1]]){const n={x:p.x+dx,y:p.y+dy},nk=key(n);if(closed.has(nk)||!nav.walkable(n.x,n.y)||(dx&&dy&&(!nav.walkable(p.x+dx,p.y)||!nav.walkable(p.x,p.y+dy))))continue;if(p.x===s.x&&p.y===s.y&&!segmentClear(start,{x:(n.x+.5)*tile,y:(n.y+.5)*tile},nav))continue;if(nav.segmentCheck&&!nav.segmentCheck({x:(p.x+.5)*tile,y:(p.y+.5)*tile},{x:(n.x+.5)*tile,y:(n.y+.5)*tile}))continue;const cost=scores.get(k)!+(dx&&dy?Math.SQRT2:1);if(cost<(scores.get(nk)??Infinity)){scores.set(nk,cost);previous.set(nk,p);open.push(n);}}
 }return [];
}
export function smoothPath(start:Point,end:Point,nav:Navigation=SAMPLE_NAV){
 const raw=eightPath(start,end,nav);if(!raw.length)return {raw,route:[] as Point[]};
 const pulled=[raw[0]];for(let i=0;i<raw.length-1;){let j=raw.length-1;while(j>i+1&&!segmentClear(raw[i],raw[j],nav))j--;pulled.push(raw[j]);i=j;}
 const rounded=[pulled[0]];
 for(let i=1;i<pulled.length-1;i++){const a=pulled[i-1],b=pulled[i],c=pulled[i+1],r=Math.min(MOVE.cornerRadius,distance(a,b)/3,distance(b,c)/3);const l=distance(a,b),m=distance(b,c);if(l<.01||m<.01){rounded.push(b);continue;}
  const enter={x:b.x+(a.x-b.x)*r/l,y:b.y+(a.y-b.y)*r/l},exit={x:b.x+(c.x-b.x)*r/m,y:b.y+(c.y-b.y)*r/m};
  const arc=[enter,...Array.from({length:8},(_,j)=>{const t=(j+1)/8,u=1-t;return {x:u*u*enter.x+2*u*t*b.x+t*t*exit.x,y:u*u*enter.y+2*u*t*b.y+t*t*exit.y};})];
  if([rounded[rounded.length-1],...arc,c].slice(1).every((p,j)=>segmentClear([rounded[rounded.length-1],...arc,c][j],p,nav)))rounded.push(...arc);else rounded.push(b);
 }
 rounded.push(pulled[pulled.length-1]);return {raw,route:rounded.slice(1)};
}
export class SmoothMover {
 position:Point;route:Point[]=[];raw:Point[]=[];speed=0;heading=0;travelled=0;blockedSteps=0;
 constructor(position:Point,public nav:Navigation=SAMPLE_NAV){this.position={...position};}
 reset(p:Point){this.position={...p};this.route=[];this.raw=[];this.speed=0;this.heading=0;this.travelled=0;this.blockedSteps=0;}
 command(p:Point){const plan=smoothPath(this.position,p,this.nav);if(!plan.route.length)return false;this.route=plan.route;this.raw=plan.raw;if(this.speed<1)this.heading=Math.atan2(this.route[0].y-this.position.y,this.route[0].x-this.position.x);return true;}
 update(delta:number){let time=Math.min(delta,.1),moved=0;
  while(time>1e-7){const dt=Math.min(time,MOVE.substep);time-=dt;if(!this.route.length){this.speed=Math.max(0,this.speed-MOVE.deceleration*dt);continue;}
   while(this.route.length>1&&distance(this.position,this.route[0])<Math.max(14,this.speed*.08)&&segmentClear(this.position,this.route[1],this.nav))this.route.shift();
   const target=this.route[0],d=distance(this.position,target);let remaining=d;for(let i=1;i<this.route.length;i++)remaining+=distance(this.route[i-1],this.route[i]);
   const desired=Math.atan2(target.y-this.position.y,target.x-this.position.x),turn=Math.abs(angleDelta(desired,this.heading));const targetSpeed=Math.min(MOVE.speed*this.nav.speed(this.position.x,this.position.y)*(turn>1.2?0:Math.max(.35,Math.cos(turn))),Math.sqrt(2*MOVE.deceleration*remaining),MOVE.turnRate*d*.45);
   this.speed+=Math.max(-MOVE.deceleration*dt,Math.min(MOVE.acceleration*dt,targetSpeed-this.speed));this.heading+=Math.max(-MOVE.turnRate*dt,Math.min(MOVE.turnRate*dt,angleDelta(desired,this.heading)));
   const step=Math.min(d,this.speed*dt);let candidate={x:this.position.x+Math.cos(this.heading)*step,y:this.position.y+Math.sin(this.heading)*step};
   if(d<=Math.max(MOVE.arrival,step)){candidate={...target};this.route.shift();}else if(!segmentClear(this.position,candidate,this.nav)||!segmentClear(candidate,target,this.nav)){this.blockedSteps++;this.speed=Math.min(this.speed,55);candidate={x:this.position.x+Math.cos(desired)*Math.min(d,this.speed*dt),y:this.position.y+Math.sin(desired)*Math.min(d,this.speed*dt)};this.heading=desired;}
   if(segmentClear(this.position,candidate,this.nav)){const amount=distance(this.position,candidate);this.position=candidate;this.travelled+=amount;moved+=amount;}else{this.speed=0;break;}
   if(!this.route.length)this.speed=0;
  }return moved;
 }
}
