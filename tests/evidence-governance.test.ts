import {test,expect} from 'vitest';import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';import {spawnSync} from 'node:child_process';
import {BUDGET,inventory,resolveRequest,allocate,artifactUpperBound} from '../scripts/evidence-policy.mjs';import {groups} from '../scripts/package-review-evidence.mjs';import {assessReceipt} from '../scripts/evidence-receipt.mjs';
const sha='a'.repeat(40),known=(bytes=0)=>({known:true,bytes});
test('full capture is explicit and pinned; labels are not sticky across pushes or mismatched SHAs',()=>{
 expect(resolveRequest('push',{label:{name:'full:'+sha}},sha).requestedMode).toBe('validation');
 expect(resolveRequest('workflow_dispatch',{inputs:{full_evidence:'false',source_sha:sha}},sha).requestedMode).toBe('validation');
 expect(resolveRequest('pull_request',{action:'labeled',label:{name:'full:'+sha},pull_request:{head:{ref:'feat/p0-a-prototype'}}},sha).requestValid).toBe(true);
 expect(resolveRequest('workflow_dispatch',{inputs:{full_evidence:'true',source_sha:sha}},sha,'main').requestValid).toBe(false);
 expect(resolveRequest('workflow_dispatch',{inputs:{full_evidence:'true',source_sha:'b'.repeat(40)}},sha,'feat/p0-a-prototype').requestValid).toBe(false);
 expect(resolveRequest('workflow_dispatch',{inputs:{full_evidence:'true',source_sha:sha}},sha,'feat/p0-a-prototype').requestValid).toBe(true);
});
test('inventory reads every page and preserves UNKNOWN on incomplete/failed/moving snapshots',async()=>{
 const artifacts=Array.from({length:103},(_,i)=>({id:i,size_in_bytes:100})),pages:number[]=[];
 const good=await inventory(async page=>{pages.push(page);return {total_count:103,artifacts:artifacts.slice((page-1)*100,page*100)}});expect(pages).toEqual([1,2]);expect(good.bytes).toBe(10300);
 const failed=await inventory(async page=>{if(page===2)throw Error('HTTP403');return {total_count:103,artifacts:artifacts.slice(0,100)}});expect(failed.known).toBe(false);expect(failed.bytes).toBeNull();
 expect((await inventory(async()=>({total_count:4,artifacts:[]}))).known).toBe(false);
 expect((await inventory(async()=>({artifacts:[]}))).bytes).toBeNull();
});
test('aggregate project budgets, exact packet boundary and repository reservation are enforced',()=>{
 const report={id:'report',kind:'report',bytes:1000},diag={id:'diagnostics',kind:'diagnostics',bytes:49_600_000};
 expect(allocate([{...report,bytes:10_000_000}],known(),'validation').blocked).toHaveLength(1);
 expect(allocate([diag],known(),'validation').blocked).toHaveLength(1);
 const full=allocate([report,{id:'a',kind:'acceptance',bytes:150_000_000},{id:'b',kind:'acceptance',bytes:150_000_000}],known(),'full');expect(full.selected.length).toBe(2);expect(full.blocked[0].reason).toContain('200MB');
 expect(allocate([{id:'a',kind:'acceptance',bytes:198_020_000}],known(),'full').blocked[0].reason).toContain('200MB');
 const capped=allocate([report,{id:'a',kind:'acceptance',bytes:10000}],known(1_622_813_927),'full');expect(capped.selected.map(a=>a.id)).toEqual(['report']);expect(capped.blocked).toHaveLength(1);
 const unknown=allocate([report,{id:'a',kind:'acceptance',bytes:10000}],{known:false,bytes:null},'full');expect(unknown.projectedRepositoryBytes).toBeNull();expect(unknown.blocked[0].reason).toContain('UNKNOWN');
 expect(allocate([report,{id:'a',kind:'acceptance',bytes:10_000_000}],known(BUDGET.repository-10000),'full').blocked).toHaveLength(1);
 expect(artifactUpperBound(1000)).toBeGreaterThan(1000);
});
test('tests stay passed when upload fails; full evidence cannot be called ready with omissions or unknown expiry',()=>{
 const plan={mode:'full',captureComplete:true,selected:[{id:'report'}],blocked:[],missing:[]};
 const bad=assessReceipt(plan,[{id:'report',kind:'report',status:'failed',bytes:null}], 'passed');expect(bad.testStatus).toBe('passed');expect(bad.actualBytes).toBeNull();expect(bad.fullEvidenceReady).toBe(false);expect(bad.acceptanceComplete).toBe(false);
 const good={id:'report',kind:'report',status:'uploaded',bytes:100,expiresAt:new Date(Date.now()+86400000).toISOString(),sha256:'sha256:'+'a'.repeat(64)};
 expect(assessReceipt(plan,[good],'passed').fullEvidenceReady).toBe(true);
 expect(assessReceipt({...plan,missing:[{reason:'over budget'}]},[good],'passed').fullEvidenceReady).toBe(false);
 expect(assessReceipt(plan,[{...good,expiresAt:null}],'passed').fullEvidenceReady).toBe(false);
});
test('ordinary package preserves failed cases, blocks diagnostics above repository budget, and does not package successful media',()=>{
 const root=mkdtempSync(join(tmpdir(),'jw-evidence-'));try{
  mkdirSync(join(root,'reports'));mkdirSync(join(root,'test-results/failure'),{recursive:true});writeFileSync(join(root,'test-results/failure/test-failed.png'),'failure evidence');writeFileSync(join(root,'reports/motion-pass.png'),'unused success');
  writeFileSync(join(root,'reports/evidence-request.json'),JSON.stringify({requestedMode:'validation',sourceSha:sha,requestValid:true,captureFull:false}));writeFileSync(join(root,'reports/artifact-inventory-upload.json'),JSON.stringify(known(1_622_813_927)));
  writeFileSync(join(root,'reports/dashboard.json'),JSON.stringify({technicalStatus:'failed'}));writeFileSync(join(root,'reports/browser.json'),JSON.stringify({stats:{unexpected:1},suites:[{title:'suite',specs:[{title:'original failure',tests:[{projectName:'canvas',results:[{status:'failed',errors:[{message:'real failure'}],attachments:[{path:'test-results/failure/test-failed.png'}]}]}]}]}]}));
  const r=spawnSync(process.execPath,[resolve('scripts/package-review-evidence.mjs')],{cwd:root,encoding:'utf8',env:{...process.env,GITHUB_OUTPUT:''}});expect(r.status,r.stderr).toBe(0);
  const plan=JSON.parse(readFileSync(join(root,'reports/evidence-plan.json'),'utf8'));expect(plan.selected.map((a:any)=>a.id)).toEqual(['report']);expect(plan.missing.some((a:any)=>a.kind==='diagnostics')).toBe(true);expect(plan.estimatedNewBytes).toBeLessThan(BUDGET.report);
  const manifest=JSON.parse(readFileSync(join(root,'reports/evidence-manifest.json'),'utf8'));expect(manifest.failures[0].name).toContain('original failure');expect(manifest.files.some((f:any)=>f.file.includes('test-failed'))).toBe(true);expect(manifest.acceptanceComplete).toBe(false);
 }finally{rmSync(root,{recursive:true,force:true});}
});
test('PR full label uses its head branch, not the synthetic merge ref; missing credentials remain UNKNOWN without stopping validation',()=>{
 const root=mkdtempSync(join(tmpdir(),'jw-inventory-'));try{
  const event=join(root,'event.json');writeFileSync(event,JSON.stringify({action:'labeled',label:{name:'full:'+sha},pull_request:{head:{ref:'feat/p0-a-prototype'}}}));
  const r=spawnSync(process.execPath,[resolve('scripts/artifact-inventory.mjs')],{cwd:root,encoding:'utf8',env:{...process.env,GITHUB_TOKEN:'',GITHUB_EVENT_PATH:event,GITHUB_EVENT_NAME:'pull_request',GITHUB_REF_NAME:'1/merge',SOURCE_SHA:sha,GITHUB_ENV:''}});expect(r.status).toBe(0);
  const request=JSON.parse(readFileSync(join(root,'reports/evidence-request.json'),'utf8')),current=JSON.parse(readFileSync(join(root,'reports/artifact-inventory.json'),'utf8'));expect(request.requestValid).toBe(true);expect(request.requestedMode).toBe('full');expect(request.captureFull).toBe(false);expect(current.bytes).toBeNull();
 }finally{rmSync(root,{recursive:true,force:true});}
});

test('configured200MB total retains every packet or explicitly blocks it',()=>{
 const packets=groups([100_000_000,90_000_000].map((bytes,i)=>({file:String(i),bytes})));expect(packets).toHaveLength(2);
 const plan=allocate([{id:'report',kind:'report',bytes:1000},...packets.map((p,i)=>({id:'acceptance-'+(i+1),kind:'acceptance',bytes:p.reduce((n,e)=>n+e.bytes,0)}))],known(),'full');expect(plan.blocked).toHaveLength(0);expect(plan.selected).toHaveLength(3);expect(plan.estimatedNewBytes).toBeLessThan(BUDGET.full);
 expect(BUDGET.report).toBe(5_000_000);expect(BUDGET.diagnostics).toBe(30_000_000);expect(BUDGET.full).toBe(200_000_000);
});
