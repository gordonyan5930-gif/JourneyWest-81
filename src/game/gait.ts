export const RUN_STRIDE=160;
// Advance on actual ground distance, not wall time. Forest/shallows and slow
// frames must not play the same leg cycle faster than the actor travels.
export function runFrame(distance:number){return Math.floor(((distance%RUN_STRIDE+RUN_STRIDE)%RUN_STRIDE)/RUN_STRIDE*8)%8;}

export const GAIT={wukong:{stride:112,maxSpeed:210},tang:{stride:80,maxSpeed:70},stopHold:.08,turnHold:.12,turnDistance:4};
/** Display-only observer. Never drives physics and never reads resettable mover totals. */
export class GroundGait {
 travelled=0;phase=0;speed=0;delta=0;left=false;walking=false;starts=0;stops=0;flips=0;ignoredDistance=0;
 private previous:{x:number;y:number}|null=null;private permitted=false;private idle=0;private candidate=false;private turnAge=0;private turnTravel=0;
 constructor(public stride:number,public maxSpeed:number){}
 reset(){this.travelled=0;this.phase=0;this.speed=0;this.delta=0;this.left=false;this.walking=false;this.starts=0;this.stops=0;this.flips=0;this.ignoredDistance=0;this.previous=null;this.permitted=false;this.idle=0;this.turnAge=0;this.turnTravel=0;}
 observe(p:{x:number;y:number},dt:number,allowed=true){const prior=this.previous;this.previous={x:p.x,y:p.y};dt=Math.max(.001,Math.min(.1,dt));const dx=prior?p.x-prior.x:0,dy=prior?p.y-prior.y:0,d=Math.hypot(dx,dy),valid=allowed&&this.permitted&&d<=this.maxSpeed*dt+2;this.permitted=allowed;this.delta=valid?d:0;this.speed=this.delta/dt;
  if(!valid)this.ignoredDistance+=d;this.travelled+=this.delta;this.phase=(this.travelled%this.stride)/this.stride;
  const moving=this.delta>.025;if(moving){this.idle=0;if(!this.walking)this.starts++;this.walking=true;if(Math.abs(dx)>this.delta*.35){const side=dx<0;if(side!==this.candidate){this.candidate=side;this.turnAge=0;this.turnTravel=0;}this.turnAge+=dt;this.turnTravel+=Math.abs(dx);if(side!==this.left&&this.turnAge>=GAIT.turnHold&&this.turnTravel>=GAIT.turnDistance){this.left=side;this.flips++;}}}else {this.idle+=dt;if((!allowed||this.idle>=GAIT.stopHold)&&this.walking){this.walking=false;this.stops++;}}
  return this;
 }
 get frame(){return Math.min(7,Math.floor(this.phase*8));}
 snapshot(){return {travelled:this.travelled,phase:this.phase,frame:this.frame,speed:this.speed,delta:this.delta,left:this.left,walking:this.walking,starts:this.starts,stops:this.stops,flips:this.flips,ignoredDistance:this.ignoredDistance,stride:this.stride};}
}
