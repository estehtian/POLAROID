import Link from "next/link";
import type {ReactNode} from "react";
import {MODULES} from "@/lib/febria/store";

export default function WorkspaceLayout({children}:{children:ReactNode}) {
  return <div className="min-h-screen bg-[#050b12] text-white md:flex">
    <aside className="w-full shrink-0 border-b border-cyan-950 bg-[#08131e] p-4 md:min-h-screen md:w-72 md:border-b-0 md:border-r">
      <Link href="/workspace" className="block">
        <div className="text-xl font-black tracking-widest text-cyan-300">FEBRIA</div>
        <div className="text-[10px] tracking-[.3em] text-slate-400">AI PATTERN · CORE 3000</div>
      </Link>
      <p className="mb-2 mt-7 text-[10px] font-bold uppercase tracking-[.25em] text-slate-500">Engineering modules</p>
      <nav className="grid grid-cols-2 gap-1 md:grid-cols-1">
        {MODULES.map(m=><Link key={m.key} href={m.href} className="rounded-lg px-3 py-2 text-xs text-slate-300 hover:bg-cyan-950/60 hover:text-cyan-200">{m.title}</Link>)}
      </nav>
      <Link href="/" className="mt-6 inline-block text-xs text-slate-500 hover:text-cyan-300">← Homepage</Link>
    </aside>
    <main className="min-w-0 flex-1 p-4 md:p-8">{children}</main>
  </div>;
}
