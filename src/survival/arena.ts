import {segmentClear,type Navigation} from '../game/smoothMovement';
export type Point={x:number;y:number};
export const ARENA={width:2240,height:1440,tile:20,start:{x:970,y:820},tree:{x:1120,y:740},exit:{x:2070,y:720}};
// Independent prototype ground: the painted tiles and collision share these exact regions.
export const ROCKS=[{x:570,y:390,w:180,h:170},{x:1450,y:350,w:190,h:170},{x:650,y:1030,w:180,h:160},{x:1510,y:1020,w:210,h:180}];
export function legal(p:Point,r=12){return p.x>=40+r&&p.y>=40+r&&p.x<=ARENA.width-40-r&&p.y<=ARENA.height-40-r&&!ROCKS.some(b=>p.x>b.x-r&&p.x<b.x+b.w+r&&p.y>b.y-r&&p.y<b.y+b.h+r);}
export function terrain(p:Point){return p.x>970&&p.x<1060&&p.y>170&&p.y<1260?'shallow':p.x>1760&&p.y>300&&p.y<1100?'forest':'grass';}
export const NAV:Navigation={tile:20,walkable:(x,y)=>legal({x:x*20+10,y:y*20+10},22),speed:(x,y)=>terrain({x,y})==='shallow'?.65:terrain({x,y})==='forest'?.8:1,segmentCheck:(a,b)=>{const n=Math.ceil(Math.hypot(b.x-a.x,b.y-a.y)/5);for(let i=0;i<=n;i++)if(!legal({x:a.x+(b.x-a.x)*i/Math.max(1,n),y:a.y+(b.y-a.y)*i/Math.max(1,n)}))return false;return true;}};
export const clear=(a:Point,b:Point)=>segmentClear(a,b,NAV);
export function move(p:Point,dx:number,dy:number){const next={x:p.x+dx,y:p.y+dy};if(clear(p,next))return next;const x={x:p.x+dx,y:p.y},y={x:p.x,y:p.y+dy};return clear(p,x)?x:clear(p,y)?y:{...p};}
export function connectedCells(){const todo=[{x:50,y:40}],seen=new Set<string>();while(todo.length){const p=todo.pop()!,key=`${p.x},${p.y}`;if(seen.has(key)||!NAV.walkable(p.x,p.y))continue;seen.add(key);for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]])todo.push({x:p.x+dx,y:p.y+dy});}let total=0;for(let y=0;y<72;y++)for(let x=0;x<112;x++)if(NAV.walkable(x,y))total++;return {connected:seen.size,total,area:total*400};}
