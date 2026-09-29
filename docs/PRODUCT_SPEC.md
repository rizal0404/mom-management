# Spesifikasi produk MVP

## Alur dan halaman

`Login → Dashboard → Rapat → Buat draf → Isi hasil + tindak lanjut → Finalisasi → Tindak Lanjut → Update → Selesai`.

| Route | Isi |
|---|---|
| `/login` | Email/password, pesan gagal, logout melalui menu profil |
| `/` | Ringkasan task/pending matter, overdue, jatuh tempo dekat, rapat terbaru |
| `/meetings` | Daftar dengan pencarian judul, filter tanggal/status, tombol Buat Rapat |
| `/meetings/new`, `/meetings/:id` | Form/detail notula; hasil rapat berurutan; bagian tindak lanjut |
| `/actions` | Tab Tabel/Timeline, filter dan pencarian bersama |
| `/actions/:id` | Detail action, notula asal, update dan riwayat |
| `/users` | Direktori dan pengelolaan akun, khusus ADMIN aktif |

Tidak ada menu kosong untuk fitur masa depan. Detail action dapat memakai drawer di desktop dengan route yang tetap bisa dibuka langsung.

## Data minimum

Semua ID UUID. Tabel mutable memiliki `created_at`, `updated_at`, dan `version` integer mulai 1. Timestamp UTC, jadwal DATE. Teks plain text untuk MVP.

| Tabel | Field inti |
|---|---|
| `profiles` | id → auth.users, display_name, role ADMIN/MEMBER, is_active |
| `meetings` | id, title, starts_at, location_or_link nullable, chair_name, owner_id, status DRAFT/FINAL, finalized_at nullable |
| `meeting_participants` | id, meeting_id, profile_id nullable, display_name_snapshot; peserta eksternal memakai nama teks |
| `meeting_items` | id, meeting_id, position, agenda, discussion, result, kind NOTE/DECISION/TASK/PENDING_MATTER, draft_pic_id/start_date/due_date nullable |
| `actions` | id, source_item_id UNIQUE → meeting_items, kind TASK/PENDING_MATTER, title, description, pic_id, start_date, due_date, status, closed_at nullable, deleted_at nullable |
| `action_updates` | id, action_id, actor_id, created_at, note, before_values, after_values; append-only |
| `user_admin_audit` | id, actor_id, target_profile_id, event, before_values, after_values, created_at; append-only |

Relasi: meeting 1:N participants/items; satu item TASK/PENDING_MATTER menghasilkan tepat satu action saat final. Meeting asal action dibaca melalui item, tidak perlu foreign key ganda. Field draft pada item menyimpan kesepakatan awal; action menyimpan kondisi terkini. UI notula final membedakan "Kesepakatan rapat" dan "Status tindak lanjut saat ini".

Index: owner/status/tanggal pada meetings; meeting_id/position pada items; pic/status/due_date pada actions; action_id/created_at pada updates. FK melarang penghapusan sumber action dan PIC yang sudah digunakan. Nonaktifkan pengguna, jangan menghapus riwayatnya.

## Notula

- Draf: judul, waktu rapat, pimpinan, dan minimal satu peserta wajib sebelum finalisasi; draf boleh belum lengkap selain judul. Owner dari sesi, bukan input bebas.
- Agenda dapat berisi banyak item; setiap item minimal agenda dan jenis. Pembahasan/hasil boleh kosong saat draf; hasil wajib pada finalisasi. Notula final minimal satu item; rapat tanpa action diperbolehkan.
- NOTE adalah catatan; DECISION adalah keputusan tanpa kewajiban kerja. TASK adalah pekerjaan; PENDING_MATTER adalah masalah/pertanyaan belum tuntas yang wajib ditindaklanjuti.
- TASK/PENDING_MATTER wajib punya PIC aktif, tanggal mulai, dan deadline saat finalisasi. PIC hanya anggota terdaftar; peserta eksternal tidak otomatis menjadi PIC.
- Simpan manual dengan indikator Belum disimpan/Menyimpan/Tersimpan/Gagal. Peringatkan sebelum meninggalkan form kotor. Jangan menampilkan sukses sebelum server mengonfirmasi.
- Owner/admin dapat menghapus draf dengan konfirmasi. Final bersifat tetap dan tidak dihapus/diubah pada MVP; koreksi melalui notula baru yang menyebut notula lama. Mekanisme revisi resmi masuk roadmap.
- Daftar notula menyediakan aksi hapus hanya untuk draf milik sendiri atau ADMIN aktif. Draf final tidak mempunyai aksi hapus dan RPC tetap menolak penghapusan final.
- Finalisasi mengunci rapat, memvalidasi isinya, membuat action, dan menandai FINAL dalam satu transaksi. `source_item_id UNIQUE` mencegah duplikasi. Retry finalisasi rapat yang sudah final mengembalikan hasil lama setelah pemeriksaan akses, tanpa write baru.
- Edit item/participant pada draf ikut mengunci dan menaikkan versi meeting yang sama; jangan biarkan perubahan anak melewati guard finalisasi.

## Tindak lanjut

| Status | Label | Makna |
|---|---|---|
| OPEN | Belum mulai | Status awal |
| IN_PROGRESS | Dikerjakan | Sedang ditindaklanjuti |
| BLOCKED | Terhambat | Ada hambatan; catatan wajib |
| DONE | Selesai | Hasil/resolusi wajib ditulis |
| CANCELLED | Dibatalkan | Alasan wajib; hanya owner rapat/admin |

- OPEN/IN_PROGRESS/BLOCKED dapat berpindah satu sama lain atau ke DONE oleh PIC/owner/admin; cancellation hanya owner/admin. DONE/CANCELLED hanya dapat dibuka kembali ke OPEN oleh owner/admin dengan alasan. Set `closed_at` saat masuk status terminal dan kosongkan saat dibuka kembali.
- PIC dapat mengubah status dan menambah catatan action miliknya. Owner rapat/admin juga dapat mengganti PIC, judul/deskripsi action, start, dan due; perubahan setelah final wajib diberi alasan. Sumber notula tidak berubah.
- `due_date >= start_date`; start tidak wajib sama dengan tanggal rapat. Tidak ada deadline palsu/default diam-diam. DONE pada pending matter berarti persoalan sudah terselesaikan, bukan sekadar dibahas.
- Overdue dihitung, bukan status yang disimpan: `due_date < tanggal_hari_ini_WITA` dan status bukan DONE/CANCELLED. Due hari ini belum overdue. Label "Terlambat" boleh muncul bersama label status.
- Setiap perubahan action dan catatan dicatat dengan aktor/waktu/nilai sebelum-sesudah dalam transaksi yang sama. Riwayat tidak dapat diedit/dihapus pengguna. Tidak ada persentase progres manual per action pada MVP.
- Perubahan membawa `expected_version`; write gagal dengan CONFLICT bila versi berubah. Muat ulang dan minta pengguna menerapkan kembali perubahannya, tanpa overwrite otomatis.
- Owner rapat/ADMIN aktif dapat menghapus task dari tracker dengan konfirmasi. Penghapusan bersifat lunak: isi task tidak lagi tampil di tracker, timeline, detail, atau hitungan dashboard; row task dan seluruh `action_updates` tetap disimpan untuk menjaga referensi serta audit. Penghapusan dicatat sebagai update audit dan menutup mutasi selanjutnya. Tidak ada pemulihan mandiri pada MVP.

## Hak akses dan kontrak data

### Evidence (MOM-011, perluasan 24 September 2026)

- Evidence tersedia pada detail notula tersimpan dan detail tindak lanjut. Simpan draf baru dahulu untuk memperoleh ID sumber. Upload disimpan terpisah dari formulir dan perubahan status.
- Notula: owner/admin boleh menambahkan evidence pada DRAFT maupun FINAL. Tambahan file setelah final tidak mengubah isi, versi, atau hasil notula; berkas lama tidak dapat diganti/dihapus. Draf tetap hanya dapat dibaca owner/admin; evidence final terbaca anggota aktif.
- Task/pending matter: PIC/owner/admin boleh mengunggah bukti penyelesaian sebelum atau sesudah DONE. Lampiran opsional, tidak otomatis mengubah status atau menggantikan catatan hasil/resolusi. Anggota aktif dapat membaca evidence task. Task yang dihapus lunak menolak unggah/list/unduh evidence.
- Format PDF, JPG/JPEG, PNG, WebP, DOCX, XLSX; maksimum 10 MiB/file. Client memeriksa ekstensi/MIME/ukuran dan menolak file kosong; bucket membatasi MIME dan ukuran di server. PDF, JPG/JPEG, dan PNG dapat dibuka pada modal viewer dengan zoom; WebP, DOCX, dan XLSX tetap diunduh sebagai berkas. Viewer memakai unduhan melalui sesi terautentikasi, bukan bucket publik. Tidak ada pemindaian malware.
- Bucket privat `evidence`, path `meetings|actions/<target UUID>/<object UUID>--<nama aman>`. Storage API mengelola byte dan metadata bersama. Owner ID berasal dari sesi Storage, waktu dari server; UI menampilkan nama pengunggah, waktu WITA, nama file dan ukuran. SQL tidak menghapus/mengubah metadata Storage secara langsung.
- Policy SELECT/INSERT memverifikasi anggota aktif dan akses target; tidak ada policy UPDATE/DELETE. File append-only, tanpa overwrite. RPC `list_evidence` memeriksa akses dan memakai pagination 20 file. Unduh menggunakan sesi terautentikasi, bukan bucket publik.
- Retry unggah mempertahankan object key untuk menghindari duplikasi setelah respons sukses hilang. Gagal unggah mempertahankan pilihan file, tersedia retry dan pesan error.
- Retensi: file task terhapus tetap tersimpan privat; file draf yang dihapus tidak lagi dapat diakses karena target tidak tersedia. Pembersihan fisik oleh operator melalui Storage API berada di luar UI fitur ini. Penghapusan database langsung tidak menghapus byte Storage.

Asumsi satu tim: anggota aktif melihat semua notula FINAL beserta actions dan riwayatnya. Hanya owner/admin melihat DRAFT. Anggota aktif boleh membuat draf sendiri. ADMIN mengelola semua notula/actions dan akun pengguna; peran PIC ditentukan per action, bukan role global tambahan. Profil aktif (nama/ID) terbaca untuk pilihan PIC; email akun hanya dikembalikan Edge Function kepada ADMIN aktif dan tidak dipublikasikan pada direktori PIC.

Provisioning awal dapat dilakukan melalui `/users` oleh ADMIN aktif. Edge Function memverifikasi JWT serta profil admin pada setiap panggilan, lalu membuat akun Auth dan profil dalam batas server; service-role key tidak pernah ada di browser. Signup publik dinonaktifkan. Admin dapat mengubah nama, role, dan status akun lain, tetapi tidak dapat mengubah role/status sendiri atau menonaktifkan administrator aktif terakhir. Akun tidak dihapus agar referensi notula/action/audit tetap utuh. Reset kata sandi belum menjadi fitur aplikasi; test account tetap terpisah dan kredensial hanya ada di environment lokal.

Semua tabel mengaktifkan RLS untuk pembacaan sesuai aturan di atas. Cabut direct INSERT/UPDATE/DELETE dari role client pada tabel domain/audit/profiles. Mutasi domain hanya lewat fungsi RPC yang menguji sesi, profil aktif, ownership/PIC, versi, dan input. Fungsi yang perlu hak lebih tinggi menggunakan `SECURITY DEFINER` secara terbatas, `search_path` kosong dengan nama tabel berkualifikasi, revoke EXECUTE dari PUBLIC/anon, grant hanya authenticated. Karena fungsi dapat melewati RLS, pemeriksaan akses eksplisit di dalamnya wajib dan harus diuji melalui request langsung. Jangan mengekspos fungsi generik untuk menjalankan SQL.

| Operasi service/RPC | Kontrak |
|---|---|
| `save_meeting_draft(payload, expected_version)` | Insert/edit rapat dan seluruh item/peserta secara atomik; pertahankan ID item lama; owner/admin; versi hanya wajib saat edit |
| `delete_meeting_draft(id, expected_version)` | Hanya DRAFT; hapus anak dalam transaksi |
| `delete_action(id, expected_version)` | Owner rapat/admin; soft delete idempoten, optimistic version, append audit, sejarah tetap utuh |
| `finalize_meeting(id, expected_version)` | Validasi dan lock; idempotensi per meeting/item; FINAL tidak dapat dimutasi |
| `update_action(id, expected_version, patch, note)` | Whitelist field menurut PIC/owner/admin; audit atomik; termasuk catatan tanpa perubahan status |
| Query meetings/actions/detail/dashboard | Supabase SELECT dengan RLS; pagination/filter di server; tidak memakai service-role di browser |

Standar error: VALIDATION, UNAUTHENTICATED, FORBIDDEN/NOT_FOUND (jangan bocorkan record privat), CONFLICT, SERVER_ERROR. UI menampilkan pesan Indonesia; log tidak memuat isi rapat/password. Respons write mengembalikan entitas dan versi baru; invalidate query terkait sesudah sukses.

## Monitoring

- Tracker: cari judul action; filter jenis, status, PIC, meeting asal, due dari–sampai (inklusif), dan overdue; default semua nonterminal, due terdekat dahulu. Simpan filter di URL; pagination 25 item. Reset filter tersedia.
- Timeline memakai filter yang sama, ditambah overlap pekan: `start_date <= akhir_pekan AND due_date >= awal_pekan`. Senin–Minggu WITA; satu baris per action, bukan sistem dependensi/Gantt. Rentang start–due inklusif; pekan sebelum/sesudah/hari ini; CANCELLED tersembunyi pada filter default.
- Timeline menjalankan query overlap tersendiri, bukan memakai 25 baris halaman tabel yang sedang terbuka; bila hasil dipaginasi, tampilkan jumlah total dan kontrol halaman agar action tidak hilang tanpa keterangan.
- Dashboard adalah data global yang boleh dilihat pengguna: jumlah aktif (OPEN/IN_PROGRESS/BLOCKED), terlambat, due dekat (hari ini sampai +7 hari inklusif, nonterminal), dan persentase selesai. Setiap label menjelaskan rentangnya.
- Persentase selesai = DONE / semua actions selain CANCELLED × 100, dibulatkan ke integer. Penyebut nol tampil "Belum ada tindak lanjut", bukan 100%. Hitung dari semua record yang memenuhi akses, bukan hanya halaman tabel yang dimuat.
- Kartu dashboard menuju tracker dengan filter sesuai metrik; rapat terbaru menampilkan lima notula yang boleh diakses, tanggal terbaru dahulu. Tidak ada angka tren/pencapaian karangan.
