import {it,expect} from 'vitest';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
it('sample files match recorded checksums and are not falsely recorded as original references',()=>{
 const manifest=JSON.parse(readFileSync('assets/quality-b/manifest.json','utf8'));for(const a of manifest.assets){const data=readFileSync(a.path);expect(createHash('sha256').update(data).digest('hex')).toBe(a.sha256);expect(data.length).toBe(a.bytes);}
 const references=JSON.parse(readFileSync('assets/references/manifest.json','utf8'));expect(references.originalBinaryAvailable).toBe(false);expect(references.references.every((r:any)=>r.sha256===null&&!r.originalPreserved)).toBe(true);
 const atlas=JSON.parse(readFileSync('assets/quality-b/wukong-atlas.json','utf8'));expect(Object.keys(atlas.frames)).toHaveLength(8);for(const f of Object.values(atlas.frames) as any[]){expect(f.frame.x+f.frame.w).toBeLessThanOrEqual(atlas.meta.size.w);expect(f.frame.y+f.frame.h).toBeLessThanOrEqual(atlas.meta.size.h);}
});
