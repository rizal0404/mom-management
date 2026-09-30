# MOM-004 — Hapus draf dan pemulihan konflik

Tanggal: 30 September 2026 (WITA)  
Status task: **IN_PROGRESS**

## Perubahan

- Saat RPC hapus draf mengembalikan konflik versi, daftar menampilkan pesan dengan tombol **Muat ulang**. Fungsi muat ulang sekarang membersihkan pesan konflik sebelum memuat ulang, lalu menampilkan lagi data terbaru.
- Menambah uji komponen untuk visibilitas tombol owner/admin/member, hapus draf dengan versi yang tampil di daftar, dan pemulihan pesan konflik.
- Menambah assertion pada suite DB untuk penolakan hapus oleh member lain, penolakan versi stale, hapus oleh owner, serta hapus draf anggota oleh ADMIN.
- Memperluas smoke browser Edge UI-mock untuk memuat draf di daftar, mengonfirmasi penghapusan sebagai owner, dan memastikan draf hilang dari daftar.

## Pemeriksaan sesi ini

| Perintah / pemeriksaan | Hasil | Batas bukti |
|---|---|---|
| `node node_modules/typescript/bin/tsc -b` | **PASS** | TypeScript strict. |
| `node node_modules/eslint/bin/eslint.js .` | **PASS**, 0 error / 1 warning | Warning Fast Refresh lama di `src/modules/auth/AuthProvider.tsx:91`. |
| `node node_modules/vitest/vitest.mjs run --pool=threads --maxWorkers=1` | **PASS**, 9 file / 28 test | Termasuk 3 uji daftar hapus; service Supabase dimock pada uji komponen. |
| `node node_modules/vite/bin/vite.js build` | **PASS** | Peringatan chunk JavaScript >500 kB tetap muncul. |
| `node --check scripts/test-db.mjs` | **PASS** | Memeriksa sintaks skrip saja. |
| `node scripts/test-stage0-ui-mock.mjs` | **PASS**, Edge headless | Form draf 1440/1024/390; WITA pada UTC/Jakarta; simpan, gagal/retry; dialog finalisasi keyboard; hapus dari daftar pada lebar 390. API Supabase disimulasikan. |
| `git -c safe.directory=F:/ProyekAIbaru/mom_task_management diff --check` | **PASS** | Tidak ada whitespace error; Git memberi peringatan normal bahwa LF akan dikonversi ke CRLF. |
| `node scripts/test-db.mjs` / `node scripts/test-e2e.mjs` | **NOT_RUN** | Belum ada Supabase disposable lokal; `.env.local` menunjuk cloud dan cloud tidak digunakan untuk mutasi uji. |
| UAT pengguna | **NOT_RUN** | Pemeriksaan teknis bukan persetujuan UAT. |

## Batas dan tindak lanjut

Interaksi UI hapus draf lulus di Edge dengan API simulasi. Assertion RLS/RPC baru belum dijalankan terhadap database lokal; suite E2E lintas role juga belum dijalankan. Bukti layout detail FINAL pada 1440/1024/390 dan UAT masih diperlukan sebelum MOM-004 dapat ditutup. MOM-004 tetap **IN_PROGRESS**.

Berikutnya untuk task ini: jalankan regresi DB/E2E di Supabase disposable dan lengkapi pemeriksaan detail FINAL pada tiga viewport. Setelah MOM-004 ditutup, urutan roadmap berlanjut ke MOM-005.
