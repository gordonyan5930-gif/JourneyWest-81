import {it,expect} from 'vitest';import {mkdtempSync,mkdirSync,writeFileSync,readFileSync,rmSync} from 'node:fs';import {tmpdir} from 'node:os';import path from 'node:path';
// @ts-expect-error standalone node workflow module
import {archiveReferences} from '../scripts/archive-references.mjs';
it('archives original PNG bytes exactly and refuses to overwrite a different original',()=>{
 const root=mkdtempSync(path.join(tmpdir(),'jw-originals-'));try{mkdirSync(path.join(root,'assets/references'),{recursive:true});const manifest={references:[{id:'CHAR-MASTER-R3',intendedPath:'assets/references/character.png'},{id:'SCENE-MASTER-R1',intendedPath:'assets/references/scene.png'}]};writeFileSync(path.join(root,'assets/references/manifest.json'),JSON.stringify(manifest));
 const png=Buffer.from('iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aV1cAAAAASUVORK5CYII=','base64');const source=path.join(root,'input.png');writeFileSync(source,png);const refs=archiveReferences(root,source,source);expect(readFileSync(path.join(root,'assets/references/character.png'))).toEqual(png);expect(refs[0]).toMatchObject({width:1,height:1,bytes:png.length,originalPreserved:true});
 writeFileSync(path.join(root,'assets/references/character.png'),'different');expect(()=>archiveReferences(root,source,source)).toThrow('existing original differs');
 }finally{rmSync(root,{recursive:true,force:true});}
});
