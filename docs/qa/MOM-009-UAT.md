# Checklist UAT MOM-009 — menunggu pengguna

Status: **NOT_RUN**. Jalankan dengan akun uji dan data berlabel DATA DEMO pada lingkungan yang disepakati. Isi hasil, tanggal, penguji, bukti, dan catatan pada tiap baris; jangan mencatat password atau isi rapat nyata di dokumen ini. Tidak ada persetujuan rilis otomatis dari gate teknis.

| ID | Langkah pengguna | Hasil yang diharapkan | Hasil aktual / bukti | Status |
|---|---|---|---|---|
| UAT-01 | Login A, buat notula dengan peserta, keputusan, task untuk B, pending matter untuk A; simpan, reload | Draf bertahan dan belum terlihat oleh B | — | NOT_RUN |
| UAT-02 | A finalisasi setelah meninjau PIC dan jadwal | Final tetap, keputusan tanpa action, tepat dua action muncul | — | NOT_RUN |
| UAT-03 | B buka notula final, perbarui task miliknya sampai DONE dengan resolusi; A refresh | Notula terlihat, status dan riwayat sama pada kedua akun | — | NOT_RUN |
| UAT-04 | B coba ubah deadline task/pending matter milik A | Hak edit ditolak, data tidak berubah | — | NOT_RUN |
| UAT-05 | A menutup pending matter dengan catatan resolusi | Dashboard, tracker dan timeline konsisten | — | NOT_RUN |
| UAT-06 | Uji mobile/keyboard, gagal jaringan, konflik edit bersamaan dan logout/direct URL | Pesan jelas, data tidak tertimpa dan akses privat tetap terlindungi | — | NOT_RUN |
| UAT-07 | ADMIN membuat akun DATA DEMO baru, mengubah peran/statusnya, lalu akun nonaktif mencoba membuka aplikasi | Perubahan tercatat; anggota tidak mendapat kontrol ADMIN; akun nonaktif ditolak | — | NOT_RUN |
| UAT-08 | Owner menghapus draf dari daftar; anggota lain membuka URL draf tersebut | Draf hilang dari daftar dan tidak dapat dibuka; draf lain tetap utuh | — | NOT_RUN |
| UAT-09 | Owner menghapus satu task dengan PIC berbeda; PIC membuka ulang detail, tracker, timeline, dan dashboard | Task terhapus tidak terlihat atau dapat diubah; action lain dan notula final tetap tersedia | — | NOT_RUN |
| UAT-10 | Unggah evidence DATA DEMO PDF/JPEG/PNG ke draf dan task, lalu pratinjau, zoom, tutup dengan Escape, serta coba unduh ulang setelah gagal jaringan | Hanya pengguna berhak dapat melihat/mengunggah; pratinjau dan retry bekerja; fokus kembali ke tombol pembuka | — | NOT_RUN |
| UAT-11 | Uji simpan draf pada browser dengan zona UTC dan WITA, lalu buka ulang; sengaja gagalkan simpan sekali | Jam rapat sama dalam WITA; input gagal tetap ada dan dapat disimpan ulang | — | NOT_RUN |

Keputusan pengguna: **belum diberikan**. Penguji/tanggal: **belum diisi**. Temuan dan tindakan lanjutan: **belum diisi**. Rilis baru dapat dipertimbangkan setelah temuan teknis ditutup dan pengguna menyatakan hasil UAT sesuai kebutuhan.
