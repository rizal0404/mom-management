# Panduan UI/UX

## Evidence — 24 September 2026

Follow-up komentar pengguna: tombol awal **Pilih file evidence** harus aktif dan membuka pemilih berkas. Sesudah file valid dipilih, label berubah menjadi **Unggah evidence** dan petunjuk menampilkan nama file siap unggah. Tombol hanya dinonaktifkan saat proses berlangsung, dengan tampilan redup.

Panel **Evidence rapat** ada di detail draf/final; **Bukti penyelesaian tindak lanjut** ada di detail action. Panel memakai tema hijau-lime existing, file picker berlabel, batas format/ukuran, tombol Unggah, daftar pengunggah/waktu WITA/ukuran dan Unduh. Unggah tidak mengirim formulir induk. Tampilkan loading, kosong, sukses, error/retry, dan pagination. Detail task beralih satu kolom pada <=1100 px agar panel lampiran dan form tidak terjepit. File yang dipilih belum tersimpan sampai tombol Unggah berhasil.

## Arah visual

Dua gambar pengguna adalah referensi tampilan: sidebar abu-abu terang, panel utama putih, kartu sudut membulat, border tipis, bayangan lembut, aksen biru/hijau/oranye/ungu, tabel rapi dan timeline horizontal. Bukan instruksi menyalin nama Trackline, logo, watermark, data, atau semua menu contoh.

Referensi lokal: [gambar kiri](references/ui-reference-left.jpg) dan [gambar kanan](references/ui-reference-right.jpg). Gambar untuk acuan saja, bukan background antarmuka atau aset distribusi aplikasi.

## Layout

- Desktop: sidebar 240 px; logo teks sementara "MOM Tracker"; menu Dashboard, Rapat, Tindak Lanjut; profil/logout di bawah. Header berisi judul halaman dan satu tindakan utama.
- Konten padding 24 px; dashboard empat kartu ringkasan → timeline pekan → tabel tindak lanjut mendesak dan rapat terbaru. Jangan menaruh grafik tanpa informasi yang dibutuhkan operator.
- Halaman rapat: tabel Judul / Tanggal / Pimpinan / Status / Jumlah tindak lanjut; tombol "Buat Rapat". Form bertahap dalam satu halaman: informasi rapat → peserta → agenda/hasil → tindak lanjut → Simpan draf/Finalisasi.
- Tracker: tab Tabel/Timeline; toolbar cari/filter; tabel Jenis / Tindak lanjut / Rapat / PIC / Mulai / Deadline / Status. Drawer/detail memuat catatan perkembangan, perubahan terakhir, dan tombol "Simpan pembaruan".
- Tablet: sidebar dapat diciutkan; ringkasan dua kolom. Ponsel: sidebar drawer, ringkasan satu kolom, tabel menjadi kartu, timeline menjadi agenda per tanggal. Tindakan utama tetap mudah dijangkau.

## Token awal (referensi historis)

Nilai di bawah adalah titik awal sebelum penyesuaian Material Design 3 pada 22–24 September 2026. Untuk implementasi aktif, gunakan token CSS yang berlaku berikut; jangan memadukan palet awal dengan komponen baru tanpa keputusan desain.

| Token aktif | Nilai dalam `src/index.css` |
|---|---|
| Canvas / sidebar / surface | `#F7FAEF` / `#EEF5DF` / `#FCFDF7` |
| Teks utama / sekunder / border | `#1B2118` / `#596451` / `#DCE6CF` |
| Primary / primary soft | `#39750D` / `#E4F5CE` |
| Radius kartu / kontrol | 28 px / 12 px |

Detail notula dan form draf boleh memakai kartu putih dengan aksen biru/navy lokal sesuai bagian detail terbaru di bawah; shell dan tracker mempertahankan token hijau-lime aktif.

| Token | Nilai awal |
|---|---|
| Canvas / sidebar / surface | `#F6F8FB` / `#F1F2F4` / `#FFFFFF` |
| Teks utama / sekunder | `#1F2937` / `#5B6472` |
| Border | `#E4E7EC` |
| Primary | `#2563EB` |
| Status biru | teks `#1D4ED8`, latar `#EFF6FF` |
| Status hijau | teks `#047857`, latar `#ECFDF5` |
| Status oranye | teks `#9A3412`, latar `#FFF7ED` |
| Terlambat/error | teks `#B91C1C`, latar `#FEF2F2` |
| Ungu untuk pending matter | teks `#6D28D9`, latar `#F5F3FF` |
| Radius / bayangan | kartu 16 px, input/tombol 10 px; `0 2px 8px #1018280A` |
| Spacing | 4, 8, 12, 16, 24, 32 px |
| Tipografi | system sans-serif; isi 14–16 px; judul halaman 24 px; label 12–14 px |

Status OPEN netral, IN_PROGRESS biru, BLOCKED oranye, DONE hijau, CANCELLED abu-abu. Jenis pending matter memakai badge ungu terpisah dari status. Avatar inisial cukup; tidak perlu foto profil atau gambar stok.

## Perilaku yang wajib konsisten

- Label Indonesia: "Notula", "Tindak lanjut", "Pending matter", "PIC", "Deadline"; jelaskan pending matter dengan bantuan teks "Masalah yang belum terselesaikan".
- Tanggal layar contoh `21 Sep 2026`; jam `09.00 WITA`. Form memakai input tanggal yang mudah dipakai; jangan menafsirkan DATE sebagai UTC lalu menggeser hari.
- Ringkasan dapat diklik untuk memfilter; klik bar timeline/baris tabel membuka action yang sama. Tidak ada drag-and-drop pada MVP.
- Finalisasi menampilkan ringkasan jumlah task/pending matter dan konsekuensi notula menjadi tetap; user mengonfirmasi sekali. Form invalid fokus pada field pertama yang salah.
- Loading skeleton, empty state dengan tindakan yang relevan, error dengan Coba lagi, dan sukses singkat. Simpan gagal mempertahankan input. Jika hasil write tidak pasti akibat timeout, baca ulang versi/status sebelum retry.
- Kontras teks normal minimal 4.5:1; jangan mengandalkan warna saja. Focus ring terlihat, label input eksplisit, target sentuh sekitar 44 px, dialog/drawer mendukung Escape dan pengembalian fokus.

## Bukti visual sebelum DONE

Screenshot 1440, 1024, dan 390 px untuk dashboard, form notula, serta tracker; periksa overflow, teks panjang, empty/error state, badge, dan tombol. Cek detail/drawer dan timeline di browser nyata. Simpan hasil pada `docs/qa/` saat implementasi, jangan membuat klaim pemeriksaan dari desain atau source saja.

## Penyesuaian layout tracker — 24 September 2026

Referensi tambahan pengguna diterapkan pada layout `/actions` dengan tema M3 hijau-lime existing. Tab Timeline menampilkan panel timeline kemudian daftar task; tab Tabel berfokus pada daftar. Filter bersama tersedia melalui disclosure di toolbar. Daftar lintas pekan diberi keterangan, sementara timeline tetap dibatasi pekan. Panel timeline menggunakan grid harian, bar ringkas dengan PIC inisial dan area scroll; tabel/kartu tidak menambah persentase progres, lampiran, atau data contoh dari gambar. Ponsel tetap memakai agenda dan kartu.

### Follow-up layout tracker — 24 September 2026

Komentar pengguna meminta penghapusan panel Daftar task dari Timeline karena sudah ada tab Tabel. Panel daftar (termasuk pagination daftar) kini eksklusif di tab Tabel; Timeline hanya menampilkan jadwal mingguan dan navigasi halaman timeline. Pemeriksaan browser kedua tab dan typecheck PASS. Screenshot final 1440/390 ada di `docs/qa/MOM-008-layout-comment1-*`.

## Penghapusan notula draf dan task — 24 September 2026

Baris notula DRAFT menampilkan tombol hapus untuk owner/admin dengan konfirmasi; final tidak menampilkan tombol dan tidak dapat dihapus. Tabel tracker, kartu ponsel, dan detail menyediakan tombol hapus task kepada owner/admin. Task dihapus secara lunak: hilang dari tracker, timeline, dashboard, serta detail; data dan riwayat audit tetap ada. Migration memperkuat aturan akses di RPC, memakai expected version, dan membuat retry idempoten. Penghapusan draf memakai RPC yang telah membatasi status pada DRAFT.

## Riwayat perubahan tindak lanjut — 24 September 2026

Di detail tindak lanjut, tampilkan aktor, waktu, dan catatan, lalu rincian nilai dalam daftar per field dengan label Indonesia serta nilai Sebelum dan Sesudah. Jangan menampilkan objek audit sebagai JSON mentah. Sembunyikan field yang nilainya tidak berubah dan jelaskan bila tidak ada perubahan field; nilai kosong ditulis “Kosong”. Nama PIC/status dan tanggal ditampilkan dalam format yang mudah dibaca. Baris panjang harus membungkus teks tanpa overflow.

## Viewer evidence — 24 September 2026

Pada daftar evidence, PDF/JPG/JPEG/PNG menyediakan aksi **Lihat** di samping **Unduh**. Viewer terbuka di modal dengan nama file, status memuat/gagal, tutup yang jelas, dan kontrol zoom keluar/masuk serta kembali ke 100%. Modal mendukung Escape dan klik backdrop; viewer memakai byte yang diperoleh lewat sesi terautentikasi. WebP, DOCX, dan XLSX tetap hanya menyediakan unduh. Pada ponsel, toolbar boleh membungkus tanpa membuat halaman melebar.

## Cetak notula — MOM-012

Detail DRAFT tersimpan dan FINAL menyediakan tombol **Cetak / Simpan PDF** di header. Tombol membuka dialog cetak browser; pemilihan printer atau **Save as PDF** tetap dilakukan oleh pengguna. Gunakan lembar A4 dengan metadata rapat, peserta, agenda berurutan, pembahasan, hasil, dan kesepakatan PIC/jadwal yang diambil dari data tersimpan. Label **DRAF** selalu terlihat pada cetakan draf. Tindak lanjut terkini tidak dicampurkan ke kesepakatan.

Saat form draf kotor, arahkan pengguna untuk menyimpan atau membatalkan perubahan sebelum mencetak; sediakan aksi batalkan perubahan yang memulihkan snapshot tersimpan. Pintasan cetak browser hanya menampilkan pesan pengarah dan tidak menampilkan perubahan yang belum tersimpan. Hasil cetak meniadakan shell navigasi, editor, dialog, tombol, dan kontrol evidence. Jangan menyertakan byte atau tautan lampiran privat. Pastikan judul, URL/lokasi, nama, dan teks agenda panjang membungkus serta dapat mengalir ke beberapa halaman tanpa pemotongan; uji preview A4 untuk tanpa action dan rapat panjang.

## Template agenda pribadi — MOM-014

- Halaman **Template agenda** dibuka dari halaman Rapat dan menampilkan daftar pribadi, editor template, serta tombol **Gunakan template**. Beri nama, judul awal opsional, urutan agenda, dan jenis item; jangan tampilkan field peserta, pembahasan, hasil, PIC, tanggal, lampiran, atau status.
- Tampilkan jumlah/urutan agenda dan jelaskan bahwa TASK/Pending matter pada template tidak membawa PIC atau tanggal. Jika judul awal kosong, beri tahu pengguna bahwa nama template menjadi judul draf awal.
- Beri aksi Simpan, Batalkan perubahan, Edit, Hapus dengan konfirmasi, dan Gunakan template. Gunakan validasi/input yang eksplisit; saat versi berubah, pertahankan masukan dan tawarkan muat ulang. Status loading, kosong, gagal/retry, menyimpan, tersimpan, dan konflik harus terlihat.
- Setelah dipakai, arahkan ke editor DRAFT baru dan tampilkan hanya struktur agenda serta judul awal/nama template. Field rapat lainnya kosong. Finalisasi mengikuti dialog dan validasi notula yang sudah ada.
- Layout desktop memakai panel daftar dan editor yang bersebelahan; di layar sempit susun vertikal tanpa overflow. Semua aksi dapat dipakai dengan keyboard dan focus ring terlihat.

## Detail notula FINAL — 24 September 2026

Susun detail FINAL sebagai halaman dokumen: breadcrumb, judul dan badge final, ringkasan waktu/pimpinan/lokasi, peserta ber-avatar inisial, lalu agenda bernomor dengan pembahasan, hasil, dan baris PIC/jadwal bila item dapat ditindaklanjuti. Panel evidence mempertahankan kontrol unggah/lihat/unduh yang sudah berfungsi. Akhiri dengan keterangan notula tetap dan tautan tracker yang memfilter rapat asal. Jangan tampilkan kontrol editor draf atau tombol ekspor/dropzone yang belum tersedia. Tunggu data detail selesai dimuat sebelum memilih cabang FINAL atau DRAFT; tampilkan keadaan memuat dan gagal yang jelas.

Kartu dan aksen biru/navy berlaku lokal di detail, sementara shell aplikasi mempertahankan tema global. Turunkan ringkasan menjadi satu kolom di bawah 760 px, susun pembahasan/hasil dan PIC/jadwal secara vertikal di ponsel, dan izinkan judul/nama panjang membungkus tanpa overflow. Catat ukuran viewport yang benar-benar diperiksa; jangan menyamakan lintas ukuran yang belum diuji dengan browser PASS.

### Form DRAFT — 24 September 2026

Halaman buat/edit DRAFT mengikuti hierarki detail: breadcrumb, judul dan status Draf untuk record tersimpan, lalu kartu Informasi Rapat, Peserta Rapat, dan Agenda & Hasil Rapat. Informasi memakai grid dua kolom di layar lebar; judul/lokasi penuh lebar. Peserta memakai baris nama dengan inisial dan aksi hapus; agenda memakai nomor, pilihan jenis, pembahasan, dan hasil. PIC/mulai/jatuh tempo hanya muncul untuk TASK/PENDING_MATTER. Simpan, finalisasi, hapus, indikator status, validasi, dan evidence harus tetap berfungsi melalui service/RPC yang ada. Pada ponsel, form dan action bar menumpuk tanpa overflow; jangan mengubah nilai tanggal kosong atau aturan penyimpanan demi tampilan.

## Akun dan pemulihan kata sandi — MOM-015

- Login menyediakan tautan **Lupa kata sandi?** menuju halaman permintaan pemulihan. Halaman meminta email, menampilkan status mengirim, pesan sukses generik yang tidak memastikan akun ada, serta error pengiriman dengan opsi mencoba lagi.
- Area akun menyediakan **Akun dan kata sandi**. Form perubahan memiliki label kata sandi baru dan konfirmasi, validasi yang jelas, indikator proses, sukses/error, dan tidak menampilkan kembali nilai sandi setelah berhasil.
- Callback `/account/password` hanya menampilkan form dengan sesi Auth dan profil aktif. Saat sesi tidak ada, tampilkan pesan bahwa tautan invalid/kedaluwarsa/terpakai dan tautan untuk meminta ulang. Akun nonaktif mendapat keterangan untuk menghubungi administrator tanpa melihat data domain.
- Gunakan `autocomplete="new-password"`, target sentuh minimal 44 px, fokus keyboard yang jelas, serta layout kartu yang sama dengan halaman login. Jangan mencetak, menyalin ke URL, atau menyimpan token/kata sandi ke log atau penyimpanan aplikasi.
