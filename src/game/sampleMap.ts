import type {Point} from './world';
export const SAMPLE_MAP={width:1600,height:900,tile:16,start:{x:240,y:720},destination:{x:1456,y:272}};
export type SampleTerrain='road'|'grass'|'forest'|'shallow'|'mountain'|'cliff'|'deep-water'|'background';
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
 // Collision exclusions override all traversable surfaces, including roadside rocks.
 {id:'western-boulder',terrain:'mountain',polygon:p([[315,562],[342,503],[390,453],[435,454],[477,491],[487,537],[458,572],[419,588],[365,589]])},
 {id:'clearing-rock',terrain:'mountain',polygon:p([[903,465],[930,452],[954,464],[964,490],[939,504],[910,492]])},
 {id:'ford-bank-rock',terrain:'mountain',polygon:p([[1143,481],[1184,471],[1211,495],[1204,536],[1168,541],[1146,515]])},
 {id:'northern-mountain',terrain:'mountain',polygon:p([[1068,0],[1465,0],[1440,176],[1370,244],[1270,285],[1150,313],[1084,278]])},
 {id:'foreground-cliff',terrain:'cliff',polygon:p([[460,852],[620,791],[762,728],[895,662],[990,646],[981,702],[878,787],[812,900],[722,941],[460,941]])},
 {id:'deep-pool',terrain:'deep-water',polygon:p([[1198,610],[1305,563],[1420,575],[1500,627],[1457,705],[1300,781],[1189,806],[1107,775],[1108,694]])}
];
export const ROAD:Point[]=p([[0,838],[250,740],[500,644],[690,570],[920,544],[1060,514],[1139,450],[1275,397],[1442,309],[1567,204],[1671,151]]);
export function insidePolygon(q:Point,polygon:Point[]){let inside=false;for(let i=0,j=polygon.length-1;i<polygon.length;j=i++){const a=polygon[i],b=polygon[j];if((a.y>q.y)!==(b.y>q.y)&&q.x<(b.x-a.x)*(q.y-a.y)/(b.y-a.y)+a.x)inside=!inside;}return inside;}
const traversable=(t:SampleTerrain)=>['road','grass','forest','shallow'].includes(t);
function segmentDistance(q:Point,a:Point,b:Point){const dx=b.x-a.x,dy=b.y-a.y,t=Math.max(0,Math.min(1,((q.x-a.x)*dx+(q.y-a.y)*dy)/(dx*dx+dy*dy)));return Math.hypot(q.x-a.x-t*dx,q.y-a.y-t*dy);}
// Bake the fine grid once. Use the SAME layer for pathfinding, speed and overlay.
const columns=Math.ceil(SAMPLE_MAP.width/SAMPLE_MAP.tile),rows=Math.ceil(SAMPLE_MAP.height/SAMPLE_MAP.tile);
function classify(q:Point):SampleTerrain{let ground:SampleTerrain='background';for(const r of REGIONS)if(insidePolygon(q,r.polygon))ground=r.terrain;if(ground==='grass'&&ROAD.slice(1).some((b,i)=>segmentDistance(q,ROAD[i],b)<35))ground='road';return ground;}
export const TERRAIN_GRID:SampleTerrain[][]=Array.from({length:rows},(_,y)=>Array.from({length:columns},(_,x)=>classify({x:(x+.5)*16,y:(y+.5)*16})));
export function sampleTerrain(x:number,y:number):SampleTerrain{return x<0||y<0||x>=columns||y>=rows?'cliff':TERRAIN_GRID[y][x];}
export function sampleWalkable(x:number,y:number){return traversable(sampleTerrain(x,y));}
export const TERRAIN_COLORS:Record<SampleTerrain,number>={road:0xe4b560,grass:0x62c572,forest:0x237b45,shallow:0x40bddd,mountain:0xc84d46,cliff:0x745b9a,'deep-water':0x213b96,background:0x59646f};
export function sampleSpeed(x:number,y:number){const t=sampleTerrain(Math.floor(x/16),Math.floor(y/16));return t==='forest'?.8:t==='shallow'?.65:1;}
