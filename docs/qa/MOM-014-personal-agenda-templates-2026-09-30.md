# QA MOM-014 — template agenda pribadi

Tanggal: 30 September 2026  
Status task: **IN_PROGRESS**. Implementasi dimulai atas permintaan langsung pengguna ketika MOM-004/005/009 masih IN_PROGRESS. Status teknis, dependensi, dan UAT dicatat terpisah.

## Hasil implementasi

- Migration menambahkan tabel template dan item agenda, RLS owner-only, serta RPC untuk simpan/edit, hapus, dan membuat draf. Direct write ditolak; edit/hapus memeriksa versi yang diharapkan. Admin juga tidak dapat membaca template milik anggota lain.
- Service menyediakan baca daftar dan ketiga operasi RPC. Halaman `/meeting-templates` mendukung buat/edit, urut dan jenis agenda, judul awal opsional, validasi, simpan/batal, konflik versi, hapus dengan konfirmasi, serta **Gunakan template**. Daftar notula menyediakan CTA ke halaman template.
- Instansiasi menghasilkan notula DRAFT dengan ID baru dan owner sesi. Judul draf memakai judul awal bila ada, atau nama template sebagai fallback. Hanya agenda dan jenis item disalin; waktu, lokasi, pimpinan, peserta, pembahasan, hasil, PIC/jadwal, evidence, status task, dan action tidak ikut. Tanggal dan bidang kosong tetap null. Finalisasi tetap melalui validasi notula yang ada.
- Assertion integrasi DB ditambahkan untuk hak akses anon/member/admin, penolakan write langsung, isolasi owner, konflik versi, draf baru yang bersih, perubahan/penghapusan template tanpa mengubah draf sebelumnya, serta validasi finalisasi.

## Pemeriksaan

| Pemeriksaan | Hasil | Catatan |
|---|---|---|
| TypeScript — `node node_modules/typescript/bin/tsc -b` | PASS | 30 Sep 2026. |
| ESLint — `node node_modules/eslint/bin/eslint.js .` | PASS | 0 error; 1 warning Fast Refresh lama pada `src/modules/auth/AuthProvider.tsx`. |
| Unit — Vitest | PASS | 13 file / 41 test. Dijalankan dengan config sementara yang mempertahankan setup/jsdom tetapi tidak memuat plugin Vite/Tailwind; config standar gagal di sandbox dengan `spawn EPERM`. Config sementara telah dihapus. |
| Browser nyata dengan API DATA DEMO lokal | PASS terbatas | Browser in-app Codex pada 1440×900, 1024×900, dan 390×844. Membuat/edit dan menyimpan template, instansiasi draf, mengecek judul fallback serta waktu/lokasi/peserta/pembahasan/hasil/PIC/jadwal tetap kosong, lalu menghapus template di server mock. Layout diperiksa pada tiap lebar; tidak menyimpan data ke Supabase. |
| Script otomatis UI Playwright | BLOCKED | Peluncuran Edge headless terhambat `spawn EPERM`; alur UI-mock diperiksa manual di browser. |
| Production build — Vite | BLOCKED | Build gagal memuat binding native `@tailwindcss/oxide-win32-x64-msvc`; Vite juga menemui `spawn EPERM` saat memuat konfigurasi. Tidak ada bundle build yang dihasilkan. |
| DB/RLS — `scripts/test-db.mjs` | BLOCKED / NOT_RUN | Supabase CLI dan Docker tidak tersedia pada environment ini. Assertion dan syntax check tersedia, tetapi migration serta isolasi lintas role belum dieksekusi. Tidak menjalankan mutasi pada Supabase cloud. |
| Sintaks skrip dan whitespace | PASS | `node --check scripts/test-db.mjs`, `node --check scripts/test-stage0-ui-mock.mjs`, dan `git diff --check` PASS. Peringatan Git hanya konversi LF/CRLF. |
| UAT pengguna | NOT_RUN | Belum dilakukan. |

## Batas penutupan

MOM-004/005/009 tetap IN_PROGRESS; MOM-014 tetap IN_PROGRESS sesuai dependensi roadmap. Gate RLS dan instansiasi pada Supabase disposable belum terbukti. Berikutnya: sediakan Supabase lokal disposable, jalankan seluruh migration serta `test:db`, dan ulangi build/Playwright setelah binding native dan izin spawn tersedia. Setelah dependensi teknis ditutup, evaluasi UAT pengguna secara terpisah.
