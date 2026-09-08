# SIAP SMKN 2 PADANG - Database Seed Files

Dokumentasi lengkap semua file data untuk database backend.

## 📊 Ringkasan File

Total ukuran: ~37.4 KB (semua file JSON minimal)

| File | Ukuran | Deskripsi |
|------|--------|-----------|
| users.json | 7.03 KB | 20+ akun user (Admin, Scanner, Teachers, Parents) |
| students.json | 13.61 KB | Data 30+ siswa dengan NIS, NISN, QR token |
| classes.json | 3.04 KB | 15+ kelas (X-XII berbagai jurusan) |
| teachers.json | 2.37 KB | Data 9 guru dengan NIP dan informasi |
| parents.json | 2.52 KB | Data 7+ orang tua siswa |
| majors.json | 1.22 KB | 7 jurusan: RPL, TKJ, MPLB, AKL, ULW, BD, BR |
| school_settings.json | 0.64 KB | Pengaturan sekolah global |
| violation_categories.json | 0.64 KB | Kategori pelanggaran & poin |
| academic_years.json | 0.12 KB | Tahun akademik (2026/2027) |
| semesters.json | 0.25 KB | Semester Ganjil & Genap |
| **Empty (Log Files)** | 0 | attendance.json, permissions.json, violations.json, notifications.json, email_logs.json, activity_logs.json, attendance_logs.json, student_class_histories.json |

## 🔐 Data Sensitif

### Password untuk Testing
```
Semua akun: password123 (di-hash dengan bcrypt)
```

### Akun Utama untuk Testing

**SUPER_ADMIN**
```
Username: admin
Email: admin@smkn2padang.sch.id
Password: password123
```

**SCANNER (Absensi)**
```
Username: smkn2padang
Email: smkn2padang@smkn2padang.sch.id
Password: password123
```

**WALI_KELAS (Guru Kelas)**
```
wali.rpl1  → wali.rpl1@smkn2padang.sch.id    (X RPL 1)
wali.rpl2  → wali.rpl2@smkn2padang.sch.id    (X RPL 2)
wali.tkj1  → wali.tkj1@smkn2padang.sch.id    (X TKJ 1)
wali.mplb1 → wali.mplb1@smkn2padang.sch.id   (X MPLB 1)
wali.akl1  → wali.akl1@smkn2padang.sch.id    (X AKL 1)
wali.ulw1  → wali.ulw1@smkn2padang.sch.id    (X ULW 1)
```

**GURU (Guru Mata Pelajaran)**
```
guru.hendra  → guru.hendra@smkn2padang.sch.id
guru.indah   → guru.indah@smkn2padang.sch.id
guru.joko    → guru.joko@smkn2padang.sch.id
```

**ORANG_TUA (Parent - 7 akun)**
```
ortu1 → ortu1@gmail.com
ortu2 → ortu2@gmail.com
... (hingga ortu7)
```

## 📋 Data Siswa

**30+ Siswa dengan distribusi:**
- RPL (Rekayasa Perangkat Lunak): 10 siswa
- TKJ (Teknik Komputer & Jaringan): 8 siswa  
- MPLB, AKL, ULW, BD, BR: Masing-masing beberapa siswa

**Setiap siswa memiliki:**
- ✅ NIS unik (260001 - 260030+)
- ✅ NISN unik (0060000001 - 0060000030+)
- ✅ QR Token untuk absensi scan
- ✅ Link ke orang tua
- ✅ Link ke kelas & jurusan
- ✅ Status emailSent (false/true)

## 🏫 Struktur Organisasi

### Jurusan (7)
- RPL - Rekayasa Perangkat Lunak
- TKJ - Teknik Komputer dan Jaringan
- MPLB - Multimedia dan Persiapan Luar Biasa
- AKL - Akuntansi
- ULW - Usaha Layanan Wisata
- BD - Bisnis Daring
- BR - Barista

### Kelas (15+)
- Grade 10 (X): 6 kelas
- Grade 11 (XI): 6 kelas
- Grade 12 (XII): 3+ kelas

### Guru (9)
- 6 Wali Kelas (homeroom teacher)
- 3 Guru Mata Pelajaran

## 🚀 Cara Menggunakan

### 1. Setup Database Pertama Kali
```bash
cd server
npm run seed
```

### 2. Sync Perubahan dari JSON
```bash
npm run sync-json
```

### 3. Export Database ke JSON
```bash
npm run export-json
```

## ⚠️ Penting untuk GitHub

### DO ✅
- Push semua file JSON ke repository
- Include README.md di folder data/
- Dokumentasikan struktur data
- Commit password hash (bukan plaintext)
- Gunakan untuk development/testing

### DON'T ❌
- Jangan ubah password hash secara manual
- Jangan push ke production tanpa review
- Jangan commit plaintext passwords
- Jangan share credentials di public repo

## 📧 Email Tracking

**Field `emailSent` di students.json:**
- `false` = Email belum dikirim
- `true` = Email sudah dikirim ke orang tua

**Sistem Email:**
- Email dikirim otomatis saat siswa scan barcode (absensi)
- Tidak dikirim saat pendaftaran siswa
- Tidak dikirim ulang saat system restart
- Hanya proses email hari ini (tidak old pending)

## 🔄 Relasi Data

```
User (20+)
├── Teacher (9)
│   └── Class (15+)
│       └── Student (30+)
│           ├── Parent (7+)
│           └── Major (7)
│
├── Parent (7+)
│   └── Student (30+)
│
└── Student (30+)
    ├── Attendance Log
    ├── Permission
    ├── Violation
    └── Notification
```

## 📝 Catatan Teknis

- Format tanggal: ISO 8601 (YYYY-MM-DDTHH:mm:ss.fffZ)
- Gender: L (Laki-laki) / P (Perempuan)
- Currency jika ada: IDR
- Timezone: Asia/Jakarta (UTC+7)
- Encoding: UTF-8

---

**Last Updated**: 2026-09-08
**Version**: 1.0
**Status**: Ready for GitHub Push
