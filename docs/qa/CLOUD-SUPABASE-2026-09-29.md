# Migrasi backend Supabase cloud — 29 September 2026

Target: proyek `mom_management`, ref `iccxlwfzojwtmwwvpfoe`, URL `https://iccxlwfzojwtmwwvpfoe.supabase.co`. Pengguna menyatakan tidak ada data rapat atau berkas Storage sumber; migrasi ini membuat **skema dan bucket kosong**, bukan menyalin data operasional. Tidak ada seed DATA DEMO, reset database, atau unggahan evidence ke cloud.

## Yang diterapkan

- Repo sudah berisi `supabase/config.toml`; `supabase init` ulang tidak dilakukan. CLI resmi v2.118.0 dipasang sementara di direktori TEMP dengan SHA-256 arsip diverifikasi. `supabase login` dan `supabase link --project-ref iccxlwfzojwtmwwvpfoe` berhasil.
- Sebelum penulisan, `supabase migration list --linked` menunjukkan 14 migration lokal dan riwayat remote kosong; `supabase inspect db table-stats --linked` tidak menunjukkan tabel aplikasi; `supabase storage ls --linked --experimental` tidak menunjukkan bucket.
- `supabase db push --linked --dry-run --skip-vault` menampilkan 14 migration yang tepat. `supabase db push --linked --skip-vault --yes` menerapkan semuanya, termasuk bucket `evidence` privat dan kebijakan Storage/RLS pada migration MOM-011 serta kebijakan baca soft-delete MOM-006. Tidak memakai `--include-seed`.
- Fungsi `manage-users` dideploy dengan `supabase functions deploy manage-users --project-ref iccxlwfzojwtmwwvpfoe --use-api`; JWT verification tetap aktif.
- Auth cloud semula melaporkan `disable_signup=false`. Konfigurasi minimal yang hanya mendeklarasikan `auth.enable_signup=false` dibandingkan dahulu dengan `supabase config diff` (satu perubahan, 11 properti remote-only), lalu didorong lewat `supabase config push`. Properti remote-only tidak diubah.
- `.env.local` yang diabaikan Git kini menunjuk URL cloud dan memakai **publishable key** di frontend. `src/lib/supabase.ts` mendukung `VITE_SUPABASE_PUBLISHABLE_KEY` dengan fallback key anon lokal lama. Password database, service-role, secret key dan token CLI tidak masuk source atau dokumen.

## Verifikasi hasil

| Pemeriksaan | Hasil |
|---|---|
| `supabase projects list` dan `supabase link` | **PASS**: ref target benar/tertaut. |
| `supabase migration list --linked` | **PASS**: 14 versi lokal = 14 versi remote. |
| `supabase inspect db table-stats --linked` | **PASS**: tujuh tabel aplikasi tersedia; estimasi row setiap tabel 0. Angka estimasi bukan audit jumlah eksak. |
| `supabase storage ls --linked --experimental` | **PASS**: `evidence/` terdaftar. Migration mengatur bucket `public=false`; pembacaan metadata bucket oleh publishable key tanpa sesi tidak tersedia. |
| `GET /auth/v1/settings` dengan publishable key | **PASS**: `disable_signup=true`. |
| `supabase functions list` dan POST tanpa Authorization | **PASS**: `manage-users` ACTIVE v1, panggilan tanpa sesi mendapat HTTP 401 `UNAUTHENTICATED`. |
| `node node_modules/typescript/bin/tsc -b`, `node node_modules/vite/bin/vite.js build` | **PASS**; build masih memberi peringatan chunk >500 kB. |
| `node node_modules/vitest/vitest.mjs run --pool=threads --maxWorkers=1` | **PASS**, 7 file/20 test. |
| `node scripts/test-stage0-ui-mock.mjs` | **PASS**, Edge dengan API simulasi; skrip memaksa URL Supabase lokal simulasi sehingga tidak mengirim DATA DEMO ke cloud. |
| `node scripts/test-e2e.mjs` ketika `.env.local` cloud | **PASS untuk pengaman**: skrip menolak menjalankan E2E DATA DEMO sebelum membuat data. Exit nonzero memang diharapkan. |

## Batas operasional

- Belum ada akun aplikasi/admin pertama di cloud. Auth user dan `public.profiles` harus diprovisikan dengan identitas yang dipilih pengguna sebelum login/UAT; email dan password tidak ditetapkan pada migrasi skema kosong ini. Fungsi pengelolaan pengguna memerlukan ADMIN aktif untuk operasi berikutnya.
- Cloud ini tidak dinyatakan sebagai lingkungan uji disposable. `test:db`, `test:evidence`, dan `test:e2e` dapat membuat akun/row/file DATA DEMO atau trigger test-only; **jangan menjalankannya pada cloud ini**. Gate DB/Storage/E2E Tahap 0 tetap BLOCKED sampai lingkungan uji terisolasi tersedia.
- Verifikasi ini memastikan migration tercatat dan komponen cloud tersedia. Alur login anggota, operasi Auth berotorisasi, unggah evidence sungguhan, RLS lintas pengguna, dan UAT belum dijalankan pada cloud.
- CLI dipasang sementara, bukan sebagai dependensi repo atau perintah global PATH. Untuk pemeliharaan berikutnya, instal CLI resmi, login, `supabase link --project-ref iccxlwfzojwtmwwvpfoe`, lalu gunakan `db push --dry-run` sebelum `db push`. Jangan gunakan `db reset --linked` atau `--include-seed` pada target ini.

Rujukan prosedur: [alur migration Supabase](https://supabase.com/docs/guides/local-development/cli-workflows), [API key publishable](https://supabase.com/docs/guides/getting-started/api-keys), dan [default secret Edge Function](https://supabase.com/docs/guides/functions/secrets).

## Perubahan setelah pra-UAT — 29 September 2026

Setelah persetujuan eksplisit pengguna, UAT UI membuat satu akun MEMBER berlabel DATA DEMO (dinonaktifkan setelah tes), satu notula DATA DEMO FINAL, dan dua tindak lanjut yang kini berstatus DONE. Satu ADMIN cloud tetap aktif. Pengguna kemudian mengunggah dua fixture PDF/JPEG ke evidence notula; keduanya terdaftar dan dapat dipratinjau. Evidence pada task masih kosong. Notula dan tindak lanjut dipertahankan untuk ditinjau; tidak ada `db reset`, seed, atau operasi penghapusan cloud.

Pengguna menyetujui empat unggahan fixture DATA DEMO ke bucket `evidence`; dua unggahan ke notula dilakukan pengguna. Browser membuktikan keduanya bertahan setelah reload dan dapat dipratinjau. Dua unggahan ke task belum tampak pada saat verifikasi. Tombol unduh PDF dipicu tetapi hasil penyimpanan lokal tidak terverifikasi; uji RLS lintas role juga belum dijalankan. Detail skenario ada di [checklist MOM-009](MOM-009-UAT.md).
