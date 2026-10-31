import Phaser from 'phaser';
import {World,terrain,CONFIG} from './game/world';
import './style.css';
const app=document.querySelector('#app')!;
app.innerHTML=`<header><span>西游 · 通关文牒</span><small>第一难试炼 / 白骨岭</small><b>P0-A 可玩原型</b></header><main><aside><p>西行之路 · 护送试炼</p><h1>白骨岭</h1><p>山雾深处，白骨伏行。<br>守住唐僧，择路向西。</p><div id="stats"></div><button id="regroup">全队归阵</button><button id="pause">暂停 / 继续</button><button id="restart">重新出发</button><h3>行军手记</h3><p>点选下方角色或地图人物，再点击地面。金色路线表示主动指令。</p><p>树林、浅水减速；山体无法穿越。倒地 3 秒后可消耗 35 能量复活。</p><small>本阶段到达出口仅结束护送演示，尚不授予通关印章。</small></aside><section><div id="game"></div><div id="message" role="status"></div><div id="heroes"></div></section></main><footer>山路 / 草地 / 树林 / 浅水可行　　▲ 山体阻挡　　保护唐僧 · 战术干预 · 自动战斗</footer>`;
let world=new World(),selected='wukong';
const colors:Record<string,number>={road:0xb59a65,grass:0x627e52,forest:0x355f46,water:0x69a4a2,mountain:0x465250};
class Ridge extends Phaser.Scene{
 ink!:Phaser.GameObjects.Graphics;labels:Phaser.GameObjects.Text[]=[];
 create(){this.ink=this.add.graphics();this.input.on('pointerdown',(p:Phaser.Input.Pointer)=>{const x=p.x/32,y=p.y/32;const h=world.heroes.filter(h=>h.hp>0).find(h=>Math.hypot(h.x-x,h.y-y)<.65&&h.role!=='horse');if(h){selected=h.id;}else world.command(selected,{x,y});});}
 update(_t:number,delta:number){world.update(delta/1000);const g=this.ink;g.clear();for(const l of this.labels)l.destroy();this.labels=[];
 const text=(x:number,y:number,s:string,size=12,color='#fff4d6')=>this.labels.push(this.add.text(x,y,s,{fontSize:`${size}px`,fontFamily:'sans-serif',color}).setOrigin(.5));
 for(let y=0;y<18;y++)for(let x=0;x<30;x++){const t=terrain(x,y);g.fillStyle(colors[t]);g.fillRect(x*32,y*32,32,32);if(t==='mountain'){g.fillStyle(0x606a61);g.fillTriangle(x*32,y*32+31,x*32+16,y*32+2,x*32+32,y*32+31);g.lineStyle(1,0x899184,.5);g.lineBetween(x*32+16,y*32+2,x*32+24,y*32+20);}if(t==='forest'){g.fillStyle(0x254b37);g.fillTriangle(x*32+4,y*32+27,x*32+16,y*32+1,x*32+29,y*32+27);}if(t==='water'){g.lineStyle(1,0xb9d5c4,.5);g.lineBetween(x*32+4,y*32+16,x*32+25,y*32+13);}}
 text(875,294,'出口',15);text(80,295,'入岭',14);
 const chosen=world.heroes.find(h=>h.id===selected)!;if(chosen.route.length){g.lineStyle(2,0xffd47b,.8);g.beginPath();g.moveTo(chosen.x*32,chosen.y*32);for(const p of chosen.route)g.lineTo(p.x*32,p.y*32);g.strokePath();}
 for(const u of [...world.enemies,...world.heroes.filter(h=>h.role!=='horse')]){const x=u.x*32,y=u.y*32;if(u.hp<=0){text(x,y,'倒地',11,'#c1b9aa');continue;}g.fillStyle(0x152c27,.3);g.fillEllipse(x,y+12,27,10);
 if(u.role==='tang'&&world.mounted){g.fillStyle(0xe8e5d3);g.fillRoundedRect(x-17,y+2,34,13,5);g.fillTriangle(x+13,y+6,x+19,y-12,x+23,y+9);g.lineStyle(3,0xd8d8c7);g.lineBetween(x-10,y+12,x-13,y+23);g.lineBetween(x+9,y+12,x+12,y+23);}
 const c=u.role==='wukong'?0xdcad44:u.role==='bajie'?0xa66c75:u.role==='sha'?0x4f8991:u.role==='tang'?0xd9773e:0xc5c9b4;g.fillStyle(c);g.fillTriangle(x-12,y+12,x,y-13,x+12,y+12);g.fillStyle(u.role?0xe9bd8b:0xe8e4cc);g.fillCircle(x,y-10,7);g.fillStyle(0x30372d);g.fillCircle(x-2,y-11,1.5);g.fillCircle(x+3,y-11,1.5);
 if(u.role==='tang'){g.fillStyle(0xf3ce68);g.fillTriangle(x-6,y-15,x,y-25,x+6,y-15);}else{g.lineStyle(3,u.role==='wukong'?0xf1cb60:0x8c6243);g.lineBetween(x+13,y-18,x+13,y+16);}
 if(u.id===selected){g.lineStyle(2,0xffd47b);g.strokeEllipse(x,y+13,32,15);}g.fillStyle(0x25382d);g.fillRect(x-16,y-29,32,4);g.fillStyle(u.role?0x98cd79:0xdb7965);g.fillRect(x-16,y-29,32*u.hp/u.max,4);text(x,y+32,u.name,10);}
 if(world.failed){g.fillStyle(0x17251e,.85);g.fillRect(170,210,620,130);text(480,250,'护送失败',32);text(480,300,'唐僧已阵亡 · 点击「重新出发」再试',18);}
 document.querySelector('#message')!.textContent=world.message;document.querySelector('#stats')!.innerHTML=`<p>护送 ${world.mounted?'骑乘':'步行'} · 击退 ${world.kills}</p><h2>灵力 ${Math.floor(world.energy)} / 100</h2><p>唐僧 ${world.tang.hp} / ${world.tang.max}</p>`;
 document.querySelector('#heroes')!.innerHTML=world.heroes.map(h=>`<button data-role="${h.id}" class="${selected===h.id?'selected':''}">${h.name}<small>${h.hp>0?`${h.hp}/${h.max}`:h.deadFor<3?'等待复活': '复活 · 35灵力'}</small></button>`).join('');
 }
}
new Phaser.Game({type:Phaser.AUTO,width:960,height:576,parent:'game',backgroundColor:'#627e52',scene:Ridge,scale:{mode:Phaser.Scale.FIT,autoCenter:Phaser.Scale.CENTER_BOTH}});
document.querySelector('#heroes')!.addEventListener('click',e=>{const b=(e.target as HTMLElement).closest('button');if(b){selected=b.dataset.role!;world.revive(selected);}});
document.querySelector('#regroup')!.addEventListener('click',()=>world.regroup());document.querySelector('#pause')!.addEventListener('click',()=>world.paused=!world.paused);document.querySelector('#restart')!.addEventListener('click',()=>world=new World());
if(new URLSearchParams(location.search).has('test'))Object.assign(window,{gameTest:{get world(){return world},reset(){world=new World();return world;}}});
