import {it,expect} from 'vitest';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
it('sample files match recorded checksums and are not falsely recorded as original references',()=>{
 const manifest=JSON.parse(readFileSync('assets/quality-b/manifest.json','utf8'));for(const a of manifest.assets){const data=readFileSync(a.path);expect(createHash('sha256').update(data).digest('hex')).toBe(a.sha256);expect(data.length).toBe(a.bytes);}
 const references=JSON.parse(readFileSync('assets/references/manifest.json','utf8'));for(const r of references.references){if(r.originalPreserved){const original=readFileSync(r.intendedPath);expect(createHash('sha256').update(original).digest('hex')).toBe(r.sha256);expect(original.length).toBe(r.bytes);}else expect(r.sha256).toBe(null);}expect(references.originalBinaryAvailable).toBe(references.references.filter((r:any)=>['CHAR-MASTER-R3','SCENE-MASTER-R1'].includes(r.id)).every((r:any)=>r.originalPreserved));
 const atlas=JSON.parse(readFileSync('assets/quality-b/wukong-atlas.json','utf8'));expect(Object.keys(atlas.frames)).toHaveLength(12);for(const f of Object.values(atlas.frames) as any[]){expect(f.frame.x+f.frame.w).toBeLessThanOrEqual(atlas.meta.size.w);expect(f.frame.y+f.frame.h).toBeLessThanOrEqual(atlas.meta.size.h);}
});

it('revised atlas has clear weapon/cape cell margins and registered foot pivots',()=>{
 const audit=JSON.parse(readFileSync('assets/quality-b/wukong-audit.json','utf8'));const atlas=JSON.parse(readFileSync('assets/quality-b/wukong-atlas.json','utf8'));expect(audit.minimumEdgeClearancePixels).toBeGreaterThanOrEqual(10);for(const f of audit.frames){expect(atlas.frames[f.frame].pivot.y*atlas.frames[f.frame].frame.h).toBeCloseTo(f.registeredFootY,5);expect(f.edgeClearancePixels).toBeGreaterThanOrEqual(10);}
});
