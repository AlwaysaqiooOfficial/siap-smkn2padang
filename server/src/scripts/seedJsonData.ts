import fs from "fs";
import path from "path";
import bcrypt from "bcrypt";
import crypto from "crypto";

const DATA_DIR = path.join(__dirname, "../../../data");

function generateQrToken(): string {
  return "QR-" + crypto.randomBytes(6).toString("hex").toUpperCase();
}

async function seedJsonDatabase() {
  console.log("🌱 Menulis seluruh data lengkap ke file JSON...");

  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
  }

  const now = new Date().toISOString();
  const defaultPasswordHash = await bcrypt.hash("Guru123!", 12);
  const adminPasswordHash = await bcrypt.hash("admin", 12);
  const ortuPasswordHash = await bcrypt.hash("Ortu123!", 12);
  const scannerPasswordHash = await bcrypt.hash("smkn2padang", 12);

  // 1. MAJORS
  const majors = [
    { id: "mjr-rpl", code: "RPL", name: "Rekayasa Perangkat Lunak", createdAt: now, updatedAt: now },
    { id: "mjr-tkj", code: "TKJ", name: "Teknik Komputer dan Jaringan", createdAt: now, updatedAt: now },
    { id: "mjr-mplb", code: "MPLB", name: "Manajemen Perkantoran dan Layanan Bisnis", createdAt: now, updatedAt: now },
    { id: "mjr-akl", code: "AKL", name: "Akuntansi dan Keuangan Lembaga", createdAt: now, updatedAt: now },
    { id: "mjr-ulw", code: "ULW", name: "Usaha Layanan Wisata", createdAt: now, updatedAt: now },
    { id: "mjr-bd", code: "BD", name: "Bisnis Digital", createdAt: now, updatedAt: now },
    { id: "mjr-br", code: "BR", name: "Bisnis Retail", createdAt: now, updatedAt: now },
  ];

  // 2. ACADEMIC YEARS & SEMESTERS
  const academicYears = [
    { id: "ay-2026", name: "2026/2027", isActive: true, createdAt: now },
  ];

  const semesters = [
    {
      id: "sem-2026-1",
      academicYearId: "ay-2026",
      name: "Ganjil",
      order: 1,
      startDate: "2026-07-14T00:00:00.000Z",
      endDate: "2026-12-19T00:00:00.000Z",
      isActive: true,
      createdAt: now,
    },
  ];

  // 3. SCHOOL SETTINGS
  const schoolSettings = [
    { id: "set-1", key: "attendance_start_time", value: "05:00", updatedAt: now },
    { id: "set-2", key: "attendance_late_after", value: "07:30", updatedAt: now },
    { id: "set-3", key: "attendance_end_time", value: "10:00", updatedAt: now },
    { id: "set-4", key: "auto_alfa_cron_time", value: "10:00", updatedAt: now },
    { id: "set-5", key: "violation_notify_min_points", value: "10", updatedAt: now },
  ];

  // 4. VIOLATION CATEGORIES
  const violationCategories = [
    { id: "vc-1", name: "Terlambat Masuk Sekolah", points: 5, createdAt: now },
    { id: "vc-2", name: "Tidak Memakai Seragam Lengkap", points: 10, createdAt: now },
    { id: "vc-3", name: "Meninggalkan Kelas Tanpa Izin", points: 15, createdAt: now },
    { id: "vc-4", name: "Merokok di Lingkungan Sekolah", points: 50, createdAt: now },
    { id: "vc-5", name: "Terlibat Tawuran", points: 100, createdAt: now },
  ];

  // 5. USERS & TEACHERS
  const users: any[] = [];
  const teachers: any[] = [];

  // Super Admin
  users.push({
    id: "usr-admin",
    email: "admin@smkn2padang.sch.id",
    username: "admin",
    passwordHash: adminPasswordHash,
    role: "SUPER_ADMIN",
    isActive: true,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  });

  // Scanner Account
  users.push({
    id: "usr-scanner",
    email: "smkn2padang@smkn2padang.sch.id",
    username: "smkn2padang",
    passwordHash: scannerPasswordHash,
    role: "SCANNER",
    isActive: true,
    lastLoginAt: null,
    createdAt: now,
    updatedAt: now,
  });

  // Guru & Wali Kelas
  const teacherSeed = [
    { id: "tch-1", name: "Ahmad Dahlan, S.Pd.", nip: "198501012010011001", isHomeroom: true, username: "wali.rpl1" },
    { id: "tch-2", name: "Siti Nurhaliza, M.Pd.", nip: "198702022012012002", isHomeroom: true, username: "wali.rpl2" },
    { id: "tch-3", name: "Budi Santoso, S.Kom.", nip: "199003032015011003", isHomeroom: true, username: "wali.tkj1" },
    { id: "tch-4", name: "Dewi Lestari, S.E.", nip: "198804042014012004", isHomeroom: true, username: "wali.mplb1" },
    { id: "tch-5", name: "Eko Prasetyo, M.Ak.", nip: "198605052011011005", isHomeroom: true, username: "wali.akl1" },
    { id: "tch-6", name: "Fitriani, S.Par.", nip: "199206062018012006", isHomeroom: true, username: "wali.ulw1" },
    { id: "tch-7", name: "Hendra Wijaya, S.T.", nip: "198907072016011007", isHomeroom: false, username: "guru.hendra" },
    { id: "tch-8", name: "Indah Permata, S.Pd.", nip: "199108082017012008", isHomeroom: false, username: "guru.indah" },
    { id: "tch-9", name: "Joko Susilo, M.T.", nip: "198409092009011009", isHomeroom: false, username: "guru.joko" },
  ];

  for (const t of teacherSeed) {
    const userId = `usr-${t.id}`;
    users.push({
      id: userId,
      email: `${t.username}@smkn2padang.sch.id`,
      username: t.username,
      passwordHash: defaultPasswordHash,
      role: t.isHomeroom ? "WALI_KELAS" : "GURU",
      isActive: true,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    });
    teachers.push({
      id: t.id,
      userId,
      nip: t.nip,
      fullName: t.name,
      phone: `08123456${t.id.split("-")[1].padStart(4, "0")}`,
      isHomeroom: t.isHomeroom,
      createdAt: now,
      updatedAt: now,
    });
  }

  // 6. CLASSES (14 Kelas)
  const classes = [
    { id: "cls-x-rpl-1", name: "X RPL 1", grade: 10, majorId: "mjr-rpl", homeroomTeacherId: "tch-1", createdAt: now, updatedAt: now },
    { id: "cls-x-rpl-2", name: "X RPL 2", grade: 10, majorId: "mjr-rpl", homeroomTeacherId: "tch-2", createdAt: now, updatedAt: now },
    { id: "cls-xi-rpl-1", name: "XI RPL 1", grade: 11, majorId: "mjr-rpl", homeroomTeacherId: null, createdAt: now, updatedAt: now },
    { id: "cls-xii-rpl-1", name: "XII RPL 1", grade: 12, majorId: "mjr-rpl", homeroomTeacherId: null, createdAt: now, updatedAt: now },

    { id: "cls-x-tkj-1", name: "X TKJ 1", grade: 10, majorId: "mjr-tkj", homeroomTeacherId: "tch-3", createdAt: now, updatedAt: now },
    { id: "cls-xi-tkj-1", name: "XI TKJ 1", grade: 11, majorId: "mjr-tkj", homeroomTeacherId: null, createdAt: now, updatedAt: now },

    { id: "cls-x-mplb-1", name: "X MPLB 1", grade: 10, majorId: "mjr-mplb", homeroomTeacherId: "tch-4", createdAt: now, updatedAt: now },
    { id: "cls-xi-mplb-1", name: "XI MPLB 1", grade: 11, majorId: "mjr-mplb", homeroomTeacherId: null, createdAt: now, updatedAt: now },

    { id: "cls-x-akl-1", name: "X AKL 1", grade: 10, majorId: "mjr-akl", homeroomTeacherId: "tch-5", createdAt: now, updatedAt: now },
    { id: "cls-xi-akl-1", name: "XI AKL 1", grade: 11, majorId: "mjr-akl", homeroomTeacherId: null, createdAt: now, updatedAt: now },

    { id: "cls-x-ulw-1", name: "X ULW 1", grade: 10, majorId: "mjr-ulw", homeroomTeacherId: "tch-6", createdAt: now, updatedAt: now },
    { id: "cls-xi-ulw-1", name: "XI ULW 1", grade: 11, majorId: "mjr-ulw", homeroomTeacherId: null, createdAt: now, updatedAt: now },

    { id: "cls-x-bd-1", name: "X BD 1", grade: 10, majorId: "mjr-bd", homeroomTeacherId: null, createdAt: now, updatedAt: now },
    { id: "cls-x-br-1", name: "X BR 1", grade: 10, majorId: "mjr-br", homeroomTeacherId: null, createdAt: now, updatedAt: now },
  ];

  // 7. PARENTS (10 Orang Tua)
  const parents: any[] = [];
  const parentNames = [
    "Bambang Pratama", "Sri Wahyuni", "Agus Setiawan", "Rina Marlina", "Hasan Basri",
    "Nurhayati", "Dedi Kurniawan", "Siti Rahmah", "Rudi Hartono", "Maya Kartika"
  ];

  for (let i = 1; i <= 10; i++) {
    const parentId = `prn-${i}`;
    const userId = `usr-prn-${i}`;
    users.push({
      id: userId,
      email: `ortu${i}@gmail.com`,
      username: `ortu${i}`,
      passwordHash: ortuPasswordHash,
      role: "ORANG_TUA",
      isActive: true,
      lastLoginAt: null,
      createdAt: now,
      updatedAt: now,
    });
    parents.push({
      id: parentId,
      userId,
      fullName: parentNames[i - 1],
      phone: `08527411${String(i).padStart(4, "0")}`,
      address: `Jl. Khatib Sulaiman No. ${i * 10}, Padang`,
      createdAt: now,
      updatedAt: now,
    });
  }

  // 8. STUDENTS (30 Siswa Dummy Tersebar di 14 Kelas)
  const students: any[] = [];
  const studentNames = [
    "Aditya Pratama", "Annisa Rahma", "Arief Hidayat", "Bagus Triyono", "Citra Dewi",
    "Dimas Anggara", "Elisa Putri", "Fajar Nugraha", "Gita Gutawa", "Hafiz Maulana",
    "Irfan Bachdim", "Intan Permata", "Kevin Sanjaya", "Larasati Suwandi", "Muhammad Rizky",
    "Nabila Syakieb", "Oki Setiana", "Putri Marino", "Qory Sandioriva", "Randi Pangalila",
    "Siti Badriah", "Taufik Hidayat", "Utari Dewi", "Vino G. Bastian", "Wanda Hamidah",
    "Xaverius Jun", "Yura Yunita", "Zack Lee", "Ayu Tingting", "Bima Arya"
  ];

  for (let i = 1; i <= 30; i++) {
    const studentId = `std-${i}`;
    const targetClass = classes[(i - 1) % classes.length];
    const parentId = parents[(i - 1) % parents.length].id;
    const nis = `26${String(i).padStart(4, "0")}`;
    const nisn = `006${String(i).padStart(7, "0")}`;

    students.push({
      id: studentId,
      userId: null,
      nis,
      nisn,
      fullName: studentNames[i - 1],
      gender: i % 2 === 1 ? "L" : "P",
      birthDate: "2008-05-15T00:00:00.000Z",
      address: `Jl. Sudirman No. ${i}, Padang`,
      majorId: targetClass.majorId,
      classId: targetClass.id,
      parentId,
      qrToken: generateQrToken(),
      isActive: true,
      createdAt: now,
      updatedAt: now,
    });
  }

  // MENULISKAN SEMUA KOLEKSI KE FILE JSON
  const outputFiles = [
    { name: "users.json", data: users },
    { name: "teachers.json", data: teachers },
    { name: "parents.json", data: parents },
    { name: "students.json", data: students },
    { name: "majors.json", data: majors },
    { name: "classes.json", data: classes },
    { name: "academic_years.json", data: academicYears },
    { name: "semesters.json", data: semesters },
    { name: "school_settings.json", data: schoolSettings },
    { name: "violation_categories.json", data: violationCategories },
    { name: "attendance.json", data: [] },
    { name: "attendance_logs.json", data: [] },
    { name: "permissions.json", data: [] },
    { name: "violations.json", data: [] },
    { name: "notifications.json", data: [] },
    { name: "email_logs.json", data: [] },
    { name: "activity_logs.json", data: [] },
    { name: "student_class_histories.json", data: [] },
  ];

  for (const file of outputFiles) {
    const filePath = path.join(DATA_DIR, file.name);
    fs.writeFileSync(filePath, JSON.stringify(file.data, null, 2), "utf8");
    console.log(`  ✅ ${file.name}: ${file.data.length} data ditulis`);
  }

  console.log("🎉 Berhasil mengisi SELURUH file JSON database!");
}

seedJsonDatabase().catch(console.error);
