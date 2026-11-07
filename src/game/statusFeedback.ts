// Presentation-only wall-clock state; never changes movement or combat.
export class StatusFeedback {
 until=0;private current='';private deferred='';
 constructor(private now:()=>number,private render:(text:string)=>void){}
 show(text:string,deferDuringRejection=false){
  if(deferDuringRejection&&this.now()<this.until){this.deferred=text;return;}
  this.deferred='';if(text!==this.current){this.current=text;this.render(text);}
 }
 reject(text:string){const resume=this.now()<this.until?this.deferred:this.current;this.show(text);this.deferred=resume;this.until=this.now()+1000;}
 tick(){if(this.deferred&&this.now()>=this.until)this.show(this.deferred);}
}
