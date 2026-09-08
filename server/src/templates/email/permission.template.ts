import { infoRow, infoTable, renderEmailLayout } from "./layout";

export interface PermissionApprovedEmailParams {
  studentName: string;
  className: string;
  majorName: string;
  type: "IZIN" | "SAKIT";
  date: Date;
  reason: string;
  parentName?: string;
}

const TYPE_META = {
  IZIN: { label: "Izin", color: "#2563eb", emoji: "📄" },
  SAKIT: { label: "Sakit", color: "#7c3aed", emoji: "🤒" },
};

export function permissionApprovedEmailTemplate(params: PermissionApprovedEmailParams) {
  const meta = TYPE_META[params.type];
  const tanggal = params.date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const bodyHtml = `
    <p>Yth. ${params.parentName ?? "Bapak/Ibu Orang Tua/Wali"},</p>
    <p>
      Kami informasikan bahwa pengajuan <strong>${meta.label.toLowerCase()}</strong> untuk
      ananda telah <strong>disetujui</strong> oleh wali kelas.
    </p>
    ${infoTable(
      infoRow("Nama Siswa", params.studentName) +
        infoRow("Kelas", `${params.className} (${params.majorName})`) +
        infoRow("Tanggal", tanggal) +
        infoRow("Jenis", `${meta.emoji} ${meta.label}`) +
        infoRow("Keterangan", params.reason)
    )}
    <p>Terima kasih atas informasinya.</p>
  `;

  return {
    subject: `[SIAP] ${meta.label} Disetujui - ${params.studentName} (${tanggal})`,
    html: renderEmailLayout({
      title: `${meta.label} Disetujui`,
      accentColor: meta.color,
      bodyHtml,
    }),
  };
}
