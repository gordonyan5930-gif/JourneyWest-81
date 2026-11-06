import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
test('separate render baseline and bounded scene object allocation',async({page},testInfo)=>{
 test.setTimeout(45000);await page.goto(testInfo.project.metadata.renderer==='canvas'?'/?test&renderer=canvas':'/?test');await expect(page.locator('canvas')).toBeVisible();await page.waitForFunction(()=>!!(window as any).gameTest?.profile);
 await page.evaluate(()=>{const w=(window as any).gameTest.reset();for(let i=0;i<25;i++){const a=i*2*Math.PI/25;w.spawn({x:w.tang.x+2*Math.cos(a),y:w.tang.y+2*Math.sin(a)});}});
 const data=await page.evaluate(()=>new Promise<any>(resolve=>{
  const samples:any[]=[];let previous=performance.now();const start=previous;
  function frame(now:number){const api=(window as any).gameTest;samples.push({frameMs:now-previous,...api.profile,enemies:api.world.enemies.length});previous=now;if(now-start<5000)requestAnimationFrame(frame);else resolve({samples,rendererInfo:(window as any).gameTest.rendererInfo,userAgent:navigator.userAgent,hardwareConcurrency:navigator.hardwareConcurrency,heapUsedBytes:(performance as any).memory?.usedJSHeapSize??null});}requestAnimationFrame(frame);
 }));
 const frames=data.samples.slice(1).filter((s:any)=>s.frameMs>0);expect(frames.length).toBeGreaterThan(10);
 const sorted=frames.map((s:any)=>s.frameMs).sort((a:number,b:number)=>a-b),avg=sorted.reduce((a:number,b:number)=>a+b,0)/sorted.length;
 expect(Math.max(...frames.map((s:any)=>s.textObjects))).toBeLessThanOrEqual(40);
 expect(Math.max(...frames.map((s:any)=>s.sceneObjects))).toBeLessThanOrEqual(45);
 const mean=(key:string)=>frames.reduce((sum:number,s:any)=>sum+s[key],0)/frames.length;
 const report={captureVideoMode:'off',mode:testInfo.project.name,rendererInfo:data.rendererInfo,sourceSha:process.env.SOURCE_SHA??'local',samples:frames.length,averageFps:1000/avg,p95FrameMs:sorted[Math.floor(sorted.length*.95)],meanLogicMs:mean('logicMs'),meanDrawMs:mean('drawMs'),meanDomMs:mean('domMs'),maxTextObjects:Math.max(...frames.map((s:any)=>s.textObjects)),maxSceneObjects:Math.max(...frames.map((s:any)=>s.sceneObjects)),peakEnemies:Math.max(...frames.map((s:any)=>s.enemies)),minEnemies:Math.min(...frames.map((s:any)=>s.enemies)),hardwareConcurrency:data.hardwareConcurrency,userAgent:data.userAgent,heapUsedBytes:data.heapUsedBytes,durationMs:5000,productQualityApproved:false};
 mkdirSync('reports',{recursive:true});writeFileSync(`reports/${testInfo.project.name}.json`,JSON.stringify(report,null,2));console.log('RENDER_BASELINE '+JSON.stringify(report));
});

// Ordinary verification keeps failure screenshots/trace, not successful movies.
test.use({video:'off'});
