import type { AttendanceStatus } from "../types";

const STYLES: Record<AttendanceStatus, string> = {
  HADIR: "bg-emerald-100 text-emerald-700 border-emerald-300",
  TERLAMBAT: "bg-amber-100 text-amber-700 border-amber-300",
  IZIN: "bg-blue-100 text-blue-700 border-blue-300",
  SAKIT: "bg-purple-100 text-purple-700 border-purple-300",
  DISPENSASI: "bg-sky-100 text-sky-700 border-sky-300",
  ALFA: "bg-red-100 text-red-700 border-red-300",
};

const LABELS: Record<AttendanceStatus, string> = {
  HADIR: "Hadir",
  TERLAMBAT: "Terlambat",
  IZIN: "Izin",
  SAKIT: "Sakit",
  DISPENSASI: "Dispensasi",
  ALFA: "Alfa",
};

export function StatusBadge({ status }: { status: AttendanceStatus }) {
  return (
    <span
      className={`inline-flex items-center rounded-full border px-3 py-1 text-sm font-semibold ${STYLES[status]}`}
    >
      {LABELS[status]}
    </span>
  );
}
