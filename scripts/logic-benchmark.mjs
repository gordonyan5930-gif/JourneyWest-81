import {performance} from 'node:perf_hooks';
import {writeFileSync,mkdirSync} from 'node:fs';import {resolve} from 'node:path';import {pathToFileURL} from 'node:url';import os from 'node:os';
const module=await import(pathToFileURL(resolve(process.argv[2]??'src/game/world.ts')).href);
const samples=[];let searches=null;
for(let run=0;run<6;run++){
 const w=new module.World();for(let i=0;i<25;i++){const a=i*2*Math.PI/25;w.spawn({x:w.tang.x+2*Math.cos(a),y:w.tang.y+2*Math.sin(a)});}
 if(module.NAV_METRICS)module.NAV_METRICS.searches=0;
 const times=[];for(let step=0;step<100;step++){const start=performance.now();w.update(.05);times.push(performance.now()-start);}
 if(run>0)samples.push(...times);searches=module.NAV_METRICS?.searches??null;
}
samples.sort((a,b)=>a-b);const report={mode:'logic-only',scenario:'25 ordinary enemies / 100 steps x .05s / 5 measured repeats after warmup',sourceSha:process.env.SOURCE_SHA??'workspace',node:process.version,hardware:{cpu:os.cpus()[0]?.model,logicalCpus:os.cpus().length,platform:os.platform(),memoryBytes:os.totalmem()},meanStepMs:samples.reduce((a,b)=>a+b,0)/samples.length,p95StepMs:samples[Math.floor(samples.length*.95)],heapUsedBytes:process.memoryUsage().heapUsed,searchesLastRun:searches,productQualityApproved:false};
mkdirSync('reports',{recursive:true});writeFileSync(`reports/logic-${process.argv[3]??'after'}.json`,JSON.stringify(report,null,2));console.log(JSON.stringify(report));
