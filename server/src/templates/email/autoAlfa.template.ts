import { infoRow, infoTable, renderEmailLayout } from "./layout";

export interface AutoAlfaEmailParams {
  studentName: string;
  className: string;
  majorName: string;
  date: Date;
  parentName?: string;
}

export function autoAlfaEmailTemplate(params: AutoAlfaEmailParams) {
  const tanggal = params.date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const bodyHtml = `
    <p>Yth. ${params.parentName ?? "Bapak/Ibu Orang Tua/Wali"},</p>
    <p>
      Kami informasikan bahwa ananda <strong>tidak tercatat hadir (ALFA)</strong> di sekolah
      pada tanggal berikut, karena sistem tidak menerima data absensi maupun pengajuan
      izin/sakit/dispensasi yang disetujui hingga batas waktu yang ditentukan.
    </p>
    ${infoTable(
      infoRow("Nama Siswa", params.studentName) +
        infoRow("Kelas", `${params.className} (${params.majorName})`) +
        infoRow("Tanggal", tanggal) +
        infoRow("Status", "❌ Alfa")
    )}
    <p>
      Apabila ananda sebenarnya berhalangan hadir dengan alasan yang sah (izin/sakit/dispensasi),
      mohon segera menghubungi wali kelas untuk konfirmasi lebih lanjut.
    </p>
  `;

  return {
    subject: `[SIAP] Alfa - ${params.studentName} (${tanggal})`,
    html: renderEmailLayout({
      title: "Informasi Kehadiran: Alfa",
      accentColor: "#dc2626",
      bodyHtml,
    }),
  };
}
