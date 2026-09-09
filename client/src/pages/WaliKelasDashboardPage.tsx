import { useEffect, useState } from "react";
import { Loader2, AlertCircle, Search, Users, Percent } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { StatCard } from "../components/StatCard";
import { StatusBadge } from "../components/StatusBadge";
import { api, getErrorMessage } from "../lib/api";
import type { ApiResponse, AttendanceStatus, WaliKelasDashboardData } from "../types";

const NAV_ITEMS = [
  { to: "/dashboard/wali-kelas", label: "Dashboard" },
  { to: "/students/qr", label: "QR Siswa" },
  { to: "/students/add", label: "Tambah Siswa" },
];

const STATUS_OPTIONS: AttendanceStatus[] = ["HADIR", "TERLAMBAT", "IZIN", "SAKIT", "DISPENSASI", "ALFA"];

export default function WaliKelasDashboardPage() {
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [status, setStatus] = useState("");
  const [search, setSearch] = useState("");

  const [data, setData] = useState<WaliKelasDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const t = setTimeout(fetchData, 300);
    const refreshOnFocus = () => {
      if (document.visibilityState === "visible") fetchData();
    };
    window.addEventListener("focus", refreshOnFocus);
    document.addEventListener("visibilitychange", refreshOnFocus);
    const interval = window.setInterval(fetchData, 5000);
    return () => {
      clearTimeout(t);
      window.clearInterval(interval);
      window.removeEventListener("focus", refreshOnFocus);
      document.removeEventListener("visibilitychange", refreshOnFocus);
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [date, status, search]);

  function fetchData() {
    setIsLoading(true);
    setError(null);
    api
      .get<ApiResponse<WaliKelasDashboardData>>("/dashboard/wali-kelas", {
        params: { date, status: status || undefined, search: search || undefined },
      })
      .then((res) => setData(res.data.data))
      .catch((err) => setError(getErrorMessage(err)))
      .finally(() => setIsLoading(false));
  }

  return (
    <AppShell title="Dashboard Wali Kelas" navItems={NAV_ITEMS}>
      <div className="space-y-6">
        {data && (
          <>
            <div>
              <h2 className="text-lg font-bold text-slate-800">{data.classInfo.name}</h2>
              <p className="text-sm text-slate-400">{data.classInfo.majorName}</p>
            </div>

            <div className="grid grid-cols-2 gap-3 md:grid-cols-4">
              <StatCard label="Jumlah Siswa" value={data.totalStudents} icon={Users} />
              <StatCard
                label="Persentase Hadir"
                value={`${data.attendancePercentage}%`}
                icon={Percent}
                color="text-emerald-600 bg-emerald-50"
              />
              <StatCard label="Hadir" value={data.counts.HADIR} icon={Users} color="text-emerald-600 bg-emerald-50" />
              <StatCard label="Alfa" value={data.counts.ALFA} icon={Users} color="text-red-600 bg-red-50" />
            </div>

            <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
              {STATUS_OPTIONS.map((s) => (
                <div key={s} className="rounded-xl border bg-white p-3 text-center">
                  <p className="text-xl font-bold text-slate-700">{data.counts[s]}</p>
                  <p className="text-[10px] font-medium uppercase text-slate-400">{s}</p>
                </div>
              ))}
            </div>
          </>
        )}

        {/* Filter */}
        <div className="flex flex-wrap items-center gap-2 rounded-xl border bg-white p-3">
          <input
            type="date"
            value={date}
            onChange={(e) => setDate(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
          />
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="rounded-lg border border-slate-200 px-3 py-1.5 text-sm outline-none focus:border-brand-500"
          >
            <option value="">Semua status</option>
            {STATUS_OPTIONS.map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <div className="flex flex-1 items-center gap-2 rounded-lg border border-slate-200 px-3 py-1.5">
            <Search className="h-4 w-4 text-slate-400" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Cari nama siswa..."
              className="w-full text-sm outline-none"
            />
          </div>
        </div>

        {isLoading && (
          <div className="flex items-center justify-center gap-2 py-16 text-sm text-slate-400">
            <Loader2 className="h-5 w-5 animate-spin" /> Memuat data...
          </div>
        )}

        {error && (
          <div className="flex items-center gap-2 rounded-lg bg-red-50 px-4 py-3 text-sm text-red-600">
            <AlertCircle className="h-4 w-4" /> {error}
          </div>
        )}

        {data && !isLoading && (
          <div className="overflow-x-auto rounded-xl border bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b bg-slate-50 text-left text-xs uppercase text-slate-400">
                  <th className="px-4 py-2">No</th>
                  <th className="px-4 py-2">NIS</th>
                  <th className="px-4 py-2">Nama</th>
                  <th className="px-4 py-2">Status</th>
                  <th className="px-4 py-2">Jam Scan</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {data.students.map((s) => (
                  <tr key={s.nis}>
                    <td className="px-4 py-2 text-slate-500">{s.no}</td>
                    <td className="px-4 py-2 text-slate-500">{s.nis}</td>
                    <td className="px-4 py-2 font-medium text-slate-700">{s.fullName}</td>
                    <td className="px-4 py-2">
                      {s.status === "BELUM ABSEN" ? (
                        <span className="text-xs text-slate-400">Belum Absen</span>
                      ) : (
                        <StatusBadge status={s.status as AttendanceStatus} />
                      )}
                    </td>
                    <td className="px-4 py-2 text-slate-500">{s.checkInTime}</td>
                  </tr>
                ))}
                {data.students.length === 0 && (
                  <tr>
                    <td colSpan={5} className="px-4 py-8 text-center text-slate-400">
                      Tidak ada siswa yang cocok dengan filter.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AppShell>
  );
}
