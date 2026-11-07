import type {Point} from './world';
export const MAP_VIEW={width:1600,height:900,top:118,bottom:88};
/** Normal combat covers the viewport; overview deliberately centers letterboxing. */
export function combatCamera(width:number,height:number,units:Point[],overview=false){
 const w=Math.max(1,width),h=Math.max(1,height),xs=units.map(p=>p.x),ys=units.map(p=>p.y),minX=Math.min(...xs),maxX=Math.max(...xs),minY=Math.min(...ys),maxY=Math.max(...ys);
 const cover=Math.max(w/MAP_VIEW.width,h/MAP_VIEW.height),fit=Math.min(w/MAP_VIEW.width,h/MAP_VIEW.height);
 const zoom=overview?fit:Math.max(cover,Math.min(1.15,w/(maxX-minX+210),Math.max(120,h-MAP_VIEW.top-MAP_VIEW.bottom)/(maxY-minY+160)));
 const clamp=(n:number,lo:number,hi:number)=>Math.max(lo,Math.min(hi,n));
 return {zoom,x:overview?800:clamp((minX+maxX)/2,w/zoom/2,1600-w/zoom/2),y:overview?450:clamp((minY+maxY)/2-(MAP_VIEW.top-MAP_VIEW.bottom)/2/zoom,h/zoom/2,900-h/zoom/2),letterbox:overview};
}
