import PDFDocument from "pdfkit";
import type { ReportMeta, ReportRow, ReportSummary } from "./types";

interface Column {
  key: keyof ReportRow;
  label: string;
  width: number;
  align?: "left" | "center" | "right";
}

const COLUMNS: Column[] = [
  { key: "no", label: "No", width: 28, align: "center" },
  { key: "nis", label: "NIS", width: 60 },
  { key: "studentName", label: "Nama Siswa", width: 130 },
  { key: "className", label: "Kelas", width: 65 },
  { key: "majorCode", label: "Jurusan", width: 50, align: "center" },
  { key: "date", label: "Tanggal", width: 65, align: "center" },
  { key: "status", label: "Status", width: 62, align: "center" },
  { key: "checkInTime", label: "Jam Scan", width: 55, align: "center" },
];

const PAGE_MARGIN = 36;
const ROW_HEIGHT = 20;
const ACCENT = "#1c5fef";

const STATUS_COLORS: Record<string, string> = {
  HADIR: "#059669",
  TERLAMBAT: "#d97706",
  IZIN: "#2563eb",
  SAKIT: "#7c3aed",
  DISPENSASI: "#0284c7",
  ALFA: "#dc2626",
};

/** Generate laporan PDF landscape dengan tabel sederhana (pdfkit tidak punya tabel bawaan). */
export function generatePdfReport(
  rows: ReportRow[],
  meta: ReportMeta,
  summary: ReportSummary
): Promise<Buffer> {
  return new Promise((resolve, reject) => {
    try {
      const doc = new PDFDocument({ size: "A4", layout: "landscape", margin: PAGE_MARGIN });
      const chunks: Buffer[] = [];
      doc.on("data", (chunk) => chunks.push(chunk));
      doc.on("end", () => resolve(Buffer.concat(chunks)));
      doc.on("error", reject);

      drawHeader(doc, meta, summary);
      drawTableHeader(doc);

      let rowIndex = 0;
      for (const row of rows) {
        if (doc.y + ROW_HEIGHT > doc.page.height - PAGE_MARGIN) {
          doc.addPage();
          drawTableHeader(doc);
        }
        drawTableRow(doc, row, rowIndex % 2 === 0);
        rowIndex++;
      }

      if (rows.length === 0) {
        doc
          .fontSize(10)
          .fillColor("#94a3b8")
          .text("Tidak ada data absensi pada periode/filter yang dipilih.", PAGE_MARGIN, doc.y + 12);
      }

      doc.end();
    } catch (err) {
      reject(err);
    }
  });
}

function drawHeader(doc: PDFKit.PDFDocument, meta: ReportMeta, summary: ReportSummary) {
  doc.fontSize(16).fillColor(ACCENT).font("Helvetica-Bold").text("SIAP SMKN 2 PADANG");
  doc.fontSize(12).fillColor("#0f172a").font("Helvetica-Bold").text(meta.title);
  doc.fontSize(9).fillColor("#64748b").font("Helvetica").text(meta.periodLabel);
  if (meta.filterLabel) {
    doc.fontSize(9).fillColor("#64748b").text(`Filter: ${meta.filterLabel}`);
  }
  doc
    .fontSize(8)
    .fillColor("#94a3b8")
    .text(`Dibuat oleh: ${meta.generatedBy} pada ${meta.generatedAt.toLocaleString("id-ID")}`);

  doc.moveDown(0.5);
  const summaryText = Object.entries(summary.byStatus)
    .map(([status, count]) => `${status}: ${count}`)
    .join("   |   ");
  doc
    .fontSize(9)
    .fillColor("#0f172a")
    .font("Helvetica-Bold")
    .text(`Ringkasan — ${summaryText}   |   Total: ${summary.totalRecords}`);
  doc.moveDown(0.75);
}

function drawTableHeader(doc: PDFKit.PDFDocument) {
  const y = doc.y;
  let x = PAGE_MARGIN;

  doc.rect(PAGE_MARGIN, y, tableWidth(), ROW_HEIGHT).fill(ACCENT);
  doc.fillColor("#ffffff").font("Helvetica-Bold").fontSize(8);

  for (const col of COLUMNS) {
    doc.text(col.label, x + 4, y + 6, { width: col.width - 8, align: col.align ?? "left" });
    x += col.width;
  }

  doc.y = y + ROW_HEIGHT;
  doc.fillColor("#0f172a").font("Helvetica");
}

function drawTableRow(doc: PDFKit.PDFDocument, row: ReportRow, isEven: boolean) {
  const y = doc.y;
  let x = PAGE_MARGIN;

  if (isEven) {
    doc.rect(PAGE_MARGIN, y, tableWidth(), ROW_HEIGHT).fill("#f8fafc");
  }

  doc.fontSize(8);
  for (const col of COLUMNS) {
    const value = String(row[col.key]);
    const color = col.key === "status" ? STATUS_COLORS[value] ?? "#0f172a" : "#0f172a";
    doc
      .fillColor(color)
      .font(col.key === "status" ? "Helvetica-Bold" : "Helvetica")
      .text(value, x + 4, y + 6, { width: col.width - 8, align: col.align ?? "left" });
    x += col.width;
  }

  doc
    .strokeColor("#e2e8f0")
    .lineWidth(0.5)
    .moveTo(PAGE_MARGIN, y + ROW_HEIGHT)
    .lineTo(PAGE_MARGIN + tableWidth(), y + ROW_HEIGHT)
    .stroke();

  doc.y = y + ROW_HEIGHT;
}

function tableWidth(): number {
  return COLUMNS.reduce((sum, col) => sum + col.width, 0);
}
