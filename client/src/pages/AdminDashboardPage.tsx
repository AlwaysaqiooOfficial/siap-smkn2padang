import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  CartesianGrid,
  Legend,
} from "recharts";
import { Users, GraduationCap, School, Loader2, AlertCircle, TrendingDown, Clock, ScanLine } from "lucide-react";
import { AppShell } from "../components/AppShell";
import { StatCard } from "../components/StatCard";
import { api, getErrorMessage } from "../lib/api";
import type { AdminDashboardData, ApiResponse } from "../types";

const NAV_ITEMS = [
  { to: "/dashboard/admin", label: "Dashboard" },
  { to: "/scan", label: "Scan QR" },
  { to: "/management/teachers", label: "Guru & Wali Kelas" },
  { to: "/reports/attendance", label: "Laporan" },
  { to: "/students/qr", label: "QR Siswa" },
  { to: "/students/add", label: "Tambah Siswa" },
];

const STATUS_COLORS: Record<string, string> = {
  HADIR: "#059669",
  TERLAMBAT: "#d97706",
  IZIN: "#2563eb",
  SAKIT: "#7c3aed",
  DISPENSASI: "#0284c7",
  ALFA: "#dc2626",
};

export default function AdminDashboardPage() {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let mounted = true;
    const fetchData = () => {
      api
        .get<ApiResponse<AdminDashboardData>>("/dashboard/admin")
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
    <AppShell title="Dashboard Admin" navItems={NAV_ITEMS}>
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
          {/* Stat cards */}
          <div className="grid grid-cols-2 gap-3 md:grid-cols-3">
            <StatCard label="Total Siswa" value={data.totals.totalStudents} icon={Users} />
            <StatCard label="Total Guru" value={data.totals.totalTeachers} icon={GraduationCap} />
            <StatCard label="Total Kelas" value={data.totals.totalClasses} icon={School} />
          </div>

          <Link
            to="/scan"
            className="flex items-center gap-3 rounded-xl border bg-white p-4 transition hover:border-brand-300 hover:bg-brand-50"
          >
            <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-brand-600 text-white">
              <ScanLine className="h-5 w-5" />
            </div>
            <div>
              <p className="text-sm font-semibold text-slate-800">Scan QR Absensi</p>
              <p className="text-xs text-slate-400">Scan QR murid atau input token manual</p>
            </div>
          </Link>

          <div className="grid grid-cols-3 gap-3 md:grid-cols-6">
            {(Object.keys(data.todayCounts) as (keyof typeof data.todayCounts)[]).map((status) => (
              <div key={status} className="rounded-xl border bg-white p-3 text-center">
                <p
                  className="text-xl font-bold"
                  style={{ color: STATUS_COLORS[status] }}
                >
                  {data.todayCounts[status]}
                </p>
                <p className="text-[10px] font-medium uppercase text-slate-400">{status}</p>
              </div>
            ))}
          </div>

          {/* Kehadiran per jurusan */}
          <div className="rounded-xl border bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-slate-700">Kehadiran Hari Ini per Jurusan</p>
            <ResponsiveContainer width="100%" height={260}>
              <BarChart data={data.chartsByMajor}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="majorCode" fontSize={12} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Bar dataKey="HADIR" stackId="a" fill={STATUS_COLORS.HADIR} name="Hadir" />
                <Bar dataKey="TERLAMBAT" stackId="a" fill={STATUS_COLORS.TERLAMBAT} name="Terlambat" />
                <Bar dataKey="ALFA" stackId="a" fill={STATUS_COLORS.ALFA} name="Alfa" />
              </BarChart>
            </ResponsiveContainer>
          </div>

          {/* Trend 14 hari */}
          <div className="rounded-xl border bg-white p-4">
            <p className="mb-3 text-sm font-semibold text-slate-700">Trend Kehadiran (14 Hari Terakhir)</p>
            <ResponsiveContainer width="100%" height={260}>
              <LineChart data={data.trend}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} />
                <XAxis dataKey="date" fontSize={11} tickFormatter={(d) => d.slice(5)} />
                <YAxis fontSize={12} allowDecimals={false} />
                <Tooltip />
                <Legend />
                <Line type="monotone" dataKey="HADIR" stroke={STATUS_COLORS.HADIR} name="Hadir" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="TERLAMBAT" stroke={STATUS_COLORS.TERLAMBAT} name="Terlambat" strokeWidth={2} dot={false} />
                <Line type="monotone" dataKey="ALFA" stroke={STATUS_COLORS.ALFA} name="Alfa" strokeWidth={2} dot={false} />
              </LineChart>
            </ResponsiveContainer>
          </div>

          {/* Top alfa & terlambat */}
          <div className="grid gap-4 md:grid-cols-2">
            <div className="rounded-xl border bg-white p-4">
              <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <TrendingDown className="h-4 w-4 text-red-500" />
                Siswa dengan Alfa Terbanyak
              </p>
              {data.topAlfa.length === 0 ? (
                <p className="text-sm text-slate-400">Belum ada data.</p>
              ) : (
                <ul className="divide-y">
                  {data.topAlfa.map((s) => (
                    <li key={s.studentId} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-slate-700">
                        {s.studentName}{" "}
                        <span className="text-xs text-slate-400">({s.className})</span>
                      </span>
                      <span className="font-semibold text-red-600">{s.count}x</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <div className="rounded-xl border bg-white p-4">
              <p className="mb-3 flex items-center gap-1.5 text-sm font-semibold text-slate-700">
                <Clock className="h-4 w-4 text-amber-500" />
                Siswa dengan Keterlambatan Terbanyak
              </p>
              {data.topTerlambat.length === 0 ? (
                <p className="text-sm text-slate-400">Belum ada data.</p>
              ) : (
                <ul className="divide-y">
                  {data.topTerlambat.map((s) => (
                    <li key={s.studentId} className="flex items-center justify-between py-2 text-sm">
                      <span className="text-slate-700">
                        {s.studentName}{" "}
                        <span className="text-xs text-slate-400">({s.className})</span>
                      </span>
                      <span className="font-semibold text-amber-600">{s.count}x</span>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </div>
      )}
    </AppShell>
  );
}
