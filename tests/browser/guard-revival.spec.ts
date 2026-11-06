import {reviewScreenshot} from './evidence-capture';
import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {state,fresh,riskyPost,observeInputs,retry} from './escort-ui';
test.use({viewport:{width:1280,height:800}});
test('normal risky orders: Wukong takes bow damage, falls, retries and manually revives under scheme B',async({page},info)=>{
 test.setTimeout(300000);mkdirSync('reports',{recursive:true});const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 await page.goto('/?sample=quality-b&play=escort&test');await expect(page.locator('#sample-status')).toContainText('资产已载入',{timeout:20000});await observeInputs(page);await page.locator('#escort-start').click();await fresh(page);
 await riskyPost(page);const down=await state(page);expect(down.battle.tang.hp).toBeGreaterThan(0);expect(down.escort.finished).toBe(false);await reviewScreenshot(page,{path:`reports/autonomy-down-${info.project.name}.png`,fullPage:true});
 await retry(page);const downReset=await fresh(page);
 await riskyPost(page);await expect(page.locator('#wukong-revive')).toBeEnabled({timeout:6000});await page.locator('#wukong-revive').click();const revive=await page.evaluate(()=>(window as any).__inputLog.at(-1));expect(revive.after.hero).toBe(180);expect(revive.after.tang).toBe(revive.before.tang);expect(revive.before.energy-revive.after.energy).toBeCloseTo(35);expect(revive.after.revives).toBe(1);
 await reviewScreenshot(page,{path:`reports/autonomy-revive-${info.project.name}.png`,fullPage:true});await page.waitForFunction(()=>(window as any).qualityTest.escort.finished,null,{timeout:80000});const result=await state(page);writeFileSync('reports/revival-diagnostic.json',JSON.stringify({revive,result},null,2));expect(['won','lost']).toContain(result.escort.phase);expect(result.escort.revives).toBe(1);if(result.escort.phase==='won'){expect(result.battle.tang.hp).toBeGreaterThan(0);expect(result.escort.meleeHits).toBeGreaterThan(0);}else {expect(result.battle.tang.hp).toBe(0);expect(result.escort.events.filter((e:any)=>e.kind==='arrow'&&e.target==='tang').reduce((n:number,e:any)=>n+e.amount,0)).toBe(100);}await reviewScreenshot(page,{path:`reports/autonomy-revived-outcome-${info.project.name}.png`,fullPage:true});
 writeFileSync(`reports/autonomy-revival-${info.project.name}.json`,JSON.stringify({source:'normal movement, skill, retry and revive buttons only; no HP writes',down,downReset,revive,result,inputLog:await page.evaluate(()=>(window as any).__inputLog),metrics:await page.evaluate(()=>(window as any).qualityTest.metrics),productQualityApproved:false},null,2));expect(errors).toEqual([]);
});

// Ordinary verification keeps failure screenshots/trace, not successful movies.
test.use({video:'off'});
