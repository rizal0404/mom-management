# MOM & Follow-up — MOM Tracker

Status teknis dan gate UAT terbaru: lihat [TASK_PROGRESS.md](TASK_PROGRESS.md). UAT pengguna tidak termasuk hasil test otomatis.

Aplikasi untuk mencatat notula rapat dan memastikan setiap tindak lanjut mempunyai PIC, jadwal, status, serta riwayat. Bahasa antarmuka: Indonesia.

## Mulai di sini

| Dokumen | Kegunaan |
|---|---|
| [IMPLEMENTATION_PLAN.md](IMPLEMENTATION_PLAN.md) | Lingkup, keputusan teknis, urutan tugas, dan kriteria selesai |
| [docs/DEVELOPMENT_ROADMAP.md](docs/DEVELOPMENT_ROADMAP.md) | Usulan fitur lanjutan, prioritas, dependensi, estimasi dan acceptance criteria |
| [AGENTS.md](AGENTS.md) | Aturan eksekusi untuk agent Codex |
| [docs/PRODUCT_SPEC.md](docs/PRODUCT_SPEC.md) | Alur, data, hak akses, dan aturan bisnis |
| [docs/UI_GUIDELINE.md](docs/UI_GUIDELINE.md) | Tampilan berdasarkan dua gambar pengguna |
| [TASK_PROGRESS.md](TASK_PROGRESS.md) | Status tugas dan bukti pengujian |
| [CHANGELOG.md](CHANGELOG.md) | Catatan perubahan nyata |

## Menjalankan lokal

Prasyarat frontend: Node.js `20.19+` (Node LTS direkomendasikan) dan npm. Untuk database lokal: Supabase CLI dan Docker Desktop yang daemon Linux-nya aktif.

```bash
npm ci
npm run dev
```

Buka `http://127.0.0.1:5173/`. Pemeriksaan lokal tersedia melalui:

```bash
npm run lint
npm run typecheck
npm run test
npm run build
npm run test:e2e
```

Salin `.env.example` menjadi `.env.local` hanya saat modul client membutuhkan konfigurasi Supabase. Jangan isi service-role key di frontend.

Database lokal dibangun ulang dan diuji dengan:

```bash
supabase start
npm run db:reset:local
npm run test:db
```

Fixture lokal memakai empat akun berlabel `DATA DEMO`. Fixture ini hanya dibuat oleh `supabase/seed.sql` saat reset lokal dan tidak boleh dipakai di project cloud. Sign-up publik dimatikan pada konfigurasi lokal.

## Backend Supabase cloud

Pada 29 September 2026, skema dari 14 migration, bucket privat `evidence`, dan Edge Function `manage-users` diterapkan ke proyek `iccxlwfzojwtmwwvpfoe`. Pendaftaran publik dimatikan. [Bukti dan batas migrasi](docs/qa/CLOUD-SUPABASE-2026-09-29.md) mencatat hasil verifikasi; tidak ada seed atau data rapat yang dipindahkan. `.env.local` pada mesin ini memakai URL cloud dan publishable key, sedangkan `.env.example` tetap template tanpa kredensial.

Untuk memelihara cloud dari mesin lain, instal [Supabase CLI resmi](https://supabase.com/docs/guides/local-development/cli/getting-started), lalu `supabase login` dan `supabase link --project-ref iccxlwfzojwtmwwvpfoe`. Tinjau `supabase db push --dry-run` sebelum menerapkan migration baru dengan `supabase db push`. Jangan menjalankan `db reset --linked` atau `db push --include-seed` pada proyek ini. Akun ADMIN aplikasi pertama belum dibuat; login/UAT cloud menunggu identitas awal yang dipilih pemilik proyek. `test:db`, `test:evidence`, dan `test:e2e` yang membuat DATA DEMO harus tetap memakai Supabase lokal disposable.

Untuk menjalankan aplikasi/E2E dengan database lokal, isi `.env.local` hanya dengan `VITE_SUPABASE_URL` dan `VITE_SUPABASE_PUBLISHABLE_KEY` dari `supabase status`; jangan masukkan service-role/secret key. `npm run test:e2e` memakai Microsoft Edge lokal, membuka Vite di `127.0.0.1:5174`, dan dua sesi browser terpisah. Jalankan setelah `supabase start` serta `npm run db:reset:local`. E2E membuat notula/action **DATA DEMO** tambahan; reset lokal menghapus semua data pada database lokal proyek ini, jadi jangan jalankan reset di lingkungan dengan data yang ingin dipertahankan. Hasil UAT manual dicatat menurut [checklist UAT](docs/qa/MOM-009-UAT.md).

## Kelola pengguna MOM-010

Administrator aktif dapat membuka menu **Kelola pengguna** (`/users`) untuk membuat akun, mengubah nama/peran, serta mengaktifkan atau menonaktifkan pengguna. Pendaftaran publik tetap ditutup. Menu dan route menolak member; Edge Function `manage-users` memeriksa ulang JWT dan peran admin sebelum menggunakan kunci administratif di server.

- Saat membuat akun, admin menetapkan kata sandi sementara minimal 12 karakter dan menyampaikannya melalui saluran aman. Kata sandi tidak disimpan atau ditampilkan kembali oleh aplikasi. MOM-010 hanya mencakup provisioning; pemulihan mandiri anggota ditambahkan dalam MOM-015.
- Akun tidak dihapus dari menu ini agar notula, PIC, dan riwayat tetap memiliki referensi. Administrator tidak dapat mengubah peran/status dirinya sendiri atau menonaktifkan administrator aktif terakhir.
- Untuk menguji browser lengkap, `npm run test:e2e` memulai Edge Function lokal. Jalankan setelah `supabase start` dan `npm run db:reset:local`. Untuk uji fungsi saja, jalankan `supabase functions serve manage-users` pada terminal terpisah lalu `npm run test:users`.
- Setelah mengubah `supabase/config.toml`, hentikan dan mulai ulang stack lokal sebelum mengetes auth. Reset database saja tidak memuat ulang konfigurasi Auth.

## Ganti kata sandi dan pemulihan akun MOM-015

Anggota aktif dapat mengganti kata sandi dari **Akun dan kata sandi** di sidebar. Di halaman masuk, pilih **Lupa kata sandi?** untuk meminta email pemulihan. Aplikasi memakai Supabase Auth `resetPasswordForEmail` dan `updateUser`; respons permintaan selalu generik agar tidak mengungkap email yang terdaftar. Untuk lokal, Supabase CLI menangkap email di Inbucket pada `http://127.0.0.1:54324`. Callback lokal dibatasi ke URL aplikasi Vite pada port 5173/5174 melalui `supabase/config.toml`; restart stack setelah perubahan konfigurasi.

Untuk Auth hosted, atur Site URL ke origin aplikasi dan daftarkan URL callback produksi yang tepat, `https://<origin-aplikasi>/account/password`, di Authentication → URL Configuration. Cocokkan origin aplikasi yang benar-benar digunakan; jangan memasukkan URL tujuan dari parameter pengguna atau memakai wildcard luas. Ikuti [panduan redirect Auth Supabase](https://supabase.com/docs/guides/auth/redirect-urls) dan [panduan password Supabase](https://supabase.com/docs/guides/auth/passwords). Alur email target belum diverifikasi pada project cloud; gunakan SMTP sandbox/mailbox uji sebelum mengaktifkan layanan untuk anggota.

## Route aplikasi

- `/` — Dashboard
- `/login` — Login
- `/account/recovery` — Permintaan tautan pemulihan akun
- `/account/password` — Ganti kata sandi atau terima tautan pemulihan
- `/meetings`, `/meetings/new`, `/meetings/:id` — Notula
- `/actions`, `/actions/:id` — Tracker, timeline dan detail tindak lanjut
- `/users` — Kelola pengguna, khusus administrator aktif

## Hasil tahap awal

1. **Notula:** buat draf, isi agenda/pembahasan/keputusan, tambahkan tindak lanjut, lalu finalisasi.
2. **Tindak lanjut:** kelola task dan pending matter, PIC, tanggal mulai, deadline, status, dan pembaruan. Pantau dalam tabel, timeline, serta ringkasan dashboard.

Asumsi rancangan: satu organisasi/tim, beberapa pengguna dengan login, semua anggota aktif boleh membaca notula final. Zona waktu tim `Asia/Makassar` (WITA). Ini asumsi awal yang dapat disesuaikan, bukan keputusan pengguna yang sudah dikonfirmasi. Jika kemudian dipilih satu operator, sederhanakan akses tanpa mengubah dua modul inti.

## Handoff

Gunakan checklist UAT untuk menilai alur operator dari draf rapat sampai pending matter selesai; bukti teknis bukan persetujuan UAT. Jangan memakai fixture DATA DEMO atau konfigurasi lokal untuk produksi. Deployment publik tidak termasuk pekerjaan MVP ini.
