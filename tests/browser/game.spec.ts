import {test,expect} from '@playwright/test';
test('浏览器运行、点选绕山、战斗、失败、复活',async({page})=>{
 const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));await page.goto('/?test');await expect(page.locator('canvas')).toBeVisible();await page.waitForFunction(()=>!!(window as any).gameTest);
 await page.locator('[data-role="wukong"]').click();const box=(await page.locator('canvas').boundingBox())!;await page.mouse.click(box.x+15.5/30*box.width,box.y+9.5/18*box.height);
 await page.waitForFunction(()=>(window as any).gameTest.world.heroes[0].manual);expect(await page.evaluate(()=>{const w=(window as any).gameTest.world;return w.heroes[0].route.length})).toBeGreaterThan(7);
 const results=await page.evaluate(()=>{const api=(window as any).gameTest,w=api.reset();w.spawn({x:6.5,y:10.5});for(let i=0;i<30;i++)w.update(.1);const combat=w.kills>0;w.damage(w.heroes[4],999);const dismount=!w.mounted;for(let i=0;i<31;i++)w.update(.1);const revive=w.revive('horse');w.damage(w.tang,999);return {combat,dismount,revive,failed:w.failed};});expect(results).toEqual({combat:true,dismount:true,revive:true,failed:true});await expect(page.locator('#message')).toContainText('失败');expect(errors).toEqual([]);await page.evaluate(()=>(window as any).gameTest.reset());await page.waitForTimeout(700);await page.screenshot({path:'docs/p0-a-screenshot.png',fullPage:true});
});
