import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Printer } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { StatusBadge } from "../components/StatusBadge";
import { api, getErrorMessage } from "../lib/api";
import type { ApiResponse, AttendanceStatus, SiswaDashboardData } from "../types";

const NAV_ITEMS = [{ to: "/dashboard/siswa", label: "Dashboard" }];

export default function SiswaDashboardPage() {
  const [data, setData] = useState<SiswaDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchData = () => {
      api
        .get<ApiResponse<SiswaDashboardData>>("/dashboard/siswa")
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
    <AppShell title="Dashboard Siswa" navItems={NAV_ITEMS}>
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
        <div className="grid gap-4 md:grid-cols-2">
          {/* Profil + QR */}
          <div className="rounded-xl border bg-white p-5 print:border-none print:shadow-none">
            <p className="text-lg font-bold text-slate-800">{data.profile.fullName}</p>
            <p className="text-sm text-slate-400">
              {data.profile.nis} · {data.profile.nisn}
            </p>
            <p className="mb-4 text-sm text-slate-400">
              {data.profile.className} · {data.profile.majorName}
            </p>

            <div className="flex flex-col items-center gap-3 border-t pt-4">
              <img src={data.qrImage} alt="QR Code Absensi" className="h-48 w-48" />
              <p className="text-xs text-slate-400">Tunjukkan QR ini ke guru untuk absensi</p>
              <button
                onClick={() => window.print()}
                className="flex items-center gap-2 rounded-lg bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700 print:hidden"
              >
                <Printer className="h-4 w-4" />
                Cetak QR
              </button>
            </div>

            <div className="mt-4 flex items-center justify-between rounded-lg bg-slate-50 px-4 py-3 print:hidden">
              <span className="text-sm text-slate-500">Status Hari Ini</span>
              {data.todayStatus === "BELUM ABSEN" ? (
                <span className="text-sm font-medium text-slate-400">Belum Absen</span>
              ) : (
                <StatusBadge status={data.todayStatus as AttendanceStatus} />
              )}
            </div>
          </div>

          {/* Histori */}
          <div className="rounded-xl border bg-white p-5 print:hidden">
            <p className="mb-3 text-sm font-semibold text-slate-700">Histori Absensi (30 Hari Terakhir)</p>
            {data.history.length === 0 ? (
              <p className="text-sm text-slate-400">Belum ada riwayat absensi.</p>
            ) : (
              <div className="max-h-[28rem] overflow-y-auto">
                <table className="w-full text-sm">
                  <thead className="sticky top-0 bg-white">
                    <tr className="border-b text-left text-xs uppercase text-slate-400">
                      <th className="py-2 pr-4">Tanggal</th>
                      <th className="py-2 pr-4">Jam</th>
                      <th className="py-2">Status</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y">
                    {data.history.map((h, idx) => (
                      <tr key={idx}>
                        <td className="py-2 pr-4 text-slate-500">{h.date}</td>
                        <td className="py-2 pr-4 text-slate-500">{h.checkInTime}</td>
                        <td className="py-2">
                          <StatusBadge status={h.status as AttendanceStatus} />
                        </td>
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
