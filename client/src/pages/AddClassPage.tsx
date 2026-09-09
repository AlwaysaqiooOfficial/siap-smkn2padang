import { useEffect, useState } from "react";
import { AlertCircle, CheckCircle2, Loader2, Plus, Pencil, Trash2, X, Save } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { api, getErrorMessage } from "../lib/api";
import type { ApiResponse, ClassOption, MajorOption } from "../types";

const NAV_ITEMS = [
  { to: "/dashboard/admin", label: "Dashboard" },
  { to: "/scan", label: "Scan QR" },
  { to: "/management/classes", label: "Tambah Kelas" },
  { to: "/management/teachers", label: "Guru & Wali Kelas" },
  { to: "/reports/attendance", label: "Laporan" },
  { to: "/students/qr", label: "QR Siswa" },
  { to: "/students/add", label: "Tambah Siswa" },
];

const GRADE_OPTIONS = [
  { value: 10, label: "X" },
  { value: 11, label: "XI" },
  { value: 12, label: "XII" },
];

interface ClassRecord extends ClassOption {
  _count?: { students?: number };
}

export default function AddClassPage() {
  const [majors, setMajors] = useState<MajorOption[]>([]);
  const [classes, setClasses] = useState<ClassRecord[]>([]);
  const [majorId, setMajorId] = useState("");
  const [grade, setGrade] = useState(10);
  const [classNumber, setClassNumber] = useState(1);
  const [editingClass, setEditingClass] = useState<ClassRecord | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function fetchOptions() {
    setIsLoading(true);
    try {
      const [majorsRes, classesRes] = await Promise.all([
        api.get<ApiResponse<MajorOption[]>>("/majors"),
        api.get<ApiResponse<ClassRecord[]>>("/classes"),
      ]);
      setMajors(majorsRes.data.data);
      setClasses(classesRes.data.data);
      setMajorId((current) => current || majorsRes.data.data[0]?.id || "");
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsLoading(false);
    }
  }

  useEffect(() => {
    void fetchOptions();
  }, []);

  async function addClass() {
    const major = majors.find((item) => item.id === majorId);
    if (!major) {
      setError("Pilih jurusan terlebih dahulu.");
      return;
    }

    const gradeLabel = GRADE_OPTIONS.find((item) => item.value === grade)?.label ?? "X";
    const name = `${gradeLabel} ${major.code} ${classNumber}`;
    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      if (editingClass) {
        await api.put(`/classes/${editingClass.id}`, { name, grade, majorId });
        setMessage(`Kelas berhasil diubah menjadi ${name}.`);
        setEditingClass(null);
      } else {
        await api.post("/classes", { name, grade, majorId });
        setMessage(`Kelas ${name} berhasil ditambahkan.`);
      }
      await fetchOptions();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  function startEditing(item: ClassRecord) {
    setEditingClass(item);
    setMajorId(item.majorId);
    setGrade(item.grade);
    const selectedGrade = GRADE_OPTIONS.find((option) => option.value === item.grade)?.label;
    const number = selectedGrade ? Number(item.name.replace(`${selectedGrade} `, "").split(" ").pop()) : NaN;
    setClassNumber(Number.isInteger(number) && number >= 1 && number <= 5 ? number : 1);
    setMessage(null);
    setError(null);
  }

  function cancelEditing() {
    setEditingClass(null);
    setMessage(null);
    setError(null);
  }

  async function deleteClass(item: ClassRecord) {
    if (!window.confirm(`Hapus kelas ${item.name}?`)) return;

    setIsSaving(true);
    setError(null);
    setMessage(null);
    try {
      await api.delete(`/classes/${item.id}`);
      setMessage(`Kelas ${item.name} berhasil dihapus.`);
      if (editingClass?.id === item.id) setEditingClass(null);
      await fetchOptions();
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSaving(false);
    }
  }

  return (
    <AppShell title="Tambah Kelas" navItems={NAV_ITEMS}>
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-xl border bg-white p-5">
          <div className="mb-5 flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
              <Plus className="h-5 w-5" />
            </div>
            <div>
              <h1 className="font-semibold text-slate-800">{editingClass ? "Edit Kelas" : "Buat Kelas Baru"}</h1>
              <p className="text-xs text-slate-400">Contoh: pilih XI, jurusan TKJ, dan nomor 2 untuk membuat XI TKJ 2.</p>
            </div>
          </div>

          {isLoading && <div className="mb-4 flex items-center gap-2 text-sm text-slate-400"><Loader2 className="h-4 w-4 animate-spin" /> Memuat jurusan dan kelas...</div>}
          {error && <div className="mb-4 flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600"><AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" /> {error}</div>}
          {message && <div className="mb-4 flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700"><CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" /> {message}</div>}

          <div className="grid gap-4 md:grid-cols-3">
            <label className="text-xs font-medium text-slate-600">
              Jurusan
              <select value={majorId} onChange={(event) => setMajorId(event.target.value)} disabled={isLoading} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                {majors.length === 0 && <option value="">Belum ada jurusan</option>}
                {majors.map((major) => <option key={major.id} value={major.id}>{major.code} - {major.name}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600">
              Tingkat
              <select value={grade} onChange={(event) => setGrade(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                {GRADE_OPTIONS.map((item) => <option key={item.value} value={item.value}>{item.label}</option>)}
              </select>
            </label>
            <label className="text-xs font-medium text-slate-600">
              Nomor kelas
              <select value={classNumber} onChange={(event) => setClassNumber(Number(event.target.value))} className="mt-1 w-full rounded-lg border border-slate-300 px-3 py-2 text-sm">
                {[1, 2, 3, 4, 5].map((number) => <option key={number} value={number}>{number}</option>)}
              </select>
            </label>
          </div>

          <div className="mt-5 flex gap-3">
            <button type="button" onClick={() => void addClass()} disabled={isSaving || isLoading || majors.length === 0} className="flex flex-1 items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60">
              {isSaving ? <Loader2 className="h-4 w-4 animate-spin" /> : editingClass ? <Save className="h-4 w-4" /> : <Plus className="h-4 w-4" />}
              {isSaving ? "Menyimpan..." : editingClass ? "Simpan Perubahan" : "Tambah Kelas"}
            </button>
            {editingClass && <button type="button" onClick={cancelEditing} className="flex items-center justify-center gap-2 rounded-lg border px-4 py-2.5 text-sm font-semibold text-slate-600 hover:bg-slate-50"><X className="h-4 w-4" /> Batal</button>}
          </div>
        </section>

        <section className="rounded-xl border bg-white p-5">
          <h2 className="mb-3 font-semibold text-slate-800">Daftar Kelas</h2>
          {classes.length === 0 ? <p className="text-sm text-slate-400">Belum ada kelas.</p> : <div className="divide-y">{classes.map((item) => <div key={item.id} className="flex items-center gap-3 py-3 first:pt-0 last:pb-0"><div className="min-w-0 flex-1"><p className="font-medium text-slate-700">{item.name}</p><p className="text-xs text-slate-400">{item._count?.students ?? 0} murid</p></div><button type="button" onClick={() => startEditing(item)} disabled={isSaving} title={`Edit ${item.name}`} className="inline-flex items-center gap-1 rounded-lg bg-slate-100 px-2.5 py-1.5 text-xs font-medium text-slate-600 hover:bg-brand-50 hover:text-brand-700 disabled:opacity-60"><Pencil className="h-3.5 w-3.5" /> Edit</button><button type="button" onClick={() => void deleteClass(item)} disabled={isSaving} title={`Hapus ${item.name}`} className="inline-flex items-center gap-1 rounded-lg bg-red-50 px-2.5 py-1.5 text-xs font-medium text-red-600 hover:bg-red-100 disabled:opacity-60"><Trash2 className="h-3.5 w-3.5" /> Hapus</button></div>)}</div>}
        </section>
      </div>
    </AppShell>
  );
}
