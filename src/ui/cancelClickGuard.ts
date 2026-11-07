type PointerLike={clientX:number;clientY:number;button?:number;detail?:number;pointerId?:number};
/** A one-shot cancelled-button re-click, never a global input cooldown. */
export class CancelClickGuard {
 private last:{x:number;y:number;until:number;pointerId?:number}|null=null;
 clear(){this.last=null;}
 cancel(e:PointerLike,now:number){
  this.last=e.detail===0?null:{x:e.clientX,y:e.clientY,until:now+250,pointerId:e.pointerId};
 }
 absorbs(e:PointerLike,now:number){
  const last=this.last;this.clear();if(!last)return false;
  return now<=last.until&&(e.button??0)===0&&e.detail!==1&&Math.hypot(e.clientX-last.x,e.clientY-last.y)<=6&&
   (last.pointerId===undefined||e.pointerId===undefined||e.pointerId===last.pointerId);
 }
}
