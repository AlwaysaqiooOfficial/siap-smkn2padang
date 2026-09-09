import { useState, type FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { LogIn, Loader2, AlertCircle, ScanLine, CheckCircle2, ArrowLeft } from "lucide-react";
import { useAuth, getErrorMessage } from "../context/AuthContext";

export default function LoginPage() {
  const { login } = useAuth();
  const navigate = useNavigate();
  const [identifier, setIdentifier] = useState("");
  const [password, setPassword] = useState("");
  const [teacherName, setTeacherName] = useState("");
  const [requiresTeacherName, setRequiresTeacherName] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      const result = await login(identifier, password, requiresTeacherName ? teacherName : undefined);
      if (result.requiresTeacherName) {
        setRequiresTeacherName(true);
        return;
      }
      setSuccess(`Login berhasil. Selamat datang, ${result.user?.fullName ?? "pengguna"}`);
      window.setTimeout(() => navigate("/", { replace: true }), 900);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-brand-950 via-brand-800 to-brand-600 px-4">
      <div className="w-full max-w-sm rounded-2xl bg-white p-8 shadow-2xl">
        <div className="mb-6 flex flex-col items-center gap-2">
          <img
            src="/logo-jurusan.png"
            alt="Logo Jurusan"
            className="aspect-square h-32 w-32 rounded-full bg-white object-contain p-0.5"
          />
          <h1 className="text-center text-xl font-bold text-slate-900">SIAP SMKN 2 PADANG</h1>
          <p className="text-center text-sm text-slate-500">
            Sistem Informasi Absensi & Pemantauan Siswa
          </p>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!requiresTeacherName && <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">
              Email / Username
            </label>
            <input
              type="text"
              required
              value={identifier}
              onChange={(e) => setIdentifier(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              placeholder="guru.budi"
              autoComplete="username"
            />
          </div>}
          {!requiresTeacherName && <div>
            <label className="mb-1 block text-sm font-medium text-slate-700">Password</label>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
              placeholder="••••••••"
              autoComplete="current-password"
            />
          </div>}

          {requiresTeacherName && (
            <div>
              <button
                type="button"
                onClick={() => {
                  setRequiresTeacherName(false);
                  setTeacherName("");
                  setError(null);
                }}
                className="mb-3 flex items-center gap-1 text-xs text-slate-500 hover:text-brand-600"
              >
                <ArrowLeft className="h-3.5 w-3.5" /> Kembali
              </button>
              <label className="mb-1 block text-sm font-medium text-slate-700">Nama Guru</label>
              <input
                type="text"
                required
                autoFocus
                value={teacherName}
                onChange={(e) => setTeacherName(e.target.value)}
                className="w-full rounded-lg border border-slate-300 px-3 py-2 text-sm outline-none transition focus:border-brand-500 focus:ring-2 focus:ring-brand-100"
                placeholder="Contoh: Budi Santoso, S.Kom"
              />
              <p className="mt-1 text-xs text-slate-400">Masukkan nama sesuai data guru di sistem.</p>
            </div>
          )}

          {error && (
            <div className="flex items-start gap-2 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-700">
              <AlertCircle className="mt-0.5 h-4 w-4 flex-shrink-0" />
              <span>{error}</span>
            </div>
          )}

          <button
            type="submit"
            disabled={isSubmitting}
            className="flex w-full items-center justify-center gap-2 rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-brand-700 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {isSubmitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <LogIn className="h-4 w-4" />
            )}
            {isSubmitting ? "Memproses..." : requiresTeacherName ? "Lanjutkan ke Akun Guru" : "Masuk"}
          </button>
        </form>
      </div>
      {success && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-950/50 px-4">
          <div className="w-full max-w-sm rounded-2xl bg-white p-6 text-center shadow-2xl">
            <CheckCircle2 className="mx-auto mb-3 h-14 w-14 text-emerald-500" />
            <p className="text-lg font-bold text-slate-800">{success}</p>
            <p className="mt-1 text-sm text-slate-500">Membuka dashboard Anda...</p>
          </div>
        </div>
      )}
    </div>
  );
}
