import type {Point} from './world';
// Screen-independent world label lanes. Bodies keep their foot-sorted depth.
export function unitLabels(units:(Point&{id:string})[]){const placed:Point[]=[],result=new Map<string,Point>();for(const u of [...units].sort((a,b)=>a.y-b.y||a.id.localeCompare(b.id))){let p={x:u.x,y:u.y-116};for(let lane=0;lane<5;lane++){const candidate={x:u.x,y:u.y-116-lane*25};if(!placed.some(q=>Math.abs(q.x-candidate.x)<82&&Math.abs(q.y-candidate.y)<24)){p=candidate;break;}}placed.push(p);result.set(u.id,p);}return result;}
