import { describe, expect, it } from "vitest";
import { customReportSchema, dailyReportSchema } from "../report.schema";

describe("dailyReportSchema", () => {
  it("export bersifat opsional dan hanya menerima excel/pdf/csv", () => {
    expect(dailyReportSchema.safeParse({}).success).toBe(true);
    expect(dailyReportSchema.safeParse({ export: "excel" }).success).toBe(true);
    expect(dailyReportSchema.safeParse({ export: "word" }).success).toBe(false);
  });

  it("status hanya menerima salah satu dari enum AttendanceStatus", () => {
    expect(dailyReportSchema.safeParse({ status: "HADIR" }).success).toBe(true);
    expect(dailyReportSchema.safeParse({ status: "TIDAK_VALID" }).success).toBe(false);
  });
});

describe("customReportSchema", () => {
  it("mewajibkan startDate dan endDate", () => {
    expect(customReportSchema.safeParse({}).success).toBe(false);
    expect(
      customReportSchema.safeParse({ startDate: "2026-07-14", endDate: "2026-09-04" }).success
    ).toBe(true);
  });
});
