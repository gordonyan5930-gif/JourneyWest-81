# Engineering atlas packing only: preserve the generated source, no repainting.
from PIL import Image
import json,hashlib
from pathlib import Path
root=Path(__file__).resolve().parents[1];source=root/'assets/quality-b/sources/wukong-recovery-original.png';
if not source.exists():
 desc=json.loads((source.parent/'recovery-source-archive.json').read_text());data=b''.join((root/part['path']).read_bytes() for part in desc['parts']);assert hashlib.sha256(data).hexdigest()==desc['originalSha256'];source.write_bytes(data)
im=Image.open(source).convert('RGBA');size=640;atlas=Image.new('RGBA',(size*4,size));frames={};audit=[]
for i,anchor in enumerate([300,350,320,335]):
 cell=im.crop((i*543,0,(i+1)*543,724));mask=cell.getchannel('A').point(lambda a:255 if a>=64 else 0);box=mask.getbbox();scale=.8;ground=box[3]-1
 # Every pose is registered to its actual grounded boot line, not sprite center.
 resized=cell.resize((round(543*scale),round(724*scale)),Image.Resampling.LANCZOS);left=round(320-anchor*scale);top=round(592-ground*scale);atlas.alpha_composite(resized,(i*size+left,top));frames[str(i)]={'frame':{'x':i*size,'y':0,'w':size,'h':size},'rotated':False,'trimmed':False,'spriteSourceSize':{'x':0,'y':0,'w':size,'h':size},'sourceSize':{'w':size,'h':size},'pivot':{'x':.5,'y':592/size}};audit.append({'frame':i,'sourceCell':[i*543,0,543,724],'sourceAlpha64Bounds':box,'sourceFootX':anchor,'groundY':ground,'packingScale':scale,'destinationFoot':[320,592]})
out=root/'assets/quality-b/wukong-recovery.webp';atlas.save(out,'WEBP',quality=94,method=6);(root/'assets/quality-b/wukong-recovery.json').write_text(json.dumps({'frames':frames,'meta':{'image':out.name,'size':{'w':2560,'h':640},'scale':'1'}},indent=2));
for f in audit:
 cell=atlas.crop((f['frame']*640,0,(f['frame']+1)*640,640));box=cell.getchannel('A').point(lambda a:255 if a>=64 else 0).getbbox();f['packedAlpha64Bounds']=box;f['lowestAlpha64Y']=box[3]-1;f['minimumMargin']=min(box[0],box[1],640-box[2],640-box[3])
(root/'assets/quality-b/recovery-audit.json').write_text(json.dumps({'sourceSha256':hashlib.sha256(source.read_bytes()).hexdigest(),'sourceDimensions':list(im.size),'poses':['lowering','down-kneel','rising','guard'],'frames':audit,'status':'minimal pose prototype; transitions not final animation; user review pending'},indent=2));print(audit)
