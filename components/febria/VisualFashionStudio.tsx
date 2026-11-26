"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

const inputClass = "w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 text-sm text-white outline-none focus:border-cyan-400";
const buttonClass = "rounded-lg bg-cyan-400 px-4 py-2 text-sm font-semibold text-slate-950 hover:bg-cyan-300";
const acceptedTypes = ["image/jpeg", "image/png", "image/webp"];
const maxBytes = 10 * 1024 * 1024;

type LocalImage = { file: File; url: string };

function ImageInput({ label, help, image, onChange }: {
  label: string;
  help: string;
  image: LocalImage | null;
  onChange: (file: File | null, error: string) => void;
}) {
  return <div className="space-y-3 rounded-xl border border-slate-800 bg-slate-950/60 p-4">
    <label className="block space-y-2 text-sm font-medium text-slate-200">{label}
      <input className={inputClass} type="file" accept="image/jpeg,image/png,image/webp" onChange={event => {
        const file = event.currentTarget.files?.[0] ?? null;
        onChange(file, "");
        event.currentTarget.value = "";
      }}/>
    </label>
    <p className="text-xs text-slate-500">{help}</p>
    {image && <div className="flex items-center gap-3">
      <img src={image.url} alt={`Pratinjau ${label.toLowerCase()}`} className="h-24 w-20 rounded-lg border border-slate-700 object-cover"/>
      <div className="min-w-0 text-xs text-slate-400"><p className="truncate">{image.file.name}</p><p>{(image.file.size / 1024 / 1024).toFixed(2)} MB · hanya di sesi browser ini</p></div>
    </div>}
  </div>;
}

export default function VisualFashionStudio() {
  const [prompt, setPrompt] = useState("");
  const [garment, setGarment] = useState<LocalImage | null>(null);
  const [model, setModel] = useState<LocalImage | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    return () => {
      if (garment) URL.revokeObjectURL(garment.url);
      if (model) URL.revokeObjectURL(model.url);
    };
  }, [garment, model]);

  const setImage = (kind: "garment" | "model", file: File | null) => {
    setError("");
    const setter = kind === "garment" ? setGarment : setModel;
    if (!file) { setter(null); return; }
    if (!acceptedTypes.includes(file.type)) { setError("Gunakan gambar JPG, PNG, atau WebP."); return; }
    if (file.size > maxBytes) { setError("Ukuran setiap gambar maksimal 10 MB."); return; }
    setter({ file, url: URL.createObjectURL(file) });
  };

  return <main className="mx-auto max-w-6xl space-y-6 p-5 text-slate-100 md:p-8">
    <header className="flex flex-wrap items-end justify-between gap-4 border-b border-slate-800 pb-5">
      <div><p className="text-xs font-semibold uppercase tracking-[0.25em] text-cyan-400">FEBRIA CORE 3000 / VISUAL LAB</p>
        <h1 className="mt-2 text-3xl font-bold">Visual Fashion Studio</h1>
        <p className="mt-2 max-w-2xl text-sm text-slate-400">Siapkan referensi konsep dan aset untuk alur visual. Koneksi ke model AI belum aktif.</p>
      </div>
      <Link href="/workspace" className="rounded-lg border border-slate-700 px-4 py-2 text-sm text-slate-200 hover:border-cyan-400">← Workspace</Link>
    </header>

    <div role="note" className="rounded-xl border border-amber-700/70 bg-amber-950/30 p-4 text-sm text-amber-100">
      <b>Preview visual saja — bukan bukti ukuran atau kecocokan fisik.</b>
      <p className="mt-1 text-amber-200/80">Tidak ada gambar yang diunggah atau diproses oleh AI. Integrasi worker, penyimpanan, dan antrean masih perlu dibangun.</p>
    </div>

    <div className="grid gap-6 lg:grid-cols-[1.2fr_0.8fr]">
      <section className="space-y-4 rounded-2xl border border-slate-800 bg-[#0a1520] p-5 md:p-6">
        <div><h2 className="text-lg font-semibold">Brief dan aset konsep</h2><p className="mt-1 text-sm text-slate-400">Berkas hanya dipratinjau secara lokal pada browser dan tidak disimpan.</p></div>
        <label className="block space-y-2 text-sm font-medium text-slate-200">Deskripsi konsep
          <textarea className={inputClass} rows={4} maxLength={1000} value={prompt} onChange={event => setPrompt(event.target.value)} placeholder="Contoh: kemeja linen oversized warna biru indigo, detail saku depan, tampilan editorial"/>
        </label>
        <div className="grid gap-4 md:grid-cols-2">
          <ImageInput label="Gambar pakaian" help="Foto produk atau sketsa; JPG, PNG, WebP · maks. 10 MB." image={garment} onChange={(file, message) => message ? setError(message) : setImage("garment", file)}/>
          <ImageInput label="Gambar model (opsional)" help="Untuk rancangan alur try-on kelak; unggah hanya jika berhak dan memberi persetujuan." image={model} onChange={(file, message) => message ? setError(message) : setImage("model", file)}/>
        </div>
        {error && <p role="alert" className="text-sm text-rose-300">{error}</p>}
        <button type="button" className={buttonClass} disabled title="Worker visual AI belum terhubung">Generate preview — belum tersedia</button>
        <p className="text-xs text-slate-500">Brief: {prompt.length}/1000 karakter · Tidak ada job yang dibuat.</p>
      </section>

      <aside className="space-y-4 rounded-2xl border border-slate-800 bg-[#0a1520] p-5 md:p-6">
        <h2 className="text-lg font-semibold">Status integrasi</h2>
        <ol className="space-y-3 text-sm">
          <li className="flex gap-3"><span className="text-emerald-300">✓</span><span><b>Audit dan kontrak job</b><br/><span className="text-slate-400">Tipe job awal tersedia di kode.</span></span></li>
          <li className="flex gap-3"><span className="text-amber-300">○</span><span><b>GPU worker / provider</b><br/><span className="text-slate-400">Belum terhubung; belum ada inferensi AI.</span></span></li>
          <li className="flex gap-3"><span className="text-amber-300">○</span><span><b>Upload aman dan penyimpanan</b><br/><span className="text-slate-400">Belum ada upload jaringan, storage, atau penghapusan aset.</span></span></li>
          <li className="flex gap-3"><span className="text-amber-300">○</span><span><b>Virtual try-on</b><br/><span className="text-slate-400">Belum tersedia dan tidak digunakan untuk validasi fit.</span></span></li>
        </ol>
        <div className="rounded-lg border border-slate-800 p-3 text-xs leading-5 text-slate-400">Privasi: jangan unggah foto sensitif ke layanan pihak ketiga tanpa persetujuan. Saat ini preview file lokal akan hilang saat halaman ditutup atau dimuat ulang.</div>
      </aside>
    </div>
  </main>;
}
