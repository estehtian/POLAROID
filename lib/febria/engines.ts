import type {Measurement} from "./store";

export function calculateEase(body:number,ease:number) {
  return Math.round((body+ease)*10)/10;
}
export function gradeMeasurement(base:number,step:number,increments:number) {
  return Math.round((base+step*increments)*10)/10;
}
export function estimateFabric(widthCm:number,lengthM:number) {
  return Math.max(0,widthCm)*Math.max(0,lengthM)/100;
}
export function escapeXml(value:string) {
  return value.replace(/[<>&'"]/g,c=>({"<":"&lt;",">":"&gt;","&":"&amp;","'":"&apos;",'"':"&quot;"}[c]!));
}
export function buildBodiceDraft(m:Measurement, ease=0) {
  const chest=Number.isFinite(m.chest) ? Math.max(0,m.chest) : 0;
  const bodyLength=Number.isFinite(m.bodyLength) ? Math.max(0,m.bodyLength) : 0;
  const safeEase=Number.isFinite(ease) ? ease : 0;
  const width=Math.max(20,Math.round((chest/4+safeEase/4+4)*10)/10);
  const height=Math.max(30,Math.round(bodyLength*10)/10);
  const w=width*8, h=height*8;
  const neckW=Math.max(24,m.neck*1.2), shoulder=m.shoulder*2.5;
  const svg=`<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w+80} ${h+80}" width="${(w+80)/8}cm" height="${(h+80)/8}cm">
  <rect width="100%" height="100%" fill="#fff"/>
  <g transform="translate(40 40)" fill="none" stroke="#111827" stroke-width="2">
    <path d="M 0 0 L ${neckW} 0 L ${shoulder} 35 L ${w} 55 L ${w} ${h} L 0 ${h} Z"/>
    <path d="M 0 0 Q ${neckW/2} 45 ${neckW} 0" stroke="#0891b2"/>
    <path d="M ${w/2} 55 L ${w/2} ${h}" stroke="#94a3b8" stroke-dasharray="6 5"/>
    <path d="M -15 0 L -15 ${h}" stroke="#dc2626"/>
  </g>
  <g fill="#111827" font-family="Arial" font-size="14"><text x="40" y="25">FEBRIA draft — FRONT BLOCK</text><text x="40" y="${h+65}">Draft only · verify geometry, balance, ease and toile</text></g>
</svg>`;
  return {width,height,svg};
}
export function downloadText(filename:string,text:string,mime="text/plain") {
  if(typeof window==="undefined") return;
  const blob=new Blob([text],{type:mime});
  const url=URL.createObjectURL(blob);
  const a=document.createElement("a"); a.href=url; a.download=filename;
  document.body.appendChild(a); a.click(); a.remove();
  window.setTimeout(()=>URL.revokeObjectURL(url),1000);
}
