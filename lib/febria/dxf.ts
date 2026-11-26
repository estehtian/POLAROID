export type DxfUnit = "mm" | "cm" | "m" | "inch";
export type DxfPoint = {x:number;y:number};
export type DxfEntity =
 | {type:"LINE";layer:string;start:DxfPoint;end:DxfPoint}
 | {type:"LWPOLYLINE";layer:string;points:DxfPoint[];closed:boolean}
 | {type:"CIRCLE";layer:string;center:DxfPoint;radius:number}
 | {type:"ARC";layer:string;center:DxfPoint;radius:number;startAngle:number;endAngle:number};
export type DxfDocument = {entities:DxfEntity[];sourceUnit:DxfUnit;ignoredEntityTypes:string[]};

export const MAX_DXF_BYTES = 5*1024*1024;
export const MAX_DXF_ENTITIES = 20000;
const UNITS_TO_MM:Record<DxfUnit,number>={mm:1,cm:10,m:1000,inch:25.4};

type Pair={code:number;value:string};
function parsePairs(text:string):Pair[] {
  const lines=text.replace(/^\uFEFF/,"").split(/\r?\n/);
  if(lines.length%2!==0) throw new Error("Format DXF tidak lengkap: baris kode/nilai tidak berpasangan.");
  const pairs:Pair[]=[];
  for(let i=0;i<lines.length;i+=2){
    const code=Number(lines[i].trim());
    if(!Number.isInteger(code)||code<0||code>1071) throw new Error(`Group code DXF tidak valid pada baris ${i+1}.`);
    pairs.push({code,value:lines[i+1].trim()});
  }
  return pairs;
}
function numberValue(value:string|undefined,label:string):number {
  if(value===undefined||value.trim()==="") throw new Error(`Nilai ${label} tidak ditemukan.`);
  const number=Number(value); if(!Number.isFinite(number)) throw new Error(`Nilai ${label} bukan angka valid.`); return number;
}
function toMm(value:number,unit:DxfUnit):number {
  const converted=value*UNITS_TO_MM[unit];
  if(!Number.isFinite(converted)||Math.abs(converted)>1e7) throw new Error("Koordinat DXF berada di luar batas aman.");
  return converted;
}
function getUnit(pairs:Pair[]):DxfUnit {
  for(let i=0;i<pairs.length;i++){
    if(pairs[i].code===9&&pairs[i].value==="$INSUNITS"){
      const ins=pairs.slice(i+1).find(p=>p.code===70);
      if(ins){ if(Number(ins.value)===4)return "mm"; if(Number(ins.value)===5)return "cm"; if(Number(ins.value)===6)return "m"; if(Number(ins.value)===1)return "inch"; }
    }
  }
  return "mm";
}
function one(pairs:Pair[],code:number){return pairs.find(p=>p.code===code)?.value}
function all(pairs:Pair[],code:number){return pairs.filter(p=>p.code===code).map(p=>p.value)}
function point(pairs:Pair[],xc:number,yc:number,unit:DxfUnit,label:string):DxfPoint {
  return {x:toMm(numberValue(one(pairs,xc),`${label}.x`),unit),y:toMm(numberValue(one(pairs,yc),`${label}.y`),unit)};
}

export function parseDxf(text:string):DxfDocument {
  if(new TextEncoder().encode(text).byteLength>MAX_DXF_BYTES) throw new Error("Ukuran DXF maksimal 5 MB.");
  const pairs=parsePairs(text), sourceUnit=getUnit(pairs);
  const entities:DxfEntity[]=[], ignoredEntityTypes:string[]=[];
  let inEntities=false, current:Pair[]|null=null, records:Pair[][]=[];
  for(let i=0;i<pairs.length;i++){
    const pair=pairs[i];
    if(pair.code===2&&pair.value==="ENTITIES") {inEntities=true;records=[];current=null;continue}
    if(inEntities&&pair.code===0&&pair.value=== "ENDSEC") {inEntities=false;break}
    if(!inEntities)continue;
    if(pair.code===0){current=[];records.push(current)} else if(current)current.push(pair);
  }
  if(!records.length) throw new Error("Tidak menemukan section ENTITIES pada file DXF.");
  if(records.length>MAX_DXF_ENTITIES) throw new Error("Jumlah entitas melebihi batas 20.000.");
  for(const record of records){
    const type=(record[0]?.value||"").toUpperCase(); const data=record.slice(1); const layer=(one(data,8)||"0").slice(0,128);
    try{
      if(type=== "LINE") entities.push({type,layer,start:point(data,10,20,sourceUnit,"LINE start"),end:point(data,11,21,sourceUnit,"LINE end")});
      else if(type=== "LWPOLYLINE"){
        const xs=all(data,10),ys=all(data,20); if(xs.length<2||xs.length!==ys.length)throw new Error("LWPOLYLINE memerlukan minimal dua pasangan koordinat.");
        entities.push({type,layer,points:xs.map((x,i)=>({x:toMm(numberValue(x,"LWPOLYLINE.x"),sourceUnit),y:toMm(numberValue(ys[i],"LWPOLYLINE.y"),sourceUnit)})),closed:(Number(one(data,70)||"0")&1)===1});
      }else if(type=== "CIRCLE"){
        const center=point(data,10,20,sourceUnit,"CIRCLE center"), radius=toMm(numberValue(one(data,40),"CIRCLE radius"),sourceUnit); if(radius<=0)throw new Error("Radius CIRCLE harus lebih dari nol."); entities.push({type,layer,center,radius});
      }else if(type=== "ARC"){
        const center=point(data,10,20,sourceUnit,"ARC center"),radius=toMm(numberValue(one(data,40),"ARC radius"),sourceUnit); if(radius<=0)throw new Error("Radius ARC harus lebih dari nol."); entities.push({type,layer,center,radius,startAngle:numberValue(one(data,50),"ARC start angle"),endAngle:numberValue(one(data,51),"ARC end angle")});
      }else if(type&&type!=="SEQEND") ignoredEntityTypes.push(type);
    }catch(error){throw new Error(`${type}: ${error instanceof Error?error.message:"data tidak valid"}`)}
  }
  if(!entities.length)throw new Error("Tidak ada entitas yang didukung: LINE, LWPOLYLINE, CIRCLE, ARC.");
  return {entities,sourceUnit,ignoredEntityTypes:[...new Set(ignoredEntityTypes)]};
}

function fmt(value:number){if(!Number.isFinite(value))throw new Error("Koordinat non-finite.");return Number(value.toFixed(6)).toString()}
function pair(code:number,value:string|number){return `${code}\n${typeof value=== "number"?fmt(value):value}\n`}
export function writeDxf(entities:DxfEntity[],unit:DxfUnit):string{
  if(!entities.length)throw new Error("Tidak ada entitas untuk diekspor."); if(entities.length>MAX_DXF_ENTITIES)throw new Error("Jumlah entitas melebihi batas 20.000.");
  const scale=1/UNITS_TO_MM[unit]; let output="";
  const insunit=unit=== "inch"?1:unit=== "mm"?4:unit=== "cm"?5:6;
  output+=pair(0,"SECTION")+pair(2,"HEADER")+pair(9,"$ACADVER")+pair(1,"AC1009")+pair(9,"$INSUNITS")+pair(70,insunit)+pair(0,"ENDSEC");
  output+=pair(0,"SECTION")+pair(2,"ENTITIES");
  for(const e of entities){
    if(e.type=== "LINE")output+=pair(0,"LINE")+pair(8,e.layer)+pair(10,e.start.x*scale)+pair(20,e.start.y*scale)+pair(30,0)+pair(11,e.end.x*scale)+pair(21,e.end.y*scale)+pair(31,0);
    else if(e.type=== "LWPOLYLINE"){output+=pair(0,"LWPOLYLINE")+pair(8,e.layer)+pair(90,e.points.length)+pair(70,e.closed?1:0);for(const p of e.points)output+=pair(10,p.x*scale)+pair(20,p.y*scale)}
    else if(e.type=== "CIRCLE")output+=pair(0,"CIRCLE")+pair(8,e.layer)+pair(10,e.center.x*scale)+pair(20,e.center.y*scale)+pair(30,0)+pair(40,e.radius*scale);
    else output+=pair(0,"ARC")+pair(8,e.layer)+pair(10,e.center.x*scale)+pair(20,e.center.y*scale)+pair(30,0)+pair(40,e.radius*scale)+pair(50,e.startAngle)+pair(51,e.endAngle);
  }
  output+=pair(0,"ENDSEC")+pair(0,"EOF"); return output;
}
export function unitLabel(unit:DxfUnit){return unit=== "inch"?"in":unit}
