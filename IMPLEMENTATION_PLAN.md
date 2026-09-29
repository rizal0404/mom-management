# Rencana implementasi

## 1. Lingkup

**MVP hanya dua modul bisnis:** Notula Rapat dan Tindak Lanjut. Dashboard, login, direktori PIC, serta timeline mendukung dua modul tersebut.

Termasuk: draf/final notula, peserta, agenda, pembahasan, keputusan, task/pending matter, satu PIC utama per tindak lanjut, tanggal mulai, deadline, status, catatan perkembangan, riwayat perubahan, pencarian/filter, dan ringkasan.

Tidak termasuk: AI/transkripsi, rekaman, notifikasi email/WhatsApp, kalender eksternal, proyek, time tracker, chat, approval berjenjang, multi-organisasi, Gantt drag-and-drop, dan ekspor DOCX/PDF. Cetak/ekspor dapat menjadi task lanjutan setelah MVP. Upload evidence ditambahkan sebagai perluasan MOM-011 atas permintaan pengguna pada 24 September 2026.

## 2. Keputusan teknis

| Bagian | Pilihan |
|---|---|
| Frontend | React + TypeScript + Vite; React Router |
| UI | Tailwind CSS, shadcn/ui untuk komponen dasar, Lucide untuk ikon |
| Data frontend | TanStack Query; Zod untuk validasi input |
| Database & login | Supabase PostgreSQL + Auth email/password; SQL migrations dan RLS |
| Operasi atomik | PostgreSQL functions/RPC untuk finalisasi, perubahan action, dan audit |
| Pengujian | Vitest + Testing Library; integrasi Supabase lokal; Playwright untuk browser |
| Package manager | npm, satu `package-lock.json` |
| Operasi awal | Pengembangan lokal; target hosting SPA dengan fallback route, deployment terpisah |

Alasan: satu frontend dan layanan database/login yang sudah tersedia mengurangi backend khusus. Struktur modul tetap memungkinkan fitur baru. Tidak perlu Prisma atau server API terpisah untuk MVP ini.

Prasyarat MOM-001: Node LTS yang kompatibel dengan Vite pilihan. Prasyarat MOM-002: Supabase CLI + Docker untuk database lokal; alternatif hanya project Supabase DEV khusus yang sudah disediakan. Jangan memakai database produksi sebagai test. MOM-009 harus menguji auth dan database sungguhan, bukan localStorage.

Untuk peluncuran bersama diperlukan project Supabase target, akun admin, URL hosting dan konfigurasi auth. Membuat akun berbayar atau deploy publik bukan bagian pekerjaan dokumentasi ini. Detail bootstrap serta command konkret ditulis dan diuji pada task terkait.

```text
src/
  app/                  # routes, providers, layout
  components/ui/        # komponen tampilan bersama
  modules/
    auth/               # login, session, profil aktif
    meetings/           # types, schema, service, hooks, pages, components
    actions/            # task/pending matter, updates, timeline
    dashboard/          # agregasi data; tidak menyimpan salinan action
  lib/                  # supabase client, date, error mapping
supabase/
  migrations/           # schema, RLS, functions
  tests/                # akses dan transaksi
tests/e2e/
docs/
```

Kontrak detail ada di PRODUCT_SPEC. Agent boleh memecah file besar, tetapi tidak mengganti aturan bisnis diam-diam.

## 3. Urutan tugas

Setiap baris adalah satu unit kerja agent. Urutan bawaan mengikuti nomor; jangan melompati dependensi.

| ID | Pekerjaan dan output | Dependensi | Acceptance criteria |
|---|---|---|---|
| MOM-001 | Scaffold, routes placeholder berlabel, theme/token, `.env.example`, scripts dan README setup | — | Install dari lockfile, lint, typecheck, test smoke, build PASS; dev server dapat dibuka. Dokumen rencana tetap utuh. |
| MOM-002 | Schema, constraints, index, RLS dasar, migration, fixture lokal, script test DB | 001 | Database kosong dapat dibangun ulang; relasi valid; anon ditolak; member nonaktif ditolak; dua pengguna tidak bisa membaca draf satu sama lain. |
| MOM-003 | Login/logout, route guard, profil aktif, bootstrap admin/member/PIC | 002 | Login valid/gagal dan reload sesi diuji; tanpa login ditolak juga di API/DB; member tidak bisa menaikkan role sendiri. Tidak ada signup publik. |
| MOM-004 | Daftar, buat, edit, detail, hapus draf notula; editor agenda/hasil | 003 | Simpan lalu reload mempertahankan data; validasi jelas; peserta eksternal teks diperbolehkan; edit/hapus hanya owner/admin; konflik versi tidak menimpa data. |
| MOM-005 | Finalisasi notula → action tracker secara atomik | 004 | PIC/jadwal wajib untuk TASK/PENDING_MATTER; keputusan biasa tidak membuat action; klik/retry finalisasi tidak menggandakan; kegagalan rollback; final tidak dapat diedit/dihapus. |
| MOM-006 | Tabel tracker, detail, filter, update status/catatan/PIC/jadwal dan audit | 005 | Filter kombinasi bekerja; PIC hanya update miliknya; perubahan jadwal/PIC hanya owner/admin; audit lengkap; konflik versi terdeteksi; tautan notula asal bekerja. |
| MOM-007 | Timeline mingguan dan navigasi pekan | 006 | Rentang melintasi pekan terpotong benar; tanggal inklusif; klik membuka action yang sama; filter sama dengan tracker; ponsel memakai agenda. |
| MOM-008 | Dashboard dan perapian UI seluruh alur | 007 | Ringkasan sesuai fixture database termasuk nol/overdue/cancelled; kartu menuju filter terkait; empty/error/loading; browser 1440/1024/390 px tanpa overflow halaman. |
| MOM-009 | E2E lintas pengguna, pengujian ulang database, dokumentasi operasi, checklist UAT | 008 | Seluruh gate teknis di bagian 4 PASS; instalasi dari awal diuji; UAT pengguna dicatat terpisah; tidak ada klaim release sebelum UAT. |
| MOM-010 | Kelola pengguna oleh ADMIN | 003 | Admin dapat membuat akun anggota, melihat direktori termasuk akun nonaktif, mengubah peran/status dengan pengaman admin terakhir, dan member ditolak baik di UI maupun Edge Function. |
| MOM-011 | Evidence notula dan penyelesaian tindak lanjut | 002/003, alur 004/006 tersedia | Unggah/unduh privat, owner/admin untuk notula dan PIC/owner/admin untuk task; final tetap immutable dengan lampiran tambahan; batas 10 MB dan format; bukti pengunggah/waktu; browser dan Storage/RLS nyata; fixture dibersihkan tanpa reset DB. |

MOM-002–003 adalah fondasi autentikasi dan profil. MOM-010 menambahkan provisioning dan lifecycle akun melalui menu admin serta Edge Function; browser tidak pernah menerima service-role key.

## 4. Skenario penerimaan wajib

1. Admin menyiapkan anggota A dan B. A membuat rapat, menambah satu keputusan, satu task untuk B, satu pending matter untuk A; isi jadwal, simpan, lalu reload.
2. B tidak dapat membaca draf A. A finalisasi; tepat dua actions terbentuk dan keduanya menunjuk item sumber yang benar. B kini dapat membaca notula final.
3. Finalisasi ulang, klik ganda, dan retry setelah timeout tidak menambah actions. Simulasi gagal insert tidak meninggalkan notula final tanpa action.
4. B mengubah task miliknya ke IN_PROGRESS lalu DONE dengan catatan. A melihat status dan riwayat yang sama setelah refresh. B gagal mengubah pending matter milik A atau deadline task tanpa hak owner/admin.
5. Uji due kemarin/hari ini/besok pada WITA, pukul sebelum/sesudah tengah malam, start sama dengan due, serta start setelah due. DONE/CANCELLED tidak overdue.
6. Dua sesi mengedit versi action/draf yang sama: satu sukses, satu menerima konflik dan diminta muat ulang. Audit bertambah hanya untuk write yang sukses.
7. Tabel, dashboard, dan timeline konsisten pada data kosong, seluruhnya cancelled, dan rentang lintas pekan. Logout/refresh/direct URL tidak membocorkan data.
8. Browser nyata: navigasi keyboard, form error, gagal jaringan, tombol submit ganda, tampilan 1440/1024/390 px; tidak ada console error atau tombol palsu.

Gate teknis: lint, typecheck, unit, DB integration, build, E2E, browser visual. Tulis PASS/FAIL/NOT_RUN/BLOCKED beserta bukti di TASK_PROGRESS. Gate UAT: pengguna menjalankan alur catat rapat sampai menutup pending matter, lalu menyatakan hasil sesuai kebutuhan. Teknis PASS tidak otomatis berarti UAT PASS.

## 5. Penambahan modul berikutnya

Rencana lanjutan yang disusun 29 September 2026 tersedia di [Rencana pengembangan MOM Task Management](docs/DEVELOPMENT_ROADMAP.md). Pengguna memilih prioritas otomatisasi rapat: template, rapat lanjutan dan bantuan AI. Dokumen memetakan penutupan validasi MOM-004/005/006/008/009/011, lalu usulan MOM-012–022 dengan prioritas MOM-014 → MOM-018 → MOM-021, transkripsi audio sesudah evaluasi AI, serta fitur pendukung dan kesiapan operasi. Semua task baru masih usulan dan belum dimulai; lingkup aktif MVP di atas tetap berlaku sampai task pengembangan dipilih.

Task dokumentasi DOC-002 bergantung pada DOC-001: menghasilkan baseline, prioritas, dependensi, acceptance criteria, estimasi bersyarat, serta urutan pelaksanaan. Status dan pemeriksaan dokumennya dicatat di TASK_PROGRESS.

Evidence lampiran sudah menjadi MOM-011. Proyek/kalender tetap kandidat lanjutan; bantuan AI dari teks dan transkripsi audio sudah dirinci sebagai usulan MOM-021/022 sesuai pilihan pengguna. Tambah folder modul bila tanggung jawab baru memerlukannya, route, migration bila perlu, dan task dengan kontrak eksplisit. Pertahankan ID notula/action, tautan sumber, serta riwayat; jangan membuat salinan task di modul baru. Perluasan ke beberapa organisasi membutuhkan desain membership dan pengujian isolasi tersendiri.

## 6. Dasar dokumentasi teknis

Diperiksa 21 September 2026; cek lagi saat memilih versi pada MOM-001. Referensi menjelaskan kemampuan produk, bukan keputusan lingkup aplikasi:

- [Vite — Getting Started](https://vite.dev/guide/): setup frontend dan kebutuhan runtime.
- [Supabase — React quickstart](https://supabase.com/docs/guides/getting-started/quickstarts/reactjs): koneksi React ke Supabase.
- [Supabase — Row Level Security](https://supabase.com/docs/guides/database/postgres/row-level-security): akses data melalui kebijakan database.
- [Supabase — Database Functions](https://supabase.com/docs/guides/database/functions): fungsi database dan konteks keamanan.
