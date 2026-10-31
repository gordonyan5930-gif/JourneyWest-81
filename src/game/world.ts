export type Point={x:number;y:number};
export const CONFIG={width:30,height:18,tile:32,speed:2.1,walkSpeed:1.35,energyRegen:5,reviveCost:35,reviveDelay:3,attackPeriod:.8};
export type Terrain='road'|'grass'|'forest'|'water'|'mountain';
export const terrain=(x:number,y:number):Terrain=> x<0||y<0||x>=30||y>=18||((x>=10&&x<=13&&y>=3&&y<=12)||(x>=21&&x<=24&&y>=7&&y<=16))?'mountain':y===9||y===10?'road':x>=17&&x<=18?'water':(x<7&&y<6)||(x>24&&y<6)?'forest':'grass';
export const NAV_METRICS={searches:0};
export function path(start:Point,end:Point):Point[]{
 NAV_METRICS.searches++;
 const sx=Math.floor(start.x),sy=Math.floor(start.y),ex=Math.floor(end.x),ey=Math.floor(end.y);
 if(terrain(ex,ey)==='mountain')return [];
 const key=(x:number,y:number)=>`${x},${y}`, q=[{x:sx,y:sy}], prev=new Map<string,Point|null>([[key(sx,sy),null]]);
 for(let i=0;i<q.length;i++){const p=q[i];if(p.x===ex&&p.y===ey){const out:Point[]=[];let n:Point|null=p;while(n){out.unshift({x:n.x+.5,y:n.y+.5});n=prev.get(key(n.x,n.y))??null;}return out.slice(1);}
 for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]){const n={x:p.x+dx,y:p.y+dy},k=key(n.x,n.y);if(!prev.has(k)&&terrain(n.x,n.y)!=='mountain'){prev.set(k,p);q.push(n);}}}return [];
}
export type Role='wukong'|'bajie'|'tang'|'sha'|'horse';
export interface Unit extends Point {id:string;name:string;role?:Role;hp:number;max:number;attack:number;route:Point[];manual:boolean;manualGoal?:Point;navigationTarget?:string;navigationVersion?:number;deadFor:number;cooldown:number;}
export interface StoryExtension {onUpdate?:(world:World,dt:number)=>void;onReachExit?:(world:World)=>void;}
const distance=(a:Point,b:Point)=>Math.hypot(a.x-b.x,a.y-b.y);
export class World {
 terrainVersion=0;
 invalidateNavigation(){this.terrainVersion++;}
 heroes:Unit[]=[];enemies:Unit[]=[];energy=100;failed=false;reachedExit=false;time=0;kills=0;spawnTimer=4;message='自动护送中 · 点选角色，再点击地面改变路线';paused=false;
 constructor(public story:StoryExtension={}){const roles:Role[]=['wukong','bajie','tang','sha','horse'];const names=['孙悟空','猪八戒','唐僧','沙和尚','白龙马'];this.heroes=roles.map((role,i)=>({id:role,role,name:names[i],x:[6.5,5.5,4.5,3.5,4.5][i],y:9.5,hp:[180,160,100,150,130][i],max:[180,160,100,150,130][i],attack:[28,18,0,20,0][i],route:[],manual:false,deadFor:0,cooldown:0}));}
 get tang(){return this.heroes[2]} get mounted(){return this.heroes[4].hp>0} get speed(){return this.mounted?CONFIG.speed:CONFIG.walkSpeed}
 command(id:string,p:Point){const h=this.heroes.find(u=>u.id===id);if(!h||h.hp<=0||this.failed)return false;if(h.role==='horse'){this.message='白龙马随唐僧移动，仅支持查看状态与复活';return false;}const route=path(h,p);if(!route.length){this.message='此处不可到达，请选择可通行地形';return false;}h.route=route;h.navigationTarget=`${Math.floor(p.x)},${Math.floor(p.y)}`;h.navigationVersion=this.terrainVersion;h.manual=true;h.manualGoal={...route[route.length-1]};this.message=`${h.name}：前往指定位置`;return true;}
 regroup(){for(const h of this.heroes){h.manual=false;h.manualGoal=undefined;h.route=[];h.navigationTarget=undefined;}this.message='恢复自动护送队形';}
 damage(u:Unit,n:number){if(this.failed||u.hp<=0)return;u.hp=Math.max(0,u.hp-n);if(u.hp===0){u.deadFor=0;u.route=[];if(u.role==='tang'){this.failed=true;this.message='护送失败 · 唐僧已阵亡';}else if(!u.role)this.kills++;}}
 revive(id:string){const h=this.heroes.find(u=>u.id===id);if(!h||h.role==='tang'||h.hp>0||h.deadFor<CONFIG.reviveDelay||this.energy<CONFIG.reviveCost||this.failed)return false;this.energy-=CONFIG.reviveCost;h.hp=h.max;h.x=this.tang.x;h.y=this.tang.y;h.manual=false;h.manualGoal=undefined;h.route=[];h.navigationTarget=undefined;this.message=`${h.name}已复活`;return true;}
 spawn(p:Point){if(terrain(Math.floor(p.x),Math.floor(p.y))==='mountain')return;this.enemies.push({id:`bone-${this.time}-${this.enemies.length}`,name:'白骨兵',...p,hp:65,max:65,attack:9,route:[],manual:false,deadFor:0,cooldown:0});}
 move(u:Unit,target:Point,dt:number,speed:number){if(distance(u,target)<.0001){u.route=[];return;}const key=`${Math.floor(target.x)},${Math.floor(target.y)}`;if(u.navigationTarget!==key||u.navigationVersion!==this.terrainVersion){u.route=path(u,target);u.navigationTarget=key;u.navigationVersion=this.terrainVersion;}const ground=terrain(Math.floor(u.x),Math.floor(u.y));let budget=dt*speed*(ground==='forest'?.8:ground==='water'?.65:1);while(budget>0&&u.route.length){const n=u.route[0],d=distance(u,n);const step=Math.min(d,budget);if(d>0){u.x+=(n.x-u.x)/d*step;u.y+=(n.y-u.y)/d*step;}budget-=step;if(d<=step+.001)u.route.shift();} }
 update(dt:number){if(this.failed||this.paused)return;dt=Math.min(dt,.1);this.time+=dt;this.energy=Math.min(100,this.energy+dt*CONFIG.energyRegen);for(const h of this.heroes)if(h.hp<=0)h.deadFor+=dt;
 this.spawnTimer-=dt;if(this.spawnTimer<=0){const offsets=[{x:4,y:3},{x:-3,y:-3},{x:3,y:-4}];const o=offsets[Math.floor(this.time/7)%3];this.spawn({x:Math.max(.5,Math.min(29.5,Math.floor(this.tang.x+o.x)+.5)),y:Math.max(.5,Math.min(17.5,Math.floor(this.tang.y+o.y)+.5))});this.spawnTimer=7;}
 const live=this.enemies.filter(e=>e.hp>0);const threat=live.find(e=>distance(e,this.tang)<4);
 for(const h of this.heroes){if(h.hp<=0||h.role==='horse')continue;h.cooldown-=dt;
 const target=live.filter(e=>distance(e,this.tang)<5||distance(e,h)<2).sort((a,b)=>distance(a,this.tang)-distance(b,this.tang))[0];
 if(h.attack&&target&&(!h.manual||distance(h,target)<1.4)){if(distance(h,target)<1.25){h.route=[];h.navigationTarget=undefined;if(h.cooldown<=0){this.damage(target,h.attack);h.cooldown=CONFIG.attackPeriod;}}else{this.move(h,target,dt,3);}continue;}
 // Tang temporarily evades immediate danger, then resumes the player's destination.
 if(h.role==='tang'&&threat&&distance(h,threat)<1.8){
  const escape=[{x:Math.floor(h.x)-.5,y:Math.floor(h.y)+.5},{x:Math.floor(h.x)+.5,y:Math.floor(h.y)-.5},{x:Math.floor(h.x)+.5,y:Math.floor(h.y)+1.5}]
   .filter(p=>terrain(Math.floor(p.x),Math.floor(p.y))!=='mountain').sort((a,b)=>distance(b,threat)-distance(a,threat));
  if(escape[0])this.move(h,escape[0],dt,this.speed);continue;
 }
 if(h.manual){
  if(h.manualGoal)this.move(h,h.manualGoal,dt,h.role==='tang'?this.speed:3);
  if(!h.route.length){h.manual=false;h.manualGoal=undefined;}continue;
 }
 if(h.role==='tang'){if(threat){const choices=[{x:h.x-1,y:h.y},{x:h.x,y:h.y-1},{x:h.x,y:h.y+1}].filter(p=>terrain(Math.floor(p.x),Math.floor(p.y))!=='mountain').sort((a,b)=>distance(b,threat)-distance(a,threat));if(choices[0]){this.move(h,choices[0],dt,this.speed);}}else if(!this.reachedExit){this.move(h,{x:28.5,y:9.5},dt,this.speed);if(h.x>28){this.reachedExit=true;this.message='P0-A 护送演示到达终点 · 完整通关条件将在 P0-B 实现';this.story.onReachExit?.(this);}}}
 else {const offset=h.role==='wukong'?2:h.role==='bajie'?1:-1;const p={x:Math.max(.5,Math.min(29.5,this.tang.x+offset)),y:this.tang.y};if(distance(h,p)>.6){this.move(h,p,dt,3);}}
 }
 const horse=this.heroes[4];if(horse.hp>0){horse.x=this.tang.x;horse.y=this.tang.y;}
 for(const e of live){if(e.hp<=0)continue;e.cooldown-=dt;const guards=this.heroes.filter(h=>h.hp>0&&h.attack>0&&distance(h,e)<1.5);const victim=guards[0]??(this.mounted?horse:this.tang);if(distance(e,victim)<1.2){if(e.cooldown<=0){this.damage(victim,e.attack);e.cooldown=1;}}else {this.move(e,victim,dt,1.6);}}
 this.enemies=this.enemies.filter(e=>e.hp>0);this.story.onUpdate?.(this,dt);
 }
}
