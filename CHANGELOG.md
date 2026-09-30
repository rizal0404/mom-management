# Changelog

Catat perubahan yang benar-benar sudah dibuat. Rencana masa depan tetap di IMPLEMENTATION_PLAN, bukan pada entri rilis. Setiap entri implementasi memuat task, perubahan perilaku, dan hasil validasi; jangan menandai fitur sebagai tersedia hanya karena sudah direncanakan.

## [Unreleased]

### Added — 2026-09-30, MOM-015 ganti kata sandi dan pemulihan akun (IN_PROGRESS)

- Menambahkan halaman **Akun dan kata sandi**, form update sandi via Supabase Auth, permintaan reset dari login, dan callback `/account/password`. Permintaan menampilkan pesan sukses generik dan error pengiriman tanpa membocorkan alamat email; callback hanya menampilkan form jika Auth memulihkan sesi dan profil aktif.
- URL callback dibangun tetap dari origin aplikasi, memakai PKCE, dan tidak menerima tujuan redirect dari input. `supabase/config.toml` mengizinkan URL lokal exact pada Vite port 5173/5174; README mencatat konfigurasi URL dan SMTP hosted yang perlu dilakukan operator.
- PASS: typecheck, ESLint repo (0 error/1 warning Fast Refresh lama), build (peringatan chunk >500 kB), unit MOM-015 7/7, koleksi 3 E2E, serta browser nyata untuk form recovery 1440/1024/390 dan callback expired 390. Auth E2E/DB/email lokal BLOCKED karena Docker tidak tersedia dan Playwright process gagal `spawn EPERM`; cloud dan email target tidak disentuh, UAT NOT_RUN. MOM-009 masih IN_PROGRESS sehingga MOM-015 tetap IN_PROGRESS. Bukti: [QA MOM-015](docs/qa/MOM-015-password-recovery-2026-09-30.md).

### Added — 2026-09-30, MOM-014 template agenda pribadi (IN_PROGRESS)

- Pengguna dapat mengelola template agenda miliknya di `/meeting-templates`, menyusun urutan agenda dan jenis item, mengisi nama serta judul awal opsional, lalu membuat draf dari template melalui RPC. Tombol penggunaan juga tersedia pada daftar notula.
- Template bersifat pribadi melalui RLS dan RPC berotorisasi; perubahan/hapus memakai versi yang diharapkan. Instansiasi membuat ID notula baru dengan status DRAFT. Hanya nama/judul fallback dan struktur agenda dipakai; peserta, jadwal, pembahasan/hasil, PIC, evidence, action, dan status pekerjaan lama tidak disalin. Finalisasi memakai alur validasi yang ada.
- PASS: typecheck, ESLint (0 error/1 warning lama), unit 41/41, browser nyata via API mock pada 1440/1024/390, pemeriksaan sintaks skrip DB, dan `git diff --check`. Build diblokir dependensi native Tailwind/`spawn EPERM`; DB/RLS belum dijalankan karena Supabase CLI/Docker tidak tersedia; Playwright Edge spawn BLOCKED. UAT NOT_RUN. Cloud tidak disentuh. Dependensi MOM-004/005/009 tetap IN_PROGRESS. [Bukti QA MOM-014](docs/qa/MOM-014-personal-agenda-templates-2026-09-30.md).

### Fixed — 2026-09-30, MOM-004 pemulihan hapus draf

- Tombol **Muat ulang** setelah konflik versi hapus kini membersihkan pesan konflik sebelum mengambil daftar terbaru.
- Menambahkan uji UI untuk owner/admin/member, penghapusan memakai versi yang terlihat, dan alur konflik; assertion DB owner/admin/member serta versi stale ditambahkan. Edge UI-mock menghapus draf dari daftar pada lebar 390.
- PASS: typecheck, lint (0 error / 1 warning Fast Refresh lama), unit 28/28, build (warning chunk >500 kB), pemeriksaan sintaks DB test, Edge UI-mock dan `git diff --check`. DB/RLS dan E2E terintegrasi NOT_RUN karena Supabase disposable tidak tersedia; cloud tidak digunakan untuk mutasi. Bukti: [QA MOM-004](docs/qa/MOM-004-draft-delete-recovery-2026-09-30.md).

### Added — 2026-09-29, MOM-012 cetak notula

- Detail DRAFT tersimpan dan FINAL kini menyediakan tampilan cetak A4 lewat dialog cetak browser. Isinya berasal dari snapshot tersimpan: metadata rapat WITA, peserta, agenda berurutan, pembahasan, hasil, serta PIC/jadwal kesepakatan. DRAFT diberi label jelas; editor, navigasi, dan kontrol evidence tidak masuk hasil cetak.
- Draf kotor tidak dapat dicetak dari tombol. Pengguna diarahkan menyimpan atau membatalkan perubahan; jika memakai pintasan cetak browser, konten diganti dengan pesan yang sama sehingga perubahan belum tersimpan tidak tercetak.
- Tidak ada migration atau endpoint baru. PDF dihasilkan dengan fitur Save as PDF browser; byte/tautan evidence dan status tindak lanjut terkini tidak dicampur ke notula.
- Typecheck, lint (0 error/1 warning Fast Refresh lama di AuthProvider), seluruh unit 25/25, dan build PASS; build mempertahankan warning chunk >500 kB. Edge UI mock 1440/1024/390, PDF A4 panjang 8 halaman, draf kotor satu halaman pengarah, serta FINAL tanpa action satu halaman PASS terbatas. DB/RLS akses lintas role, Storage/E2E terintegrasi, dan UAT tetap NOT_RUN/BLOCKED; MOM-012 IN_PROGRESS karena dependensi belum DONE. Bukti: [QA MOM-012](docs/qa/MOM-012-print-2026-09-29.md).

### Changed — 2026-09-30, MOM-012 regresi akses cetak

- E2E lintas pengguna kini memeriksa owner/ADMIN dapat membuka dialog cetak untuk DRAFT, member tidak mendapat tombol ketika akses URL DRAFT ditolak, dan member dapat mencetak FINAL yang boleh dibaca. Print ditangkap oleh test page agar tidak membuka dialog OS.
- PASS: ESLint pada spec E2E dan `node node_modules/@playwright/test/cli.js test --list` mengoleksi semua 12 skenario. Eksekusi E2E dan DB/RLS belum berjalan karena Supabase disposable belum tersedia; cloud tidak digunakan. MOM-012 tetap IN_PROGRESS. Bukti: [QA MOM-012](docs/qa/MOM-012-print-2026-09-29.md).

### Added — 2026-09-30, MOM-013 pintasan tugas personal (IN_PROGRESS)

- Tracker memiliki preset **Tugas Saya**, **Jatuh tempo hari ini**, **7 hari ke depan**, dan **Terlambat**, dengan hitungan personal exact, preset URL, filter PIC sesi, tanggal WITA, dan tautan ke action asli. Tampilan global aktif tetap menjadi default.
- PASS: typecheck, lint (0 error / 1 warning lama), unit 37/37, build, Edge UI-mock responsif 1440/1024/390 untuk pintasan/kosong/reset, dan koleksi 13 skenario E2E. E2E dua PIC/DB/RLS dan UAT belum dijalankan karena Supabase disposable tidak tersedia; cloud tidak disentuh. Dependensi MOM-006/008/009 tetap IN_PROGRESS. Bukti: [QA MOM-013](docs/qa/MOM-013-personal-shortcuts-2026-09-30.md).

### Backend cloud dan Tahap 0 — 2026-09-29

- Menerapkan 14 migration ke proyek Supabase cloud `iccxlwfzojwtmwwvpfoe` tanpa seed, termasuk bucket Storage `evidence` privat dan kebijakan soft-delete terbaru. Deploy `manage-users` berhasil; signup publik dimatikan. Frontend lokal memakai URL cloud dan publishable key, tanpa secret. [Bukti migrasi](docs/qa/CLOUD-SUPABASE-2026-09-29.md).
- MOM-004/005: input waktu rapat konsisten WITA pada zona browser berbeda, indikator simpan sesuai keadaan, gagal simpan mempertahankan input, dan dialog finalisasi mendukung fokus/Tab/Escape. MOM-006: migration RLS menyembunyikan action terhapus dan auditnya dari API anggota. MOM-008/011/009: regresi dashboard, fixture PDF/JPEG, skrip evidence, E2E lintas pengguna, pedoman UI, serta checklist UAT diperluas. [Bukti Tahap 0](docs/qa/STAGE-0-2026-09-29.md).
- `test:e2e` kini menolak URL cloud agar fixture DATA DEMO tidak terkirim. Typecheck, lint (0 error/1 warning lama), unit 20/20, build, dan Edge UI-mock PASS. DB/Storage/E2E terintegrasi tetap BLOCKED karena lingkungan uji disposable belum tersedia. Pra-UAT awal hanya baca-saja; hasil UAT parsial sesudah persetujuan dicatat di bawah. Task Tahap 0 tetap IN_PROGRESS.
- Setelah persetujuan pengguna, UAT cloud parsial PASS untuk simpan/reload dan privasi draf, finalisasi tepat dua action, update PIC dan audit, ringkasan tracker/timeline/dashboard, serta pembuatan lalu penonaktifan akun MEMBER uji. Satu notula FINAL dan dua action DONE berlabel DATA DEMO dipertahankan. PDF/JPEG berhasil diunggah ke notula dan lulus preview/zoom/Escape setelah reload; evidence task masih kosong dan unduh belum terverifikasi. Gate DB/Storage/E2E dan UAT penuh tetap BLOCKED/IN_PROGRESS; rincian per skenario di `docs/qa/MOM-009-UAT.md`.
- Temuan UAT F-01: setelah akun PIC nonaktif, detail notula/tracker/audit tidak lagi menyelesaikan namanya dan dropdown action menampilkan nilai admin aktif; belum dibuktikan bahwa assignment database berubah. Perbaiki penyajian nama historis tanpa membuka akses profil nonaktif.

### Documentation — 2026-09-29, DOC-002

- Menambahkan [rencana pengembangan](docs/DEVELOPMENT_ROADMAP.md) berdasarkan source, status task dan QA terakhir, dengan prioritas pilihan pengguna: template agenda → rapat lanjutan → bantuan AI dari teks yang ditinjau manusia.
- Merinci usulan MOM-012–022 beserta dependensi, acceptance criteria, estimasi bersyarat, penutupan validasi MVP, transkripsi audio lanjutan dan kesiapan operasi. IMPLEMENTATION_PLAN/README ditautkan; progress dokumentasi diperbarui tanpa menutup task aplikasi atau UAT.
- PASS: pemeriksaan tautan lokal, kelengkapan task/acceptance, dependensi, script npm dan konsistensi dokumen pada 29 Sep 2026. Pengujian aplikasi/database/browser NOT_RUN; sesi ini hanya menghasilkan rencana, belum mengimplementasikan fitur baru.

### Changed — 2026-09-24, detail notula FINAL

- Halaman detail FINAL disusun ulang mengikuti referensi: ringkasan rapat, peserta ber-avatar inisial, agenda dengan kolom pembahasan/hasil serta PIC/jadwal, evidence, dan tautan tindak lanjut terfilter. Data final tetap baca-saja; tampilan draf tetap memakai editor terpisah.
- Halaman menampilkan status memuat/kesalahan sebelum detail tersedia sehingga kontrol draf tidak muncul saat data final masih diambil.
- PASS: typecheck, lint (1 warning lama), build, browser nyata pada 836×746 dan navigasi CTA ke satu item terfilter. Viewport 1440/1024/390 serta UAT NOT_RUN. Bukti: `docs/qa/MOM-004-meeting-detail-layout-2026-09-24.md`.

### Changed — 2026-09-24, form draf notula

- Halaman buat/edit draf kini memakai breadcrumb, hero, kartu informasi, peserta, dan agenda yang konsisten dengan detail FINAL; bidang PIC/tanggal kondisional, simpan/finalisasi/hapus, indikator simpan, dan evidence tetap memakai alur yang sudah ada.
- PASS: typecheck, lint (1 warning lama), build, dan pemeriksaan browser nyata 836×746 pada form baru. Tidak ada data disimpan. Viewport 1440/1024/390 dan UAT NOT_RUN. Bukti: `docs/qa/MOM-004-draft-form-layout-2026-09-24.md`.

### Fixed — 2026-09-24, tampilan riwayat perubahan

- Mengganti JSON audit mentah di detail tindak lanjut dengan daftar field berlabel Indonesia, nilai Sebelum/Sesudah, serta pesan ringkas saat tidak ada field yang berubah.
- PASS: typecheck dan lint (0 error; 1 warning Fast Refresh lama); browser detail action menampilkan perubahan status dalam format mudah dibaca. QA responsif 390/1024/1440 dan UAT NOT_RUN. Bukti: `docs/qa/MOM-006-audit-history-2026-09-24.md`.

### Added — 2026-09-24, viewer evidence

- PDF, JPG/JPEG, dan PNG kini dapat dibuka lewat modal pratinjau dengan zoom 50–300%, reset 100%, Escape, dan retry; akses berkas tetap menggunakan sesi Storage terautentikasi. Format lain tetap diunduh.
- PASS: typecheck/lint/build dan browser PNG (zoom, reset, Escape, focus return). PDF/JPEG browser serta QA responsif dan UAT NOT_RUN karena fixture aktif hanya berisi PNG. Bukti: `docs/qa/MOM-011-evidence-viewer-2026-09-24.md`.

### Fixed — 2026-09-24, pemilih evidence

- Tombol evidence sebelumnya nonaktif ketika belum ada file, tetapi tampil seperti tombol aktif. Sekarang **Pilih file evidence** membuka dialog berkas; setelah memilih file valid, tombol berubah menjadi **Unggah evidence**. Petunjuk menampilkan file terpilih dan langkah penyimpanan; keadaan sibuk terlihat berbeda.

### Added — 2026-09-24, MOM-011

- Evidence privat untuk notula tersimpan dan bukti penyelesaian task/pending matter; unggah/unduh, daftar pengunggah/waktu WITA/ukuran, pagination, error/retry. PDF/gambar/DOCX/XLSX maksimal 10 MiB.
- Storage RLS membatasi unggah notula pada owner/admin dan task pada PIC/owner/admin; akses baca mengikuti sumber, anon/nonaktif/task terhapus ditolak. File append-only; tambahan evidence tidak mengubah isi notula final.
- Ditambahkan tes Storage/RLS + browser Edge mandiri `npm run test:evidence` dengan cleanup fixture dan akun sementara tanpa reset/seed database yang telah dikosongkan pengguna. Penyesuaian detail responsif dan mock dashboard untuk soft-delete.
- PASS: migration lokal, typecheck, lint (1 warning existing), 14 unit tests, build (warning chunk existing), integrasi Storage dan browser evidence 1440/1024/390. UAT dan suite regresi penuh NOT_RUN. Bukti: `docs/qa/MOM-011-evidence-2026-09-24.md`.

### Added — 2026-09-23

- MOM-010: menu dan route **Kelola pengguna** khusus ADMIN untuk membuat akun, melihat direktori user, mengubah nama/peran/status, serta menonaktifkan akses tanpa membuka Supabase Dashboard.
- MOM-010: Edge Function `manage-users` memeriksa JWT dan profil admin aktif sebelum memakai service-role key di server. Password sementara tidak disimpan atau dikembalikan ke browser.
- MOM-010: audit append-only pembuatan/perubahan user, guard perubahan diri sendiri, serta pencegahan nonaktif/demosi administrator aktif terakhir.
- MOM-010: `npm run test:users` dan E2E Edge menguji otorisasi member/admin, pembuatan akun, perubahan status, dan audit. Validasi: typecheck, lint, unit, DB, build, serta E2E 10/10 PASS; UAT tetap NOT_RUN. Bukti: `docs/qa/MOM-010-2026-09-23.md`.

### Audit — 2026-09-22, setelah penutupan sebelumnya

- Ditambahkan [laporan audit](docs/qa/AUDIT-2026-09-22.md), probe RPC/browser lokal, hasil JSON, dan screenshot reproduksi.
- MOM-004–009 dibuka kembali: finalisasi input kotor, detail action setelah 25 record, hapus agenda awal, guard versi null, alasan perubahan deadline, navigasi draf, dan recovery timeline terbukti bermasalah.
- Klaim "simulasi gagal insert" dikoreksi: tes PIC nonaktif berhenti pada validasi sebelum INSERT. Gate tersebut NOT_RUN, bukan PASS.
- Pemeriksaan ulang: lint/typecheck/build PASS; unit 10/10, DB integration, dan E2E bawaan 2/2 PASS pada cakupan yang diuji. Hasil ini tidak menutup temuan audit tambahan. UAT NOT_RUN.
- Tidak ada perubahan source aplikasi/migration dalam audit. Entri penutupan sebelumnya di bawah dipertahankan sebagai riwayat dan telah digantikan hasil audit ini.

### Fixed — 2026-09-23

- A06 / MOM-004: perubahan draf kini memblokir back, navigasi sidebar, dan logout melalui `useBlocker` React Router dengan dialog Batal/Tinggalkan.
- A06: `beforeunload` tetap melindungi keluar dari browser; logout membersihkan status kotor sebelum sign out; redirect otomatis setelah simpan memakai bypass satu kali agar tidak tertahan blocker.
- Ditambahkan E2E A06 untuk simpan tanpa dialog, back SPA, Batal/Tinggalkan, navigasi internal, dan logout.
- Validasi: lint (0 error, 1 warning lama), typecheck, unit 10/10, build, dan `npm run test:e2e` 5/5 PASS. UAT tetap NOT_RUN. Bukti: `docs/qa/MOM-004-A06-2026-09-23.md`.
- A02 / MOM-006: detail action sekarang mengambil row berdasarkan ID secara langsung, sehingga action di halaman kedua, hasil pencarian, timeline, dan direct URL dapat dibuka tanpa dibatasi 25 row pertama.
- Ditambahkan E2E A02 dengan 26 action `DATA DEMO`, pagination tracker/timeline, dan reload direct URL detail. Validasi akhir `npm run test:e2e` PASS 6/6; UAT tetap NOT_RUN. Bukti: `docs/qa/MOM-006-A02-2026-09-23.md`.
- A04 / MOM-004/MOM-005/MOM-006: RPC `update_action`, `finalize_meeting`, dan `delete_meeting_draft` kini menolak `expected_version=null` dengan `CONFLICT`, sehingga optimistic-lock tidak dapat dilewati melalui nilai null.
- Ditambahkan regression database untuk `expected_version` null, stale, dan current, termasuk retry idempoten finalisasi. Validasi akhir `npm run db:reset:local`, `npm run test:db`, lint, typecheck, unit 10/10, build, dan `npm run test:e2e` 6/6 PASS; UAT tetap NOT_RUN. Bukti: `docs/qa/MOM-006-A04-2026-09-23.md`.
- A05 / MOM-006: perubahan judul, deskripsi, PIC, tanggal mulai, dan deadline oleh owner/admin kini wajib menyertakan alasan; guard ini berlaku di RPC dan form detail action.
- Ditambahkan regression database untuk perubahan deadline/PIC tanpa alasan serta E2E untuk penolakan pra-submit dan penyimpanan dengan alasan. Validasi akhir `npm run db:reset:local`, `npm run test:db`, lint, typecheck, unit 10/10, build, dan `npm run test:e2e` 7/7 PASS; UAT tetap NOT_RUN. Bukti: `docs/qa/MOM-006-A05-2026-09-23.md`.
- A09 / MOM-004/MOM-006: daftar notula kini mendukung pencarian judul, filter status/tanggal, pagination server, total hasil, reset, dan empty state melalui URL.
- A09 / MOM-006: tracker dan timeline kini dapat difilter berdasarkan notula asal. Default tracker adalah nonterminal dengan pilihan `Semua status` eksplisit; kombinasi filter dan pagination tetap tersimpan di URL.
- Ditambahkan E2E A09 dengan 26 draf `DATA DEMO`, filter judul/status/tanggal, halaman kedua, filter notula asal, serta verifikasi DONE tersembunyi pada default aktif. Validasi akhir `npm run db:reset:local`, `npm run test:db`, lint, typecheck, unit 10/10, build, dan `npm run test:e2e` 8/8 PASS; UAT tetap NOT_RUN. Bukti: `docs/qa/A09-2026-09-23.md`.
- A07 / MOM-007: lifecycle query timeline kini mereset tampilan ke loading saat pekan/filter/halaman berubah, menyembunyikan data lama selama request baru, dan membersihkan error setelah respons berhasil.
- A07: error timeline memiliki tombol `Coba lagi` yang mengulang query timeline secara mandiri; navigasi pekan dan filter tetap dapat memulihkan state tanpa reload halaman.
- Ditambahkan E2E A07 untuk error jaringan → retry → perpindahan pekan → perubahan filter/empty state. Validasi akhir `npm run db:reset:local`, `npm run test:db`, lint, typecheck, unit 10/10, build, dan `npm run test:e2e` 9/9 PASS; UAT tetap NOT_RUN. Bukti: `docs/qa/A07-2026-09-23.md`.
- A08 / MOM-008: metrik dashboard tidak lagi mengambil seluruh row action melalui satu response API yang terpotong `max_rows=1000`; aktif, terlambat, due dekat, DONE, dan eligible kini dihitung dengan query `count: exact, head: true` yang tetap tunduk pada RLS.
- A08: urgent actions tetap memakai pagination lima baris dan rapat terbaru tetap limit lima, sehingga perubahan hanya memperbaiki agregasi global.
- Ditambahkan unit regression count 1.001 serta fixture DB `DATA DEMO` 1.001 action untuk memeriksa `count: exact` dan range halaman 1.000/1.001. Validasi akhir `npm run db:reset:local`, `npm run test:db`, lint, typecheck, unit 11/11, dan build PASS; UAT tetap NOT_RUN. Bukti: `docs/qa/A08-2026-09-23.md`.
- A10 / MOM-009: skenario PIC nonaktif pada `test-db.mjs` sekarang didokumentasikan sebagai kegagalan validasi sebelum INSERT, bukan simulasi gagal insert.
- A10: ditambahkan trigger dan fungsi test-only sementara pada database lokal disposable untuk melempar error saat `actions` INSERT setelah seluruh validasi finalisasi lolos. Tes memastikan meeting kembali tetap `DRAFT`, tidak ada action parsial, dan trigger/fungsi dibuang pada `finally`; tidak ada perubahan migration/production schema.
- Validasi akhir: `npm run db:reset:local`, `npm run test:db`, `npm run test` (4 file, 11 test), `npm run typecheck`, `npm run lint`, `npm run build`, dan `npm run test:e2e` 9/9 Edge PASS pada 23 Sep 2026. Satu warning Fast Refresh dan warning chunk >500 kB tetap ada; UAT tetap NOT_RUN. Bukti: `docs/qa/A10-2026-09-23.md`.

### Fixed — 2026-09-22

- A03 / MOM-004: draf dengan beberapa agenda kini dapat menghapus agenda pertama atau tengah lalu menyimpan urutan baru tanpa benturan constraint. ID agenda yang masih ada tetap dipertahankan.
- A03: payload agenda dengan nomor posisi duplikat tetap gagal secara atomik dan tidak mengubah draf sebelumnya.
- Ditambahkan regression test database dan E2E Edge untuk hapus agenda pertama → simpan → reload.
- Validasi: reset database lokal, `test:db`, lint, typecheck, unit, build, dan E2E 3/3 PASS. UAT tetap NOT_RUN.
- A01 / MOM-005: finalisasi sekarang ditolak saat draf memiliki perubahan belum tersimpan; fokus kembali ke Simpan draf dengan pesan yang jelas.
- A01: notula final dibaca ulang dari server setelah finalisasi, sehingga data yang ditampilkan sama dengan data yang dikunci.
- Ditambahkan E2E Edge untuk perubahan hasil draf → blokir finalisasi → simpan → finalisasi → reload; E2E 4/4 PASS. UAT tetap NOT_RUN.

### Added

- MOM-001: scaffold React + TypeScript + Vite dengan route placeholder untuk Dashboard, Login, Notula, dan Tindak lanjut.
- MOM-001: token UI, layout sidebar responsif dasar, `.env.example`, konfigurasi ESLint/Vitest/Tailwind, dan scripts npm.
- MOM-001: lockfile `package-lock.json` untuk instalasi reproducible.
- MOM-002: migration Supabase untuk profil, notula, peserta, item rapat, tindak lanjut, dan riwayat action; termasuk constraint, index, trigger metadata/version, dan RLS baca dasar.
- MOM-002: fixture database lokal `DATA DEMO`, script `npm run db:reset:local` untuk reset, dan `npm run test:db` untuk pemeriksaan RLS dasar.
- MOM-002: konfigurasi local auth menonaktifkan public signup dan dokumentasi menjalankan database lokal.
- MOM-003: login email/password, session/profile provider, guard untuk route privat, logout, serta profil pengguna aktif di sidebar.
- MOM-003: dokumentasi provisioning admin melalui Supabase Dashboard, reset password, dan nonaktifkan pengguna tanpa menghapus riwayat.
- MOM-004: awal RPC draf notula serta halaman daftar dan buat draf.
- MOM-004: test integrasi transaksi RPC untuk create/reload/edit/conflict/delete dan batas owner/admin/member lain.
- MOM-005: RPC finalisasi atomik dengan validasi, pembuatan action TASK/PENDING_MATTER, idempotensi, dan penguncian notula final.
- MOM-005: metadata waktu/pimpinan/lokasi serta PIC dan jadwal item draf tersimpan; editor menampilkan form finalisasi dan detail final yang immutable.
- MOM-004: indikator simpan draf (Belum disimpan/Menyimpan/Tersimpan/Gagal) dengan chip status di dekat tombol Simpan.
- MOM-004: peringatan `beforeunload` saat form memiliki perubahan yang belum disimpan (input kotor).
- MOM-004: fokus otomatis pada field invalid pertama (judul rapat) saat validasi gagal.
- MOM-004/MOM-005: dialog konfirmasi finalisasi menampilkan jumlah task dan pending matter yang akan dibuat serta konsekuensi notula menjadi tetap.
- MOM-009: pagination server 25 item/halaman untuk tracker tindak lanjut (`ActionsPage`) dengan kontrol halaman URL dan total item dari server.
- MOM-009: pagination server 25 item/halaman untuk timeline (`TimelineView`) dengan auto-reset halaman saat filter atau pekan berubah.
- MOM-009: skenario simulasi gagal insert pada `test-db.mjs` — draf dengan PIC nonaktif ditolak finalisasi, meeting tetap DRAFT, tidak ada action parsial.
- MOM-009: CSS untuk save-indicator, modal konfirmasi, dan pagination controls.
### Validation

- `npm ci --no-audit --no-fund`: PASS.
- `npm run lint`: PASS.
- `npm run typecheck`: PASS.
- `npm run test`: PASS — 1 file, 2 test.
- `npm run build`: PASS.
- Browser smoke test dev server: PASS; root, route modul, direct route, dan console diperiksa. Full E2E/responsive QA/UAT belum dijalankan.
- MOM-002 fixture: error seed `VALUES lists must all be the same length` diperbaiki dengan menyertakan `finalized_at` pada seluruh baris notula.
- MOM-002 DB integration: bootstrap lokal menerapkan migration dan seed setelah perbaikan; uji RLS `npm run test:db` masih belum direkam sebagai PASS.
- MOM-002 DB integration: `npm run db:reset:local` dan `npm run test:db` PASS; mencakup anon, public signup, akun nonaktif, isolasi draf, dan blokir write langsung.
- MOM-003: `npm run test:db` PASS untuk login valid/gagal, sesi dibaca ulang, dan role escalation client ditolak; lint/typecheck/unit/build PASS. Browser nyata masih NOT_RUN.
- MOM-005: `npm run test:db` PASS untuk owner/admin, penolakan pengguna lain, promosi dua action, keputusan tanpa action, retry idempoten, final immutable, dan rollback validasi; typecheck/build PASS, unit 4/4 PASS, lint tanpa error dengan satu warning Fast Refresh. Browser nyata masih NOT_RUN.
- Browser MOM-003: PASS pada 2026-09-22 untuk login valid/gagal, reload sesi, logout, dan route guard direct URL tanpa sesi.
- Browser MOM-004: PASS sebagian pada 2026-09-22 untuk create/reload/edit/stale-version conflict/delete; URL fixture setelah penghapusan menampilkan `Notula tidak ditemukan atau tidak dapat diakses.` Responsive viewport masih NOT_RUN.
- Browser MOM-005: PASS pada 2026-09-22 untuk finalisasi fixture DATA DEMO, validasi PIC/jadwal, serta detail notula final immutable setelah reload; route tracker action masih placeholder MOM-006.
- MOM-006: migration RPC `update_action` dengan permission PIC/owner/admin, validasi status/jadwal/catatan, expected-version conflict, closed_at, dan audit before/after.
- MOM-006: tracker `/actions` dan detail `/actions/:id` dengan filter URL, sumber notula, update action, dan riwayat perubahan.
- MOM-006 DB integration: `npm run db:reset:local` dan `npm run test:db` PASS untuk permission update, conflict, terminal/reopen, dan audit.
- Browser MOM-006: PASS untuk tracker, pencarian, detail, source link, audit, update owner, dan kombinasi URL `search + status` yang menghasilkan satu action OPEN. Dropdown native status sempat membuat tab in-app browser crash; dicatat sebagai limitation runtime browser.
- MOM-007: timeline mingguan dengan query overlap inklusif, navigasi pekan melalui URL, filter action bersama, bar desktop, dan agenda mobile.
- MOM-008: dashboard berbasis query/RLS untuk tindak lanjut aktif, terlambat, deadline dekat, penyelesaian, tindak lanjut aktif, dan lima notula terbaru.
- MOM-008: kartu ringkasan terhubung ke filter tracker; daftar rapat, form, tracker ponsel, dan surface global diperbarui dengan pola Material Design 3.
- MOM-008: penyelarasan visual lanjutan ke referensi M3 hijau-lime—color roles tonal, typography hierarchy, pill/filled controls, selected navigation container, dan shape scale responsif.
- MOM-009: Playwright Edge dan `npm run test:e2e` untuk alur A/B terhadap Supabase lokal, isolasi draf, finalisasi, update/riwayat PIC, gagal jaringan/retry, logout/direct URL, dan viewport; konfigurasi serta lockfile diperbarui.
- MOM-009: pemeriksaan DB diperluas untuk finalisasi paralel, konflik dua sesi, batas PIC, audit, start=due dan start>due; tes unit WITA sebelum/sesudah tengah malam; retry tracker kini benar-benar mengulang query.
- MOM-009: README operasi lokal diperbarui, checklist UAT dan laporan bukti/temuan dibuat di `docs/qa/`.
- MOM-007 validation: `npm run test:db` PASS untuk overlap pekan; browser PASS untuk dua action pada pekan aktif, empty state pekan berikutnya, navigasi kembali, dan tautan ke detail action.
- MOM-008 validation: `npm run lint` (satu warning Fast Refresh lama), `npm run typecheck`, `npm run test` (4 file/9 test), `npm run build` (warning chunk Vite >500 kB), dan `npm run test:db` PASS pada 2026-09-22. Browser nyata PASS pada 1440/1024/390 untuk dashboard, form, dan tracker; bukti di `docs/qa/MOM-008-2026-09-22.md`.
- MOM-008 visual validation: dashboard, tracker, dan form diperiksa ulang setelah palet/typography/shape update pada browser nyata; 1440/1024/390 PASS tanpa page overflow dan tanpa console error/warning.
- MOM-009 (22 Sep 2026): `npm ci`, `npm run db:reset:local`, lint/typecheck, unit 10/10, DB integration, build, dan Edge E2E 2/2 PASS pada cakupan yang dicatat di `docs/qa/MOM-009-2026-09-22.md`; lint warning Fast Refresh, build warning chunk. Browser visual tiga screenshot dan 1440/1024/390 diperiksa. Acceptance lengkap, simulasi gagal insert, dan UAT pengguna masih NOT_RUN/IN_PROGRESS; tidak ada klaim rilis.
- Penutupan MOM-004/MOM-009 (22 Sep 2026): `npm run lint` PASS (0 error, 1 warning Fast Refresh lama), `npm run typecheck` PASS, `npm run test` PASS (4 file, 10 test), `npm run build` PASS (chunk >500 kB), `npm run test:db` PASS (termasuk skenario simulasi gagal insert rollback), `npm run test:e2e` PASS (2/2 skenario lulus dengan modal konfirmasi dan kontrol pagination). MOM-004 dan MOM-009 → DONE secara teknis; UAT pengguna tetap NOT_RUN.

## [0.1.0-plan] — 2026-09-21

### Added

- DOC-001: rencana MVP dua modul—Notula Rapat dan Tindak Lanjut.
- Panduan eksekusi agent, spesifikasi data/akses/status, sembilan task berurutan dan acceptance criteria.
- Panduan UI berdasarkan dua referensi gambar pengguna dan salinan referensi di folder dokumentasi.
- Pelacakan progress dengan pemisahan bukti teknis, QA visual, dan UAT.

### Validation

- Pemeriksaan kelengkapan dokumen dan tautan relatif dilakukan pada paket perencanaan.
- Test aplikasi, database, browser, dan UAT: NOT_RUN; aplikasi belum dibuat.

### Changed — 2026-09-24

- MOM-008: redesign layout tracker mengikuti referensi pengguna, dengan tema M3 hijau-lime existing. Timeline kini tampil di atas task list, bar kompak dengan PIC inisial, grid tanggal/penanda hari ini, dan filter yang dapat dibuka dari toolbar.
- Tabel task memakai panel/header, avatar PIC, dan susunan kolom yang lebih ringkas; agenda/kartu mobile dipertahankan. Loading tidak menampilkan row lama; empty/error berada dalam panel daftar.
- Validasi: lint/typecheck/build, unit 11/11, empat regresi Edge (filter, recovery timeline, halaman kedua/detail, jaringan/keyboard/responsif), dan QA visual 1440/1024/390 PASS. Warning lama Fast Refresh/chunk tetap ada; full DB/E2E tidak diulang; UAT NOT_RUN. Bukti: `docs/qa/MOM-008-layout-2026-09-24.md`.

- Follow-up komentar pengguna (24 Sep): panel Daftar task tidak lagi muncul pada tab Timeline; tetap tersedia di tab Tabel. Typecheck dan pemeriksaan browser kedua tab PASS; bukti 1440/390 di laporan QA. Lint/test/build tidak dijalankan ulang untuk perubahan kondisional ini.

### Follow-up fitur hapus — 2026-09-24

- Aksi hapus draf notula dan task ditambahkan setelah permintaan pengguna. Notula FINAL tetap tidak bisa dihapus sesuai pilihan pengguna; penghapusan task bersifat lunak dan menyimpan audit.
- PASS: migration baru diterapkan hanya ke Supabase lokal tanpa reset, typecheck, lint (0 error/1 warning lama), build, dan pemeriksaan browser bahwa kontrol tampil pada tab/record yang sesuai. Aksi hapus tidak dijalankan pada fixture yang sudah ada.
- Unit/DB/E2E untuk perubahan ini NOT_RUN; UAT NOT_RUN. Detail semantik dan keterbatasan ada pada [laporan QA](docs/qa/MOM-006-delete-actions-2026-09-24.md).
