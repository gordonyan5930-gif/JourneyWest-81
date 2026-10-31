import {describe,it,expect} from 'vitest';
import {World,path,terrain} from '../src/game/world';
describe('护送核心',()=>{
 it('山体阻挡、四邻路径绕山',()=>{const p=path({x:8.5,y:9.5},{x:15.5,y:9.5});expect(p.length).toBeGreaterThan(7);expect(p.every(n=>terrain(Math.floor(n.x),Math.floor(n.y))!=='mountain')).toBe(true);expect(path({x:8,y:9},{x:11,y:9})).toEqual([]);});
 it('默认队形和自动行进',()=>{const w=new World();expect(w.heroes.map(h=>h.x)).toEqual([6.5,5.5,4.5,3.5,4.5]);for(let i=0;i<30;i++)w.update(.1);expect(w.tang.x).toBeGreaterThan(4.5);});
 it('自动战斗伤害与护卫',()=>{const w=new World();w.spawn({x:6.5,y:10.5});for(let i=0;i<30;i++)w.update(.1);expect(w.kills).toBeGreaterThan(0);expect(w.tang.hp).toBe(100);});
 it('所有非唐僧角色可复活，白马死亡下马',()=>{for(const id of ['wukong','bajie','sha','horse']){const w=new World(),h=w.heroes.find(h=>h.id===id)!;w.damage(h,999);expect(w.failed).toBe(false);if(id==='horse')expect(w.mounted).toBe(false);expect(w.revive(id)).toBe(false);for(let i=0;i<31;i++)w.update(.1);expect(w.revive(id)).toBe(true);expect(w.energy).toBe(65);}});
 it('唐僧死亡即失败，停止模拟且不可复活',()=>{const w=new World();w.damage(w.tang,100);expect(w.failed).toBe(true);w.update(.1);expect(w.time).toBe(0);expect(w.revive('tang')).toBe(false);});
 it('能量不足不允许复活',()=>{const w=new World();w.damage(w.heroes[0],999);w.heroes[0].deadFor=4;w.energy=34;expect(w.revive('wukong')).toBe(false);});
});

describe('审查回归',()=>{
 it('唐僧持续执行手动路线，骑乘与步行使用正确速度',()=>{
  for(const mounted of [true,false]){const w=new World();w.spawnTimer=999;if(!mounted)w.damage(w.heroes[4],999);
   expect(w.command('tang',{x:4.5,y:3.5})).toBe(true);
   for(let i=0;i<10;i++)w.update(.1);
   expect(w.tang.x).toBeCloseTo(4.5);expect(w.tang.y).toBeCloseTo(9.5-(mounted?2.1:1.35));expect(w.tang.manual).toBe(true);
   if(mounted){expect(w.heroes[4].x).toBe(w.tang.x);expect(w.heroes[4].y).toBe(w.tang.y);}
  }
 });
 it('唐僧紧急避险后保留并恢复手动目的地',()=>{const w=new World();w.spawnTimer=999;w.command('tang',{x:4.5,y:3.5});w.spawn({x:4.5,y:10.5});w.update(.1);expect(w.tang.manualGoal).toEqual({x:4.5,y:3.5});expect(w.tang.y).toBeLessThan(9.5);w.enemies=[];for(let i=0;i<40&&w.tang.manual;i++)w.update(.1);expect(w.tang.y).toBeCloseTo(3.5);});
 it('白马拒绝独立移动命令',()=>{const w=new World();expect(w.command('horse',{x:7.5,y:3.5})).toBe(false);expect(w.heroes[4].manual).toBe(false);expect(w.message).toContain('随唐僧');});
});
