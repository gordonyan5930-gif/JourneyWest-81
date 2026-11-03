import {describe,it,expect} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';import {spawnSync} from 'node:child_process';
describe('truthful studio stage reporting',()=>{
 for(const [outcome,evidence,expected] of [
  ['success','valid','passed'],['failure','valid','failed'],['skipped','valid','incomplete'],
  ['success','missing','incomplete'],['success','broken','incomplete'],['success','failed-unit','failed'],['success','failed-browser','failed'],['success','missing-pressure','incomplete'],['success','missing-experiment-video','incomplete'],['success','missing-tactical','incomplete'],['success','missing-experience','incomplete'],['success','missing-first-counter','incomplete']
 ] as const){it(`${outcome}/${evidence} is ${expected}, never art approval`,()=>{
  const root=mkdtempSync(join(tmpdir(),'studio-report-'));try{
   mkdirSync(join(root,'reports'));writeFileSync(join(root,'reports/steps.json'),JSON.stringify(Object.fromEntries(['install','build','unit','browser_install','browser'].map(k=>[k,{outcome}]))));
   if(evidence!=='missing'){
    writeFileSync(join(root,'reports/first-counter-causal.json'),JSON.stringify({rows:Array.from({length:4},()=>({identicalPrefix:true}))}));
    if(evidence!=='missing-first-counter')writeFileSync(join(root,'reports/first-counter.json'),JSON.stringify({rows:[{case:'cold-success-1500',outcome:{damage:55},sameDraw:true,energySpent:25,state:{escort:{manualHero:true}}},...['out-of-range','blocked'].map(k=>({case:k,rejected:{reason:k},energySpent:0})),{case:'late',firstShot:{time:1},input:{game:2}},{case:'rally',rally:{before:{manual:true},after:{manual:false}}},{case:'clean-retry',state:{lesson:{pending:null}}}]}));
    if(evidence!=='missing-experience'){writeFileSync(join(root,'reports/round4-webgl-clock.json'),JSON.stringify({runs:[{},{}]}));writeFileSync(join(root,'reports/round4-inputs.json'),JSON.stringify({rows:[{case:'quick-reaction',hit:{amount:55},interruptedObservedDraw:true},{case:'post-heavy',completedHeavyBeforeReset:true},{case:'early-direct',cast:{target:'archer-1'},discardedLightProgress:1,energySpent:25},...['out-of-range','too-early-order','late-direct'].map(c=>({case:c}))]}));writeFileSync(join(root,'reports/round4-bodies.json'),JSON.stringify({runs:[{},{}]}));writeFileSync(join(root,'reports/round4-quick-causal.json'),JSON.stringify({rows:Array.from({length:5},()=>({identicalPrefix:true}))}));}

    if(evidence!=='missing-tactical'){writeFileSync(join(root,'reports/tactical-causal.json'),JSON.stringify({rows:Array.from({length:12},()=>({identicalPrefix:true}))}));writeFileSync(join(root,'reports/tactical-browser.json'),JSON.stringify({rows:Array.from({length:4},()=>({}))}));}
    if(evidence!=='missing-pressure')writeFileSync(join(root,'reports/pressure.json'),JSON.stringify({samples:2,directDamageUsed:false}));
    writeFileSync(join(root,'reports/unit.json'),evidence==='broken'?'{bad':JSON.stringify({numTotalTests:2,numPassedTests:2,numFailedTests:evidence==='failed-unit'?1:0}));
    writeFileSync(join(root,'reports/browser.json'),JSON.stringify({stats:{expected:2,unexpected:evidence==='failed-browser'?1:0,flaky:0,skipped:0},suites:evidence==='missing-experiment-video'?[{file:'quality-experiment.spec.ts'}]:[]}));
   }
   const r=spawnSync(process.execPath,[resolve('scripts/studio-report.mjs')],{cwd:root,env:{...process.env,GITHUB_TOKEN:'',GITHUB_EVENT_PATH:'',GITHUB_STEP_SUMMARY:''},encoding:'utf8'});expect(r.status).toBe(expected==='passed'?0:1);
   const report=JSON.parse(readFileSync(join(root,'reports/dashboard.json'),'utf8'));expect(report.technicalStatus).toBe(expected);expect(report.advanceAllowed).toBe(false);expect(report.art.approval).toBe('direction-approved-reference-files-missing');expect(report.budget.usedPercent).toBeNull();expect(report.budget.automaticHardLimit).toBe(false);
  }finally{rmSync(root,{recursive:true,force:true});}
 });}
});
