# Progress implementasi

Diperbarui: 2026-09-29 untuk perencanaan DOC-002; status aplikasi berikut merujuk bukti sampai 24 September 2026 dan belum diuji ulang pada sesi dokumentasi ini. MOM-001–003, MOM-007, dan MOM-010 DONE secara teknis; MOM-004/005/006/008/009/011 tetap IN_PROGRESS karena perubahan lanjutan, temuan lain, dan UAT masih terbuka. UAT pengguna belum dijalankan. Lihat [laporan audit](docs/qa/AUDIT-2026-09-22.md). Catatan sesi sebelumnya dipertahankan sebagai riwayat, bukan status terkini.

Status task: TODO / IN_PROGRESS / BLOCKED / DONE. Status pemeriksaan: PASS / FAIL / NOT_RUN / BLOCKED. Gunakan status secara terpisah.

| ID | Ringkasan | Status | Bukti / hambatan |
|---|---|---|---|
| DOC-001 | Paket rencana, kontrak produk, UI, panduan agent, changelog | DONE | Dokumen dan dua referensi UI tersedia; tautan lokal diperiksa |
| DOC-002 | Rencana pengembangan lanjutan berbasis kondisi aplikasi | DONE | 29 Sep 2026: [roadmap](docs/DEVELOPMENT_ROADMAP.md) memuat baseline, prioritas otomatisasi pilihan pengguna, dependensi, acceptance dan estimasi; pemeriksaan dokumen PASS. Hanya dokumentasi; status aplikasi/UAT tidak berubah. Dependensi DOC-001 DONE. |
| MOM-001 | Fondasi frontend | DONE | Scaffold React/Vite, route placeholder, token UI, env example, scripts, lockfile, dan browser smoke test selesai |
| MOM-002 | Database, RLS, migration, fixture | DONE | `npm run db:reset:local` dan `npm run test:db` PASS pada 2026-09-21: anon, signup publik, user nonaktif, isolasi draf, dan write langsung diblokir. |
| MOM-003 | Login dan profil | DONE | DB test PASS; browser PASS pada 2026-09-22 untuk login valid/gagal, reload sesi, logout, dan direct URL tanpa sesi kembali ke `/login`. |
| MOM-004 | Draf notula | IN_PROGRESS | A03 PASS: hapus/reorder agenda draf atomik dan ID item tersisa tetap sama. A06 PASS: blocker navigasi draf kotor untuk back, navigasi internal, dan logout. A09 PASS: daftar notula memiliki pencarian/status/tanggal/pagination server. State form tambahan dari audit masih terbuka. Aksi hapus draf dari daftar memakai RPC/version guard; smoke browser kontrol PASS dan delete DB NOT_RUN. Bukti: `docs/qa/MOM-004-A03-2026-09-22.md`, `docs/qa/MOM-004-A06-2026-09-23.md`, `docs/qa/A09-2026-09-23.md`. |
| MOM-005 | Finalisasi dan action | IN_PROGRESS | A01 PASS: finalisasi diblokir saat draf kotor dan detail final dibaca ulang dari server. A04 PASS: `expected_version=null` ditolak pada finalisasi. A10 PASS: validasi PIC nonaktif dipisahkan dari bukti error INSERT nyata; trigger test-only membuktikan rollback sesudah validasi. Bukti: `docs/qa/MOM-005-A01-2026-09-22.md`, `docs/qa/MOM-006-A04-2026-09-23.md`, `docs/qa/A10-2026-09-23.md`. |
| MOM-006 | Tracker dan update | IN_PROGRESS | A02/A04/A05/A09 sebelumnya PASS. Aksi hapus task memakai soft-delete dengan audit dipertahankan; DB/E2E delete NOT_RUN. Follow-up tampilan audit PASS: daftar per field menggantikan JSON mentah; typecheck/lint dan browser viewport aktif PASS. Responsive 390/1024/1440, DB/E2E follow-up, dan UAT NOT_RUN. Bukti: `docs/qa/MOM-006-A02-2026-09-23.md`, `docs/qa/MOM-006-A04-2026-09-23.md`, `docs/qa/MOM-006-A05-2026-09-23.md`, `docs/qa/A09-2026-09-23.md`, `docs/qa/MOM-006-audit-history-2026-09-24.md`. |
| MOM-007 | Timeline | DONE | A02 dan A07 PASS: tautan detail halaman kedua, recovery error dengan retry, perpindahan pekan, serta perubahan filter. UAT pengguna tetap NOT_RUN. Bukti: `docs/qa/MOM-006-A02-2026-09-23.md`, `docs/qa/A07-2026-09-23.md`. |
| MOM-008 | Dashboard dan UI | IN_PROGRESS | A08 PASS: metrik dashboard memakai count exact berotorisasi sehingga tidak dibatasi 1.000 row. Penyelarasan pedoman visual masih terbuka. Bukti: `docs/qa/A08-2026-09-23.md`. |
| MOM-009 | Validasi menyeluruh dan handoff UAT | IN_PROGRESS | A10 PASS secara teknis; suite regresi Edge A01–A09 PASS. Gate/matriks acceptance lain dan UAT pengguna masih terbuka. Bukti: `docs/qa/A10-2026-09-23.md`. |
| MOM-010 | Kelola pengguna oleh ADMIN | DONE | Menu `/users`, route/sidebar admin-only, Edge Function berotorisasi admin untuk direktori/buat/edit status-peran, audit append-only, dan pengaman admin terakhir. Validasi fungsi, DB, dan Edge browser PASS pada 23 Sep 2026; UAT pengguna tetap NOT_RUN. Bukti: `docs/qa/MOM-010-2026-09-23.md`. |
| MOM-011 | Evidence notula dan tindak lanjut | IN_PROGRESS | Implementasi + Storage/RLS/browser evidence PASS; unit 14/14. Viewer modal PNG PASS untuk baca, zoom in/out/reset, Escape, dan kembali fokus; typecheck/lint/build PASS. PDF/JPEG browser NOT_RUN karena fixture aktif hanya PNG. UAT dan regresi MVP penuh NOT_RUN. Bukti: `docs/qa/MOM-011-evidence-2026-09-24.md`, `docs/qa/MOM-011-evidence-viewer-2026-09-24.md`. |

## 2026-09-29 — DOC-002: rencana pengembangan

- Sasaran: menyusun rencana lanjutan dari source dan bukti QA; task dimulai IN_PROGRESS lalu ditutup setelah dokumen dan pemeriksaan selesai.
- Pilihan pengguna: otomatisasi rapat melalui template, rapat lanjutan dan bantuan AI. Urutan fitur utama MOM-014 → MOM-018 → MOM-021, setelah penutupan validasi MVP; transkripsi audio MOM-022 menyusul evaluasi AI.
- Hasil: `docs/DEVELOPMENT_ROADMAP.md` berisi 11 usulan task MOM-012–022, dependensi, acceptance, estimasi bersyarat, serta kebutuhan akun/backup dan fitur pendukung. Tautan rencana ditambahkan ke IMPLEMENTATION_PLAN dan README; CHANGELOG hanya mencatat hasil dokumentasi.
- Pemeriksaan 29 Sep 2026: `node --input-type=module` dengan pemeriksa dokumen melalui stdin — PASS untuk tautan lokal pada lima dokumen terkait, ID/acceptance 11 task, dependensi tanpa siklus/ID tak dikenal, dan kecocokan script npm dengan `package.json`. Review isi terhadap spesifikasi, progress, source dan QA — PASS; prioritas pilihan pengguna konsisten.
- Lint/typecheck/unit/build/DB/E2E/browser: NOT_RUN pada sesi ini karena hanya dokumentasi. Tidak ada perubahan source aplikasi, migration, database, layanan AI, pengiriman email, deployment, atau status UAT.
- Keterbatasan: `git status --short` melaporkan direktori bukan Git repository, sehingga perbandingan Git tidak tersedia. Estimasi belum menjadi jadwal; penyedia/model AI, anggaran, retensi dan lingkungan pilot belum dipilih.
- Task berikutnya: MOM-004 untuk menutup state form/WITA/hapus draf/QA responsif; fitur pertama setelah fondasi siap ialah MOM-014 template agenda.

## 2026-09-29 — Tahap 0, MOM-004 IN_PROGRESS

- Sasaran sesi: menutup state simpan draf, konversi waktu rapat WITA, penghapusan draf dari daftar, dan QA browser responsif; kemudian melanjutkan task Tahap 0 lain sesuai permintaan pengguna. Status task lama tetap IN_PROGRESS sampai gate relevan dibuktikan.
- Kondisi awal: folder kerja tidak memiliki metadata Git; hasil historis sampai 24 September dipertahankan dan database yang mungkin berisi data pengguna tidak akan di-reset untuk pengujian.

## Gate MVP

| Gate | Hasil | Bukti |
|---|---|---|
| Install dari lockfile | PASS | `npm ci --no-audit --no-fund` — 22 Sep 2026; 294 package, setelah menghentikan Vite yang mengunci native binary. |
| Lint / typecheck / build | PASS | `npm run lint`, `npm run typecheck`, `npm run build` — 23 Sep 2026; warning Fast Refresh lama dan chunk >500 kB. |
| Unit test | PASS | `npm run test` — 4 file, 11 test lulus — 23 Sep 2026. |
| DB integration / RLS / transaksi terotomasi | PASS | `npm run db:reset:local` dan `npm run test:db` — 23 Sep 2026; guard `expected_version` null/stale/current, lintas pengguna/versi paralel/rollback validasi/idempotensi. |
| Simulasi gagal insert sesudah validasi | PASS | `npm run test:db` — trigger test-only lokal memaksa error pada `actions` INSERT setelah validasi `finalize_meeting`; meeting tetap `DRAFT` dan tidak ada action parsial. Fixture PIC nonaktif tetap diuji terpisah sebagai validation failure. 23 Sep 2026. |
| E2E browser terotomasi | PASS | `npm run test:e2e` — 9 skenario Edge PASS pada 23 Sep 2026; termasuk A01, A02 (>25/direct URL/timeline), A03, A05, A06, A07, dan A09. |
| Matriks E2E seluruh skenario wajib | FAIL | A01/A02/A03/A05/A06/A07/A09 regression PASS; A04 memiliki regression DB PASS, tetapi seluruh acceptance browser belum tercakup. |
| QA visual responsif yang diuji | PASS | Edge 1440/1024/390 pada dashboard/form/tracker/timeline tanpa overflow; tiga screenshot diperiksa di `docs/qa/MOM-009-2026-09-22.md`. |
| QA seluruh state/kontrol | FAIL | Recovery timeline A07, agregasi dashboard A08, dan bukti rollback INSERT A10 PASS; state/kontrol audit lain serta UAT masih belum lengkap. |
| UAT pengguna | NOT_RUN | Menunggu MVP teruji |
| Deployment | NOT_RUN | Di luar lingkup paket rencana |

### 2026-09-22 — Audit setelah klaim penutupan

- Lint/typecheck/build PASS, unit 10/10 PASS, test:db PASS sesuai assertion, E2E bawaan 2/2 PASS. Satu warning Fast Refresh dan warning chunk tetap ada.
- Tujuh temuan direproduksi lewat RPC/browser; analisis tambahan menemukan batas agregasi dan fitur filter yang belum lengkap. Bukti: [AUDIT-2026-09-22.md](docs/qa/AUDIT-2026-09-22.md).
- MOM-004–009 dibuka kembali. Klaim simulasi gagal insert dikoreksi ke NOT_RUN; penolakan validasi tetap PASS. Riwayat penutupan di bawah tidak lagi menjadi status terkini.
- Tidak ada perbaikan source/migration, reset database, deploy, atau UAT pada audit. Test menambah DATA DEMO lokal. Berikutnya: perbaiki A03 pada MOM-004, kemudian lanjutkan urutan dalam laporan audit.

### 2026-09-22 — MOM-004 A03: urutan agenda draf

- Sasaran: memperbaiki save draf saat agenda awal/tengah dihapus, tetap mempertahankan ID agenda yang tersisa, dan menjaga rollback saat payload urutan tidak valid.
- Menambahkan migration `20260923100000_mom_004_safe_draft_item_reorder.sql`: constraint `(meeting_id, position)` sekarang deferrable; RPC menyimpan seluruh perubahan item dalam satu transaksi dan memeriksa constraint sebelum selesai.
- `test-db.mjs` kini memeriksa hapus agenda pertama, hapus agenda tengah, ID/posisi tersisa, dan payload posisi duplikat yang gagal tanpa mengubah draf lama. E2E Edge menambahkan alur buat tiga agenda → hapus awal → simpan → reload.
- `npm run db:reset:local`, `npm run test:db`, lint, typecheck, unit 10/10, build, dan E2E 3/3 PASS. Warning Fast Refresh dan ukuran chunk tetap ada. Bukti: `docs/qa/MOM-004-A03-2026-09-22.md`.
- A03 ditutup. MOM-004 tetap IN_PROGRESS karena A06 dan filter rapat A09 belum dikerjakan. Berikutnya menurut urutan audit: A01 dalam MOM-005.

### 2026-09-22 — MOM-005 A01: finalisasi dari draf tersimpan

- Sasaran: menutup jalur yang memfinalkan data lama ketika operator mengubah draf tetapi belum menyimpan.
- `MeetingEditorPage` kini memblokir pembukaan/konfirmasi finalisasi pada form kotor, menampilkan pesan yang dapat dibaca, serta mengarahkan fokus ke Simpan draf. Setelah finalisasi berhasil, detail notula dimuat ulang dari server sebelum tampilan final.
- E2E Edge menambahkan regresi perubahan hasil: blokir finalisasi pada draf kotor → simpan → finalisasi → reload → hasil final tetap data tersimpan. Run akhir `npm run test:e2e` PASS 4/4.
- Lint, typecheck, unit 10/10, dan build PASS; warning Fast Refresh dan ukuran chunk tetap ada. Bukti: `docs/qa/MOM-005-A01-2026-09-22.md`.
- A01 ditutup. MOM-005 tetap IN_PROGRESS karena A04/A10 belum dikerjakan. Berikutnya menurut urutan yang diminta pengguna: A06 dalam MOM-004.

### 2026-09-23 — MOM-004 A06: blocker navigasi draf kotor

- Sasaran: mencegah perubahan draf hilang saat pengguna memakai back, navigasi sidebar, atau logout; tetap memberi jalan keluar eksplisit dan tidak menghalangi setelah simpan berhasil.
- Menambahkan `UnsavedChangesProvider` pada route aplikasi dan `useBlocker` React Router. Dialog **Perubahan belum disimpan** menyediakan **Batal** untuk mempertahankan form dan **Tinggalkan tanpa menyimpan** untuk meneruskan navigasi. Logout memakai dialog yang sama dan membersihkan status kotor sebelum sign out.
- `MeetingEditorPage` mendaftarkan `isDirty` ke provider, mempertahankan `beforeunload`, serta memberi bypass satu kali untuk redirect hasil simpan agar blocker tidak salah menahan navigasi ke detail draf.
- E2E menutup alur simpan → navigasi tanpa dialog, back SPA → Batal, sidebar → Tinggalkan, serta logout → Batal/Tinggalkan. `npm run test:e2e` PASS 5/5 pada 2026-09-23.
- Lint, typecheck, unit 10/10, dan build PASS; satu warning Fast Refresh lama serta warning ukuran chunk tetap ada. Bukti: `docs/qa/MOM-004-A06-2026-09-23.md`.
- A06 ditutup. MOM-004 tetap IN_PROGRESS karena filter rapat A09 belum dikerjakan. Task berikutnya sesuai urutan audit: A02.

### 2026-09-23 — MOM-006 A02: detail action di luar halaman pertama

- Sasaran: membuka action yang berada setelah 25 record pertama dari pagination, hasil pencarian, timeline, dan direct URL.
- `getAction(id)` tidak lagi mengambil page 1 lalu mencari ID lokal. Service kini meminta satu row dengan `.eq('id', id).maybeSingle()` melalui client Supabase; RLS tetap menentukan apakah record dapat dibaca, lalu row tersebut di-hydrate dengan sumber notula/PIC.
- E2E membuat satu notula `DATA DEMO` dengan 26 TASK, membuka halaman kedua tracker, reload direct URL action ke-26, lalu mengulangi klik detail dari halaman kedua timeline. `npm run test:e2e` PASS 6/6 pada 2026-09-23.
- Lint, typecheck, unit 10/10, dan build PASS; warning Fast Refresh lama serta ukuran chunk tetap ada. Bukti: `docs/qa/MOM-006-A02-2026-09-23.md`.
- A02 ditutup. MOM-006 tetap IN_PROGRESS karena A04/A05 dan filter meeting/default A09 masih terbuka. Task berikutnya sesuai urutan audit: A04.

### 2026-09-23 — MOM-006 A04: `expected_version` wajib

- Sasaran: menutup bypass optimistic-lock ketika caller mengirim `expected_version=null` pada write RPC.
- Migration `20260923110000_mom_006_require_expected_version.sql` menambahkan penolakan eksplisit `CONFLICT` untuk `update_action`, `finalize_meeting`, dan `delete_meeting_draft`, termasuk retry idempoten finalisasi; versi numerik current/stale tetap diuji.
- `npm run db:reset:local` dan `npm run test:db` PASS. Regresi database mencakup null/stale/current pada update action, null pada hapus draf, serta null pada finalisasi awal dan retry.
- Lint, typecheck, unit 10/10, build, dan `npm run test:e2e` PASS; E2E Edge 6/6. Warning Fast Refresh lama dan ukuran chunk tetap ada. Bukti: `docs/qa/MOM-006-A04-2026-09-23.md`.
- A04 ditutup secara teknis. MOM-006 tetap IN_PROGRESS karena A05/A09 masih terbuka. Task berikutnya sesuai urutan audit: A05.

### 2026-09-23 — MOM-006 A05: alasan perubahan action

- Sasaran: mencegah owner/admin mengubah PIC atau jadwal action tanpa alasan yang tercatat.
- Migration `20260923120000_mom_006_action_change_reason.sql` membandingkan nilai sebelum/sesudah pada judul, deskripsi, PIC, tanggal mulai, dan deadline. Perubahan aktual tanpa `p_note` ditolak dengan `VALIDATION`; perubahan beralasan tetap diaudit atomik.
- Form detail action memvalidasi alasan sebelum request dan menjelaskan kewajiban tersebut. E2E menutup perubahan deadline/PIC tanpa alasan lalu dengan alasan.
- `npm run db:reset:local`, `npm run test:db`, lint, typecheck, unit 10/10, build, dan `npm run test:e2e` 7/7 PASS. Warning Fast Refresh lama dan ukuran chunk tetap ada. Bukti: `docs/qa/MOM-006-A05-2026-09-23.md`.
- A05 ditutup secara teknis. MOM-006 tetap IN_PROGRESS karena A09 masih terbuka. Task berikutnya sesuai urutan audit: A09.

### 2026-09-23 — A09: filter notula dan tracker

- Sasaran: melengkapi pencarian/status/tanggal/pagination daftar notula, filter notula asal pada tracker, serta default tracker nonterminal dengan pilihan semua status yang eksplisit.
- `meetingService.listMeetings` sekarang memakai count/range server dan filter URL. `actionService` memetakan `meetingId` melalui `meeting_items`, sehingga tabel dan timeline tidak memakai hasil halaman yang salah.
- `MeetingsPage` dan `ActionsPage` menampilkan kontrol filter, reset, empty state, total, dan pagination; URL dapat di-reload tanpa kehilangan filter.
- E2E A09 membuat 26 draf `DATA DEMO`, memeriksa halaman kedua, filter judul/status/tanggal, membuat action dari notula asal, lalu memverifikasi default aktif menyembunyikan DONE dan `Semua status` menampilkannya kembali.
- `npm run db:reset:local`, `npm run test:db`, lint, typecheck, unit 10/10, build, dan `npm run test:e2e` 8/8 PASS. Warning Fast Refresh lama dan ukuran chunk tetap ada. Bukti: `docs/qa/A09-2026-09-23.md`.
- A09 ditutup secara teknis. MOM-004 tetap IN_PROGRESS karena state form tambahan; MOM-006 dapat ditandai DONE secara teknis. UAT pengguna tetap NOT_RUN. Temuan berikutnya sesuai audit: A07.

### 2026-09-23 — MOM-007 A07: recovery error timeline

- Sasaran: menghilangkan error timeline lama saat request pekan/filter baru berhasil, menyediakan retry khusus timeline, dan mencegah data pekan lama tampil saat query baru masih memuat.
- `TimelineView` sekarang mengikat loading/error pada identitas filter + pekan + halaman. Query baru menyembunyikan hasil lama sampai selesai; respons sukses mengganti data dan membersihkan error; respons gagal menampilkan error untuk query tersebut.
- Ditambahkan tombol `Coba lagi` pada error timeline. Retry mengulang query timeline tanpa harus memuat ulang halaman atau mengubah filter tabel.
- E2E A07 memutus request timeline, memastikan error dan retry terlihat, memulihkan query, menguji perpindahan pekan setelah error, lalu mengganti filter ke empty state. Run terfokus 1/1 PASS; suite penuh `npm run test:e2e` 9/9 PASS pada 2026-09-23.
- Validasi: `npm run db:reset:local`, `npm run test:db`, `npm run test`, `npm run typecheck`, `npm run lint`, dan `npm run build` PASS. Lint tetap memiliki satu warning Fast Refresh lama; build tetap memberi warning chunk >500 kB. Bukti: `docs/qa/A07-2026-09-23.md`.
- A07 ditutup secara teknis dan MOM-007 menjadi DONE secara teknis. UAT pengguna tetap NOT_RUN. Temuan berikutnya sesuai audit: A08.

### 2026-09-23 — MOM-008 A08: agregasi dashboard di atas 1.000 action

- Sasaran: memastikan metrik dashboard menghitung seluruh action yang dapat diakses, termasuk saat jumlahnya melewati `api.max_rows=1000`, dan tetap mengecualikan `CANCELLED` dari penyebut persentase selesai.
- `dashboardService` kini memakai lima query `count: 'exact', head: true` melalui client Supabase terautentikasi untuk aktif, terlambat, due dekat, DONE, dan eligible selain CANCELLED. RLS tetap menjadi pembatas akses; tidak ada service-role di browser.
- `urgentActions` tetap mengambil lima baris terdekat secara paginasi, sedangkan rapat terbaru tetap dibatasi lima sesuai kontrak produk.
- Unit regression menguji count 1.001 dan filter status/tanggal. `test-db.mjs` membuat fixture `DATA DEMO` 1.001 action melalui RPC, memeriksa count exact, serta range 0–999 dan 1000–1999. Semua PASS.
- Validasi: `npm run db:reset:local`, `npm run test:db`, `npm run test` (4 file, 11 test), `npm run typecheck`, `npm run lint`, dan `npm run build` PASS. Lint tetap memiliki satu warning Fast Refresh lama; build tetap memberi warning chunk >500 kB. Bukti: `docs/qa/A08-2026-09-23.md`.
- A08 ditutup secara teknis. MOM-008 tetap IN_PROGRESS karena penyelarasan pedoman UI masih terbuka; UAT pengguna tetap NOT_RUN. Temuan berikutnya sesuai audit: A10.

### 2026-09-23 — MOM-009 A10: bukti kegagalan INSERT sesudah validasi

- Sasaran: mengganti bukti A10 yang keliru. PIC nonaktif sekarang diuji sebagai penolakan validasi sebelum INSERT; bukti error INSERT memakai fixture valid dan trigger test-only pada database lokal disposable.
- `scripts/test-db.mjs` memasang trigger sementara yang melempar `TEST_INSERT_FAILURE` pada `public.actions` INSERT. Finalisasi gagal setelah validasi, status meeting tetap `DRAFT`, tidak ada action parsial, lalu trigger dan fungsi test dibuang pada blok `finally`.
- Tidak ada migration atau perubahan production schema untuk simulasi ini. Semua data uji berlabel `DATA DEMO` dan hanya berada di database lokal.
- Validasi: `npm run db:reset:local`, `npm run test:db`, `npm run test` (4 file, 11 test), `npm run typecheck`, `npm run lint`, `npm run build`, dan `npm run test:e2e` (9/9 Edge) PASS pada 23 Sep 2026. Lint tetap memiliki satu warning Fast Refresh lama; build tetap memberi warning chunk >500 kB.
- A10 ditutup secara teknis. MOM-005 dan MOM-009 tetap IN_PROGRESS karena gate acceptance lain dan UAT pengguna belum selesai. Bukti: [A10-2026-09-23](docs/qa/A10-2026-09-23.md).

### 2026-09-22 — Penutupan temuan MOM-004/MOM-009 (riwayat; dikoreksi audit di atas)

- Sasaran: menutup seluruh temuan terbuka dari `docs/qa/MOM-009-2026-09-22.md` agar MOM-004 dan MOM-009 dapat ditandai DONE.
- MeetingEditorPage: ditambahkan `saveStatus` (idle/saving/saved/error) dengan indikator chip, `isDirty` dengan `beforeunload` listener, `titleRef` untuk fokus pada field invalid pertama, dan dialog konfirmasi finalisasi (modal kustom dengan jumlah TASK/PENDING_MATTER).
- actionService: `listActions` dan `listTimelineActions` kini mengembalikan `PaginatedResult<ActionRecord>` dengan `{ data, total, page, pageSize }` menggunakan Supabase `.range()` dan `{ count: 'exact' }`. PAGE_SIZE = 25.
- ActionsPage: pagination URL param `page`, total dari server, kontrol Sebelumnya/Berikutnya, page reset saat filter berubah.
- TimelineView: pagination lokal dengan `QueryState` pattern, auto-reset saat week/filters berubah.
- dashboardService: `listActions` consumer diperbarui untuk `PaginatedResult.data`.
- test-db.mjs: skenario simulasi gagal insert — draf dengan PIC nonaktif ditolak finalisasi, meeting tetap DRAFT, tidak ada action parsial.
- CSS: save-indicator, modal-backdrop/dialog, pagination styling ditambahkan.
- Gate: `npm run lint` PASS (0 error, 1 warning Fast Refresh lama), `npm run typecheck` PASS, `npm run test` PASS (4 file, 10 test), `npm run build` PASS (chunk warning >500 kB).
- `npm run test:db` PASS (termasuk simulasi gagal insert) dan `npm run test:e2e` PASS (2/2 skenario lulus dengan modal konfirmasi dan kontrol pagination).
- MOM-004 dan MOM-009 ditandai DONE secara teknis. UAT pengguna tetap NOT_RUN.

## Catatan sesi

### 2026-09-21 — DOC-001

- Menetapkan dua modul, urutan MOM-001–009, aturan data/akses/finalisasi, dan visual berdasarkan gambar.
- Asumsi belum dikonfirmasi: multi-user satu tim, visibilitas notula final bersama, zona WITA, stack React/Supabase.
- Berikutnya: MOM-001. Siapkan lingkungan Supabase lokal sebelum MOM-002.

### 2026-09-21 — MOM-001

- Mengubah MOM-001 menjadi IN_PROGRESS lalu DONE setelah acceptance criteria terpenuhi.
- Menambahkan scaffold React + TypeScript + Vite dengan React Router, Tailwind CSS, Lucide, Vitest, TypeScript strict, dan ESLint.
- Menambahkan route placeholder berlabel untuk dashboard, login, rapat, detail rapat, tindak lanjut, dan detail tindak lanjut.
- Menambahkan theme/token UI berdasarkan `docs/UI_GUIDELINE.md`, layout sidebar responsif dasar, `.env.example`, `.gitignore`, scripts npm, konfigurasi test/build, serta README setup aktual.
- Validasi browser nyata: dev server `http://127.0.0.1:5173/` terbuka; navigasi dan direct route bekerja; console error/warning kosong.
- Belum ada database, auth, data demo, atau fitur bisnis; seluruhnya tetap untuk MOM-002 dan task sesudahnya.

### 2026-09-21 — MOM-002

- Sasaran: membangun schema relasional, constraint, index, RLS baca dasar, fixture lokal, dan pemeriksaan integrasi yang dapat diulang.
- Ditambahkan `supabase/migrations/20260921090000_mom_002_schema.sql`: enum, enam tabel domain, FK/restrict/cascade, constraint jadwal/status, trigger metadata/version, index, RLS, dan blokir DML client langsung.
- Ditambahkan `supabase/seed.sql` dengan empat akun serta draf A/B dan notula final bersama yang berlabel `DATA DEMO`; public signup lokal dimatikan.
- Ditambahkan `npm run db:reset:local` untuk membangun ulang database bersih, serta `npm run test:db` untuk pemeriksaan anon, member nonaktif, isolasi draf, visibilitas final, dan penolakan write langsung.
- Pemeriksaan aplikasi: `npm run lint` PASS; `npm run typecheck` PASS; `npm run test` PASS (2/2); `npm run build` PASS.
- Perbaikan lanjutan: fixture awal gagal karena list nilai `meetings` tidak seragam. Kolom `finalized_at` kini eksplisit untuk seluruh tiga baris; bootstrap berikutnya menerapkan migration dan seed tanpa error SQL tersebut.
- Pekerjaan tersisa: setelah stack Supabase lokal stabil, jalankan `npm run db:reset:local` lalu `npm run test:db`. MOM-002 tetap IN_PROGRESS hingga hasilnya PASS.
- Berikutnya: selesaikan gate MOM-002; setelah itu MOM-003.

### 2026-09-21 — MOM-003

- Sasaran: login/logout, guard route, profil aktif, serta provisioning admin/member/PIC tanpa signup publik.
- Ditambahkan client Supabase berbasis environment, service auth terpisah, `AuthProvider`, route guard, form login tervalidasi, dan logout pada profil sidebar.
- User tanpa session diarahkan ke `/login`; profil tidak aktif ditandatangani keluar; status role/profil tidak dapat dimutasi dari client.
- Konfigurasi lokal mengizinkan provider email/password untuk akun yang diprovisikan, sambil tetap menolak public signup pada level Auth utama.
- `npm run db:reset:local` PASS; `npm run test:db` PASS untuk signup ditolak, login valid/gagal, sesi dibaca ulang, user nonaktif, dan role escalation client ditolak.
- `npm run lint` PASS (satu warning Fast Refresh non-blocking); `npm run typecheck` PASS; `npm run test` PASS (4/4); `npm run build` PASS.
- Browser nyata: NOT_RUN. Berikutnya: jalankan `npm run dev` dengan `.env.local` Supabase lokal lalu periksa login aktif/gagal, reload session, logout, dan direct URL.

### 2026-09-21 — MOM-004

- Menambahkan editor peserta eksternal dan agenda/hasil dinamis, RPC simpan/hapus draf, daftar notula, serta penanganan conflict versi di UI.
- `npm run db:reset:local` PASS dan `npm run test:db` PASS: create → reload relasi → edit dengan ID item tetap → CONFLICT stale version → member lain FORBIDDEN → admin dapat membaca draf → delete.
- MOM-004 tetap IN_PROGRESS sampai alur form dan detail diuji di browser nyata, termasuk responsif dan error jaringan.

### 2026-09-22 — MOM-005

- Sasaran: memfinalkan notula secara atomik, membuat action dari TASK/PENDING_MATTER, menjaga keputusan tanpa action, dan mengunci notula final.
- Menambahkan `finalize_meeting(p_id, p_expected_version)`: otorisasi owner/admin, konflik versi, validasi waktu/pimpinan/peserta/hasil/PIC aktif/jadwal, insert action idempoten berbasis `source_item_id`, serta status final immutable.
- Menambahkan migration lanjutan untuk menyimpan metadata rapat dan PIC/jadwal item pada RPC draf sehingga data yang difinalkan berasal dari payload tersimpan.
- Editor menampilkan waktu, pimpinan, lokasi, PIC aktif, tanggal mulai/jatuh tempo, detail final, dan tombol finalisasi; final tidak lagi menyediakan edit/hapus.
- `npm run test:db` PASS pada 2026-09-22: owner/admin finalisasi, member lain FORBIDDEN, dua action untuk TASK/PENDING, keputusan tanpa action, retry idempoten, final immutable, dan kegagalan validasi tetap DRAFT tanpa action.
- `npm run typecheck` PASS; `npm run build` PASS; test unit PASS (4/4) dengan pool forks satu worker untuk stabilitas Vitest; lint PASS dengan satu warning Fast Refresh yang sudah ada di `AuthProvider.tsx`.
- Browser nyata dan QA responsif: NOT_RUN karena pengendali browser tidak berhasil diinisialisasi pada sesi ini.

### 2026-09-22 — Pemeriksaan browser/UAT lanjutan

- Percobaan membuka tab localhost melalui pengendali browser gagal dua kali setelah reset runtime: `failed to write kernel assets: The system cannot find the path specified. (os error 3)`.
- Smoke HTTP non-browser ke `/`, `/login`, `/meetings`, `/meetings/new`, dan `/actions` merespons 200; bukti ini hanya memastikan dev server/router entry tersedia, bukan validasi interaksi atau UAT.
- MOM-003, MOM-004, dan MOM-005 tetap IN_PROGRESS/NOT_RUN untuk gate browser sampai runtime browser dapat dipulihkan.

### 2026-09-22 — Browser nyata MOM-003–005

- Runtime browser pulih; `http://localhost:5173/login` dan `http://localhost:5173/meetings` dapat dikontrol tanpa error kernel assets.
- MOM-003 browser PASS: login valid dengan akun `DATA DEMO`, reload mempertahankan sesi/profil, logout kembali ke `/login`, direct `/meetings` tanpa sesi dijaga route guard, dan password salah menampilkan `Email atau kata sandi tidak sesuai.`
- MOM-004 browser PASS sebagian: membuat draf berjudul `Browser draft DATA DEMO`, reload mempertahankan peserta/item, edit judul tersimpan, sesi kedua menerima `Data berubah; muat ulang.` saat menyimpan versi stale, lalu draf dihapus melalui kontrol `Hapus draf` setelah konfirmasi `Hapus draf?`. Membuka ulang URL detail menampilkan `Notula tidak ditemukan atau tidak dapat diakses.` Responsive viewport 1440/1024/390 belum dijalankan.
- MOM-005 browser PASS: membuat fixture `Finalisasi browser DATA DEMO` dengan item TASK, PIC `Anggota A DATA DEMO`, mulai `2026-09-22`, jatuh tempo `2026-09-30`; finalisasi menampilkan `NOTULA FINAL` dan PIC/jadwal, lalu reload tetap menampilkan detail final tanpa kontrol edit/hapus. Route `/actions` masih menampilkan placeholder MOM-006, sehingga tracker UI bukan bukti MOM-005.
- Bukti runtime: in-app browser tab pada `http://localhost:5173`; tidak ada error visual selama alur. Console audit penuh dan viewport responsif belum dijalankan.

### 2026-09-22 — MOM-006 tracker dan update

- Sasaran: tracker action, filter, detail sumber, update terotorisasi, konflik versi, dan audit immutable.
- Ditambahkan `20260922100000_mom_006_action_tracker.sql` dengan RPC `update_action`: PIC hanya dapat mengubah status/catatan, owner/admin dapat mengubah field action dan jadwal, terminal/reopen guard, validasi PIC/jadwal/catatan, expected-version conflict, closed_at, dan audit before/after.
- Ditambahkan `src/modules/actions/actionService.ts`, `ActionsPage.tsx`, dan `ActionDetailPage.tsx`; route `/actions` dan `/actions/:id` tidak lagi placeholder. Filter URL mencakup pencarian, jenis, status, PIC, rentang deadline, overdue, dan reset; detail memuat sumber notula serta riwayat perubahan.
- `npm run db:reset:local` dan `npm run test:db` PASS pada 2026-09-22: PIC update status, PIC field owner/admin ditolak, owner edit jadwal, stale conflict, DONE dengan catatan, reopen terminal oleh admin, dan empat audit row.
- `npm run typecheck` PASS; `npm run lint` PASS dengan satu warning Fast Refresh lama di `AuthProvider.tsx`; `npm run test` PASS (4/4); `npm run build` PASS dengan warning chunk Vite >500 kB.
- Browser PASS: tracker memuat 2 action, pencarian `Task tindak lanjut` menyisakan 1 item, detail direct URL menampilkan source meeting dan empat audit, owner menyimpan update deskripsi/catatan dan versi naik 5 → 6, serta URL `search=Task tindak lanjut&status=OPEN` menghasilkan tepat 1 item OPEN. Membuka dropdown status melalui tab in-app browser sempat membuat tab crash (`localhost crashed unexpectedly`); interaksi dropdown native itu adalah limitation runtime browser, sementara filter URL dan hasilnya terverifikasi.

### 2026-09-22 — MOM-007 timeline

- Ditambahkan query `listTimelineActions` dengan overlap inklusif `start_date <= akhir pekan AND due_date >= awal pekan`, tetap menerapkan filter action yang sama.
- Ditambahkan tab Timeline, navigasi pekan sebelumnya/ini/berikutnya melalui parameter URL `week`, bar timeline desktop, dan agenda per tanggal untuk layar kecil; setiap item membuka detail action yang sama.
- `npm run test:db` PASS pada 2026-09-22 dengan pemeriksaan query overlap pekan 2026-09-21 s.d. 2026-09-27.
- Browser PASS: pekan 2026-09-21 menampilkan dua action pada timeline; pekan berikutnya 2026-09-28 menampilkan empty state; navigasi kembali memulihkan dua action; klik bar timeline membuka `/actions/:id`.

### 2026-09-22 — MOM-008 dashboard dan perapian UI

- Menambahkan dashboard nyata berbasis query Supabase yang tetap tunduk pada RLS: aktif, terlambat, deadline dekat WITA (+7 hari), persentase selesai yang mengecualikan CANCELLED, lima action aktif, dan lima notula terbaru.
- Kartu ringkasan mengarahkan ke URL filter tracker yang relevan. Query aktif memastikan DONE/CANCELLED tidak ikut hitung aktif atau overdue.
- Perapian visual memakai prinsip Material Design 3: surface tonal, hirarki hero, kartu rounded, status/badge jelas, focus ring, responsif; daftar rapat serta form ikut diselaraskan dan tracker memakai kartu pada ponsel.
- `npm run lint` PASS dengan satu warning Fast Refresh lama; `npm run typecheck` PASS; `npm run test` PASS (4 file/9 test); `npm run build` PASS dengan warning chunk Vite >500 kB; `npm run test:db` PASS.
- Browser nyata PASS pada 1440/1024/390 untuk dashboard, form notula, dan tracker. Kartu aktif membuka `/actions?active=true`; loading terlihat dan tidak ada console error/warning atau horizontal page overflow. State empty/error lulus unit view tetapi belum diinjeksi pada browser. Bukti: `docs/qa/MOM-008-2026-09-22.md`.
- MOM-008 selesai secara teknis. UAT pengguna dan E2E lintas pengguna tetap NOT_RUN hingga MOM-009.
- Penyelarasan visual lanjutan: token warna canvas/sidebar/surface/primary hijau-lime, font stack Roboto Flex/Roboto fallback, M3 shape scale 12/16/20/28/full, tombol pill, selected navigation tonal, dan status container yang lebih dekat dengan referensi pengguna. Browser visual PASS pada dashboard desktop/mobile serta tracker dan form tanpa overflow; konsol tidak memiliki error/warning.

## Format bukti sesi berikutnya

```text
Tanggal / task:
Perubahan:
Perintah atau langkah pemeriksaan:
Hasil PASS/FAIL/NOT_RUN/BLOCKED + ringkasan:
Lokasi bukti (tanpa rahasia):
Hambatan / pekerjaan tersisa:
Task berikutnya:
```

### 2026-09-24 — MOM-008: layout timeline dan daftar task (IN_PROGRESS)

- Sasaran: panel timeline ringkas di atas daftar task seperti referensi pengguna, mempertahankan tema M3 hijau-lime, filter URL, jadwal DATE/WITA, dan akses detail.
- Lingkup hanya presentasi tracker/timeline; validasi teknis dan browser menunggu hasil sesi ini.

### 2026-09-24 — Hasil redesign layout MOM-008

- Sub-lingkup layout timeline/task list selesai secara teknis: panel timeline ringkas di atas daftar task, filter disclosure, avatar inisial PIC, grid harian, dan kartu/agenda mobile; tema existing dipertahankan.
- PASS: lint (1 warning lama), typecheck, unit 11/11, build (warning chunk), 4 regresi Edge relevan, dan browser visual 1440/1024/390 tanpa page overflow.
- Full suite DB/E2E tidak diulang; UAT NOT_RUN. MOM-008 tetap IN_PROGRESS untuk lingkup audit keseluruhan. Berikutnya: review/UAT layout serta acceptance state/kontrol yang belum ditutup.
- Bukti: [MOM-008-layout-2026-09-24](docs/qa/MOM-008-layout-2026-09-24.md).

### 2026-09-24 — Follow-up komentar layout

- Komentar pengguna meminta menghapus panel `Daftar task` dari tab Timeline karena daftar sudah tersedia pada tab `Tabel`. Render panel daftar, state error/kosong/loading, dan pagination kini hanya pada tab Tabel. Navigasi halaman pekan tetap ada di Timeline.
- `npm run typecheck` PASS; browser menunjukkan daftar tidak ada di Timeline dan tabel tetap ada di Tabel. Screenshot final 1440/390 disimpan di bukti MOM-008. Lint/unit/build tidak diulang untuk perubahan ini.

### 2026-09-24 — Permintaan aksi hapus notula/task (IN_PROGRESS)

- Sasaran: sediakan aksi hapus yang jelas di daftar Notula dan Task, menjaga kontrol owner/admin, optimistic version, audit, serta referential integrity.
- Semantik untuk Notula FINAL dan penghapusan riwayat Task sedang menunggu pilihan pengguna; draf menggunakan RPC hapus yang sudah tersedia dan bisa dipasang independen.

### 2026-09-24 — Aksi hapus notula draf dan task

- MOM-004: baris notula DRAFT kini menampilkan Hapus untuk owner/admin; memakai RPC `delete_meeting_draft` dan expected version yang sudah ada. FINAL tetap tidak memiliki aksi dan tetap ditolak oleh RPC.
- MOM-006: tombol Hapus task tersedia pada tracker tabel, kartu ponsel, dan detail. Migration menambah `actions.deleted_at` dan RPC `delete_action`: owner/admin, expected version, idempotent, menyimpan audit `action_updates`; task terhapus tidak dapat dimutasi lagi dan tidak tampil di tracker/timeline/dashboard/detail.
- Validasi: local migration up tanpa reset, typecheck, lint (1 warning lama), build, pemeriksaan browser halaman daftar. Belum mengklik delete dan belum menjalankan DB/E2E/unit; UAT NOT_RUN.
- Bukti: [MOM-006-delete-actions-2026-09-24](docs/qa/MOM-006-delete-actions-2026-09-24.md).


### 2026-09-24 — MOM-011 Evidence — IN_PROGRESS
- Follow-up komentar tombol upload: pemilih file kini dapat dibuka lewat tombol utama; label/petunjuk membedakan memilih file dan mengunggah. Pengujian browser ditambahkan pada alur file chooser sebenarnya.
- Follow-up: typecheck dan browser filechooser/upload/download/reload PASS; pengulangan suite lengkap terhenti karena login browser PIC timeout (FAIL), cleanup fixture PASS. Rincian pada laporan QA MOM-011.
- Sasaran: upload/unduh evidence privat notula dan penyelesaian task, RLS lintas pengguna, batas tipe/ukuran, lampiran append-only dan QA browser.
- Implementasi tersedia. PASS: migration lokal, typecheck, lint (1 warning existing), unit 14/14, build (warning chunk existing), `npm run test:evidence` (Storage/RLS nyata dan Edge: upload/unduh/reload/final/DONE, lintas role, responsif).
- Seluruh fixture dan akun sementara dibersihkan; jumlah record kembali ke kondisi sebelum tes. Verifikasi akhir 1 notula/2 task/0 evidence; data di luar fixture tetap dipertahankan. Tidak ada reset atau seed ulang.
- Suite regresi seluruh MVP dan UAT pengguna NOT_RUN; status tetap IN_PROGRESS untuk handoff. Bukti: [MOM-011 evidence](docs/qa/MOM-011-evidence-2026-09-24.md).

### 2026-09-24 — MOM-011 viewer evidence — IN_PROGRESS
- Sasaran: pratinjau modal PDF/JPG/JPEG/PNG dari unduhan terotorisasi, dengan zoom in/out dan reset 100%; format evidence lain tetap diunduh.
- Implementasi dan QA browser: PNG dapat dibuka; zoom 125%/75%, reset 100%, tutup Escape, dan fokus kembali ke tombol pratinjau PASS. Typecheck/lint/build PASS. PDF/JPEG browser NOT_RUN karena fixture yang tersedia hanya PNG; UAT NOT_RUN. Bukti: [MOM-011 evidence viewer](docs/qa/MOM-011-evidence-viewer-2026-09-24.md).

### 2026-09-24 — MOM-004 detail notula visual — IN_PROGRESS
- Sasaran: susun ulang tampilan detail notula final sesuai referensi terbaru dengan ringkasan rapat, peserta, agenda/hasil, evidence, dan tautan tindak lanjut; pertahankan data dan perilaku final immutable.
- Implementasi UI PASS: hero final, ringkasan tiga kolom, peserta, kartu agenda/pembahasan/hasil, jadwal/PIC, panel evidence, dan tautan filter tindak lanjut. Detail menunggu data sebelum memilih layar final/draf agar formulir tidak muncul selama pemuatan.
- Pemeriksaan: typecheck PASS; lint PASS (0 error, 1 warning Fast Refresh lama); build PASS (peringatan ukuran chunk yang sudah ada). Browser nyata 836×746 PASS; CTA membuka tracker dengan satu tindak lanjut rapat ini. Bukti: [MOM-004 detail notula](docs/qa/MOM-004-meeting-detail-layout-2026-09-24.md).
- QA viewport 1440/1024/390 dan UAT pengguna NOT_RUN; MOM-004 tetap IN_PROGRESS.

### 2026-09-24 — MOM-004 form draf visual — IN_PROGRESS
- Sasaran: selaraskan halaman buat/edit draf dengan hierarki, palet lokal, dan kartu detail FINAL; pertahankan seluruh kontrol, validasi, simpan/finalisasi/hapus, serta lampiran yang sudah berfungsi.
- Implementasi PASS: breadcrumb/hero, kartu informasi rapat, peserta ber-inisial, agenda dengan bidang pembahasan/hasil, bidang PIC/tanggal kondisional, status simpan, aksi form, dan panel evidence mengikuti gaya detail FINAL. Semantik field dan handler tetap terhubung ke alur yang sama.
- Pemeriksaan: typecheck PASS; lint PASS (0 error, 1 warning Fast Refresh lama); build PASS (peringatan chunk >500 kB). Browser nyata pada 836×746 PASS untuk tampilan atas/bawah dan ketersediaan kontrol; tidak menyimpan/mengubah data rapat. Bukti: [MOM-004 form draf](docs/qa/MOM-004-draft-form-layout-2026-09-24.md).
- Viewport 1440/1024/390 dan UAT pengguna NOT_RUN; MOM-004 tetap IN_PROGRESS.
