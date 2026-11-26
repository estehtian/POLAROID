import Link from "next/link";

export default function HomePage() {
  return <main className="flex min-h-screen items-center justify-center bg-[#050b12] px-5 py-16 text-white">
    <section className="w-full max-w-4xl rounded-3xl border border-cyan-900/60 bg-gradient-to-br from-[#0d2938] via-[#0a1a29] to-[#08131e] p-8 shadow-2xl md:p-14">
      <p className="text-xs font-bold tracking-[.3em] text-cyan-400">FEBRIA CORE 3000 / FASHION ENGINEERING</p>
      <h1 className="mt-5 max-w-3xl text-4xl font-black leading-tight md:text-6xl">From pattern design to production intelligence.</h1>
      <p className="mt-5 max-w-2xl text-sm leading-7 text-slate-300">Ruang kerja untuk pengukuran, draft pola, visualisasi fashion, pertukaran DXF, dan alur produksi. Fitur teknis masih berupa prototipe dan perlu validasi sebelum digunakan untuk produksi.</p>
      <div className="mt-8 flex flex-wrap gap-3">
        <Link href="/workspace" className="rounded-lg bg-cyan-400 px-5 py-3 text-sm font-bold text-slate-950 hover:bg-cyan-300">Buka Workspace</Link>
        <Link href="/workspace/dxf-studio" className="rounded-lg border border-cyan-800 px-5 py-3 text-sm font-semibold text-cyan-200 hover:bg-cyan-950/60">DXF Import / Export</Link>
      </div>
      <p className="mt-8 text-xs leading-5 text-slate-500">Prototype local-first. Draft dan hasil DXF bukan pola produksi tervalidasi. Periksa unit dan skala di aplikasi CAD sebelum digunakan.</p>
    </section>
  </main>;
}
