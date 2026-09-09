import { AppError } from "../middlewares/error.middleware";
import type { CreateClassInput, UpdateClassInput } from "../schemas/class.schema";
import { ClassRepository, MajorRepository, TeacherRepository, StudentRepository, UserRepository } from "./repositories";

export async function listClasses(filter: { majorId?: string }) {
  let classes = ClassRepository.findMany();
  
  if (filter.majorId) {
    classes = classes.filter(c => c.majorId === filter.majorId);
  }
  
  return classes.map(klass => {
    const major = MajorRepository.findUnique(klass.majorId);
    const homeroomTeacher = klass.homeroomTeacherId ? TeacherRepository.findUnique(klass.homeroomTeacherId) : null;
    const studentCount = StudentRepository.count(s => s.classId === klass.id);
    
    return {
      ...klass,
      major,
      homeroomTeacher: homeroomTeacher ? { id: homeroomTeacher.id, fullName: homeroomTeacher.fullName, nip: homeroomTeacher.nip } : null,
      _count: { students: studentCount }
    };
  }).sort((a, b) => a.grade !== b.grade ? a.grade - b.grade : a.name.localeCompare(b.name));
}

export async function getClassById(id: string) {
  const klass = ClassRepository.findUnique(id);
  if (!klass) throw new AppError("Kelas tidak ditemukan", 404);
  
  const major = MajorRepository.findUnique(klass.majorId);
  const homeroomTeacher = klass.homeroomTeacherId ? TeacherRepository.findUnique(klass.homeroomTeacherId) : null;
  const studentCount = StudentRepository.count(s => s.classId === id);
  
  return {
    ...klass,
    major,
    homeroomTeacher: homeroomTeacher ? { id: homeroomTeacher.id, fullName: homeroomTeacher.fullName, nip: homeroomTeacher.nip } : null,
    _count: { students: studentCount }
  };
}

async function assertHomeroomTeacherValid(teacherId: string, ignoreClassId?: string) {
  const teacher = TeacherRepository.findUnique(teacherId);
  if (!teacher) throw new AppError("Guru wali kelas tidak ditemukan", 404);
  
  const user = UserRepository.findUnique(teacher.userId!);
  if (!user || (user.role !== "WALI_KELAS" && user.role !== "GURU")) {
    throw new AppError("Akun yang ditunjuk harus merupakan akun guru", 422);
  }
  
  const existingHomeroom = ClassRepository.findFirst(c => c.homeroomTeacherId === teacherId && c.id !== ignoreClassId);
  if (existingHomeroom) {
    throw new AppError(
      `Guru ini sudah menjadi wali kelas di ${existingHomeroom.name}`,
      409
    );
  }
}

export async function createClass(input: CreateClassInput) {
  const major = MajorRepository.findUnique(input.majorId);
  if (!major) throw new AppError("Jurusan tidak ditemukan", 404);

  const duplicate = ClassRepository.findFirst(c => c.name === input.name && c.majorId === input.majorId);
  if (duplicate) throw new AppError("Nama kelas sudah ada pada jurusan ini", 409);

  if (input.homeroomTeacherId) {
    await assertHomeroomTeacherValid(input.homeroomTeacherId);
  }

  const newClass = await ClassRepository.create({
    id: crypto.randomUUID(),
    ...input,
    homeroomTeacherId: input.homeroomTeacherId || null,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString()
  });

  const homeroomTeacher = input.homeroomTeacherId ? TeacherRepository.findUnique(input.homeroomTeacherId) : null;
  
  return {
    ...newClass,
    major,
    homeroomTeacher: homeroomTeacher ? { id: homeroomTeacher.id, fullName: homeroomTeacher.fullName, nip: homeroomTeacher.nip } : null,
    _count: { students: 0 }
  };
}

export async function updateClass(id: string, input: UpdateClassInput) {
  await getClassById(id);

  if (input.majorId) {
    const major = MajorRepository.findUnique(input.majorId);
    if (!major) throw new AppError("Jurusan tidak ditemukan", 404);
  }

  if (input.homeroomTeacherId) {
    await assertHomeroomTeacherValid(input.homeroomTeacherId, id);
  }

  await ClassRepository.update(id, input);
  return getClassById(id);
}

export async function deleteClass(id: string) {
  const klass = await getClassById(id);
  if (klass._count.students > 0) {
    throw new AppError("Kelas tidak dapat dihapus karena masih memiliki siswa aktif", 409);
  }
  await ClassRepository.delete(id);
}
