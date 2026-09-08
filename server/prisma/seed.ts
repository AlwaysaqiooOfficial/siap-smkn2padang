import { PrismaClient } from "@prisma/client";
import bcrypt from "bcrypt";
import { generateQrToken } from "../src/utils/qrToken";

const prisma = new PrismaClient();

const MAJORS = [
  { code: "RPL", name: "Rekayasa Perangkat Lunak" },
  { code: "TKJ", name: "Teknik Komputer dan Jaringan" },
  { code: "MPLB", name: "Manajemen Perkantoran dan Layanan Bisnis" },
  { code: "AKL", name: "Akuntansi dan Keuangan Lembaga" },
  { code: "ULW", name: "Usaha Layanan Wisata" },
  { code: "BD", name: "Bisnis Digital" },
  { code: "BR", name: "Bisnis Retail" },
];

const DEFAULT_SETTINGS = [
  { key: "attendance_start_time", value: "05:00" },
  { key: "attendance_late_after", value: "07:30" },
  { key: "attendance_end_time", value: "10:00" },
  { key: "auto_alfa_cron_time", value: "10:00" },
  { key: "violation_notify_min_points", value: "10" },
];

async function main() {
  console.log("🌱 Mulai seeding...");

  // 1. Jurusan
  for (const major of MAJORS) {
    await prisma.major.upsert({
      where: { code: major.code },
      update: {},
      create: major,
    });
  }
  console.log(`✅ ${MAJORS.length} jurusan tersedia`);

  // 2. Tahun ajaran & semester aktif
  const academicYear = await prisma.academicYear.upsert({
    where: { name: "2026/2027" },
    update: { isActive: true },
    create: { name: "2026/2027", isActive: true },
  });

  const semester = await prisma.semester.upsert({
    where: { academicYearId_order: { academicYearId: academicYear.id, order: 1 } },
    update: { isActive: true },
    create: {
      academicYearId: academicYear.id,
      name: "Ganjil",
      order: 1,
      startDate: new Date("2026-07-14"),
      endDate: new Date("2026-12-19"),
      isActive: true,
    },
  });
  console.log(`✅ Tahun ajaran ${academicYear.name} - Semester ${semester.name} aktif`);

  // 3. Super Admin
  const adminPasswordHash = await bcrypt.hash("admin", 12);
  await prisma.user.upsert({
    where: { email: "admin@smkn2padang.sch.id" },
    update: { username: "admin", passwordHash: adminPasswordHash, role: "SUPER_ADMIN", isActive: true },
    create: {
      email: "admin@smkn2padang.sch.id",
      username: "admin",
      passwordHash: adminPasswordHash,
      role: "SUPER_ADMIN",
      isActive: true,
    },
  });

  const scannerPasswordHash = await bcrypt.hash("smkn2padang", 12);
  await prisma.user.upsert({
    where: { email: "smkn2padang@smkn2padang.sch.id" },
    update: { username: "smkn2padang", passwordHash: scannerPasswordHash, role: "SCANNER", isActive: true },
    create: {
      email: "smkn2padang@smkn2padang.sch.id",
      username: "smkn2padang",
      passwordHash: scannerPasswordHash,
      role: "SCANNER",
      isActive: true,
    },
  });
  console.log("✅ Akun admin, guru, dan scanner disiapkan");

  // 4. School settings default
  for (const setting of DEFAULT_SETTINGS) {
    await prisma.schoolSetting.upsert({
      where: { key: setting.key },
      update: { value: setting.value },
      create: setting,
    });
  }
  console.log(`✅ ${DEFAULT_SETTINGS.length} school settings default tersimpan`);

  // 5. Kategori pelanggaran dasar
  await prisma.violationCategory.upsert({
    where: { name: "Terlambat" },
    update: {},
    create: { name: "Terlambat", points: 5 },
  });
  await prisma.violationCategory.upsert({
    where: { name: "Bolos" },
    update: {},
    create: { name: "Bolos", points: 15 },
  });
  await prisma.violationCategory.upsert({
    where: { name: "Tidak Memakai Atribut" },
    update: {},
    create: { name: "Tidak Memakai Atribut", points: 5 },
  });
  console.log("✅ Kategori pelanggaran dasar tersimpan");

  console.log("🎉 Seeding Phase 1 selesai.");

  // ==========================================================
  // PHASE 2 — Kelas, Guru/Wali Kelas, Orang Tua, Siswa Dummy
  // ==========================================================
  console.log("🌱 Mulai seeding Phase 2...");

  const majorMap = Object.fromEntries(
    (await prisma.major.findMany()).map((m) => [m.code, m])
  );

  const defaultPasswordHash = await bcrypt.hash("Guru123!", 12);
  const parentPasswordHash = await bcrypt.hash("Ortu123!", 12);

  // --- Guru (wali kelas + guru biasa) ---
  const waliKelasSeed = [
    { username: "wali.rpl1", email: "wali.rpl1@smkn2padang.sch.id", fullName: "Siti Rahmawati, S.Kom", nip: "198501012010012001" },
    { username: "wali.rpl2", email: "wali.rpl2@smkn2padang.sch.id", fullName: "Ahmad Fauzi, S.Kom", nip: "198602022011011002" },
    { username: "wali.xirpl1", email: "wali.xirpl1@smkn2padang.sch.id", fullName: "Dedi Kurniawan, S.T", nip: "198703032012011003" },
    { username: "wali.tkj1", email: "wali.tkj1@smkn2padang.sch.id", fullName: "Nurul Huda, S.Kom", nip: "198804042013012004" },
    { username: "wali.mplb1", email: "wali.mplb1@smkn2padang.sch.id", fullName: "Yuli Andriani, S.Pd", nip: "198905052014012005" },
    { username: "wali.akl1", email: "wali.akl1@smkn2padang.sch.id", fullName: "Rina Marlina, S.Pd", nip: "199006062015012006" },
  ];

  const guruBiasaSeed = [
    { username: "guru.budi", email: "guru.budi@smkn2padang.sch.id", fullName: "Budi Santoso, S.Kom", nip: "199107072016011007" },
    { username: "guru.wati", email: "guru.wati@smkn2padang.sch.id", fullName: "Wati Suryani, S.Pd", nip: "199208082017012008" },
    { username: "guru.hendra", email: "guru.hendra@smkn2padang.sch.id", fullName: "Hendra Gunawan, S.T", nip: "199309092018011009" },
  ];

  const waliTeacherRecords: Record<string, string> = {}; // username -> teacherId

  for (const w of waliKelasSeed) {
    const user = await prisma.user.upsert({
      where: { email: w.email },
      update: {},
      create: {
        email: w.email,
        username: w.username,
        passwordHash: defaultPasswordHash,
        role: "WALI_KELAS",
        teacher: {
          create: { fullName: w.fullName, nip: w.nip, isHomeroom: true },
        },
      },
      include: { teacher: true },
    });
    waliTeacherRecords[w.username] = user.teacher!.id;
  }

  for (const g of guruBiasaSeed) {
    await prisma.user.upsert({
      where: { email: g.email },
      update: {},
      create: {
        email: g.email,
        username: g.username,
        passwordHash: defaultPasswordHash,
        role: "GURU",
        teacher: { create: { fullName: g.fullName, nip: g.nip, isHomeroom: false } },
      },
    });
  }

  const guruPasswordHash = await bcrypt.hash("guru", 12);
  const guruUser = await prisma.user.upsert({
    where: { email: "guru@smkn2padang.sch.id" },
    update: { username: "guru", passwordHash: guruPasswordHash, role: "GURU", isActive: true },
    create: {
      email: "guru@smkn2padang.sch.id",
      username: "guru",
      passwordHash: guruPasswordHash,
      role: "GURU",
      isActive: true,
    },
  });
  await prisma.teacher.deleteMany({ where: { userId: guruUser.id } });

  await prisma.user.updateMany({
    where: {
      username: { in: [...waliKelasSeed.map((w) => w.username), ...guruBiasaSeed.map((g) => g.username)] },
    },
    data: { isActive: false },
  });
  console.log(`✅ ${waliKelasSeed.length} wali kelas + ${guruBiasaSeed.length} guru dibuat`);

  // --- Kelas (representatif per jurusan, mengikuti pola dinamis X/XI/XII) ---
  type ClassSeed = { name: string; grade: number; majorCode: string; homeroomUsername?: string };
  const classSeeds: ClassSeed[] = [
    { name: "X RPL 1", grade: 10, majorCode: "RPL", homeroomUsername: "wali.rpl1" },
    { name: "X RPL 2", grade: 10, majorCode: "RPL", homeroomUsername: "wali.rpl2" },
    { name: "XI RPL 1", grade: 11, majorCode: "RPL", homeroomUsername: "wali.xirpl1" },
    { name: "XI RPL 2", grade: 11, majorCode: "RPL" },
    { name: "XII RPL 1", grade: 12, majorCode: "RPL" },
    { name: "XII RPL 2", grade: 12, majorCode: "RPL" },
    { name: "X TKJ 1", grade: 10, majorCode: "TKJ", homeroomUsername: "wali.tkj1" },
    { name: "XI TKJ 1", grade: 11, majorCode: "TKJ" },
    { name: "XII TKJ 1", grade: 12, majorCode: "TKJ" },
    { name: "X MPLB 1", grade: 10, majorCode: "MPLB", homeroomUsername: "wali.mplb1" },
    { name: "X AKL 1", grade: 10, majorCode: "AKL", homeroomUsername: "wali.akl1" },
    { name: "X ULW 1", grade: 10, majorCode: "ULW" },
    { name: "X BD 1", grade: 10, majorCode: "BD" },
    { name: "X BR 1", grade: 10, majorCode: "BR" },
  ];

  const classRecords: Record<string, string> = {}; // name -> classId

  for (const c of classSeeds) {
    const major = majorMap[c.majorCode];
    const kelas = await prisma.class.upsert({
      where: { name_majorId: { name: c.name, majorId: major.id } },
      update: {},
      create: {
        name: c.name,
        grade: c.grade,
        majorId: major.id,
        homeroomTeacherId: c.homeroomUsername ? waliTeacherRecords[c.homeroomUsername] : undefined,
      },
    });
    classRecords[c.name] = kelas.id;
  }
  console.log(`✅ ${classSeeds.length} kelas dibuat`);

  // --- Orang tua ---
  const parentIds: string[] = [];
  for (let i = 1; i <= 10; i++) {
    const email = `ortu${i}@example.com`;
    const user = await prisma.user.upsert({
      where: { email },
      update: {},
      create: {
        email,
        username: `ortu${i}`,
        passwordHash: parentPasswordHash,
        role: "ORANG_TUA",
        parent: {
          create: {
            fullName: `Orang Tua Siswa ${i}`,
            phone: `08${(100000000 + i).toString().slice(0, 10)}`,
            address: "Kota Padang, Sumatera Barat",
          },
        },
      },
      include: { parent: true },
    });
    parentIds.push(user.parent!.id);
  }
  console.log(`✅ ${parentIds.length} akun orang tua dibuat`);

  // --- Siswa dummy (minimal 30) ---
  const firstNames = [
    "Ahmad", "Budi", "Citra", "Dewi", "Eka", "Fajar", "Gita", "Hadi", "Indah", "Joko",
    "Kartika", "Lestari", "Muhammad", "Nadia", "Oki", "Putri", "Qori", "Rizky", "Sari", "Tono",
    "Umi", "Vina", "Wahyu", "Xena", "Yusuf", "Zahra", "Andi", "Bella", "Cahyo", "Dinda",
  ];
  const lastNames = ["Pratama", "Wijaya", "Saputra", "Anggraini", "Ramadhan", "Putra", "Utami", "Syafitri", "Hidayat", "Permata"];

  const classNameList = Object.keys(classRecords);
  let nisCounter = 24001;
  let nisnCounter = 3024000001;
  let createdCount = 0;

  for (let i = 0; i < 30; i++) {
    const className = classNameList[i % classNameList.length];
    const classId = classRecords[className];
    const kelas = classSeeds.find((c) => c.name === className)!;
    const major = majorMap[kelas.majorCode];

    const fullName = `${firstNames[i % firstNames.length]} ${lastNames[i % lastNames.length]}`;
    const nis = String(nisCounter++);
    const nisn = String(nisnCounter++);
    const gender = i % 2 === 0 ? "L" : "P";
    const parentId = parentIds[i % parentIds.length];

    const existing = await prisma.student.findUnique({ where: { nis } });
    if (existing) continue;

    let qrToken = generateQrToken();
    // eslint-disable-next-line no-await-in-loop
    while (await prisma.student.findUnique({ where: { qrToken } })) {
      qrToken = generateQrToken();
    }

    // eslint-disable-next-line no-await-in-loop
    await prisma.student.create({
      data: {
        nis,
        nisn,
        fullName,
        gender,
        birthDate: new Date(2009, i % 12, (i % 27) + 1),
        address: "Kota Padang, Sumatera Barat",
        majorId: major.id,
        classId,
        parentId,
        qrToken,
      },
    });
    createdCount++;
  }
  console.log(`✅ ${createdCount} siswa dummy dibuat (tersebar di ${classNameList.length} kelas)`);

  // --- Akun login demo untuk siswa pertama (Phase 7: Dashboard Siswa) ---
  const demoStudent = await prisma.student.findUnique({ where: { nis: "24001" } });
  if (demoStudent && !demoStudent.userId) {
    const studentPasswordHash = await bcrypt.hash("Siswa123!", 12);
    await prisma.user.create({
      data: {
        email: "siswa.demo@smkn2padang.sch.id",
        username: "siswa.demo",
        passwordHash: studentPasswordHash,
        role: "SISWA",
        student: { connect: { id: demoStudent.id } },
      },
    });
    console.log("✅ Akun login demo siswa dibuat (siswa.demo / Siswa123!)");
  }

  await prisma.user.updateMany({
    where: { username: { notIn: ["admin", "guru", "smkn2padang"] } },
    data: { isActive: false },
  });
  console.log("✅ Hanya akun admin, guru, dan scanner yang dibuat aktif");

  console.log("🎉 Seeding Phase 2 selesai.");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
