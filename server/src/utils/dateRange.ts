import { AppError } from "../middlewares/error.middleware";
import { serverDateOnly } from "./dateTime";

export interface DateRange {
  startDate: Date;
  endDate: Date; // inklusif
  label: string;
}

function addDays(date: Date, days: number): Date {
  const d = new Date(date);
  d.setUTCDate(d.getUTCDate() + days);
  return d;
}

function formatId(date: Date): string {
  return new Date(Date.UTC(date.getUTCFullYear(), date.getUTCMonth(), date.getUTCDate())).toLocaleDateString("id-ID", { timeZone: "UTC", day: "numeric", month: "long", year: "numeric" });
}

export function resolveDailyRange(dateStr?: string): DateRange {
  const date = serverDateOnly(dateStr ? new Date(dateStr) : new Date());
  return { startDate: date, endDate: date, label: `Harian - ${formatId(date)}` };
}

/** Minggu Senin–Minggu yang memuat `dateStr` (default: minggu berjalan). */
export function resolveWeeklyRange(dateStr?: string): DateRange {
  const ref = serverDateOnly(dateStr ? new Date(dateStr) : new Date());
  const dayOfWeek = ref.getUTCDay(); // 0=Minggu, 1=Senin, ...
  const diffToMonday = dayOfWeek === 0 ? -6 : 1 - dayOfWeek;
  const monday = addDays(ref, diffToMonday);
  const sunday = addDays(monday, 6);
  return {
    startDate: monday,
    endDate: sunday,
    label: `Mingguan - ${formatId(monday)} s/d ${formatId(sunday)}`,
  };
}

export function resolveMonthlyRange(monthStr?: string, yearStr?: string): DateRange {
  const now = new Date();
  const month = monthStr ? Number(monthStr) : now.getMonth() + 1;
  const year = yearStr ? Number(yearStr) : now.getFullYear();

  if (!Number.isInteger(month) || month < 1 || month > 12) {
    throw new AppError("Parameter month harus 1-12", 422);
  }
  if (!Number.isInteger(year) || year < 2000 || year > 2100) {
    throw new AppError("Parameter year tidak valid", 422);
  }

  const startDate = new Date(Date.UTC(year, month - 1, 1));
  const endDate = new Date(Date.UTC(year, month, 0)); // hari terakhir bulan tsb
  const label = `Bulanan - ${startDate.toLocaleDateString("id-ID", { timeZone: "UTC", month: "long", year: "numeric" })}`;
  return { startDate, endDate, label };
}

export function resolveCustomRange(startStr?: string, endStr?: string): DateRange {
  if (!startStr || !endStr) {
    throw new AppError("Parameter startDate dan endDate wajib diisi untuk laporan custom", 422);
  }
  const startDate = serverDateOnly(new Date(startStr));
  const endDate = serverDateOnly(new Date(endStr));

  if (Number.isNaN(startDate.getTime()) || Number.isNaN(endDate.getTime())) {
    throw new AppError("Format startDate/endDate tidak valid", 422);
  }
  if (startDate > endDate) {
    throw new AppError("startDate tidak boleh lebih besar dari endDate", 422);
  }

  return { startDate, endDate, label: `Custom - ${formatId(startDate)} s/d ${formatId(endDate)}` };
}

export function resolveThreeYearRange(): DateRange {
  const endDate = serverDateOnly(new Date());
  const startDate = new Date(Date.UTC(endDate.getUTCFullYear() - 3, endDate.getUTCMonth(), endDate.getUTCDate()));
  return { startDate, endDate, label: "3 Tahun Terakhir" };
}
