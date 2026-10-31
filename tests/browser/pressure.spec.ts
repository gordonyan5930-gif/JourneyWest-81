import {test,expect} from '@playwright/test';
import {writeFileSync,mkdirSync} from 'node:fs';
test('25名普通敌人真实帧压力：连续伤害、下马、自然失败与证据',async({page},testInfo)=>{
 test.setTimeout(90000);
 await page.goto('/?test');await expect(page.locator('canvas')).toBeVisible();
 await page.waitForFunction(()=>!!(window as any).gameTest);
 await page.evaluate(()=>{
  const w=(window as any).gameTest.reset();const samples:any[]=[];let previous=performance.now();
  (window as any).pressureSamples=samples;
  // Test-only encounter setup. All stats and combat/death logic remain unchanged.
  for(let i=0;i<25;i++){const a=i*2*Math.PI/25;w.spawn({x:w.tang.x+2*Math.cos(a),y:w.tang.y+2*Math.sin(a)});}
  w.story.onUpdate=()=>{const now=performance.now();samples.push({frameMs:now-previous,simTime:w.time,enemies:w.enemies.length,tangHp:w.tang.hp,horseHp:w.heroes[4].hp});previous=now;};
 });
 expect(await page.evaluate(()=>(window as any).gameTest.world.enemies.length)).toBeGreaterThanOrEqual(25);
 await page.screenshot({path:'reports/pressure-start.png'});
 await expect(page.locator('#message')).toContainText('失败',{timeout:70000});
 const samples:any[]=await page.evaluate(()=>(window as any).pressureSamples);
 expect(samples.some(s=>s.horseHp===0)).toBe(true);
 expect(new Set(samples.map(s=>s.tangHp)).size).toBeGreaterThan(2);
 expect(samples.at(-1).tangHp).toBe(0);
 const dense=samples.filter(s=>s.enemies>=12&&s.frameMs>0);expect(dense.length).toBeGreaterThan(10);
 const times=dense.map(s=>s.frameMs).sort((a,b)=>a-b);
 const avg=times.reduce((a,b)=>a+b,0)/times.length,p95=times[Math.floor((times.length-1)*.95)];
 // A severe responsiveness regression guard, not the product 60fps acceptance target.
 expect(p95).toBeLessThan(1000);
 const report={scenario:'developer-encounter-25-normal-enemies',surface:'local-vite-Chromium',sourceSha:process.env.SOURCE_SHA??'local',directDamageUsed:false,normalCampaignQualityValidated:false,samples:dense.length,averageFps:1000/avg,p95FrameMs:p95,productTarget:{averageFps:55,p95FrameMs:25},observedFrameThresholdsMet:1000/avg>=55&&p95<=25,productQualityApproved:false,device:process.env.CI?'GitHub Actions Linux runner; not user MacBook':'Local browser; hardware not inventoried',videoEvidence:'Playwright video attachment after context teardown; see HTML report',timeline:samples};
 console.log('PRESSURE_EVIDENCE '+JSON.stringify({samples:report.samples,averageFps:report.averageFps,p95FrameMs:report.p95FrameMs,observedFrameThresholdsMet:report.observedFrameThresholdsMet,simulatedSeconds:samples.at(-1).simTime,tangHp:samples.at(-1).tangHp,normalCampaignQualityValidated:false}));
 mkdirSync('reports',{recursive:true});writeFileSync('reports/pressure.json',JSON.stringify(report,null,2));
 await testInfo.attach('pressure-metrics',{body:JSON.stringify(report),contentType:'application/json'});
 await page.screenshot({path:'reports/pressure-failure.png'});
});
