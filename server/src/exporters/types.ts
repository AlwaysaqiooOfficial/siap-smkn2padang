export interface ReportRow {
  no: number;
  nis: string;
  nisn: string;
  studentName: string;
  className: string;
  majorCode: string;
  date: string; // sudah diformat "dd/mm/yyyy"
  status: string;
  checkInTime: string; // sudah diformat "HH:mm" atau "-"
}

export interface ReportSummary {
  totalRecords: number;
  byStatus: Record<string, number>;
}

export interface ReportMeta {
  title: string; // "Laporan Absensi"
  periodLabel: string; // "Harian - 4 September 2026"
  generatedAt: Date;
  generatedBy: string; // nama user yang men-generate
  filterLabel: string; // ringkasan filter aktif, mis. "Jurusan: RPL, Kelas: X RPL 1"
}
