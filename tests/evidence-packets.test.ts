import {test,expect} from 'vitest';import {groups,LIMIT,includeEvidence,failedAttachmentPaths} from '../scripts/package-review-evidence.mjs';
test('download packets stay bounded without dropping files; impossible oversized items fail loudly',()=>{const files=Array.from({length:31},(_,i)=>({file:String(i),bytes:17000000}));const packets=groups(files);expect(packets.flat()).toEqual(files);for(const p of packets)expect(p.reduce((n,e)=>n+e.bytes,0)).toBeLessThanOrEqual(LIMIT);expect(()=>groups([{file:'unprocessed',bytes:LIMIT+1}])).toThrow('Oversize');});

test('motion packets retain all reports and failed legacy attachments while avoiding duplicate passing videos',()=>{
 const failed='test-results/old-guard/video.webm',paths=failedAttachmentPaths({suites:[{tests:[{results:[{status:'failed',attachments:[{path:failed}]}]}]}]});
 expect(includeEvidence('reports/old-guard.json','motion',paths)).toBe(true);expect(includeEvidence(failed,'motion',paths)).toBe(true);expect(includeEvidence('test-results/old-pass/video.webm','motion',paths)).toBe(false);expect(includeEvidence('test-results/motion-hud/video.webm','motion',paths)).toBe(true);expect(includeEvidence('test-results/strategy-choices/video.webm','motion',paths)).toBe(true);expect(includeEvidence('test-results/old-pass/video.webm','all',paths)).toBe(true);
});
