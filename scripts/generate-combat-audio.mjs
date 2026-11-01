// Project-original procedural SFX. No recordings, samples, models or paid service.
import fs from 'node:fs';
const rate=24000, specs={attack:.16,hit:.18,danger:.62,skill:.42};let seed=0x574b;
const noise=()=>{seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/0xffffffff*2-1;};
fs.mkdirSync('assets/audio',{recursive:true});
for(const [name,duration] of Object.entries(specs)){seed=0x574b;const n=Math.round(rate*duration),wav=Buffer.alloc(44+n*2);wav.write('RIFF');wav.writeUInt32LE(36+n*2,4);wav.write('WAVEfmt ',8);wav.writeUInt32LE(16,16);wav.writeUInt16LE(1,20);wav.writeUInt16LE(1,22);wav.writeUInt32LE(rate,24);wav.writeUInt32LE(rate*2,28);wav.writeUInt16LE(2,32);wav.writeUInt16LE(16,34);wav.write('data',36);wav.writeUInt32LE(n*2,40);let filtered=0;
 for(let i=0;i<n;i++){const t=i/rate,u=t/duration;filtered=.72*filtered+.28*noise();const attack=Math.min(1,t/.008),end=Math.min(1,(duration-t)/.025);let v=0;
  if(name==='attack')v=filtered*Math.sin(Math.PI*u)*.9;
  if(name==='hit')v=(Math.sin(2*Math.PI*(180*t-280*t*t))*.5+filtered*.5)*Math.exp(-t*24);
  if(name==='danger')v=(Math.sin(2*Math.PI*660*t)+.32*Math.sin(2*Math.PI*990*t))*Math.exp(-t*7)*.38;
  if(name==='skill')v=(Math.sin(2*Math.PI*(320*t+650*t*t))*.42+filtered*.4)*Math.sin(Math.PI*u)*.7;
  wav.writeInt16LE(Math.round(Math.max(-.95,Math.min(.95,v*attack*end))*32767),44+i*2);
 }fs.writeFileSync(`assets/audio/${name}-v01.wav`,wav);
}
