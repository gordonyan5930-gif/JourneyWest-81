import {spawnSync} from 'node:child_process';
import {describe,it,expect} from 'vitest';
describe('Vercel preview-only build gate',()=>{
 for(const [environment,branch,exitCode] of [
  ['preview','feat/p0-a-prototype',1],
  ['production','feat/p0-a-prototype',0],
  ['production','main',0],
  ['preview','main',0],
  ['preview','other',0],
  ['','',0],
 ] as const){it(`${environment||'missing environment'} / ${branch||'missing branch'}`,()=>{
  const result=spawnSync(process.execPath,['scripts/vercel-ignore-build.cjs'],{env:{...process.env,VERCEL_ENV:environment,VERCEL_GIT_COMMIT_REF:branch},encoding:'utf8'});
  expect(result.status).toBe(exitCode);
 });}
});
