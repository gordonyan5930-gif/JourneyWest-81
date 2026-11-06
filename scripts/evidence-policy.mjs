import {createHash} from 'node:crypto';
export const REPOSITORY='gordonyan5930-gif/JourneyWest-81';
// Decimal bytes; project policies, NOT GitHub service limits.
export const BUDGET={report:10_000_000,diagnostics:50_000_000,full:300_000_000,packet:200_000_000,repository:500_000_000};
export const RETENTION={report:7,diagnostics:3,acceptance:3};
export const artifactUpperBound=bytes=>Math.ceil(bytes*1.01)+4096;
export const sha256=data=>createHash('sha256').update(data).digest('hex');
export function resolveRequest(eventName,event,sourceSha,refName=event.pull_request?.head?.ref??event.ref??''){
 let requestedSha='',explicit=false;
 if(eventName==='workflow_dispatch'&&String(event.inputs?.full_evidence)==='true'){explicit=true;requestedSha=event.inputs?.source_sha??'';}
 if(eventName==='pull_request'&&event.action==='labeled'&&event.label?.name?.startsWith('full:')){explicit=true;requestedSha=event.label.name.slice(5);}
 const branch=refName.replace('refs/heads/','');
 const valid=!explicit||/^[a-f0-9]{40}$/.test(requestedSha)&&requestedSha===sourceSha&&branch==='feat/p0-a-prototype';
 return {requestedMode:explicit?'full':'validation',sourceSha,requestedSha,requestValid:valid,reason:valid?'': 'Full evidence SHA must exactly match the checked-out development HEAD; request rejected',explicit};
}
export async function inventory(getPage){
 try{
  const artifacts=[],seen=new Set();let declared=null,pages=0;
  for(let page=1;page<=10000;page++){
   const data=await getPage(page,100);pages++;
   if(!Array.isArray(data.artifacts)||!Number.isSafeInteger(data.total_count)||data.total_count<0)throw Error('Invalid artifact page');
   if(declared===null)declared=data.total_count;
   if(declared!==data.total_count)throw Error('Artifact count changed during pagination; retry required');
   for(const a of data.artifacts){if(seen.has(a.id)||!Number.isSafeInteger(a.size_in_bytes)||a.size_in_bytes<0)throw Error('Duplicate or invalid artifact metadata');seen.add(a.id);artifacts.push(a);}
   if(data.artifacts.length<100){if(artifacts.length!==declared)throw Error('Incomplete artifact pagination');return {known:true,queriedAt:new Date().toISOString(),pages,count:artifacts.length,bytes:artifacts.reduce((n,a)=>n+a.size_in_bytes,0),artifacts};}
  }
  throw Error('Pagination safety limit reached');
 }catch(e){return {known:false,queriedAt:new Date().toISOString(),count:null,bytes:null,artifacts:[],error:String(e.message??e)};}
}
export function largeUploadReason(current,planned){
 if(!current?.known)return 'Repository inventory unavailable; occupancy is UNKNOWN, not zero';
 if(current.bytes+planned>BUDGET.repository)return 'Conservative repository project budget500MB exceeded; large uploads blocked (not account balance)';
 return '';
}
export function allocate(artifacts,current,mode){
 const selected=[],blocked=[];let total=0,report=0,diagnostics=0;
 for(const a of artifacts){
  const estimate=artifactUpperBound(a.bytes);let reason='';
  if(estimate>=BUDGET.packet)reason='Project packet budget requires strictly less than200MB';
  else if(a.kind==='report'&&report+estimate>BUDGET.report)reason='Project report budget10MB exceeded';
  else if(a.kind==='diagnostics'&&diagnostics+estimate>BUDGET.diagnostics)reason='Project failed-diagnostic budget50MB exceeded';
  else if(mode==='full'&&total+estimate>BUDGET.full)reason='Project complete-acceptance total budget300MB exceeded';
  else if(a.kind!=='report')reason=largeUploadReason(current,total+estimate);
  if(reason){blocked.push({...a,estimatedArtifactBytes:estimate,reason});continue;}
  selected.push({...a,estimatedArtifactBytes:estimate});total+=estimate;if(a.kind==='report')report+=estimate;if(a.kind==='diagnostics')diagnostics+=estimate;
 }
 return {selected,blocked,estimatedNewBytes:total,projectedRepositoryBytes:current?.known?current.bytes+total:null,repositoryBudgetBytes:BUDGET.repository,smallReportException:true};
}
