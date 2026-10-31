import {it,expect} from 'vitest';import {readFileSync} from 'node:fs';import {createHash} from 'node:crypto';
for(const [file,bytes,sha] of [
 ['character-ip-approved-round3.png',3152697,'327411d5d8bef9b527e07c416524ae833ce45ee9ce54bf71a314699f76898bad'],
 ['gameplay-visual-reference-round1.png',3204162,'e2e161a48c0d0b36add1115e01f11b00ccd697f208bb68fd03f27583160e0936']
] as const)it(`preserves approved original ${file} against independent review hashes`,()=>{const b=readFileSync('assets/references/'+file);expect(b.length).toBe(bytes);expect(b.subarray(0,8).toString('hex')).toBe('89504e470d0a1a0a');expect([b.readUInt32BE(16),b.readUInt32BE(20)]).toEqual([1672,941]);expect(createHash('sha256').update(b).digest('hex')).toBe(sha);});
