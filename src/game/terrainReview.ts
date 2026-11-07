import type {SampleTerrain} from './sampleMap';
export const TERRAIN_REVIEW:{id:string;label:string;source:{x:number;y:number};before:SampleTerrain;expected:SampleTerrain;reason:string}[]=[
 {id:'F01',label:'西南围栏',source:{x:160,y:916},before:'grass',expected:'fence',reason:'草地色块曾覆盖围栏基脚；新增独立围栏碰撞及6px脚底净距。'},
 {id:'F02',label:'东侧河岸围栏',source:{x:1520,y:365},before:'grass',expected:'fence',reason:'河岸草地曾连通穿过木栏；按围栏走向增加阻挡。'},
 {id:'R01',label:'树林根部岩石',source:{x:255,y:620},before:'forest',expected:'mountain',reason:'树林可走不代表实体岩石可穿越，单独排除根部大石。'},
 {id:'W01',label:'过溪平石',source:{x:1048,y:496},before:'shallow',expected:'road',reason:'平坦过溪石面不应整片视为涉水，单独标为可走石路。'},
 {id:'W02',label:'平石旁浅溪',source:{x:1000,y:483},before:'shallow',expected:'shallow',reason:'保留相邻浅溪涉水与减速，不将整个河流封死。'},
 {id:'F03',label:'前景临崖围栏',source:{x:580,y:800},before:'background',expected:'fence',reason:'显式区分围栏与远景；边缘脚底净距减少贴栏穿模。'}
];
export const reviewWorld=(source:{x:number;y:number})=>({x:source.x*1600/1672,y:source.y*900/941});
