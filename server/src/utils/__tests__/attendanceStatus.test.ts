import { describe, expect, it } from "vitest";
import { determineAttendanceStatus } from "../attendanceStatus";
import { timeStringToMinutes } from "../dateTime";

describe("determineAttendanceStatus", () => {
  const lateAfter = timeStringToMinutes("07:30");

  it("mengembalikan TERLAMBAT jika scan tepat pada batas jam (07:30)", () => {
    expect(determineAttendanceStatus(lateAfter, lateAfter)).toBe("TERLAMBAT");
  });

  it("mengembalikan HADIR jika scan 1 menit sebelum batas (07:29)", () => {
    expect(determineAttendanceStatus(lateAfter - 1, lateAfter)).toBe("HADIR");
  });

  it("mengembalikan TERLAMBAT jika scan 1 menit setelah batas (07:31)", () => {
    expect(determineAttendanceStatus(lateAfter + 1, lateAfter)).toBe("TERLAMBAT");
  });

  it("mengembalikan HADIR untuk scan sangat pagi (06:00)", () => {
    expect(determineAttendanceStatus(timeStringToMinutes("06:00"), lateAfter)).toBe("HADIR");
  });

  it("mengembalikan TERLAMBAT untuk scan sore hari (15:30)", () => {
    expect(determineAttendanceStatus(timeStringToMinutes("15:30"), lateAfter)).toBe("TERLAMBAT");
  });

  it("menghormati school_settings custom, bukan hard-coded 10:00", () => {
    const customLateAfter = timeStringToMinutes("08:00");
    expect(determineAttendanceStatus(timeStringToMinutes("08:30"), customLateAfter)).toBe(
      "TERLAMBAT"
    );
    expect(determineAttendanceStatus(timeStringToMinutes("07:59"), customLateAfter)).toBe("HADIR");
  });
});
