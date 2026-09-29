# MOM-004 — Form buat/edit draf notula

Tanggal: 24 September 2026  
Route yang diperiksa: `/meetings/new`

## Perubahan

Form DRAFT kini memakai breadcrumb dan hero lokal, lalu kartu Informasi Rapat, Peserta Rapat, serta Agenda & Hasil Rapat yang konsisten dengan halaman FINAL. Agenda dan peserta ditampilkan sebagai baris/kartu berlabel; PIC, mulai, dan jatuh tempo tetap kondisional untuk TASK/PENDING_MATTER. Simpan, finalisasi, hapus, status simpan, validasi, serta evidence tetap terhubung ke alur yang sudah ada.

## Pemeriksaan

| Pemeriksaan | Hasil |
| --- | --- |
| `npm run typecheck` | PASS, exit code 0 |
| `npm run lint` | PASS, 0 error; 1 warning Fast Refresh yang sudah ada di `src/modules/auth/AuthProvider.tsx:91` |
| `npm run build` | PASS; Vite memberi peringatan chunk JavaScript lebih dari 500 kB |
| Browser nyata, viewport 836×746 | PASS; bagian atas dan bawah form ditinjau, field dan kontrol terlihat pada accessibility tree |
| Penyimpanan/ubah data rapat | Tidak dilakukan; pemeriksaan hanya pada tampilan form kosong |
| Viewport 1440/1024/390 dan UAT pengguna | NOT_RUN |

Screenshot browser 836×746 ditinjau selama sesi, tetapi tidak tersimpan sebagai berkas di `docs/qa`. MOM-004 tetap IN_PROGRESS sampai viewport penerimaan dan UAT pengguna selesai.
