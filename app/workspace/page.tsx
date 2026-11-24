import Link from "next/link";
import {MODULES} from "@/lib/febria/store";

export default function WorkspaceDashboard() {
  return <div className="mx-auto max-w-7xl space-y-8">
    <header className="rounded-2xl border border-cyan-900/60 bg-gradient-to-br from-[#0d2938] to-[#08131e] p-7 md:p-10">
      <p className="text-xs font-bold tracking-[.3em] text-cyan-400">FEBRIA CORE 3000</p>
      <h1 className="mt-4 text-3xl font-black md:text-5xl">AI Pattern Workspace</h1>
      <p className="mt-4 max-w-2xl text-sm leading-7 text-slate-300">Satu workspace untuk pengukuran, draft konstruksi pola, fitting, grading, kebutuhan kain, dan persiapan produksi.</p>
      <p className="mt-5 text-xs text-amber-300">Mode awal: local demo. Data belum tersinkron ke Supabase.</p>
    </header>
    <section>
      <h2 className="mb-4 text-xl font-bold">14 Core Modules</h2>
      <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
        {MODULES.map((m,i)=><Link key={m.key} href={m.href} className="group rounded-xl border border-slate-800 bg-[#0a1520] p-5 hover:border-cyan-500/70">
          <div className="text-xs font-bold text-cyan-400">MODULE {(i+1).toString().padStart(2,"0")}</div>
          <h3 className="mt-3 font-semibold group-hover:text-cyan-300">{m.title}</h3>
          <p className="mt-2 text-xs leading-5 text-slate-400">{m.description}</p>
          <p className="mt-4 text-xs text-cyan-400">Buka modul →</p>
        </Link>)}
      </div>
    </section>
  </div>;
}
