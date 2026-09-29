# Aksi hapus notula draf dan task — 24 September 2026

## Perilaku

- `/meetings`: aksi hapus disediakan pada baris DRAFT hanya untuk owner atau ADMIN aktif. Dialog konfirmasi menjelaskan penghapusan draf permanen. Notula FINAL, termasuk item pada screenshot komentar, tetap immutable sesuai keputusan pengguna.
- `/actions?view=table`: tombol hapus ditampilkan pada kolom Aksi untuk task yang dikelola owner/admin; kartu ponsel dan detail task juga punya aksi. Konfirmasi menjelaskan task disembunyikan.
- Task memakai soft delete melalui `actions.deleted_at`. RPC `delete_action(id, expected_version)` memvalidasi sesi aktif, owner/admin, dan versi, lalu menambahkan baris ke `action_updates`. Penghapusan idempoten. Trigger menolak perubahan lanjutan atas task yang sudah dihapus.
- Query tracker, timeline, detail langsung, dan hitungan dashboard mengecualikan task terhapus. Baris `actions` serta seluruh sejarah tetap disimpan. Tidak ada pemulihan dari UI pada MVP.
- `delete_meeting_draft` existing tetap menjadi otoritas untuk hapus permanen draf dan menolak meeting FINAL.

## Pemeriksaan

| Pemeriksaan | Hasil |
|---|---|
| `supabase migration up --local` | PASS setelah koreksi SQL; migration `20260924130000_mom_006_soft_delete_actions.sql` diterapkan tanpa reset DB. Tidak ada migration yang diterapkan ke remote. |
| `npm run typecheck` | PASS. |
| `npm run lint` | PASS; 0 error, 1 warning Fast Refresh lama pada `AuthProvider.tsx`. |
| `npm run build` | PASS; warning ukuran chunk Vite >500 kB tetap. |
| Browser in-app `/meetings` | PASS secara visual/AX: tombol hanya muncul pada baris DRAFT; baris FINAL tidak memiliki tombol. Tidak menjalankan delete. |
| Browser in-app `/actions?view=table` | PASS secara visual/AX: kolom Aksi dan tombol tersedia bagi ADMIN; routing aplikasi termuat tanpa error. Tidak menjalankan delete. |
| Tes unit, integrasi DB, E2E | NOT_RUN untuk perubahan ini; tidak menambah atau menjalankan test otomatis. |
| UAT | NOT_RUN. |

Validasi browser memastikan tombol dan statusnya benar-benar dirender, tetapi tidak membuktikan submit/persistensi RPC atau visibilitas lintas-role. Keamanan write ditegakkan melalui RPC; jalur database tersebut belum diuji oleh suite pada sesi ini.
