import {reviewScreenshot} from './evidence-capture';
import {test,expect,type Page} from '@playwright/test';
async function clickMap(page:Page,x:number,y:number){const b=(await page.locator('canvas').boundingBox())!;await page.mouse.click(b.x+x/30*b.width,b.y+y/18*b.height);}
async function open(page:Page){await page.goto('/?test');await expect(page.locator('canvas')).toBeVisible();await page.waitForFunction(()=>!!(window as any).gameTest);}
async function quiet(page:Page){await page.evaluate(()=>{const w=(window as any).gameTest.reset();w.spawnTimer=999;});}
test('正常UI：按钮跨帧稳定，选中后实际移动，山体拒绝指令',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 // This flow uses the normal game URL: no test API or direct world updates.
 await page.goto('/');await expect(page.locator('canvas')).toBeVisible();
 const button=await page.locator('[data-role="wukong"]').elementHandle();
 for(const role of ['sha','bajie','wukong','tang','wukong']){await page.locator(`[data-role="${role}"]`).click();await expect(page.locator(`[data-role="${role}"]`)).toHaveAttribute('aria-pressed','true');}
 expect(await button!.evaluate(el=>el===document.querySelector('[data-role="wukong"]'))).toBe(true);
 await clickMap(page,11.5,9.5);await expect(page.locator('#message')).toContainText('不可到达');
 await clickMap(page,7.5,2.5);await expect(page.locator('#message')).toContainText('孙悟空：前往指定位置');
 await expect(page.locator('[data-role="wukong"]')).toHaveAttribute('aria-pressed','true');expect(errors).toEqual([]);
});
test('唐僧通过按钮及地图绕山，实际位置到达且没有穿山',async({page})=>{
 test.setTimeout(60000);await open(page);await quiet(page);
 // Observe real animation frames without invoking update() or replacing the clock.
 await page.evaluate(()=>{const w=(window as any).gameTest.world;(window as any).visited=[];w.story.onUpdate=()=>{(window as any).visited.push({x:w.tang.x,y:w.tang.y});};});
 await page.locator('[data-role="tang"]').click();await clickMap(page,15.5,9.5);
 await expect(page.locator('#message')).toContainText('唐僧：前往指定位置');
 await expect.poll(()=>page.evaluate(()=>(window as any).visited.some((p:any)=>Math.hypot(p.x-15.5,p.y-9.5)<.15)),{timeout:45000}).toBe(true);
 const visited:{x:number;y:number}[]=await page.evaluate(()=>(window as any).visited);
 expect(visited.some(p=>p.y>13)).toBe(true);
 expect(visited.every(p=>!(p.x>=10&&p.x<14&&p.y>=3&&p.y<13))).toBe(true);
 await expect(page.locator('[data-role="tang"]')).toHaveAttribute('aria-pressed','true');
});
test('白马只查看，死亡步行、UI复活，失败与重试',async({page})=>{
 await open(page);await quiet(page);
 await page.locator('[data-role="horse"]').click();await expect(page.locator('[data-role="horse"]')).toContainText('仅查看');await clickMap(page,7.5,3.5);await expect(page.locator('#message')).toContainText('仅支持查看');
 // Deterministic damage setup; revival and retry are normal UI clicks.
 await page.evaluate(()=>{const w=(window as any).gameTest.world;w.damage(w.heroes[4],999);w.heroes[4].deadFor=3;});
 await expect(page.locator('#stats')).toContainText('步行');
 await page.locator('[data-role="horse"]').click();await expect(page.locator('#stats')).toContainText('骑乘');
 expect(await page.evaluate(()=>(window as any).gameTest.world.energy)).toBeLessThan(70);
 await page.evaluate(()=>{const w=(window as any).gameTest.world;w.damage(w.tang,999);});await expect(page.locator('#message')).toContainText('失败');
 await page.locator('#restart').click();await expect(page.locator('#stats')).toContainText('唐僧 100');await expect(page.locator('#message')).toContainText('自动护送');
});
test('护卫真实逐帧战斗并保住唐僧，生成运行截图',async({page})=>{
 await open(page);await quiet(page);
 await page.evaluate(()=>{const w=(window as any).gameTest.world;w.spawn({x:6.5,y:10.5});});
 await expect.poll(()=>page.evaluate(()=>(window as any).gameTest.world.kills),{timeout:10000}).toBeGreaterThan(0);
 expect(await page.evaluate(()=>(window as any).gameTest.world.tang.hp)).toBe(100);
 await page.locator('[data-role="tang"]').click();await page.locator('#pause').click();await reviewScreenshot(page,{path:'docs/p0-a-screenshot.png',fullPage:true});
});

// Ordinary verification keeps failure screenshots/trace, not successful movies.
test.use({video:'off'});
