import fs from 'node:fs';
import {githubGet} from './artifact-inventory.mjs';import {BUDGET} from './evidence-policy.mjs';
const read=f=>{try{return JSON.parse(fs.readFileSync(f,'utf8'));}catch{return null;}};
export function assessReceipt(plan,uploads,testStatus){
 const bytesKnown=uploads.every(a=>Number.isSafeInteger(a.bytes)&&a.bytes>=0);
 const actualBytes=bytesKnown?uploads.reduce((n,a)=>n+a.bytes,0):null,metadataKnown=uploads.every(a=>a.status==='uploaded'&&Number.isSafeInteger(a.bytes)&&Number.isFinite(Date.parse(a.expiresAt))&&/^sha256:[a-f0-9]{64}$/.test(a.sha256??''));
 const uploadedIds=new Set(uploads.filter(a=>a.status==='uploaded').map(a=>a.id));
 const allUploaded=!!plan&&plan.selected.every(a=>uploadedIds.has(a.id));
 const actualWithinBudgets=bytesKnown&&actualBytes<=(plan?.mode==='full'?BUDGET.full:BUDGET.report+BUDGET.diagnostics)&&uploads.every(a=>a.bytes<BUDGET.packet)&&uploads.filter(a=>a.kind==='report').reduce((n,a)=>n+(a.bytes??0),0)<=BUDGET.report&&uploads.filter(a=>a.kind==='diagnostics').reduce((n,a)=>n+(a.bytes??0),0)<=BUDGET.diagnostics;
 const deliveryComplete=!!plan&&allUploaded&&metadataKnown&&actualWithinBudgets&&!(plan.blocked?.length)&&!(plan.missing?.length);
 return {testStatus,evidenceUploadStatus:!plan?'unknown':!allUploaded||!metadataKnown?'failed-or-unknown':deliveryComplete?'uploaded':'incomplete',actualBytes,actualWithinBudgets,deliveryComplete,fullEvidenceReady:plan?.mode==='full'&&plan.captureComplete&&deliveryComplete&&testStatus==='passed',acceptanceComplete:false,advanceAllowed:false};
}
async function main(){
 const plan=read('reports/evidence-plan.json'),dashboard=read('reports/dashboard.json'),steps=read('reports/upload-steps.json')??{},uploads=[];
 for(const a of plan?.selected??[]){
  const key=a.id.replace('-','_'),step=steps['upload_'+key],id=step?.outputs?.['artifact-id'];
  if(step?.outcome!=='success'||!id){uploads.push({...a,payloadBytes:a.bytes,payloadSha256:a.sha256,bytes:null,sha256:null,status:'failed',error:'Upload step did not succeed',expiresAt:null});continue;}
  let meta=null,error='';for(let i=0;i<3;i++){try{meta=await githubGet('actions/artifacts/'+id);break;}catch(e){error=String(e.message);if(i<2)await new Promise(r=>setTimeout(r,1000));}}
  uploads.push({...a,payloadBytes:a.bytes,payloadSha256:a.sha256,status:meta?'uploaded':'metadata-unavailable',artifactId:id,bytes:meta?.size_in_bytes??null,expiresAt:meta?.expires_at??null,sha256:meta?.digest??null,error,url:`https://github.com/gordonyan5930-gif/JourneyWest-81/actions/runs/${process.env.GITHUB_RUN_ID}/artifacts/${id}`});
 }
 const result={sourceSha:process.env.SOURCE_SHA,generatedAt:new Date().toISOString(),...assessReceipt(plan,uploads,dashboard?.testStatus??dashboard?.technicalStatus??'unknown'),uploads,missing:plan?.missing??[],blocked:plan?.blocked??[],inventory:plan?{estimatedNewBytes:plan.estimatedNewBytes,projectedRepositoryBytes:plan.projectedRepositoryBytes}:null,cleanupAdvice:'No deletion in this task. Separately review backed-up expired/duplicate artifacts under future user authorization; preserve accepted baselines. Unknown inventory requires restoring the read query, not assuming zero.',warning:'Actual artifacts automatically expire; pending review is NOT permanent retention. Repository statistics are NOT account remaining quota; query success does not guarantee upload.'};
 fs.writeFileSync('reports/evidence-upload.json',JSON.stringify(result,null,2));console.log('EVIDENCE_UPLOAD_RECEIPT '+JSON.stringify(result));
 const cst=iso=>iso?new Date(iso).toLocaleString('sv-SE',{timeZone:'Asia/Shanghai'})+' +08':'UNKNOWN';
 const md=`\n## Test and evidence results (independent)\nSHA: ${result.sourceSha}\nTests: **${result.testStatus}**\nEvidence: **${result.evidenceUploadStatus}**\nAcceptance completed: **false — independent/user review required**\n\n|Artifact|Actual bytes|SHA-256|Expires (Asia/Shanghai)|\n|---|---:|---|---|\n${uploads.map(a=>`|[${a.id}](${a.url??''})|${a.bytes??'UNKNOWN'}|${a.sha256??'UNKNOWN'}|${cst(a.expiresAt)}|`).join('\n')}\n\n${result.warning}\n${result.cleanupAdvice}\nMissing/blocked: ${result.missing.length+result.blocked.length}. Read EVIDENCE_UPLOAD_RECEIPT in this job log for all omissions and upload failures.\n`;
 if(process.env.GITHUB_STEP_SUMMARY)fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,md);
 // Ordinary validation reports upload failures separately; full acceptance cannot go green with missing delivery.
 if(plan?.mode==='full'&&!result.fullEvidenceReady)process.exitCode=1;
}
if(process.argv[1]?.endsWith('evidence-receipt.mjs'))await main();
