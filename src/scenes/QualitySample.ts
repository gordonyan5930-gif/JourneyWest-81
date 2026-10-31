import Phaser from 'phaser';
import frameData from '../../assets/quality-b/wukong-atlas.json';
import {path,type Point} from '../game/world';
import {SAMPLE_MAP,sampleWalkable,sampleTerrain,sampleSpeed,TERRAIN_COLORS} from '../game/sampleMap';
const imageUrl=new URL('../../assets/quality-b/terrace-map.webp',import.meta.url).href;
const spriteUrl=new URL('../../assets/quality-b/wukong-atlas.webp',import.meta.url).href;
const atlasUrl=new URL('../../assets/quality-b/wukong-atlas.json',import.meta.url).href;
export function startQualitySample(){
 document.querySelector('#app')!.innerHTML=`<header><span>西游 · 通关文牒</span><small>悟空 / 梯田入口 · 角色与地图试制，待审核</small></header><main class="sample-layout"><section><div id="game"></div><p id="sample-status" role="status">正在载入独立试制资产…</p><div class="sample-controls"><button id="sample-select" aria-pressed="true">孙悟空</button><button id="sample-go">走向梯田</button><button id="sample-attack">棒击样片</button><button id="sample-reset">归位</button><button id="sample-mask">地形蒙版</button><button id="sample-overview">全图对照</button><label>渲染器 <select id="sample-renderer"><option value="auto">WebGL / AUTO</option><option value="canvas">Canvas</option></select></label><label>逐帧检视 <select id="sample-frame"><option value="">播放动作</option><option value="0">帧1</option><option value="1">帧2</option><option value="2">帧3</option><option value="3">帧4</option><option value="4">帧5</option><option value="5">帧6</option><option value="6">帧7</option><option value="7">帧8</option><option value="8">帧9</option><option value="9">帧10</option><option value="10">帧11</option><option value="11">帧12</option></select></label><button id="sample-export">导出本机采样</button></div><p id="sample-metrics"></p><small>点地面移动，镜头跟随；攻击只展示动作。此入口不代表少女剧情、全角色动画或完整战斗已完成。蒙版颜色：金=路，绿=草地，深绿=树林，青=浅溪；红=山石，紫=悬崖，蓝=深水。地形边缘仍待人工审核。</small></section></main>`;
 const renderer=new URLSearchParams(location.search).get('renderer')??'auto';
 const select=document.querySelector('#sample-renderer') as HTMLSelectElement;select.value=renderer;select.onchange=()=>{const u=new URL(location.href);u.searchParams.set('renderer',select.value);location.href=u.href;};
 let scene:SampleScene;const frames:number[]=[];let last=0;let ticks=0;
 const status=(s:string)=>document.querySelector('#sample-status')!.textContent=s;
 class SampleScene extends Phaser.Scene{
  actor!:Phaser.GameObjects.Sprite;ink!:Phaser.GameObjects.Graphics;maskLayer!:Phaser.GameObjects.Graphics;route:Point[]=[];attacking=false;lastMetrics=0;overview=false;
  preload(){this.load.image('sample-map',imageUrl);this.load.atlas('sample-wukong',spriteUrl,atlasUrl);this.load.on('loaderror',()=>status('资产载入失败，请刷新并查看网络状态'));}
  create(){scene=this;this.add.image(0,0,'sample-map').setOrigin(0).setDisplaySize(1600,900);this.ink=this.add.graphics();this.maskLayer=this.add.graphics().setDepth(8).setVisible(false);
   for(let y=0;y<Math.ceil(900/SAMPLE_MAP.tile);y++)for(let x=0;x<1600/SAMPLE_MAP.tile;x++){this.maskLayer.fillStyle(TERRAIN_COLORS[sampleTerrain(x,y)],sampleWalkable(x,y)?.32:.18);this.maskLayer.fillRect(x*SAMPLE_MAP.tile,y*SAMPLE_MAP.tile,SAMPLE_MAP.tile,SAMPLE_MAP.tile);}
   this.anims.create({key:'sample-run',frames:[0,1,2,3,4,5].map(i=>({key:'sample-wukong',frame:String(i)})),frameRate:12,repeat:-1});
   this.anims.create({key:'sample-idle',frames:[6,7].map(i=>({key:'sample-wukong',frame:String(i)})),frameRate:2,repeat:-1});
   this.anims.create({key:'sample-strike',frames:[8,9,10,11].map(i=>({key:'sample-wukong',frame:String(i)})),frameRate:10,repeat:0});
   this.actor=this.add.sprite(240,720,'sample-wukong','6').setScale(.34).setDepth(5);this.actor.play('sample-idle');this.alignActor();this.actor.on('animationupdate',()=>this.alignActor());
   document.querySelector('#sample-frame')!.addEventListener('change',(e)=>{const value=(e.target as HTMLSelectElement).value;this.route=[];this.attacking=false;if(value==='')this.actor.play('sample-idle');else {this.actor.anims.stop();this.actor.setFrame(value);this.alignActor();status('逐帧检视 · 实际游戏尺寸与固定脚点');}});
   this.cameras.main.setBounds(0,0,1600,900).setZoom(.8).startFollow(this.actor,true,.08,.08);
   this.actor.on('animationcomplete',(animation:Phaser.Animations.Animation)=>{if(animation.key==='sample-strike'){this.attacking=false;this.actor.play(this.route.length?'sample-run':'sample-idle');}});
   this.input.on('pointerdown',(pointer:Phaser.Input.Pointer)=>this.command({x:pointer.worldX,y:pointer.worldY}));
   document.querySelector('#sample-go')!.addEventListener('click',()=>this.command(SAMPLE_MAP.destination));
   document.querySelector('#sample-attack')!.addEventListener('click',()=>this.attack());
   document.querySelector('#sample-reset')!.addEventListener('click',()=>{this.route=[];this.attacking=false;this.releaseInspection();this.actor.setPosition(240,720).setFlipX(false).play('sample-idle');status('已归位 · 点地面移动');});
   document.querySelector('#sample-overview')!.addEventListener('click',()=>{this.overview=!this.overview;if(this.overview)this.cameras.main.stopFollow().setZoom(.6).centerOn(800,450);else this.cameras.main.setZoom(.8).startFollow(this.actor,true,.08,.08);});
   document.querySelector('#sample-mask')!.addEventListener('click',()=>this.maskLayer.setVisible(!this.maskLayer.visible));
   status('资产已载入 · 点击山路或草地肩部移动');
  }
  releaseInspection(){(document.querySelector('#sample-frame') as HTMLSelectElement).value='';}
  alignActor(){const f=frameData.frames[String(this.actor.frame.name) as keyof typeof frameData.frames];if(f)this.actor.setOrigin(f.pivot.x,f.pivot.y);}
  command(p:Point){const goal={x:Math.floor(p.x/SAMPLE_MAP.tile),y:Math.floor(p.y/SAMPLE_MAP.tile)};if(!sampleWalkable(goal.x,goal.y)){status('山体、深谷或非通行区不可到达');return false;}
   const route=path({x:this.actor.x/SAMPLE_MAP.tile,y:this.actor.y/SAMPLE_MAP.tile},goal,sampleWalkable);if(!route.length){status('已在目标附近');return false;}this.releaseInspection();this.route=route.map(p=>({x:p.x*SAMPLE_MAP.tile,y:p.y*SAMPLE_MAP.tile}));if(!this.attacking)this.actor.play('sample-run',true);status('悟空正在按路线前进 · 镜头跟随');return true;
  }
  attack(){if(this.attacking)return;this.releaseInspection();this.attacking=true;this.actor.play('sample-strike');status('棒击动作试制 · 不对不存在的敌人结算伤害');}
  update(now:number,delta:number){if(!this.actor)return;
   if(last&&delta>0){frames.push(delta);if(frames.length>3600)frames.shift();}last=now;ticks++;
   if(!this.attacking&&this.route.length){let budget=Math.min(delta/1000,.1)*210*sampleSpeed(this.actor.x,this.actor.y);while(budget>0&&this.route.length){const p=this.route[0],dx=p.x-this.actor.x,dy=p.y-this.actor.y,d=Math.hypot(dx,dy),step=Math.min(budget,d);if(d>0){this.actor.x+=dx/d*step;this.actor.y+=dy/d*step;if(Math.abs(dx)>.1)this.actor.setFlipX(dx<0);}budget-=step;if(d<=step+.001)this.route.shift();}if(!this.route.length){this.actor.play('sample-idle');status('已到达 · 可继续点选路线或查看棒击');}}
   this.ink.clear().lineStyle(2,0xf2d788,.9).strokeEllipse(this.actor.x,this.actor.y,50,18);if(this.route.length){this.ink.lineStyle(2,0xe3d5a0,.6).beginPath().moveTo(this.actor.x,this.actor.y);for(const p of this.route)this.ink.lineTo(p.x,p.y);this.ink.strokePath();}
   if(now-this.lastMetrics>1000){const avg=frames.reduce((a,b)=>a+b,0)/Math.max(1,frames.length);document.querySelector('#sample-metrics')!.textContent=`本页采样 ${Math.round(1000/avg)} FPS · ${renderer==='canvas'?'Canvas':'AUTO'} · ${frames.length} 帧（非正式性能验收）`;this.lastMetrics=now;}
  }
 }
 const game=new Phaser.Game({type:renderer==='canvas'?Phaser.CANVAS:Phaser.AUTO,width:960,height:540,parent:'game',scene:SampleScene,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH},backgroundColor:'#23372e'});
 const snapshot=()=>({sample:'quality-b-wukong-map',renderer:game.renderer.type,userAgent:navigator.userAgent,hardwareConcurrency:navigator.hardwareConcurrency,frames:frames.length,averageFps:frames.length?1000/(frames.reduce((a,b)=>a+b,0)/frames.length):null,p95FrameMs:frames.length?[...frames].sort((a,b)=>a-b)[Math.floor(frames.length*.95)]:null,heapUsedBytes:(performance as any).memory?.usedJSHeapSize??null,ticks,productQualityApproved:false});
 document.querySelector('#sample-export')!.addEventListener('click',()=>{const a=document.createElement('a');a.href=URL.createObjectURL(new Blob([JSON.stringify(snapshot(),null,2)],{type:'application/json'}));a.download=`journeywest-device-${renderer}.json`;a.click();setTimeout(()=>URL.revokeObjectURL(a.href),0);});
 if(new URLSearchParams(location.search).has('test'))Object.assign(window,{qualityTest:{get actor(){return scene?.actor?{x:scene.actor.x,y:scene.actor.y,frame:scene.actor.frame.name,registeredFootY:scene.actor.y+(scene.actor.frame.pivotY*scene.actor.frame.height-scene.actor.displayOriginY)*scene.actor.scaleY,animation:scene.actor.anims.currentAnim?.key}:null},get route(){return scene?.route??[]},get camera(){return {x:scene.cameras.main.worldView.x,y:scene.cameras.main.worldView.y,zoom:scene.cameras.main.zoom}},get metrics(){return snapshot()},get maskVisible(){return scene?.maskLayer.visible},terrainAt(x:number,y:number){return sampleTerrain(Math.floor(x/SAMPLE_MAP.tile),Math.floor(y/SAMPLE_MAP.tile))}}});
}
