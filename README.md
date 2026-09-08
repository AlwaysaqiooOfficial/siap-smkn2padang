# Data JSON Siap GitHub

Folder ini berisi data seed JSON untuk aplikasi SIAP SMKN 2 Padang.

## Struktur

- `users.json`: akun login dan role pengguna.
- `students/`: siswa dipisah per kelas menggunakan nama file dari ID kelas.
- `teachers.json`: data guru.
- `classes.json`: master kelas dan relasi wali kelas.
- `majors.json`: master jurusan.

## Akun login

Folder ini hanya menggunakan tiga akun login:

- `admin` - `SUPER_ADMIN`
- `smkn2padang` - `SCANNER`
- `guru` - `WALI_KELAS`

Data orang tua tetap tersedia di setiap siswa, tetapi tidak dibuat sebagai akun login terpisah.

## Daftar file siswa per kelas

Semua kelas yang ada pada `classes.json` memiliki file pasangan di `students/`:

- `cls-x-rpl-1.json`
- `cls-x-rpl-2.json`
- `cls-x-tkj-1.json`
- `cls-x-mplb-1.json`
- `cls-x-akl-1.json`
- `cls-x-ulw-1.json`
- `cls-x-bd-1.json`
- `cls-x-br-1.json`
- `cls-xi-rpl-1.json`
- `cls-xi-tkj-1.json`
- `cls-xii-rpl-1.json`

Setiap file berisi array siswa lengkap dengan `nis`, `nisn`, identitas, `majorId`, `classId`, `parentId`, `qrToken`, objek `parent`, dan ringkasan `attendance`. Objek `parent` berisi `id`, `userId`, `fullName`, `email`, `phone`, dan `address`. Ringkasan `attendance` berisi `totalPresent`, `totalLate`, `totalAbsent` (alfa), `totalSick`, `totalPermit`, `totalDispensation`, `presentToday`, `lastPresentAt`, dan `lastResetAt`.

## Catatan keamanan

Folder ini berisi data demo/seed. Jangan memasukkan password asli, token produksi, atau data pribadi nyata ke repository. Karena repository bersifat private, tetap batasi akses collaborator dan rotasi credential jika data ini pernah tersebar.

## Cara memakai

Semua data siswa berada di `students/`. Aplikasi dapat membaca file kelas terkait untuk mengambil siswa pada kelas tersebut. File kelas dibuat dari `classId`, sehingga isinya tetap sinkron dengan `classes.json`.