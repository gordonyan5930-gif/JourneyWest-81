import {test,expect} from '@playwright/test';import {writeFileSync,mkdirSync} from 'node:fs';import {acceptanceVideo,reviewScreenshot} from './evidence-capture';import {retry} from './escort-ui';
test.use({viewport:{width:1252,height:562},video:{mode:acceptanceVideo('strategy'),size:{width:1252,height:562}}});
test('round1 visible cues, decisions and consequences without hidden timing inputs',async({page})=>{
 test.setTimeout(420000);mkdirSync('reports',{recursive:true});const rows:any[]=[],errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const read=()=>page.evaluate(()=>{const q=(window as any).qualityTest;return {wall:Date.now(),cue:document.getElementById('strategy-cue')!.textContent,escort:q.escort,battle:q.battle,flight:q.choices,audio:q.audio};});
 const save=()=>writeFileSync('reports/strategy-round1-browser.json',JSON.stringify({sourceSha:process.env.SOURCE_SHA??'local-unpublished',viewport:{width:1252,height:562},renderer:'Canvas',audioTrack:false,realMac:false,humanBlindTest:false,method:'normal visible DOM cues, then800ms response plus actual UI overhead; readonly snapshots do not schedule commands; independent plays, NOT paired damage causality',rows,errors},null,2));
 await page.goto('/?sample=quality-b&play=escort&encounter=choices&profile=round1&renderer=canvas&test');await expect(page.locator('#sample-status')).toContainText('资产已载入');await page.locator('#escort-start').click();
 for(const action of ['stay','fly','cancel','staff','early-fly','peach']){
  if(action!=='stay')await retry(page);
  if(action==='stay'){await expect(page.locator('#strategy-cue')).toContainText(/近侧来敌|近侧正在交战|两路威胁/);}
  else{
   await page.locator('#target-archer-1').click();
   await expect(page.locator('#strategy-cue')).toContainText(action==='early-fly'?'两路威胁':action==='staff'?'选中查看破空击条件':'可选中飞袭抢先压制',{timeout:22000});
  }
  const cue=await read(page);await page.waitForTimeout(800);const input=await read(page);
  if(['fly','cancel','early-fly'].includes(action)){
   await page.locator('#flight-prepare').click();await expect(page.locator('#choice-confirm-text')).toContainText(/30能量.*悟空将离队/);await page.locator('#flight-confirm').click();
   if(action==='cancel'){await expect(page.locator('#choice-status')).toContainText('空中接近');await page.waitForTimeout(300);await page.locator('#flight-cancel').click();}
   else await expect(page.locator('#choice-status')).toContainText(/飞袭命中|飞袭落空/,{timeout:15000});
  }else if(action==='staff'){await page.locator('#sample-skill').click();}
  else if(action==='peach'){
   // Wait for the visible safe recovery window and actual injury, not a hidden clock.
   await expect(page.locator('#strategy-cue')).toContainText('威胁已解除',{timeout:35000});await page.waitForTimeout(800);await page.locator('#peach-select').click();await page.locator('#peach-pick').click();await expect(page.locator('#choice-status')).toContainText(/摘桃成功|不需要补血/,{timeout:20000});
  }
  const outcome=await read(page);await reviewScreenshot(page,{path:`reports/strategy-round1-${action}.png`});
  await expect(page.locator('#escort-result')).toContainText(/护送试段成功|护送失败/,{timeout:70000});const end=await read(page);rows.push({action,cue,input,inputLatencyMs:input.wall-cue.wall,outcome,end});save();
  if(action==='fly')expect(end.flight.hits).toBe(1);if(action==='cancel')expect(end.flight.hits).toBe(0);if(action==='staff')expect(end.escort.events.some((e:any)=>e.kind==='staff'&&e.amount>0)).toBe(true);
  await expect(page.locator('#strategy-cue')).not.toContainText(/可选中飞袭|查看破空击/);
 }
 await retry(page);const clean=await read(page);expect(clean.flight.active).toBe(false);expect(clean.flight.events).toHaveLength(0);expect(clean.flight.fruit).toBe(2);expect(clean.battle.energy).toBe(100);expect(clean.battle.shots).toBe(0);expect(clean.escort.manualHero).toBe(false);rows.push({action:'clean-retry',end:clean});save();expect(errors).toEqual([]);
});
test('round1 visible risky and safe peach decisions, explicit rally and clean retry',async({page})=>{
 test.setTimeout(220000);mkdirSync('reports',{recursive:true});const rows:any[]=[];const read=()=>page.evaluate(()=>{const q=(window as any).qualityTest;return {wall:Date.now(),cue:document.getElementById('strategy-cue')!.textContent,escort:q.escort,battle:q.battle,flight:q.choices};});const save=()=>writeFileSync('reports/strategy-round1-peach.json',JSON.stringify({sourceSha:process.env.SOURCE_SHA??'local-unpublished',method:'two independent visible-button runs; shared early-flight intent, NOT deterministic paired causality; no HP/clock writes',audioTrack:false,rows},null,2));
 await page.goto('/?sample=quality-b&play=escort&encounter=choices&profile=round1&renderer=canvas&test');await expect(page.locator('#sample-status')).toContainText('资产已载入');await page.locator('#escort-start').click();
 for(const timing of ['risky','safe']){
  if(timing==='safe')await retry(page);await page.locator('#target-archer-1').click();await expect(page.locator('#strategy-cue')).toContainText('两路威胁',{timeout:20000});await page.waitForTimeout(800);await page.locator('#flight-prepare').click();await page.locator('#flight-confirm').click();await expect(page.locator('#choice-status')).toContainText('恢复自动护卫',{timeout:20000});
  if(timing==='safe')await expect(page.locator('#strategy-cue')).toContainText('威胁已解除',{timeout:35000});else await expect(page.locator('#hud-party-status')).toContainText(/唐僧 [1-9]\d?\/100/,{timeout:10000});
  const cue=await read();await page.waitForTimeout(800);const input=await read();await page.locator('#peach-select').click();await page.locator('#peach-pick').click();await expect(page.locator('#choice-status')).toContainText(/摘桃成功|不需要补血/,{timeout:18000});const picked=await read();await page.locator('#wukong-rally').click();await expect(page.locator('#choice-status')).toContainText('恢复自动护卫',{timeout:18000});await reviewScreenshot(page,{path:`reports/strategy-round1-peach-${timing}.png`});await expect(page.locator('#escort-result')).toContainText(/护送试段成功|护送失败/,{timeout:70000});const end=await read();rows.push({timing,cue,input,inputLatencyMs:input.wall-cue.wall,picked,end});save();expect(end.flight.fruit).toBe(1);expect(end.flight.events.filter((e:any)=>e.kind==='picked')).toHaveLength(1);
 }
 await retry(page);const clean=await read();expect(clean.flight.events).toHaveLength(0);expect(clean.flight.fruit).toBe(2);expect(clean.battle.shots).toBe(0);expect(clean.battle.energy).toBe(100);rows.push({timing:'retry',end:clean});save();
});
