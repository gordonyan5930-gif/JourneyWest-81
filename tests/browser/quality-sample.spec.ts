import {reviewScreenshot} from './evidence-capture';
import {test,expect} from '@playwright/test';
import {mkdirSync,writeFileSync} from 'node:fs';
import {TERRAIN_REVIEW,reviewWorld} from '../../src/game/terrainReview';
test('real quality sample: generated assets, UI movement, follow camera, attack, mask, device report',async({page},testInfo)=>{
 test.setTimeout(120000);const errors:string[]=[];page.on('pageerror',e=>errors.push(e.message));
 const evidenceTag=testInfo.project.name; // Historical project name; captureVideoMode is off in this scenario.
 const renderer=testInfo.project.metadata.renderer==='canvas'?'canvas':'auto';await page.goto(`/?sample=quality-b&test&renderer=${renderer}`);
 await expect(page.locator('#sample-status')).toContainText('资产已载入',{timeout:20000});
 await page.locator('#sample-select').click();const box=(await page.locator('canvas').boundingBox())!;
 const camera=await page.evaluate(()=>(window as any).qualityTest.camera);
 await page.mouse.click(box.x+(600-camera.x)*camera.zoom/960*box.width,box.y+(550-camera.y)*camera.zoom/540*box.height);
 await expect(page.locator('#sample-status')).toContainText('正在按路线');
 await expect.poll(()=>page.evaluate(()=>(window as any).qualityTest.actor.x),{timeout:15000}).toBeGreaterThan(350);
 const clickWorld=async(x:number,y:number)=>{await page.locator('canvas').scrollIntoViewIfNeeded();const box=(await page.locator('canvas').boundingBox())!;const c=await page.evaluate(()=>(window as any).qualityTest.camera);await page.mouse.click(box.x+(x-c.x)*c.zoom/960*box.width,box.y+(y-c.y)*c.zoom/540*box.height);};
 await clickWorld(575,470);await expect.poll(()=>page.evaluate(()=>Math.hypot((window as any).qualityTest.actor.x-575,(window as any).qualityTest.actor.y-470)),{timeout:20000}).toBeLessThan(20);
 await clickWorld(230,640);await expect.poll(()=>page.evaluate(()=>Math.hypot((window as any).qualityTest.actor.x-230,(window as any).qualityTest.actor.y-640)),{timeout:20000}).toBeLessThan(20);
 await page.locator('#sample-go').click();await expect.poll(()=>page.evaluate(()=>(window as any).qualityTest.actor.x),{timeout:30000}).toBeGreaterThan(1350);
 await expect.poll(()=>page.evaluate(()=>(window as any).qualityTest.route.length),{timeout:15000}).toBe(0);
 expect(await page.evaluate(()=>(window as any).qualityTest.camera.x)).toBeGreaterThan(100);
 await page.locator('#sample-overview').click();await page.waitForTimeout(500);await clickWorld(380,500);await expect(page.locator('#sample-status')).toContainText('不可到达');
 await page.locator('#sample-attack').click();await expect(page.locator('#sample-status')).toContainText('棒击');
 mkdirSync('reports',{recursive:true});await reviewScreenshot(page,{path:`reports/quality-map-overview-${evidenceTag}.png`,fullPage:true});
 await page.locator('#sample-mask').click();expect(await page.evaluate(()=>(window as any).qualityTest.maskVisible)).toBe(true);expect(await page.evaluate(()=>(window as any).qualityTest.maskRenderType)).toBe('Image');
 mkdirSync('reports',{recursive:true});await reviewScreenshot(page,{path:`reports/quality-sample-mask-${evidenceTag}.png`,fullPage:true});await page.locator('#sample-mask').click();
 await page.locator('#sample-overview').click();await page.locator('#sample-reset').click();await page.waitForTimeout(900);await reviewScreenshot(page,{path:`reports/quality-sample-${evidenceTag}.png`,fullPage:true});
 for(const id of ['F01','F02','R01','W01']){const c=TERRAIN_REVIEW.find(c=>c.id===id)!;await page.locator('#sample-review').selectOption(id);await page.waitForTimeout(150);await reviewScreenshot(page,{path:`reports/terrain-${id}-art-${evidenceTag}.png`,fullPage:true});await page.locator('#sample-mask').click();await reviewScreenshot(page,{path:`reports/terrain-${id}-mask-${evidenceTag}.png`,fullPage:true});await page.locator('#sample-mask').click();const p=reviewWorld(c.source);await clickWorld(p.x,p.y);if(['fence','mountain'].includes(c.expected))await expect(page.locator('#sample-status')).toContainText('不可到达');else await expect.poll(()=>page.evaluate(({x,y})=>Math.hypot((window as any).qualityTest.actor.x-x,(window as any).qualityTest.actor.y-y),p),{timeout:15000}).toBeLessThan(20);}
 await page.locator('#sample-review').selectOption('');await page.locator('#sample-reset').click();
 await page.locator('#sample-frame').selectOption('6');await page.waitForTimeout(100);await reviewScreenshot(page,{path:`reports/quality-wukong-idle-${evidenceTag}.png`,fullPage:true});
 for(const frame of ['6','7','8','9','10','11','r0','r1','r2','r3','r4','r5','r6','r7']){await page.locator('#sample-frame').selectOption(frame);const actor=await page.evaluate(()=>(window as any).qualityTest.actor);expect(Math.abs(actor.registeredFootY-actor.y)).toBeLessThan(.5);}
 const frozen=await page.evaluate(()=>(window as any).qualityTest.actor.gaitDistance);await page.waitForTimeout(150);expect(await page.evaluate(()=>(window as any).qualityTest.actor.gaitDistance)).toBe(frozen);
 await reviewScreenshot(page,{path:`reports/quality-wukong-recovery-${evidenceTag}.png`,fullPage:true});
 await page.locator('#sample-reset').click();await expect(page.locator('#sample-frame')).toHaveValue('');
 const report=await page.evaluate(()=>(window as any).qualityTest.metrics);writeFileSync(`reports/quality-device-${evidenceTag}.json`,JSON.stringify(report,null,2));console.log('QUALITY_SAMPLE '+JSON.stringify({project:testInfo.project.name,...report}));expect(errors).toEqual([]);
});

test('feedback only: empty FPS sample and rejected fence preserve live route for one second',async({page},testInfo)=>{
 test.setTimeout(45000);mkdirSync('reports',{recursive:true});
 await page.addInitScript(()=>{(window as any).__metricText=[];new MutationObserver(()=>{const s=document.querySelector('#sample-metrics')?.textContent;if(s&&(window as any).__metricText.at(-1)!==s)(window as any).__metricText.push(s);}).observe(document,{childList:true,subtree:true,characterData:true});});
 const renderer=testInfo.project.metadata.renderer==='canvas'?'canvas':'auto';await page.goto(`/?sample=quality-b&test&renderer=${renderer}`);
 await expect(page.locator('#sample-status')).toContainText('资产已载入',{timeout:20000});
 const metricText=await page.evaluate(()=>(window as any).__metricText as string[]);expect(metricText.some(s=>s.includes('采样中'))).toBe(true);expect(metricText.some(s=>/Infinity|NaN/.test(s))).toBe(false);
 await expect(page.locator('#sample-metrics')).toContainText('FPS',{timeout:5000});
 const clickWorld=async(x:number,y:number)=>{await page.locator('canvas').scrollIntoViewIfNeeded();const box=(await page.locator('canvas').boundingBox())!;const c=await page.evaluate(()=>(window as any).qualityTest.camera);await page.mouse.click(box.x+(x-c.x)*c.zoom/960*box.width,box.y+(y-c.y)*c.zoom/540*box.height);};
 await page.locator('#sample-overview').click();await page.waitForTimeout(150);await clickWorld(150,820);
 await expect.poll(()=>page.evaluate(()=>Math.hypot((window as any).qualityTest.actor.x-150,(window as any).qualityTest.actor.y-820)),{timeout:15000}).toBeLessThan(2);
 await clickWorld(600,550);
 const box=(await page.locator('canvas').boundingBox())!,camera=await page.evaluate(()=>(window as any).qualityTest.camera);
 const rejectScreen={x:box.x+(150-camera.x)*camera.zoom/960*box.width,y:box.y+(860-camera.y)*camera.zoom/540*box.height};
 await page.evaluate(()=>{(window as any).__feedbackSamples=[];let start=0;document.querySelector('canvas')!.addEventListener('pointerdown',()=>{start=performance.now();const q=(window as any).qualityTest;(window as any).__beforeRejection=JSON.parse(JSON.stringify({route:q.route,actor:q.actor}));},{once:true,capture:true});const sample=()=>{if(start){const q=(window as any).qualityTest;(window as any).__feedbackSamples.push({ms:performance.now()-start,status:document.querySelector('#sample-status')!.textContent,remaining:q.route.length,marker:q.feedback.markerVisible});}if(!start||performance.now()-start<1800)requestAnimationFrame(sample);};requestAnimationFrame(sample);});

 await page.mouse.click(rejectScreen.x,rejectScreen.y);const rejectedAt=Date.now();
 const before=await page.evaluate(()=>(window as any).__beforeRejection);expect(before.route.length).toBeGreaterThan(0);
 await expect(page.locator('#sample-status')).toContainText('不可到达');
 const after=await page.evaluate(()=>({route:(window as any).qualityTest.route,actor:(window as any).qualityTest.actor,feedback:(window as any).qualityTest.feedback}));if(after.route.length)expect(after.route.at(-1)).toEqual(before.route.at(-1));else expect(Math.hypot(after.actor.x-before.route.at(-1).x,after.actor.y-before.route.at(-1).y)).toBeLessThan(2);expect(after.feedback).toEqual({markerVisible:true,rejectedAt:{x:expect.closeTo(150,-1),y:expect.closeTo(860,-1)}});
 // Keep screenshot capture out of the one-second timing window; video and RAF samples retain the rejection feedback.
 await page.waitForTimeout(1700);const samples=await page.evaluate(()=>(window as any).__feedbackSamples as {ms:number,status:string,remaining:number,marker:boolean}[]);
 writeFileSync(`reports/feedback-samples-${testInfo.project.name}.json`,JSON.stringify(samples));
 // Arrival time depends on device speed. The controlled-clock unit test covers arrival during the hold.
 expect(samples.some(s=>s.ms<950)).toBe(true);
 expect(samples.filter(s=>s.ms<950).every(s=>s.status.includes('不可到达')&&s.marker)).toBe(true);
 expect(samples.some(s=>s.ms>=1000&&s.ms<1800&&!s.marker&&!s.status.includes('不可到达'))).toBe(true);
 await expect(page.locator('#sample-status')).toContainText('已到达',{timeout:15000});
 expect(await page.evaluate(()=>(window as any).qualityTest.feedback.markerVisible)).toBe(false);
 expect(await page.evaluate(()=>Math.hypot((window as any).qualityTest.actor.x-600,(window as any).qualityTest.actor.y-550))).toBeLessThan(2);
 await reviewScreenshot(page,{path:`reports/feedback-expired-${testInfo.project.name}.png`,fullPage:true});
 writeFileSync(`reports/feedback-${testInfo.project.name}.json`,JSON.stringify({renderer,metricText,before,after,samples,arrivedDuringHold:samples.some(s=>s.ms<1000&&s.remaining===0),rejectionObservedMs:Date.now()-rejectedAt,environment:'automated Chromium; not user Mac/Edge acceptance'},null,2));
});

// Ordinary verification keeps failure screenshots/trace, not successful movies.
test.use({video:'off'});
