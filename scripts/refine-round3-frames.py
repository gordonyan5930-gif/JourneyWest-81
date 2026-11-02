"""Lossless SOURCE-pixel selection, not painting or regeneration.
Restore connected silhouette pixels cut by round2 rectangles; remove neighbour
pose fragments. Preserve every accepted frame and every original atlas byte.
"""
from pathlib import Path
from PIL import Image,ImageFilter
import numpy as np,json,hashlib,os
from scipy import ndimage
root=Path(__file__).resolve().parents[1];old=root/'assets/quality-b/round2';out=root/'assets/quality-b/round3';out.mkdir(exist_ok=True)
audit=json.load(open(old/'registration-audit.json'));sources={s['id']:s for s in json.load(open(old/'sources/manifest.json'))};idx=json.load(open(old/'index.json'));patched=json.loads(json.dumps(idx));new_atlases=[];reviews=[];fixed=[]
repair={'wukong':[0,4,5,12,13,15,17,23],'archer-react':[3,7],'tang':[0,1,3,4,5,7],'archer':[5,6,7]}
for group in repair:
 source=Path(os.environ.get('ROUND2_SOURCE_DIR',str(root.parent/'generated_images')))/sources[group]['sourceName']
 if not source.exists():source=Path('/tmp/journeywest-round2-originals')/sources[group]['sourceName']
 raw=source.read_bytes();assert hashlib.sha256(raw).hexdigest()==sources[group]['sourceSha256'];rgba=np.array(Image.open(source).convert('RGBA'));labels,n=ndimage.label(rgba[:,:,3]>=64);objects=ndimage.find_objects(labels);group_rows=[a for a in audit if a['group']==group];mains=[]
 for a in group_rows:
  x,y,r,b=a['sourceCell'];l=labels[y:b,x:r];u,c=np.unique(l[l>0],return_counts=True);mains.append(int(u[np.argmax(c)]))
 assert len(set(mains))==len(mains),'Connected poses require manual art editing; do not auto-split anatomy'
 seeds=np.isin(labels,mains);_,nearest=ndimage.distance_transform_edt(~seeds,return_indices=True);ownership=labels[nearest[0],nearest[1]]
 for a,primary in zip(group_rows,mains):
  frame=a['frame'];sl=objects[primary-1];bbox=[sl[1].start,sl[0].start,sl[1].stop,sl[0].stop];x,y,r,b=a['sourceCell'];extension=[max(0,x-bbox[0]),max(0,y-bbox[1]),max(0,bbox[2]-r),max(0,bbox[3]-b)]
  row={'group':group,'frame':frame,'baselineSourceBorderTouched':a['sourceBorderTouched'],'opaqueBorderPixels':a['opaqueBorderPixels'],'oldSourceCell':a['sourceCell'],'originalSilhouetteBounds':bbox,'originalSourceSha256':sources[group]['sourceSha256'],'recoveredPixelsBeyondOldCrop':extension,'decision':'repair' if frame in repair[group] else 'accept','reason':''}
  if frame not in repair[group]:
   row['reason']='Full original silhouette and weapon/boots retained; boundary flag is a touching antialiased edge, not missing anatomy. Visual review at game size and source size; no regeneration.' if a['sourceBorderTouched'] else 'No border flag; silhouette, hands, cape and foot registration retained. Preserve approved runtime frame pixels.'
  else:
   selected=(ownership==primary)&(rgba[:,:,3]>0);ys,xs=np.nonzero(selected);left=max(0,int(xs.min())-3);top=max(0,int(ys.min())-3);right=min(rgba.shape[1],int(xs.max())+4);bottom=min(rgba.shape[0],int(ys.max())+4);cell=rgba[top:bottom,left:right].copy();cell[:,:,3]*=selected[top:bottom,left:right];im=Image.fromarray(cell);mask=np.array(im)[:,:,3]>=64;yy,xx=np.nonzero(mask);ground=int(yy.max());low=(yy>=ground-max(8,round((yy.max()-yy.min())*.12)));anchor=(int(xx[low].min())+int(xx[low].max()))/2
   factor=a['packingScale'];resized=im.resize((round(im.width*factor),round(im.height*factor)),Image.Resampling.LANCZOS);canvas=Image.new('RGBA',(384,384));canvas.alpha_composite(resized,(round(192-anchor*factor),round(352-ground*factor)));key=f'round3-{group}-{frame}';image=out/(key+'.webp');canvas.save(image,'WEBP',lossless=True,method=6);assert image.stat().st_size<280000
   meta={'frames':{str(frame):{'frame':{'x':0,'y':0,'w':384,'h':384},'rotated':False,'trimmed':False,'spriteSourceSize':{'x':0,'y':0,'w':384,'h':384},'sourceSize':{'w':384,'h':384},'pivot':{'x':.5,'y':352/384}}},'meta':{'image':image.name,'size':{'w':384,'h':384},'scale':'1'}};atlas=out/(key+'.atlas.json');atlas.write_text(json.dumps(meta,indent=2));new_atlases.append({'key':key,'image':image.name,'atlas':atlas.name,'bytes':image.stat().st_size,'sha256':hashlib.sha256(image.read_bytes()).hexdigest(),'encoding':'lossless WebP'})
   patched['groups'][group][frame]['texture']=key;fixed.append({'group':group,'frame':frame});outside=np.ones(labels.shape,dtype=bool);outside[y:b,x:r]=False;recovered=int(((labels==primary)&outside).sum());foreign=int(((labels[y:b,x:r]>0)&(ownership[y:b,x:r]!=primary)).sum());row.update(recoveredAlpha64Pixels=recovered,foreignAlpha64PixelsRemoved=foreign,reason='Restore existing source silhouette beyond old crop and/or remove a neighbouring pose fragment. No invented pixels, no padding claimed as source repair.',newSourceRect=[left,top,right,bottom],sourceFoot=[left+anchor,top+ground],runtimeSha256=hashlib.sha256(image.read_bytes()).hexdigest(),repaintedPixels=0,sourcePixelSelectionOnly=True)
  reviews.append(row)

for group,frames in patched['groups'].items():
 for f in frames:f['scale']*=dict(wukong=.92,tang=.98,archer=.94,**{'archer-react':.94})[group]
patched['atlases']=[dict(a,directory='round2') for a in idx['atlases']]+[dict(a,directory='round3') for a in new_atlases];(out/'index.json').write_text(json.dumps(patched,indent=2));(out/'frame-review.json').write_text(json.dumps({'baseline':'3fcac721','frames':reviews,'reviewed':len(reviews),'baselineFlags':sum(a['sourceBorderTouched'] for a in audit),'fixed':fixed,'allOriginalAtlasesUnchanged':True,'visualScaleMultipliers':{'wukong':.92,'tang':.98,'archer':.94,'archer-react':.94},'oldRunEscortScale':{'before':.31,'after':.335},'formalAnimationApproval':False,'remaining':'Anatomical hand/cape continuity and full motion naturalness remain for user review; engineering recovery is not a production animation approval.'},indent=2));print(json.dumps({'reviewed':len(reviews),'repaired':len(fixed),'newBytes':sum(a['bytes'] for a in new_atlases)}))
