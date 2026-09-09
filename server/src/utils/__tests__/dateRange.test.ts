import { describe, expect, it } from "vitest";
import {
  resolveDailyRange,
  resolveWeeklyRange,
  resolveMonthlyRange,
  resolveCustomRange,
} from "../dateRange";

// Dibandingkan lewat getter tanggal LOKAL (bukan toISOString, yang mengonversi ke UTC dan bisa
// bergeser 1 hari tergantung timezone mesin penguji) — konsisten dengan cara aplikasi menyimpan
// tanggal (lihat serverDateOnly di utils/schoolSettings.ts, yang juga memakai getter lokal).
function ymd(date: Date): string {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, "0");
  const d = String(date.getDate()).padStart(2, "0");
  return `${y}-${m}-${d}`;
}

describe("resolveDailyRange", () => {
  it("startDate dan endDate sama dengan tanggal yang diberikan", () => {
    const range = resolveDailyRange("2026-09-04");
    expect(ymd(range.startDate)).toBe("2026-09-04");
    expect(ymd(range.endDate)).toBe("2026-09-04");
  });
});

describe("resolveWeeklyRange", () => {
  it("Rabu (2026-09-02) menghasilkan Senin s/d Minggu minggu yang sama", () => {
    const range = resolveWeeklyRange("2026-09-02"); // Rabu
    expect(range.startDate.getDay()).toBe(1); // Senin
    expect(range.endDate.getDay()).toBe(0); // Minggu
    expect(ymd(range.startDate)).toBe("2026-08-31");
    expect(ymd(range.endDate)).toBe("2026-09-06");
  });

  it("hari Minggu tetap masuk ke minggu yang sama (bukan minggu berikutnya)", () => {
    const range = resolveWeeklyRange("2026-09-06"); // Minggu
    expect(ymd(range.startDate)).toBe("2026-08-31");
    expect(ymd(range.endDate)).toBe("2026-09-06");
  });
});

describe("resolveMonthlyRange", () => {
  it("Februari 2028 (kabisat) berakhir tanggal 29", () => {
    const range = resolveMonthlyRange("2", "2028");
    expect(range.startDate.getDate()).toBe(1);
    expect(range.endDate.getDate()).toBe(29);
  });

  it("Februari 2026 (bukan kabisat) berakhir tanggal 28", () => {
    const range = resolveMonthlyRange("2", "2026");
    expect(range.endDate.getDate()).toBe(28);
  });

  it("menolak bulan di luar 1-12", () => {
    expect(() => resolveMonthlyRange("13", "2026")).toThrow();
    expect(() => resolveMonthlyRange("0", "2026")).toThrow();
  });
});

describe("resolveCustomRange", () => {
  it("menerima rentang valid", () => {
    const range = resolveCustomRange("2026-07-14", "2026-09-04");
    expect(ymd(range.startDate)).toBe("2026-07-14");
    expect(ymd(range.endDate)).toBe("2026-09-04");
  });

  it("menolak jika startDate > endDate", () => {
    expect(() => resolveCustomRange("2026-09-04", "2026-07-14")).toThrow();
  });

  it("menolak jika salah satu parameter kosong", () => {
    expect(() => resolveCustomRange(undefined, "2026-09-04")).toThrow();
    expect(() => resolveCustomRange("2026-07-14", undefined)).toThrow();
  });
});
