import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Users } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { StatusBadge } from "../components/StatusBadge";
import { api, getErrorMessage } from "../lib/api";
import type { ApiResponse, AttendanceStatus, OrangTuaChildData } from "../types";

const NAV_ITEMS = [{ to: "/dashboard/orang-tua", label: "Dashboard" }];

export default function OrangTuaDashboardPage() {
  const [children, setChildren] = useState<OrangTuaChildData[] | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchData = () => {
      api
        .get<ApiResponse<OrangTuaChildData[]>>("/dashboard/orang-tua")
        .then((res) => mounted && setChildren(res.data.data))
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
    <AppShell title="Dashboard Orang Tua" navItems={NAV_ITEMS}>
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

      {children && children.length === 0 && (
        <div className="flex flex-col items-center gap-2 py-24 text-center text-sm text-slate-400">
          <Users className="h-8 w-8" />
          Belum ada data anak yang terhubung ke akun ini.
        </div>
      )}

      {children && children.length > 0 && (
        <div className="space-y-6">
          {children.map((child) => (
            <div key={child.studentId} className="rounded-xl border bg-white p-5">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <p className="text-lg font-bold text-slate-800">{child.fullName}</p>
                  <p className="text-sm text-slate-400">
                    {child.className} · {child.majorName}
                  </p>
                </div>
                {child.todayStatus === "BELUM ABSEN" ? (
                  <span className="text-sm font-medium text-slate-400">Belum Absen</span>
                ) : (
                  <StatusBadge status={child.todayStatus as AttendanceStatus} />
                )}
              </div>

              <div className="grid gap-4 md:grid-cols-2">
                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
                    Histori Absensi (30 hari)
                  </p>
                  {child.history.length === 0 ? (
                    <p className="text-sm text-slate-400">Belum ada riwayat.</p>
                  ) : (
                    <div className="max-h-64 overflow-y-auto rounded-lg border">
                      <table className="w-full text-sm">
                        <tbody className="divide-y">
                          {child.history.map((h, idx) => (
                            <tr key={idx}>
                              <td className="px-3 py-1.5 text-slate-500">{h.date}</td>
                              <td className="px-3 py-1.5 text-slate-500">{h.checkInTime}</td>
                              <td className="px-3 py-1.5">
                                <StatusBadge status={h.status as AttendanceStatus} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  )}
                </div>

                <div>
                  <p className="mb-2 text-xs font-semibold uppercase text-slate-400">
                    Riwayat Pelanggaran
                  </p>
                  {child.violations.length === 0 ? (
                    <p className="text-sm text-slate-400">Tidak ada pelanggaran tercatat.</p>
                  ) : (
                    <ul className="divide-y rounded-lg border">
                      {child.violations.map((v, idx) => (
                        <li key={idx} className="flex items-center justify-between px-3 py-1.5 text-sm">
                          <span className="text-slate-600">
                            {v.categoryName}{" "}
                            <span className="text-xs text-slate-400">({v.date})</span>
                          </span>
                          <span className="font-semibold text-amber-600">{v.points} pt</span>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </AppShell>
  );
}
