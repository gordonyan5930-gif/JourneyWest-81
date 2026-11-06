import fs from 'node:fs';import {pathToFileURL} from 'node:url';
import {REPOSITORY,inventory,resolveRequest,largeUploadReason} from './evidence-policy.mjs';
export async function githubGet(path){
 if(process.env.GITHUB_REPOSITORY&&process.env.GITHUB_REPOSITORY!==REPOSITORY)throw Error('This policy only operates on JourneyWest-81');
 if(!process.env.GITHUB_TOKEN)throw Error('GitHub read credential unavailable');
 const r=await fetch(`https://api.github.com/repos/${REPOSITORY}/${path}`,{headers:{Authorization:`Bearer ${process.env.GITHUB_TOKEN}`,Accept:'application/vnd.github+json'},signal:AbortSignal.timeout(15000)});
 if(!r.ok)throw Error(`GitHub read HTTP${r.status}`);return r.json();
}
export async function queryInventory(){return inventory((page,perPage)=>githubGet(`actions/artifacts?per_page=${perPage}&page=${page}`));}
async function main(){
 fs.mkdirSync('reports',{recursive:true});const upload=process.argv.includes('--upload');const result=await queryInventory();fs.writeFileSync(`reports/artifact-inventory${upload?'-upload':''}.json`,JSON.stringify(result,null,2));
 if(!upload){
  let event={};try{event=JSON.parse(fs.readFileSync(process.env.GITHUB_EVENT_PATH,'utf8'));}catch{}
  const request=resolveRequest(process.env.GITHUB_EVENT_NAME,event,process.env.SOURCE_SHA??process.env.GITHUB_SHA??'local',event.pull_request?.head?.ref??process.env.GITHUB_REF_NAME??event.ref??'');
  const reason=largeUploadReason(result,0),capture=request.requestedMode==='full'&&request.requestValid&&!reason;
  const resolved={...request,captureFull:capture,captureBlockedReason:reason};fs.writeFileSync('reports/evidence-request.json',JSON.stringify(resolved,null,2));
  if(process.env.GITHUB_ENV)fs.appendFileSync(process.env.GITHUB_ENV,`EVIDENCE_MODE=${request.requestedMode}\nCAPTURE_FULL_EVIDENCE=${capture}\n`);
 }
 console.log(JSON.stringify({known:result.known,count:result.count,bytes:result.bytes,error:result.error,scope:'repository listed metadata; NOT account remaining quota; concurrent changes possible'}));
 // Read failures are deliberately nonfatal; tests must still run.
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href)await main();
