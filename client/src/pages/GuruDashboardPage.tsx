import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Loader2, AlertCircle, QrCode, ClipboardList, UserPlus } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { StatCard } from "../components/StatCard";
import { api, getErrorMessage } from "../lib/api";
import type { ApiResponse, GuruDashboardData } from "../types";

const NAV_ITEMS = [
  { to: "/dashboard/guru", label: "Dashboard" },
  { to: "/students/qr", label: "QR Siswa" },
  { to: "/students/add", label: "Tambah Siswa" },
  { to: "/reports/attendance", label: "Laporan" },
];

export default function GuruDashboardPage() {
  const [data, setData] = useState<GuruDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchData = () => {
      api
        .get<ApiResponse<GuruDashboardData>>("/dashboard/guru")
        .then((res) => mounted && setData(res.data.data))
        .catch((err) => mounted && setError(getErrorMessage(err)))
        .finally(() => mounted && setIsLoading(false));
    };
    const refreshOnFocus = () => {
      if (document.visibilityState === "visible") fetchData();
    };
    fetchData();
    const interval = window.setInterval(fetchData, 5000);
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnFocus);
    return () => {
      mounted = false;
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
  }, []);

  return (
    <AppShell title="Dashboard Guru" navItems={NAV_ITEMS}>
      {isLoading && (
        <div className="flex items-center justify-center gap-2 py-24 text-sm text-slate-400">
          <Loader2 className="h-5 w-5 animate-spin" /> Memuat dashboard...
        </div>
      )}

      {error && (
        <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
          <AlertCircle className="h-4 w-4" /> {error}
        </div>
      )}

      {data && (
        <div className="space-y-6">
          <div>
            <h2 className="text-lg font-bold text-slate-800">Halo, {data.teacherName}</h2>
            <p className="text-sm text-slate-400">Ringkasan aktivitas Anda hari ini.</p>
          </div>

          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <StatCard
              label="Total Laporan Pelanggaran"
              value={data.totalViolationsReported}
              icon={ClipboardList}
              color="text-amber-600 bg-amber-50"
            />
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <Link
              to="/students/qr"
              className="flex items-center gap-3 rounded-xl border bg-white p-4 transition hover:border-brand-300 hover:bg-brand-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
                <QrCode className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">QR Siswa</p>
                <p className="text-xs text-slate-400">Lihat dan cetak QR siswa</p>
              </div>
            </Link>
            <Link
              to="/students/add"
              className="flex items-center gap-3 rounded-xl border bg-white p-4 transition hover:border-brand-300 hover:bg-brand-50"
            >
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-emerald-600 text-white">
                <UserPlus className="h-5 w-5" />
              </div>
              <div>
                <p className="text-sm font-semibold text-slate-800">Tambah Siswa</p>
                <p className="text-xs text-slate-400">Daftarkan siswa baru</p>
              </div>
            </Link>
          </div>

          <div className="rounded-xl border bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-slate-700">
              Laporan Pelanggaran Terbaru yang Anda Buat
            </p>
            {data.recentViolations.length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada laporan pelanggaran.</p>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b text-left text-xs uppercase text-slate-400">
                      <th className="py-2 pr-4">Tanggal</th>
                      <th className="py-2 pr-4">Siswa</th>
                      <th className="py-2 pr-4">Kelas</th>
                      <th className="py-2 pr-4">Kategori</th>
                      <th className="py-2 pr-4">Poin</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.recentViolations.map((v) => (
                      <tr key={v.id}>
                        <td className="py-2 pr-4 text-slate-500">{v.date}</td>
                        <td className="py-2 pr-4 font-medium text-slate-700">{v.studentName}</td>
                        <td className="py-2 pr-4 text-slate-500">{v.className}</td>
                        <td className="py-2 pr-4 text-slate-500">{v.categoryName}</td>
                        <td className="py-2 pr-4 text-slate-500">{v.points}</td>
                        <td className="py-2 text-slate-500">{v.status}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </AppShell>
  );
}
