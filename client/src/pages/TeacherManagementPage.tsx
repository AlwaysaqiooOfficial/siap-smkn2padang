import { useEffect, useState, type FormEvent } from "react";
import { CheckCircle2, Loader2, Save, UserPlus, AlertCircle, Pencil, X, Trash2 } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { api, getErrorMessage } from "../lib/api";
import type { ApiResponse, ClassOption } from "../types";

interface TeacherRecord {
  id: string;
  fullName: string;
  nip: string | null;
  phone: string | null;
  user: { id: string; email: string; username: string; isActive: boolean } | null;
  homeroomClass: { id: string; name: string } | null;
}

interface ClassRecord extends ClassOption {
  major: { name: string };
  homeroomTeacher: { id: string; fullName: string } | null;
}

const emptyForm = { fullName: "", email: "", nip: "", phone: "" };

export default function TeacherManagementPage() {
  const [teachers, setTeachers] = useState<TeacherRecord[]>([]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [form, setForm] = useState(emptyForm);
  const [editingTeacher, setEditingTeacher] = useState<TeacherRecord | null>(null);
  const [assignments, setAssignments] = useState<Record<string, string>>({});
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function fetchData() {
    setIsLoading(true);
    try {
      const [teachersRes, classesRes] = await Promise.all([
        api.get<ApiResponse<TeacherRecord[]>>("/teachers"),
        api.get<ApiResponse<ClassRecord[]>>("/classes"),
      ]);
      setTeachers(teachersRes.data.data);
      setClasses(classesRes.data.data);
      const classAssignments = Object.fromEntries(
        classesRes.data.data.map((kelas) => [kelas.id, kelas.homeroomTeacher?.id ?? ""])
      );
      for (const teacher of teachersRes.data.data) {
        if (teacher.homeroomClass) classAssignments[teacher.homeroomClass.id] = teacher.id;
      }
      setAssignments(classAssignments);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void fetchData();
  }, []);

  function startEdit(teacher: TeacherRecord) {
    setEditingTeacher(teacher);
    setForm({
      fullName: teacher.fullName,
      email: teacher.user?.email ?? "",
      nip: teacher.nip ?? "",
      phone: teacher.phone ?? "",
    });
    setError(null);
    setSuccess(null);
  }

  function cancelEdit() {
    setEditingTeacher(null);
    setForm(emptyForm);
  }

  async function createTeacher(event: FormEvent) {
    event.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      const payload = {
        fullName: form.fullName.trim(),
        email: form.email.trim() || undefined,
        nip: form.nip.trim() || undefined,
        phone: form.phone.trim() || undefined,
        role: "GURU",
      };
      if (editingTeacher) {
        await api.put(`/teachers/${editingTeacher.id}`, payload);
        setSuccess("Data guru berhasil diperbarui.");
      } else {
        await api.post("/teachers", payload);
        setSuccess("Guru berhasil ditambahkan.");
      }
      cancelEdit();
      await fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function saveAssignment(classId: string) {
    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      const teacherId = assignments[classId] || null;
      const currentClass = classes.find((kelas) => kelas.id === classId);
      const previousClass = teacherId
        ? classes.find((kelas) => kelas.homeroomTeacher?.id === teacherId && kelas.id !== classId)
        : undefined;

      if (previousClass) {
        await api.put(`/classes/${previousClass.id}`, { homeroomTeacherId: null });
      }
      await api.put(`/classes/${classId}`, { homeroomTeacherId: teacherId });
      setSuccess(
        teacherId
          ? `${teachers.find((teacher) => teacher.id === teacherId)?.fullName ?? "Guru"} ditugaskan sebagai wali ${currentClass?.name ?? "kelas"}.`
          : `Wali kelas ${currentClass?.name ?? "kelas"} berhasil dikosongkan.`
      );
      await fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  async function deleteTeacher(teacher: TeacherRecord) {
    if (teacher.homeroomClass) {
      setError(`Lepaskan penugasan wali kelas ${teacher.homeroomClass.name} terlebih dahulu.`);
      return;
    }
    if (!window.confirm(`Hapus guru ${teacher.fullName}?`)) return;

    setError(null);
    setSuccess(null);
    setIsSaving(true);
    try {
      await api.delete(`/teachers/${teacher.id}`);
      setSuccess(`Guru ${teacher.fullName} berhasil dihapus.`);
      await fetchData();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell
      title="Kelola Guru & Wali Kelas"
      navItems={[
        { to: "/dashboard/admin", label: "Dashboard" },
        { to: "/management/teachers", label: "Guru & Wali Kelas" },
        { to: "/students/qr", label: "QR Siswa" },
        { to: "/students/add", label: "Tambah Siswa" },
      ]}
    >
      {error && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-700">
          <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}
        </div>
      )}
      {success && (
        <div className="mb-4 flex items-start gap-2 rounded-lg bg-emerald-50 px-4 py-3 text-sm text-emerald-700">
          <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" /> {success}
        </div>
      )}

      <div className="grid gap-6 lg:grid-cols-[minmax(0,360px)_1fr]">
        <form onSubmit={createTeacher} className="h-fit space-y-3 rounded-xl border bg-white p-5">
          <div className="mb-2 flex items-center gap-2">
            <UserPlus className="h-5 w-5 text-brand-600" />
            <h2 className="font-semibold text-slate-800">{editingTeacher ? "Edit Data Guru" : "Tambah Guru"}</h2>
          </div>
          <input required placeholder="Nama lengkap" value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
          <input type="email" placeholder="Email (opsional)" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
          <input minLength={5} placeholder="NIP (opsional, minimal 5 karakter)" value={form.nip} onChange={(e) => setForm({ ...form, nip: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
          <input placeholder="Telepon (opsional)" value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="w-full rounded-lg border px-3 py-2 text-sm" />
          <button disabled={isSaving} className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60">
            {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingTeacher ? <Save className="h-4 w-4" /> : <UserPlus className="h-4 w-4" />} {editingTeacher ? "Simpan Perubahan" : "Simpan Guru"}
          </button>
          {editingTeacher && <button type="button" onClick={cancelEdit} className="flex w-full items-center justify-center gap-2 rounded-lg border px-4 py-2 text-sm font-semibold text-slate-600"><X className="h-4 w-4" /> Batal Edit</button>}
        </form>

        <section className="space-y-6">
          <div className="rounded-xl border bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-800">Daftar Guru</h2>
            {isLoading ? <Loader2 className="h-5 w-5 animate-spin text-brand-600" /> : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm"><thead><tr className="border-b text-left text-xs uppercase text-slate-400"><th className="py-2 pr-4">Nama</th><th className="py-2 pr-4">Email</th><th className="py-2 pr-4">Wali Kelas</th><th className="py-2">Aksi</th></tr></thead>
                  <tbody className="divide-y">{teachers.map((teacher) => <tr key={teacher.id}><td className="py-2 pr-4 font-medium">{teacher.fullName}</td><td className="py-2 pr-4 text-slate-500">{teacher.user?.email && !teacher.user.email.includes("@internal.siap.local") ? teacher.user.email : "Belum ada akun"}</td><td className="py-2 pr-4 text-slate-500">{teacher.homeroomClass?.name ?? "Belum ditugaskan"}</td><td className="flex gap-1 py-2"><button type="button" onClick={() => startEdit(teacher)} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2 py-1 text-xs font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-700"><Pencil className="h-3.5 w-3.5" /> Edit</button><button type="button" onClick={() => void deleteTeacher(teacher)} disabled={isSaving} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2 py-1 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-60"><Trash2 className="h-3.5 w-3.5" /> Hapus</button></td></tr>)}</tbody>
                </table>
              </div>
            )}
          </div>

          <div className="rounded-xl border bg-white p-5">
            <h2 className="mb-3 font-semibold text-slate-800">Penugasan Wali Kelas</h2>
            <div className="space-y-3">{classes.map((kelas) => <div key={kelas.id} className="flex flex-wrap items-center gap-3 border-b pb-3 last:border-0 last:pb-0"><div className="min-w-40 flex-1"><p className="text-sm font-medium text-slate-700">{kelas.name}</p><p className="text-xs text-slate-400">{kelas.major.name}</p></div><select value={assignments[kelas.id] ?? ""} onChange={(e) => setAssignments({ ...assignments, [kelas.id]: e.target.value })} className="min-w-52 rounded-lg border px-3 py-2 text-sm"><option value="">Belum ada wali kelas</option>{teachers.map((teacher) => <option key={teacher.id} value={teacher.id}>{teacher.fullName}{teacher.user?.isActive === false ? " (akun login nonaktif)" : !teacher.user ? " (belum ada akun)" : ""}</option>)}</select><button type="button" disabled={isSaving} onClick={() => void saveAssignment(kelas.id)} className="flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60"><Save className="h-3.5 w-3.5" /> Simpan</button></div>)}</div>
          </div>
        </section>
      </div>
    </AppShell>
  );
}
