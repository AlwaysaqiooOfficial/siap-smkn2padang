import { AppError } from "../middlewares/error.middleware";
import type { CreateMajorInput, UpdateMajorInput } from "../schemas/major.schema";
import { MajorRepository, ClassRepository, StudentRepository } from "./repositories";

export async function listMajors() {
  const majors = MajorRepository.findMany();
  return majors.map(major => {
    const classes = ClassRepository.findFilter(c => c.majorId === major.id);
    const students = StudentRepository.findFilter(s => s.majorId === major.id);
    return {
      ...major,
      _count: {
        classes: classes.length,
        students: students.length
      }
    };
  }).sort((a, b) => a.code.localeCompare(b.code));
}

export async function getMajorById(id: string) {
  const major = MajorRepository.findUnique(id);
  if (!major) throw new AppError("Jurusan tidak ditemukan", 404);
  
  const classes = ClassRepository.findFilter(c => c.majorId === id);
  const students = StudentRepository.count(s => s.majorId === id);
  
  return {
    ...major,
    classes,
    _count: { students }
  };
}

export async function createMajor(input: CreateMajorInput) {
  const exists = MajorRepository.findFirst(m => m.code === input.code);
  if (exists) throw new AppError("Kode jurusan sudah digunakan", 409);
  return MajorRepository.create({ id: crypto.randomUUID(), ...input, createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() });
}

export async function updateMajor(id: string, input: UpdateMajorInput) {
  await getMajorById(id);
  if (input.code) {
    const exists = MajorRepository.findFirst(m => m.code === input.code && m.id !== id);
    if (exists) throw new AppError("Kode jurusan sudah digunakan", 409);
  }
  return MajorRepository.update(id, input);
}

export async function deleteMajor(id: string) {
  const major = await getMajorById(id);
  const studentCount = StudentRepository.count(s => s.majorId === id);
  if (studentCount > 0 || major.classes.length > 0) {
    throw new AppError(
      "Jurusan tidak dapat dihapus karena masih memiliki kelas/siswa terdaftar",
      409
    );
  }
  await MajorRepository.delete(id);
}
