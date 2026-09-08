import { infoRow, infoTable, renderEmailLayout } from "./layout";

export interface ViolationEmailParams {
  studentName: string;
  className: string;
  majorName: string;
  categoryName: string;
  points: number;
  date: Date;
  description?: string;
  parentName?: string;
}

export function violationEmailTemplate(params: ViolationEmailParams) {
  const tanggal = params.date.toLocaleDateString("id-ID", {
    weekday: "long",
    day: "numeric",
    month: "long",
    year: "numeric",
  });

  const bodyHtml = `
    <p>Yth. ${params.parentName ?? "Bapak/Ibu Orang Tua/Wali"},</p>
    <p>
      Kami informasikan bahwa ananda tercatat melakukan pelanggaran tata tertib sekolah
      sebagai berikut.
    </p>
    ${infoTable(
      infoRow("Nama Siswa", params.studentName) +
        infoRow("Kelas", `${params.className} (${params.majorName})`) +
        infoRow("Tanggal", tanggal) +
        infoRow("Jenis Pelanggaran", params.categoryName) +
        infoRow("Poin", `${params.points} poin`) +
        (params.description ? infoRow("Keterangan", params.description) : "")
    )}
    <p>
      Mohon perhatian dan bimbingan dari Bapak/Ibu di rumah agar hal ini tidak terulang.
      Wali kelas dapat dihubungi untuk informasi lebih lanjut.
    </p>
  `;

  return {
    subject: `[SIAP] Pelanggaran - ${params.studentName} (${tanggal})`,
    html: renderEmailLayout({
      title: "Catatan Pelanggaran Siswa",
      accentColor: "#b45309",
      bodyHtml,
    }),
  };
}
