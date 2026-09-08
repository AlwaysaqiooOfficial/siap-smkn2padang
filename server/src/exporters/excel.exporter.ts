import ExcelJS from "exceljs";
import type { ReportMeta, ReportRow, ReportSummary } from "./types";

const HEADERS = [
  { header: "No", key: "no", width: 6 },
  { header: "NIS", key: "nis", width: 14 },
  { header: "NISN", key: "nisn", width: 14 },
  { header: "Nama Siswa", key: "studentName", width: 28 },
  { header: "Kelas", key: "className", width: 14 },
  { header: "Jurusan", key: "majorCode", width: 10 },
  { header: "Tanggal", key: "date", width: 14 },
  { header: "Status", key: "status", width: 14 },
  { header: "Jam Scan", key: "checkInTime", width: 12 },
];

const HEADER_FILL: ExcelJS.Fill = {
  type: "pattern",
  pattern: "solid",
  fgColor: { argb: "FF1C5FEF" },
};

const STATUS_COLORS: Record<string, string> = {
  HADIR: "FFDCFCE7",
  TERLAMBAT: "FFFEF3C7",
  IZIN: "FFDBEAFE",
  SAKIT: "FFEDE9FE",
  DISPENSASI: "FFE0F2FE",
  ALFA: "FFFEE2E2",
};

export async function generateExcelReport(
  rows: ReportRow[],
  meta: ReportMeta,
  summary: ReportSummary
): Promise<Buffer> {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = "SIAP SMKN 2 PADANG";
  workbook.created = meta.generatedAt;

  const sheet = workbook.addWorksheet("Laporan Absensi", {
    pageSetup: { orientation: "landscape", fitToPage: true },
  });

  // --- Header dokumen ---
  sheet.mergeCells("A1:I1");
  sheet.getCell("A1").value = "SIAP SMKN 2 PADANG";
  sheet.getCell("A1").font = { bold: true, size: 16, color: { argb: "FF1C5FEF" } };

  sheet.mergeCells("A2:I2");
  sheet.getCell("A2").value = meta.title;
  sheet.getCell("A2").font = { bold: true, size: 12 };

  sheet.mergeCells("A3:I3");
  sheet.getCell("A3").value = meta.periodLabel;
  sheet.getCell("A3").font = { size: 10, color: { argb: "FF64748B" } };

  if (meta.filterLabel) {
    sheet.mergeCells("A4:I4");
    sheet.getCell("A4").value = `Filter: ${meta.filterLabel}`;
    sheet.getCell("A4").font = { size: 10, italic: true, color: { argb: "FF64748B" } };
  }

  sheet.mergeCells("A5:I5");
  sheet.getCell("A5").value =
    `Dibuat oleh: ${meta.generatedBy} pada ${meta.generatedAt.toLocaleString("id-ID")}`;
  sheet.getCell("A5").font = { size: 9, italic: true, color: { argb: "FF94A3B8" } };

  sheet.addRow([]); // baris kosong pemisah (row 6)

  // --- Ringkasan status ---
  const summaryRowIndex = 7;
  sheet.getCell(`A${summaryRowIndex}`).value = "Ringkasan:";
  sheet.getCell(`A${summaryRowIndex}`).font = { bold: true };
  const summaryText = Object.entries(summary.byStatus)
    .map(([status, count]) => `${status}: ${count}`)
    .join("  |  ");
  sheet.mergeCells(`B${summaryRowIndex}:I${summaryRowIndex}`);
  sheet.getCell(`B${summaryRowIndex}`).value = `${summaryText}  |  Total: ${summary.totalRecords}`;

  sheet.addRow([]); // pemisah (row 8)

  // --- Header tabel ---
  const tableHeaderRowIndex = 9;
  const headerRow = sheet.getRow(tableHeaderRowIndex);
  HEADERS.forEach((col, idx) => {
    sheet.getColumn(idx + 1).width = col.width;
    const cell = headerRow.getCell(idx + 1);
    cell.value = col.header;
    cell.font = { bold: true, color: { argb: "FFFFFFFF" } };
    cell.fill = HEADER_FILL;
    cell.alignment = { vertical: "middle", horizontal: "center" };
    cell.border = {
      top: { style: "thin" },
      bottom: { style: "thin" },
      left: { style: "thin" },
      right: { style: "thin" },
    };
  });
  headerRow.commit();

  // --- Data rows ---
  rows.forEach((row) => {
    const dataRow = sheet.addRow([
      row.no,
      row.nis,
      row.nisn,
      row.studentName,
      row.className,
      row.majorCode,
      row.date,
      row.status,
      row.checkInTime,
    ]);
    const statusCell = dataRow.getCell(8);
    const color = STATUS_COLORS[row.status];
    if (color) {
      statusCell.fill = { type: "pattern", pattern: "solid", fgColor: { argb: color } };
    }
    dataRow.eachCell((cell) => {
      cell.border = {
        top: { style: "thin", color: { argb: "FFE2E8F0" } },
        bottom: { style: "thin", color: { argb: "FFE2E8F0" } },
        left: { style: "thin", color: { argb: "FFE2E8F0" } },
        right: { style: "thin", color: { argb: "FFE2E8F0" } },
      };
    });
  });

  sheet.views = [{ state: "frozen", ySplit: tableHeaderRowIndex }];

  const buffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(buffer);
}
