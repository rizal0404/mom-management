# MOM-011 — Viewer evidence

Tanggal: 24 September 2026  
Lingkup: modal pratinjau PDF/JPG/JPEG/PNG dengan kontrol zoom pada evidence rapat dan tindak lanjut.

## Implementasi

- Tombol **Lihat** muncul untuk PDF, PNG, JPG, dan JPEG; format WebP, DOCX, dan XLSX tetap menyediakan **Unduh**.
- Viewer mengambil berkas memakai sesi Supabase Storage yang sama dengan unduh; bucket tetap privat. Byte ditampilkan melalui object URL sementara dan URL dicabut saat modal ditutup atau komponen dilepas.
- Modal native mendukung Escape, backdrop, judul file, status loading/error dan retry, zoom 50–300% dalam langkah 25%, reset 100%, serta kontrol dengan label aksesibel.
- Kontrak produk dan panduan UI diperbarui.

## Pemeriksaan

- `npm run typecheck` — PASS.
- `npm run lint` — PASS, 0 error dan 1 warning Fast Refresh lama pada `src/modules/auth/AuthProvider.tsx`.
- `npm run build` — PASS; warning chunk besar >500 kB yang sudah ada tetap muncul.
- Browser nyata pada detail action DATA DEMO `http://localhost:5173/actions/10e44e0b-7745-4c85-9b75-7dacb980db48` — PNG berhasil dimuat pada viewport aktif. Zoom in menampilkan 125%, zoom out 75%, reset kembali 100%, dan Escape menutup modal serta mengembalikan fokus ke tombol pratinjau. Tampilan modal dan gambar diperiksa langsung.
- PDF/JPEG browser dan responsive 390/1024/1440 — NOT_RUN; evidence pada fixture yang tersedia hanya berupa PNG.
- DB integration, E2E, dan UAT pengguna — NOT_RUN untuk follow-up viewer ini.

## Batas

Tidak ada perubahan Storage policy, data, atau migrasi database. Viewer mengizinkan pembacaan pasif melalui browser; tidak ada pemrosesan file aktif di aplikasi.
