# SIAP SMKN 2 PADANG — Architecture & Roadmap

## 1. High-Level Architecture

```
┌─────────────────┐      HTTPS/JSON       ┌──────────────────┐      Prisma Client     ┌──────────────┐
│  React + Vite    │ ───────────────────▶ │  Express + TS API │ ─────────────────────▶ │  MySQL 8.x   │
│  (client/)        │ ◀─────────────────── │   (server/)        │ ◀───────────────────── │  (Prisma ORM) │
└─────────────────┘      JWT Bearer        └──────────────────┘                          └──────────────┘
                                                     │
                                     ┌───────────────┼────────────────┐
                                     ▼               ▼                ▼
                              node-cron jobs   Nodemailer/SMTP   Excel/PDF export
                              (auto-alfa)        (email_logs)     (exceljs/pdfkit)
```

Monorepo dengan 2 workspace: `/client` (React) dan `/server` (Express API). Dipisah agar bisa
di-deploy independen (mis. client di static hosting, server di VPS/PaaS).

## 2. Folder Structure (server — dibuat di Phase 1)

```
server/
├── prisma/
│   ├── schema.prisma
│   └── seed.ts
├── src/
│   ├── config/
│   │   ├── env.ts          # load & validasi environment variables
│   │   └── db.ts           # Prisma client singleton
│   ├── middlewares/
│   │   ├── auth.middleware.ts    # verifikasi JWT
│   │   ├── role.middleware.ts    # authorization berbasis role
│   │   └── error.middleware.ts   # global error handler
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── password.ts     # bcrypt hash/compare
│   │   ├── apiResponse.ts  # format response konsisten
│   │   └── logger.ts
│   ├── schemas/
│   │   └── auth.schema.ts  # Zod validation
│   ├── services/
│   │   └── auth.service.ts # business logic
│   ├── controllers/
│   │   └── auth.controller.ts
│   ├── routes/
│   │   ├── auth.routes.ts
│   │   └── index.ts
│   ├── app.ts               # express app + middleware wiring
│   └── server.ts            # entrypoint (listen)
├── .env.example
├── package.json
└── tsconfig.json
```

Struktur ini akan konsisten dipakai untuk phase-phase berikutnya (majors, classes, students,
attendance, permissions, violations, reports, dst) — setiap modul baru cukup menambah
controller/service/route/schema baru tanpa mengubah pola yang sudah ada.

## 3. Database Schema (Prisma) — ringkasan relasi

- `users` — akun login (SUPER_ADMIN, WALI_KELAS, GURU, ORANG_TUA). Siswa **tidak login** lewat
  tabel users di versi awal (akses via QR), tapi disediakan role `SISWA` untuk future login siswa.
- `students` — 1:1 opsional ke `users` (jika siswa nanti diberi akun), N:1 ke `classes`, `majors`,
  N:1 ke `parents`.
- `teachers`, `parents` — 1:1 ke `users`.
- `majors` (jurusan) → `classes` (kelas) 1:N.
- `academic_years` → `semesters` 1:N.
- `classes` punya `homeroom_teacher_id` (wali kelas) → `teachers`.
- `student_class_histories` — mencatat riwayat kelas siswa per semester (kenaikan kelas), sehingga
  data lama tidak pernah hilang walau siswa naik kelas.
- `attendance` — 1 record per siswa per hari per semester (unique constraint
  `[student_id, date, semester_id]`), status enum.
- `attendance_logs` — audit trail setiap kali attendance dibuat/diubah (siapa scan, kapan, dari IP mana).
- `permissions` — pengajuan izin/sakit/dispensasi, status PENDING/APPROVED/REJECTED.
- `violations` + `violation_categories` — pelanggaran siswa dengan poin.
- `notifications` — notifikasi in-app untuk orang tua/wali kelas.
- `email_logs` — status pengiriman email (PENDING/SENT/FAILED), tidak pernah menggagalkan transaksi absensi.
- `activity_logs` — audit log semua aksi penting.
- `school_settings` — key-value config (jam mulai absensi, batas hadir, poin pelanggaran, dst) agar
  admin bisa ubah tanpa redeploy.

Semua tabel pakai `id` CUID, `createdAt`/`updatedAt`, foreign key eksplisit, index pada kolom yang
sering difilter (student_id, date, class_id, status).

## 4. Authentication & Authorization Design

- **Login**: `POST /api/auth/login` dengan email/username + password → verifikasi bcrypt →
  generate JWT access token (short-lived, 8 jam) berisi `{ userId, role }`.
- **Middleware `auth.middleware.ts`**: verifikasi signature & expiry token, attach `req.user`.
- **Middleware `role.middleware.ts`**: `authorize(['SUPER_ADMIN', 'WALI_KELAS'])` — cek role dari
  `req.user` terhadap daftar role yang diizinkan per route.
- **Password**: bcrypt cost factor 12, tidak pernah simpan plaintext.
- **Refresh**: disederhanakan dulu di Phase 1 (token 8 jam), refresh token flow bisa ditambah di
  phase security (Phase 9) jika dibutuhkan.
- Setiap login sukses/gagal dicatat ke `activity_logs`.

## 5. API Architecture (gaya umum, detail lengkap menyusul tiap phase)

```
POST   /api/auth/login
GET    /api/auth/me
POST   /api/auth/logout

GET    /api/majors            (Phase 2)
GET    /api/classes           (Phase 2)
GET    /api/students          (Phase 2)
...
POST   /api/attendance/scan   (Phase 3)
POST   /api/permissions       (Phase 4)
...
GET    /api/reports/daily     (Phase 8)
```

Semua response memakai format konsisten:
```json
{ "success": true, "message": "...", "data": {...} }
{ "success": false, "message": "...", "errors": [...] }
```

## 6. Implementation Roadmap

| Phase | Scope |
|---|---|
| 1 | Architecture, Prisma schema lengkap, auth (login, JWT, role middleware) |
| 2 | CRUD jurusan, kelas, siswa, guru, wali kelas |
| 3 | QR attendance (generate token, scan, validasi waktu server) |
| 4 | Izin/sakit/dispensasi + auto-alfa cron |
| 5 | Email notification (Nodemailer + email_logs) |
| 6 | Violation system |
| 7 | Dashboard (admin, wali kelas, guru, siswa, ortu) |
| 8 | Reports & export (Excel/PDF/CSV) |
| 9 | Security hardening + validasi menyeluruh |
| 10 | Testing, bug fixing, README final |

Lanjut ketik **NEXT** untuk lanjut ke phase berikutnya.
