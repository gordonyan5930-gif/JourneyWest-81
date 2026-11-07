"""Engineering-only segmentation/registration. Never redraw/warp an anatomical pose.
Generated source bytes are archived separately, including rejected candidates.
"""
from pathlib import Path
from PIL import Image
import json,hashlib,statistics,os
root=Path(__file__).resolve().parents[1];out=root/'assets/quality-b/round2';out.mkdir(exist_ok=True);sources=out/'sources';sources.mkdir(exist_ok=True)
items=[('wukong-v01','exec-3fb3fb19-4e99-492b-aada-1b417f2eed4b.png',6,4,'rejected-staff-overlaps-cells'),('wukong','exec-2f183f20-c344-40da-bd35-9cc95b7952e5.png',4,6,'used-attack-study'),('tang-v01','exec-a686b482-1143-488c-94d0-1fc8bb615b18.png',4,2,'rejected-gait-insufficient'),('archer-v01','exec-acc466fc-4d1a-41dc-9dbb-b67202afb159.png',6,3,'rejected-gutter-clipping'),('archer-react','exec-5bb22492-2c57-4af6-9341-9e8842be13c2.png',4,3,'used-reaction-study'),('tang','exec-d9bf1a48-d802-4a6e-84db-dd79dbb8c0e1.png',4,2,'used-walk-study'),('archer','exec-3151b13b-c193-403b-9284-45c28c9bd163.png',4,2,'used-walk-study')]
manifest=[];index={'groups':{},'atlases':[]};audit=[]
def cuts(im,count,axis):
 a=im.getchannel('A').point(lambda a:255 if a>=200 else 0);w,h=a.size;length=w if axis==0 else h
 projection=[sum(1 for v in (a.crop((i,0,i+1,h)) if axis==0 else a.crop((0,i,w,i+1))).getdata() if v) for i in range(length)]
 result=[0]
 for j in range(1,count):
  center=round(j*length/count);radius=round(length/count*.23);lo=max(result[-1]+30,center-radius);hi=min(length-30,center+radius)
  result.append(min(range(lo,hi),key=lambda p:(projection[p],abs(p-center))))
 return result+[length]
for name,file,cols,rows,status in items:
 source=Path(os.environ.get('ROUND2_SOURCE_DIR','/workspace/generated_images'))/file;data=source.read_bytes();im=Image.open(source).convert('RGBA');sha=hashlib.sha256(data).hexdigest();parts=[]
 for i in range(0,len(data),224000):
  p=sources/f'{name}.png.part{i//224000:02}';chunk=data[i:i+224000];p.write_bytes(chunk);parts.append({'file':str(p.relative_to(root)),'bytes':len(chunk),'sha256':hashlib.sha256(chunk).hexdigest()})
 manifest.append({'id':name,'version':'round2-study-01' if name.endswith('v01') else 'round2-study-02','status':status,'sourceName':file,'sourceDimensions':list(im.size),'sourceBytes':len(data),'sourceSha256':sha,'parts':parts,'origin':'OpenAI image generation; project-owned runtime atlas reference; no purchased assets','approval':'user animation review pending'})
 if name.endswith('v01'):continue
 yy=cuts(im,rows,1);cells=[]
 for row in range(rows):
  strip=im.crop((0,yy[row],im.width,yy[row+1]));xx=cuts(strip,cols,0)
  for col in range(cols):
   left,top,right,bottom=xx[col],yy[row],xx[col+1],yy[row+1]
   # Refine row cuts PER SPRITE: a low staff in one column must not cut another's boot.
   for edge in ['top','bottom']:
    current=top if edge=='top' else bottom
    if current in (0,im.height):continue
    radius=round(im.height/rows*.16);band=im.crop((left,max(0,current-radius),right,min(im.height,current+radius)))
    values=[]
    for q in range(band.height):values.append(sum(1 for v in band.getchannel('A').crop((0,q,band.width,q+1)).getdata() if v>=200))
    chosen=min(range(len(values)),key=lambda q:(values[q],abs(q-radius)))+max(0,current-radius)
    if edge=='top':top=chosen
    else:bottom=chosen
   for edge in ['left','right']:
    current=left if edge=='left' else right
    if current in (0,im.width):continue
    radius=round(im.width/cols*.17);lo=max(0,current-radius);hi=min(im.width,current+radius);band=im.crop((lo,top,hi,bottom));alpha=band.getchannel('A');values=[sum(1 for v in alpha.crop((q,0,q+1,band.height)).getdata() if v>=200) for q in range(band.width)];chosen=min(range(len(values)),key=lambda q:(values[q],abs(q-radius)))+lo
    if edge=='left':left=chosen
    else:right=chosen
   rect=(left,top,right,bottom);cell=im.crop(rect);mask=cell.getchannel('A').point(lambda a:255 if a>=64 else 0);box=mask.getbbox();assert box
   # Weighted lower-silhouette anchor; no torso rotation, deformation or interpolated frames.
   coords=[]
   for y in range(max(box[1],box[3]-max(8,round((box[3]-box[1])*.12))),box[3]):
    coords.extend(x for x in range(box[0],box[2]) if mask.getpixel((x,y)))
   anchor=(min(coords)+max(coords))/2;ground=box[3]-1;cells.append((cell,box,anchor,ground,rect))
 groups={name:list(range(len(cells)))}
 if name=='archer-react':groups={'archer-react':list(range(12))}
 for group,selected in groups.items():
  selected_cells=[cells[i] for i in selected];size=384;foot=352
  factor=min(min((size/2-14)/max(abs(box[0]-anchor),abs(box[2]-anchor),1),(foot-14)/max(1,ground-box[1])) for cell,box,anchor,ground,rect in selected_cells)
  reference=[c[1][3]-c[1][1] for c in (selected_cells[-1:] if group=='archer-react' else selected_cells)]
  scale=(118 if group=='wukong' or group.startswith('archer') else 112)/(statistics.median(reference)*factor)
  index['groups'][group]=[]
  for batch in range(0,len(selected_cells),4):
   chosen=selected_cells[batch:batch+4];atlas=Image.new('RGBA',(size*len(chosen),size));frames={};key=f'round2-{group}-{batch//4}'
   for j,(cell,box,anchor,ground,rect) in enumerate(chosen):
    n=batch+j;resized=cell.resize((round(cell.width*factor),round(cell.height*factor)),Image.Resampling.LANCZOS);left=round(size/2-anchor*factor);top=round(foot-ground*factor);atlas.alpha_composite(resized,(j*size+left,top));frames[str(n)]={'frame':{'x':j*size,'y':0,'w':size,'h':size},'rotated':False,'trimmed':False,'spriteSourceSize':{'x':0,'y':0,'w':size,'h':size},'sourceSize':{'w':size,'h':size},'pivot':{'x':.5,'y':foot/size}}
    nativeLeft=group=='archer' and selected[n]>=4
    packed=atlas.crop((j*size,0,(j+1)*size,size));packedBox=packed.getchannel('A').point(lambda a:255 if a>=64 else 0).getbbox()
    index['groups'][group].append({'texture':key,'frame':str(n),'scale':scale,'nativeLeft':nativeLeft})
    audit.append({'group':group,'frame':n,'sourceCell':list(rect),'alpha64Bounds':box,'sourceGroundY':ground,'sourceFootX':anchor,'packingScale':factor,'opaqueBorderPixels':sum(1 for x in range(cell.width) for y in [0,cell.height-1] if cell.getpixel((x,y))[3]>=200)+sum(1 for y in range(cell.height) for x in [0,cell.width-1] if cell.getpixel((x,y))[3]>=200),'sourceBorderTouched':box[0]==0 or box[1]==0 or box[2]==cell.width or box[3]==cell.height,'packedAlpha64Bounds':packedBox,'packedMinimumMargin':min(packedBox[0],packedBox[1],size-packedBox[2],size-packedBox[3]),'ground':[size/2,foot],'nativeLeft':nativeLeft})
   path=out/f'{key}.webp';quality=92
   while True:
    atlas.save(path,'WEBP',quality=quality,method=6)
    if path.stat().st_size<280000 or quality<=76:break
    quality-=4
   assert path.stat().st_size<280000
   meta={'frames':frames,'meta':{'image':path.name,'size':{'w':atlas.width,'h':atlas.height},'scale':'1'}};(out/f'{key}.atlas.json').write_text(json.dumps(meta,indent=2));index['atlases'].append({'key':key,'image':path.name,'atlas':f'{key}.atlas.json','bytes':path.stat().st_size,'sha256':hashlib.sha256(path.read_bytes()).hexdigest(),'quality':quality})
(sources/'manifest.json').write_text(json.dumps(manifest,indent=2));(out/'index.json').write_text(json.dumps(index,indent=2));(out/'registration-audit.json').write_text(json.dumps(audit,indent=2));print(json.dumps({'frames':{k:len(v) for k,v in index['groups'].items()},'sourceBorderFlags':[{'group':a['group'],'frame':a['frame']} for a in audit if a['sourceBorderTouched']],'atlasBytes':sum(a['bytes'] for a in index['atlases'])}))
