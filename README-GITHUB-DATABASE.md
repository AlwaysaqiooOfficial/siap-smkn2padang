# GitHub JSON Database Setup — SIAP SMKN 2 PADANG

File-file database JSON aplikasi ini disimpan di root GitHub repository private dan disinkronkan otomatis setelah perubahan API berhasil.

## Repositori Target
`https://github.com/AlwaysaqiooOfficial/siap-smkn2padang`

---

## ⚠️ PERATURAN KEAMANAN PENTING
**JANGAN PERNAH BAGIKAN ATAU COMMIT TOKEN GITHUB (Personal Access Token) KE KODE ATAU CHAT.**

---

## Cara Konfigurasi Token GitHub (Personal Access Token)

1. Buka [GitHub Settings -> Personal Access Tokens (Fine-grained tokens)](https://github.com/settings/tokens?type=beta).
2. Klik **Generate new token**.
3. Beri Nama Token: `siap-smkn2-server`.
4. Resource owner: `AlwaysaqiooOfficial`.
5. Repository access: **Only select repositories** -> pilih `siap-smkn2padang`.
6. Permissions -> **Repository permissions**:
   - **Contents**: Read and write
7. Klik **Generate token** dan salin token tersebut.
8. Buka file `server/.env` dan tambahkan:
   ```env
   GITHUB_TOKEN=ghp_TOKEN_BARU_ANDA_DI_SINI
   GITHUB_OWNER=AlwaysaqiooOfficial
   GITHUB_REPO=siap-smkn2padang
   GITHUB_BRANCH=main
   GITHUB_DATA_DIR=.
   GITHUB_SYNC_ENABLED=true
   ```

---

## Struktur File Database di Root Repository

| File JSON | Isi Data |
|---|---|
| `users.json` | Akun pengguna (Admin, Wali Kelas, Guru, Scanner, Ortu, Siswa) |
| `teachers.json` | Profil Guru |
| `students/*.json` | Profil siswa per kelas, termasuk data orang tua dan ringkasan absensi |
| `majors.json` | Jurusan |
| `classes.json` | Kelas |
| `README.md` | Dokumentasi struktur data |

Data operasional seperti absensi, izin, pelanggaran, notifikasi, dan log tetap disimpan di MySQL. Setelah request `POST`, `PUT`, `PATCH`, atau `DELETE` berhasil, server mengekspor master data dan file siswa per kelas ke GitHub menggunakan token.

---

## Cara Ekspor Data dari Database Lokal ke JSON

Jika kamu memiliki data di MySQL/Prisma dan ingin mengekspornya ke repository GitHub:

```bash
cd server
npm run db:export-json
```

---

## Cara Push File Data Ke GitHub

Setelah ekspor atau penambahan data lokal:

```bash
git add .
git commit -m "feat: inisialisasi database JSON di folder data"
git push -u origin main
```
