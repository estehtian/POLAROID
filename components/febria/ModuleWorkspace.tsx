"use client";

import Link from "next/link";
import { useEffect, useMemo, useState } from "react";
import {
  MODULES, ModuleKey, ModuleDefinition,
  Measurement, Project, Task, Garment,
  loadStore, saveStore, defaultStore,
} from "@/lib/febria/store";
import {
  buildBodiceDraft, calculateEase, gradeMeasurement,
  estimateFabric, downloadText, escapeXml,
} from "@/lib/febria/engines";

type Store = ReturnType<typeof defaultStore>;

const inputClass = "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400";
const buttonClass = "rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300 disabled:opacity-40";
const secondaryClass = "rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-cyan-400";

function Field({label,value,onChange,step="1"}:{label:string;value:number;onChange:(n:number)=>void;step?:string}) {
  return <label className="block space-y-1 text-xs text-slate-400">{label}<input className={inputClass} type="number" min="0" step={step} value={value} onChange={e=>onChange(Number(e.target.value))}/></label>;
}

export default function ModuleWorkspace({moduleKey}:{moduleKey:ModuleKey}) {
  const mod = MODULES.find(m=>m.key===moduleKey)!;
  const [store,setStore] = useState<Store>(defaultStore);
  const [ready,setReady] = useState(false);
  const [notice,setNotice] = useState("");
  const [name,setName] = useState("Sample project");
  const [garment,setGarment] = useState("Kemeja");
  const [measurement,setMeasurement] = useState<Measurement>({id:"",name:"Profil ukuran utama",garment:"Kemeja",chest:96,waist:82,hip:98,shoulder:40,bodyLength:68,sleeve:60,neck:38,unit:"cm"});
  const [ease,setEase] = useState(8);
  const [grade,setGrade] = useState(4);
  const [fabricWidth,setFabricWidth] = useState(150);
  const [fabricLength,setFabricLength] = useState(2);
  const [task,setTask] = useState("Periksa draft pola");
  const [assistantQuestion,setAssistantQuestion] = useState("Bagaimana memulai pola kemeja?");
  const [draft,setDraft] = useState<{width:number;height:number;svg:string}|null>(null);
  const [selectedProject,setSelectedProject] = useState("");

  useEffect(()=>{ setStore(loadStore()); setReady(true); },[]);
  useEffect(()=>{ if(ready) saveStore(store); },[store,ready]);

  const project = store.projects.find(p=>p.id===selectedProject) ?? store.projects[0];
  const measurements = store.measurements;
  const setField = (key:keyof Measurement,value:number|string) => setMeasurement(m=>({...m,[key]:value}));
  const addMeasurement = () => {
    const item={...measurement,id:crypto.randomUUID()};
    setStore(s=>({...s,measurements:[item,...s.measurements]}));
    setNotice("Profil ukuran tersimpan di browser ini.");
  };
  const addProject = () => {
    const item:Project={id:crypto.randomUUID(),name,garment,status:"Draft",updatedAt:new Date().toISOString()};
    setStore(s=>({...s,projects:[item,...s.projects]}));
    setSelectedProject(item.id); setNotice("Proyek dibuat.");
  };
  const addTask = () => {
    const item:Task={id:crypto.randomUUID(),title:task,done:false};
    setStore(s=>({...s,tasks:[item,...s.tasks]})); setTask(""); setNotice("Tugas ditambahkan.");
  };
  const generate = () => {
    const result=buildBodiceDraft(measurement);
    setDraft(result); setStore(s=>({...s,lastDraft:{width:result.width,height:result.height,svg:result.svg}}));
    setNotice("Draft parametrik dibuat. Wajib validasi sebelum digunakan.");
  };
  const downloadSvg = () => {
    const svg=draft?.svg ?? store.lastDraft?.svg;
    if(svg) downloadText("febria-pattern-draft.svg",svg,"image/svg+xml");
    else setNotice("Buat draft terlebih dahulu di AI Pattern Generator.");
  };

  const content = useMemo(()=>{
    switch(moduleKey) {
      case "measurements": return <div className="space-y-5">
        <p className="text-sm text-slate-400">Simpan profil ukuran tubuh dalam browser lokal.</p>
        <div className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
          <label className="text-xs text-slate-400">Nama profil<input className={inputClass} value={measurement.name} onChange={e=>setField("name",e.target.value)}/></label>
          {(["chest","waist","hip","shoulder","bodyLength","sleeve","neck"] as const).map(k=><Field key={k} label={({chest:"Lingkar dada",waist:"Lingkar pinggang",hip:"Lingkar pinggul",shoulder:"Lebar bahu",bodyLength:"Panjang badan",sleeve:"Panjang lengan",neck:"Lingkar leher"} as Record<string,string>)[k]} value={measurement[k]} onChange={v=>setField(k,v)}/>)}
        </div>
        <button className={buttonClass} onClick={addMeasurement}>Simpan ukuran</button>
        <div className="grid gap-3 md:grid-cols-2">{measurements.map(m=><div key={m.id} className="rounded-xl border border-slate-800 p-4"><b>{m.name}</b><p className="mt-1 text-xs text-slate-400">Dada {m.chest} · Pinggang {m.waist} · Pinggul {m.hip} {m.unit}</p><button className={`${secondaryClass} mt-3`} onClick={()=>setMeasurement(m)}>Gunakan profil</button></div>)}</div>
      </div>;
      case "generator": return <div className="space-y-4">
        <p className="text-sm text-slate-400">Buat draft dasar badan depan-belakang sederhana berdasarkan ukuran. Bukan pola siap produksi.</p>
        <div className="grid gap-3 sm:grid-cols-2"><Field label="Lingkar dada (cm)" value={measurement.chest} onChange={v=>setField("chest",v)}/><Field label="Panjang badan (cm)" value={measurement.bodyLength} onChange={v=>setField("bodyLength",v)}/><Field label="Lebar bahu (cm)" value={measurement.shoulder} onChange={v=>setField("shoulder",v)}/><Field label="Ease (cm)" value={ease} onChange={setEase}/></div>
        <button className={buttonClass} onClick={generate}>Generate draft pola</button>
        {draft && <div className="rounded-xl border border-slate-700 bg-white p-3"><div className="text-xs text-slate-700">SVG draft · {draft.width} × {draft.height} cm</div><div className="max-h-[520px] overflow-auto" dangerouslySetInnerHTML={{__html:draft.svg}}/></div>}
        <button className={secondaryClass} onClick={downloadSvg}>Unduh SVG</button>
      </div>;
      case "editor": return <div className="space-y-4"><p className="text-sm text-slate-400">Editor dasar: buat draft di Generator, lalu unduh atau buka ulang SVG untuk proses lanjutan.</p><button className={buttonClass} onClick={downloadSvg}>Unduh draft SVG terakhir</button><div className="rounded-xl border border-slate-800 p-4 text-sm text-slate-300">Draft tersimpan: {store.lastDraft ? "Ya" : "Belum ada"}</div></div>;
      case "library": return <div className="grid gap-3 md:grid-cols-2"><div className="rounded-xl border border-slate-800 p-4"><b>Kemeja dasar</b><p className="mt-2 text-sm text-slate-400">Kategori atasan · basis pembelajaran</p></div><div className="rounded-xl border border-slate-800 p-4"><b>Blus dasar</b><p className="mt-2 text-sm text-slate-400">Kategori atasan · basis pembelajaran</p></div><div className="rounded-xl border border-slate-800 p-4"><b>Rok dasar</b><p className="mt-2 text-sm text-slate-400">Kategori bawahan · basis pembelajaran</p></div></div>;
      case "fit-studio": return <div className="space-y-4"><Field label="Ease tambahan (cm)" value={ease} onChange={setEase}/><div className="rounded-xl border border-slate-800 p-4"><p className="text-sm text-slate-400">Lingkar dada badan</p><p className="text-2xl font-bold">{measurement.chest} cm</p><p className="mt-2 text-sm text-cyan-300">Target lingkar pakaian: {calculateEase(measurement.chest,ease)} cm</p></div><p className="text-xs text-slate-500">Ease aktual bergantung model, bahan, konstruksi, dan preferensi fit.</p></div>;
      case "grading": return <div className="space-y-4"><Field label="Kenaikan per ukuran (cm)" value={grade} onChange={setGrade}/><div className="overflow-x-auto"><table className="w-full text-sm"><thead><tr className="text-left text-slate-400"><th className="p-2">Size</th><th>Dada</th><th>Pinggang</th><th>Pinggul</th></tr></thead><tbody>{[-2,-1,0,1,2].map(n=><tr key={n} className="border-t border-slate-800"><td className="p-2">{["XS","S","M","L","XL"][n+2]}</td><td>{gradeMeasurement(measurement.chest,n,grade)} cm</td><td>{gradeMeasurement(measurement.waist,n,grade)} cm</td><td>{gradeMeasurement(measurement.hip,n,grade)} cm</td></tr>)}</tbody></table></div><p className="text-xs text-slate-500">Aturan grading contoh seragam; aturan industri harus ditetapkan per jenis pakaian dan size chart.</p></div>;
      case "fabric": return <div className="grid gap-4 sm:grid-cols-2"><Field label="Lebar kain (cm)" value={fabricWidth} onChange={setFabricWidth}/><Field label="Panjang marker estimasi (m)" value={fabricLength} onChange={setFabricLength}/><div className="rounded-xl border border-slate-800 p-4 sm:col-span-2"><p className="text-sm text-slate-400">Estimasi luas kain</p><p className="text-2xl font-bold text-cyan-300">{estimateFabric(fabricWidth,fabricLength).toFixed(2)} m²</p></div></div>;
      case "export": return <div className="space-y-4"><p className="text-sm text-slate-400">Ekspor draft pola SVG atau data profil ukuran CSV.</p><button className={buttonClass} onClick={downloadSvg}>Unduh SVG pola</button><button className={secondaryClass} onClick={()=>downloadText("febria-measurements.csv","name,chest,waist,hip,shoulder,bodyLength,sleeve,neck\\n"+measurements.map(m=>[m.name,m.chest,m.waist,m.hip,m.shoulder,m.bodyLength,m.sleeve,m.neck].join(",")).join("\\n"),"text/csv")}>Unduh CSV ukuran</button></div>;
      case "preview-3d": return <div className="rounded-xl border border-slate-800 bg-gradient-to-br from-slate-900 to-cyan-950 p-8 text-center"><div className="mx-auto flex h-64 max-w-xs items-center justify-center rounded-[45%_45%_20%_20%] border-2 border-cyan-300/70 bg-cyan-400/10 shadow-[0_0_50px_#0891b255]"><span className="text-5xl">👕</span></div><p className="mt-5 text-sm text-slate-300">Pratinjau konseptual pakaian. Bukan simulasi 3D kain.</p></div>;
      case "production": return <div className="space-y-4"><div className="flex gap-2"><input className={inputClass} value={task} onChange={e=>setTask(e.target.value)} placeholder="Nama tugas produksi"/><button className={buttonClass} onClick={addTask}>Tambah</button></div>{store.tasks.map(t=><label key={t.id} className="flex items-center gap-3 rounded-lg border border-slate-800 p-3 text-sm"><input type="checkbox" checked={t.done} onChange={e=>setStore(s=>({...s,tasks:s.tasks.map(x=>x.id===t.id?{...x,done:e.target.checked}:x)}))}/><span className={t.done?"text-slate-500 line-through":""}>{t.title}</span></label>)}</div>;
      case "assistant": return <div className="space-y-4"><textarea className={inputClass} rows={3} value={assistantQuestion} onChange={e=>setAssistantQuestion(e.target.value)}/><div className="rounded-xl border border-slate-800 p-4 text-sm text-slate-300"><b>Saran awal</b><p className="mt-2">Mulai dari size chart dan profil ukuran. Tentukan ease berdasarkan desain dan bahan, buat draft konstruksi, lalu validasi garis, kampuh, notches, grainline, dan toile sebelum produksi. Pertanyaan: {assistantQuestion}</p></div><p className="text-xs text-slate-500">Asisten rule-based lokal, belum menggunakan model AI eksternal.</p></div>;
      case "projects": return <div className="space-y-4"><div className="grid gap-2 sm:grid-cols-[1fr_1fr_auto]"><input className={inputClass} value={name} onChange={e=>setName(e.target.value)} placeholder="Nama proyek"/><select className={inputClass} value={garment} onChange={e=>setGarment(e.target.value)}><option>Kemeja</option><option>Blus</option><option>Rok</option><option>Celana</option><option>Dress</option></select><button className={buttonClass} onClick={addProject}>Buat proyek</button></div>{store.projects.map(p=><div key={p.id} className="flex flex-wrap items-center justify-between gap-3 rounded-lg border border-slate-800 p-3"><div><b>{p.name}</b><p className="text-xs text-slate-400">{p.garment} · {p.status}</p></div><button className={secondaryClass} onClick={()=>setSelectedProject(p.id)}>Pilih</button></div>)}</div>;
      case "admin": return <div className="grid gap-3 sm:grid-cols-3">{[{label:"Profil ukuran",value:store.measurements.length},{label:"Proyek",value:store.projects.length},{label:"Tugas",value:store.tasks.length}].map(x=><div key={x.label} className="rounded-xl border border-slate-800 p-4"><p className="text-sm text-slate-400">{x.label}</p><p className="mt-2 text-3xl font-bold text-cyan-300">{x.value}</p></div>)}<p className="text-xs text-slate-500 sm:col-span-3">Panel ringkasan lokal. Pengelolaan pengguna/role membutuhkan Auth dan kebijakan server-side.</p></div>;
      default: return <p>Modul belum tersedia.</p>;
    }
  },[moduleKey,measurement,measurements,ease,grade,fabricWidth,fabricLength,task,assistantQuestion,draft,store,name,garment,selectedProject]);

  if(!ready) return <div className="p-8 text-slate-400">Memuat FEBRIA Workspace…</div>;
  return <div className="mx-auto max-w-6xl space-y-6">
    <header className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-800 pb-5">
      <div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">FEBRIA CORE 3000 / MODULE</p><h1 className="mt-2 text-3xl font-bold">{mod.title}</h1><p className="mt-2 text-sm text-slate-400">{mod.description}</p></div>
      <Link href="/workspace" className={secondaryClass}>← Workspace</Link>
    </header>
    {notice && <div role="status" className="rounded-lg border border-cyan-900 bg-cyan-950/40 p-3 text-sm text-cyan-200">{notice}</div>}
    <section className="rounded-2xl border border-slate-800 bg-[#0a1520] p-5 md:p-7">{content}</section>
    <p className="text-xs text-slate-600">FEBRIA AI PATTERN · Data demo disimpan pada browser ini.</p>
  </div>;
}
