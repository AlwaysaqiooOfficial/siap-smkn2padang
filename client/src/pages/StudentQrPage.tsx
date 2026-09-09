import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, Search, Printer, QrCode, AlertCircle, LogOut, Users, LayoutDashboard, Pencil, Trash2 } from "lucide-react";
import { api, getErrorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { ApiResponse, StudentSummary } from "../types";

interface QrData {
  studentId: string;
  fullName: string;
  qrToken: string;
  qrImage: string;
}

export default function StudentQrPage() {
  const { user, logout } = useAuth();

  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<StudentSummary[]>([]);
  const [isLoadingList, setIsLoadingList] = useState(true);
  const [listError, setListError] = useState<string | null>(null);

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [qrData, setQrData] = useState<QrData | null>(null);
  const [isLoadingQr, setIsLoadingQr] = useState(false);
  const [qrError, setQrError] = useState<string | null>(null);
  const [studentToDelete, setStudentToDelete] = useState<StudentSummary | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  useEffect(() => {
    const t = setTimeout(() => fetchStudents(search), 350);
    return () => clearTimeout(t);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [search]);

  async function fetchStudents(q: string) {
    setIsLoadingList(true);
    setListError(null);
    try {
      const res = await api.get<ApiResponse<StudentSummary[]>>("/students", {
        params: { search: q || undefined, limit: 20 },
      });
      setStudents(res.data.data);
    } catch (err) {
      setListError(getErrorMessage(err));
    } finally {
      setIsLoadingList(false);
    }
  }

  async function handleSelect(id: string) {
    setSelectedId(id);
    setQrData(null);
    setQrError(null);
    setIsLoadingQr(true);
    try {
      const res = await api.get<ApiResponse<QrData>>(`/students/${id}/qr`);
      setQrData(res.data.data);
    } catch (err) {
      setQrError(getErrorMessage(err));
    } finally {
      setIsLoadingQr(false);
    }
  }

  async function handleDelete() {
    if (!studentToDelete) return;
    setIsDeleting(true);
    try {
      await api.delete(`/students/${studentToDelete.id}`);
      await fetchStudents(search);
      setSelectedId(null);
      setQrData(null);
      setStudentToDelete(null);
    } catch (err) {
      setListError(getErrorMessage(err));
    } finally {
      setIsDeleting(false);
    }
  }

  function handlePrint() {
    window.print();
  }

  return (
    <div className="min-h-screen bg-slate-50">
      <header className="flex items-center justify-between border-b bg-white px-4 py-3 print:hidden">
        <div className="flex items-center gap-2">
          <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-brand-600 text-white">
            <QrCode className="h-5 w-5" />
          </div>
          <div>
            <p className="text-sm font-semibold leading-none text-slate-800">QR Code Siswa</p>
            <p className="text-xs text-slate-400">{user?.fullName} · {user?.role}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          {user && (
            <Link
              to={user.role === "SUPER_ADMIN" ? "/dashboard/admin" : "/dashboard/guru"}
              className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              <LayoutDashboard className="h-3.5 w-3.5" />
              Dashboard
            </Link>
          )}
          {user?.role === "SUPER_ADMIN" && (
            <Link
              to="/students/add"
              className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
            >
              <QrCode className="h-3.5 w-3.5" />
              Tambah Siswa
            </Link>
          )}
          <button
            onClick={logout}
            className="flex items-center gap-1 rounded-lg bg-slate-100 px-3 py-1.5 text-xs font-medium text-slate-600 hover:bg-slate-200"
          >
            <LogOut className="h-3.5 w-3.5" />
            Keluar
          </button>
        </div>
      </header>

      <main className="mx-auto grid max-w-4xl grid-cols-1 gap-4 p-4 md:grid-cols-2 print:block">
        {/* Daftar siswa */}
        <section className="rounded-xl border bg-white p-4 print:hidden">
          <div className="mb-3 flex items-center gap-2">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama / NIS / NISN..."
              className="w-full rounded-lg border border-slate-200 px-3 py-2 text-sm outline-none focus:border-brand-500"
            />
          </div>

          {isLoadingList && (
            <div className="flex items-center gap-2 py-6 text-sm text-slate-400">
              <Loader2 className="h-4 w-4 animate-spin" /> Memuat siswa...
            </div>
          )}

          {listError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" /> {listError}
            </div>
          )}

          {!isLoadingList && !listError && students.length === 0 && (
            <div className="flex flex-col items-center gap-2 py-8 text-center text-sm text-slate-400">
              <Users className="h-8 w-8" />
              Tidak ada siswa ditemukan.
            </div>
          )}

          <ul className="max-h-[28rem] divide-y overflow-y-auto">
            {students.map((s) => (
              <li key={s.id}>
                <div className="flex items-center gap-2 px-2 py-2.5 transition hover:bg-slate-50">
                  <button
                    onClick={() => handleSelect(s.id)}
                    className={`flex min-w-0 flex-1 flex-col items-start text-left ${
                      selectedId === s.id ? "text-brand-700" : ""
                    }`}
                  >
                    <span className="truncate text-sm font-medium text-slate-800">{s.fullName}</span>
                    <span className="text-xs text-slate-400">
                      {s.nis} · {s.class.name} · {s.major.code}
                    </span>
                  </button>
                  {(user?.role === "SUPER_ADMIN" || user?.role === "GURU") && (
                    <Link
                      to={`/students/add?edit=${s.id}`}
                      aria-label={`Edit data ${s.fullName}`}
                      title="Edit data siswa"
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-slate-400 hover:bg-brand-50 hover:text-brand-600"
                    >
                      <Pencil className="h-4 w-4" />
                    </Link>
                  )}
                  {(user?.role === "SUPER_ADMIN" || user?.role === "GURU") && (
                    <button
                      type="button"
                      onClick={() => setStudentToDelete(s)}
                      aria-label={`Hapus ${s.fullName}`}
                      title="Hapus permanen siswa"
                      className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg text-red-400 hover:bg-red-50 hover:text-red-600"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  )}
                </div>
              </li>
            ))}
          </ul>
        </section>

        {/* Preview QR */}
        <section className="rounded-xl border bg-white p-6 print:border-none print:shadow-none">
          {!selectedId && (
            <div className="flex h-full min-h-[20rem] flex-col items-center justify-center gap-2 text-center text-sm text-slate-400 print:hidden">
              <QrCode className="h-10 w-10" />
              Pilih siswa untuk menampilkan QR Code
            </div>
          )}

          {selectedId && isLoadingQr && (
            <div className="flex h-full min-h-[20rem] flex-col items-center justify-center gap-2 text-sm text-slate-400">
              <Loader2 className="h-8 w-8 animate-spin" />
              Membuat QR Code...
            </div>
          )}

          {selectedId && qrError && (
            <div className="flex items-center gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600">
              <AlertCircle className="h-4 w-4" /> {qrError}
            </div>
          )}

          {qrData && !isLoadingQr && (
            <div className="flex flex-col items-center gap-3 text-center">
              <img src={qrData.qrImage} alt={`QR Code ${qrData.fullName}`} className="h-56 w-56" />
              <p className="text-lg font-bold text-slate-800">{qrData.fullName}</p>
              <p className="font-mono text-xs text-slate-400">{qrData.qrToken}</p>
              <button
                onClick={handlePrint}
                className="mt-2 flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 print:hidden"
              >
                <Printer className="h-4 w-4" />
                Cetak
              </button>
            </div>
          )}
        </section>
      </main>

      {studentToDelete && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4"
          role="presentation"
          onMouseDown={(event) => {
            if (event.target === event.currentTarget && !isDeleting) setStudentToDelete(null);
          }}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-2xl"
            role="dialog"
            aria-modal="true"
            aria-labelledby="delete-student-title"
          >
            <div className="mb-4 flex items-start gap-3">
              <div className="flex h-10 w-10 flex-shrink-0 items-center justify-center rounded-full bg-red-100 text-red-600">
                <Trash2 className="h-5 w-5" />
              </div>
              <div>
                <h2 id="delete-student-title" className="text-base font-semibold text-slate-900">
                  Hapus siswa?
                </h2>
                <p className="mt-1 text-sm leading-5 text-slate-500">
                  Data <strong className="font-semibold text-slate-700">{studentToDelete.fullName}</strong>, QR, dan riwayat absensinya akan dihapus permanen.
                </p>
              </div>
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setStudentToDelete(null)}
                disabled={isDeleting}
                className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50"
              >
                Batal
              </button>
              <button
                type="button"
                onClick={() => void handleDelete()}
                disabled={isDeleting}
                className="flex items-center gap-2 rounded-lg bg-red-600 px-4 py-2 text-sm font-semibold text-white hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isDeleting && <Loader2 className="h-4 w-4 animate-spin" />}
                {isDeleting ? "Menghapus..." : "Hapus siswa"}
              </button>
            </div>
          </div>
        </div>
      )}

      {qrData && !isLoadingQr && (
        <section className="qr-print-sheet" aria-hidden="true">
          <div className="qr-print-header">
            <img src="/logo-sekolah.png" alt="" className="qr-print-logo" />
            <div>
              <p className="qr-print-kicker">KARTU IDENTITAS DIGITAL</p>
              <h1>SMK NEGERI 2 PADANG</h1>
              <p>Scan QR untuk mencatat kehadiran siswa</p>
            </div>
            <QrCode className="qr-print-mark" />
          </div>

          <div className="qr-print-body">
            <div className="qr-print-card">
              <div className="qr-print-card-top">
                <span>QR ABSENSI SISWA</span>
                <span>TAHUN AJARAN</span>
              </div>
              <div className="qr-print-code-wrap">
                <img src={qrData.qrImage} alt={`QR Code ${qrData.fullName}`} className="qr-print-code" />
              </div>
              <p className="qr-print-name">{qrData.fullName}</p>
              <p className="qr-print-token">{qrData.qrToken}</p>
            </div>

            <div className="qr-print-details">
              <div>
                <span>STATUS</span>
                <strong>AKTIF</strong>
              </div>
              <div>
                <span>PEMILIK QR</span>
                <strong>{qrData.fullName}</strong>
              </div>
              <div>
                <span>DIGUNAKAN UNTUK</span>
                <strong>ABSENSI HARIAN</strong>
              </div>
            </div>
          </div>

          <footer className="qr-print-footer">
            <span>SIAP SMKN 2 PADANG</span>
            <span>Dokumen resmi sekolah · Simpan kartu ini dengan baik</span>
          </footer>
        </section>
      )}
    </div>
  );
}
