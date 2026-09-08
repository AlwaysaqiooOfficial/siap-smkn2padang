import { AppError } from "../middlewares/error.middleware";
import { generateQrToken } from "../utils/qrToken";
import { generateQrImage } from "../utils/qrImage";
import { hashPassword } from "../utils/password";
import { paginationSchema, toSkipTake, meta, type PaginationInput } from "../utils/pagination";
import type { CreateStudentInput, UpdateStudentInput, CreateStudentAccountInput } from "../schemas/student.schema";
import { StudentRepository, ClassRepository, MajorRepository, UserRepository } from "./repositories";

const includeDefault = (student: any) => ({
  major: MajorRepository.findUnique(student.majorId),
  class: ClassRepository.findUnique(student.classId),
});

export interface StudentListFilter extends PaginationInput {
  classId?: string;
  majorId?: string;
}

export async function listStudents(filter: StudentListFilter) {
  const { page, limit, search } = paginationSchema.parse(filter);
  const classId = filter.classId;
  const majorId = filter.majorId;

  let students = StudentRepository.findMany();

  if (classId) students = students.filter(s => s.classId === classId);
  if (majorId) students = students.filter(s => s.majorId === majorId);
  if (search) {
    students = students.filter(s =>
      s.fullName.includes(search) || s.nis.includes(search) || s.nisn.includes(search)
    );
  }

  const total = students.length;
  const { skip, take } = toSkipTake({ page, limit, search });
  const data = students.slice(skip, skip + take).map(s => ({
    ...s,
    ...includeDefault(s),
  }));

  return { data, meta: meta(total, { page, limit, search }) };
}

export async function getStudentById(id: string) {
  const student = StudentRepository.findUnique(id);
  if (!student) throw new AppError("Siswa tidak ditemukan", 404);
  return {
    ...student,
    ...includeDefault(student),
  };
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

  const nisTaken = StudentRepository.findFirst(s => s.nis === input.nis);
  const nisnTaken = StudentRepository.findFirst(s => s.nisn === input.nisn);
  const kelas = ClassRepository.findUnique(input.classId);

  if (nisTaken) throw new AppError("NIS sudah terdaftar", 409);
  if (nisnTaken) throw new AppError("NISN sudah terdaftar", 409);
  if (!kelas) throw new AppError("Kelas tidak ditemukan", 404);
  if (kelas.majorId !== input.majorId) {
    throw new AppError("Kelas yang dipilih tidak sesuai dengan jurusan", 422);
  }

  let qrToken = generateQrToken();
  while (StudentRepository.findFirst(s => s.qrToken === qrToken)) {
    qrToken = generateQrToken();
  }

  const student = await StudentRepository.create({
    id: crypto.randomUUID(),
    ...input,
    address: input.address || null,
    birthDate: typeof input.birthDate === 'string' ? input.birthDate : new Date(input.birthDate).toISOString().split('T')[0],
    qrToken,
    userId: null,
    parentId: input.parentId || null,
    isActive: true,
    emailSent: false,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  return {
    ...student,
    ...includeDefault(student),
  };
}

export async function updateStudent(id: string, input: UpdateStudentInput, scopedClassId?: string) {
  const student = await getStudentById(id);
  assertOwnClass(student, scopedClassId);

  const { parentEmail, parentFullName, parentPhone, ...studentData } = input;

  if (scopedClassId && input.classId && input.classId !== scopedClassId) {
    throw new AppError("Wali kelas tidak dapat memindahkan siswa ke kelas lain", 403);
  }

  if (studentData.nis) {
    const taken = StudentRepository.findFirst(s => s.nis === studentData.nis && s.id !== id);
    if (taken) throw new AppError("NIS sudah terdaftar", 409);
  }
  if (studentData.nisn) {
    const taken = StudentRepository.findFirst(s => s.nisn === studentData.nisn && s.id !== id);
    if (taken) throw new AppError("NISN sudah terdaftar", 409);
  }

  let newClass = null;
  if (studentData.classId && studentData.classId !== student.classId) {
    newClass = ClassRepository.findUnique(studentData.classId);
    if (!newClass) throw new AppError("Kelas tidak ditemukan", 404);
  }

  // Convert birthDate to string if it's a Date
  const updateData = {
    ...studentData,
    birthDate: studentData.birthDate 
      ? (typeof studentData.birthDate === 'string' ? studentData.birthDate : new Date(studentData.birthDate).toISOString().split('T')[0])
      : undefined
  };

  await StudentRepository.update(id, updateData);
  return getStudentById(id);
}

export async function deleteStudent(id: string, scopedClassId?: string) {
  const student = await getStudentById(id);
  assertOwnClass(student, scopedClassId);
  return StudentRepository.update(id, { isActive: false });
}

export async function getStudentQrImage(id: string) {
  const student = await getStudentById(id);
  const qrImage = await generateQrImage(student.qrToken);
  return { studentId: student.id, fullName: student.fullName, qrToken: student.qrToken, qrImage };
}

export async function createStudentAccount(studentId: string, input: CreateStudentAccountInput) {
  const student = StudentRepository.findUnique(studentId);
  if (!student) throw new AppError("Siswa tidak ditemukan", 404);
  if (student.userId) throw new AppError("Siswa ini sudah memiliki akun login", 409);

  const emailTaken = UserRepository.findFirst(u => u.email === input.email);
  const usernameTaken = UserRepository.findFirst(u => u.username === input.username);
  
  if (emailTaken) throw new AppError("Email sudah digunakan", 409);
  if (usernameTaken) throw new AppError("Username sudah digunakan", 409);

  const passwordHash = await hashPassword(input.password);
  const userId = crypto.randomUUID();

  const user = await UserRepository.create({
    id: userId,
    email: input.email,
    username: input.username,
    passwordHash,
    role: "SISWA",
    isActive: true,
    lastLoginAt: null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  });

  await StudentRepository.update(studentId, { userId });

  return { userId: user.id, studentId, email: user.email, username: user.username };
}
