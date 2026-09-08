import type { ReportRow } from "./types";

const HEADERS = ["No", "NIS", "NISN", "Nama Siswa", "Kelas", "Jurusan", "Tanggal", "Status", "Jam Scan"];

function escapeCsvField(value: string | number): string {
  const str = String(value);
  if (str.includes(",") || str.includes('"') || str.includes("\n")) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

/** Generate CSV (UTF-8 dengan BOM agar kolom rapi saat dibuka di Excel). */
export function generateCsvReport(rows: ReportRow[]): Buffer {
  const lines: string[] = [];
  lines.push(HEADERS.map(escapeCsvField).join(","));

  for (const row of rows) {
    lines.push(
      [
        row.no,
        row.nis,
        row.nisn,
        row.studentName,
        row.className,
        row.majorCode,
        row.date,
        row.status,
        row.checkInTime,
      ]
        .map(escapeCsvField)
        .join(",")
    );
  }

  const BOM = "\uFEFF";
  return Buffer.from(BOM + lines.join("\r\n"), "utf-8");
}
