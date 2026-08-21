# Login, Hak Akses per Role, dan Audit Log

Aplikasi diubah menjadi tertutup: semua halaman hanya bisa diakses setelah login. Tidak ada pendaftaran mandiri — akun baru hanya dibuat dari dalam aplikasi oleh admin/owner/finance.

## Akun demo

Empat akun dibuat dengan password sama `123456`:

- admin@lavin.app — Admin
- owner@lavin.app — Owner
- finance@lavin.app — Finance
- employee@lavin.app — Employee

## Halaman Login

- Halaman depan (`/`) menjadi halaman login: email + password, tanpa link daftar.
- Di bawah form ada kartu "Akun Demo" berisi empat tombol (Admin, Owner, Finance, Employee). Sekali klik, email dan password otomatis terisi lalu langsung login.
- Setelah login diarahkan ke dashboard/beranda aplikasi.
- Header aplikasi menampilkan nama & role user yang aktif, plus tombol keluar.

## Hak akses

| Role | Lihat | Tambah | Ubah | Hapus | Buat user baru |
|---|---|---|---|---|---|
| Admin | ya | ya | ya | ya | ya |
| Owner | ya | ya | ya | ya | ya |
| Finance | ya | ya | ya | ya | ya |
| Employee | ya | ya | ya | tidak | tidak |

- Tombol hapus disembunyikan untuk Employee di semua halaman, dan penghapusan juga ditolak di sisi database (bukan hanya di tampilan).
- Menu "Pengguna" hanya muncul untuk admin/owner/finance: daftar user, buat user baru (nama, email, password, role), ubah role, nonaktifkan.

## Audit Log

- Halaman "Audit Log" mencatat setiap perubahan data di aplikasi: siapa (nama/email user), kapan (tanggal & jam), aksi (Tambah/Ubah/Hapus), data apa (mis. Tenant, Kamar, Pemasukan, Pengeluaran, Inventaris, Pengguna), dan ringkasan field yang berubah.
- Pencatatan berjalan otomatis di database, jadi semua perubahan lewat aplikasi pasti tercatat.
- Ada filter berdasarkan user, jenis data, aksi, dan rentang tanggal; bisa diekspor.
- Halaman ini dapat dilihat semua role; hanya admin yang bisa membersihkan log lama.

## Catatan teknis

- Migrasi database:
  - enum `app_role` (`admin`,`owner`,`finance`,`employee`), tabel `user_roles` + fungsi `has_role()` (security definer) dan `can_write()` / `can_delete()` helper.
  - tabel `profiles` (id → auth user, full_name, email) dengan trigger auto-create saat user dibuat.
  - tabel `audit_logs` (user_id, user_email, table_name, record_id, action, changed_fields jsonb, old/new jsonb, created_at) + trigger generik `log_audit()` dipasang pada seluruh tabel data: rooms, room_items, shared_items, tenants, tenant_* , incomes, other_incomes, expenses, user_roles, profiles.
  - RLS ditulis ulang: hapus policy `anon` full-access; SELECT/INSERT/UPDATE untuk semua role terautentikasi, DELETE hanya untuk admin/owner/finance. `audit_logs` read-only (insert hanya via trigger security definer).
  - Storage `inventory-photos`: policy dibatasi ke `authenticated`, delete hanya untuk role ber-hak-hapus.
- Akun demo dibuat lewat Admin API (email terkonfirmasi otomatis, tanpa signup publik) dan diberi role masing-masing.
- Routing: seluruh route dipindah ke `src/routes/_authenticated/` dengan gate bawaan Supabase; `src/routes/index.tsx` menjadi halaman login publik; beranda lama menjadi `/beranda`.
- Pembuatan user baru lewat `createServerFn` dengan `requireSupabaseAuth`, memverifikasi role pemanggil sebelum memakai admin client.
- Hook `useAuth`/`usePermissions` dipakai komponen untuk menyembunyikan aksi yang tidak diizinkan.

Password `123456` sengaja lemah karena ini akun demo — sebaiknya diganti sebelum dipakai untuk data asli.
