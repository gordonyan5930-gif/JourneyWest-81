import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {state,fresh,riskyPost,observeInputs} from './escort-ui';
test('normal risky orders: Wukong takes bow damage, falls, retries and manually revives under scheme B',async({page},info)=>{
 test.setTimeout(200000);mkdirSync('reports',{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?sample=quality-b&play=escort&test');await expect(page.locator('#sample-status')).toContainText('资产已载入',{timeout:20000});await observeInputs(page);await page.locator('#escort-start').click();await fresh(page);
 await riskyPost(page);const down=await state(page);expect(down.battle.tang.hp).toBeGreaterThan(0);expect(down.escort.finished).toBe(false);await page.screenshot({path:`reports/autonomy-down-${info.project.name}.png`,fullPage:true});
 await page.locator('#escort-retry').click();const downReset=await fresh(page);
 await riskyPost(page);await expect(page.locator('#wukong-revive')).toBeEnabled({timeout:6000});await page.locator('#wukong-revive').click();const revive=await page.evaluate(()=>(window as any).__inputLog.at(-1));expect(revive.after.hero).toBe(180);expect(revive.after.tang).toBe(revive.before.tang);expect(revive.before.energy-revive.after.energy).toBeCloseTo(35);expect(revive.after.revives).toBe(1);
 await page.screenshot({path:`reports/autonomy-revive-${info.project.name}.png`,fullPage:true});await expect.poll(()=>page.evaluate(()=>(window as any).qualityTest.escort.phase),{timeout:80000}).toBe('won');const result=await state(page);expect(result.escort.revives).toBe(1);expect(result.battle.tang.hp).toBeGreaterThan(0);expect(result.escort.meleeHits).toBeGreaterThan(0);await page.screenshot({path:`reports/autonomy-revived-success-${info.project.name}.png`,fullPage:true});
 writeFileSync(`reports/autonomy-revival-${info.project.name}.json`,JSON.stringify({source:'normal movement, skill, retry and revive buttons only; no HP writes',down,downReset,revive,result,inputLog:await page.evaluate(()=>(window as any).__inputLog),metrics:await page.evaluate(()=>(window as any).qualityTest.metrics),productQualityApproved:false},null,2));expect(errors).toEqual([]);
});
