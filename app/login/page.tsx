import Link from "next/link";
import { loginAction } from "@/app/auth/actions";

export default async function LoginPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string; next?: string }> }) {
  const params = await searchParams;
  return <main className="flex min-h-screen items-center justify-center bg-[#050b12] px-4 py-12 text-white">
    <section className="w-full max-w-md rounded-2xl border border-cyan-900/60 bg-[#0a1520] p-7 shadow-2xl">
      <p className="text-xs font-bold tracking-[.25em] text-cyan-400">FEBRIA CORE 3000</p>
      <h1 className="mt-3 text-3xl font-bold">Masuk akun</h1>
      <p className="mt-2 text-sm text-slate-400">Masuk untuk melanjutkan ke workspace FEBRIA.</p>
      {params.error && <p role="alert" className="mt-4 rounded-lg border border-rose-900 bg-rose-950/40 p-3 text-sm text-rose-200">Login gagal atau sesi tidak dapat diverifikasi. Periksa email dan password, lalu coba lagi.</p>}
      {params.message === "signed-out" && <p className="mt-4 text-sm text-emerald-300">Anda telah keluar.</p>}
      <form action={loginAction} className="mt-6 space-y-4">
        <input type="hidden" name="next" value={params.next ?? "/workspace"}/>
        <label className="block text-sm text-slate-300">Email<input required name="email" type="email" autoComplete="email" className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white" /></label>
        <label className="block text-sm text-slate-300">Password<input required name="password" type="password" autoComplete="current-password" className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white" /></label>
        <button className="w-full rounded-lg bg-cyan-400 px-4 py-3 font-bold text-slate-950 hover:bg-cyan-300">Login</button>
      </form>
      <p className="mt-5 text-sm text-slate-400">Belum punya akun? <Link className="text-cyan-300 hover:underline" href="/signup">Daftar</Link></p>
      <Link className="mt-4 inline-block text-xs text-slate-500 hover:text-cyan-300" href="/">Kembali ke homepage</Link>
    </section>
  </main>;
}
