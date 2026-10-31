import {describe,it,expect} from 'vitest';
import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';
import {tmpdir} from 'node:os';import {join,resolve} from 'node:path';import {spawnSync} from 'node:child_process';
describe('truthful studio stage reporting',()=>{
 for(const [outcome,expected] of [['success','passed'],['failure','failed'],['skipped','incomplete']] as const){it(`${outcome} remains ${expected} and never approves art`,()=>{
  const root=mkdtempSync(join(tmpdir(),'studio-report-'));try{
   mkdirSync(join(root,'reports'));writeFileSync(join(root,'reports/steps.json'),JSON.stringify(Object.fromEntries(['install','build','unit','browser_install','browser'].map(k=>[k,{outcome}]))));
   const r=spawnSync(process.execPath,[resolve('scripts/studio-report.mjs')],{cwd:root,env:{...process.env,GITHUB_TOKEN:'',GITHUB_EVENT_PATH:'',GITHUB_STEP_SUMMARY:''},encoding:'utf8'});expect(r.status).toBe(0);
   const report=JSON.parse(readFileSync(join(root,'reports/dashboard.json'),'utf8'));expect(report.technicalStatus).toBe(expected);expect(report.advanceAllowed).toBe(false);expect(report.art.approval).toBe('pending-user');expect(report.budget.usedPercent).toBeNull();expect(report.budget.automaticHardLimit).toBe(false);
  }finally{rmSync(root,{recursive:true,force:true});}
 });}
});
