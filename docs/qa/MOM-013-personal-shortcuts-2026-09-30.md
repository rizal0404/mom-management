# QA MOM-013 — pintasan tugas personal

Tanggal: 30 September 2026  
Status task: **IN_PROGRESS**. Pengguna meminta MOM-013 sebelum dependensi MOM-006/008/009 ditutup. Status teknis, gate database, dan UAT dicatat terpisah.

## Hasil implementasi

- Tracker memiliki preset URL **Tugas Saya**, **Jatuh tempo hari ini**, **7 hari ke depan** (hari ini sampai +7 secara inklusif), dan **Terlambat**. Tanpa preset, daftar global tindak lanjut aktif tetap menjadi tampilan awal.
- Filter personal mengambil `pic_id` dari profil sesi. Daftar memakai query tracker dan pagination/count exact yang sudah ada; ringkasan memakai empat query `count: 'exact', head: true`, masing-masing dibatasi PIC, `deleted_at IS NULL`, dan status selain DONE/CANCELLED.
- Satu utilitas tanggal WITA dipakai oleh dashboard/action tracker. Halaman menjadwalkan pergantian tanggal berikutnya; preset tanggal serta angka ringkasan mengikuti tanggal baru setelah tengah malam WITA.
- Perubahan manual dari preset mengubahnya menjadi filter URL eksplisit, reset kembali ke daftar global, dan setiap baris menuju detail action sebenarnya.
- Ditambahkan unit test query/range/URL/pergantian akun, skenario browser E2E dua PIC dan pergantian sesi tepat di batas WITA, serta smoke UI Edge dengan API DATA DEMO yang di-mock.

## Pemeriksaan

| Pemeriksaan | Hasil | Catatan |
|---|---|---|
| TypeScript aplikasi — `node node_modules/typescript/bin/tsc -b` | PASS | 30 Sep 2026. |
| TypeScript spec E2E | PASS | `node node_modules/typescript/bin/tsc --noEmit --strict --skipLibCheck --target ES2022 --module ESNext --moduleResolution Bundler --types node tests/e2e/cross-user.spec.ts`. |
| ESLint — `node node_modules/eslint/bin/eslint.js .` | PASS | 0 error; satu warning Fast Refresh lama pada `AuthProvider.tsx`. |
| Unit — Vitest | PASS | 12 file, 37 test lulus. Suite dijalankan memakai config sementara dengan pengaturan jsdom/setup yang sama tanpa plugin Vite/Tailwind, karena pemuatan config standar diblokir `spawn EPERM` di sandbox. Config sementara tidak mengubah repo. |
| Production build — `node node_modules/vite/bin/vite.js build` | PASS | Vite 8.3.0; warning chunk JS 719.64 kB (>500 kB). |
| Browser Edge, `node scripts/test-stage0-ui-mock.mjs` | PASS terbatas | API diintersep memakai DATA DEMO. Memeriksa empat kartu, hitungan nol, preset Tugas Saya di URL, empty state, reset, dan tidak ada overflow horizontal di tracker pada 1440/1024/390 px; script yang sama juga memeriksa flow form pada ketiga lebar itu. Ini tidak membuktikan RLS/DB. Screenshot uji tidak menimpa berkas QA yang ada. |
| E2E collection — `node node_modules/@playwright/test/cli.js test --list` | PASS | 13 skenario terkoleksi, termasuk skenario MOM-013 dua PIC, pergantian akun, batas tengah malam WITA, tautan detail, dan reset. |
| `git diff --check` | PASS | Tidak ada whitespace error. |
| DB/RLS dan eksekusi E2E terhadap Supabase disposable | BLOCKED / NOT_RUN | Belum tersedia endpoint Supabase lokal disposable. Tidak menjalankan fixture pada cloud; script `test:e2e` memang menolak URL non-local. Skenario lintas akun baru sudah di-typecheck dan dikoleksi, tetapi belum dieksekusi. |
| UAT pengguna | NOT_RUN | Perlu dilakukan terpisah setelah gate teknis dan dependensi dibuka. |

## Batas penutupan

MOM-006, MOM-008, dan MOM-009 masih IN_PROGRESS, sehingga MOM-013 tetap IN_PROGRESS sesuai dependensi roadmap. Pengujian browser UI menggunakan API mock; otorisasi query nyata, RLS lintas akun, dan skenario E2E belum tervalidasi terhadap database disposable. Berikutnya: siapkan/akses Supabase uji disposable, jalankan DB dan E2E, lalu evaluasi ulang status setelah dependensi teknis ditutup.
