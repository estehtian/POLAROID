import Link from "next/link";
import { signupAction } from "@/app/auth/actions";

export default async function SignupPage({ searchParams }: { searchParams: Promise<{ error?: string; message?: string }> }) {
  const params = await searchParams;
  return <main className="flex min-h-screen items-center justify-center bg-[#050b12] px-4 py-12 text-white">
    <section className="w-full max-w-md rounded-2xl border border-cyan-900/60 bg-[#0a1520] p-7 shadow-2xl">
      <p className="text-xs font-bold tracking-[.25em] text-cyan-400">FEBRIA CORE 3000</p>
      <h1 className="mt-3 text-3xl font-bold">Buat akun</h1>
      <p className="mt-2 text-sm text-slate-400">Daftar untuk menyimpan dan mengelola proyek fashion Anda.</p>
      {params.error && <p role="alert" className="mt-4 rounded-lg border border-rose-900 bg-rose-950/40 p-3 text-sm text-rose-200">Data belum valid atau pendaftaran gagal. Password minimal 8 karakter.</p>}
      {params.message === "check-email" && <p role="status" className="mt-4 rounded-lg border border-emerald-900 bg-emerald-950/40 p-3 text-sm text-emerald-200">Pendaftaran diterima. Periksa email untuk menyelesaikan verifikasi jika konfirmasi email diaktifkan.</p>}
      <form action={signupAction} className="mt-6 space-y-4">
        <label className="block text-sm text-slate-300">Nama lengkap<input required name="full_name" autoComplete="name" maxLength={100} className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white" /></label>
        <label className="block text-sm text-slate-300">Email<input required name="email" type="email" autoComplete="email" className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white" /></label>
        <label className="block text-sm text-slate-300">Password<input required name="password" type="password" minLength={8} autoComplete="new-password" className="mt-2 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-3 text-white" /><span className="mt-1 block text-xs text-slate-500">Minimal 8 karakter.</span></label>
        <button className="w-full rounded-lg bg-cyan-400 px-4 py-3 font-bold text-slate-950 hover:bg-cyan-300">Buat akun</button>
      </form>
      <p className="mt-5 text-sm text-slate-400">Sudah punya akun? <Link className="text-cyan-300 hover:underline" href="/login">Login</Link></p>
      <Link className="mt-4 inline-block text-xs text-slate-500 hover:text-cyan-300" href="/">Kembali ke homepage</Link>
    </section>
  </main>;
}
