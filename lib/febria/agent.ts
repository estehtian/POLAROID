export type FashionAgentIntent =
  | "pattern"
  | "measurement"
  | "fit"
  | "grading"
  | "fabric"
  | "production"
  | "export"
  | "general";

export type FashionAgentResult = {
  intent: FashionAgentIntent;
  title: string;
  answer: string;
  steps: string[];
  warnings: string[];
  mode: "local-rules";
};

const guidance: Record<FashionAgentIntent, Omit<FashionAgentResult, "intent" | "mode">> = {
  pattern: {
    title: "Alur pengembangan pola",
    answer: "Mulai dari spesifikasi pakaian dan ukuran tubuh. Draft otomatis yang tersedia saat ini masih berupa blok badan depan sederhana, sehingga belum dapat dianggap pola produksi.",
    steps: ["Tentukan jenis pakaian, desain, dan size chart.", "Periksa kelengkapan ukuran tubuh dan satuannya.", "Buat draft awal, lalu periksa garis leher, bahu, kerung lengan, sisi, dan panjang.", "Tambahkan kampuh, notches, grainline, serta komponen pola yang belum tersedia.", "Uji dengan toile dan koreksi pola sebelum produksi."],
    warnings: ["Generator saat ini belum menghasilkan pola lengkap depan-belakang, lengan, kerah, atau kampuh.", "Validasi oleh pattern maker tetap wajib."]
  },
  measurement: {
    title: "Pemeriksaan data ukuran",
    answer: "Kualitas pola sangat bergantung pada konsistensi pengukuran. Gunakan satuan yang sama dan catat metode pengukuran.",
    steps: ["Pastikan satuan cm digunakan secara konsisten.", "Ukur dada, pinggang, pinggul, bahu, panjang badan, lengan, dan leher.", "Ulangi pengukuran yang meragukan.", "Simpan profil dengan nama dan jenis pakaian yang jelas."],
    warnings: ["FEBRIA belum menjalankan validasi ukuran server-side atau sinkronisasi database."]
  },
  fit: {
    title: "Analisis kelonggaran (ease)",
    answer: "Ease adalah selisih antara ukuran pakaian dan ukuran tubuh. Nilainya harus dipilih berdasarkan siluet, mobilitas, bahan, dan konstruksi.",
    steps: ["Tentukan target fit: ketat, regular, atau longgar.", "Pilih ease per area tubuh, bukan satu angka untuk semua bagian.", "Pertimbangkan stretch, ketebalan, dan arah serat bahan.", "Uji fitting pada toile dan dokumentasikan koreksi."],
    warnings: ["Perhitungan ease saat ini bersifat aritmetika dasar, bukan prediksi fit atau simulasi kain."]
  },
  grading: {
    title: "Strategi pattern grading",
    answer: "Grading harus mengikuti aturan per titik ukur dan jenis pakaian. Kenaikan seragam pada seluruh ukuran hanya cocok sebagai contoh edukasi.",
    steps: ["Tetapkan size chart dan ukuran dasar.", "Definisikan titik grading untuk setiap pola.", "Terapkan increment horizontal dan vertikal sesuai standar merek.", "Periksa konsistensi antar ukuran dan lakukan fitting ukuran ekstrem."],
    warnings: ["Tabel grading yang tersedia belum memakai aturan industri atau brand-specific."]
  },
  fabric: {
    title: "Estimasi kebutuhan kain",
    answer: "Luas kain saja belum cukup untuk menghitung konsumsi produksi. Kebutuhan aktual bergantung pada lebar efektif, marker, arah motif, ukuran, dan efisiensi nesting.",
    steps: ["Catat lebar kain efektif dan panjang marker.", "Kelompokkan ukuran dan jumlah produksi.", "Perhatikan arah serat, motif, nap, dan batasan peletakan.", "Validasi estimasi melalui marker aktual."],
    warnings: ["Modul sekarang hanya menghitung luas sederhana; belum mengoptimalkan marker atau nesting."]
  },
  production: {
    title: "Alur kontrol produksi",
    answer: "Gunakan tahapan yang dapat dilacak dari persetujuan desain hingga pemeriksaan hasil.",
    steps: ["Buat work order dan tetapkan penanggung jawab.", "Pisahkan status: persiapan pola, sampling, cutting, sewing, finishing, dan QC.", "Catat target, realisasi, kendala, dan bukti pemeriksaan.", "Tutup pekerjaan setelah QC disetujui."],
    warnings: ["Daftar tugas sekarang tersimpan di browser lokal dan belum mendukung kolaborasi multi-pengguna."]
  },
  export: {
    title: "Persiapan ekspor pola",
    answer: "Format ekspor harus dipilih sesuai alur kerja penjahit atau pabrik. File visual tidak otomatis menjadi file produksi yang tervalidasi.",
    steps: ["Periksa skala dan satuan dokumen.", "Pastikan semua komponen pola dan anotasi lengkap.", "Buka hasil ekspor pada aplikasi tujuan dan verifikasi ukuran cetak.", "Simpan versi serta catatan revisi."],
    warnings: ["Ekspor yang tersedia saat ini adalah SVG dan CSV; PDF/DXF produksi belum tersedia."]
  },
  general: {
    title: "FEBRIA Fashion Agent",
    answer: "Saya dapat membantu menyusun langkah kerja desain pola, pengukuran, fitting, grading, kain, ekspor, dan produksi berdasarkan panduan lokal FEBRIA.",
    steps: ["Tulis pertanyaan yang spesifik.", "Sebutkan jenis pakaian dan tahap pekerjaan.", "Cantumkan ukuran, bahan, atau target fit jika relevan.", "Gunakan hasil sebagai panduan dan verifikasi sebelum produksi."],
    warnings: ["Mode saat ini adalah rule-based lokal. Belum ada koneksi ke LLM, web research, sub-agent, atau database."]
  }
};

export function runFashionAgent(question: string): FashionAgentResult {
  const q = question.toLocaleLowerCase("id-ID");
  let intent: FashionAgentIntent = "general";
  if (/pola|pattern|kerah|lengan|draft|konstruksi/.test(q)) intent = "pattern";
  else if (/ukur|measurement|dada|pinggang|pinggul|bahu/.test(q)) intent = "measurement";
  else if (/fit|pas badan|kelonggaran|ease|toile/.test(q)) intent = "fit";
  else if (/grading|grade|ukuran xs|ukuran s|ukuran m|size chart/.test(q)) intent = "grading";
  else if (/kain|fabric|marker|bahan|nesting/.test(q)) intent = "fabric";
  else if (/produksi|production|cutting|sewing|jahit|qc/.test(q)) intent = "production";
  else if (/ekspor|export|svg|csv|pdf|dxf|cetak/.test(q)) intent = "export";

  const item = guidance[intent];
  return { intent, ...item, mode: "local-rules" };
}
