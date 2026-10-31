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
