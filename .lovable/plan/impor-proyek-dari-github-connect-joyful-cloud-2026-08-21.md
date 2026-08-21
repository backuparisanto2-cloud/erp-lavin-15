# Impor proyek dari GitHub: connect-joyful-cloud

Repositori publik `backuparisanto2-cloud/connect-joyful-cloud` sudah dicek dan bisa diakses. Isinya proyek Lovable (TanStack Start + Tailwind + Supabase) untuk manajemen kos/properti: kamar, penghuni, pendapatan, pengeluaran, jurnal, laporan, denah lantai, dan inventaris fasilitas.

## Yang akan dibuat di proyek ini

Menyalin seluruh aplikasi tersebut ke proyek ini, lengkap dengan:

- Halaman: Beranda, Kamar (daftar + detail), Penghuni (daftar + detail), Pendapatan, Pengeluaran, Jurnal, Laporan, Denah, Fasilitas, Kelola
- Komponen pendukung: form dialog penghuni/kamar/pemasukan/pengeluaran, uploader foto & bukti, pengingat jatuh tempo, ekspor Excel/PDF, lightbox foto, splash screen, app shell + breadcrumb
- Design system (styles.css), ikon, manifest PWA, dan gambar denah lantai
- Backend: mengaktifkan Lovable Cloud, lalu menjalankan ulang skema database dari 3 file migrasi repo (tabel, RLS, grant, storage bucket)

## Catatan penting

- **Data isi tidak ikut.** Yang dipindahkan adalah kode dan struktur database. Baris data lama (penghuni, transaksi, foto) tetap berada di backend proyek asal; proyek ini mulai dengan database kosong.
- Kredensial backend lama di repo tidak dipakai; proyek ini memakai backend Cloud sendiri yang baru.
- Fitur AI (kategorisasi pengeluaran, format jurnal) akan diarahkan ke AI Gateway proyek ini.

## Detail teknis

- Unduh tarball repo ke sandbox, salin `src/**`, `public/**`, `supabase/migrations/**`, `components.json`, `vite.config.ts`, dan konfigurasi terkait ke proyek ini; `.env`, `bun.lock`, dan `.lovable/**` dari repo tidak disalin.
- Samakan dependensi `package.json` (jspdf, xlsx, recharts, pdfjs-dist, date-fns, radix, dsb.) lewat `bun add`.
- `src/routeTree.gen.ts` dibiarkan digenerate ulang oleh plugin router.
- Aset `src/assets/*.asset.json` adalah pointer milik proyek asal; file gambar nyata di `public/assets` dipakai sebagai sumber, dan pointer diganti bila gagal resolve.
- Aktifkan Lovable Cloud lebih dulu agar `@/integrations/supabase/*` yang digenerate valid, baru jalankan migrasi gabungan (skema + RLS + GRANT + bucket storage) sesuai isi 3 migrasi repo.
- Verifikasi akhir: build bersih, semua rute terbuka, dan halaman `/` bukan placeholder.
