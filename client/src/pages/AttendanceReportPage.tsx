import { useEffect, useState } from "react";
import { AlertCircle, Download, Loader2, Trophy } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { api, getErrorMessage } from "../lib/api";
import { useAuth } from "../context/AuthContext";
import type { ApiResponse, AttendanceStatus, ClassOption } from "../types";

type Period = "today" | "week" | "month" | "semester";
interface Ranking { rank: number; studentId: string; studentName: string; className: string; total: number }
interface Overview { period: Period; periodLabel: string; counts: Record<AttendanceStatus, number>; totalStudents: number; topLate: Ranking[]; topOnTime: Ranking[]; topAlfa: Ranking[] }

const statuses: AttendanceStatus[] = ["HADIR", "TERLAMBAT", "IZIN", "SAKIT", "ALFA", "DISPENSASI"];

export default function AttendanceReportPage() {
  const { user } = useAuth();
  const [period, setPeriod] = useState<Period>("today");
  const [classId, setClassId] = useState("");
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [data, setData] = useState<Overview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [downloading, setDownloading] = useState<string | null>(null);

  useEffect(() => {
    api.get<ApiResponse<ClassOption[]>>("/classes").then((res) => setClasses(res.data.data)).catch(() => {});
  }, []);

  useEffect(() => {
    setIsLoading(true);
    setError(null);
    api.get<ApiResponse<Overview>>("/reports/overview", { params: { period, classId: classId || undefined } })
      .then((res) => setData(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }, [period, classId]);

  async function downloadReport(format: "csv" | "excel" | "pdf") {
    setDownloading(format);
    setError(null);
    try {
      const params: Record<string, string> = { export: format };
      if (classId) params.classId = classId;
      let path = "/reports/daily";
      if (period === "week") path = "/reports/weekly";
      if (period === "month") path = "/reports/monthly";
      if (period === "semester") path = "/reports/semester";
      const response = await api.get(path, { params, responseType: "blob" });
      const blobUrl = URL.createObjectURL(response.data);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = `laporan-kehadiran-${period}.${format === "excel" ? "xlsx" : format}`;
      document.body.appendChild(link);
      link.click();
      link.remove();
      URL.revokeObjectURL(blobUrl);
    } catch (err) {
      setError(getErrorMessage(err));
    } finally {
      setDownloading(null);
    }
  }

  const ranking = (title: string, items: Ranking[], color: string) => (
    <section className="rounded-xl border bg-white p-4">
      <h2 className="mb-3 flex items-center gap-2 text-sm font-semibold text-slate-700"><Trophy className={`h-4 w-4 ${color}`} /> {title}</h2>
      {items.length === 0 ? <p className="text-sm text-slate-400">Belum ada data.</p> : <ol className="space-y-2">{items.map((item) => <li key={item.studentId} className="flex items-center justify-between border-b pb-2 last:border-0"><span className="flex items-center gap-2 text-sm"><b className="w-5 text-slate-400">{item.rank}.</b><span><span className="font-medium text-slate-700">{item.studentName}</span><span className="block text-xs text-slate-400">{item.className}</span></span></span><b className="text-sm text-slate-600">{item.total}x</b></li>)}</ol>}
    </section>
  );

  return <AppShell title="Laporan Kehadiran" navItems={user?.role === "SUPER_ADMIN" ? [{ to: "/dashboard/admin", label: "Dashboard" }, { to: "/reports/attendance", label: "Laporan" }] : [{ to: "/dashboard/guru", label: "Dashboard" }, { to: "/students/qr", label: "QR Siswa" }, { to: "/reports/attendance", label: "Laporan" }]}>
    <div className="space-y-5">
      <div className="flex flex-wrap items-center gap-3 rounded-xl border bg-white p-4">
        <select value={period} onChange={(e) => setPeriod(e.target.value as Period)} className="rounded-lg border px-3 py-2 text-sm"><option value="today">Hari ini</option><option value="week">1 minggu</option><option value="month">1 bulan</option><option value="semester">1 semester</option></select>
        {user?.role === "SUPER_ADMIN" && <select value={classId} onChange={(e) => setClassId(e.target.value)} className="rounded-lg border px-3 py-2 text-sm"><option value="">Semua kelas</option>{classes.map((kelas) => <option key={kelas.id} value={kelas.id}>{kelas.name}</option>)}</select>}
        {data && <span className="text-sm text-slate-400">{data.periodLabel}</span>}
        <div className="ml-auto flex flex-wrap gap-2">
          {(["csv", "excel", "pdf"] as const).map((format) => (
            <button key={format} type="button" onClick={() => void downloadReport(format)} disabled={Boolean(downloading)} className="flex items-center gap-1 rounded-lg bg-slate-800 px-3 py-2 text-xs font-semibold text-white disabled:opacity-60">
              <Download className="h-3.5 w-3.5" />
              {downloading === format ? "Mengunduh..." : format.toUpperCase()}
            </button>
          ))}
        </div>
      </div>
      {isLoading && <div className="flex justify-center py-16 text-slate-400"><Loader2 className="h-5 w-5 animate-spin" /></div>}
      {error && <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600"><AlertCircle className="h-4 w-4" />{error}</div>}
      {data && !isLoading && <>
        <div className="grid grid-cols-2 gap-3 md:grid-cols-6">{statuses.map((status) => <div key={status} className="rounded-xl border bg-white p-3 text-center"><p className="text-2xl font-bold text-slate-700">{data.counts[status]}</p><p className="text-[10px] uppercase text-slate-400">{status}</p></div>)}</div>
        <div className="grid gap-4 md:grid-cols-3">{ranking("Paling Sering Terlambat", data.topLate, "text-amber-500")}{ranking("Paling Sering Hadir", data.topOnTime, "text-emerald-500")}{ranking("Alfa Terbanyak", data.topAlfa, "text-red-500")}</div>
      </>}
    </div>
  </AppShell>;
}
