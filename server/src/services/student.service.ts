import { prisma } from "../config/db";
import { AppError } from "../middlewares/error.middleware";
import { generateQrToken } from "../utils/qrToken";
import { generateQrImage } from "../utils/qrImage";
import { hashPassword } from "../utils/password";
import { paginationSchema, toSkipTake, meta, type PaginationInput } from "../utils/pagination";
import type { CreateStudentInput, UpdateStudentInput, CreateStudentAccountInput } from "../schemas/student.schema";

const includeDefault = {
  major: { select: { id: true, code: true, name: true } },
  class: { select: { id: true, name: true, grade: true } },
  parent: {
    select: {
      id: true,
      fullName: true,
      phone: true,
      user: { select: { email: true } },
    },
  },
};

export interface StudentListFilter extends PaginationInput {
  classId?: string;
  majorId?: string;
}

export async function listStudents(filter: StudentListFilter) {
  const { page, limit, search } = paginationSchema.parse(filter);
  const classId = filter.classId;
  const majorId = filter.majorId;
  const where = {
    classId: classId || undefined,
    majorId: majorId || undefined,
    ...(search
      ? {
          OR: [
            { fullName: { contains: search } },
            { nis: { contains: search } },
            { nisn: { contains: search } },
          ],
        }
      : {}),
  };

  const [data, total] = await Promise.all([
    prisma.student.findMany({
      where,
      include: includeDefault,
      orderBy: { fullName: "asc" },
      ...toSkipTake({ page, limit, search }),
    }),
    prisma.student.count({ where }),
  ]);

  return { data, meta: meta(total, { page, limit, search }) };
}

export async function getStudentById(id: string) {
  const student = await prisma.student.findUnique({ where: { id }, include: includeDefault });
  if (!student) throw new AppError("Siswa tidak ditemukan", 404);
  return student;
}

function assertOwnClass(student: { classId: string }, scopedClassId?: string) {
  if (scopedClassId && student.classId !== scopedClassId) {
    throw new AppError("Anda tidak memiliki akses ke siswa di luar kelas Anda", 403);
  }
}

export async function createStudent(input: CreateStudentInput, scopedClassId?: string) {
  if (scopedClassId && input.classId !== scopedClassId) {
    throw new AppError("Wali kelas hanya dapat menambahkan siswa ke kelasnya sendiri", 403);
  }

  const [nisTaken, nisnTaken, kelas] = await Promise.all([
    prisma.student.findUnique({ where: { nis: input.nis } }),
    prisma.student.findUnique({ where: { nisn: input.nisn } }),
    prisma.class.findUnique({ where: { id: input.classId } }),
  ]);

  if (nisTaken) throw new AppError("NIS sudah terdaftar", 409);
  if (nisnTaken) throw new AppError("NISN sudah terdaftar", 409);
  if (!kelas) throw new AppError("Kelas tidak ditemukan", 404);
  if (kelas.majorId !== input.majorId) {
    throw new AppError("Kelas yang dipilih tidak sesuai dengan jurusan", 422);
  }

  if (input.parentId) {
    const parent = await prisma.parent.findUnique({ where: { id: input.parentId } });
    if (!parent) throw new AppError("Data orang tua tidak ditemukan", 404);
  }

  // Pastikan qrToken benar-benar unik (probabilitas tabrakan sangat kecil, tapi tetap dijaga).
  let qrToken = generateQrToken();
  while (await prisma.student.findUnique({ where: { qrToken } })) {
    qrToken = generateQrToken();
  }

  const activeSemester = await prisma.semester.findFirst({ where: { isActive: true } });

  return prisma.$transaction(async (tx) => {
    const student = await tx.student.create({
      data: { ...input, qrToken },
      include: includeDefault,
    });

    if (activeSemester) {
      await tx.studentClassHistory.create({
        data: {
          studentId: student.id,
          classId: student.classId,
          semesterId: activeSemester.id,
          note: "Pendaftaran siswa baru",
        },
      });
    }

    return student;
  });
}

export async function updateStudent(id: string, input: UpdateStudentInput, scopedClassId?: string) {
  const student = await getStudentById(id);
  assertOwnClass(student, scopedClassId);

  const { parentEmail, parentFullName, parentPhone, ...studentData } = input;

  if (scopedClassId && input.classId && input.classId !== scopedClassId) {
    throw new AppError("Wali kelas tidak dapat memindahkan siswa ke kelas lain", 403);
  }

  if (studentData.nis) {
    const taken = await prisma.student.findFirst({ where: { nis: studentData.nis, NOT: { id } } });
    if (taken) throw new AppError("NIS sudah terdaftar", 409);
  }
  if (studentData.nisn) {
    const taken = await prisma.student.findFirst({ where: { nisn: studentData.nisn, NOT: { id } } });
    if (taken) throw new AppError("NISN sudah terdaftar", 409);
  }

  let newClass = null;
  if (studentData.classId && studentData.classId !== student.classId) {
    newClass = await prisma.class.findUnique({ where: { id: studentData.classId } });
    if (!newClass) throw new AppError("Kelas tidak ditemukan", 404);
  }

  if (studentData.parentId) {
    const parent = await prisma.parent.findUnique({ where: { id: studentData.parentId } });
    if (!parent) throw new AppError("Data orang tua tidak ditemukan", 404);
  }

  const parentDataChanged = parentEmail !== undefined || parentFullName !== undefined || parentPhone !== undefined;
  const parentId = studentData.parentId === undefined ? student.parentId : studentData.parentId;
  if (parentDataChanged && !parentId) {
    throw new AppError("Siswa belum memiliki data orang tua", 422);
  }

  if (parentEmail && parentId) {
    const parent = await prisma.parent.findUnique({ where: { id: parentId }, select: { userId: true } });
    if (!parent) throw new AppError("Data orang tua tidak ditemukan", 404);
    const emailTaken = await prisma.user.findFirst({
      where: { email: parentEmail, NOT: { id: parent.userId } },
    });
    if (emailTaken) throw new AppError("Email orang tua sudah digunakan", 409);
  }

  return prisma.$transaction(async (tx) => {
    const updated = await tx.student.update({ where: { id }, data: studentData, include: includeDefault });

    if (parentId && parentDataChanged) {
      if (parentEmail) {
        const parent = await tx.parent.findUnique({ where: { id: parentId }, select: { userId: true } });
        if (!parent) throw new AppError("Data orang tua tidak ditemukan", 404);
        await tx.user.update({ where: { id: parent.userId }, data: { email: parentEmail } });
      }
      await tx.parent.update({
        where: { id: parentId },
        data: {
          fullName: parentFullName,
          phone: parentPhone,
        },
      });
    }

    // Jika kelas berubah (kenaikan kelas/pindah kelas), catat riwayat — data lama TIDAK dihapus.
    if (newClass) {
      const activeSemester = await tx.semester.findFirst({ where: { isActive: true } });
      if (activeSemester) {
        await tx.studentClassHistory.create({
          data: {
            studentId: id,
            classId: newClass.id,
            semesterId: activeSemester.id,
            note: `Pindah dari kelas sebelumnya ke ${newClass.name}`,
          },
        });
      }
    }

    return updated;
  });
}

export async function deleteStudent(id: string, scopedClassId?: string) {
  // Soft-delete: nonaktifkan, jangan hapus permanen — riwayat absensi/pelanggaran harus tetap ada.
  const student = await getStudentById(id);
  assertOwnClass(student, scopedClassId);
  return prisma.student.update({ where: { id }, data: { isActive: false } });
}

export async function getStudentQrImage(id: string) {
  const student = await getStudentById(id);
  const qrImage = await generateQrImage(student.qrToken);
  return { studentId: student.id, fullName: student.fullName, qrToken: student.qrToken, qrImage };
}

/** Membuat akun login (role SISWA) untuk siswa yang sudah ada, agar Dashboard Siswa bisa dipakai. */
export async function createStudentAccount(studentId: string, input: CreateStudentAccountInput) {
  const student = await prisma.student.findUnique({ where: { id: studentId } });
  if (!student) throw new AppError("Siswa tidak ditemukan", 404);
  if (student.userId) throw new AppError("Siswa ini sudah memiliki akun login", 409);

  const [emailTaken, usernameTaken] = await Promise.all([
    prisma.user.findUnique({ where: { email: input.email } }),
    prisma.user.findUnique({ where: { username: input.username } }),
  ]);
  if (emailTaken) throw new AppError("Email sudah digunakan", 409);
  if (usernameTaken) throw new AppError("Username sudah digunakan", 409);

  const passwordHash = await hashPassword(input.password);

  const user = await prisma.user.create({
    data: {
      email: input.email,
      username: input.username,
      passwordHash,
      role: "SISWA",
      student: { connect: { id: studentId } },
    },
  });

  return { userId: user.id, studentId, email: user.email, username: user.username };
}
