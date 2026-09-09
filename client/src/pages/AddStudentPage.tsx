import { useEffect, useState, type FormEvent } from "react";
import { Link, useSearchParams } from "react-router-dom";
import { UserPlus, Loader2, CheckCircle2, AlertCircle, LayoutDashboard } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { api, getErrorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { ApiResponse, ClassOption, MajorOption } from "../types";

const DASHBOARD_BY_ROLE: Record<string, string> = {
  SUPER_ADMIN: "/dashboard/admin",
  WALI_KELAS: "/dashboard/wali-kelas",
  GURU: "/dashboard/guru",
};

const emptyForm = {
  nis: "",
  nisn: "",
  fullName: "",
  gender: "L",
  birthDate: "",
  address: "",
  majorId: "",
  classId: "",
  parentEmail: "",
  parentFullName: "",
  parentPhone: "",
};

interface StudentDetail {
  id: string;
  nis: string;
  nisn: string;
  fullName: string;
  gender: "L" | "P";
  birthDate: string;
  address: string | null;
  major: { id: string } | null;
  class: { id: string } | null;
  parent: { fullName: string; email?: string; phone: string | null; user: { email: string } | null } | null;
}

export default function AddStudentPage() {
  const { user } = useAuth();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get("edit");
  const isEditMode = Boolean(editId);
  const canEdit = user?.role === "SUPER_ADMIN" || user?.role === "GURU";
  const navItems = [
    { to: user ? DASHBOARD_BY_ROLE[user.role] ?? "/" : "/", label: "Dashboard" },
    { to: "/students/add", label: "Tambah Siswa" },
  ];
  if (user?.role === "SUPER_ADMIN" || user?.role === "WALI_KELAS" || user?.role === "GURU") {
    navItems.push({ to: "/students/qr", label: "QR Siswa" });
  }

  const [majors, setMajors] = useState<MajorOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [isLoadingOptions, setIsLoadingOptions] = useState(true);
  const [isLoadingStudent, setIsLoadingStudent] = useState(isEditMode);
  const [optionsError, setOptionsError] = useState<string | null>(null);

  const [form, setForm] = useState(emptyForm);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    Promise.all([
      api.get<ApiResponse<MajorOption[]>>("/majors"),
      api.get<ApiResponse<ClassOption[]>>("/classes"),
    ])
      .then(([majorsRes, classesRes]) => {
        setMajors(majorsRes.data.data);
        setClasses(classesRes.data.data);
      })
      .catch((err) => setOptionsError(getErrorMessage(err)))
      .finally(() => setIsLoadingOptions(false));
  }, []);

  useEffect(() => {
    if (!editId || !canEdit) return;
    api
      .get<ApiResponse<StudentDetail>>(`/students/${editId}`)
      .then((res) => {
        const student = res.data.data;
        setForm({
          nis: student.nis,
          nisn: student.nisn,
          fullName: student.fullName,
          gender: student.gender,
          birthDate: student.birthDate ? student.birthDate.slice(0, 10) : "",
          address: student.address ?? "",
          majorId: student.major?.id ?? "",
          classId: student.class?.id ?? "",
          parentEmail: student.parent?.email ?? student.parent?.user?.email ?? "",
          parentFullName: student.parent?.fullName ?? "",
          parentPhone: student.parent?.phone ?? "",
        });
      })
      .catch((err) => setSubmitError(getErrorMessage(err)))
      .finally(() => setIsLoadingStudent(false));
  }, [editId, canEdit]);

  const filteredClasses = classes.filter((c) => !form.majorId || c.majorId === form.majorId);

  function updateField<K extends keyof typeof emptyForm>(key: K, value: (typeof emptyForm)[K]) {
    setForm((prev) => ({ ...prev, [key]: value }));
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setSubmitError(null);
    setSuccessMessage(null);
    setIsSubmitting(true);

    if (isEditMode && !canEdit) {
      setSubmitError("Anda tidak memiliki izin untuk mengedit siswa ini.");
      setIsSubmitting(false);
      return;
    }

    try {
      const payload = {
        nis: form.nis.trim(),
        nisn: form.nisn.trim(),
        fullName: form.fullName.trim(),
        gender: form.gender,
        birthDate: form.birthDate,
        address: form.address.trim() || undefined,
        majorId: form.majorId,
        classId: form.classId,
        parentEmail: form.parentEmail.trim() || undefined,
        parentFullName: form.parentFullName.trim() || undefined,
        parentPhone: form.parentPhone.trim() || undefined,
      };
      const res = isEditMode
        ? await api.put<ApiResponse<{ fullName: string }>>(`/students/${editId}`, payload)
        : await api.post<ApiResponse<{ fullName: string }>>("/students", payload);
      setSuccessMessage(
        `Siswa "${res.data.data.fullName}" berhasil ${isEditMode ? "diperbarui" : "ditambahkan"}.`
      );
      if (!isEditMode) setForm(emptyForm);
    } catch (err) {
      setSubmitError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <AppShell title={isEditMode ? "Edit Data Siswa" : "Tambah Siswa"} navItems={navItems}>
      <div className="mx-auto max-w-lg">
        <div className="mb-4 flex items-center gap-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-50 text-brand-600">
            <UserPlus className="h-5 w-5" />
          </div>
          <div>
              <p className="font-semibold text-slate-800">
                {isEditMode ? "Perbarui Data Siswa" : "Daftarkan Siswa Baru"}
              </p>
            <p className="text-xs text-slate-400">
              QR code absensi akan dibuat otomatis begitu siswa disimpan.
            </p>
          </div>
        </div>

        {isLoadingOptions && (
          <div className="flex items-center gap-2 py-8 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat data jurusan & kelas...
          </div>
        )}

        {optionsError && (
          <div className="mb-4 flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" /> {optionsError}
          </div>
        )}

        {isLoadingStudent && (
          <div className="flex items-center gap-2 py-8 text-sm text-slate-400">
            <Loader2 className="h-4 w-4 animate-spin" /> Memuat data siswa...
          </div>
        )}

        {!isLoadingOptions && !isLoadingStudent && !optionsError && (
          <form onSubmit={handleSubmit} className="space-y-4 rounded-xl border bg-white p-5">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">NIS</label>
                <input
                  required
                  value={form.nis}
                  onChange={(e) => updateField("nis", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">NISN</label>
                <input
                  required
                  value={form.nisn}
                  onChange={(e) => updateField("nisn", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Nama Lengkap</label>
              <input
                required
                value={form.fullName}
                onChange={(e) => updateField("fullName", e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Jenis Kelamin</label>
                <select
                  value={form.gender}
                  onChange={(e) => updateField("gender", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Tanggal Lahir</label>
                <input
                  required
                  type="date"
                  value={form.birthDate}
                  onChange={(e) => updateField("birthDate", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Jurusan</label>
                <select
                  required
                  value={form.majorId}
                  onChange={(e) => {
                    updateField("majorId", e.target.value);
                    updateField("classId", "");
                  }}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                >
                  <option value="">Pilih jurusan</option>
                  {majors.map((m) => (
                    <option key={m.id} value={m.id}>
                      {m.code} - {m.name}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="mb-1 block text-xs font-medium text-slate-600">Kelas</label>
                <select
                  required
                  value={form.classId}
                  disabled={!form.majorId}
                  onChange={(e) => updateField("classId", e.target.value)}
                  className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500 disabled:bg-slate-50"
                >
                  <option value="">Pilih kelas</option>
                  {filteredClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <div>
              <label className="mb-1 block text-xs font-medium text-slate-600">Alamat (opsional)</label>
              <textarea
                value={form.address}
                onChange={(e) => updateField("address", e.target.value)}
                rows={2}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
              />
            </div>

            <div className="border-t pt-4">
              <p className="mb-3 text-sm font-semibold text-slate-700">Data Orang Tua</p>
              <div className="space-y-3">
                <div>
                  <label className="mb-1 block text-xs font-medium text-slate-600">Gmail Orang Tua</label>
                  <input
                    type="email"
                    value={form.parentEmail}
                    onChange={(e) => updateField("parentEmail", e.target.value)}
                    placeholder="orangtua@gmail.com"
                    className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                  />
                </div>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Nama Orang Tua</label>
                    <input
                      value={form.parentFullName}
                      onChange={(e) => updateField("parentFullName", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                    />
                  </div>
                  <div>
                    <label className="mb-1 block text-xs font-medium text-slate-600">Telepon Orang Tua</label>
                    <input
                      value={form.parentPhone}
                      onChange={(e) => updateField("parentPhone", e.target.value)}
                      className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none focus:border-brand-500"
                    />
                  </div>
                </div>
              </div>
            </div>

            {submitError && (
              <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
                <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
                {submitError}
              </div>
            )}
            {successMessage && (
              <div className="flex items-start gap-2 rounded-lg bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
                <CheckCircle2 className="mt-0.5 h-4 w-4 flex-shrink-0" />
                <span>
                  {successMessage} Lihat & cetak QR-nya di{" "}
                  <Link to="/students/qr" className="font-semibold underline">
                    halaman QR Siswa
                  </Link>{" "}
                  (khusus admin/wali kelas), atau tambahkan siswa lain di bawah.
                </span>
              </div>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? <Loader2 className="h-4 w-4 animate-spin" /> : <UserPlus className="h-4 w-4" />}
              {isSubmitting ? "Menyimpan..." : isEditMode ? "Simpan Perubahan" : "Simpan Siswa"}
            </button>
          </form>
        )}

        {user?.role === "GURU" && (
          <div className="mt-4 flex items-center gap-2 text-xs text-slate-400">
            <LayoutDashboard className="h-3.5 w-3.5" />
            <Link to="/dashboard/guru" className="underline">
              Kembali ke Dashboard
            </Link>
          </div>
        )}
      </div>
    </AppShell>
  );
}
