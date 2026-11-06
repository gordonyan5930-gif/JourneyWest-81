import fs from 'node:fs';import path from 'node:path';import {execFileSync} from 'node:child_process';import {pathToFileURL} from 'node:url';
import {BUDGET,RETENTION,artifactUpperBound,allocate,sha256,largeUploadReason} from './evidence-policy.mjs';
export const LIMIT=190_000_000;
export function groups(entries,limit=LIMIT){const out=[];let batch=[],size=0;for(const e of entries){if(e.bytes>limit)throw Error('Oversize unsplit evidence: '+e.file);if(batch.length&&size+e.bytes>limit){out.push(batch);batch=[];size=0;}batch.push(e);size+=e.bytes;}if(batch.length)out.push(batch);return out;}
// Compatibility helper; the current policy below supersedes the former motion-only uploader.
export function includeEvidence(file,scope='all',failed=new Set()){return scope!=='motion'||!/[.](png|webm|mp4)$/.test(file)||/motion-|strategy-/.test(file)||file.includes('test-failed')||failed.has(file);}
export function failedAttachmentPaths(node,result=new Set()){
 if(!node||typeof node!=='object')return result;
 if(['failed','timedOut','interrupted'].includes(node.status))for(const a of node.attachments??[])if(a.path)result.add(path.isAbsolute(a.path)?path.relative(process.cwd(),a.path):a.path);
 for(const v of Object.values(node))if(Array.isArray(v))for(const c of v)failedAttachmentPaths(c,result);return result;
}
export function caseResults(node,parents=[],out=[]){
 if(!node||typeof node!=='object')return out;const names=node.title?[...parents,node.title]:parents;
 if(node.results)out.push({name:names.join(' / '),project:node.projectName,expectedStatus:node.expectedStatus,results:node.results.map(r=>({status:r.status,duration:r.duration,retry:r.retry,errors:r.errors??[],attachments:r.attachments??[]}))});
 for(const k of ['suites','specs','tests'])for(const c of node[k]??[])caseResults(c,names,out);return out;
}
const read=file=>{try{return JSON.parse(fs.readFileSync(file,'utf8'));}catch{return null;}};
const walk=dir=>fs.existsSync(dir)?fs.readdirSync(dir,{withFileTypes:true}).flatMap(e=>e.isDirectory()?walk(path.join(dir,e.name)):e.isFile()?[path.join(dir,e.name)]:[]):[];
const hash=file=>sha256(fs.readFileSync(file));
function zip(output,files){
 fs.mkdirSync(path.dirname(output),{recursive:true});
 const input=output+'.inputs.json';fs.writeFileSync(input,JSON.stringify(files));
 execFileSync('python3',['-c','import sys,json,zipfile\nwith zipfile.ZipFile(sys.argv[1],"w",compression=zipfile.ZIP_DEFLATED,compresslevel=6) as z:\n for f in json.load(open(sys.argv[2])): z.write(f["file"],f["archive"])',output,input]);fs.unlinkSync(input);
 return {file:output,bytes:fs.statSync(output).size,sha256:hash(output)};
}
function allowed(file){const p=path.relative(process.cwd(),path.resolve(file));return !p.startsWith('..')&&!path.isAbsolute(p)&&/^(reports|test-results|assets\/audio)\//.test(p)&&fs.existsSync(p)&&fs.lstatSync(p).isFile();}
export function choose(entries,budget){let bytes=0;const kept=[],missing=[];for(const e of entries){if(bytes+e.bytes<=budget){kept.push(e);bytes+=e.bytes;}else missing.push({...e,reason:'Project aggregate budget; original retained locally, NOT silently truncated'});}return {kept,missing,bytes};}
function main(){
 fs.mkdirSync('reports',{recursive:true});fs.rmSync('evidence-upload',{recursive:true,force:true});fs.mkdirSync('evidence-upload',{recursive:true});
 const request=read('reports/evidence-request.json')??{requestedMode:'validation',sourceSha:process.env.SOURCE_SHA??'local',requestValid:true,captureFull:false};
 const current=read('reports/artifact-inventory-upload.json')??{known:false,bytes:null,error:'Upload inventory missing'};
 const browser=read('reports/browser.json'),unit=read('reports/unit.json'),dashboard=read('reports/dashboard.json'),cases=caseResults(browser),failures=cases.filter(c=>c.results.some(r=>['failed','timedOut','interrupted'].includes(r.status))),failedPaths=failedAttachmentPaths(browser);
 const manifest={sourceSha:request.sourceSha,request,generatedAt:new Date().toISOString(),budgets:BUDGET,repositoryInventory:current,scope:'Current Quality-B motion/strategy, one experiment; all functional tests retained',failures,files:[],missing:[],excludedByScope:[],derived:[],acceptanceComplete:false,automaticApproval:false,retentionDays:RETENTION};
 const meta=file=>({file,archive:path.relative(process.cwd(),path.resolve(file)),bytes:fs.statSync(file).size,sha256:hash(file)});
 let diagnostics=[];
 for(const raw of failedPaths){const file=path.relative(process.cwd(),path.resolve(raw));if(!allowed(file)||!file.startsWith('test-results/')){manifest.missing.push({file,kind:'diagnostics',reason:'Missing or unsafe failure attachment'});continue;}const original=meta(file);manifest.files.push({...original,kind:'diagnostics'});
  if(largeUploadReason(current,0)){manifest.missing.push({...original,kind:'diagnostics',reason:largeUploadReason(current,0)});continue;}
  if(/\.(webm|mp4)$/.test(file)){
   try{const duration=Number(JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration','-of','json',file],{encoding:'utf8'})).format.duration);const output=`reports/failure-clips/${sha256(file).slice(0,16)}.mp4`;fs.mkdirSync(path.dirname(output),{recursive:true});const start=Math.max(0,duration-20);execFileSync('ffmpeg',['-v','error','-y','-ss',String(start),'-i',file,'-t','20','-vf','scale=min(1280\\,iw):-2','-an','-c:v','libx264','-crf','28','-preset','fast',output]);const clip=meta(output);manifest.derived.push({from:original,to:clip,startSeconds:start,maxSeconds:20,speed:1,audio:false,reason:'Last20s failure context; full original not deleted; this is a diagnostic excerpt'});diagnostics.push(clip);}catch(e){manifest.missing.push({...original,kind:'diagnostics',reason:'Failure clip generation failed: '+String(e.message).slice(0,250)});}
  }else diagnostics.push(original);
 }
 diagnostics.sort((a,b)=>(a.file.endsWith('.png')?-1:0)-(b.file.endsWith('.png')?-1:0)||a.file.localeCompare(b.file));
 const chosenDiagnostics=choose(diagnostics,48_000_000);manifest.missing.push(...chosenDiagnostics.missing.map(x=>({...x,kind:'diagnostics'})));
 const artifacts=[];
 if(chosenDiagnostics.kept.length)artifacts.push({id:'diagnostics',kind:'diagnostics',retentionDays:3,...zip('evidence-upload/diagnostics.zip',chosenDiagnostics.kept)});
 const all=[...walk('reports'),...walk('test-results'),...walk('assets/audio')];const full=[];
 for(const file of all){
  if(!allowed(file)||file.startsWith('reports/failure-clips/')||failedPaths.has(file)||file.includes('evidence-plan')||file.includes('artifact-inventory')||file.includes('storage-probe'))continue;
  const inScope=/^reports\/(motion-|strategy-|movement-|ranged-counter-|ranged-unprotected-|pressure|performance)/.test(file)||/test-results\/(motion-|strategy-|quality-experiment)/.test(file)||file.startsWith('assets/audio/');
  if(!/\.(json|png|webm|wav|mp4)$/.test(file))continue;
  if(!inScope){manifest.excludedByScope.push({file,reason:'Historical success media/raw reports outside declared acceptance scope; logical results retained in compact report'});continue;}
  if(request.requestedMode==='full'&&request.requestValid&&request.captureFull){const f=meta(file);if(/\.(webm|mp4)$/.test(file)){try{f.probe=JSON.parse(execFileSync('ffprobe',['-v','error','-show_entries','format=duration:stream=codec_type,width,height','-of','json',file],{encoding:'utf8'}));if(!(Number(f.probe.format?.duration)>0))throw Error('Empty duration');}catch(e){manifest.missing.push({...f,kind:'acceptance',reason:'Invalid acceptance video metadata'});continue;}}full.push(f);}
 }
 if(request.requestedMode==='full'){
  if(!request.requestValid||!request.captureFull)manifest.missing.push({kind:'acceptance',reason:request.reason||request.captureBlockedReason||'Full capture not enabled'});
  else{
   const rawBudget=280_000_000-chosenDiagnostics.bytes;const eligible=full.filter(f=>{if(f.bytes>LIMIT){manifest.missing.push({...f,kind:'acceptance',reason:'Single source exceeds bounded packet; no silent truncation'});return false;}return true;});const picked=choose(eligible.sort((a,b)=>a.file.localeCompare(b.file)),Math.max(0,rawBudget));manifest.files.push(...full.map(f=>({...f,kind:'acceptance'})));manifest.missing.push(...picked.missing.map(x=>({...x,kind:'acceptance'})));
   for(const [i,files] of groups(picked.kept).entries())artifacts.push({id:`acceptance-${i+1}`,kind:'acceptance',retentionDays:3,...zip(`evidence-upload/acceptance-${i+1}.zip`,files)});
   if(!full.some(f=>/motion-comparison.*video/.test(f.file))||!full.some(f=>/strategy-choices.*video/.test(f.file))||!full.some(f=>/quality-experiment.*video/.test(f.file))||dashboard?.evidenceCaptureChecks?.experimentVideoValid!==true)manifest.missing.push({kind:'acceptance',reason:'Required current-scope continuous acceptance recordings missing'});
  }
 }
 const unitCases=(unit?.testResults??[]).flatMap(s=>(s.assertionResults??[]).map(t=>({name:t.fullName??t.title,status:t.status,failureMessages:t.failureMessages??[]})));
 const summary={runUrl:`https://github.com/gordonyan5930-gif/JourneyWest-81/actions/runs/${process.env.GITHUB_RUN_ID??'local'}`,sourceSha:request.sourceSha,mode:request.requestedMode,testStatus:dashboard?.testStatus??dashboard?.technicalStatus??'unknown',functionalReportStatus:dashboard?.technicalStatus??'unknown',steps:read('reports/steps.json'),unit:unit?{passed:unit.numPassedTests,failed:unit.numFailedTests,pending:unit.numPendingTests,cases:unitCases}:null,browser:browser?.stats??null,cases,inputDigests:{unit:fs.existsSync('reports/unit.json')?hash('reports/unit.json'):null,browser:fs.existsSync('reports/browser.json')?hash('reports/browser.json'):null},acceptanceComplete:false,notice:'Tests and evidence delivery are independent. Ordinary validation is never full acceptance. Actual upload/expiry receipt is in the job summary/log.'};
 const provisional=allocate(artifacts,current,request.requestedMode);manifest.missing.push(...provisional.blocked.map(a=>({kind:a.kind,file:a.file,bytes:a.bytes,sha256:a.sha256,reason:a.reason})));manifest.preUploadPlan=provisional;
 fs.writeFileSync('reports/evidence-manifest.json',JSON.stringify(manifest,null,2));fs.writeFileSync('reports/verification-summary.json',JSON.stringify(summary,null,2));
 fs.writeFileSync('reports/EVIDENCE_README.md',`# Verification evidence\nSHA:${request.sourceSha}\nMode:${request.requestedMode}\nTest result:${summary.testStatus}\nNo automatic acceptance. Ordinary report7days, diagnostics3days, full large packets3days, then AUTOMATIC EXPIRY; pending review is not permanent retention.\nBudgets10/50/300MB total and packet<200MB are PROJECT policy, not GitHub official limits.500MB repository inventory is not account remaining quota and cannot guarantee upload. Unknown inventory is never zero.\nMissing entries:${manifest.missing.length}; do not claim complete evidence when missing. Slow motion should be generated locally from originals.\n`);
 const report=zip('evidence-upload/report.zip',['evidence-manifest.json','verification-summary.json','EVIDENCE_README.md'].map(n=>({file:'reports/'+n,archive:n})));
 const plan=allocate([{id:'report',kind:'report',retentionDays:7,...report},...artifacts],current,request.requestedMode);
 const final={...plan,sourceSha:request.sourceSha,mode:request.requestedMode,requestValid:request.requestValid,missing:[...manifest.missing,...plan.blocked],diagnosticsComplete:!manifest.missing.some(m=>m.kind==='diagnostics'),captureComplete:request.requestedMode==='full'&&request.requestValid&&request.captureFull&&dashboard?.technicalStatus==='passed'&&!manifest.missing.length&&!plan.blocked.length,acceptanceComplete:false};
 fs.writeFileSync('reports/evidence-plan.json',JSON.stringify(final,null,2));
 if(process.env.GITHUB_OUTPUT)for(const id of ['report','diagnostics','acceptance-1','acceptance-2','acceptance-3'])fs.appendFileSync(process.env.GITHUB_OUTPUT,`${id.replace('-','_')}=${plan.selected.some(a=>a.id===id)}\n`);
 console.log('EVIDENCE_MANIFEST '+JSON.stringify(manifest));
 console.log(JSON.stringify({sourceSha:final.sourceSha,mode:final.mode,estimatedNewBytes:final.estimatedNewBytes,repositoryKnown:current.known,repositoryBytes:current.bytes,selected:plan.selected.map(a=>({id:a.id,bytes:a.bytes,estimatedArtifactBytes:a.estimatedArtifactBytes})),blocked:plan.blocked,missing:manifest.missing}));
}
if(process.argv[1]&&import.meta.url===pathToFileURL(path.resolve(process.argv[1])).href)main();
