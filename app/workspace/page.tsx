import Link from "next/link";
import {MODULES} from "@/lib/febria/store";

const pillars = [
  {number:"01",title:"Pattern Engineering",description:"Measurement, draft generator, editor, library, fitting, grading, fabric, dan ekspor.",modules:["measurements","generator","editor","library","fit-studio","grading","fabric","export"]},
  {number:"02",title:"Fashion Intelligence",description:"Asisten kerja pola berbasis aturan lokal dengan batasan dan langkah validasi yang transparan.",modules:["assistant"]},
  {number:"03",title:"Production Operations",description:"Manajemen proyek, daftar tugas, dan ringkasan aktivitas operasional.",modules:["projects","production","admin"]},
  {number:"04",title:"Digital Visualization",description:"Pratinjau konseptual untuk komunikasi desain; simulasi kain 3D belum aktif.",modules:["preview-3d"]}
];

export default function WorkspaceDashboard() {
  return <div className="mx-auto max-w-7xl space-y-8">
    <header className="relative overflow-hidden rounded-2xl border border-cyan-900/60 bg-gradient-to-br from-[#0d2938] via-[#0a1a29] to-[#08131e] p-7 md:p-10">
      <div className="pointer-events-none absolute -right-20 -top-24 h-72 w-72 rounded-full border border-cyan-400/10 shadow-[0_0_100px_#0891b233]" />
      <p className="text-xs font-bold tracking-[.3em] text-cyan-400">FEBRIA CORE 3000 / INTELLIGENT FASHION SYSTEM</p>
      <h1 className="mt-4 max-w-3xl text-3xl font-black leading-tight md:text-5xl">From Pattern Design to Production Intelligence.</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">Satu ruang kerja untuk rekayasa pola, pengukuran, fitting, grading, estimasi bahan, dan koordinasi produksi. Dibangun bertahap dengan fondasi yang dapat diaudit.</p>
      <div className="mt-7 flex flex-wrap gap-3">
        <Link href="/workspace/generator" className="rounded-lg bg-cyan-400 px-4 py-2.5 text-sm font-bold text-slate-950 hover:bg-cyan-300">Mulai desain pola</Link>
        <Link href="/workspace/assistant" className="rounded-lg border border-cyan-800 px-4 py-2.5 text-sm font-semibold text-cyan-200 hover:bg-cyan-950/60">Buka Fashion Agent</Link>
      </div>
      <div className="mt-8 flex flex-wrap gap-2 text-[11px]">
        <span className="rounded-full border border-amber-700/60 bg-amber-950/30 px-3 py-1.5 text-amber-200">Local-first prototype</span>
        <span className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-300">{MODULES.length} modul terdaftar</span>
        <span className="rounded-full border border-slate-700 px-3 py-1.5 text-slate-300">Data browser lokal</span>
      </div>
    </header>

    <section className="grid gap-3 sm:grid-cols-3">
      <div className="rounded-xl border border-slate-800 bg-[#0a1520] p-5"><p className="text-xs text-slate-400">Engineering modules</p><p className="mt-2 text-3xl font-black text-cyan-300">{MODULES.length}</p><p className="mt-1 text-xs text-slate-500">Dihitung langsung dari registry modul</p></div>
      <div className="rounded-xl border border-slate-800 bg-[#0a1520] p-5"><p className="text-xs text-slate-400">Agent runtime</p><p className="mt-2 text-lg font-bold text-cyan-200">Local rules</p><p className="mt-1 text-xs text-slate-500">Tidak memerlukan API key eksternal</p></div>
      <div className="rounded-xl border border-slate-800 bg-[#0a1520] p-5"><p className="text-xs text-slate-400">Persistence</p><p className="mt-2 text-lg font-bold text-amber-200">Browser storage</p><p className="mt-1 text-xs text-slate-500">Supabase belum terhubung pada modul ini</p></div>
    </section>

    <section className="space-y-4">
      <div><p className="text-xs font-bold tracking-[.25em] text-cyan-500">SYSTEM DOMAINS</p><h2 className="mt-2 text-2xl font-bold">Empat domain kerja FEBRIA</h2></div>
      <div className="grid gap-3 md:grid-cols-2">
        {pillars.map(p=><article key={p.number} className="rounded-xl border border-slate-800 bg-[#0a1520] p-5 transition hover:border-cyan-800">
          <div className="flex items-center justify-between"><span className="text-xs font-bold tracking-widest text-cyan-400">DOMAIN {p.number}</span><span className="text-[10px] text-slate-500">{p.modules.length} modul terkait</span></div>
          <h3 className="mt-3 text-lg font-bold">{p.title}</h3><p className="mt-2 text-sm leading-6 text-slate-400">{p.description}</p>
        </article>)}
      </div>
    </section>

    <section>
      <div className="mb-4"><p className="text-xs font-bold tracking-[.25em] text-cyan-500">WORKSPACE DIRECTORY</p><h2 className="mt-2 text-2xl font-bold">Semua modul</h2></div>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {MODULES.map((m,i)=><Link key={m.key} href={m.href} className="group rounded-xl border border-slate-800 bg-[#0a1520] p-5 hover:border-cyan-500/70">
          <div className="text-xs font-bold text-cyan-400">MODULE {(i+1).toString().padStart(2,"0")}</div>
          <h3 className="mt-3 font-semibold group-hover:text-cyan-300">{m.title}</h3>
          <p className="mt-2 text-xs leading-5 text-slate-400">{m.description}</p>
          <p className="mt-4 text-xs text-cyan-400">Buka modul →</p>
        </Link>)}
      </div>
    </section>
    <footer className="rounded-xl border border-slate-800 p-4 text-xs leading-6 text-slate-500">Status implementasi: workspace dan Fashion Agent lokal. Integrasi AI eksternal, Supabase, kontrol akses multi-pengguna, analitik real-time, dan simulasi 3D kain merupakan tahap berikutnya dan belum dinyatakan aktif.</footer>
  </div>;
}
