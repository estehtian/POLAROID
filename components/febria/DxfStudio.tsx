"use client";
import Link from "next/link";
import { useMemo, useState } from "react";
import { MAX_DXF_BYTES, parseDxf, unitLabel, writeDxf, type DxfDocument, type DxfEntity, type DxfPoint, type DxfUnit } from "@/lib/febria/dxf";

const inputClass = "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400";
const buttonClass = "rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-40";
const secondaryClass = "rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-cyan-400";
function pointText(point: DxfPoint, unit: DxfUnit) {
  const scale = unit === "mm" ? 1 : unit === "cm" ? 0.1 : unit === "m" ? 0.001 : 1 / 25.4;
  return `${(point.x * scale).toFixed(2)}, ${(point.y * scale).toFixed(2)} ${unitLabel(unit)}`;
}
function preview(entity: DxfEntity, index: number) {
  const color = ["#22d3ee", "#f472b6", "#facc15", "#a78bfa", "#4ade80"][index % 5];
  if (entity.type === "LINE") return <line key={index} x1={entity.start.x} y1={-entity.start.y} x2={entity.end.x} y2={-entity.end.y} stroke={color} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />;
  if (entity.type === "LWPOLYLINE") {
    const points = entity.points.map(point => `${point.x},${-point.y}`).join(" ");
    return <polyline key={index} points={entity.closed ? `${points} ${entity.points[0].x},${-entity.points[0].y}` : points} fill="none" stroke={color} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />;
  }
  if (entity.type === "CIRCLE") return <circle key={index} cx={entity.center.x} cy={-entity.center.y} r={entity.radius} fill="none" stroke={color} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />;
  const radians = (angle: number) => angle * Math.PI / 180;
  const start = { x: entity.center.x + entity.radius * Math.cos(radians(entity.startAngle)), y: entity.center.y + entity.radius * Math.sin(radians(entity.startAngle)) };
  const end = { x: entity.center.x + entity.radius * Math.cos(radians(entity.endAngle)), y: entity.center.y + entity.radius * Math.sin(radians(entity.endAngle)) };
  const sweep = ((entity.endAngle - entity.startAngle) % 360 + 360) % 360;
  return <path key={index} d={`M ${start.x} ${-start.y} A ${entity.radius} ${entity.radius} 0 ${sweep > 180 ? 1 : 0} 0 ${end.x} ${-end.y}`} fill="none" stroke={color} strokeWidth="1.2" vectorEffect="non-scaling-stroke" />;
}

export default function DxfStudio() {
  const [document, setDocument] = useState<DxfDocument | null>(null);
  const [filename, setFilename] = useState("febria-pattern.dxf");
  const [unit, setUnit] = useState<DxfUnit>("mm");
  const [fallbackUnit, setFallbackUnit] = useState<DxfUnit>("mm");
  const [notice, setNotice] = useState("");
  const [error, setError] = useState("");
  const bounds = useMemo(() => {
    if (!document) return null;
    const points: DxfPoint[] = [];
    for (const entity of document.entities) {
      if (entity.type === "LINE") points.push(entity.start, entity.end);
      else if (entity.type === "LWPOLYLINE") points.push(...entity.points);
      else points.push({ x: entity.center.x - entity.radius, y: entity.center.y - entity.radius }, { x: entity.center.x + entity.radius, y: entity.center.y + entity.radius });
    }
    const xs = points.map(point => point.x), ys = points.map(point => point.y);
    const minX = Math.min(...xs), maxX = Math.max(...xs), minY = Math.min(...ys), maxY = Math.max(...ys);
    const pad = Math.max(maxX - minX, maxY - minY, 1) * 0.05;
    return { x: minX - pad, y: -maxY - pad, width: Math.max(maxX - minX + pad * 2, 1), height: Math.max(maxY - minY + pad * 2, 1) };
  }, [document]);

  const importFile = async (file?: File) => {
    setError(""); setNotice("");
    if (!file) return;
    if (!file.name.toLowerCase().endsWith(".dxf")) { setError("Pilih file dengan ekstensi .dxf."); return; }
    if (file.size > MAX_DXF_BYTES) { setError("Ukuran file maksimal 5 MB."); return; }
    try {
      const parsed = parseDxf(await file.text(), fallbackUnit);
      setDocument(parsed); setFilename(file.name.replace(/\.dxf$/i, "") || "febria-pattern"); setUnit(parsed.sourceUnit);
      const warnings = [!parsed.unitDeclared ? ` Header unit tidak ditemukan/didukung; fallback ${unitLabel(parsed.sourceUnit)} dipakai. Pastikan pilihan unit sumber benar.` : "", parsed.ignoredEntityTypes.length ? ` Entitas lain diabaikan: ${parsed.ignoredEntityTypes.join(", ")}.` : ""].filter(Boolean).join("");
      setNotice(`${parsed.entities.length} entitas diimpor; koordinat dinormalisasi ke mm.${warnings}`);
    } catch (cause) {
      setDocument(null);
      setError(cause instanceof Error ? cause.message : "File DXF tidak dapat dibaca.");
    }
  };

  const exportFile = () => {
    if (!document) return;
    try {
      const blob = new Blob([writeDxf(document.entities, unit)], { type: "application/dxf;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const anchor = window.document.createElement("a");
      anchor.href = url;
      anchor.download = `${filename.replace(/[^\w.-]+/g, "-").replace(/\.dxf$/i, "") || "febria-pattern"}.dxf`;
      anchor.click(); window.setTimeout(() => URL.revokeObjectURL(url), 1000);
      setNotice(`DXF diekspor dalam unit ${unitLabel(unit)}. Periksa skala saat dibuka di aplikasi CAD.`);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "DXF gagal diekspor."); }
  };

  return <main className="mx-auto max-w-6xl space-y-6 p-5 text-slate-100 md:p-8">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-5"><div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">FEBRIA CORE 3000 / CAD INTERCHANGE</p><h1 className="mt-2 text-3xl font-bold">DXF Import / Export</h1><p className="mt-2 max-w-2xl text-sm text-slate-400">Buka geometri 2D DXF, tinjau, lalu ekspor ulang dengan unit dipilih.</p></div><Link href="/workspace" className={secondaryClass}>← Workspace</Link></header>
    <div role="note" className="rounded-xl border border-amber-700/70 bg-amber-950/30 p-4 text-sm text-amber-100"><b>DXF interchange dasar — bukan pola produksi tervalidasi.</b><p className="mt-1 text-amber-200/80">Mendukung ASCII DXF: LINE, LWPOLYLINE tanpa bulge, CIRCLE, dan ARC. Entitas lain tidak dibawa saat ekspor. Unit dan skala 1:1 wajib diperiksa di CAD.</p></div>
    <div className="grid gap-6 lg:grid-cols-[0.8fr_1.2fr]">
      <section className="space-y-4 rounded-2xl border border-slate-800 bg-[#0a1520] p-5"><h2 className="text-lg font-semibold">Impor DXF</h2>
        <label className="block space-y-2 text-sm text-slate-300">Jika header unit hilang/tidak didukung, gunakan unit sumber<select className={inputClass} value={fallbackUnit} onChange={event => setFallbackUnit(event.target.value as DxfUnit)}><option value="mm">Milimeter (mm)</option><option value="cm">Sentimeter (cm)</option><option value="m">Meter (m)</option><option value="inch">Inci (in)</option></select></label>
        <label className="block space-y-2 text-sm text-slate-300">Pilih file ASCII DXF<input className={inputClass} type="file" accept=".dxf,application/dxf" onChange={event => { void importFile(event.currentTarget.files?.[0]); event.currentTarget.value = ""; }} /></label>
        <p className="text-xs text-slate-500">Maksimal 5 MB, 20.000 entitas, dan 100.000 titik. File diproses lokal, tidak diunggah atau disimpan.</p>
        {document && <><label className="block space-y-2 text-sm text-slate-300">Nama file ekspor<input className={inputClass} value={filename} maxLength={100} onChange={event => setFilename(event.target.value)} /></label><label className="block space-y-2 text-sm text-slate-300">Unit ekspor<select className={inputClass} value={unit} onChange={event => setUnit(event.target.value as DxfUnit)}><option value="mm">Milimeter (mm)</option><option value="cm">Sentimeter (cm)</option><option value="m">Meter (m)</option><option value="inch">Inci (in)</option></select></label><button type="button" className={buttonClass} onClick={exportFile}>Ekspor DXF</button><button type="button" className={`${secondaryClass} ml-2`} onClick={() => { setDocument(null); setNotice("Dokumen DXF ditutup."); setError(""); }}>Tutup dokumen</button></>}
        {notice && <p role="status" className="rounded-lg border border-cyan-900 bg-cyan-950/40 p-3 text-sm text-cyan-200">{notice}</p>}{error && <p role="alert" className="rounded-lg border border-rose-900 bg-rose-950/40 p-3 text-sm text-rose-200">{error}</p>}
      </section>
      <section className="space-y-4 rounded-2xl border border-slate-800 bg-[#0a1520] p-5"><div className="flex justify-between"><h2 className="text-lg font-semibold">Pratinjau geometri</h2>{document && <span className="text-xs text-slate-400">{document.entities.length} entitas · koordinat mm</span>}</div>
        {document && bounds ? <div className="overflow-hidden rounded-xl border border-slate-800 bg-slate-950"><svg viewBox={`${bounds.x} ${bounds.y} ${bounds.width} ${bounds.height}`} role="img" aria-label="Pratinjau geometri DXF" className="h-[420px] w-full">{document.entities.map(preview)}</svg></div> : <div className="flex h-[420px] items-center justify-center rounded-xl border border-dashed border-slate-700 text-sm text-slate-500">Impor DXF untuk melihat geometri 2D.</div>}
        {document && <div className="max-h-48 overflow-auto rounded-lg border border-slate-800"><table className="w-full text-left text-xs"><thead className="sticky top-0 bg-slate-900 text-slate-400"><tr><th className="p-2">Entitas</th><th className="p-2">Layer</th><th className="p-2">Geometri</th></tr></thead><tbody>{document.entities.slice(0, 200).map((entity, index) => <tr key={index} className="border-t border-slate-800"><td className="p-2">{entity.type}</td><td className="p-2">{entity.layer}</td><td className="p-2">{entity.type === "LINE" ? `${pointText(entity.start, "mm")} → ${pointText(entity.end, "mm")}` : entity.type === "LWPOLYLINE" ? `${entity.points.length} titik${entity.closed ? " · tertutup" : " · terbuka"}` : `r ${entity.radius.toFixed(2)} mm`}</td></tr>)}</tbody></table>{document.entities.length > 200 && <p className="p-2 text-xs text-slate-500">Menampilkan 200 dari {document.entities.length} entitas.</p>}</div>}
      </section>
    </div>
  </main>;
}
