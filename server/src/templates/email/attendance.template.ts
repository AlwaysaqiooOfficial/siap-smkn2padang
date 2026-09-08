import { infoRow, infoTable, renderEmailLayout } from "./layout";

export interface AttendanceEmailParams {
  studentName: string;
  className: string;
  majorName: string;
  status: "HADIR" | "TERLAMBAT";
  checkInTime: Date;
  parentName?: string;
}

const STATUS_META = {
  HADIR: { label: "Hadir", color: "#059669", emoji: "✅" },
  TERLAMBAT: { label: "Terlambat", color: "#d97706", emoji: "⏰" },
};

export function attendanceEmailTemplate(params: AttendanceEmailParams) {
  const meta = STATUS_META[params.status];
  const tanggal = params.checkInTime.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
  const jam = params.checkInTime.toLocaleTimeString("id-ID", {
    hour: "2-digit",
    minute: "2-digit",
  });

  const bodyHtml = `
    <p>Yth. ${params.parentName ?? "Bapak/Ibu Orang Tua/Wali"},</p>
    <p>
      Kami informasikan bahwa ananda telah tercatat <strong>${meta.label.toLowerCase()}</strong>
      di sekolah pada hari ini.
    </p>
    ${infoTable(
      infoRow("Nama Siswa", params.studentName) +
        infoRow("Kelas", `${params.className} (${params.majorName})`) +
        infoRow("Tanggal", tanggal) +
        infoRow("Jam Scan", jam) +
        infoRow("Status", `${meta.emoji} ${meta.label}`)
    )}
    <p>Terima kasih atas perhatian dan kerja samanya.</p>
  `;

  return {
    subject: `[SIAP] ${meta.label} - ${params.studentName} (${tanggal})`,
    html: renderEmailLayout({
      title: `Absensi: ${meta.label}`,
      accentColor: meta.color,
      bodyHtml,
    }),
  };
}
