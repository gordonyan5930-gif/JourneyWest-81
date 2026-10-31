import {describe,it,expect} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';import {spawnSync} from 'node:child_process';
describe('truthful studio stage reporting',()=>{
 for(const [outcome,evidence,expected] of [
  ['success','valid','passed'],['failure','valid','failed'],['skipped','valid','incomplete'],
  ['success','missing','incomplete'],['success','broken','incomplete'],['success','failed-unit','failed'],['success','failed-browser','failed'],['success','missing-pressure','incomplete']
 ] as const){it(`${outcome}/${evidence} is ${expected}, never art approval`,()=>{
  const root=mkdtempSync(join(tmpdir(),'studio-report-'));try{
   mkdirSync(join(root,'reports'));writeFileSync(join(root,'reports/steps.json'),JSON.stringify(Object.fromEntries(['install','build','unit','browser_install','browser'].map(k=>[k,{outcome}]))));
   if(evidence!=='missing'){
    if(evidence!=='missing-pressure')writeFileSync(join(root,'reports/pressure.json'),JSON.stringify({samples:2,directDamageUsed:false}));
    writeFileSync(join(root,'reports/unit.json'),evidence==='broken'?'{bad':JSON.stringify({numTotalTests:2,numPassedTests:2,numFailedTests:evidence==='failed-unit'?1:0}));
    writeFileSync(join(root,'reports/browser.json'),JSON.stringify({stats:{expected:2,unexpected:evidence==='failed-browser'?1:0,flaky:0,skipped:0}}));
   }
   const r=spawnSync(process.execPath,[resolve('scripts/studio-report.mjs')],{cwd:root,env:{...process.env,GITHUB_TOKEN:'',GITHUB_EVENT_PATH:'',GITHUB_STEP_SUMMARY:''},encoding:'utf8'});expect(r.status).toBe(expected==='passed'?0:1);
   const report=JSON.parse(readFileSync(join(root,'reports/dashboard.json'),'utf8'));expect(report.technicalStatus).toBe(expected);expect(report.advanceAllowed).toBe(false);expect(report.art.approval).toBe('direction-approved-reference-files-missing');expect(report.budget.usedPercent).toBeNull();expect(report.budget.automaticHardLimit).toBe(false);
  }finally{rmSync(root,{recursive:true,force:true});}
 });}
});
