import type {Point} from './world';
export const SAMPLE_MAP={width:1600,height:900,tile:16,start:{x:240,y:720},destination:{x:1456,y:272}};
export type SampleTerrain='road'|'grass'|'forest'|'shallow'|'mountain'|'cliff'|'deep-water'|'background'|'fence';
export interface TerrainRegion {id:string;terrain:SampleTerrain;polygon:Point[];}
const p=(pairs:number[][]):Point[]=>pairs.map(([x,y])=>({x:x*1600/1672,y:y*900/941}));
// Hand-authored in source-image coordinates. These are ground surfaces, not a
// distance-to-road rule. Distant terraces/background have no foreground access.
export const REGIONS:TerrainRegion[]=[
 {id:'western-clearing',terrain:'grass',polygon:p([[0,754],[115,700],[244,637],[306,589],[391,562],[478,503],[577,475],[670,474],[779,484],[858,478],[945,491],[1025,526],[1107,552],[1015,597],[929,638],[827,686],[714,731],[598,786],[464,839],[330,887],[178,935],[0,935]])},
 {id:'eastern-ground',terrain:'grass',polygon:p([[1030,448],[1045,414],[1103,375],[1201,350],[1324,290],[1413,212],[1460,144],[1504,100],[1600,70],[1672,65],[1672,245],[1621,294],[1577,343],[1500,385],[1420,413],[1325,449],[1232,487],[1170,519],[1120,522]])},
 {id:'western-grove',terrain:'forest',polygon:p([[154,678],[230,614],[312,586],[391,585],[432,623],[355,678],[280,719],[219,730]])},
 {id:'northern-grove',terrain:'forest',polygon:p([[1200,357],[1300,307],[1372,274],[1426,265],[1390,313],[1312,354],[1241,389]])},
 {id:'stone-ford-shallows',terrain:'shallow',polygon:p([[942,470],[978,450],[1020,453],[1060,478],[1123,512],[1140,546],[1105,562],[1054,545],[1000,518],[964,498]])},
 {id:'ford-flat-stones',terrain:'road',polygon:p([[1018,478],[1042,482],[1072,498],[1106,514],[1132,526],[1125,542],[1090,530],[1055,514],[1023,496]])},
 // Collision exclusions override all traversable surfaces, including roadside rocks.
 {id:'western-boulder',terrain:'mountain',polygon:p([[315,562],[342,503],[390,453],[435,454],[477,491],[487,537],[458,572],[419,588],[365,589]])},
 {id:'clearing-rock',terrain:'mountain',polygon:p([[903,465],[930,452],[954,464],[964,490],[939,504],[910,492]])},
 {id:'ford-bank-rock',terrain:'mountain',polygon:p([[1143,481],[1184,471],[1211,495],[1204,536],[1168,541],[1146,515]])},
 {id:'northern-mountain',terrain:'mountain',polygon:p([[1068,0],[1465,0],[1440,176],[1370,244],[1270,285],[1150,313],[1084,278]])},
 {id:'foreground-cliff',terrain:'cliff',polygon:p([[460,852],[620,791],[762,728],[895,662],[990,646],[981,702],[878,787],[812,900],[722,941],[460,941]])},
 {id:'foreground-fence',terrain:'fence',polygon:p([[485,839],[552,809],[628,774],[699,738],[772,700],[845,668],[918,633],[962,621],[972,640],[927,655],[855,690],[786,721],[714,759],[640,796],[565,831],[496,856]])},
 {id:'southwest-fence',terrain:'fence',polygon:p([[50,902],[157,890],[251,881],[341,863],[350,886],[263,906],[160,932],[70,941]])},
 {id:'east-bank-fence',terrain:'fence',polygon:p([[1440,385],[1515,356],[1578,324],[1585,343],[1527,375],[1450,406]])},
 {id:'grove-root-rock',terrain:'mountain',polygon:p([[224,610],[245,594],[273,602],[287,624],[272,644],[239,640]])},
 {id:'deep-pool',terrain:'deep-water',polygon:p([[1198,610],[1305,563],[1420,575],[1500,627],[1457,705],[1300,781],[1189,806],[1107,775],[1108,694]])}
];
export const ROAD:Point[]=p([[0,838],[250,740],[500,644],[690,570],[920,544],[1060,514],[1139,450],[1275,397],[1442,309],[1567,204],[1671,151]]);
export function insidePolygon(q:Point,polygon:Point[]){let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a.y>q.y)!==(b.y>q.y)&&q.x<(b.x-a.x)*(q.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
const traversable=(t:SampleTerrain)=>['road','grass','forest','shallow'].includes(t);
function segmentDistance(q:Point,a:Point,b:Point){const dx=b.x-a.x,dy=b.y-a.y,t=dx===0&&dy===0?0:Math.max(0,Math.min(1,((q.x-a.x)*dx+(q.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(q.x-a.x-t*dx,q.y-a.y-t*dy);}
// Bake the fine grid once. Use the SAME layer for pathfinding, speed and overlay.
const columns=Math.ceil(SAMPLE_MAP.width/SAMPLE_MAP.tile),rows=Math.ceil(SAMPLE_MAP.height/SAMPLE_MAP.tile);
export const FOOT_CLEARANCE=6;
const blockers=REGIONS.filter(r=>['fence','mountain','cliff','deep-water'].includes(r.terrain));
function classify(q:Point):SampleTerrain{let ground:SampleTerrain='background';for(const r of REGIONS)if(insidePolygon(q,r.polygon))ground=r.terrain;for(const r of blockers)if(insidePolygon(q,r.polygon)||r.polygon.some((b,i)=>segmentDistance(q,r.polygon[(i+r.polygon.length-1)%r.polygon.length],b)<=FOOT_CLEARANCE))ground=r.terrain;if(ground==='grass'&&ROAD.slice(1).some((b,i)=>segmentDistance(q,ROAD[i],b)<35))ground='road';return ground;}
export const TERRAIN_GRID:SampleTerrain[][]=Array.from({length:rows},(_,y)=>Array.from({length:columns},(_,x)=>classify({x:(x+.5)*16,y:(y+.5)*16})));
export function sampleTerrain(x:number,y:number):SampleTerrain{return x<0||y<0||x>=columns||y>=rows?'cliff':TERRAIN_GRID[y][x];}
export function sampleWalkable(x:number,y:number){return traversable(sampleTerrain(x,y));}
export const TERRAIN_COLORS:Record<SampleTerrain,number>={road:0xe4b560,grass:0x62c572,forest:0x237b45,shallow:0x40bddd,mountain:0xc84d46,cliff:0x745b9a,'deep-water':0x213b96,background:0x59646f,fence:0xff964f};
export function sampleSpeed(x:number,y:number){const t=sampleTerrain(Math.floor(x/16),Math.floor(y/16));return t==='forest'?.8:t==='shallow'?.65:1;}

const collisionPolygons=blockers.map(r=>({...r,minX:Math.min(...r.polygon.map(p=>p.x))-FOOT_CLEARANCE,maxX:Math.max(...r.polygon.map(p=>p.x))+FOOT_CLEARANCE,minY:Math.min(...r.polygon.map(p=>p.y))-FOOT_CLEARANCE,maxY:Math.max(...r.polygon.map(p=>p.y))+FOOT_CLEARANCE}));
const cross=(a:Point,b:Point,c:Point)=>(b.x-a.x)*(c.y-a.y)-(b.y-a.y)*(c.x-a.x);
function edgesIntersect(a:Point,b:Point,c:Point,d:Point){return Math.max(a.x,b.x)>=Math.min(c.x,d.x)&&Math.max(c.x,d.x)>=Math.min(a.x,b.x)&&Math.max(a.y,b.y)>=Math.min(c.y,d.y)&&Math.max(c.y,d.y)>=Math.min(a.y,b.y)&&cross(a,b,c)*cross(a,b,d)<=0&&cross(c,d,a)*cross(c,d,b)<=0;}
// Continuous swept-foot guard supplements the grid. Polygon corners between
// cell centres must still block the actor's six-pixel collision radius.
export function sampleGeometryClear(a:Point,b:Point){for(const r of collisionPolygons){if(Math.max(a.x,b.x)<r.minX||Math.min(a.x,b.x)>r.maxX||Math.max(a.y,b.y)<r.minY||Math.min(a.y,b.y)>r.maxY)continue;if(insidePolygon(a,r.polygon)||insidePolygon(b,r.polygon))return false;for(let i=0;i<r.polygon.length;i++){const c=r.polygon[i],d=r.polygon[(i+1)%r.polygon.length];if(edgesIntersect(a,b,c,d)||Math.min(segmentDistance(a,c,d),segmentDistance(b,c,d),segmentDistance(c,a,b),segmentDistance(d,a,b))<=FOOT_CLEARANCE)return false;}}return true;}
