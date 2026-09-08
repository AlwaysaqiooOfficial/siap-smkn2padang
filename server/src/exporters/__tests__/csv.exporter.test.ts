import { describe, expect, it } from "vitest";
import { generateCsvReport } from "../csv.exporter";
import type { ReportRow } from "../types";

function row(overrides: Partial<ReportRow> = {}): ReportRow {
  return {
    no: 1,
    nis: "24001",
    nisn: "3024000001",
    studentName: "Ahmad Pratama",
    className: "X RPL 1",
    majorCode: "RPL",
    date: "04/09/2026",
    status: "HADIR",
    checkInTime: "06:45",
    ...overrides,
  };
}

describe("generateCsvReport", () => {
  it("menghasilkan buffer dengan BOM UTF-8 di awal", () => {
    const buffer = generateCsvReport([row()]);
    const text = buffer.toString("utf-8");
    expect(text.charCodeAt(0)).toBe(0xfeff);
  });

  it("baris header memuat seluruh kolom yang diharapkan", () => {
    const text = generateCsvReport([]).toString("utf-8");
    expect(text).toContain("No,NIS,NISN,Nama Siswa,Kelas,Jurusan,Tanggal,Status,Jam Scan");
  });

  it("mengapit field yang mengandung koma dengan tanda kutip", () => {
    const text = generateCsvReport([row({ studentName: "Budi, S.Kom" })]).toString("utf-8");
    expect(text).toContain('"Budi, S.Kom"');
  });

  it("meng-escape tanda kutip ganda di dalam field", () => {
    const text = generateCsvReport([row({ studentName: 'Budi "Si Rajin"' })]).toString("utf-8");
    expect(text).toContain('"Budi ""Si Rajin"""');
  });

  it("jumlah baris data sesuai jumlah input", () => {
    const text = generateCsvReport([row(), row({ no: 2 })]).toString("utf-8");
    const lines = text.replace(/^\uFEFF/, "").split("\r\n");
    expect(lines).toHaveLength(3); // 1 header + 2 data
  });
});
