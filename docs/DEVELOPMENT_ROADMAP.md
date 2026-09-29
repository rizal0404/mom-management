# Rencana pengembangan MOM Task Management

Tanggal: **29 September 2026**. Task dokumentasi: **DOC-002**. Status: **usulan prioritas dan lingkup**, belum merupakan implementasi atau persetujuan rilis.

Tujuan: memudahkan pencatatan rapat, memastikan PIC mengetahui pekerjaan yang perlu ditindaklanjuti, dan menyediakan laporan yang dapat ditelusuri ke notula serta bukti penyelesaian.

Prioritas yang dipilih pengguna pada 29 September 2026: **otomatisasi rapat—template, rapat lanjutan, dan bantuan AI**. Rekomendasi: **tuntaskan validasi MVP → template agenda → rapat lanjutan → AI dari teks dengan peninjauan manusia → transkripsi audio bila diperlukan**. Fitur cetak, pengingat dan laporan tetap dicatat sebagai pendukung. Asumsi akses satu tim dan WITA mengikuti aplikasi saat ini.

## 1. Kondisi yang menjadi dasar rencana

Penilaian ini berasal dari source dan catatan pemeriksaan yang tersedia hingga 24 September 2026, ditinjau pada 29 September. Tidak ada pengujian ulang aplikasi/database/browser dalam sesi perencanaan ini.

| Area | Sudah tersedia | Pekerjaan yang masih diperlukan |
|---|---|---|
| Notula | Draf, peserta, agenda, hasil, finalisasi atomik dan notula final tetap | Tutup pemeriksaan state form, waktu, dialog, hapus draf, dan responsif setelah perubahan tampilan terakhir |
| Tindak lanjut | TASK/PENDING_MATTER, PIC, jadwal, status, alasan perubahan, audit, filter, pagination dan soft delete | Lengkapi DB/E2E penghapusan dan QA tampilan riwayat; shortcut personal belum tersedia |
| Monitoring | Dashboard global, timeline mingguan, filter URL | Belum ada laporan periode/rekap PIC, ekspor, atau pengingat |
| Evidence | Storage privat, unggah/unduh, otorisasi, preview dan zoom | Viewer PDF/JPEG belum diperiksa di browser; run ulang suite setelah timeout login PIC pada follow-up |
| Pengguna | Login, admin membuat/mengelola akun, blokir role escalation | Ganti/reset kata sandi belum tersedia di aplikasi |
| Kesiapan | Scripts lint/typecheck/unit/build/DB/E2E/evidence/users tersedia | Matriks acceptance belum lengkap; UAT masih NOT_RUN; operasi produksi belum divalidasi |

Status teknis terakhir: MOM-001–003, MOM-007, MOM-010 DONE; MOM-004/005/006/008/009/011 IN_PROGRESS. Hasil PASS historis berlaku pada cakupan dan tanggalnya, bukan bukti seluruh perubahan terbaru lulus.

Dasar lokal: [progress](../TASK_PROGRESS.md), [spesifikasi](PRODUCT_SPEC.md), [checklist UAT](qa/MOM-009-UAT.md), [route](../src/app/router.tsx), [service action](../src/modules/actions/actionService.ts), [service dashboard](../src/modules/dashboard/dashboardService.ts), dan [scripts aktual](../package.json).

## 2. Tahap 0 — tutup pekerjaan MVP yang masih terbuka

Prioritas **P0**. Gunakan ID task lama; jangan membuat task pengganti yang menyebabkan dependensi saling menunggu. Kerjakan satu task per sesi dalam urutan di bawah. MOM-007 sudah DONE dan tidak perlu dibuka kembali tanpa temuan baru.

| Urutan / task | Lingkup penutupan | Bukti selesai yang diperlukan |
|---|---|---|
| 1. MOM-004 | State menyimpan/gagal/tersimpan; input waktu konsisten WITA pada zona browser lain; hapus draf dari daftar; layout draf/final terbaru | Uji input di WITA dan zona berbeda, gagal simpan mempertahankan input, konflik, owner/admin vs member, serta browser 1440/1024/390 |
| 2. MOM-005 | Dialog finalisasi dapat dipakai keyboard; verifikasi alur finalisasi setelah perubahan editor | Fokus awal, Tab/Shift+Tab, Escape dan fokus kembali; finalisasi data tersimpan, retry tidak menggandakan action; bukti rollback INSERT yang sudah PASS tetap menjadi regresi |
| 3. MOM-006 | Soft delete dan riwayat perubahan | Owner/admin dapat menghapus; PIC tanpa hak owner/admin ditolak; versi stale/null ditolak; retry tidak menambah audit; row dan audit tersimpan, detail/update/evidence ditolak setelah hapus; tracker/timeline/dashboard konsisten |
| 4. MOM-008 | State/kontrol dashboard dan keselarasan panduan UI | Loading/kosong/error/retry, kartu menuju filter yang tepat, nilai nol/CANCELLED/terhapus, teks panjang dan responsif; sinkronkan pedoman dengan tampilan yang disepakati |
| 5. MOM-011 | Viewer dan regresi evidence terbaru | Preview PDF/JPEG/PNG, zoom, Escape/fokus, gagal unduh/retry dan responsif; investigasi timeout login PIC, lalu Storage/RLS serta browser seluruh suite lulus |
| 6. MOM-009 | Regresi gabungan, instalasi bersih, matriks acceptance dan handoff | Semua gate teknis yang relevan PASS dengan tanggal/perintah/bukti; checklist UAT diperluas untuk users, soft delete dan evidence; UAT diisi oleh pengguna secara terpisah |

Temuan state/waktu/dialog dari [audit](qa/AUDIT-2026-09-22.md) harus direproduksi ulang sebelum diperbaiki; ini bukan klaim semuanya masih rusak. A01–A10 yang sudah ditutup tidak diperlakukan sebagai bug baru. Gap terbaru terutama tercatat pada [hapus task](qa/MOM-006-delete-actions-2026-09-24.md), [viewer](qa/MOM-011-evidence-viewer-2026-09-24.md), [follow-up evidence](qa/MOM-011-evidence-2026-09-24.md), [detail final](qa/MOM-004-meeting-detail-layout-2026-09-24.md), dan [form draf](qa/MOM-004-draft-form-layout-2026-09-24.md).

Aturan pelaksanaan: reset hanya database pengujian yang dipastikan terisolasi. Suite lama bergantung pada seed; siapkan lingkungan disposable, jangan reset database kerja yang berisi data pengguna. Semua fixture berlabel DATA DEMO. Bila lingkungan tidak tersedia, catat pemeriksaan BLOCKED/NOT_RUN dan lanjutkan bagian independen dalam task yang sama.

Penutupan teknis tiap task berdasarkan acceptance-nya. UAT pengguna tetap gate pemakaian/rilis dan tidak dapat digantikan oleh hasil tes otomatis. Jika UAT menemukan perubahan kebutuhan, catat task atau temuan spesifik.

## 3. Backlog fitur yang direkomendasikan

Semua ID berikut adalah **usulan task baru, belum dimulai**. Dependensi berarti task terkait harus DONE secara teknis sebelum implementasi dimulai. Nomor adalah identitas; urutan pelaksanaan mengikuti prioritas dan dependensi. Tidak ada perubahan aturan produk aktif hanya karena fitur muncul di dokumen ini.

Estimasi adalah perkiraan awal hari kerja satu pelaksana, termasuk pengujian relevan dan dokumentasi, tetapi belum termasuk waktu tunggu pengguna, akun, layanan email, atau deployment. Estimasi perlu ditinjau setelah Tahap 0; bukan janji tanggal selesai.

| ID | Prioritas | Fitur / hasil untuk pengguna | Dependensi DONE | Estimasi |
|---|---|---|---|---|
| MOM-012 | P2 | Cetak notula dan simpan PDF melalui dialog cetak browser | MOM-004/005/009/011 | 2–4 hari |
| MOM-013 | P2 | Tugas Saya dan pintasan deadline | MOM-006/008/009 | 1–2 hari |
| MOM-014 | P1 | Template agenda pribadi untuk rapat berulang | MOM-004/005/009 | 3–5 hari |
| MOM-015 | P1 | Ganti kata sandi dan pemulihan akun | MOM-003/009/010 | 3–5 hari |
| MOM-016 | P2 | Pengingat deadline di dalam aplikasi | MOM-006/009/013 | 4–7 hari |
| MOM-017 | P2 | Laporan tindak lanjut per periode/PIC dan ekspor CSV | MOM-006/008/009 | 4–6 hari |
| MOM-018 | P1 | Rapat lanjutan dengan referensi tindak lanjut lama | MOM-004/005/006/009 | 4–7 hari |
| MOM-019 | P2 | Ringkasan pengingat melalui email | MOM-015/016 | 3–5 hari |
| MOM-020 | P1 sebelum pemakaian bersama | Prosedur backup, pemulihan dan pemeriksaan operasi | MOM-002/009/010/011 | 3–5 hari |
| MOM-021 | P1 | AI menyusun saran draf dari teks catatan/transkrip | MOM-004/005/009/014/018 | 6–10 hari |
| MOM-022 | P2 setelah evaluasi AI | Transkripsi audio sebagai bahan draf AI | MOM-011/020/021 | 5–9 hari |

P1 mengikuti prioritas otomatisasi yang dipilih pengguna, ditambah kebutuhan akun dan operasi sebelum pemakaian bersama. P2 adalah perluasan berikutnya. MOM-020 dapat didahulukan ketika lingkungan pemakaian bersama mulai disiapkan. Dependensi MOM-021 pada template dan rapat lanjutan menjaga agar saran AI memakai struktur agenda dan referensi action yang sudah terdefinisi.

### MOM-012 — cetak notula

**Manfaat:** sekretaris dapat membagikan atau mengarsipkan notula dengan format rapi.

Lingkup awal: tampilan cetak A4 dari notula tersimpan, identitas rapat, peserta, agenda/pembahasan/hasil, serta kesepakatan PIC/jadwal. Draf diberi label DRAF yang jelas. Tindak lanjut terkini, bila ditampilkan, berada di bagian terpisah dengan waktu pengambilan data. Evidence ditampilkan sebagai daftar nama berkas; byte lampiran dan tautan akses privat tidak disisipkan.

Acceptance: owner/admin dapat mencetak drafnya; member lain ditolak juga saat membuka URL langsung. Notula final mengikuti akses baca yang ada. Preview cetak/PDF diuji untuk rapat tanpa action, teks panjang dan beberapa halaman tanpa konten terpotong. Isi cetak sama dengan data tersimpan, FINAL tidak berubah, dan sidebar/tombol editor tidak ikut tercetak. Jika form kotor, pengguna diarahkan menyimpan atau membatalkan perubahan dahulu. Fitur awal memakai dialog cetak browser; generator PDF/DOCX dengan format organisasi ditunda.

Dampak: komponen/tampilan cetak dalam modul meetings dan CSS cetak; tidak memerlukan tabel baru.

### MOM-013 — Tugas Saya

**Manfaat:** PIC langsung menemukan pekerjaan yang harus dikerjakan hari ini.

Lingkup: preset **Tugas Saya**, **Jatuh tempo hari ini**, **7 hari ke depan**, dan **Terlambat** pada tracker yang ada, beserta ringkasan personal. Definisi 7 hari mengikuti dashboard saat ini: hari ini sampai +7 hari, inklusif, dengan label rentang yang jelas. Halaman global tetap tersedia.

Acceptance: Tugas Saya memakai ID pengguna sesi; jumlah dan daftar mengikuti filter yang sama pada seluruh halaman, bukan 25 baris yang sedang tampil. Filter tersimpan di URL, reset berfungsi, dan klik membuka action asli. DONE/CANCELLED/terhapus tidak masuk hitungan aktif. Uji dua PIC, pergantian akun, tanggal WITA di tengah malam, serta tampilan tanpa pekerjaan. Preset ini mempermudah navigasi dan tidak mengubah visibilitas satu tim yang berlaku saat ini.

Dampak: service/query dan komponen actions/dashboard; tidak menyimpan salinan task atau menambah tabel task personal.

### MOM-014 — template agenda pribadi

**Manfaat:** rapat rutin dapat disiapkan tanpa mengetik struktur agenda dari awal.

Lingkup: simpan nama template, judul awal opsional, urutan agenda dan jenis item. Pengguna dapat membuat/mengedit/menghapus template miliknya dan membuat draf dari template. Template bersama tim menjadi perluasan terpisah.

Acceptance: hasil instansiasi selalu DRAFT milik pengguna dengan ID baru. Pembahasan, keputusan/hasil, peserta, PIC, jadwal, evidence dan status task lama tidak ikut disalin. Tanggal tetap null sampai diisi. Finalisasi tetap melalui validasi yang ada. Perubahan template tidak memengaruhi draf yang sudah dibuat; isolasi template dan write diuji di DB. Template bukan penjadwal rapat berulang otomatis.

Dampak: usulan tabel template dan item template di database yang sama, RLS owner, RPC dengan validasi/versi untuk edit, serta pilihan template dalam modul meetings.

### MOM-015 — ganti kata sandi dan pemulihan akun

**Manfaat:** anggota dapat mengganti password sementara dan memulihkan akses tanpa admin mengetahui password baru.

Lingkup: halaman akun untuk ganti password, permintaan pemulihan, serta halaman penerima tautan pemulihan. Gunakan Supabase Auth melalui service auth yang ada. URL tujuan pemulihan dan pengiriman email perlu dikonfigurasi; dokumentasi resminya menjelaskan alur tersebut. [Supabase Password-based Auth](https://supabase.com/docs/guides/auth/passwords).

Acceptance: alur sukses, password tidak valid, tautan kedaluwarsa/terpakai dan error pengiriman memiliki pesan jelas. Permintaan tidak mengungkap apakah email terdaftar. Tautan hanya menuju URL aplikasi yang diizinkan. Pengguna nonaktif tetap tidak dapat mengakses domain data. Password/token tidak masuk log, audit domain, atau penyimpanan frontend. Uji Auth sungguhan dan browser dengan penangkap email lokal; validasi email target dilakukan saat layanan target tersedia.

Dampak: routes/service auth, UI akun dan konfigurasi Auth. Verifikasi API terhadap versi lockfile sebelum implementasi; jangan mengandalkan API terbaru yang belum didukung versi terpasang.

### MOM-016 — pengingat dalam aplikasi

**Manfaat:** PIC mengetahui deadline tanpa memeriksa seluruh tracker.

Lingkup awal yang diusulkan: pengingat H-1, hari H dan satu ringkasan terlambat harian pada pukul 08.00 WITA; hanya bagi PIC aktif. Jadwal ini usulan yang dapat diubah sebelum implementasi. Pusat notifikasi memiliki baca/belum dibaca, pagination dan tautan ke action. Pengingat dibuat di server, sehingga tidak bergantung pada browser PIC yang sedang terbuka. Supabase Cron merupakan kandidat karena dapat menjalankan fungsi database terjadwal; ketersediaannya di lingkungan target harus diperiksa. [Supabase Cron](https://supabase.com/docs/guides/cron).

Acceptance: eksekusi ulang/paralel pada tanggal yang sama tidak menggandakan pengingat; kunci unik mencakup penerima, action, jenis dan tanggal WITA. Reassignment, perubahan deadline, DONE/CANCELLED, nonaktif dan soft delete diperiksa sebelum membuat maupun menyajikan pengingat. Notifikasi yang sudah tidak relevan tidak dihitung sebagai pekerjaan aktif. Penerima hanya bisa membaca/menandai notifikasinya sendiri. Uji batas hari, pemulihan job gagal dan keterlambatan job tanpa membanjiri notifikasi historis.

Dampak: tabel notifications, RLS penerima, RPC mark-read, fungsi pembangkit dan satu job terjadwal. Tidak perlu message broker atau event bus. Uji job terjadwal nyata wajib; trigger manual saja tidak membuktikan penjadwalan bekerja.

### MOM-017 — laporan periode/PIC dan CSV

**Manfaat:** pimpinan dapat meninjau beban tindak lanjut dan masalah terlambat dengan angka yang dapat ditelusuri.

Lingkup awal: laporan berdasarkan **deadline dalam rentang tanggal terpilih**, jenis action dan PIC; jumlah aktif/BLOCKED/DONE/CANCELLED, terlambat saat laporan dibuat, dan persentase selesai. Definisi selesai mengikuti produk: DONE dibagi semua selain CANCELLED, nol penyebut tampil “Belum ada tindak lanjut”. Baris terhapus dikecualikan. Rekap memakai PIC terkini dan status terkini; periode bukan rekonstruksi keadaan historis.

Acceptance: semua tanggal inklusif/WITA; agregat cocok dengan daftar rinci pada filter yang sama, termasuk >1.000 record. Nol data, semua CANCELLED, DONE yang dibuka kembali dan pergantian PIC tidak menyesatkan. CSV mencakup seluruh hasil berotorisasi, bukan halaman aktif saja; nama, status, tanggal dan nilai null konsisten; teks yang dapat dianggap formula spreadsheet dinetralkan. Tampilkan filter dan waktu pembuatan. Jika data berubah selama ekspor, gunakan snapshot server atau hentikan/minta ulang secara jelas agar berkas tidak diam-diam tercampur.

Dampak: query agregasi/RPC berotorisasi, tampilan laporan dan ekspor. Tidak perlu tabel salinan metrik. Tren historis, skor produktivitas dan persentase ketepatan waktu ditunda sampai aturan deadline baseline, reopen dan perubahan PIC ditetapkan.

### MOM-018 — rapat lanjutan

**Manfaat:** rapat berikutnya membahas action terbuka tanpa membuat task ganda.

Lingkup: buat draf rapat lanjutan yang terhubung ke notula final asal; pilih action lama sebagai referensi pembahasan. Tampilkan status, PIC, deadline dan catatan terakhir sebagai konteks saat ini. Referensi action dibedakan dari item TASK/PENDING_MATTER baru. Tanggal rapat baru tetap perlu diisi; pembuatan rapat berkala tanpa interaksi pengguna belum termasuk.

Acceptance: action yang direferensikan mempertahankan ID, PIC, jadwal, audit dan evidence aslinya. Finalisasi rapat lanjutan hanya membuat action dari item baru; dua rapat yang membahas satu pekerjaan tetap merujuk satu action. Constraint `source_item_id UNIQUE` saja tidak cukup jika task lama disalin menjadi item ber-ID baru, sehingga referensi harus memakai relasi khusus. Isi/version/finalized_at notula sumber tetap utuh. Simpan konteks pembahasan pada rapat lanjutan sebagai snapshot yang dibedakan dari status action terkini.

Referensi lintas rapat bisa dibuka sesuai otorisasi, tidak membocorkan draf, dan menampilkan keadaan tidak tersedia jika action kemudian dihapus. Pembaruan action lama tetap melalui RPC/version/alasan yang berlaku; menautkan ke rapat baru tidak memberi hak edit baru. Pembuatan draf lanjutan memakai kunci idempotensi server agar klik ganda/retry setelah respons hilang mengembalikan draf yang sama. Uji pembuatan/finalisasi ulang, dua sesi dan request akses langsung.

Dampak: relasi rapat asal dan tabel penghubung pembahasan–action, migration/RLS serta penyesuaian validasi finalisasi. Kontrak detail diselesaikan sebelum coding karena menyentuh invariant satu item sumber–satu action.

### MOM-019 — ringkasan email

**Manfaat:** pengingat dapat diterima PIC tanpa membuka aplikasi.

Lingkup: preferensi menerima ringkasan, maksimal satu ringkasan harian per penerima, tautan kembali ke aplikasi, serta catatan pengiriman/gagal. Email tidak menyertakan isi pembahasan atau evidence privat. Penyedia email, alamat pengirim dan lingkungan uji ditentukan sebelum mengaktifkan pengiriman nyata.

Acceptance: retry memakai identitas pengiriman tetap dan deduplikasi penyedia bila tersedia; kegagalan/hasil kirim tidak pasti ditangani tanpa mengklaim jaminan exactly-once. Penerima nonaktif atau yang menolak pengingat tidak dikirim. Hak akses dan relevansi dicek lagi sebelum pengiriman, bukan hanya ketika antrian dibuat. Uji dengan mailbox/sandbox uji, batas retry, rate limit, dan unsubscribe/preferensi. Tidak mengirim email ke anggota nyata dalam sesi perencanaan.

Dampak: preferensi pengguna dan delivery log/outbox sederhana dalam database yang sama, worker server/Edge Function dan secret server. WhatsApp serta kalender dua arah berada di kandidat berikutnya.

### MOM-020 — backup dan pemulihan operasional

**Manfaat:** notula, tindak lanjut, akun dan evidence dapat dipulihkan ketika terjadi kesalahan operasi.

Lingkup: runbook backup database, salinan byte Storage privat, inventaris object key/checksum, konfigurasi Auth/Edge Function yang perlu dipulihkan dan prosedur restore ke lingkungan terisolasi. Target frekuensi/retensi/waktu pemulihan ditetapkan bersama operator sebelum aktivasi. Backup database Supabase tidak mencakup byte objek Storage, sehingga evidence perlu prosedur terpisah. [Supabase Database Backups](https://supabase.com/docs/guides/platform/backups).

Acceptance: demonstrasi restore DATA DEMO membuktikan login, notula, relasi action, audit, file evidence beserta checksum dan otorisasinya berfungsi. Catat durasi serta selisih data yang dapat hilang, pemilik operasi dan prosedur rollback migration/deployment. Secret tetap dikelola di lingkungan server, bukan dimasukkan ke dokumen. Tetapkan penanganan file yatim dari draf/task yang dihapus; pembersihan fisik bukan perubahan otomatis ke kebijakan append-only.

Dampak: scripts operator dan dokumen operasi; tambahan monitoring terbatas pada error/job gagal tanpa isi rapat. Ini prasyarat kesiapan pemakaian bersama, bukan izin deployment publik.

### MOM-021 — bantuan AI menyusun draf dari teks

**Manfaat:** operator mengubah catatan mentah atau transkrip yang sudah dimiliki menjadi saran agenda, pembahasan, keputusan dan tindak lanjut yang bisa ditinjau.

Alur: **pilih draf tersimpan atau buat dan simpan draf awal → tempel teks sumber → analisis → tinjau setiap saran beserta kutipan sumber → terapkan pilihan ke draf → simpan → finalisasi melalui alur biasa**. Draf tersimpan menyediakan ID/versi dan target otorisasi yang tetap. Awali dengan input teks agar manfaat ekstraksi dapat dievaluasi tanpa ketergantungan rekaman/transkripsi. Penerapan hasil hanya oleh owner draf/admin; pengguna dapat menolak atau mengedit setiap saran.

Kontrak lingkup dan acceptance:

1. Setiap saran menyertakan jenis NOTE/DECISION/TASK/PENDING_MATTER, teks usulan dan kutipan/posisi sumber yang dapat diperiksa. Validasi server memastikan kutipan memang terdapat dalam sumber. Teks sumber diperlakukan sebagai data, termasuk jika berisi instruksi untuk mengubah aturan aplikasi.
2. AI tidak mengarang peserta, PIC, tanggal atau kesimpulan yang tidak didukung sumber. Nilai yang belum jelas tetap null dan ditandai **Perlu ditinjau**. Nama calon PIC dipetakan hanya ke daftar anggota aktif yang boleh diakses, lalu dipilih/dikonfirmasi pengguna. Tanggal relatif ditawarkan dengan dasar waktu rapat/WITA; bila acuannya tidak jelas, tetap null. Tidak ada deadline default diam-diam.
3. Pisahkan **referensi action lama** dari **usulan action baru**. Tawarkan kandidat kecocokan yang dapat dibuka; keputusan tetap pada pengguna. Model tidak membuat atau mengubah row actions. Hanya finalisasi notula melalui RPC yang ada yang dapat membuat action baru.
4. Tombol Terapkan memperbarui isi editor draf dan menandainya belum disimpan; versi server tidak ditimpa otomatis. Setiap saran memiliki ID penerapan agar klik ganda/retry tidak menambahkan item dua kali. Simpan tetap melalui RPC dengan expected version; konflik mempertahankan masukan dan meminta muat ulang/rekonsiliasi. Catat provenance ringkas pada item yang disimpan: sumber analisis, pengguna penerima dan waktu, tanpa mencatat secret atau isi rapat di log teknis.
5. Analisis gagal, timeout, kuota habis, keluaran bukan struktur valid, atau pembatalan tidak menghapus teks sumber maupun isi draf. Hasil analisis yang berasal dari versi/input lama ditandai kedaluwarsa dan tidak menimpa edit terbaru. FINAL tetap baca-saja; AI hanya boleh membantu draf baru/lanjutan.
6. Endpoint server memeriksa sesi, keaktifan, owner/admin dan akses sumber sebelum memanggil penyedia AI maupun mengembalikan hasil. Secret hanya di server. Batasi panjang input, frekuensi, anggaran pemakaian dan retensi; tampilkan penjelasan data apa yang dikirim sebelum tombol analisis dijalankan. Jangan mengirim semua evidence atau notula lain otomatis.
7. Evaluasi dengan korpus DATA DEMO beranotasi: keputusan tanpa task, tugas tanpa PIC/tanggal, nama ambigu, waktu relatif, pembahasan bertentangan, pending matter, action lama, instruksi berbahaya di sumber dan keluaran invalid. Acceptance kritis: tidak ada write tanpa tinjauan, tidak ada action ganda akibat retry, nilai tak pasti tidak terisi otomatis, dan semua skenario otorisasi lulus. Ukur ketepatan klasifikasi serta persentase saran yang diterima/diedit/ditolak; ambang kualitas disepakati sebelum pilot, bukan mengklaim AI selalu benar.

Dampak: service AI server/Edge Function atau worker sesuai durasi request, adapter satu penyedia, schema output tervalidasi, UI perbandingan sumber–saran, serta penyimpanan analisis/provenance terbatas dengan RLS dan retensi. Tidak perlu sistem multi-agent atau framework plugin di dalam produk. Penyedia/model, batas biaya, kebijakan pemrosesan/retensi dan ukuran input belum dipilih; lakukan uji DATA DEMO sebelum memakai isi rapat nyata. Pilihan ini tidak menghalangi implementasi template dan rapat lanjutan.

### MOM-022 — transkripsi audio

**Manfaat:** rekaman yang memang boleh diproses menjadi transkrip yang dapat dikoreksi dan dipakai sebagai sumber MOM-021.

Lingkup: unggah audio secara eksplisit, tampilkan status antrian/proses/gagal/selesai, hasil transkrip bertanda waktu dan editor koreksi. Pengguna meninjau transkrip sebelum meminta saran notula. Tidak termasuk perekaman diam-diam, bot bergabung ke rapat, atau identifikasi orang dari suara.

Acceptance: akses audio/transkrip mengikuti draf dan owner/admin; pengguna nonaktif ditolak. Batas format/ukuran/durasi diumumkan dan ditegakkan server. Retry tidak membuat job/file ganda; proses lama dapat dibatalkan dan tidak merusak draf. Potongan audio yang tidak jelas diberi penanda, identitas pembicara memakai label netral sampai dikonfirmasi pengguna. Uji noise, beberapa pembicara, istilah Indonesia, audio panjang, gagal provider dan timeout dengan data uji yang boleh dipakai. Penghapusan/retensi audio dan transkrip diuji terhadap kebijakan yang disepakati.

Dampak: penyimpanan audio privat dan job server dengan retensi tersendiri; jangan langsung menambah format audio pada bucket evidence append-only. Pilih dukungan durasi/job setelah provider dan batas lingkungan diperiksa. Ukur biaya serta waktu transkripsi dan akurasi pada korpus uji sebelum pilot; dukungan diarization/nama pembicara otomatis bukan syarat rilis awal.

## 4. Paket pelaksanaan yang disarankan

| Paket | Urutan | Hasil yang ditinjau pengguna |
|---|---|---|
| A. MVP tervalidasi | MOM-004 → 005 → 006 → 008 → 011 → 009 | Alur rapat sampai penyelesaian terbukti bekerja; UAT dan temuan tercatat |
| B. Otomatisasi rapat terstruktur | MOM-014 → 018 | Template dan rapat lanjutan tanpa task ganda; perkiraan 7–12 hari kerja setelah dependensi siap |
| C. Asisten penyusunan draf | MOM-021 | Saran AI dari teks, kutipan sumber dan tinjauan per item; perkiraan 6–10 hari di luar pemilihan/akses penyedia |
| D. Akun dan kesiapan bersama | MOM-015 → 020; didahulukan sebelum pilot bersama | Pemulihan akun dan demonstrasi restore; perkiraan 6–10 hari di luar tunggu layanan |
| E. Audio bila dibutuhkan | MOM-022 setelah C/D dan evaluasi DATA DEMO | Transkrip yang dapat dikoreksi; perkiraan 5–9 hari |
| F. Pendukung harian | MOM-012 → 013 → 016 → 017 → 019, dipilih sesuai kebutuhan | Cetak, Tugas Saya, pengingat dan laporan; estimasi per task pada backlog |

Paket adalah pengelompokan hasil, bukan instruksi menjalankan banyak task dalam satu sesi. Paket A belum diberi estimasi tanggal karena temuan perlu direproduksi dan lingkungan uji dipastikan terlebih dahulu. Paket B adalah rilis fitur pertama sesuai pilihan pengguna; paket C menambah AI sesudah struktur datanya jelas. Perkiraan B+C adalah **13–22 hari kerja** setelah fondasi siap, belum termasuk waktu tunggu penyedia/UAT. Pemakaian bersama memerlukan kesiapan D dan UAT terkait.

Ukuran keberhasilan utama: waktu menyiapkan notula dari template/teks, persentase saran AI yang diterima/diedit/ditolak, jumlah action ganda saat rapat lanjutan, dan kelengkapan PIC/jadwal saat finalisasi. Ukur baseline saat UAT/pilot menggunakan data yang disepakati; belum ada angka peningkatan aktual atau target persentase yang tervalidasi. Metrik pendukung: keberhasilan restore, kecocokan laporan dan jumlah pengingat duplikat.

## 5. Kandidat yang ditunda

| Kandidat | Alasan ditunda / syarat sebelum dirinci |
|---|---|
| Prioritas task, label dan filter tersimpan | Uji dahulu apakah filter/preset yang ada cukup; tetapkan siapa boleh mengubah prioritas dan auditnya |
| Koreksi resmi notula final | Perlu desain addendum/revisi yang mempertahankan dokumen lama, penomoran dan jejak action; jangan membuka edit final langsung |
| Proyek/unit kerja dan rapat berulang otomatis | Perlu definisi pengelompokan, pemilik, hak akses dan aturan membuat jadwal tanpa duplikasi |
| Kalender eksternal / WhatsApp | Perlu akun/integrasi, aturan persetujuan penerima, kegagalan sinkronisasi, dan biaya; mulai dari ekspor kalender satu arah bila kebutuhan terbukti |
| AI realtime / bot rapat / finalisasi otomatis | AI dari teks sudah diprioritaskan pada MOM-021 dan audio pada MOM-022; otomatisasi realtime dan keputusan tanpa tinjauan manusia di luar rencana awal |
| Multi-organisasi, approval berjenjang, Gantt dependensi, chat | Mengubah model akses atau memperlebar produk; rancang terpisah setelah kebutuhan nyata tersedia |

## 6. Batas teknis dan aturan penerimaan

- Pertahankan satu aplikasi React/TypeScript, satu database Supabase, modul meetings dan actions terpisah. Laporan/notifikasi merujuk ID asli, tidak membentuk tracker kedua.
- Gunakan service/query modul; semua mutasi baru memiliki validasi, otorisasi server, audit yang relevan dan pengaman konflik/idempotensi sesuai operasi. Migration baru untuk perubahan schema; jangan mengubah migration yang sudah diterapkan.
- Waktu kejadian UTC; tanggal kerja DATE dan WITA. Draf privat, final terbaca anggota aktif sesuai kontrak satu tim; fitur baru tidak memperluas akses tanpa desain eksplisit.
- Setiap task UI memerlukan browser nyata, state loading/kosong/gagal/sukses/konflik yang relevan, keyboard, serta viewport 1440/1024/390. Pemeriksaan cetak menambah QA A4/multi-halaman.
- Aturan bisnis diuji unit; hak akses/transaksi diuji DB/RPC nyata; evidence memakai Storage nyata. Mock tidak menggantikan integrasi.
- Script yang tersedia sekarang: `npm run lint`, `npm run typecheck`, `npm run test`, `npm run build`, `npm run test:db`, `npm run test:e2e`, `npm run test:evidence`, `npm run test:users`. Jalankan sesuai dampak dan prasyaratnya. Script fitur baru baru boleh disebut tersedia setelah dibuat.
- Catat tanggal, perintah, hasil dan bukti pada progress/QA. Fitur baru harus memenuhi acceptance dan dokumen produk/UI diperbarui saat implementasi. Rilis/pemakaian memerlukan UAT pengguna; deployment adalah task terpisah.

Langkah implementasi berikutnya yang direkomendasikan: **lanjutkan MOM-004**, dengan sasaran penutupan state form, perilaku waktu WITA, penghapusan draf dan QA responsif terbaru. Dependensinya MOM-003 sudah DONE. Setelah fondasi tervalidasi, mulai fitur baru dari **MOM-014 template agenda**, kemudian **MOM-018 rapat lanjutan** dan **MOM-021 bantuan AI**.
