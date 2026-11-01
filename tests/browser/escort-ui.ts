import {expect,type Page} from '@playwright/test';
export async function clickWorld(page:Page,x:number,y:number){if(await page.locator('#play-menu').count()){if((await page.locator('#sample-overview').textContent())?.includes('全景地图')){if(!await page.locator('#play-menu').evaluate(e=>(e as HTMLDetailsElement).open))await page.locator('#play-menu>summary').click();await page.locator('#sample-overview').click();}if(await page.locator('#play-menu').evaluate(e=>(e as HTMLDetailsElement).open))await page.locator('#play-menu>summary').click();}await page.waitForFunction(()=>!(window as any).qualityTest.camera.moving);await page.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));const box=(await page.locator('canvas').boundingBox())!,c=await page.evaluate(()=>(window as any).qualityTest.camera);await page.mouse.click(box.x+(x-c.x)*c.zoom/(c.width??960)*box.width,box.y+(y-c.y)*c.zoom/(c.height??540)*box.height,{button:'right'});}
export async function state(page:Page){return page.evaluate(()=>({escort:(window as any).qualityTest.escort,battle:(window as any).qualityTest.battle,actor:(window as any).qualityTest.actor}));}
export async function fresh(page:Page){const s=await state(page);expect(s.escort.phase).toBe('approach');expect(s.battle.failed).toBe(false);expect(s.escort.heroHp).toBe(180);expect(s.battle.tang.hp).toBe(100);expect(s.battle.energy).toBe(100);expect(s.battle.cooldown).toBe(0);expect(s.battle.shots).toBe(0);expect(s.escort.enemies.map((a:any)=>a.hp)).toEqual([100,100]);expect(s.escort.meleeHits).toBe(0);expect(s.escort.revives).toBe(0);expect(s.escort.sosCount).toBe(0);expect(s.escort.selectedEnemyId).toBe('');await expect(page.locator('#escort-result')).toBeEmpty();return s;}
// Regression interrupt coverage: prepare aim normally before the next visible bow draw.
// No game/clock writes. Ordinary two-click reaction evidence remains in quality-polish.spec.ts.
export async function spell(page:Page,id:string){
 await page.evaluate(async()=>{(window as any).__regressionNav=await import('/src/game/smoothMovement.ts');});
 await page.locator(`#target-${id}`).click({timeout:2000});await expect(page.locator(`#target-${id}`)).toHaveAttribute('aria-pressed','true');await expect(page.locator('#sample-skill')).toBeEnabled({timeout:8000});await page.locator('#sample-skill').click();await expect(page.locator('#sample-skill')).toHaveAttribute('aria-pressed','true');const box=(await page.locator(`#target-${id}`).boundingBox())!;await page.mouse.move(box.x+box.width/2,box.y+box.height/2);
 const ready=await page.waitForFunction((id)=>{const q=(window as any).qualityTest,a=q.escort.enemies.find((a:any)=>a.id===id);return a&&a.hp>0&&a.windup>1.9&&q.battle.cooldown<=0&&Math.hypot(q.actor.x-a.x,q.actor.y-a.y)<400&&(window as any).__regressionNav.segmentClear(q.escort.hero,a)?{hero:q.escort.hero,time:q.escort.time,target:a}:false;},id,{timeout:18000,polling:'raf'});
 await page.mouse.click(box.x+box.width/2,box.y+box.height/2);const before=await ready.jsonValue(),after=await state(page);console.log('SKILL_BOUNDARY '+JSON.stringify({id,before,after:{hero:after.escort.hero,casting:after.escort.casting,cooldown:after.battle.cooldown,time:after.escort.time},text:await page.locator('#sample-status').textContent()}));}


export async function observeInputs(page:Page){await page.evaluate(()=>{
 (window as any).__inputLog=[];
 for(const id of ['escort-retry','wukong-rally','wukong-revive']){
  const button=document.getElementById(id)!;let pending:any;
  const read=()=>{const q=(window as any).qualityTest;return {shots:q.battle.shots,hero:q.escort.heroHp,tang:q.battle.tang.hp,energy:q.battle.energy,cooldown:q.battle.cooldown,revives:q.escort.revives,x:q.actor.x,y:q.actor.y,phase:q.escort.phase};};
  // Register both phases before any click. Never dynamically attach during dispatch,
  // and never mistake a previous Retry record for the current command.
  button.addEventListener('click',()=>{pending={id,before:read(),after:null};(window as any).__inputLog.push(pending);},{capture:true});
  button.addEventListener('click',()=>{if(pending)pending.after=read();});
 }
});}

export async function riskyPost(page:Page){
   await clickWorld(page,900,550);await expect.poll(()=>page.evaluate(()=>Math.hypot((window as any).qualityTest.actor.x-900,(window as any).qualityTest.actor.y-550)),{timeout:14000}).toBeLessThan(8);
   for(let casts=0;casts<2;casts++){const before=await state(page);if(before.escort.enemies[0].hp<=0)break;try{await spell(page,'archer-1');}catch(error){if((await state(page)).escort.enemies[0].hp>0)throw error;console.log('RISK_TARGET_ALREADY_DEAD');break;}await expect.poll(async()=>{const s=await state(page);return s.escort.enemies[0].hp<=0||s.battle.hits>before.battle.hits;},{timeout:6000}).toBe(true);}
   expect((await state(page)).escort.enemies[0].hp).toBe(0);if((await state(page)).escort.heroHp===0){expect((await state(page)).escort.finished).toBe(false);return;}
   // A deliberate bad holding order inside bow range but outside staff reach.
   // Select a reachable point from the actual moving enemy, not a stale fixed coordinate.
   await page.waitForFunction(()=>(window as any).qualityTest.escort.enemies[1].windup>1.4,null,{polling:'raf',timeout:12000});
   const post=await page.evaluate(async()=>{const q=(window as any).qualityTest,a=q.escort.enemies[1],h=q.actor,nav=await import('/src/game/smoothMovement.ts'),angle=Math.atan2(h.y-a.y,h.x-a.x);for(const offset of [0,.35,-.35,.7,-.7]){const p={x:a.x+Math.cos(angle+offset)*110,y:a.y+Math.sin(angle+offset)*110};const plan=nav.smoothPath(h,p).route;let previous={x:h.x,y:h.y},length=0;for(const n of plan){length+=Math.hypot(previous.x-n.x,previous.y-n.y);previous=n;}if(plan.length&&length<270)return p;}return null;});
   expect(post).not.toBe(null);await clickWorld(page,post!.x,post!.y);await expect.poll(()=>page.evaluate(()=>(window as any).qualityTest.escort.heroHp),{timeout:65000}).toBe(0);expect((await state(page)).escort.finished).toBe(false);
  }

export async function retry(page:Page){if(!await page.locator('#escort-retry').isVisible())await page.locator('#play-menu>summary').click();await page.locator('#escort-retry').click();if(await page.locator('#play-menu').count()&&await page.locator('#play-menu').evaluate(e=>(e as HTMLDetailsElement).open))await page.locator('#play-menu>summary').click();}
