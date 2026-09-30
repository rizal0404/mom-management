# MOM-015 — kata sandi dan pemulihan akun

Tanggal: 30 September 2026  
Status: **IN_PROGRESS**; MOM-009 masih IN_PROGRESS.  
Cloud Supabase dan email pengguna nyata tidak digunakan.

## Perubahan

- Menambahkan halaman permintaan pemulihan di `/account/recovery`, perubahan kata sandi di `/account/password`, tautan lupa sandi pada login, dan tautan Akun dan kata sandi pada sidebar.
- Service memakai `resetPasswordForEmail` dan `updateUser` dari versi `@supabase/supabase-js` yang terkunci (2.116.0), dengan alur PKCE. Callback dibentuk dari origin saat ini dengan path tetap `/account/password`; tidak ada parameter redirect dari pengguna.
- Pesan berhasil meminta reset sama untuk alamat yang terdaftar maupun tidak. Error pengiriman memiliki pesan generik. Form sandi mensyaratkan 8 karakter, kecocokan konfirmasi, fokus ke field yang perlu diperbaiki, dan membersihkan nilai setelah berhasil.
- Callback hanya menyediakan form ketika `AuthProvider` telah memvalidasi sesi dan profil aktif. Sesi invalid/kedaluwarsa/terpakai menampilkan aksi minta tautan baru; profil nonaktif tidak memperoleh akses domain.
- URL callback lokal exact untuk `localhost`/`127.0.0.1` port 5173/5174 ditambahkan ke konfigurasi Auth lokal. Dokumentasi menjelaskan URL produksi, SMTP sandbox, dan Inbucket. Stack lokal perlu direstart agar konfigurasi Auth dimuat.

## Pemeriksaan

| Pemeriksaan | Hasil | Bukti |
|---|---|---|
| `node node_modules/typescript/bin/tsc -b` | PASS | Typecheck proyek |
| `node node_modules/eslint/bin/eslint.js .` | PASS | 0 error; 1 warning Fast Refresh lama di `AuthProvider.tsx` |
| `node node_modules/vite/bin/vite.js build --configLoader native` | PASS | Build; warning chunk 738.89 kB yang melebihi 500 kB |
| Vitest dua file MOM-015, config sementara tanpa plugin Tailwind dan worker thread | PASS | 2 file, 7 test |
| Playwright `test --list` pada `tests/e2e/account-security.spec.ts` | PASS | 3 skenario terkoleksi |
| Browser nyata, halaman recovery | PASS terbatas | In-app browser pada 1440×900, 1024×768 dan 390×844; scroll width sama dengan viewport pada tiap ukuran |
| Browser nyata, callback kedaluwarsa | PASS terbatas | 390×844; pesan invalid/kedaluwarsa, tautan minta ulang, tanpa form sandi |
| Supabase Auth + Inbucket E2E | BLOCKED | Docker CLI tidak tersedia pada host; browser runner Playwright ditolak dengan `spawn EPERM`. E2E lokal disiapkan, tetapi belum dieksekusi |
| Konfigurasi/pengiriman email pada project hosted | NOT_RUN | URL tujuan/SMTP hosted belum dikonfigurasi atau diverifikasi; tidak menghubungi project cloud |
| UAT pengguna | NOT_RUN | Belum dilakukan |

Browser visual memakai server Vite sementara dengan Supabase URL/key lokal placeholder dan tanpa submit form. Pemeriksaan ini membuktikan rendering serta layout, bukan alur email/Auth. Playwright browser runner nyata, Auth, token pemulihan, dan Inbucket harus diperiksa setelah lingkungan disposable tersedia.

## Referensi resmi yang dicocokkan dengan API terpasang

- [Supabase Password-based Auth](https://supabase.com/docs/guides/auth/passwords) — reset tidak mengungkap akun yang tidak ada, halaman ganti sandi, email, dan pengujian lokal.
- [JavaScript `resetPasswordForEmail`](https://supabase.com/docs/reference/javascript/auth-resetpasswordforemail) dan [JavaScript `updateUser`](https://supabase.com/docs/reference/javascript/auth-updateuser).
- [Supabase Auth Redirect URLs](https://supabase.com/docs/guides/auth/redirect-urls) — tujuan redirect harus terdaftar.

MOM-015 tetap IN_PROGRESS sampai E2E Auth/Inbucket dan pemeriksaan callback di Supabase disposable lulus serta dependensi MOM-009 ditutup secara teknis.
