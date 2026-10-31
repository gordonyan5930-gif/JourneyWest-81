import {readFileSync,copyFileSync,writeFileSync,existsSync} from 'node:fs';
import {createHash} from 'node:crypto';
import path from 'node:path';
import {fileURLToPath} from 'node:url';
const hash=b=>createHash('sha256').update(b).digest('hex');
export function archiveReferences(root,character,scene){
 const manifestPath=path.join(root,'assets/references/manifest.json');const manifest=JSON.parse(readFileSync(manifestPath,'utf8'));
 const inputs=[['CHAR-MASTER-R3',character],['SCENE-MASTER-R1',scene]].map(([id,source])=>{
  const data=readFileSync(source);if(data.subarray(0,8).toString('hex')!=='89504e470d0a1a0a'||data.subarray(12,16).toString()!=='IHDR')throw Error(`${id}: original PNG required; no conversion performed`);
  const width=data.readUInt32BE(16),height=data.readUInt32BE(20);if(!width||!height)throw Error('Invalid PNG dimensions');
  const ref=manifest.references.find(r=>r.id===id);const destination=path.join(root,ref.intendedPath);if(existsSync(destination)&&hash(readFileSync(destination))!==hash(data))throw Error(`${id}: existing original differs; create a reviewed new version instead of overwriting`);
  return {ref,source,destination,data,width,height};
 });
 for(const item of inputs){copyFileSync(item.source,item.destination);const saved=readFileSync(item.destination);if(hash(saved)!==hash(item.data))throw Error('Copy verification failed');Object.assign(item.ref,{originalPreserved:true,sha256:hash(saved),bytes:saved.length,width:item.width,height:item.height,format:'PNG',version:'approved-original-v1'});}
 manifest.originalBinaryAvailable=true;manifest.version='1.1-originals-archived';manifest.blockedReason=null;writeFileSync(manifestPath,JSON.stringify(manifest,null,2)+'\n');return inputs.map(i=>i.ref);
}
if(process.argv[1]&&path.resolve(process.argv[1])===fileURLToPath(import.meta.url)){
 if(process.argv.length!==4)throw Error('Usage: node scripts/archive-references.mjs CHARACTER.png SCENE.png');
 console.log(JSON.stringify(archiveReferences(process.cwd(),process.argv[2],process.argv[3]),null,2));
}
